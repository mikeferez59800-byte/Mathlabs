#!/usr/bin/env node
/*
 * Prints the reference worksheets (one per layout family) to PDF, on US Letter and A4, for a visual
 * check of the layout engine. Family E (word problems) has no generator yet: it is printed from the
 * sample problems below, which are not published on the site.
 * Needs Playwright (dev only). Usage: node build.js && node scripts/make-print-samples.js [out-dir]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const MSL = require('../src/engine');
const LAYOUT = require('../src/layout');
const config = require('../site.config');
const { types } = require('../src/catalog');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'print-samples'));

const SAMPLES = [
  ['A', 'addition-within-20'],
  ['B', 'adding-fractions-unlike-denominators'],
  ['C', 'two-step-equations'],
  ['D', 'telling-time-quarter-hour'],
  ['F', 'long-division-two-digit-divisor']
];

const WORD_TYPE = { slug: 'word-problems-sample', sheetTitle: 'Word problems (sample)', grade: 'Grade 3 – Grade 4', instruction: 'Read each problem. Show your work, then write the answer.', layout: 'E' };
const WORD_PROBLEMS = [
  { kind: 'wp', text: 'A school bus carries 48 students. 19 students get off at the first stop. How many students are still on the bus?', answer: '29', unit: 'students' },
  { kind: 'wp', text: 'Maya reads 12 pages every day. How many pages does she read in one week?', answer: '84', unit: 'pages' },
  { kind: 'wp', text: 'A baker puts 6 muffins in each box. He has 54 muffins. How many boxes can he fill?', answer: '9', unit: 'boxes' },
  { kind: 'wp', text: 'Leo has $35. He buys a book for $12 and a pen for $4. How much money does he have left?', answer: '$19' },
  { kind: 'wp', text: 'A garden has 7 rows of tulips with 9 tulips in each row. 15 tulips are red. How many tulips are not red?', answer: '48', unit: 'tulips' },
  { kind: 'wp', text: 'The library had 256 books. It received 3 boxes of 25 new books. How many books does it have now?', answer: '331', unit: 'books' }
];

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

(async () => {
  const css = fs.readdirSync(path.join(DIST, 'assets')).find((f) => /^styles\..+\.css$/.test(f));
  if (!css) throw new Error('Run `node build.js` first.');
  fs.mkdirSync(OUT, { recursive: true });
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u.startsWith('/_word/')) {
      const paper = u.endsWith('a4') ? 'a4' : 'letter';
      const html = LAYOUT.renderWorksheet(WORD_TYPE, WORD_PROBLEMS, { seed: 100000, siteName: config.name, siteHost: new URL(config.url).host, paper, answers: true });
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/${css}"><style>@page{size:${paper === 'a4' ? 'A4' : 'letter'};margin:0}</style></head><body>${html}</body></html>`);
    }
    let p = u.endsWith('/') ? u + 'index.html' : u;
    const f = path.join(DIST, path.normalize(p));
    if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(0);
  await new Promise((r) => srv.on('listening', r));
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const jobs = [];
  for (const [fam, slug] of SAMPLES) {
    const t = types.find((x) => x.slug === slug);
    for (const paper of ['letter', 'a4']) jobs.push([`${fam}-${slug}-${paper}`, `${base}/${t.cat}/${t.slug}/?s=123456${paper === 'a4' ? '&p=a4' : ''}`]);
    jobs.push([`${fam}-${slug}-large-print`, `${base}/${t.cat}/${t.slug}/?s=123456&lg=1&n=${t.counts[t.counts.length - 1]}`]);
  }
  for (const paper of ['letter', 'a4']) jobs.push([`E-word-problems-${paper}`, `${base}/_word/${paper}`]);
  for (const [name, url] of jobs) {
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(50);
    fs.writeFileSync(path.join(OUT, name + '.pdf'), await page.pdf({ preferCSSPageSize: true }));
  }
  await browser.close();
  srv.close();
  console.log(`${jobs.length} PDFs written to ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
