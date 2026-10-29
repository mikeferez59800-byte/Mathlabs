/*
 * Multiplication World Championship API (Cloudflare Pages Functions + D1).
 * Mounted at /api/championship/* by functions/api/championship/[[path]].js.
 *
 * Security model (see docs/CHAMPIONNAT.md):
 * - Official scores are computed here from the answers, never accepted from the browser.
 * - The server creates each game (random 128-bit id and seed), owns the clock, reveals questions a
 *   few at a time, checks every answer in order and rejects replays (sequence numbers).
 * - Players are identified by a random token in an HttpOnly cookie (only its hash is stored),
 *   with a one-time recovery code instead of an e-mail address.
 */
import {
  RULES, CLOSE_DELAY_MS, monthKey, monthStart, monthEnd, isMonthKey, isCountry,
  questionsWindow, applyEvents, initialState, verdict, isBetter,
  checkNickname, cleanNickname, nicknameKey, suggestNickname, formatRecoveryCode, normalizeRecoveryCode, TEAM_SIZE, FIRST_MONTH } from './core.mjs';
import { BLOCKLIST } from './blocklist.mjs';
import { MIGRATIONS, SCHEMA_VERSION } from './schema.mjs';

const COOKIE = '__Host-msl_player';
const DAY = 86400000;
const PAGE_SIZE = 50;
const MAX_PAGES = 20;
const PROFILE_COOLDOWN_MS = 7 * DAY;
export const RETENTION = Object.freeze({
  sessionsDays: 7,          // finished games (seed and running totals)
  scoresDays: 400,          // individual results, except the ones that are someone's best or a medal
  eventsDays: 180,          // anomalies, reports, moderator actions, errors
  tokensDays: 400,          // signed-in devices not used for this long are signed out
  inactivePlayerDays: 730,  // profiles unused for 2 years are anonymised
  rateLimitDays: 2
});

const LIMITS = {
  create: [5, DAY],          // new profiles per network per day
  recover: [10, 3600000],    // recovery-code attempts per network per hour
  start: [40, 3600000],      // official games per player per hour
  report: [10, DAY],         // score reports per network per day
  adminfail: [10, 3600000],  // wrong admin tokens per network per hour
  profile: [20, DAY]         // profile edits per player per day
};

class HttpError extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra || {}; }
}
const fail = (status, code, extra) => { throw new HttpError(status, code, extra); };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers }
  });
}

// ---------- crypto helpers ----------
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomHex = (bytes) => hex(crypto.getRandomValues(new Uint8Array(bytes)));
async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// ---------- schema ----------
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  let version = 0;
  try {
    const row = await db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").first();
    version = row ? Number(row.value) : 0;
  } catch (e) { version = 0; }
  for (const m of MIGRATIONS) {
    if (m.version <= version) continue;
    await db.batch([...m.statements.map((s) => db.prepare(s)),
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)").bind(String(m.version))]);
  }
  schemaReady = true;
}
export function _resetForTests() { schemaReady = false; memCache.clear(); lastMonthCheck = 0; lastMaintenance = 0; saltCache = null; }

// ---------- small cache (memory per isolate + D1, so all isolates share expensive results) ----------
const memCache = new Map();
async function cached(c, key, ttlMs, fn) {
  const m = memCache.get(key);
  if (m && m.exp > c.now) return m.value;
  const row = await c.db.prepare('SELECT value, expires_at FROM api_cache WHERE key = ?').bind(key).first();
  if (row && row.expires_at > c.now) {
    const value = JSON.parse(row.value);
    memCache.set(key, { value, exp: Math.min(row.expires_at, c.now + 10000) });
    return value;
  }
  const value = await fn();
  await c.db.prepare('INSERT OR REPLACE INTO api_cache (key, value, expires_at) VALUES (?, ?, ?)').bind(key, JSON.stringify(value), c.now + ttlMs).run();
  memCache.set(key, { value, exp: c.now + Math.min(ttlMs, 10000) });
  return value;
}
async function dropCache(c, prefix) {
  for (const k of [...memCache.keys()]) if (k.startsWith(prefix)) memCache.delete(k);
  await c.db.prepare('DELETE FROM api_cache WHERE key >= ? AND key < ?').bind(prefix, prefix + '￿').run();
}

// ---------- abuse limits ----------
let saltCache = null;
async function networkKey(c) {
  if (!saltCache) {
    if (c.env.RATE_LIMIT_SALT) saltCache = String(c.env.RATE_LIMIT_SALT);
    else {
      let row = await c.db.prepare("SELECT value FROM meta WHERE key = 'salt'").first();
      if (!row) {
        await c.db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('salt', ?)").bind(randomHex(32)).run();
        row = await c.db.prepare("SELECT value FROM meta WHERE key = 'salt'").first();
      }
      saltCache = row.value;
    }
  }
  const ip = c.request.headers.get('CF-Connecting-IP') || 'unknown';
  // Salted and rotated daily: the same address gives a different key every day, and the raw
  // address is never written anywhere.
  return (await sha256(`${saltCache}|${Math.floor(c.now / DAY)}|${ip}`)).slice(0, 32);
}
async function rateLimit(c, name, who) {
  const [limit, windowMs] = LIMITS[name];
  const win = Math.floor(c.now / windowMs) * windowMs; // start of the current window (ms)
  const row = await c.db.prepare('INSERT INTO rate_limits (key, win, count) VALUES (?, ?, 1) ON CONFLICT (key, win) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(`${name}:${who}`, win).first();
  if (row && row.count > limit) {
    if (row.count === limit + 1) await logEvent(c, 'abuse', null, name, `rate limit reached (${limit} per ${Math.round(windowMs / 60000)} min)`);
    fail(429, 'rate_limited', { retryAfterSec: Math.ceil((win + windowMs - c.now) / 1000) });
  }
}

async function logEvent(c, type, playerId, ref, detail) {
  await c.db.prepare('INSERT INTO moderation_events (type, player_id, ref, detail, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(type, playerId || null, ref || null, String(detail || '').slice(0, 500), c.now).run();
}

// ---------- players ----------
function readCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === COOKIE) return part.slice(i + 1);
  }
  return '';
}
const setCookie = (token) => `${COOKIE}=${token}; Path=/; Max-Age=${400 * 86400}; HttpOnly; Secure; SameSite=Strict`;
const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

