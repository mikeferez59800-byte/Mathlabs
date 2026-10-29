/*
 * Multiplication World Championship: pure rules shared by the server (Pages Functions) and the tests.
 * No I/O here. Everything that decides a score lives in this file so it can be tested in isolation.
 */

import COUNTRY_LIST from './countries.js';

// ---------- official rules (identical for every player) ----------
export const RULES = Object.freeze({
  durationMs: 60000,        // exactly 60 seconds of play
  countdownMs: 3000,        // 3-2-1 before the clock starts (server-defined, not part of the 60 s)
  graceMs: 10000,           // late batches accepted until end + grace (slow connections), answers after 60 s never count
  window: 12,               // questions revealed ahead of the current one (no stall on slow connections)
  maxEventsPerBatch: 40,
  minFactor: 2,
  maxFactor: 12,
  revealAfterWrong: 2,      // after 2 wrong tries the answer is shown and must be typed (0 points)
  futureToleranceMs: 2500,  // an answer cannot be claimed earlier than the server could have delivered it
  impossibleGapMs: 120,     // two answers less than 120 ms apart: not humanly possible -> score rejected
  maxScore: 110,            // above this the score is rejected as impossible
  reviewScore: 70,          // at or above this the score waits for a moderator before appearing
  reviewAvgGapMs: 650,      // average time per correct answer below this -> review
  reviewFastGaps: 6,        // more than this many answers under 300 ms -> review
  fastGapMs: 300,
  maxAnswer: 999
});

export const TIE_BREAK = 'Higher score first; then fewer errors; then the score that was achieved first (UTC).';

// ---------- months (UTC) ----------
export function monthKey(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function monthStart(key) {
  const [y, m] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, 1);
}
export function monthEnd(key) {
  const [y, m] = key.split('-').map(Number);
  return Date.UTC(y, m, 1); // exclusive
}
export function prevMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
// First official month (UTC). Before it, only practice is open. Overridable with the CHAMPIONSHIP_FIRST_MONTH variable.
export const FIRST_MONTH = '2026-12';
export const isMonthKey = (s) => typeof s === 'string' && /^20\d\d-(0[1-9]|1[0-2])$/.test(s);
// A month is closed once every game that started in it has certainly ended.
export const CLOSE_DELAY_MS = RULES.countdownMs + RULES.durationMs + RULES.graceMs + 60000;

// ---------- deterministic question deck ----------
// sfc32 PRNG seeded from a 128-bit hex string. The seed never leaves the server.
function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
function rngFromSeed(hex, salt) {
  const words = [];
  for (let i = 0; i < 4; i++) words.push(parseInt(hex.slice(i * 8, i * 8 + 8), 16) ^ Math.imul(salt + 1, 0x9E3779B1 + i));
  const r = sfc32(words[0], words[1], words[2], words[3]);
  for (let i = 0; i < 12; i++) r(); // warm up
  return r;
}

export const FACTS = (() => {
  const out = [];
  for (let a = RULES.minFactor; a <= RULES.maxFactor; a++) for (let b = RULES.minFactor; b <= RULES.maxFactor; b++) out.push([a, b]);
  return out;
})();

// Balanced distribution: the sequence is made of shuffled decks of all 121 facts (2..12 x 2..12),
// so every fact appears once before any fact repeats, and no fact (or its mirror) follows itself.
export function questionsUpTo(seedHex, count) {
  const out = [];
  for (let deck = 0; out.length < count; deck++) {
    const r = rngFromSeed(seedHex, deck);
    const d = FACTS.slice();
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    // Avoid an immediate repeat across the deck boundary, or a×b right after b×a.
    for (let i = 0; i < d.length; i++) {
      const prev = i === 0 ? out[out.length - 1] : d[i - 1];
      if (prev && sameFact(prev, d[i])) {
        const k = (i + 2) % d.length;
        [d[i], d[k]] = [d[k], d[i]];
      }
    }
    for (const f of d) { if (out.length >= count) break; out.push(f); }
  }
  return out;
}
const sameFact = (x, y) => (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);

export function questionsWindow(seedHex, from, n) {
  return questionsUpTo(seedHex, from + n).slice(from).map(([a, b], k) => ({ i: from + k, a, b }));
}

