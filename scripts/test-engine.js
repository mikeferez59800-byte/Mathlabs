#!/usr/bin/env node
/*
 * Checks every worksheet type over many seeds:
 *  - answers are recomputed independently and must match the answer key,
 *  - the rules promised on each page hold (regrouping, no negatives, remainders...),
 *  - the same seed always gives the same sheet.
 */
'use strict';

const MSL = require('../src/engine');
const { types } = require('../src/catalog');
const { explain } = require('../src/explain');

const SEEDS = 300;
let checked = 0;
const failures = [];
const fail = (t, seed, p, why) => { if (failures.length < 30) failures.push(`${t.slug} seed=${seed}: ${why} -> ${JSON.stringify(p)}`); };

const num = (s) => Number(String(s).replace(/−/g, '-').replace(/[(),]/g, ''));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const fracVal = (f) => f[0] / f[1];
const ansVal = (a) => (typeof a === 'string' ? num(a) : a.w + (a.n ? a.n / a.d : 0));
const close = (x, y) => Math.abs(x - y) < 1e-9;
const parseH = (text) => text.replace(/<sup>(\d+)<\/sup>/, '^$1').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/[,=:]/g, '').trim();

function evalExpr(expr) {
  // Only digits, spaces, parentheses, + - * / ^ are allowed here (from our own generator).
  if (!/^[\d\s()+\-*/^.]+$/.test(expr)) throw new Error('unexpected expression ' + expr);
  return Function('"use strict";return (' + expr.replace(/\^/g, '**') + ')')();
}

function carry(a, b) { const x = String(a).split('').reverse(), y = String(b).split('').reverse(); for (let i = 0; i < Math.max(x.length, y.length); i++) if (+(x[i] || 0) + +(y[i] || 0) > 9) return true; return false; }
function borrow(a, b) { const x = String(a).split('').reverse(), y = String(b).split('').reverse(); for (let i = 0; i < y.length; i++) if (+(x[i] || 0) < +y[i]) return true; return false; }