async function currentPlayer(c) {
  if (c.player !== undefined) return c.player;
  c.player = null;
  const token = readCookie(c.request);
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const th = await sha256(token);
  const row = await c.db.prepare(`SELECT p.*, t.last_used_at AS token_used, t.token_hash FROM player_tokens t JOIN players p ON p.id = t.player_id
    WHERE t.token_hash = ? AND p.status IN ('active', 'banned')`).bind(th).first();
  if (!row) return null;
  if (c.now - row.token_used > DAY) {
    await c.db.batch([
      c.db.prepare('UPDATE player_tokens SET last_used_at = ? WHERE token_hash = ?').bind(c.now, th),
      c.db.prepare('UPDATE players SET last_seen_at = ? WHERE id = ?').bind(c.now, row.id)
    ]);
  }
  c.player = row;
  return row;
}
async function requirePlayer(c) {
  const p = await currentPlayer(c);
  if (!p) fail(401, 'not_signed_in');
  return p;
}

async function newToken(c, playerId) {
  const token = randomHex(32);
  await c.db.prepare('INSERT INTO player_tokens (token_hash, player_id, created_at, last_used_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), playerId, c.now, c.now).run();
  return token;
}
async function newRecovery() {
  const code = formatRecoveryCode(crypto.getRandomValues(new Uint8Array(16)));
  return { code, hash: await sha256('recovery|' + code) };
}

function validNickname(raw) {
  const err = checkNickname(raw, BLOCKLIST);
  if (err) fail(400, err);
  return cleanNickname(raw);
}

async function createPlayer(c, body) {
  if (await currentPlayer(c)) fail(409, 'already_signed_in');
  const nickname = validNickname(body.nickname);
  if (!isCountry(body.country)) fail(400, 'bad_country');
  await rateLimit(c, 'create', await networkKey(c));
  const id = randomHex(16);
  const rec = await newRecovery();
  try {
    await c.db.prepare(`INSERT INTO players (id, nickname, nickname_key, country, recovery_hash, status, created_at, last_seen_at, changed_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0)`).bind(id, nickname, nicknameKey(nickname), body.country, rec.hash, c.now, c.now).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) fail(409, 'nick_taken');
    throw e;
  }
  const token = await newToken(c, id);
  return json({ nickname, country: body.country, recoveryCode: rec.code }, 201, { 'set-cookie': setCookie(token) });
}

async function updatePlayer(c, body) {
  const p = await requirePlayer(c);
  await rateLimit(c, 'profile', p.id);
  const sets = [], args = [];
  if (body.nickname !== undefined && cleanNickname(String(body.nickname)) !== p.nickname) {
    const nickname = validNickname(body.nickname);
    if (p.changed_at && c.now - p.changed_at < PROFILE_COOLDOWN_MS) fail(429, 'profile_cooldown', { retryAfterSec: Math.ceil((p.changed_at + PROFILE_COOLDOWN_MS - c.now) / 1000) });
    sets.push('nickname = ?', 'nickname_key = ?'); args.push(nickname, nicknameKey(nickname));
  }
  if (body.country !== undefined && body.country !== p.country) {
    if (!isCountry(body.country)) fail(400, 'bad_country');
    if (p.changed_at && c.now - p.changed_at < PROFILE_COOLDOWN_MS) fail(429, 'profile_cooldown', { retryAfterSec: Math.ceil((p.changed_at + PROFILE_COOLDOWN_MS - c.now) / 1000) });
    sets.push('country = ?'); args.push(body.country);
  }
  if (!sets.length) return json({ ok: true });
  sets.push('changed_at = ?'); args.push(c.now);
  try {
    await c.db.prepare(`UPDATE players SET ${sets.join(', ')} WHERE id = ?`).bind(...args, p.id).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) fail(409, 'nick_taken');
    throw e;
  }
  await dropCache(c, 'lb:');
  await dropCache(c, 'status');
  return json({ ok: true });
}

// Deleting a profile removes everything that identifies the player: nickname, recovery code and
// signed-in devices. Past results stay in closed rankings as "Former player" so that the history
// of other players (their ranks and medals) does not change.
async function anonymize(c, playerId) {
  await c.db.batch([
    c.db.prepare("UPDATE players SET nickname = NULL, nickname_key = NULL, recovery_hash = NULL, status = 'deleted' WHERE id = ?").bind(playerId),
    c.db.prepare('DELETE FROM player_tokens WHERE player_id = ?').bind(playerId),
    c.db.prepare("UPDATE game_sessions SET status = 'abandoned' WHERE player_id = ? AND status = 'active'").bind(playerId)
  ]);
}
async function deletePlayer(c) {
  const p = await requirePlayer(c);
  await anonymize(c, p.id);
  await dropCache(c, 'lb:');
  await dropCache(c, 'status');
  await dropCache(c, 'champions');
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}

async function recover(c, body) {
  await rateLimit(c, 'recover', await networkKey(c));
  const code = normalizeRecoveryCode(body.code);
  if (!code) fail(400, 'bad_code');
  const p = await c.db.prepare("SELECT id, nickname, country FROM players WHERE recovery_hash = ? AND status IN ('active', 'banned')")
    .bind(await sha256('recovery|' + code)).first();
  if (!p) fail(404, 'bad_code');
  const token = await newToken(c, p.id);
  return json({ nickname: p.nickname, country: p.country }, 200, { 'set-cookie': setCookie(token) });
}
async function regenerateRecovery(c) {
  const p = await requirePlayer(c);
  await rateLimit(c, 'profile', p.id);
  const rec = await newRecovery();
  await c.db.prepare('UPDATE players SET recovery_hash = ? WHERE id = ?').bind(rec.hash, p.id).run();
  return json({ recoveryCode: rec.code });
}
async function logout(c) {
  const p = await currentPlayer(c);
  if (p) await c.db.prepare('DELETE FROM player_tokens WHERE token_hash = ?').bind(p.token_hash).run();
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}