// ---------- answer processing ----------
// state: { cursor, attempts, score, errors, lastT, minGap, gapSum, gapCount, fastGaps, flags: [] }
// events: [[questionIndex, value, tMs], ...] in the order the player typed them.
// elapsedMs: server time since the official start when the batch arrived.
// Returns { ok, state, error } — never mutates the input state.
export function applyEvents(seedHex, state, events, elapsedMs) {
  const s = { ...state, flags: [...(state.flags || [])] };
  if (!Array.isArray(events)) return { ok: false, error: 'bad_events', state };
  if (events.length > RULES.maxEventsPerBatch) return { ok: false, error: 'too_many_events', state };
  const need = s.cursor + events.length + 1;
  const qs = questionsUpTo(seedHex, need);
  for (const ev of events) {
    if (!Array.isArray(ev) || ev.length !== 3 || !ev.every(Number.isInteger)) return { ok: false, error: 'bad_event', state };
    const [q, v, t] = ev;
    if (q !== s.cursor) return { ok: false, error: 'order', state };              // answers must follow the question order
    if (v < 0 || v > RULES.maxAnswer) return { ok: false, error: 'bad_value', state };
    if (t < s.lastT) return { ok: false, error: 'time_order', state };            // time never goes backwards
    if (t > elapsedMs + RULES.futureToleranceMs) return { ok: false, error: 'time_future', state };
    if (t > RULES.durationMs) break;                                              // typed after 60 s: does not count
    const gap = t - s.lastT;
    if (gap < RULES.impossibleGapMs && s.answered > 0) s.flags.push('impossible_gap');
    s.lastT = t;
    s.answered = (s.answered || 0) + 1;
    const [a, b] = qs[q];
    if (v === a * b) {
      if (s.attempts < RULES.revealAfterWrong) {
        s.score += 1;
        s.gapSum += gap; s.gapCount += 1;
        if (s.minGap === null || gap < s.minGap) s.minGap = gap;
        if (gap < RULES.fastGapMs) s.fastGaps += 1;
      }
      s.cursor += 1;
      s.attempts = 0;
    } else {
      s.errors += 1;
      s.attempts += 1;
    }
  }
  s.flags = [...new Set(s.flags)];
  return { ok: true, state: s };
}

export function initialState() {
  return { cursor: 0, attempts: 0, score: 0, errors: 0, answered: 0, lastT: 0, minGap: null, gapSum: 0, gapCount: 0, fastGaps: 0, flags: [] };
}

// Plausibility verdict once the game is over: 'valid' (counts immediately), 'review' (a moderator
// must approve it before it appears in a ranking) or 'invalid' (never counts).
export function verdict(state) {
  const flags = [...(state.flags || [])];
  if (flags.includes('impossible_gap') || flags.includes('protocol')) return { status: 'invalid', flags };
  if (state.score > RULES.maxScore) return { status: 'invalid', flags: [...flags, 'impossible_score'] };
  const review = [];
  if (state.score >= RULES.reviewScore) review.push('high_score');
  if (state.gapCount >= 10 && state.gapSum / state.gapCount < RULES.reviewAvgGapMs) review.push('very_fast_average');
  if (state.fastGaps > RULES.reviewFastGaps) review.push('many_fast_answers');
  if (review.length) return { status: 'review', flags: [...flags, ...review] };
  return { status: 'valid', flags };
}

// Ranking order: score desc, errors asc, achieved_at asc. Returns <0 if a ranks before b.
export function compareEntries(a, b) {
  return (b.score - a.score) || (a.errors - b.errors) || (a.achievedAt - b.achievedAt);
}
export const isBetter = (a, b) => !b || compareEntries(a, b) < 0;

// Country team score: average of the 5 best players of the country (missing players count as 0),
// so a country cannot win only by having more participants.
export const TEAM_SIZE = 5;
export function teamScore(scores) {
  const top = [...scores].sort((x, y) => y - x).slice(0, TEAM_SIZE);
  return Math.round((top.reduce((s, x) => s + x, 0) / TEAM_SIZE) * 10) / 10;
}

// ---------- countries (ISO 3166-1 alpha-2) ----------
// "ZZ" = "International / prefer not to say".
export const COUNTRIES = COUNTRY_LIST.COUNTRY_CODES;
const COUNTRY_SET = new Set(COUNTRIES);
export const isCountry = (c) => typeof c === 'string' && COUNTRY_SET.has(c);

