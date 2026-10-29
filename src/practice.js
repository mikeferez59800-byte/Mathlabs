/*
 * Online practice: difficulty levels and answer checking.
 * Shared by the browser (window.MSL.practice) and the Node tests (module.exports).
 * Problems come from the same generators as the printable sheets (engine.js); a level only
 * chooses easier or harder problems among those the worksheet already produces, so a page
 * never drifts off its topic.
 */
(function (root) {
  'use strict';

  var LEVELS = ['easy', 'medium', 'hard'];
  var POOL = 8; // candidates drawn per question before picking by difficulty

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  // ---------- Difficulty ----------
  // Size of the numbers involved (log scale) plus one point per carry or borrow.
  function digitsOf(n) { return String(n).split('').reverse().map(Number); }
  function regroupings(a, b, op) {
    if (!/^\d+$/.test(String(a)) || !/^\d+$/.test(String(b))) return 0;
    var x = digitsOf(a), y = digitsOf(b), c = 0, k = 0;
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      if (op === '+') { var s = (x[i] || 0) + (y[i] || 0) + c; c = s > 9 ? 1 : 0; k += c; }
      else if (op === '−') { var d = (x[i] || 0) - (y[i] || 0) - c; c = d < 0 ? 1 : 0; k += c; }
    }
    return k;
  }
  // Operands only (the answer is left out); 0 and 1 make a fact trivial, so they lower the score.
  function difficulty(p) {
    var q = {};
    for (var key in p) if (key !== 'answer') q[key] = p[key];
    var nums = JSON.stringify(q).replace(/<[^>]*>/g, ' ').replace(/(\d),(?=\d{3})/g, '$1').match(/\d+(\.\d+)?/g) || [];
    var score = 0;
    for (var i = 0; i < nums.length; i++) {
      var n = Number(nums[i]);
      score += n <= 1 ? -0.7 : Math.log(n + 1) / Math.LN10;
    }
    if (p.kind === 'v') score += 1.5 * regroupings(p.a, p.b, p.op);
    var m = p.kind === 'h' && /^(\d+) ([+\u2212]) (\d+) =$/.exec(p.text);
    if (m && regroupings(m[1], m[3], m[2])) score += 1; // crossing ten (e.g. 8 + 5, 13 - 6)
    if (p.kind === 'f' && p.a[1] !== p.b[1]) score += 1;
    if (p.kind === 'ld' && / R/.test(p.answer)) score += 0.5;
    return score;
  }

  // Questions for one practice round. 'medium' is the worksheet's normal mix; 'easy' and 'hard'
  // keep the lower or upper 40% of a larger pool, ranked by difficulty. Deterministic for a seed.
  function questions(MSL, type, seed, count, level) {
    var lvl = LEVELS.indexOf(level) === -1 ? 'medium' : level;
    var pool = MSL.generate(type, seed, count * POOL);
    var seen = {}, unique = [];
    for (var i = 0; i < pool.length; i++) {
      var k = JSON.stringify(pool[i]);
      if (!seen[k]) { seen[k] = true; unique.push(pool[i]); }
    }
    var pick;
    if (lvl === 'medium') pick = unique.slice();
    else {
      var ranked = unique.map(function (p, j) { return { p: p, s: difficulty(p), j: j }; })
        .sort(function (a, b) { return a.s - b.s || a.j - b.j; });
      var cut = Math.max(count, Math.ceil(ranked.length * 0.4));
      ranked = lvl === 'easy' ? ranked.slice(0, cut) : ranked.slice(-cut);
      // Back to generation order so the round is not sorted from easiest to hardest.
      pick = ranked.sort(function (a, b) { return a.j - b.j; }).map(function (x) { return x.p; });
    }
    var out = pick.slice(0, count);
    // Small topics (e.g. one times table) may have fewer distinct problems than asked: repeat them.
    for (var r = 0; out.length < count && pick.length; r++) out.push(pick[r % pick.length]);
    return out;
  }

  // ---------- Reading answers ----------
  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/[−–—]/g, '-')       // typographic minus and dashes
      .replace(/ /g, ' ')
      .replace(/\$/g, '')
      .replace(/(\d),(?=\d{3}(\D|$))/g, '$1')      // thousands separators
      .replace(/\s+/g, ' ')
      .trim();
  }
  function parseNumber(s) {
    var c = clean(s).replace(/^\((-?[\d.]+)\)$/, '$1').replace(/\s/g, '');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(c)) return null;
    return Number(c);
  }
  // Fraction typed as "3/4", "1 3/4", "-3/4" or a whole number. Returns { neg, w, n, d } or null.
  function parseFraction(s) {
    var c = clean(s), m;
    var neg = c.charAt(0) === '-';
    if (neg) c = c.slice(1).trim();
    if ((m = c.match(/^(\d+)$/))) return { neg: neg, w: +m[1], n: 0, d: 1, mixed: false, frac: false };
    if ((m = c.match(/^(\d+) ?\/ ?(\d+)$/)) && +m[2] > 0) return { neg: neg, w: 0, n: +m[1], d: +m[2], mixed: false, frac: true };
    if ((m = c.match(/^(\d+) (\d+) ?\/ ?(\d+)$/)) && +m[3] > 0) return { neg: neg, w: +m[1], n: +m[2], d: +m[3], mixed: true, frac: true };
    return null;
  }
  function fracValue(f) { var v = [f.w * f.d + f.n, f.d]; if (f.neg) v[0] = -v[0]; return v; }
  function sameValue(a, b) { return a[0] * b[1] === b[0] * a[1]; }

  // ---------- Expected answer ----------
  // What the answer key shows, as plain text a student could type.
  function expectedText(p) {
    var a = p.answer;
    if (p.kind === 'f' || (p.kind === 'fm' && !Array.isArray(a))) {
      if (typeof a === 'string') return a;
      if (a.n === 0) return String(a.w);
      return (a.w ? a.w + ' ' : '') + a.n + '/' + a.d;
    }
    if (p.kind === 'fs' || p.kind === 'fm') return a[0] + '/' + a[1];
    return String(a).replace(/−/g, '-');
  }

  // How the answer is entered: 'choice' (<, >, =), 'clock' (hours and minutes), 'fraction' or 'text'.
  function inputKind(p) {
    if (p.answer === '<' || p.answer === '>' || p.answer === '=') return 'choice';
    if (p.kind === 'clk') return 'clock';
    if (p.kind === 'f' || p.kind === 'fs' || p.kind === 'fm') return 'fraction';
    return 'text';
  }

  // ---------- Checking ----------
  // Returns { ok: true } or { ok: false, almost: '<hint>' } when the value is right but the form is not
  // (not simplified, not a mixed number...). An "almost" answer can be corrected without penalty.
  function check(p, input) {
    var kind = inputKind(p);
    if (kind === 'choice') return { ok: clean(input) === p.answer };
    if (kind === 'clock') {
      var h = typeof input === 'object' ? input.h : String(input).split(':')[0];
      var m = typeof input === 'object' ? input.m : String(input).split(':')[1];
      var hn = parseNumber(h), mn = m === '' || m == null ? (p.m === 0 ? 0 : null) : parseNumber(m);
      return { ok: hn === p.h && mn === p.m };
    }
    if (kind === 'fraction') return checkFraction(p, input);
    var exp = expectedText(p);
    if (/ R\d+$/.test(exp) || p.kind === 'ld') return checkRemainder(exp, input);
    if (/ \+ /.test(exp)) return checkSum(exp, input);
    var en = parseNumber(exp), inN = parseNumber(input);
    if (en !== null) return { ok: inN !== null && Math.abs(en - inN) < 1e-9 };
    return { ok: clean(input).toLowerCase() === clean(exp).toLowerCase() };
  }
  function checkRemainder(exp, input) {
    var e = exp.match(/^(\d+)(?: R(\d+))?$/), q = +e[1], r = +(e[2] || 0);
    var c = clean(input).toLowerCase().replace(/remainder|rem/g, 'r');
    var m = c.match(/^(\d+) ?(?:r ?(\d+))?$/);
    if (!m) return { ok: false };
    var ok = +m[1] === q && +(m[2] || 0) === r;
    if (!ok && +m[1] === q && r && !m[2]) return { ok: false, almost: 'The quotient is right. Now write the remainder too, like 12 R3.' };
    return { ok: ok };
  }
  function checkSum(exp, input) {
    var parts = function (s) { return clean(s).split('+').map(function (x) { return parseNumber(x); }); };
    var e = parts(exp), g = parts(input);
    if (g.some(function (x) { return x === null; })) return { ok: false };
    var sort = function (arr) { return arr.slice().sort(function (a, b) { return b - a; }).join(','); };
    if (sort(e) === sort(g)) return { ok: true };
    var total = function (arr) { return arr.reduce(function (s, x) { return s + x; }, 0); };
    if (g.length === 1 && total(e) === g[0]) return { ok: false, almost: 'Write the number as a sum of place values, like 300 + 40 + 5.' };
    return { ok: false };
  }
  function checkFraction(p, input) {
    var f = parseFraction(input);
    if (!f) return { ok: false };
    var a = p.answer, want;
    if (Array.isArray(a)) want = { w: 0, n: a[0], d: a[1] };
    else if (typeof a === 'string') return { ok: clean(input) === clean(a) };
    else want = a;
    var wantV = [want.w * want.d + want.n, want.d];
    if (!sameValue(fracValue(f), wantV)) return { ok: false };
    var reduced = gcd(f.n, f.d) === 1 || f.n === 0;
    if (p.kind === 'fm' && Array.isArray(a)) {
      // Mixed number to improper fraction.
      if (f.mixed || !f.frac) return { ok: false, almost: 'Right value! Now write it as an improper fraction, like 7/4.' };
      return reduced ? { ok: true } : { ok: false, almost: 'Right value! Now simplify the fraction.' };
    }
    if (!reduced) return { ok: false, almost: 'Right value! Now simplify the fraction.' };
    if (want.n === 0) return f.frac ? { ok: false, almost: 'Right value! Write it as a whole number.' } : { ok: true };
    if (want.w > 0 && !f.mixed) return { ok: false, almost: 'Right value! Now write it as a mixed number, like 1 3/4.' };
    return { ok: true };
  }

  var api = {
    LEVELS: LEVELS,
    questions: questions,
    difficulty: difficulty,
    check: check,
    expectedText: expectedText,
    inputKind: inputKind,
    _test: { clean: clean, parseNumber: parseNumber, parseFraction: parseFraction }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MSL = root.MSL || {}; root.MSL.practice = api; }
})(typeof self !== 'undefined' ? self : this);