// ---------- games ----------
const publicState = (s) => ({ score: s.score, errors: s.errors, cursor: s.cursor, attempts: s.attempts });

async function startGame(c) {
  const p = await requirePlayer(c);
  if (p.status === 'banned') fail(403, 'banned');
  await rateLimit(c, 'start', p.id);
  // Close any game this player left running (its answers so far still count).
  const open = await c.db.prepare("SELECT * FROM game_sessions WHERE player_id = ? AND status = 'active'").bind(p.id).all();
  for (const s of open.results || []) await finalizeSession(c, s, JSON.parse(s.state));
  const id = randomHex(16);
  const seed = randomHex(16);
  const startsAt = c.now + RULES.countdownMs;
  const endsAt = startsAt + RULES.durationMs;
  const month = monthKey(startsAt);
  if (month < c.firstMonth) fail(403, 'not_open');
  await c.db.prepare(`INSERT INTO game_sessions (id, player_id, month, seed, created_at, starts_at, ends_at, seq, state, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`).bind(id, p.id, month, seed, c.now, startsAt, endsAt, JSON.stringify(initialState())).run();
  return json({
    session: id, seq: 0, month, startsInMs: RULES.countdownMs, durationMs: RULES.durationMs,
    questions: questionsWindow(seed, 0, RULES.window), ...publicState(initialState())
  });
}

async function loadSession(c, body) {
  const p = await requirePlayer(c);
  if (typeof body.session !== 'string' || !/^[0-9a-f]{32}$/.test(body.session)) fail(400, 'bad_session');
  const s = await c.db.prepare('SELECT * FROM game_sessions WHERE id = ?').bind(body.session).first();
  if (!s || s.player_id !== p.id) fail(404, 'unknown_session');   // someone else's game looks like no game
  return s;
}

// Applies one batch of answers. Batches are numbered: a repeated number (network retry) changes
// nothing, a skipped or forged number is refused.
async function applyBatch(c, s, body) {
  let state = JSON.parse(s.state);
  const seq = body.seq;
  if (!Number.isInteger(seq) || seq < 1) fail(400, 'bad_seq');
  if (seq <= s.seq) return { state, duplicate: true };
  if (seq !== s.seq + 1) fail(409, 'seq_gap', { seq: s.seq });
  const elapsed = c.now - s.starts_at;
  if (elapsed < -1000) fail(409, 'not_started');
  if (c.now > s.ends_at + RULES.graceMs) return { state, late: true };
  const res = applyEvents(s.seed, state, body.events || [], elapsed);
  if (!res.ok) {
    // Out-of-order answers, times in the future, malformed data: never produced by the real game.
    state = { ...state, flags: [...new Set([...(state.flags || []), 'protocol'])] };
    await logEvent(c, 'anomaly', s.player_id, s.id, `protocol: ${res.error}`);
    await finalizeSession(c, s, state);
    fail(409, 'rejected', { reason: res.error });
  }
  const upd = await c.db.prepare("UPDATE game_sessions SET seq = ?, state = ? WHERE id = ? AND seq = ? AND status = 'active'")
    .bind(seq, JSON.stringify(res.state), s.id, s.seq).run();
  if (!upd.meta || upd.meta.changes !== 1) fail(409, 'concurrent', { seq: s.seq });
  return { state: res.state };
}

async function answer(c, body) {
  const s = await loadSession(c, body);
  if (s.status !== 'active') fail(409, 'game_over');
  const r = await applyBatch(c, s, body);
  if (r.late) {
    const result = await finalizeSession(c, s, r.state);
    return json({ over: true, result });
  }
  return json({ seq: r.duplicate ? s.seq : body.seq, questions: questionsWindow(s.seed, r.state.cursor, RULES.window), ...publicState(r.state) });
}

async function finish(c, body) {
  const s = await loadSession(c, body);
  if (s.status !== 'active') {
    const prev = await c.db.prepare('SELECT * FROM scores WHERE id = ?').bind(s.id).first();
    return json({ over: true, result: prev ? resultOf(prev) : null });
  }
  let state = JSON.parse(s.state);
  if (Array.isArray(body.events) && body.events.length) state = (await applyBatch(c, s, body)).state;
  const result = await finalizeSession(c, s, state);
  return json({ over: true, result });
}

const resultOf = (row) => ({ score: row.score, errors: row.errors, status: row.status, month: row.month });