// ---------- nicknames ----------
export const NICK_MIN = 3;
export const NICK_MAX = 16;

const ADJ = ['Swift', 'Brave', 'Clever', 'Rapid', 'Bright', 'Lucky', 'Mighty', 'Sunny', 'Cosmic', 'Turbo', 'Happy', 'Silent', 'Golden', 'Quick', 'Witty', 'Jolly', 'Super', 'Nimble', 'Epic', 'Stellar'];
const ANIMALS = ['Otter', 'Falcon', 'Panda', 'Tiger', 'Koala', 'Dolphin', 'Fox', 'Owl', 'Lynx', 'Penguin', 'Gecko', 'Badger', 'Comet', 'Rocket', 'Hawk', 'Bison', 'Narwhal', 'Puffin', 'Lemur', 'Orca'];
export function suggestNickname(rand = Math.random) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  return pick(ADJ) + pick(ANIMALS) + String(10 + Math.floor(rand() * 90));
}

// Canonical form used for uniqueness and for the offensive-word filter.
export function nicknameKey(nick) {
  return nick.normalize('NFKC').toLowerCase();
}
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i' };
function squash(s, collapse) {
  const flat = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[0134578@$!9]/g, (c) => LEET[c] || c)
    .replace(/[\s_\-.]+/g, '');
  return collapse ? flat.replace(/(.)\1+/g, '$1') : flat;
}

// Returns null when the nickname is acceptable, otherwise an error code.
export function checkNickname(raw, blocklist) {
  if (typeof raw !== 'string') return 'nick_invalid';
  const nick = raw.normalize('NFKC').trim();
  const len = [...nick].length;
  if (len < NICK_MIN || len > NICK_MAX) return 'nick_length';
  if (!/^[\p{L}\p{N}_-]+$/u.test(nick)) return 'nick_chars';
  if (/^[\d_-]+$/.test(nick)) return 'nick_chars';
  if ((nick.match(/\d/g) || []).length > 4) return 'nick_digits';       // no phone numbers, birth years, codes
  // One script only (plus digits): stops look-alike tricks such as Cyrillic letters inside a Latin name.
  const scripts = new Set();
  for (const ch of nick) {
    if (/\p{Script=Latin}/u.test(ch)) scripts.add('latin');
    else if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー]/u.test(ch)) scripts.add('ja');
    else if (/\p{L}/u.test(ch)) scripts.add('other:' + (ch.codePointAt(0) >> 8));
  }
  if (scripts.size > 1) return 'nick_mixed';
  const strict = squash(nick, false);
  const loose = squash(nick, true);
  const list = squashed(blocklist);
  if (list.reserved.some((w) => strict.includes(w) || loose.includes(w))) return 'nick_reserved';
  // Repeated letters are collapsed ("fuuuck") only for words long enough not to hit innocent names.
  if (list.contains.some(([st, lo]) => strict.includes(st) || (lo.length >= 4 && loose.includes(lo)))) return 'nick_offensive';
  const letters = strict.replace(/\d+$/, ''), lettersLoose = loose.replace(/\d+$/, '');
  if (list.exact.some(([st, lo]) => letters === st || lettersLoose === lo)) return 'nick_offensive';
  return null;
}
const squashCache = new WeakMap();
function squashed(bl) {
  const both = (w) => [squash(w, false), squash(w, true)];
  if (!squashCache.has(bl)) squashCache.set(bl, { reserved: bl.reserved.map((w) => squash(w, false)), contains: bl.contains.map(both), exact: bl.exact.map(both) });
  return squashCache.get(bl);
}
export const cleanNickname = (raw) => raw.normalize('NFKC').trim();

// ---------- recovery codes ----------
const B32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O, 1/I
export function formatRecoveryCode(bytes) {
  let out = '';
  for (let i = 0; i < 16; i++) out += B32[bytes[i] & 31];
  return out.match(/.{4}/g).join('-');
}
export function normalizeRecoveryCode(s) {
  if (typeof s !== 'string') return '';
  const c = s.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return c.length === 16 ? c.match(/.{4}/g).join('-') : '';
}
