/*
 * Worked examples: turns one generated problem into step-by-step explanation text.
 * Used at build time only (build.js). Every explanation ends with the same answer as the
 * answer key; scripts/test-engine.js checks this for every worksheet type.
 */
'use strict';

const MINUS = '−';
const TIMES = '×';
const DIV = '÷';

const num = (s) => Number(String(s).replace(new RegExp(MINUS, 'g'), '-').replace(/[(),]/g, ''));
const fmt = (n) => (n < 0 ? MINUS + Math.abs(n).toLocaleString('en-US') : n.toLocaleString('en-US'));
const paren = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => (a / gcd(a, b)) * b;
const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
const digits = (n) => String(n).split('').reverse().map(Number);
const frac = (f) => `${f[0]}/${f[1]}`;

// ---------- fractions ----------
function finishFraction(n, d, steps) {
  const g = gcd(n, d);
  if (g > 1) {
    steps.push(`Simplify: divide the top and bottom by ${g}. ${n}/${d} = ${n / g}/${d / g}.`);
    n /= g; d /= g;
  }
  if (d === 1) return String(n);
  if (n > d) {
    const w = Math.floor(n / d), r = n % d;
    steps.push(`${n}/${d} is more than 1: ${n} ${DIV} ${d} = ${w} remainder ${r}, so ${n}/${d} = ${w} ${r}/${d}.`);
    return `${w} ${r}/${d}`;
  }
  return `${n}/${d}`;
}
function fracAnswerText(a) {
  if (typeof a === 'string') return a;
  if (a.n === 0) return String(a.w);
  return (a.w ? a.w + ' ' : '') + `${a.n}/${a.d}`;
}

