/*
 * MathSheetLab worksheet engine.
 * Shared by the browser (window.MSL) and the Node build/tests (module.exports).
 * Every worksheet is fully determined by (generator, params, seed, count),
 * so a link with ?s=<seed> always reproduces the same problems.
 */
(function (root) {
  'use strict';

  // ---------- Random numbers ----------
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    var r = mulberry32(seed);
    var rng = {
      next: r,
      int: function (min, max) { return min + Math.floor(r() * (max - min + 1)); },
      pick: function (arr) { return arr[Math.floor(r() * arr.length)]; },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(r() * (i + 1));
          var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      }
    };
    return rng;
  }
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 900000 + 100000;
  }
  function randomSeed() { return Math.floor(Math.random() * 900000) + 100000; }

  // ---------- Number helpers ----------
  function nDigits(rng, d) {
    if (d <= 1) return rng.int(0, 9);
    return rng.int(Math.pow(10, d - 1), Math.pow(10, d) - 1);
  }
  function digitsOf(n) { return String(n).split('').reverse().map(Number); }
  function hasCarry(a, b) {
    var x = digitsOf(a), y = digitsOf(b), c = 0;
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var s = (x[i] || 0) + (y[i] || 0) + c;
      if (s > 9) return true;
      c = 0;
    }
    return false;
  }
  function hasBorrow(a, b) {
    var x = digitsOf(a), y = digitsOf(b);
    for (var i = 0; i < y.length; i++) if ((x[i] || 0) < y[i]) return true;
    return false;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function simplify(n, d) { var g = gcd(n, d); return [n / g, d / g]; }
  function fmtDec(x, places) {
    var s = x.toFixed(places);
    return s;
  }
  function trimDec(x) {
    var s = x.toFixed(6);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function fmtInt(n) { return n < 0 ? '(−' + Math.abs(n) + ')' : String(n); }
  function minus(n) { return n < 0 ? '−' + Math.abs(n) : String(n); }

  // Retry helper: draws until predicate holds (bounded).
  function draw(fn, ok) {
    for (var i = 0; i < 500; i++) { var v = fn(); if (ok(v)) return v; }
    return fn();
  }

  // ---------- Problem shapes ----------
  // vertical:   { kind:'v', a, b, op, answer }
  // horizontal: { kind:'h', text, answer }
  // longdiv:    { kind:'ld', dividend, divisor, answer }
  // fraction:   { kind:'f', a:[n,d], op, b:[n,d], answer:{n,d,w} | string }
  // fsimp:      { kind:'fs', a:[n,d], answer:[n,d] }
  // fcmp:       { kind:'fc', a:[n,d], b:[n,d], answer:'<'|'>'|'=' }

  var G = {};

  G.addWithin = function (rng, p) {
    var a = rng.int(p.min || 0, p.max), b = rng.int(0, p.max - a);
    if (p.minB) b = Math.max(b, Math.min(p.minB, p.max - a));
    return p.layout === 'v' ? { kind: 'v', a: a, b: b, op: '+', answer: a + b }
      : { kind: 'h', text: a + ' + ' + b + ' =', answer: String(a + b) };
  };

  G.add = function (rng, p) {
    var pair = draw(function () { return [nDigits(rng, p.da), nDigits(rng, p.db)]; }, function (v) {
      if (p.regroup === 'none') return !hasCarry(v[0], v[1]);
      if (p.regroup === 'force') return hasCarry(v[0], v[1]);
      return true;
    });
    return { kind: 'v', a: pair[0], b: pair[1], op: '+', answer: pair[0] + pair[1] };
  };

  G.addThree = function (rng, p) {
    var a = rng.int(1, p.max), b = rng.int(1, p.max), c = rng.int(1, p.max);
    return { kind: 'h', text: a + ' + ' + b + ' + ' + c + ' =', answer: String(a + b + c) };
  };

  G.subWithin = function (rng, p) {
    var a = rng.int(p.min || 0, p.max), b = rng.int(0, a);
    return p.layout === 'v' ? { kind: 'v', a: a, b: b, op: '−', answer: a - b }
      : { kind: 'h', text: a + ' − ' + b + ' =', answer: String(a - b) };
  };

  G.sub = function (rng, p) {
    var pair = draw(function () { return [nDigits(rng, p.da), nDigits(rng, p.db)]; }, function (v) {
      if (v[0] < v[1]) return false;
      if (String(v[0]).length < p.da) return false;
      if (p.borrow === 'none') return !hasBorrow(v[0], v[1]);
      if (p.borrow === 'force') return hasBorrow(v[0], v[1]);
      return true;
    });
    return { kind: 'v', a: pair[0], b: pair[1], op: '−', answer: pair[0] - pair[1] };
  };

  G.missingAdd = function (rng, p) {
    var a = rng.int(0, p.max), b = rng.int(0, p.max - a), c = a + b;
    if (rng.next() < 0.5) return { kind: 'h', text: a + ' + ___ = ' + c, answer: String(b) };
    return { kind: 'h', text: '___ + ' + b + ' = ' + c, answer: String(a) };
  };

  // Multiplication table of one number: cycles 0..max in shuffled order.
  G.multTable = function (rng, p, i, state) {
    if (!state.bag || !state.bag.length) {
      state.bag = [];
      for (var k = p.from != null ? p.from : 1; k <= p.to; k++) state.bag.push(k);
      rng.shuffle(state.bag);
    }
    var k2 = state.bag.pop();
    var swap = p.swap && rng.next() < 0.5;
    var text = swap ? k2 + ' × ' + p.table + ' =' : p.table + ' × ' + k2 + ' =';
    return { kind: 'h', text: text, answer: String(p.table * k2) };
  };
  G.multTable.allowRepeats = true; // each cycle covers every fact once; skip de-duplication

  G.multFacts = function (rng, p) {
    var a = rng.int(p.min || 0, p.max), b = rng.int(p.min || 0, p.max);
    return p.layout === 'v' ? { kind: 'v', a: a, b: b, op: '×', answer: a * b }
      : { kind: 'h', text: a + ' × ' + b + ' =', answer: String(a * b) };
  };

  G.mult = function (rng, p) {
    var a = nDigits(rng, p.da), b = nDigits(rng, p.db);
    if (p.db === 1) b = rng.int(2, 9);
    return { kind: 'v', a: a, b: b, op: '×', answer: a * b };
  };

  G.divFacts = function (rng, p) {
    var d = rng.int(p.min || 1, p.max), q = rng.int(p.qmin || 0, p.max);
    return { kind: 'h', text: (d * q) + ' ÷ ' + d + ' =', answer: String(q) };
  };

  G.longDiv = function (rng, p) {
    var v = draw(function () {
      var divisor = p.dv === 1 ? rng.int(2, 9) : nDigits(rng, p.dv);
      var dividend = nDigits(rng, p.dd);
      if (!p.remainder) dividend = dividend - (dividend % divisor);
      return [dividend, divisor];
    }, function (x) {
      var r = x[0] % x[1];
      if (x[0] < x[1] * 2 || String(x[0]).length < p.dd) return false;
      return p.remainder ? r !== 0 : r === 0;
    });
    var q = Math.floor(v[0] / v[1]), r = v[0] % v[1];
    return { kind: 'ld', dividend: v[0], divisor: v[1], answer: r ? q + ' R' + r : String(q) };
  };

  function mixed(n, d) {
    var s = simplify(n, d), w = 0;
    n = s[0]; d = s[1];
    if (n >= d && d !== 1) { w = Math.floor(n / d); n = n % d; }
    if (d === 1) return { w: n, n: 0, d: 1 };
    return { w: w, n: n, d: d };
  }

  G.fracLike = function (rng, p) {
    var d = rng.int(3, p.maxDen);
    var op = p.op === 'mix' ? rng.pick(['+', '−']) : p.op;
    var a = rng.int(1, d - 1), b = rng.int(1, d - 1);
    if (op === '−' && a < b) { var t = a; a = b; b = t; }
    if (op === '−' && a === b) { a = Math.min(d - 1, a + 1); b = Math.max(1, a - 1); }
    var n = op === '+' ? a + b : a - b;
    return { kind: 'f', a: [a, d], op: op, b: [b, d], answer: mixed(n, d) };
  };

  G.fracUnlike = function (rng, p) {
    var v = draw(function () {
      return [rng.int(2, p.maxDen), rng.int(2, p.maxDen)];
    }, function (x) { return x[0] !== x[1]; });
    var op = p.op === 'mix' ? rng.pick(['+', '−']) : p.op;
    var L = lcm(v[0], v[1]);
    // Equal fractions (1/3 and 2/6) would make a zero difference: redraw rather than switch the sign.
    var ab = draw(function () {
      return [[rng.int(1, v[0] - 1), v[0]], [rng.int(1, v[1] - 1), v[1]]];
    }, function (x) { return op !== '−' || x[0][0] * L / x[0][1] !== x[1][0] * L / x[1][1]; });
    var a = ab[0], b = ab[1];
    var an = a[0] * L / a[1], bn = b[0] * L / b[1];
    if (op === '−' && an < bn) { var t = a; a = b; b = t; t = an; an = bn; bn = t; }
    var n = op === '+' ? an + bn : an - bn;
    return { kind: 'f', a: a, op: op, b: b, answer: mixed(n, L) };
  };

  G.fracMult = function (rng, p) {
    var a = [rng.int(1, p.maxDen - 1), rng.int(2, p.maxDen)], b = [rng.int(1, p.maxDen - 1), rng.int(2, p.maxDen)];
    var op = p.op || '×';
    var n, d;
    if (op === '÷') { n = a[0] * b[1]; d = a[1] * b[0]; }
    else { n = a[0] * b[0]; d = a[1] * b[1]; }
    return { kind: 'f', a: a, op: op, b: b, answer: mixed(n, d) };
  };

  G.fracSimplify = function (rng, p) {
    var v = draw(function () {
      var d = rng.int(2, p.maxDen), n = rng.int(1, d - 1), k = rng.int(2, p.maxK);
      return [n, d, k];
    }, function (x) { return gcd(x[0], x[1]) === 1; });
    return { kind: 'fs', a: [v[0] * v[2], v[1] * v[2]], answer: [v[0], v[1]] };
  };

  G.fracCompare = function (rng, p) {
    var a = [0, 1], b = [0, 1];
    var v = draw(function () {
      var d1 = rng.int(2, p.maxDen), d2 = p.sameDen ? d1 : rng.int(2, p.maxDen);
      a = [rng.int(1, d1 - 1), d1]; b = [rng.int(1, d2 - 1), d2];
      return a[0] * b[1] - b[0] * a[1];
    }, function (x) { return x !== 0 || rng.next() < 0.1; });
    return { kind: 'fc', a: a, b: b, answer: v > 0 ? '>' : v < 0 ? '<' : '=' };
  };

  G.decimal = function (rng, p) {
    var f = Math.pow(10, p.places);
    var op = p.op;
    var a = rng.int(f, p.max * f) / f, b = rng.int(f, p.max * f) / f;
    if (op === '−' && a < b) { var t = a; a = b; b = t; }
    var ans = op === '+' ? a + b : a - b;
    return { kind: 'v', a: fmtDec(a, p.places), b: fmtDec(b, p.places), op: op, answer: fmtDec(ans, p.places) };
  };

  G.decimalMult = function (rng, p) {
    var a = rng.int(11, p.maxA * 10) / 10, b = p.whole ? rng.int(2, 9) : rng.int(11, 99) / 10;
    var ans = Math.round(a * b * 100) / 100;
    return { kind: 'v', a: fmtDec(a, 1), b: p.whole ? String(b) : fmtDec(b, 1), op: '×', answer: trimDec(ans) };
  };

  G.round = function (rng, p) {
    var to = p.to;
    var n = draw(function () { return rng.int(p.min, p.max); }, function (x) { return x % to !== 0; });
    var r = Math.round(n / to) * to;
    var label = to === 10 ? 'ten' : to === 100 ? 'hundred' : to === 1000 ? 'thousand' : String(to);
    return { kind: 'h', text: 'Round ' + n.toLocaleString('en-US') + ' to the nearest ' + label + ':', answer: r.toLocaleString('en-US') };
  };

  G.integers = function (rng, p) {
    var a = rng.int(-p.max, p.max), b = rng.int(-p.max, p.max);
    var op = p.op === 'mix' ? rng.pick(['+', '−']) : p.op;
    var ans = op === '+' ? a + b : a - b;
    return { kind: 'h', text: minus(a) + ' ' + op + ' ' + fmtInt(b) + ' =', answer: minus(ans) };
  };

  G.intMult = function (rng, p) {
    var a = rng.int(-p.max, p.max), b = rng.int(-p.max, p.max);
    if (p.op === '÷') {
      if (b === 0) b = rng.pick([-1, 1]) * rng.int(1, p.max);
      return { kind: 'h', text: minus(a * b) + ' ÷ ' + fmtInt(b) + ' =', answer: minus(a) };
    }
    return { kind: 'h', text: minus(a) + ' × ' + fmtInt(b) + ' =', answer: minus(a * b) };
  };

  // Order of operations: each pattern carries its own evaluator (no eval).
  var OPS_PATTERNS = {
    plain: [
      ['a + b \u00d7 c', function (a, b, c) { return a + b * c; }],
      ['a \u00d7 b + c', function (a, b, c) { return a * b + c; }],
      ['a \u2212 b \u00d7 c', function (a, b, c) { return a - b * c; }],
      ['a + b \u00f7 c', function (a, b, c) { return a + b / c; }],
      ['a \u00d7 b \u2212 c', function (a, b, c) { return a * b - c; }]
    ],
    parens: [
      ['(a + b) \u00d7 c', function (a, b, c) { return (a + b) * c; }],
      ['a \u00d7 (b + c)', function (a, b, c) { return a * (b + c); }],
      ['(a \u2212 b) \u00d7 c', function (a, b, c) { return (a - b) * c; }],
      ['a + b \u00d7 c', function (a, b, c) { return a + b * c; }],
      ['(a + b) \u00f7 c', function (a, b, c) { return (a + b) / c; }],
      ['a \u00d7 b \u2212 c', function (a, b, c) { return a * b - c; }]
    ]
  };
  G.orderOps = function (rng, p) {
    var list = p.parens ? OPS_PATTERNS.parens : OPS_PATTERNS.plain;
    return draw(function () {
      var pat = rng.pick(list), a = rng.int(1, 12), b = rng.int(1, 12), c = rng.int(1, 9);
      // make divisions exact
      if (pat[0] === 'a + b \u00f7 c') b = c * rng.int(1, 9);
      if (pat[0] === '(a + b) \u00f7 c') { var s = c * rng.int(1, 9); a = rng.int(0, s); b = s - a; }
      var val = pat[1](a, b, c);
      var expr = pat[0].replace('a', a).replace('b', b).replace('c', c);
      return { kind: 'h', text: expr + ' =', answer: String(val), _v: val };
    }, function (x) { return x._v >= 0 && Number.isInteger(x._v); });
  };

  G.percentOf = function (rng, p) {
    var pct = rng.pick(p.percents), step = pct % 10 === 0 ? 10 : 20;
    var base = step * rng.int(1, Math.floor(p.maxBase / step));
    var ans = base * pct / 100;
    return { kind: 'h', text: pct + '% of ' + base + ' =', answer: trimDec(ans) };
  };

  G.exponents = function (rng, p) {
    var b = rng.int(p.minBase || 1, p.maxBase), e = rng.int(p.minExp || 2, p.maxExp);
    return { kind: 'h', text: b + '<sup>' + e + '</sup> =', html: true, answer: String(Math.pow(b, e)) };
  };

  G.compareNumbers = function (rng, p) {
    var a = rng.int(p.min, p.max), b = rng.next() < 0.1 ? a : rng.int(p.min, p.max);
    return { kind: 'h', text: a.toLocaleString('en-US') + ' ___ ' + b.toLocaleString('en-US'), answer: a > b ? '>' : a < b ? '<' : '=' };
  };

  G.expanded = function (rng, p) {
    var n = nDigits(rng, p.digits);
    var parts = String(n).split('').map(function (ch, i, arr) {
      return Number(ch) * Math.pow(10, arr.length - 1 - i);
    }).filter(function (x) { return x > 0; }).map(function (x) { return x.toLocaleString('en-US'); });
    return { kind: 'h', text: n.toLocaleString('en-US') + ' =', answer: parts.join(' + ') };
  };

  // ---------- Week 3 generators ----------
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  // Analog clock: p.step = minutes between possible times (60, 30, 15 or 5).
  G.clock = function (rng, p) {
    var h = rng.int(1, 12), m = p.step * rng.int(0, 60 / p.step - 1);
    return { kind: 'clk', h: h, m: m, answer: h + ':' + pad2(m) };
  };

  // Multiply or divide by 10, 100 or 1,000.
  G.pow10 = function (rng, p) {
    var k = rng.pick([10, 100, 1000]);
    if (p.op === '÷') {
      var a = rng.int(1, 9999);
      return { kind: 'h', text: a.toLocaleString('en-US') + ' ÷ ' + k.toLocaleString('en-US') + ' =', answer: trimDec(a / k) };
    }
    var b = rng.next() < 0.3 ? rng.int(11, 999) / 10 : rng.int(2, 999);
    return { kind: 'h', text: trimDec(b) + ' × ' + k.toLocaleString('en-US') + ' =', answer: (Math.round(b * k * 10) / 10).toLocaleString('en-US') };
  };

  // Decimal (tenths or hundredths) divided by a one-digit whole number, exact quotient.
  G.decDiv = function (rng, p) {
    var f = Math.pow(10, p.places), d = rng.int(2, 9);
    var q = draw(function () { return rng.int(f + 1, p.maxQ * f); }, function (x) { return (x * d) % 10 !== 0; });
    return { kind: 'h', text: fmtDec(q * d / f, p.places) + ' ÷ ' + d + ' =', answer: trimDec(q / f) };
  };

  // Equations in x. p.type: 'addsub', 'muldiv' or 'two'.
  var X = '<i>x</i>';
  function eq(left, right, x) {
    return { kind: 'h', html: true, text: '<span>' + left + ' = ' + right + '</span><span class="eq-gap"></span><span>' + X + ' =</span> ___', answer: String(x) };
  }
  G.equation = function (rng, p) {
    var x, a, b;
    if (p.type === 'addsub') {
      x = rng.int(0, 30); a = rng.int(1, 30);
      switch (rng.int(0, 2)) {
        case 0: return eq(X + ' + ' + a, String(x + a), x);
        case 1: return eq(a + ' + ' + X, String(x + a), x);
        default: x = rng.int(a, a + 30); return eq(X + ' − ' + a, String(x - a), x);
      }
    }
    if (p.type === 'muldiv') {
      x = rng.int(1, 12); a = rng.int(2, 12);
      return rng.next() < 0.6 ? eq(a + X, String(a * x), x) : eq(X + ' ÷ ' + a, String(x), a * x);
    }
    x = rng.int(1, 12); a = rng.int(2, 9); b = rng.int(1, 20);
    if (rng.next() < 0.5) return eq(a + X + ' + ' + b, String(a * x + b), x);
    x = rng.int(Math.ceil((b + 1) / a), 15);
    return eq(a + X + ' − ' + b, String(a * x - b), x);
  };

  // Money in column form.
  function dollars(c) { return '$' + (c / 100).toFixed(2); }
  G.money = function (rng, p) {
    var a = rng.int(100, p.max * 100), b = rng.int(100, p.max * 100);
    if (p.op === '−' && a < b) { var t = a; a = b; b = t; }
    return { kind: 'v', a: dollars(a), b: dollars(b), op: p.op, answer: dollars(p.op === '+' ? a + b : a - b) };
  };

  // Unit conversions. Each unit pair: [big, small, factor].
  var UNITS = {
    metric: [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['L', 'mL', 1000]],
    customary: [['ft', 'in', 12], ['yd', 'ft', 3], ['yd', 'in', 36], ['lb', 'oz', 16], ['gal', 'qt', 4], ['qt', 'pt', 2], ['pt', 'cups', 2]]
  };
  G.convert = function (rng, p) {
    var u = rng.pick(UNITS[p.system]), n = rng.int(2, 12);
    if (rng.next() < 0.5) return { kind: 'h', text: n + ' ' + u[0] + ' = ___ ' + u[1], answer: (n * u[2]).toLocaleString('en-US') };
    return { kind: 'h', text: (n * u[2]).toLocaleString('en-US') + ' ' + u[1] + ' = ___ ' + u[0], answer: String(n) };
  };

  // Mixed numbers and improper fractions.
  G.mixedNumbers = function (rng, p) {
    var d = rng.int(2, p.maxDen), n = draw(function () { return rng.int(1, d - 1); }, function (x) { return gcd(x, d) === 1; });
    var w = rng.int(1, p.maxWhole);
    if (p.to === 'improper') return { kind: 'fm', a: { w: w, n: n, d: d }, answer: [w * d + n, d] };
    return { kind: 'fm', a: [w * d + n, d], answer: { w: w, n: n, d: d } };
  };

  G.gcf = function (rng, p) {
    var v = draw(function () { return [rng.int(2, p.maxG), rng.int(1, 9), rng.int(1, 9)]; },
      function (x) { return x[1] !== x[2] && gcd(x[1], x[2]) === 1; });
    return { kind: 'h', text: 'GCF of ' + v[0] * v[1] + ' and ' + v[0] * v[2] + ' =', answer: String(v[0]) };
  };

  G.lcm = function (rng, p) {
    var v = draw(function () { return [rng.int(2, p.max), rng.int(2, p.max)]; }, function (x) { return x[0] !== x[1]; });
    return { kind: 'h', text: 'LCM of ' + v[0] + ' and ' + v[1] + ' =', answer: String(lcm(v[0], v[1])) };
  };

  // ---------- Build a worksheet ----------
  function generate(type, seed, count) {
    var rng = makeRng(seed);
    var fn = G[type.gen];
    if (!fn) throw new Error('Unknown generator: ' + type.gen);
    var out = [], seen = {}, state = {};
    for (var i = 0; i < count; i++) {
      var prob, key, tries = 0;
      do {
        prob = fn(rng, type.params || {}, i, state);
        key = JSON.stringify(prob);
        tries++;
      } while (seen[key] && !fn.allowRepeats && tries < 25);
      seen[key] = true;
      delete prob._v;
      out.push(prob);
    }
    return out;
  }

  // ---------- HTML rendering ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function frac(f) {
    return '<span class="fr"><span class="fr-n">' + f[0] + '</span><span class="fr-d">' + f[1] + '</span></span>';
  }
  function fracAnswer(a) {
    if (typeof a === 'string') return esc(a);
    if (a.n === 0) return String(a.w);
    return (a.w ? '<span class="fr-w">' + a.w + '</span>' : '') + frac([a.n, a.d]);
  }
  function mixedHtml(m) {
    return '<span class="fr-w">' + m.w + '</span>' + frac([m.n, m.d]);
  }
  // Analog clock face as inline SVG (hands computed from the time).
  function clockSvg(h, m) {
    var out = '<svg class="clk" viewBox="0 0 100 100" role="img" aria-label="Clock face"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#111" stroke-width="2.5"/>';
    for (var i = 0; i < 60; i++) {
      var a = i * Math.PI / 30, big = i % 5 === 0, r1 = big ? 40 : 43;
      out += '<line x1="' + (50 + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (50 - r1 * Math.cos(a)).toFixed(2) + '" x2="' + (50 + 46 * Math.sin(a)).toFixed(2) + '" y2="' + (50 - 46 * Math.cos(a)).toFixed(2) + '" stroke="#111" stroke-width="' + (big ? 1.8 : 0.7) + '"/>';
    }
    for (var n = 1; n <= 12; n++) {
      var b = n * Math.PI / 6;
      out += '<text x="' + (50 + 34 * Math.sin(b)).toFixed(2) + '" y="' + (50 - 34 * Math.cos(b) + 3.2).toFixed(2) + '" text-anchor="middle" font-size="9" font-family="Arial, sans-serif" fill="#111">' + n + '</text>';
    }
    var ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
    out += '<line x1="50" y1="50" x2="' + (50 + 18 * Math.sin(ha)).toFixed(2) + '" y2="' + (50 - 18 * Math.cos(ha)).toFixed(2) + '" stroke="#111" stroke-width="4" stroke-linecap="round"/>';
    out += '<line x1="50" y1="50" x2="' + (50 + 28 * Math.sin(ma)).toFixed(2) + '" y2="' + (50 - 28 * Math.cos(ma)).toFixed(2) + '" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>';
    return out + '<circle cx="50" cy="50" r="2.6" fill="#111"/></svg>';
  }
  function answerHtml(p) {
    switch (p.kind) {
      case 'fm': return p.answer.w !== undefined ? mixedHtml(p.answer) : frac(p.answer);
      case 'f': return fracAnswer(p.answer);
      case 'fs': return frac(p.answer);
      default: return esc(String(p.answer));
    }
  }
  function problemHtml(p, withAnswer) {
    var ans = withAnswer ? '<span class="ans">' + answerHtml(p) + '</span>' : '';
    switch (p.kind) {
      case 'v':
        return '<div class="pv"><span class="pv-a">' + esc(p.a) + '</span>' +
          '<span class="pv-b"><span class="pv-op">' + p.op + '</span>' + esc(p.b) + '</span>' +
          '<span class="pv-line" aria-hidden="true"></span>' +
          '<span class="pv-ans">' + (withAnswer ? answerHtml(p) : '&nbsp;') + '</span></div>';
      case 'ld':
        return '<div class="pld"><span class="pld-q">' + (withAnswer ? esc(p.answer) : '&nbsp;') + '</span>' +
          '<span class="pld-row"><span class="pld-dv">' + p.divisor + '</span>' +
          '<span class="pld-dd">' + p.dividend + '</span></span></div>';
      case 'f':
        return '<div class="ph pf">' + frac(p.a) + '<span class="op">' + p.op + '</span>' + frac(p.b) +
          '<span class="op">=</span>' + (withAnswer ? '<span class="ans">' + answerHtml(p) + '</span>' : '<span class="blank"></span>') + '</div>';
      case 'fs':
        return '<div class="ph pf">' + frac(p.a) + '<span class="op">=</span>' +
          (withAnswer ? '<span class="ans">' + answerHtml(p) + '</span>' : '<span class="blank"></span>') + '</div>';
      case 'fm':
        return '<div class="ph pf">' + (p.a.w !== undefined ? mixedHtml(p.a) : frac(p.a)) + '<span class="op">=</span>' +
          (withAnswer ? '<span class="ans">' + answerHtml(p) + '</span>' : '<span class="blank"></span>') + '</div>';
      case 'clk':
        return '<div class="pclk">' + clockSvg(p.h, p.m) + '<span class="clk-ans">' +
          (withAnswer ? '<span class="ans">' + esc(p.answer) + '</span>' : '<span class="blank sm"></span> : <span class="blank sm"></span>') + '</span></div>';
      case 'fc':
        return '<div class="ph pf">' + frac(p.a) + (withAnswer ? '<span class="ans cmp">' + esc(p.answer) + '</span>' : '<span class="cmp-box"></span>') + frac(p.b) + '</div>';
      default:
        var text = p.html ? p.text : esc(p.text);
        if (text.indexOf('___') !== -1) {
          return '<div class="ph">' + text.replace('___', withAnswer ? '<span class="ans fill">' + esc(p.answer) + '</span>' : '<span class="blank sm"></span>') + '</div>';
        }
        return '<div class="ph">' + text + ' ' + (withAnswer ? ans : '<span class="blank"></span>') + '</div>';
    }
  }

  function renderSheet(type, problems, o) {
    o = o || {};
    var cols = o.cols || type.cols || 4;
    var title = esc(o.title || type.sheetTitle || type.h1);
    var head = '<header class="sh-head"><div class="sh-title">' + title + (o.answers ? ' <span class="sh-key">Answer key</span>' : '') + '</div>' +
      (o.answers ? '' : '<div class="sh-fields"><span>Name: <i></i></span><span>Date: <i></i></span><span>Score: <i class="short"></i> / ' + problems.length + '</span></div>') +
      (type.instruction && !o.answers ? '<p class="sh-ins">' + esc(type.instruction) + '</p>' : '') +
      '</header>';
    var items = problems.map(function (p, i) {
      return '<li class="pr pr-' + p.kind + '"><span class="pn">' + (i + 1) + '.</span>' + problemHtml(p, !!o.answers) + '</li>';
    }).join('');
    var foot = '<footer class="sh-foot"><span>' + esc(o.siteName || '') + '</span><span>Worksheet #' + (o.seed || '') + '</span></footer>';
    return '<div class="sheet' + (o.answers ? ' sheet-key' : '') + (o.large ? ' sheet-lg' : '') + '" style="--cols:' + cols + '">' +
      head + '<ol class="sh-grid">' + items + '</ol>' + foot + '</div>';
  }

  var api = {
    makeRng: makeRng,
    hashString: hashString,
    randomSeed: randomSeed,
    generate: generate,
    renderSheet: renderSheet,
    renderProblem: problemHtml,
    generators: G,
    _test: { hasCarry: hasCarry, hasBorrow: hasBorrow, gcd: gcd, simplify: simplify, mixed: mixed }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MSL = api;
})(typeof self !== 'undefined' ? self : this);