function checkProblem(t, seed, p) {
  const P = t.params || {};
  switch (p.kind) {
    case 'v': {
      const a = num(p.a), b = num(p.b), ans = num(p.answer);
      const exp = p.op === '+' ? a + b : p.op === '−' ? a - b : a * b;
      if (!close(Math.round(exp * 1e6) / 1e6, ans)) fail(t, seed, p, `wrong answer, expected ${exp}`);
      if (ans < 0) fail(t, seed, p, 'negative answer');
      if (t.gen === 'add') {
        if (String(a).length !== P.da || String(b).length !== P.db) fail(t, seed, p, 'wrong digit count');
        if (P.regroup === 'none' && carry(a, b)) fail(t, seed, p, 'regrouping present');
        if (P.regroup === 'force' && !carry(a, b)) fail(t, seed, p, 'no regrouping');
      }
      if (t.gen === 'sub') {
        if (String(a).length !== P.da) fail(t, seed, p, 'wrong digit count');
        if (P.borrow === 'none' && borrow(a, b)) fail(t, seed, p, 'borrowing present');
        if (P.borrow === 'force' && !borrow(a, b)) fail(t, seed, p, 'no borrowing');
      }
      if (t.gen === 'addWithin' && ans > P.max) fail(t, seed, p, 'sum above max');
      if (t.gen === 'decimal' && !/^\d+\.\d{2}$/.test(p.answer)) fail(t, seed, p, 'decimal format');
      break;
    }
    case 'h': {
      const text = parseH(p.text);
      if (t.gen === 'round') {
        const n = num(p.text.match(/Round ([\d,]+)/)[1]);
        if (num(p.answer) !== Math.round(n / P.to) * P.to) fail(t, seed, p, 'bad rounding');
        break;
      }
      if (t.gen === 'compareNumbers') {
        const [a, b] = p.text.split(' ___ ').map(num);
        if (p.answer !== (a > b ? '>' : a < b ? '<' : '=')) fail(t, seed, p, 'bad compare');
        break;
      }
      if (t.gen === 'expanded') {
        const n = num(p.text.replace('=', ''));
        const sum = p.answer.split(' + ').map(num).reduce((x, y) => x + y, 0);
        if (sum !== n) fail(t, seed, p, 'expanded sum mismatch');
        break;
      }
      if (t.gen === 'percentOf') {
        const m = p.text.match(/(\d+)% of (\d+)/);
        if (!close(+m[1] * +m[2] / 100, num(p.answer))) fail(t, seed, p, 'bad percent');
        if (!Number.isInteger(num(p.answer))) fail(t, seed, p, 'non-integer percent answer');
        break;
      }
      if (text.includes('___')) {
        const [lhs, rhs] = p.text.split(' = ');
        const filled = lhs.replace('___', p.answer);
        if (evalExpr(parseH(filled)) !== num(rhs)) fail(t, seed, p, 'missing addend wrong');
        if (num(p.answer) < 0) fail(t, seed, p, 'negative');
        break;
      }
      const v = evalExpr(text.replace(/\^(\d+)/, '**$1').replace(/\*\*/g, '^'));
      if (!close(v, num(p.answer))) fail(t, seed, p, `wrong answer, expected ${v}`);
      if (t.gen !== 'integers' && t.gen !== 'intMult' && v < 0) fail(t, seed, p, 'negative');
      if (!Number.isInteger(v)) fail(t, seed, p, 'non-integer');
      break;
    }
    case 'ld': {
      const q = Math.floor(p.dividend / p.divisor), r = p.dividend % p.divisor;
      if (p.answer !== (r ? `${q} R${r}` : String(q))) fail(t, seed, p, 'long division answer');
      if (P.remainder && !r) fail(t, seed, p, 'expected remainder');
      if (!P.remainder && r) fail(t, seed, p, 'unexpected remainder');
      if (String(p.dividend).length !== P.dd || String(p.divisor).length !== P.dv) fail(t, seed, p, 'digit count');
      break;
    }
    case 'f': {
      const a = fracVal(p.a), b = fracVal(p.b);
      const exp = p.op === '+' ? a + b : p.op === '−' ? a - b : p.op === '×' ? a * b : a / b;
      if (!close(exp, ansVal(p.answer))) fail(t, seed, p, `fraction answer, expected ${exp}`);
      if (exp < 0) fail(t, seed, p, 'negative fraction');
      if (p.answer.n && (gcd(p.answer.n, p.answer.d) !== 1 || p.answer.n >= p.answer.d)) fail(t, seed, p, 'answer not simplified');
      if (t.gen === 'fracLike' && p.a[1] !== p.b[1]) fail(t, seed, p, 'denominators differ');
      if (t.gen === 'fracUnlike' && p.a[1] === p.b[1]) fail(t, seed, p, 'denominators equal');
      break;
    }
    case 'fs':
      if (!close(fracVal(p.a), fracVal(p.answer)) || gcd(p.answer[0], p.answer[1]) !== 1) fail(t, seed, p, 'simplify');
      if (gcd(p.a[0], p.a[1]) === 1) fail(t, seed, p, 'already simplest');
      break;
    case 'fc': {
      const d = p.a[0] * p.b[1] - p.b[0] * p.a[1];
      if (p.answer !== (d > 0 ? '>' : d < 0 ? '<' : '=')) fail(t, seed, p, 'compare fractions');
      break;
    }
    default: fail(t, seed, p, 'unknown kind');
  }
  checked++;
}

for (const t of types) {
  for (let s = 0; s < SEEDS; s++) {
    const seed = 100000 + s * 2971;
    for (const count of t.counts) {
      const probs = MSL.generate(t, seed, count);
      if (probs.length !== count) fail(t, seed, null, 'wrong count');
      probs.forEach((p) => checkProblem(t, seed, p));
      if (s % 10 === 0) probs.forEach((p) => {
        // Worked examples must reach the same answer as the answer key and contain no broken values.
        const ex = explain(t, p);
        if (ex.answer.replace(/,/g, '') !== ex.expected.replace(/,/g, '')) fail(t, seed, p, `worked example gives ${ex.answer}, key says ${ex.expected}`);
        if (!ex.steps.length || ex.steps.some((x) => /NaN|undefined|Infinity/.test(x))) fail(t, seed, p, 'broken worked example text');
      });
    }
  }
  const a = JSON.stringify(MSL.generate(t, 424242, t.count)), b = JSON.stringify(MSL.generate(t, 424242, t.count));
  if (a !== b) fail(t, 424242, null, 'not deterministic');
  if (t.gen === 'multTable') {
    const facts = new Set(MSL.generate(t, 777777, 13).map((p) => p.answer));
    if (facts.size !== 13) fail(t, 777777, null, 'times table does not cover all 13 facts');
  }
  // Rendering must not throw and must contain each problem.
  const html = MSL.renderSheet(t, MSL.generate(t, 123456, t.count), { answers: true, seed: 123456 });
  if ((html.match(/class="pr /g) || []).length !== t.count) fail(t, 123456, null, 'render count');
}

if (failures.length) {
  console.error(`FAILED (${failures.length} shown):\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`Engine OK: ${checked.toLocaleString('en-US')} problems checked across ${types.length} worksheet types.`);