// Ends a game exactly once and records its result. The score row reuses the session id.
async function finalizeSession(c, s, state) {
  const done = await c.db.prepare("UPDATE game_sessions SET status = 'finished', state = ?, finished_at = ? WHERE id = ? AND status = 'active'")
    .bind(JSON.stringify(state), c.now, s.id).run();
  if (!done.meta || done.meta.changes !== 1) {
    const prev = await c.db.prepare('SELECT * FROM scores WHERE id = ?').bind(s.id).first();
    return prev ? resultOf(prev) : null;
  }
  if (!state.answered) return { score: 0, errors: 0, status: 'empty', month: s.month };
  const v = verdict(state);
  const player = await c.db.prepare('SELECT country, status FROM players WHERE id = ?').bind(s.player_id).first();
  const country = player ? player.country : 'ZZ';
  const achievedAt = s.starts_at + Math.min(state.lastT, RULES.durationMs);
  const avgGap = state.gapCount ? Math.round(state.gapSum / state.gapCount) : null;
  await c.db.batch([
    c.db.prepare(`INSERT INTO scores (id, player_id, month, country, score, errors, answered, min_gap, avg_gap, status, flags, achieved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(s.id, s.player_id, s.month, country, state.score, state.errors, state.answered, state.minGap, avgGap, v.status, v.flags.join(','), achievedAt),
    c.db.prepare("INSERT OR IGNORE INTO months (month, status) VALUES (?, 'open')").bind(s.month),
    c.db.prepare('UPDATE months SET games = games + 1 WHERE month = ?').bind(s.month)
  ]);
  const result = { score: state.score, errors: state.errors, status: v.status, month: s.month };
  if (v.status === 'valid') {
    Object.assign(result, await applyBest(c, { id: s.id, player_id: s.player_id, month: s.month, country, score: state.score, errors: state.errors, achieved_at: achievedAt }));
  } else {
    await logEvent(c, v.status === 'review' ? 'review' : 'anomaly', s.player_id, s.id, `score ${state.score}, errors ${state.errors}, avg ${avgGap} ms, min ${state.minGap} ms: ${v.flags.join(', ')}`);
  }
  await maintenance(c);
  return result;
}

// Puts a valid score into the monthly ranking (unless that month is closed) and the all-time records.
async function applyBest(c, sc) {
  const out = { monthBest: false, allTimeBest: false };
  const entry = { score: sc.score, errors: sc.errors, achievedAt: sc.achieved_at };
  const month = await c.db.prepare('SELECT status FROM months WHERE month = ?').bind(sc.month).first();
  if (!month || month.status === 'open') {
    const cur = await c.db.prepare('SELECT score, errors, achieved_at FROM monthly_best WHERE month = ? AND player_id = ?').bind(sc.month, sc.player_id).first();
    if (!cur) {
      await c.db.batch([
        c.db.prepare('INSERT INTO monthly_best (month, player_id, country, score, errors, achieved_at, score_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(sc.month, sc.player_id, sc.country, sc.score, sc.errors, sc.achieved_at, sc.id),
        c.db.prepare("INSERT OR IGNORE INTO months (month, status) VALUES (?, 'open')").bind(sc.month),
        c.db.prepare('UPDATE months SET participants = participants + 1 WHERE month = ?').bind(sc.month)
      ]);
      out.monthBest = true;
    } else if (isBetter(entry, { score: cur.score, errors: cur.errors, achievedAt: cur.achieved_at })) {
      await c.db.prepare('UPDATE monthly_best SET country = ?, score = ?, errors = ?, achieved_at = ?, score_id = ? WHERE month = ? AND player_id = ?')
        .bind(sc.country, sc.score, sc.errors, sc.achieved_at, sc.id, sc.month, sc.player_id).run();
      out.monthBest = true;
    }
  }
  const at = await c.db.prepare('SELECT score, errors, achieved_at FROM alltime_best WHERE player_id = ?').bind(sc.player_id).first();
  if (!at || isBetter(entry, { score: at.score, errors: at.errors, achievedAt: at.achieved_at })) {
    await c.db.prepare(`INSERT INTO alltime_best (player_id, country, score, errors, achieved_at, month, score_id) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (player_id) DO UPDATE SET country = excluded.country, score = excluded.score, errors = excluded.errors,
      achieved_at = excluded.achieved_at, month = excluded.month, score_id = excluded.score_id`)
      .bind(sc.player_id, sc.country, sc.score, sc.errors, sc.achieved_at, sc.month, sc.id).run();
    out.allTimeBest = true;
  }
  if (out.monthBest) { await dropCache(c, `lb:month:${sc.month}:`); await dropCache(c, 'status'); }
  if (out.allTimeBest) await dropCache(c, 'lb:alltime:');
  return out;
}

// Recomputes a player's best rows from their remaining valid scores (after a moderator decision).
async function rebuildBest(c, playerId, month) {
  const bestOf = (where, ...args) => c.db.prepare(`SELECT * FROM scores WHERE player_id = ? AND status = 'valid' ${where}
    ORDER BY score DESC, errors ASC, achieved_at ASC LIMIT 1`).bind(playerId, ...args).first();
  const m = await c.db.prepare('SELECT status FROM months WHERE month = ?').bind(month).first();
  const mb = await bestOf('AND month = ?', month);
  const had = await c.db.prepare('SELECT 1 AS x FROM monthly_best WHERE month = ? AND player_id = ?').bind(month, playerId).first();
  const stmts = [c.db.prepare('DELETE FROM monthly_best WHERE month = ? AND player_id = ?').bind(month, playerId)];
  if (mb) stmts.push(c.db.prepare('INSERT INTO monthly_best (month, player_id, country, score, errors, achieved_at, score_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(month, playerId, mb.country, mb.score, mb.errors, mb.achieved_at, mb.id));
  if (had && !mb) stmts.push(c.db.prepare('UPDATE months SET participants = MAX(participants - 1, 0) WHERE month = ?').bind(month));
  if (!had && mb) stmts.push(c.db.prepare('UPDATE months SET participants = participants + 1 WHERE month = ?').bind(month));
  const ab = await bestOf('');
  stmts.push(c.db.prepare('DELETE FROM alltime_best WHERE player_id = ?').bind(playerId));
  if (ab) stmts.push(c.db.prepare('INSERT INTO alltime_best (player_id, country, score, errors, achieved_at, month, score_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(playerId, ab.country, ab.score, ab.errors, ab.achieved_at, ab.month, ab.id));
  await c.db.batch(stmts);
  if (m && m.status === 'closed') await closeMonth(c, month);
  await dropCache(c, 'lb:');
  await dropCache(c, 'status');
}

// ---------- months ----------
let lastMonthCheck = 0;
async function closeFinishedMonths(c) {
  if (c.now - lastMonthCheck < 30000) return;
  lastMonthCheck = c.now;
  const current = monthKey(c.now);
  const open = await c.db.prepare("SELECT month FROM months WHERE status = 'open' AND month < ? ORDER BY month").bind(current).all();
  for (const { month } of open.results || []) {
    if (c.now < monthEnd(month) + CLOSE_DELAY_MS) continue;
    // Games of that month that nobody finished (closed tab...) still count with the answers given.
    const stale = await c.db.prepare("SELECT * FROM game_sessions WHERE status = 'active' AND month = ? AND ends_at < ? LIMIT 2")
      .bind(month, c.now - RULES.graceMs).all();
    for (const s of stale.results || []) await finalizeSession(c, s, JSON.parse(s.state));
    if ((stale.results || []).length === 2) { lastMonthCheck = 0; return; } // more next time
    await closeMonth(c, month);
  }
}

// Freezes a month: gold, silver and bronze are written to the permanent hall of champions.
// Idempotent, also used when a moderator removes a fraudulent score from a closed month.
async function closeMonth(c, month) {
  const top = await c.db.prepare(`SELECT mb.player_id, mb.country, mb.score, mb.errors, mb.achieved_at FROM monthly_best mb
    JOIN players p ON p.id = mb.player_id WHERE mb.month = ? AND p.status != 'banned'
    ORDER BY mb.score DESC, mb.errors ASC, mb.achieved_at ASC LIMIT 3`).bind(month).all();
  const prev = await c.db.prepare('SELECT player_id FROM monthly_champions WHERE month = ?').bind(month).all();
  const rows = top.results || [];
  const affected = [...new Set([...rows.map((r) => r.player_id), ...(prev.results || []).map((r) => r.player_id)])];
  const stmts = [c.db.prepare('DELETE FROM monthly_champions WHERE month = ?').bind(month)];
  rows.forEach((r, i) => stmts.push(c.db.prepare('INSERT INTO monthly_champions (month, rank, player_id, country, score, errors, achieved_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(month, i + 1, r.player_id, r.country, r.score, r.errors, r.achieved_at)));
  for (const id of affected) stmts.push(c.db.prepare("UPDATE players SET titles = (SELECT COUNT(*) FROM monthly_champions WHERE player_id = ? AND rank = 1) WHERE id = ?").bind(id, id));
  stmts.push(c.db.prepare("INSERT OR IGNORE INTO months (month, status) VALUES (?, 'open')").bind(month));
  stmts.push(c.db.prepare("UPDATE months SET status = 'closed', closed_at = COALESCE(closed_at, ?) WHERE month = ?").bind(c.now, month));
  await c.db.batch(stmts);
  await dropCache(c, 'champions');
  await dropCache(c, 'status');
  await dropCache(c, 'lb:');
}

// ---------- housekeeping (data retention) ----------
let lastMaintenance = 0;
async function maintenance(c) {
  if (c.now - lastMaintenance < 3600000) return;
  lastMaintenance = c.now;
  const ago = (days) => c.now - days * DAY;
  await c.db.batch([
    c.db.prepare("DELETE FROM game_sessions WHERE rowid IN (SELECT rowid FROM game_sessions WHERE status != 'active' AND created_at < ? LIMIT 500)").bind(ago(RETENTION.sessionsDays)),
    c.db.prepare("UPDATE game_sessions SET status = 'abandoned' WHERE status = 'active' AND ends_at < ?").bind(ago(RETENTION.sessionsDays)),
    c.db.prepare(`DELETE FROM scores WHERE rowid IN (SELECT rowid FROM scores WHERE achieved_at < ?
      AND id NOT IN (SELECT score_id FROM monthly_best) AND id NOT IN (SELECT score_id FROM alltime_best) LIMIT 500)`).bind(ago(RETENTION.scoresDays)),
    c.db.prepare('DELETE FROM moderation_events WHERE rowid IN (SELECT rowid FROM moderation_events WHERE created_at < ? LIMIT 500)').bind(ago(RETENTION.eventsDays)),
    c.db.prepare('DELETE FROM player_tokens WHERE last_used_at < ?').bind(ago(RETENTION.tokensDays)),
    c.db.prepare('DELETE FROM rate_limits WHERE rowid IN (SELECT rowid FROM rate_limits WHERE win < ? LIMIT 1000)').bind(ago(RETENTION.rateLimitDays)),
    c.db.prepare('DELETE FROM api_cache WHERE expires_at < ?').bind(c.now)
  ]);
  const old = await c.db.prepare("SELECT id FROM players WHERE status = 'active' AND last_seen_at < ? LIMIT 20").bind(ago(RETENTION.inactivePlayerDays)).all();
  for (const r of old.results || []) await anonymize(c, r.id);
}

// ---------- public rankings ----------
const NOT_BANNED = "p.status != 'banned'";
function publicRow(r, rank) {
  return { rank, nickname: r.status === 'deleted' ? null : r.nickname, country: r.country, score: r.score, errors: r.errors, titles: r.titles || 0 };
}

async function board(c, kind, month, country, page) {
  const isMonth = kind === 'month';
  const closed = isMonth && month < monthKey(c.now);
  const key = `lb:${kind}:${isMonth ? month : '-'}:${country || '-'}:${page}`;
  return cached(c, key, closed ? DAY : 30000, async () => {
    const offset = (page - 1) * PAGE_SIZE;
    const where = [], args = [];
    if (isMonth) { where.push('b.month = ?'); args.push(month); }
    if (country) { where.push('b.country = ?'); args.push(country); }
    where.push(NOT_BANNED);
    const table = isMonth ? 'monthly_best' : 'alltime_best';
    const rows = await c.db.prepare(`SELECT p.nickname, p.status, p.titles, b.country, b.score, b.errors, b.achieved_at FROM ${table} b
      JOIN players p ON p.id = b.player_id WHERE ${where.join(' AND ')} ORDER BY b.score DESC, b.errors ASC, b.achieved_at ASC LIMIT ? OFFSET ?`)
      .bind(...args, PAGE_SIZE, offset).all();
    let total;
    if (isMonth && !country) {
      const m = await c.db.prepare('SELECT participants FROM months WHERE month = ?').bind(month).first();
      total = m ? m.participants : 0;
    } else {
      const n = await c.db.prepare(`SELECT COUNT(*) AS n FROM ${table} b JOIN players p ON p.id = b.player_id WHERE ${where.join(' AND ')}`).bind(...args).first();
      total = n ? n.n : 0;
    }
    return {
      board: kind, month: isMonth ? month : null, country: country || null, page,
      pages: Math.max(1, Math.min(MAX_PAGES, Math.ceil(total / PAGE_SIZE))), total,
      rows: (rows.results || []).map((r, i) => publicRow(r, offset + i + 1))
    };
  });
}

function boardParams(c) {
  const q = c.url.searchParams;
  const kind = q.get('board') === 'alltime' ? 'alltime' : 'month';
  const month = q.get('month') || monthKey(c.now);
  if (!isMonthKey(month) || month > monthKey(c.now)) fail(400, 'bad_month');
  const country = q.get('country') || '';
  if (country && !isCountry(country)) fail(400, 'bad_country');
  const page = Math.max(1, Math.min(MAX_PAGES, parseInt(q.get('page') || '1', 10) || 1));
  return { kind, month, country, page };
}

async function leaderboard(c) {
  const { kind, month, country, page } = boardParams(c);
  return json(await board(c, kind, month, country, page));
}

async function countries(c) {
  const q = c.url.searchParams;
  const kind = q.get('board') === 'alltime' ? 'alltime' : 'month';
  const month = q.get('month') || monthKey(c.now);
  if (!isMonthKey(month) || month > monthKey(c.now)) fail(400, 'bad_month');
  const closed = kind === 'month' && month < monthKey(c.now);
  const data = await cached(c, `lb:countries:${kind}:${kind === 'month' ? month : '-'}`, closed ? DAY : 300000, async () => {
    const table = kind === 'month' ? 'monthly_best' : 'alltime_best';
    const rows = await c.db.prepare(`WITH r AS (SELECT b.country, b.score, ROW_NUMBER() OVER (PARTITION BY b.country ORDER BY b.score DESC, b.errors ASC, b.achieved_at ASC) AS rn
      FROM ${table} b JOIN players p ON p.id = b.player_id WHERE ${kind === 'month' ? 'b.month = ? AND' : ''} ${NOT_BANNED} AND b.country != 'ZZ')
      SELECT country, COUNT(*) AS players, MAX(score) AS best, SUM(CASE WHEN rn <= ${TEAM_SIZE} THEN score ELSE 0 END) AS top FROM r
      GROUP BY country ORDER BY top DESC, best DESC, players DESC LIMIT 250`).bind(...(kind === 'month' ? [month] : [])).all();
    return {
      board: kind, month: kind === 'month' ? month : null, teamSize: TEAM_SIZE,
      rows: (rows.results || []).map((r, i) => ({ rank: i + 1, country: r.country, players: r.players, best: r.best, team: Math.round((r.top / TEAM_SIZE) * 10) / 10 }))
    };
  });
  return json(data);
}

async function champions(c) {
  const data = await cached(c, 'champions', 300000, async () => {
    const rows = await c.db.prepare(`SELECT mc.month, mc.rank, mc.country, mc.score, mc.errors, p.nickname, p.status, p.titles FROM monthly_champions mc
      JOIN players p ON p.id = mc.player_id ORDER BY mc.month DESC, mc.rank ASC LIMIT 600`).all();
    return { rows: (rows.results || []).map((r) => ({ month: r.month, rank: r.rank, ...publicRow(r, r.rank) })) };
  });
  return json(data);
}

async function status(c) {
  const month = monthKey(c.now);
  const data = await cached(c, 'status', 30000, async () => {
    const top = await board(c, 'month', month, '', 1);
    const m = await c.db.prepare('SELECT participants, games FROM months WHERE month = ?').bind(month).first();
    const last = await c.db.prepare(`SELECT mc.month, mc.country, mc.score, p.nickname, p.status, p.titles FROM monthly_champions mc
      JOIN players p ON p.id = mc.player_id WHERE mc.rank = 1 ORDER BY mc.month DESC LIMIT 1`).first();
    return {
      month, startsAt: monthStart(month), endsAt: monthEnd(month),
      participants: m ? m.participants : 0, games: m ? m.games : 0,
      podium: top.rows.slice(0, 3),
      lastChampion: last ? { month: last.month, ...publicRow(last, 1) } : null
    };
  });
  const opensAt = month < c.firstMonth ? monthStart(c.firstMonth) : null;
  return json({ ...data, opensAt, firstMonth: c.firstMonth, serverNow: c.now, durationMs: RULES.durationMs });
}

async function rankIn(c, table, month, b) {
  const where = month ? 'b.month = ? AND' : '';
  const n = await c.db.prepare(`SELECT COUNT(*) AS n FROM ${table} b JOIN players p ON p.id = b.player_id WHERE ${where} ${NOT_BANNED}
    AND (b.score > ? OR (b.score = ? AND (b.errors < ? OR (b.errors = ? AND b.achieved_at < ?))))`)
    .bind(...(month ? [month] : []), b.score, b.score, b.errors, b.errors, b.achieved_at).first();
  return (n ? n.n : 0) + 1;
}

async function me(c) {
  const p = await currentPlayer(c);
  if (!p) return json({ signedIn: false });
  const month = monthKey(c.now);
  const mb = await c.db.prepare('SELECT score, errors, achieved_at FROM monthly_best WHERE month = ? AND player_id = ?').bind(month, p.id).first();
  const ab = await c.db.prepare('SELECT score, errors, achieved_at, month FROM alltime_best WHERE player_id = ?').bind(p.id).first();
  const medals = await c.db.prepare('SELECT month, rank, score FROM monthly_champions WHERE player_id = ? ORDER BY month DESC').bind(p.id).all();
  const recent = await c.db.prepare('SELECT score, errors, status, achieved_at FROM scores WHERE player_id = ? ORDER BY achieved_at DESC LIMIT 10').bind(p.id).all();
  const banned = p.status === 'banned';
  return json({
    signedIn: true, nickname: p.nickname, country: p.country, titles: p.titles, banned,
    canEditAt: p.changed_at ? p.changed_at + PROFILE_COOLDOWN_MS : 0,
    month: { key: month, best: mb && !banned ? { score: mb.score, errors: mb.errors, rank: await rankIn(c, 'monthly_best', month, mb) } : null },
    allTime: ab && !banned ? { score: ab.score, errors: ab.errors, month: ab.month, rank: await rankIn(c, 'alltime_best', null, ab) } : null,
    medals: (medals.results || []).map((r) => ({ month: r.month, rank: r.rank, score: r.score })),
    recent: (recent.results || []).map((r) => ({ score: r.score, errors: r.errors, status: r.status, at: r.achieved_at }))
  });
}

async function report(c, body) {
  await rateLimit(c, 'report', await networkKey(c));
  if (typeof body.nickname !== 'string' || body.nickname.length > 40) fail(400, 'bad_nickname');
  const month = body.month || monthKey(c.now);
  if (!isMonthKey(month)) fail(400, 'bad_month');
  const p = await c.db.prepare('SELECT id FROM players WHERE nickname_key = ?').bind(nicknameKey(body.nickname)).first();
  if (!p) fail(404, 'unknown_player');
  const reason = String(body.reason || '').replace(/[\u0000-\u001f<>]/g, ' ').slice(0, 200);
  await logEvent(c, 'report', p.id, month, reason || 'suspicious score');
  return json({ ok: true });
}

// ---------- admin (token in the ADMIN_TOKEN secret, never in the page) ----------
async function requireAdmin(c) {
  const conf = c.env.ADMIN_TOKEN ? String(c.env.ADMIN_TOKEN) : '';
  if (conf.length < 24) fail(503, 'admin_disabled');
  const got = (c.request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = safeEqual(await sha256('admin|' + got), await sha256('admin|' + conf));
  if (!ok) {
    await rateLimit(c, 'adminfail', await networkKey(c));
    fail(401, 'bad_admin_token');
  }
}

async function adminRoute(c, sub, body) {
  await requireAdmin(c);
  const month = monthKey(c.now);
  const db = c.db;
  if (sub === 'overview' && c.method === 'GET') {
    const q = (sql, ...a) => db.prepare(sql).bind(...a).first();
    const [players, banned, m, total, review, reports, errors] = await Promise.all([
      q("SELECT COUNT(*) AS n FROM players WHERE status = 'active'"),
      q("SELECT COUNT(*) AS n FROM players WHERE status = 'banned'"),
      q('SELECT participants, games FROM months WHERE month = ?', month),
      q('SELECT SUM(games) AS n FROM months'),
      q("SELECT COUNT(*) AS n FROM scores WHERE status = 'review'"),
      q("SELECT COUNT(*) AS n FROM moderation_events WHERE type = 'report' AND resolved = 0"),
      q("SELECT COUNT(*) AS n FROM moderation_events WHERE type = 'error' AND created_at > ?", c.now - DAY)
    ]);
    const byCountry = await db.prepare(`SELECT b.country, COUNT(*) AS players, MAX(b.score) AS best FROM monthly_best b WHERE b.month = ?
      GROUP BY b.country ORDER BY players DESC LIMIT 60`).bind(month).all();
    const top = await db.prepare(`SELECT p.nickname, p.status, b.country, b.score, b.errors, b.achieved_at FROM monthly_best b JOIN players p ON p.id = b.player_id
      WHERE b.month = ? ORDER BY b.score DESC, b.errors ASC, b.achieved_at ASC LIMIT 20`).bind(month).all();
    const champs = await db.prepare(`SELECT mc.month, mc.rank, mc.score, mc.country, p.nickname, p.status FROM monthly_champions mc JOIN players p ON p.id = mc.player_id
      ORDER BY mc.month DESC, mc.rank ASC LIMIT 60`).all();
    const months = await db.prepare('SELECT month, status, participants, games, closed_at FROM months ORDER BY month DESC LIMIT 24').all();
    return json({
      month, activePlayers: players.n, bannedPlayers: banned.n, monthPlayers: m ? m.participants : 0, monthGames: m ? m.games : 0,
      totalGames: total.n || 0, pendingReview: review.n, openReports: reports.n, errors24h: errors.n,
      byCountry: byCountry.results, top: top.results, champions: champs.results, months: months.results
    });
  }
  if (sub === 'review' && c.method === 'GET') {
    const scores = await db.prepare(`SELECT s.id, s.month, s.score, s.errors, s.answered, s.min_gap, s.avg_gap, s.flags, s.status, s.achieved_at, s.country, p.nickname, p.status AS player_status
      FROM scores s JOIN players p ON p.id = s.player_id WHERE s.status = 'review' ORDER BY s.score DESC LIMIT 100`).all();
    const events = await db.prepare(`SELECT e.id, e.type, e.ref, e.detail, e.created_at, e.resolved, p.nickname FROM moderation_events e LEFT JOIN players p ON p.id = e.player_id
      WHERE e.type IN ('report', 'anomaly', 'review', 'abuse') AND e.resolved = 0 ORDER BY e.created_at DESC LIMIT 200`).all();
    return json({ scores: scores.results, events: events.results });
  }
  if (sub === 'errors' && c.method === 'GET') {
    const rows = await db.prepare("SELECT id, ref, detail, created_at FROM moderation_events WHERE type = 'error' ORDER BY created_at DESC LIMIT 100").all();
    return json({ rows: rows.results });
  }
  if (sub === 'actions' && c.method === 'GET') {
    const rows = await db.prepare("SELECT id, ref, detail, created_at FROM moderation_events WHERE type = 'admin' ORDER BY created_at DESC LIMIT 100").all();
    return json({ rows: rows.results });
  }
  if (sub === 'player' && c.method === 'GET') {
    const nick = c.url.searchParams.get('nickname') || '';
    const p = await db.prepare('SELECT * FROM players WHERE nickname_key = ?').bind(nicknameKey(nick)).first();
    if (!p) fail(404, 'unknown_player');
    const scores = await db.prepare('SELECT id, month, score, errors, avg_gap, min_gap, status, flags, achieved_at FROM scores WHERE player_id = ? ORDER BY achieved_at DESC LIMIT 30').bind(p.id).all();
    return json({ nickname: p.nickname, country: p.country, status: p.status, titles: p.titles, createdAt: p.created_at, lastSeenAt: p.last_seen_at, scores: scores.results });
  }
  if (sub === 'score' && c.method === 'POST') {
    const s = await db.prepare('SELECT * FROM scores WHERE id = ?').bind(String(body.id || '')).first();
    if (!s) fail(404, 'unknown_score');
    if (body.action === 'approve') {
      await db.prepare("UPDATE scores SET status = 'valid' WHERE id = ?").bind(s.id).run();
      await rebuildBest(c, s.player_id, s.month);
    } else if (body.action === 'invalidate') {
      await db.prepare("UPDATE scores SET status = 'invalid', flags = flags || ',moderator' WHERE id = ?").bind(s.id).run();
      await rebuildBest(c, s.player_id, s.month);
    } else fail(400, 'bad_action');
    await logEvent(c, 'admin', s.player_id, s.id, `${body.action} score ${s.score} (${s.month})`);
    return json({ ok: true });
  }
  if (sub === 'player' && c.method === 'POST') {
    const p = await db.prepare('SELECT * FROM players WHERE nickname_key = ?').bind(nicknameKey(String(body.nickname || ''))).first();
    if (!p) fail(404, 'unknown_player');
    let detail = body.action;
    if (body.action === 'ban' || body.action === 'unban') {
      await db.prepare('UPDATE players SET status = ? WHERE id = ?').bind(body.action === 'ban' ? 'banned' : 'active', p.id).run();
      await db.prepare("UPDATE game_sessions SET status = 'abandoned' WHERE player_id = ? AND status = 'active'").bind(p.id).run();
      const closed = await db.prepare("SELECT DISTINCT b.month FROM monthly_best b JOIN months m ON m.month = b.month WHERE b.player_id = ? AND m.status = 'closed'").bind(p.id).all();
      for (const r of closed.results || []) await closeMonth(c, r.month);
    } else if (body.action === 'reset_nickname') {
      let nick;
      for (let i = 0; i < 20; i++) {
        nick = suggestNickname(() => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296);
        if (!(await db.prepare('SELECT 1 AS x FROM players WHERE nickname_key = ?').bind(nicknameKey(nick)).first())) break;
      }
      await db.prepare('UPDATE players SET nickname = ?, nickname_key = ? WHERE id = ?').bind(nick, nicknameKey(nick), p.id).run();
      detail = `reset_nickname ${p.nickname} -> ${nick}`;
    } else fail(400, 'bad_action');
    await logEvent(c, 'admin', p.id, null, detail);
    await dropCache(c, 'lb:'); await dropCache(c, 'status'); await dropCache(c, 'champions');
    return json({ ok: true });
  }
  if (sub === 'event' && c.method === 'POST') {
    await db.prepare('UPDATE moderation_events SET resolved = 1 WHERE id = ?').bind(Number(body.id) || 0).run();
    return json({ ok: true });
  }
  if (sub === 'recompute' && c.method === 'POST') {
    if (!isMonthKey(body.month) || body.month >= month) fail(400, 'bad_month');
    await closeMonth(c, body.month);
    await logEvent(c, 'admin', null, body.month, 'recompute month');
    return json({ ok: true });
  }
  fail(404, 'not_found');
}

// ---------- router ----------
async function readBody(request) {
  const text = await request.text();
  if (text.length > 16384) fail(413, 'too_large');
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fail(400, 'bad_json');
  } catch (e) {
    if (e instanceof HttpError) throw e;
    fail(400, 'bad_json');
  }
}

export async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/championship\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  if (!env || !env.DB) return json({ error: 'not_configured' }, 503);
  const c = { request, env, ctx, db: env.DB, url, method, now: typeof env.__now === 'function' ? env.__now() : Date.now(),
    firstMonth: isMonthKey(env.CHAMPIONSHIP_FIRST_MONTH) ? env.CHAMPIONSHIP_FIRST_MONTH : FIRST_MONTH };
  try {
    if (method !== 'GET' && method !== 'HEAD') {
      // Same-site only: refuses requests sent by other websites with the player's cookie.
      const origin = request.headers.get('Origin');
      if (!origin || origin !== url.origin) fail(403, 'bad_origin');
      if (!/^application\/json\b/i.test(request.headers.get('Content-Type') || '')) fail(415, 'json_only');
    }
    await ensureSchema(c.db);
    await closeFinishedMonths(c);
    const body = method === 'POST' || method === 'PATCH' || method === 'DELETE' ? await readBody(request) : {};
    const R = `${method} ${path}`;
    switch (R) {
      case 'GET health': return json({ ok: true, schema: SCHEMA_VERSION, now: c.now });
      case 'GET status': return await status(c);
      case 'GET leaderboard': return await leaderboard(c);
      case 'GET countries': return await countries(c);
      case 'GET champions': return await champions(c);
      case 'GET me': return await me(c);
      case 'POST player': return await createPlayer(c, body);
      case 'PATCH player': return await updatePlayer(c, body);
      case 'DELETE player': return await deletePlayer(c);
      case 'POST recover': return await recover(c, body);
      case 'POST recovery-code': return await regenerateRecovery(c);
      case 'POST logout': return await logout(c);
      case 'POST start': return await startGame(c);
      case 'POST answer': return await answer(c, body);
      case 'POST finish': return await finish(c, body);
      case 'POST report': return await report(c, body);
      default:
        if (path.startsWith('admin/')) return await adminRoute(c, path.slice(6), body);
        fail(404, 'not_found');
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, ...e.extra }, e.status, e.status === 429 && e.extra.retryAfterSec ? { 'retry-after': String(e.extra.retryAfterSec) } : {});
    try { await logEvent(c, 'error', null, `${method} /${path}`, String((e && e.stack) || e).slice(0, 500)); } catch (e2) { /* database unavailable */ }
    const quota = /limit|exceeded/i.test(String(e && e.message));
    return json({ error: quota ? 'busy' : 'server_error' }, quota ? 503 : 500);
  }
}