// ---------- column arithmetic ----------
function columnAdd(a, b) {
  const x = digits(a), y = digits(b), steps = [];
  let carry = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const s = (x[i] || 0) + (y[i] || 0) + carry;
    const parts = [x[i] || 0, y[i] || 0].concat(carry ? [carry] : []);
    const place = PLACES[i] || `column ${i + 1}`;
    const what = `${cap(place)}: ${parts.join(' + ')} = ${s}${carry ? ' (including the carried 1)' : ''}.`;
    carry = s > 9 ? 1 : 0;
    steps.push(s > 9 && i < Math.max(x.length, y.length) - 1
      ? `${what} Write ${s % 10} and carry 1 to the ${PLACES[i + 1]}.`
      : s > 9 ? `${what} Write ${s}.` : `${what} Write ${s}.`);
  }
  return steps;
}
function columnSub(a, b) {
  const x = digits(a), y = digits(b), steps = [];
  let borrow = 0;
  for (let i = 0; i < x.length; i++) {
    let top = x[i] - borrow;
    const bottom = y[i] || 0;
    const place = cap(PLACES[i] || `column ${i + 1}`);
    const lent = borrow ? ` (the ${x[i]} became ${top} after lending 1)` : '';
    if (top < bottom) {
      steps.push(`${place}: ${top}${lent} is smaller than ${bottom}, so borrow 1 from the ${PLACES[i + 1]}: ${top + 10} ${MINUS} ${bottom} = ${top + 10 - bottom}.`);
      top += 10; borrow = 1;
    } else {
      if (i >= y.length && !borrow && i === x.length - 1 && top === 0) break;
      steps.push(`${place}: ${top}${lent} ${MINUS} ${bottom} = ${top - bottom}.`);
      borrow = 0;
    }
  }
  return steps;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- order of operations ----------
function solveExpression(expr) {
  const steps = [];
  let e = expr.replace(new RegExp(TIMES, 'g'), '*').replace(new RegExp(DIV, 'g'), '/').replace(new RegExp(MINUS, 'g'), '-');
  const show = (s) => s.replace(/\*/g, TIMES).replace(/\//g, DIV).replace(/ - /g, ` ${MINUS} `);
  const calc = (a, op, b) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
  const reduce = (s, ops, label) => {
    const re = new RegExp(`(\\d+) ([${ops.replace('-', '\\-')}]) (\\d+)`);
    let m;
    while ((m = s.match(re))) {
      const v = calc(+m[1], m[2], +m[3]);
      s = s.replace(m[0], String(v));
      steps.push(`${label}: ${show(m[0])} = ${v}${s.trim() !== String(v) ? `, which gives ${show(s)}` : ''}.`);
    }
    return s;
  };
  let pm;
  while ((pm = e.match(/\(([^()]+)\)/))) {
    const inner = reduce(reduce(pm[1], '*/', 'Parentheses first'), '+-', 'Parentheses first');
    e = e.replace(pm[0], inner);
  }
  e = reduce(e, '*/', 'Multiply or divide before adding or subtracting');
  e = reduce(e, '+-', 'Then add or subtract from left to right');
  return { steps, value: Number(e) };
}

// ---------- per generator ----------
const X = {};

X.add = (p) => ({ steps: columnAdd(num(p.a), num(p.b)), answer: String(p.answer) });

X.decimal = (p) => {
  const places = (String(p.a).split('.')[1] || '').length;
  const f = Math.pow(10, places);
  const A = Math.round(num(p.a) * f), B = Math.round(num(p.b) * f);
  const isAdd = p.op === '+';
  const steps = [`Line up the decimal points so tenths sit under tenths and hundredths under hundredths.`,
    `Work as with whole numbers: ${A} ${isAdd ? '+' : MINUS} ${B} = ${isAdd ? A + B : A - B}.`,
    `Put the decimal point back, ${places} places from the right: ${p.answer}.`];
  return { steps, answer: String(p.answer) };
};

X.sub = (p) => ({ steps: columnSub(num(p.a), num(p.b)).concat([`Check: ${p.answer} + ${p.b} = ${p.a}.`]), answer: String(p.answer) });

X.addWithin = (p) => {
  const [a, b] = p.text.replace('=', '').split(' + ').map(num), s = a + b;
  const big = Math.max(a, b), small = Math.min(a, b);
  if (big < 10 && s > 10) {
    const need = 10 - big;
    return { answer: p.answer, steps: [`${big} needs ${need} more to make 10.`, `Split ${small} into ${need} + ${small - need}.`, `${big} + ${need} = 10, then 10 + ${small - need} = ${s}.`] };
  }
  return { answer: p.answer, steps: [`Start at the larger number, ${big}.`, small ? `Count on ${small}: ${Array.from({ length: Math.min(small, 6) }, (_, i) => big + i + 1).join(', ')}${small > 6 ? ', …' : ''}.` : 'Adding 0 changes nothing.', `${a} + ${b} = ${s}.`] };
};

X.addThree = (p) => {
  const n = p.text.replace('=', '').split(' + ').map(num);
  let order = [0, 1, 2];
  for (const [i, j, k] of [[0, 1, 2], [0, 2, 1], [1, 2, 0]]) if (n[i] + n[j] === 10) { order = [i, j, k]; break; }
  const [i, j, k] = order, first = n[i] + n[j];
  return { answer: p.answer, steps: [`Add two numbers first${first === 10 ? ' (they make 10)' : ''}: ${n[i]} + ${n[j]} = ${first}.`, `Then add the last one: ${first} + ${n[k]} = ${first + n[k]}.`] };
};

X.subWithin = (p) => {
  const [a, b] = p.text.replace('=', '').split(MINUS).map(num), d = a - b;
  if (a > 10 && b < 10 && d < 10 && b > a - 10) {
    const toTen = a - 10;
    return { answer: p.answer, steps: [`Subtract through ten. First take ${toTen} away to reach 10: ${a} ${MINUS} ${toTen} = 10.`, `${b} = ${toTen} + ${b - toTen}, so take ${b - toTen} more: 10 ${MINUS} ${b - toTen} = ${d}.`] };
  }
  return { answer: p.answer, steps: [`Think addition: ${b} + ? = ${a}.`, `${b} + ${d} = ${a}, so ${a} ${MINUS} ${b} = ${d}.`] };
};

X.missingAdd = (p) => {
  const [lhs, rhs] = p.text.split(' = ');
  const total = num(rhs), known = num(lhs.replace('___', '').replace('+', ''));
  return { answer: p.answer, steps: [`The missing number is the total minus the number you know: ${total} ${MINUS} ${known} = ${total - known}.`, `Check: ${lhs.replace('___', String(total - known))} = ${total}.`] };
};

function multFact(a, b) {
  if (a === 0 || b === 0) return [`Any number times 0 is 0.`];
  if (a === 1 || b === 1) return [`Any number times 1 is itself.`];
  const big = Math.max(a, b), small = Math.min(a, b);
  const list = Array.from({ length: small }, (_, i) => big * (i + 1));
  return [`${a} ${TIMES} ${b} means ${small} groups of ${big} (the order does not matter).`, `Skip count by ${big}, ${small} times: ${list.join(', ')}.`];
}
X.multTable = X.multFacts = (p) => {
  const [a, b] = p.text.replace('=', '').split(TIMES).map(num);
  return { answer: p.answer, steps: multFact(a, b).concat([`${a} ${TIMES} ${b} = ${a * b}.`]) };
};

X.mult = (p) => {
  const a = num(p.a), b = num(p.b), steps = [];
  if (b < 10) {
    const x = digits(a);
    let carry = 0;
    x.forEach((d, i) => {
      const v = d * b + carry;
      const last = i === x.length - 1;
      steps.push(`${cap(PLACES[i])}: ${d} ${TIMES} ${b} = ${d * b}${carry ? `, plus the carried ${carry} = ${v}` : ''}. ${last ? `Write ${v}.` : `Write ${v % 10}${v > 9 ? ` and carry ${Math.floor(v / 10)}` : ''}.`}`);
      carry = Math.floor(v / 10);
    });
  } else {
    const ones = b % 10, tens = Math.floor(b / 10);
    steps.push(`Multiply by the ones digit: ${a} ${TIMES} ${ones} = ${a * ones}.`);
    steps.push(`Multiply by the tens digit, written with a zero on the right: ${a} ${TIMES} ${tens}0 = ${a * tens * 10}.`);
    steps.push(`Add the two partial products: ${a * ones} + ${a * tens * 10} = ${a * b}.`);
  }
  return { steps, answer: String(p.answer) };
};

X.decimalMult = (p) => {
  const pa = (String(p.a).split('.')[1] || '').length, pb = (String(p.b).split('.')[1] || '').length;
  const A = Math.round(num(p.a) * 10 ** pa), B = Math.round(num(p.b) * 10 ** pb), k = pa + pb;
  return { answer: p.answer, steps: [`Ignore the decimal points and multiply: ${A} ${TIMES} ${B} = ${A * B}.`, `Count the decimal places in the two numbers: ${pa} + ${pb} = ${k}.`, `Place the decimal point ${k} place${k > 1 ? 's' : ''} from the right${(A * B) % 10 === 0 ? ' and drop the trailing zero' : ''}: ${p.answer}.`] };
};

X.divFacts = (p) => {
  const [n, d] = p.text.replace('=', '').split(DIV).map(num);
  return { answer: p.answer, steps: [`Think multiplication: ${d} ${TIMES} ? = ${n}.`, `${d} ${TIMES} ${n / d} = ${n}, so ${n} ${DIV} ${d} = ${n / d}.`] };
};

X.longDiv = (p) => {
  const d = p.divisor, ds = String(p.dividend).split('').map(Number), steps = [];
  let cur = 0, started = false, q = '';
  ds.forEach((digit, i) => {
    cur = cur * 10 + digit;
    if (!started && cur < d) {
      if (i < ds.length - 1) steps.push(`${d} does not go into ${cur}, so look at the first ${i + 2} digits.`);
      return;
    }
    started = true;
    const k = Math.floor(cur / d), rest = cur - k * d;
    q += k;
    const next = ds[i + 1];
    steps.push(`${d} goes into ${cur} ${k} time${k === 1 ? '' : 's'}: ${k} ${TIMES} ${d} = ${k * d}, and ${cur} ${MINUS} ${k * d} = ${rest}.${next !== undefined ? ` Bring down the ${next} to make ${rest * 10 + next}.` : ''}`);
    cur = rest;
  });
  steps.push(cur ? `Nothing is left to bring down, so the remainder is ${cur}: the answer is ${p.answer}.` : `Nothing is left over: the answer is ${p.answer}.`);
  steps.push(`Check: ${q} ${TIMES} ${d}${cur ? ` + ${cur}` : ''} = ${p.dividend}.`);
  return { steps, answer: String(p.answer) };
};

X.fracLike = (p) => {
  const d = p.a[1], add = p.op === '+';
  const n = add ? p.a[0] + p.b[0] : p.a[0] - p.b[0];
  const steps = [`The denominators are the same (${d}), so keep ${d} and ${add ? 'add' : 'subtract'} the numerators: ${p.a[0]} ${add ? '+' : MINUS} ${p.b[0]} = ${n}. That gives ${n}/${d}.`];
  return { steps, answer: finishFraction(n, d, steps) };
};

X.fracUnlike = (p) => {
  const L = lcm(p.a[1], p.b[1]), an = p.a[0] * L / p.a[1], bn = p.b[0] * L / p.b[1], add = p.op === '+';
  const steps = [`Find a common denominator: the least common multiple of ${p.a[1]} and ${p.b[1]} is ${L}.`,
    `Rewrite both fractions: ${frac(p.a)} = ${an}/${L} and ${frac(p.b)} = ${bn}/${L}.`,
    `${add ? 'Add' : 'Subtract'} the numerators: ${an} ${add ? '+' : MINUS} ${bn} = ${add ? an + bn : an - bn}, so the result is ${add ? an + bn : an - bn}/${L}.`];
  return { steps, answer: finishFraction(add ? an + bn : an - bn, L, steps) };
};

X.fracMult = (p) => {
  const steps = [];
  let b = p.b;
  if (p.op === DIV) {
    b = [p.b[1], p.b[0]];
    steps.push(`To divide by ${frac(p.b)}, multiply by its reciprocal ${frac(b)}: ${frac(p.a)} ${TIMES} ${frac(b)}.`);
  }
  const n = p.a[0] * b[0], d = p.a[1] * b[1];
  steps.push(`Multiply the numerators (${p.a[0]} ${TIMES} ${b[0]} = ${n}) and the denominators (${p.a[1]} ${TIMES} ${b[1]} = ${d}): ${n}/${d}.`);
  return { steps, answer: finishFraction(n, d, steps) };
};

X.fracSimplify = (p) => {
  const [n, d] = p.a, g = gcd(n, d);
  return { answer: frac(p.answer), steps: [`Find the greatest common factor of ${n} and ${d}: it is ${g}.`, `Divide both by ${g}: ${n} ${DIV} ${g} = ${n / g} and ${d} ${DIV} ${g} = ${d / g}.`, `${frac(p.a)} = ${n / g}/${d / g}, and ${n / g} and ${d / g} have no common factor left.`] };
};

X.fracCompare = (p) => {
  const x = p.a[0] * p.b[1], y = p.b[0] * p.a[1];
  return { answer: p.answer, steps: [`Cross-multiply: ${p.a[0]} ${TIMES} ${p.b[1]} = ${x} and ${p.b[0]} ${TIMES} ${p.a[1]} = ${y}.`, `This is the same as writing both fractions over ${p.a[1] * p.b[1]}: ${x}/${p.a[1] * p.b[1]} and ${y}/${p.a[1] * p.b[1]}.`, `${x} ${p.answer} ${y}, so ${frac(p.a)} ${p.answer} ${frac(p.b)}.`] };
};

X.round = (p) => {
  const m = p.text.match(/Round ([\d,]+) to the nearest (\w+)/);
  const n = num(m[1]), to = { ten: 10, hundred: 100, thousand: 1000 }[m[2]];
  const look = Math.floor((n % to) / (to / 10));
  const lookName = { 10: 'ones', 100: 'tens', 1000: 'hundreds' }[to];
  const down = Math.floor(n / to) * to;
  return { answer: p.answer, steps: [`${fmt(n)} is between ${fmt(down)} and ${fmt(down + to)}.`, `Look at the ${lookName} digit: ${look}. ${look >= 5 ? 'It is 5 or more, so round up' : 'It is 4 or less, so round down'}.`, `${fmt(n)} rounds to ${p.answer}.`] };
};

X.compareNumbers = (p) => {
  const [a, b] = p.text.split(' ___ ').map(num);
  if (a === b) return { answer: p.answer, steps: [`Every digit is the same, so the numbers are equal.`] };
  const sa = String(a), sb = String(b);
  if (sa.length !== sb.length) return { answer: p.answer, steps: [`${fmt(sa.length > sb.length ? a : b)} has more digits, so it is larger.`, `${fmt(a)} ${p.answer} ${fmt(b)}.`] };
  let i = 0;
  while (sa[i] === sb[i]) i++;
  const place = PLACES[sa.length - 1 - i];
  return { answer: p.answer, steps: [`Both numbers have ${sa.length} digits, so compare from the left.`, `The first different place is the ${place}: ${sa[i]} and ${sb[i]}.`, `${sa[i]} ${p.answer} ${sb[i]}, so ${fmt(a)} ${p.answer} ${fmt(b)}.`] };
};

X.expanded = (p) => {
  const n = num(p.text.replace('=', ''));
  const s = String(n);
  const parts = s.split('').map((ch, i) => `${ch} ${PLACES[s.length - 1 - i]}${ch === '0' ? ' (worth 0, so leave it out)' : ` = ${fmt(Number(ch) * 10 ** (s.length - 1 - i))}`}`);
  return { answer: p.answer, steps: [`Read each digit with its place value: ${parts.join('; ')}.`, `Add the values: ${fmt(n)} = ${p.answer}.`] };
};

X.integers = (p) => {
  const m = p.text.match(/^(\S+) ([+−]) (\S+) =$/);
  const a = num(m[1]), b = num(m[3]);
  const steps = [];
  let bb = b;
  if (m[2] === MINUS) { bb = -b; steps.push(`Subtracting ${paren(b)} is the same as adding its opposite: ${fmt(a)} + ${paren(bb)}.`); }
  const s = a + bb;
  if (a === 0 || bb === 0) steps.push(`Adding 0 changes nothing.`);
  else if ((a > 0) === (bb > 0)) steps.push(`Both numbers have the same sign: add their sizes (${Math.abs(a)} + ${Math.abs(bb)} = ${Math.abs(s)}) and keep the sign.`);
  else steps.push(`The signs are different: subtract the smaller size from the larger (${Math.max(Math.abs(a), Math.abs(bb))} ${MINUS} ${Math.min(Math.abs(a), Math.abs(bb))} = ${Math.abs(s)}) and keep the sign of the number with the larger size.`);
  steps.push(`${p.text.replace(' =', '')} = ${fmt(s)}.`);
  return { steps, answer: p.answer };
};

X.intMult = (p) => {
  const div = p.text.includes(DIV);
  const m = p.text.match(new RegExp(`^(\\S+) [${TIMES}${DIV}] (\\S+) =$`));
  const a = num(m[1]), b = num(m[2]);
  const r = div ? a / b : a * b;
  const steps = [`${div ? 'Divide' : 'Multiply'} the sizes: ${Math.abs(a)} ${div ? DIV : TIMES} ${Math.abs(b)} = ${Math.abs(r)}.`];
  if (r === 0) steps.push('The result is 0, which has no sign.');
  else steps.push((a < 0) === (b < 0) ? 'The signs are the same, so the result is positive.' : 'The signs are different, so the result is negative.');
  steps.push(`${p.text.replace(' =', '')} = ${fmt(r)}.`);
  return { steps, answer: p.answer };
};

X.orderOps = (p) => {
  const r = solveExpression(p.text.replace(' =', ''));
  return { steps: r.steps, answer: String(r.value) };
};

X.percentOf = (p) => {
  const m = p.text.match(/(\d+)% of (\d+)/);
  const pct = +m[1], base = +m[2], ten = base / 10;
  const steps = [`${pct}% means ${pct} hundredths, so multiply and divide by 100: ${pct} ${TIMES} ${base} ${DIV} 100.`];
  if (pct % 10 === 0) steps.push(`Shortcut: 10% of ${base} is ${ten}, and ${pct}% is ${pct / 10} ${TIMES} ${ten} = ${pct / 10 * ten}.`);
  else if (pct === 25 || pct === 75) steps.push(`Shortcut: 25% is one quarter, ${base} ${DIV} 4 = ${base / 4}${pct === 75 ? `, and 75% is three quarters: 3 ${TIMES} ${base / 4} = ${3 * base / 4}` : ''}.`);
  else steps.push(`${pct} ${TIMES} ${base} = ${pct * base}, and ${pct * base} ${DIV} 100 = ${pct * base / 100}.`);
  return { steps, answer: p.answer };
};

X.exponents = (p) => {
  const m = p.text.match(/^(\d+)<sup>(\d+)<\/sup>/);
  const b = +m[1], e = +m[2];
  return { answer: p.answer, steps: [`The exponent ${e} means: multiply ${b} by itself ${e} times.`, `${Array(e).fill(b).join(` ${TIMES} `)} = ${b ** e}.`] };
};

function explain(type, problem) {
  const fn = X[type.gen];
  if (!fn) throw new Error('No worked example for generator ' + type.gen);
  const r = fn(problem, type.params || {});
  return { steps: r.steps, answer: r.answer, expected: problem.kind === 'f' ? fracAnswerText(problem.answer) : problem.kind === 'fs' ? frac(problem.answer) : String(problem.answer) };
}

module.exports = { explain };
