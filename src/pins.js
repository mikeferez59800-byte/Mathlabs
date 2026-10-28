/*
 * Pinterest pins: one per worksheet, one per category and one for the home page.
 * Images are rendered by scripts/make-pins.js into static/pins/<name>.jpg (1000x1500).
 * The order of the list is the suggested posting order (popular topics first, categories mixed).
 */
'use strict';

const { categories, types } = require('./catalog');

const BOARD_GENERAL = 'Free Printable Math Worksheets';
const SMALL = new Set(['and', 'by', 'of', 'to', 'with', 'within', 'a', 'the', 'in', 'on']);
const titleCase = (s) => s.split(' ').map((w, i) => (i && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const boardFor = (cat) => titleCase(`${cat.name} worksheets`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ord = (n) => n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n] || 'th');
// "Grade 3 – Grade 5" -> "3rd to 5th grade", "Kindergarten – Grade 1" -> "kindergarten and 1st grade"
function gradeWords(g) {
  const [a, b] = g.split(' – ').map((x) => (/kindergarten/i.test(x) ? 'K' : x.replace(/\D/g, '')));
  if (a === 'K') return b ? `kindergarten and ${ord(b)} grade` : 'kindergarten';
  return b ? `${ord(a)} to ${ord(b)} grade` : `${ord(a)} grade`;
}

function workSheetPin(t) {
  const cat = categories.find((c) => c.slug === t.cat);
  const name = titleCase(t.h1.replace(/ worksheets$/i, ''));
  const grades = gradeWords(t.grade);
  return {
    name: t.slug,
    title: `${name} Worksheets – Free Printable with Answer Key`.slice(0, 100),
    description: `${t.desc} Click "New sheet" for fresh problems every time: unlimited free math practice for homework, morning work, math centers and homeschool. No sign-up.`.slice(0, 500),
    link: `/${t.cat}/${t.slug}/`,
    board: boardFor(cat),
    keywords: [`${t.h1}`, `${cat.name.toLowerCase()} worksheets`, `${grades} math`, 'free printable math worksheets', 'math worksheets with answer key', 'homeschool math'],
    kicker: 'Free printable worksheet',
    heading: cap(t.h1),
    sub: t.grade,
    sheet: t.slug,
    cat: cat.slug
  };
}

function categoryPin(c) {
  const list = types.filter((t) => t.cat === c.slug);
  return {
    name: c.slug,
    title: `${list.length} Free ${titleCase(c.name)} Worksheets – Printable with Answer Keys`,
    description: `${c.blurb} ${list.length} free printable ${c.name.toLowerCase()} worksheet generators, from ${list[0].grade.split(' – ')[0].toLowerCase()} to ${list[list.length - 1].grade.split(' – ').pop().toLowerCase()}. New problems every click, answer key on page 2, print or save as PDF. No sign-up.`.slice(0, 500),
    link: `/${c.slug}/`,
    board: BOARD_GENERAL,
    keywords: [`${c.name.toLowerCase()} worksheets`, 'free printable math worksheets', 'math practice', 'elementary math', 'homeschool math', 'math worksheets with answer key'],
    kicker: `${list.length} free worksheets`,
    heading: `${c.name} worksheets`,
    sub: 'Printable · Answer keys',
    sheet: list[0].slug,
    cat: c.slug
  };
}

function homePin() {
  return {
    name: 'home',
    title: `${types.length} Free Printable Math Worksheet Generators (K to 7th Grade)`,
    description: `Free math worksheets for kindergarten to 7th grade: addition, subtraction, multiplication tables, long division, fractions, decimals, rounding and pre-algebra. Generate a new sheet in one click, print or save as PDF, answer key included. Perfect for teachers, parents and homeschool. No sign-up.`,
    link: '/',
    board: BOARD_GENERAL,
    keywords: ['free printable math worksheets', 'math worksheet generator', 'math worksheets with answer key', 'elementary math', 'homeschool math', 'teacher resources'],
    kicker: `${types.length} worksheet generators`,
    heading: 'Free printable math worksheets',
    sub: 'Kindergarten to Grade 7',
    sheet: 'two-digit-addition-with-regrouping',
    cat: 'addition'
  };
}

// Suggested posting order: home first, then worksheets round-robin across categories
// (so consecutive pins vary), with each category page slotted in after its first worksheets.
function buildPins() {
  const queues = categories.map((c) => types.filter((t) => t.cat === c.slug).map(workSheetPin));
  const out = [homePin()];
  const catPins = categories.map(categoryPin);
  for (let round = 0; queues.some((q) => q.length); round++) {
    queues.forEach((q, i) => { if (q.length) out.push(q.shift()); });
    if (round === 1) out.push(...catPins.slice(0, 4));
    if (round === 2) out.push(...catPins.slice(4));
  }
  return out;
}

const pins = buildPins();
const boards = [BOARD_GENERAL, ...categories.map(boardFor)];

module.exports = { pins, boards };
