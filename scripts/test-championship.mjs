#!/usr/bin/env node
/*
 * Tests of the Multiplication World Championship: rules, API, anti-cheat, months, moderation,
 * and a small load test. Runs the real API code against an in-memory D1 (node:sqlite, Node 22+).
 * Usage: node scripts/test-championship.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '../src/championship/core.mjs';
import { BLOCKLIST } from '../src/championship/blocklist.mjs';
import { MIGRATIONS, migrationSql } from '../src/championship/schema.mjs';
import { handle, _resetForTests } from '../src/championship/api.mjs';
import { createD1 } from './lib/d1-shim.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://mathlabs.pages.dev';
const ADMIN = 'test-admin-token-0123456789abcdef';
let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; } catch (e) { failures.push(`✗ ${name}\n   ${e.stack.split('\n').slice(0, 3).join('\n   ')}`); }
}

// ---------- harness ----------
function makeEnv(startIso = '2026-10-15T12:00:00Z', extra = {}) {
  _resetForTests();
  const clock = { t: Date.parse(startIso) };
  const DB = createD1();
  return { DB, clock, env: { DB, ADMIN_TOKEN: ADMIN, __now: () => clock.t, ...extra } };
}
let ipCounter = 1;
async function call(E, method, p, { body, cookie, origin = ORIGIN, ip, headers = {}, rawBody } = {}) {
  const h = { 'CF-Connecting-IP': ip || '203.0.113.' + (ipCounter++ % 250), ...headers };
  if (cookie) h.Cookie = cookie;
  if (method !== 'GET') { if (origin) h.Origin = origin; h['Content-Type'] = h['Content-Type'] || 'application/json'; }
  const req = new Request(`${ORIGIN}/api/championship/${p}`, { method, headers: h, body: method === 'GET' ? undefined : rawBody !== undefined ? rawBody : JSON.stringify(body || {}) });
  reqCounter++;
  const before = E.DB.stats.queries;
  const res = await handle(req, E.env, {});
  const queries = E.DB.stats.queries - before;
  maxQueries = Math.max(maxQueries, queries);
  if (process.env.QDEBUG && queries > 20) console.log("Q", queries, method, p);
  const data = await res.json();
  const sc = res.headers.get('set-cookie') || '';
  return { status: res.status, data, cookie: sc.split(';')[0], setCookie: sc, queries };
}
let maxQueries = 0;
let reqCounter = 0;
let loadReport = '';
let nickN = 0;
async function newPlayer(E, country = 'FR', nickname) {
  const r = await call(E, 'POST', 'player', { body: { nickname: nickname || `Tester${++nickN}x`, country } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return { cookie: r.cookie, code: r.data.recoveryCode, nickname: r.data.nickname };
}

// Plays a full official game like a person would: answers in order, in batches, with a given
// time per answer. wrong(i) decides whether answer #i is wrong first.
async function play(E, cookie, { gap = 1500, wrong = () => false, batch = 4, latency = 80, stopAt = core.RULES.durationMs } = {}) {
  const st = await call(E, 'POST', 'start', { cookie });
  assert.equal(st.status, 200, JSON.stringify(st.data));
  const session = st.data.session;
  const startsAt = E.clock.t + st.data.startsInMs;
  let questions = st.data.questions;
  let seq = 0, t = 0, pending = [], n = 0, expect = { score: 0, errors: 0 };
  const q = () => questions[0];
  while (true) {
    const cur = q();
    assert.ok(cur, 'a question is always available');
    t += gap;
    if (t > stopAt) break;
    let tries = 0;
    if (wrong(n)) { pending.push([cur.i, cur.a * cur.b + 1, t]); expect.errors++; tries++; t += gap; }
    pending.push([cur.i, cur.a * cur.b, t]);
    if (tries < core.RULES.revealAfterWrong) expect.score++;
    questions = questions.slice(1);
    n++;
    if (pending.length >= batch) {
      E.clock.t = startsAt + t + latency;
      const r = await call(E, 'POST', 'answer', { cookie, body: { session, seq: ++seq, events: pending } });
      assert.equal(r.status, 200, JSON.stringify(r.data));
      questions = r.data.questions;
      pending = [];
    }
  }
  E.clock.t = startsAt + core.RULES.durationMs + latency;
  const f = await call(E, 'POST', 'finish', { cookie, body: { session, seq: ++seq, events: pending } });
  assert.equal(f.status, 200, JSON.stringify(f.data));
  return { result: f.data.result, expect, session };
}

// ================= rules (core) =================
await test('deck: every fact 2..12 × 2..12 exactly once per 121 questions, no immediate repeats', () => {
  for (let k = 0; k < 40; k++) {
    const seed = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const qs = core.questionsUpTo(seed, 121 * 3);
    for (let d = 0; d < 3; d++) {
      const keys = new Set(qs.slice(d * 121, d * 121 + 121).map(([a, b]) => a + 'x' + b));
      assert.equal(keys.size, 121);
    }
    for (let i = 1; i < qs.length; i++) {
      const [a, b] = qs[i], [c, d] = qs[i - 1];
      assert.ok(!((a === c && b === d) || (a === d && b === c)), 'no repeat or mirror right after');
    }
    for (const [a, b] of qs) assert.ok(a >= 2 && a <= 12 && b >= 2 && b <= 12);
  }
});
await test('deck: deterministic for a seed, different between seeds', () => {
  const a = core.questionsUpTo('00112233445566778899aabbccddeeff', 30);
  const b = core.questionsUpTo('00112233445566778899aabbccddeeff', 30);
  const c = core.questionsUpTo('ffeeddccbbaa99887766554433221100', 30);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});
await test('applyEvents: scoring, errors, reveal after two wrong tries, order and time checks', () => {
  const seed = '00112233445566778899aabbccddeeff';
  const qs = core.questionsUpTo(seed, 10);
  const ans = (i) => qs[i][0] * qs[i][1];
  let r = core.applyEvents(seed, core.initialState(), [[0, ans(0), 1000], [1, ans(1) + 1, 2000], [1, ans(1), 2600]], 3000);
  assert.ok(r.ok);
  assert.equal(r.state.score, 2); assert.equal(r.state.errors, 1); assert.equal(r.state.cursor, 2);
  r = core.applyEvents(seed, r.state, [[2, 0, 3000], [2, 1, 3500], [2, ans(2), 4500]], 5000);
  assert.equal(r.state.score, 2, 'answer typed after it was revealed earns nothing');
  assert.equal(r.state.errors, 3); assert.equal(r.state.cursor, 3);
  assert.equal(core.applyEvents(seed, r.state, [[4, 1, 5000]], 6000).error, 'order');
  assert.equal(core.applyEvents(seed, r.state, [[3, 1, 4000]], 6000).error, 'time_order');
  assert.equal(core.applyEvents(seed, r.state, [[3, 1, 9000]], 5000).error, 'time_future');
  assert.equal(core.applyEvents(seed, r.state, [[3, 1.5, 5000]], 6000).error, 'bad_event');
  assert.equal(core.applyEvents(seed, r.state, [[3, -1, 5000]], 6000).error, 'bad_value');
  const late = core.applyEvents(seed, r.state, [[3, ans(3), 60001]], 61000);
  assert.ok(late.ok); assert.equal(late.state.score, 2, 'answers after 60 s do not count');
});
await test('verdict: valid, review and impossible', () => {
  const base = { ...core.initialState(), answered: 40, score: 40, gapSum: 40 * 1400, gapCount: 40 };
  assert.equal(core.verdict(base).status, 'valid');
  assert.equal(core.verdict({ ...base, score: 75, gapCount: 75, gapSum: 75 * 780 }).status, 'review');
  assert.equal(core.verdict({ ...base, gapSum: 40 * 500 }).status, 'review');
  assert.equal(core.verdict({ ...base, flags: ['impossible_gap'] }).status, 'invalid');
  assert.equal(core.verdict({ ...base, score: 200 }).status, 'invalid');
});
await test('months are UTC and tie-break is score, then errors, then earliest', () => {
  assert.equal(core.monthKey(Date.parse('2026-10-31T23:59:59.999Z')), '2026-10');
  assert.equal(core.monthKey(Date.parse('2026-11-01T00:00:00Z')), '2026-11');
  assert.equal(core.prevMonth('2027-01'), '2026-12');
  assert.equal(core.monthEnd('2026-12'), Date.parse('2027-01-01T00:00:00Z'));
  const list = [{ score: 40, errors: 2, achievedAt: 5 }, { score: 40, errors: 1, achievedAt: 9 }, { score: 41, errors: 9, achievedAt: 9 }, { score: 40, errors: 1, achievedAt: 3 }];
  assert.deepEqual(list.sort(core.compareEntries).map((x) => `${x.score}/${x.errors}/${x.achievedAt}`), ['41/9/9', '40/1/3', '40/1/9', '40/2/5']);
});
await test('country team score: top 5 average, more players does not help by itself', () => {
  assert.equal(core.teamScore([50, 40]), 18);
  assert.equal(core.teamScore([30, 30, 30, 30, 30, 1, 1, 1, 1, 1, 1, 1, 1]), 30);
  assert.equal(core.teamScore(Array(500).fill(20)), 20);
});
await test('nicknames: safe names pass, offensive or identifying ones are refused', () => {
  for (const ok of ['SwiftOtter42', 'Bobby', 'Classy', 'NightGlider', 'Computer', 'SuperHeroine', 'たろう', 'ゆうき99', 'Mathéo', 'Jean-Luc', 'Chloé_7']) assert.equal(core.checkNickname(ok, BLOCKLIST), null, ok);
  const bad = { 'Fuuuuck': 'nick_offensive', 'f_u_c_k': 'nick_offensive', 'sh1t': 'nick_offensive', 'Merde12': 'nick_offensive', 'ass': 'nick_offensive', 'admin1': 'nick_reserved', 'MathSheetLab': 'nick_reserved', 'Pаul': 'nick_mixed', '0612345678': 'nick_chars', 'ab': 'nick_length', 'a b c': 'nick_chars', 'kid@mail.com': 'nick_chars', 'Lea20150612': 'nick_digits', 'ばかやろう': 'nick_offensive' };
  for (const [n, code] of Object.entries(bad)) assert.equal(core.checkNickname(n, BLOCKLIST), code, n);
  for (let i = 0; i < 200; i++) assert.equal(core.checkNickname(core.suggestNickname(), BLOCKLIST), null);
});
await test('recovery codes: 80 random bits, typed freely', () => {
  const code = core.formatRecoveryCode(new Uint8Array(16).map((_, i) => i * 7));
  assert.match(code, /^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){3}$/);
  assert.equal(core.normalizeRecoveryCode(code.toLowerCase().replace(/-/g, ' ')), code);
  assert.equal(core.normalizeRecoveryCode('ABC'), '');
});
await test('migrations/ folder matches the schema in code', () => {
  for (const m of MIGRATIONS) {
    const f = path.join(ROOT, 'migrations', `${String(m.version).padStart(4, '0')}_${m.name}.sql`);
    assert.ok(fs.existsSync(f), `missing ${f}: run node scripts/champ-migrations.mjs`);
    assert.equal(fs.readFileSync(f, 'utf8'), migrationSql(m), 'outdated migration file: run node scripts/champ-migrations.mjs');
  }
});

// ================= API =================
await test('without a D1 binding the API answers 503 not_configured (site keeps working)', async () => {
  const res = await handle(new Request(`${ORIGIN}/api/championship/status`), {}, {});
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
});
await test('profile: creation sets a secure HttpOnly cookie and gives a recovery code once', async () => {
  const E = makeEnv();
  const r = await call(E, 'POST', 'player', { body: { nickname: 'SwiftOtter42', country: 'JP' } });
  assert.equal(r.status, 201);
  assert.match(r.setCookie, /^__Host-msl_player=[0-9a-f]{64}; Path=\/; Max-Age=\d+; HttpOnly; Secure; SameSite=Strict$/);
  assert.match(r.data.recoveryCode, /^[A-Z0-9]{4}-/);
  const me = await call(E, 'GET', 'me', { cookie: r.cookie });
  assert.equal(me.data.nickname, 'SwiftOtter42');
  assert.equal(me.data.country, 'JP');
  assert.ok(!JSON.stringify(me.data).match(/"id"|player_id|recovery|token|203\.0\.113/), 'no technical id, token or IP in the profile');
  assert.equal((await call(E, 'POST', 'player', { body: { nickname: 'swiftotter42', country: 'FR' } })).data.error, 'nick_taken');
  assert.equal((await call(E, 'POST', 'player', { body: { nickname: 'Merde', country: 'FR' } })).data.error, 'nick_offensive');
  assert.equal((await call(E, 'POST', 'player', { body: { nickname: 'GoodName', country: 'XX' } })).data.error, 'bad_country');
  assert.equal((await call(E, 'POST', 'player', { cookie: r.cookie, body: { nickname: 'Another1', country: 'FR' } })).status, 409);
  // A random or stolen-looking cookie is just "not signed in".
  assert.equal((await call(E, 'GET', 'me', { cookie: '__Host-msl_player=' + 'a'.repeat(64) })).data.signedIn, false);
  const db = E.DB.raw.prepare('SELECT * FROM player_tokens').all();
  assert.ok(db.every((t) => t.token_hash !== r.cookie.split('=')[1]), 'only the hash of the token is stored');
});
await test('requests from other websites are refused (CSRF), non-JSON too, oversized bodies too', async () => {
  const E = makeEnv();
  assert.equal((await call(E, 'POST', 'player', { origin: 'https://evil.example', body: { nickname: 'Abcdef', country: 'FR' } })).status, 403);
  assert.equal((await call(E, 'POST', 'player', { origin: null, body: { nickname: 'Abcdef', country: 'FR' } })).status, 403);
  assert.equal((await call(E, 'POST', 'player', { headers: { 'Content-Type': 'text/plain' }, body: { nickname: 'Abcdef', country: 'FR' } })).status, 415);
  assert.equal((await call(E, 'POST', 'player', { rawBody: '{"x":"' + 'a'.repeat(20000) + '"}' })).status, 413);
  assert.equal((await call(E, 'POST', 'player', { rawBody: 'not json' })).status, 400);
});
await test('an honest game: the server computes the score from the answers', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const g = await play(E, p.cookie, { gap: 1500, wrong: (i) => i % 7 === 3 });
  assert.equal(g.result.status, 'valid');
  assert.equal(g.result.score, g.expect.score);
  assert.equal(g.result.errors, g.expect.errors);
  assert.ok(g.result.score > 25 && g.result.score < 40, `score ${g.result.score}`);
  const lb = await call(E, 'GET', 'leaderboard');
  assert.equal(lb.data.rows.length, 1);
  assert.equal(lb.data.rows[0].score, g.result.score);
  assert.equal(lb.data.rows[0].nickname, p.nickname);
  assert.ok(!('id' in lb.data.rows[0]) && !JSON.stringify(lb.data).includes(g.session), 'no technical id in rankings');
  const me = await call(E, 'GET', 'me', { cookie: p.cookie });
  assert.equal(me.data.month.best.rank, 1);
  assert.equal(me.data.allTime.score, g.result.score);
});
await test('a forged score sent by the browser is ignored', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const st = await call(E, 'POST', 'start', { cookie: p.cookie });
  E.clock.t += 65000;
  const f = await call(E, 'POST', 'finish', { cookie: p.cookie, body: { session: st.data.session, score: 999, errors: 0 } });
  assert.equal(f.data.result.score, 0);
  assert.equal((await call(E, 'GET', 'leaderboard')).data.rows.length, 0);
});
await test('questions come a few at a time and never include the answers', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const st = await call(E, 'POST', 'start', { cookie: p.cookie });
  assert.equal(st.data.questions.length, core.RULES.window);
  assert.deepEqual(Object.keys(st.data.questions[0]).sort(), ['a', 'b', 'i']);
  assert.ok(!JSON.stringify(st.data).match(/seed|answer|"c"/i));
  assert.match(st.data.session, /^[0-9a-f]{32}$/);
  const st2 = await call(E, 'POST', 'start', { cookie: p.cookie });
  assert.notEqual(st.data.session, st2.data.session);
});
await test('replayed batches are not counted twice; skipped batch numbers are refused', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const st = await call(E, 'POST', 'start', { cookie: p.cookie });
  const s = st.data.session, q = st.data.questions;
  const startsAt = E.clock.t + 3000;
  E.clock.t = startsAt + 3000;
  const ev = [[0, q[0].a * q[0].b, 1500], [1, q[1].a * q[1].b, 2900]];
  const a = await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: s, seq: 1, events: ev } });
  const b = await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: s, seq: 1, events: ev } });
  assert.equal(a.data.score, 2);
  assert.equal(b.data.score, 2, 'replay ignored');
  assert.equal((await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: s, seq: 5, events: [] } })).status, 409);
});
await test('answers out of order, or claimed before they could be seen, void the game', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  for (const make of [(q) => [[3, q[3].a * q[3].b, 1000]], (q) => [[0, q[0].a * q[0].b, 50000]]]) {
    const st = await call(E, 'POST', 'start', { cookie: p.cookie });
    E.clock.t += 3000 + 2000;
    const r = await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: st.data.session, seq: 1, events: make(st.data.questions) } });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, 'rejected');
    assert.equal((await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: st.data.session, seq: 2, events: [] } })).data.error, 'game_over');
    E.clock.t += 61000;
  }
  assert.equal((await call(E, 'GET', 'leaderboard')).data.rows.length, 0);
  const anomalies = E.DB.raw.prepare("SELECT COUNT(*) AS n FROM moderation_events WHERE type = 'anomaly'").get().n;
  assert.equal(anomalies, 2, 'anomalies are logged');
});
await test('inhumanly fast answers are rejected; very high scores wait for a moderator', async () => {
  const E = makeEnv();
  const bot = await newPlayer(E);
  const g1 = await play(E, bot.cookie, { gap: 60, batch: 10 });
  assert.equal(g1.result.status, 'invalid');
  const fast = await newPlayer(E);
  const g2 = await play(E, fast.cookie, { gap: 700 });
  assert.equal(g2.result.status, 'review');
  assert.ok(g2.result.score >= 70);
  const lb = await call(E, 'GET', 'leaderboard');
  assert.equal(lb.data.rows.length, 0, 'neither appears before review');
  // Admin approves the second one.
  const rv = await call(E, 'GET', 'admin/review', { headers: { Authorization: 'Bearer ' + ADMIN } });
  assert.equal(rv.data.scores.length, 1);
  const ok = await call(E, 'POST', 'admin/score', { headers: { Authorization: 'Bearer ' + ADMIN }, body: { id: rv.data.scores[0].id, action: 'approve' } });
  assert.equal(ok.status, 200);
  assert.equal((await call(E, 'GET', 'leaderboard')).data.rows[0].score, g2.result.score);
});
await test('a slow connection is not penalised: late batches inside the grace period count', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const g = await play(E, p.cookie, { gap: 2000, latency: 1800, batch: 6 });
  assert.equal(g.result.status, 'valid');
  assert.equal(g.result.score, g.expect.score);
});
await test('answers arriving after the end + grace are not counted', async () => {
  const E = makeEnv();
  const p = await newPlayer(E);
  const st = await call(E, 'POST', 'start', { cookie: p.cookie });
  const q = st.data.questions;
  E.clock.t += 3000 + 60000 + core.RULES.graceMs + 1;
  const r = await call(E, 'POST', 'answer', { cookie: p.cookie, body: { session: st.data.session, seq: 1, events: [[0, q[0].a * q[0].b, 2000]] } });
  assert.equal(r.data.over, true);
  assert.equal(r.data.result.score, 0);
});
await test("a player cannot touch someone else's game, and must be signed in", async () => {
  const E = makeEnv();
  const a = await newPlayer(E), b = await newPlayer(E);
  const st = await call(E, 'POST', 'start', { cookie: a.cookie });
  assert.equal((await call(E, 'POST', 'finish', { cookie: b.cookie, body: { session: st.data.session } })).status, 404);
  assert.equal((await call(E, 'POST', 'start', {})).status, 401);
});
await test('ranking order: score, then fewer errors, then the earliest; best score per month only', async () => {
  const E = makeEnv();
  const a = await newPlayer(E, 'FR', 'AlphaPlayer'), b = await newPlayer(E, 'JP', 'BravoPlayer'), c = await newPlayer(E, 'US', 'CharliePlay');
  const ga = await play(E, a.cookie, { gap: 1500, wrong: (i) => i === 2 });
  E.clock.t += 60000;
  const gb = await play(E, b.cookie, { gap: 1500, wrong: (i) => i === 2 });
  E.clock.t += 60000;
  const gc = await play(E, c.cookie, { gap: 1500 });
  assert.equal(ga.result.score, gb.result.score);
  E.clock.t += 60000;
  await play(E, c.cookie, { gap: 3000 }); // worse game: the best one stays
  const lb = await call(E, 'GET', 'leaderboard');
  assert.deepEqual(lb.data.rows.map((r) => r.nickname), ['CharliePlay', 'AlphaPlayer', 'BravoPlayer']);
  assert.equal(lb.data.rows[0].score, gc.result.score);
  const fr = await call(E, 'GET', 'leaderboard?country=JP');
  assert.deepEqual(fr.data.rows.map((r) => r.nickname), ['BravoPlayer']);
  const countries = await call(E, 'GET', 'countries');
  assert.equal(countries.data.rows[0].country, 'US');
  assert.equal(countries.data.rows[0].team, Math.round(gc.result.score / 5 * 10) / 10);
});
await test('monthly championship: October closes on its own, medals and titles are kept, November starts', async () => {
  const E = makeEnv('2026-10-31T23:50:00Z');
  const a = await newPlayer(E, 'FR', 'GoldenFox'), b = await newPlayer(E, 'JP', 'SilverOwl'), c = await newPlayer(E, 'CA', 'BronzeLynx'), d = await newPlayer(E, 'BR', 'FourthPanda');
  await play(E, a.cookie, { gap: 1200 });
  await play(E, b.cookie, { gap: 1400 });
  await play(E, c.cookie, { gap: 1600 });
  await play(E, d.cookie, { gap: 2000 });
  // A game started just before midnight and never finished still counts for October.
  E.clock.t = Date.parse('2026-10-31T23:58:00Z');
  const st = await call(E, 'POST', 'start', { cookie: d.cookie });
  E.clock.t += 3000 + 1000;
  const q = st.data.questions;
  await call(E, 'POST', 'answer', { cookie: d.cookie, body: { session: st.data.session, seq: 1, events: q.slice(0, 3).map((x, k) => [x.i, x.a * x.b, 300 * (k + 1) + 600]) } });
  // Just after midnight: not closed yet (games may still be running).
  E.clock.t = Date.parse('2026-11-01T00:00:30Z');
  let s = await call(E, 'GET', 'status');
  assert.equal(s.data.month, '2026-11');
  assert.equal((await call(E, 'GET', 'champions')).data.rows.length, 0);
  E.clock.t = Date.parse('2026-11-01T00:05:00Z');
  s = await call(E, 'GET', 'status');
  assert.equal(s.data.lastChampion.nickname, 'GoldenFox');
  const ch = (await call(E, 'GET', 'champions')).data.rows;
  assert.deepEqual(ch.map((r) => [r.month, r.rank, r.nickname]), [['2026-10', 1, 'GoldenFox'], ['2026-10', 2, 'SilverOwl'], ['2026-10', 3, 'BronzeLynx']]);
  const oct = await call(E, 'GET', 'leaderboard?month=2026-10');
  assert.equal(oct.data.rows.length, 4, 'full October ranking stays visible');
  assert.equal(oct.data.rows[0].titles, 1);
  // November: a new, empty board; October can no longer change.
  assert.equal((await call(E, 'GET', 'leaderboard')).data.rows.length, 0);
  await play(E, d.cookie, { gap: 900 });
  assert.equal((await call(E, 'GET', 'leaderboard?month=2026-10')).data.rows[0].nickname, 'GoldenFox');
  assert.equal((await call(E, 'GET', 'leaderboard')).data.rows[0].nickname, 'FourthPanda');
  assert.equal((await call(E, 'GET', 'leaderboard?board=alltime')).data.rows[0].nickname, 'FourthPanda');
  // A second title for the same player is counted.
  E.clock.t = Date.parse('2026-11-20T10:00:00Z');
  const second = await play(E, a.cookie, { gap: 880 });
  assert.equal(second.result.status, 'valid');
  E.clock.t = Date.parse('2026-12-01T00:10:00Z');
  await call(E, 'GET', 'status');
  const me = await call(E, 'GET', 'me', { cookie: a.cookie });
  assert.equal(me.data.titles, 2);
  assert.deepEqual(me.data.medals.map((m) => [m.month, m.rank]), [['2026-11', 1], ['2026-10', 1]]);
  assert.equal((await call(E, 'GET', 'leaderboard?month=2027-01')).status, 400, 'future months do not exist');
});
await test('moderation: invalidating a champion recomputes the closed month; bans hide a player', async () => {
  const E = makeEnv('2026-10-30T10:00:00Z');
  const cheat = await newPlayer(E, 'FR', 'SneakyOne'), honest = await newPlayer(E, 'FR', 'HonestOne'), third = await newPlayer(E, 'DE', 'ThirdOne');
  await play(E, cheat.cookie, { gap: 1000 });
  await play(E, honest.cookie, { gap: 1300 });
  await play(E, third.cookie, { gap: 1700 });
  E.clock.t = Date.parse('2026-11-01T01:00:00Z');
  await call(E, 'GET', 'status');
  assert.equal((await call(E, 'GET', 'champions')).data.rows[0].nickname, 'SneakyOne');
  const H = { Authorization: 'Bearer ' + ADMIN };
  const info = await call(E, 'GET', 'admin/player?nickname=SneakyOne', { headers: H });
  const r = await call(E, 'POST', 'admin/score', { headers: H, body: { id: info.data.scores[0].id, action: 'invalidate' } });
  assert.equal(r.status, 200);
  const ch = (await call(E, 'GET', 'champions')).data.rows;
  assert.deepEqual(ch.map((x) => x.nickname), ['HonestOne', 'ThirdOne']);
  assert.equal((await call(E, 'GET', 'me', { cookie: cheat.cookie })).data.titles, 0);
  await call(E, 'POST', 'admin/player', { headers: H, body: { nickname: 'ThirdOne', action: 'ban' } });
  assert.deepEqual((await call(E, 'GET', 'leaderboard?month=2026-10')).data.rows.map((x) => x.nickname), ['HonestOne']);
  assert.equal((await call(E, 'POST', 'start', { cookie: third.cookie })).data.error, 'banned');
  await call(E, 'POST', 'admin/player', { headers: H, body: { nickname: 'HonestOne', action: 'reset_nickname' } });
  assert.notEqual((await call(E, 'GET', 'me', { cookie: honest.cookie })).data.nickname, 'HonestOne');
  const actions = await call(E, 'GET', 'admin/actions', { headers: H });
  assert.ok(actions.data.rows.length >= 3, 'moderator actions are logged');
});
await test('reports from players reach the moderators', async () => {
  const E = makeEnv();
  const p = await newPlayer(E, 'FR', 'Reported1');
  assert.equal((await call(E, 'POST', 'report', { body: { nickname: 'reported1', reason: 'too fast <script>' } })).status, 200);
  const rv = await call(E, 'GET', 'admin/review', { headers: { Authorization: 'Bearer ' + ADMIN } });
  assert.equal(rv.data.events[0].type, 'report');
  assert.ok(!rv.data.events[0].detail.includes('<'));
  assert.ok(p);
});
await test('admin: disabled without a strong ADMIN_TOKEN, refuses wrong tokens, rate-limits guessing', async () => {
  const E0 = makeEnv('2026-10-15T12:00:00Z', { ADMIN_TOKEN: 'short' });
  assert.equal((await call(E0, 'GET', 'admin/overview', { headers: { Authorization: 'Bearer short' } })).status, 503);
  const E = makeEnv();
  assert.equal((await call(E, 'GET', 'admin/overview')).status, 401);
  let last;
  for (let i = 0; i < 12; i++) last = await call(E, 'GET', 'admin/overview', { ip: '198.51.100.7', headers: { Authorization: 'Bearer wrong' + i } });
  assert.equal(last.status, 429);
  const ok = await call(E, 'GET', 'admin/overview', { headers: { Authorization: 'Bearer ' + ADMIN } });
  assert.equal(ok.status, 200);
  assert.ok('activePlayers' in ok.data && 'byCountry' in ok.data && 'champions' in ok.data);
  const src = fs.readFileSync(path.join(ROOT, 'src/championship/client.js'), 'utf8');
  assert.ok(!src.includes(ADMIN) && !/ADMIN_TOKEN\s*=/.test(src), 'no admin credential in the browser code');
});
await test('recovery code restores the profile on a new device; guessing is rate-limited', async () => {
  const E = makeEnv();
  const p = await newPlayer(E, 'FR', 'Recoverable');
  const r = await call(E, 'POST', 'recover', { body: { code: p.code.toLowerCase() } });
  assert.equal(r.status, 200);
  assert.equal((await call(E, 'GET', 'me', { cookie: r.cookie })).data.nickname, 'Recoverable');
  let last;
  for (let i = 0; i < 11; i++) last = await call(E, 'POST', 'recover', { ip: '198.51.100.9', body: { code: 'AAAA-BBBB-CCCC-DDD' + (i % 9 + 1) } });
  assert.equal(last.status, 429);
  const nc = await call(E, 'POST', 'recovery-code', { cookie: p.cookie });
  assert.equal((await call(E, 'POST', 'recover', { body: { code: p.code } })).status, 404, 'old code no longer works');
  assert.equal((await call(E, 'POST', 'recover', { body: { code: nc.data.recoveryCode } })).status, 200);
});
await test('profile deletion removes the nickname everywhere and signs out', async () => {
  const E = makeEnv();
  const p = await newPlayer(E, 'FR', 'DeleteMe');
  await play(E, p.cookie);
  const d = await call(E, 'DELETE', 'player', { cookie: p.cookie });
  assert.equal(d.status, 200);
  assert.match(d.setCookie, /Max-Age=0/);
  assert.equal((await call(E, 'GET', 'me', { cookie: p.cookie })).data.signedIn, false);
  const lb = await call(E, 'GET', 'leaderboard');
  assert.equal(lb.data.rows[0].nickname, null);
  const row = E.DB.raw.prepare('SELECT nickname, recovery_hash FROM players').get();
  assert.equal(row.nickname, null); assert.equal(row.recovery_hash, null);
  assert.equal((await call(E, 'POST', 'player', { body: { nickname: 'DeleteMe', country: 'FR' } })).status, 201, 'nickname is free again');
});
await test('profile edits: cooldown of 7 days, same filter as creation', async () => {
  const E = makeEnv();
  const p = await newPlayer(E, 'FR', 'EditMe');
  assert.equal((await call(E, 'PATCH', 'player', { cookie: p.cookie, body: { country: 'BE' } })).status, 200);
  assert.equal((await call(E, 'PATCH', 'player', { cookie: p.cookie, body: { nickname: 'NewName' } })).data.error, 'profile_cooldown');
  E.clock.t += 8 * 86400000;
  assert.equal((await call(E, 'PATCH', 'player', { cookie: p.cookie, body: { nickname: 'Putain' } })).data.error, 'nick_offensive');
  assert.equal((await call(E, 'PATCH', 'player', { cookie: p.cookie, body: { nickname: 'NewName' } })).status, 200);
});
await test('abuse limits: profile creation per network, games per hour', async () => {
  const E = makeEnv();
  let last;
  for (let i = 0; i < 6; i++) last = await call(E, 'POST', 'player', { ip: '192.0.2.44', body: { nickname: 'Spam' + i + 'abc', country: 'FR' } });
  assert.equal(last.status, 429);
  assert.ok(Number(last.data.retryAfterSec) > 0);
  const p = await newPlayer(E);
  for (let i = 0; i < 40; i++) assert.equal((await call(E, 'POST', 'start', { cookie: p.cookie })).status, 200);
  assert.equal((await call(E, 'POST', 'start', { cookie: p.cookie })).status, 429);
  const raw = JSON.stringify(E.DB.raw.prepare('SELECT * FROM rate_limits').all());
  assert.ok(!raw.includes('192.0.2.44'), 'IP addresses are never stored');
});
await test('data retention: old games, results and logs are purged', async () => {
  const E = makeEnv('2026-01-10T10:00:00Z');
  const p = await newPlayer(E);
  await play(E, p.cookie, { gap: 1500 });
  await play(E, p.cookie, { gap: 3000 });
  E.clock.t = Date.parse('2027-03-01T10:00:00Z');
  await play(E, p.cookie, { gap: 2500 });
  const n = (sql) => E.DB.raw.prepare(sql).get().n;
  assert.equal(n("SELECT COUNT(*) AS n FROM game_sessions WHERE created_at < 1780000000000"), 0, 'old sessions purged');
  assert.equal(n('SELECT COUNT(*) AS n FROM scores'), 2, 'old non-record result purged, record kept');
});
await test('errors are logged for the admin page without leaking details to players', async () => {
  const E = makeEnv();
  await call(E, 'GET', 'status');
  const broken = { ...E.env, DB: { ...E.DB, prepare: (sql) => (/FROM months WHERE month = \?/.test(sql) && !/status/.test(sql) ? (() => { throw new Error('boom'); })() : E.DB.prepare(sql)) } };
  E.env.DB = broken.DB;
  _resetForTests();
  E.clock.t += 120000;
  const r = await call(E, 'GET', 'status');
  assert.equal(r.status, 500);
  assert.deepEqual(r.data, { error: 'server_error' });
});

// ================= load =================
await test('load: 300 games in parallel, budgets per request stay within the D1 free plan', async () => {
  const E = makeEnv();
  const players = [];
  for (let i = 0; i < 300; i++) players.push(await newPlayer(E, core.COUNTRIES[i % 50], 'Load' + i + 'x'));
  const reqBefore = reqCount(E);
  const wBefore = E.DB.stats.rowsWritten;
  const t0 = performance.now();
  // Interleave the games: each step advances every game a little.
  const clock0 = E.clock.t;
  const results = [];
  for (const [k, p] of players.entries()) {
    E.clock.t = clock0 + k; // all start within the same second
    results.push(await play(E, p.cookie, { gap: 1200 + (k % 7) * 150 }));
    E.clock.t = clock0;
  }
  const ms = performance.now() - t0;
  assert.ok(results.every((r) => r.result.status === 'valid'));
  const lb = await call(E, 'GET', 'leaderboard?page=6');
  assert.equal(lb.data.rows.length, 50);
  assert.equal(lb.data.pages, 6);
  const writes = (E.DB.stats.rowsWritten - wBefore) / players.length;
  loadReport = `300 games in ${Math.round(ms)} ms (${(ms / 300).toFixed(1)} ms per game of ~${Math.round((reqCount(E) - reqBefore) / 300)} requests), ~${writes.toFixed(0)} rows written per game, max ${maxQueries} D1 queries in one request (limit 50)`;
  assert.ok(maxQueries < 45, `max queries per request ${maxQueries}`);
  assert.ok(writes < 40, `rows written per game ${writes}`);
});
function reqCount() { return reqCounter; }

console.log(`${passed} championship tests passed${failures.length ? `, ${failures.length} failed` : ''}.`);
if (loadReport) console.log('Load: ' + loadReport);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
