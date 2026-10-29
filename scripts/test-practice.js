#!/usr/bin/env node
/*
 * Online practice tests: for every worksheet and every level, the expected answer is accepted,
 * wrong answers are refused, levels really get harder, and typical ways of typing an answer work.
 * Usage: node scripts/test-practice.js
 */
'use strict';

const MSL = require('../src/engine');
const P = require('../src/practice');
const { types } = require('../src/catalog');

let failures = 0, checked = 0;
function fail(msg) { failures++; if (failures <= 30) console.error('FAIL ' + msg); }
function expect(cond, msg) { checked++; if (!cond) fail(msg); }

// What a student types for the right answer (clock answers use two boxes).
function typed(p) {
  if (P.inputKind(p) === 'clock') return { h: String(p.h), m: String(p.m) };
  return P.expectedText(p);
}
// A wrong answer of the same shape.
function wrong(p) {
  const k = P.inputKind(p);
  if (k === 'choice') return p.answer === '<' ? '>' : '<';
  if (k === 'clock') return { h: String(p.h % 12 + 1), m: String(p.m) };
  if (k === 'fraction') { const t = P.expectedText(p); return /\//.test(t) ? t.replace(/(\d+)$/, (d) => String(+d + 1)) : String(+t + 1); }
  const t = P.expectedText(p);
  if (/ \+ /.test(t)) return t.replace(/^\d/, (d) => String((+d % 9) + 1));
  if (/ R\d+$/.test(t)) return t.replace(/R(\d+)$/, (m, r) => 'R' + (+r + 1));
  const n = P._test.parseNumber(t);
  return n === null ? t + 'x' : String(n + 1);
}

for (const t of types) {
  const type = { gen: t.gen, params: t.params };
  const avg = {};
  for (const level of P.LEVELS) {
    let sum = 0;
    for (let seed = 100000; seed < 100040; seed++) {
      const qs = P.questions(MSL, type, seed, 10, level);
      expect(qs.length === 10, `${t.slug} ${level}: ${qs.length} questions`);
      for (const p of qs) {
        sum += P.difficulty(p);
        const ok = P.check(p, typed(p));
        expect(ok.ok, `${t.slug} ${level}: right answer refused ${JSON.stringify(typed(p))} for ${JSON.stringify(p)}`);
        const bad = P.check(p, wrong(p));
        expect(!bad.ok, `${t.slug} ${level}: wrong answer accepted ${JSON.stringify(wrong(p))} for ${JSON.stringify(p)}`);
        expect(!P.check(p, '').ok, `${t.slug}: empty answer accepted`);
      }
    }
    avg[level] = sum;
    // Same seed, same questions (teacher links rely on this).
    expect(JSON.stringify(P.questions(MSL, type, 123456, 10, level)) === JSON.stringify(P.questions(MSL, type, 123456, 10, level)), `${t.slug} ${level}: not deterministic`);
  }
  expect(avg.easy <= avg.medium && avg.medium <= avg.hard, `${t.slug}: levels not increasing ${JSON.stringify(avg)}`);
}

// Typical ways of typing an answer.
const c = (p, s) => P.check(p, s);
const h = (answer) => ({ kind: 'h', text: '', answer });
const cases = [
  [h('1,000'), '1000', true], [h('1,000'), '1 000', true], [h('−12'), '-12', true], [h('−12'), '−12', true], [h('−12'), '(−12)', true],
  [h('3.5'), '3.50', true], [h('3.5'), '.5', false], [h('0.5'), '.5', true], [h('7'), ' 7 ', true], [h('7'), '7.', true],
  [{ kind: 'v', a: '$1.00', b: '$2.50', op: '+', answer: '$3.50' }, '3.50', true],
  [{ kind: 'v', a: '$1.00', b: '$2.50', op: '+', answer: '$3.50' }, '$3.5', true],
  [{ kind: 'ld', dividend: 75, divisor: 6, answer: '12 R3' }, '12 R3', true],
  [{ kind: 'ld', dividend: 75, divisor: 6, answer: '12 R3' }, '12r3', true],
  [{ kind: 'ld', dividend: 75, divisor: 6, answer: '12 R3' }, '12 remainder 3', true],
  [{ kind: 'ld', dividend: 75, divisor: 6, answer: '12 R3' }, '12', false],
  [{ kind: 'ld', dividend: 72, divisor: 6, answer: '12' }, '12 R0', true],
  [h('300 + 40 + 5'), '5 + 40 + 300', true], [h('300 + 40 + 5'), '345', false], [h('3,000 + 5'), '3000+5', true],
  [{ kind: 'f', a: [1, 4], op: '+', b: [3, 4], answer: { w: 1, n: 0, d: 1 } }, '1', true],
  [{ kind: 'f', a: [1, 4], op: '+', b: [3, 4], answer: { w: 1, n: 0, d: 1 } }, '4/4', false],
  [{ kind: 'f', a: [3, 4], op: '+', b: [3, 4], answer: { w: 1, n: 1, d: 2 } }, '1 1/2', true],
  [{ kind: 'f', a: [3, 4], op: '+', b: [3, 4], answer: { w: 1, n: 1, d: 2 } }, '3/2', false],
  [{ kind: 'f', a: [3, 4], op: '+', b: [3, 4], answer: { w: 1, n: 1, d: 2 } }, '1 2/4', false],
  [{ kind: 'f', a: [1, 4], op: '+', b: [1, 4], answer: { w: 0, n: 1, d: 2 } }, '1 / 2', true],
  [{ kind: 'fs', a: [4, 8], answer: [1, 2] }, '1/2', true], [{ kind: 'fs', a: [4, 8], answer: [1, 2] }, '2/4', false],
  [{ kind: 'fm', a: { w: 1, n: 3, d: 4 }, answer: [7, 4] }, '7/4', true], [{ kind: 'fm', a: { w: 1, n: 3, d: 4 }, answer: [7, 4] }, '1 3/4', false],
  [{ kind: 'fm', a: [7, 4], answer: { w: 1, n: 3, d: 4 } }, '1 3/4', true], [{ kind: 'fm', a: [7, 4], answer: { w: 1, n: 3, d: 4 } }, '7/4', false],
  [{ kind: 'clk', h: 3, m: 0, answer: '3:00' }, { h: '3', m: '' }, true], [{ kind: 'clk', h: 3, m: 5, answer: '3:05' }, { h: '3', m: '05' }, true],
  [{ kind: 'clk', h: 3, m: 5, answer: '3:05' }, { h: '3', m: '' }, false], [{ kind: 'clk', h: 3, m: 5, answer: '3:05' }, '3:05', true],
  [h('<'), '<', true], [h('<'), '>', false]
];
for (const [p, input, want] of cases) expect(c(p, input).ok === want, `typed ${JSON.stringify(input)} for ${JSON.stringify(p.answer)}: expected ${want}`);
// "Almost" hints: right value, wrong form.
expect(!!c(cases[22][0], '3/2').almost, 'improper instead of mixed gives a hint');
expect(!!c({ kind: 'fs', a: [4, 8], answer: [1, 2] }, '2/4').almost, 'unsimplified fraction gives a hint');
expect(!!c({ kind: 'ld', dividend: 75, divisor: 6, answer: '12 R3' }, '12').almost, 'missing remainder gives a hint');

console.log(`${checked} practice checks, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
