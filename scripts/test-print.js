#!/usr/bin/env node
/*
 * Print tests: opens every worksheet generator of the built site (dist/) in Chromium and prints it,
 * for every problem count, A4 and US Letter, Classic and Large print (Primary), with the answer key.
 * For each printed worksheet it checks:
 *   - no problem wider or taller than its cell, no page taller than the paper (nothing cut);
 *   - no two problems overlapping, the grid never running into the footer;
 *   - no empty page: the PDF has exactly one page per sheet page, and each page has problems;
 *   - no missing problem: 1..n in order on the sheet and on the answer key;
 *   - answer key in sync: each key entry is exactly the engine's answer for the same problem;
 *   - clocks stay round (no distorted figure);
 *   - footer inside the printable area (10 mm bottom margin);
 *   - the safety net (smaller redraw in the browser) was not needed.
 * With --visual it also compares the six reference worksheets with images in scripts/print-ref/
 * (--update rewrites them). Visual references depend on the machine's rendering, so CI skips them.
 *
 * Needs Playwright (dev only): `npm i --no-save playwright && npx playwright install chromium`.
 * Usage: node build.js && node scripts/test-print.js [--quick] [--visual] [--update]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const { types } = require('../src/catalog');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const REF = path.join(__dirname, 'print-ref');
const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const VISUAL = args.includes('--visual') || args.includes('--update');
const UPDATE = args.includes('--update');
const MM = 96 / 25.4;

// One representative worksheet per layout family (the validation set).
const REFERENCES = ['addition-within-20', 'adding-fractions-unlike-denominators', 'two-step-equations',
  'telling-time-quarter-hour', 'long-division-two-digit-divisor', 'rounding-to-nearest-1000'];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(DIST, path.normalize(p));
      if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    }).listen(0, () => resolve(srv));
  });
}

// Runs inside the page, after the worksheet is drawn with print styles.
function inspect({ n, MM }) {
  const errors = [];
  const out = document.getElementById('ws-output');
  const type = JSON.parse(document.getElementById('ws-config').textContent).type;
  const params = new URLSearchParams(location.search);
  const problems = window.MSL.generate(type, Number(params.get('s')), n);
  const pages = [...out.querySelectorAll('.sheet.pg')];
  const sheetPages = pages.filter((p) => !p.classList.contains('sheet-key'));
  const keyPages = pages.filter((p) => p.classList.contains('sheet-key'));
  const shrink = Number(out.getAttribute('data-shrink') || 1);
  if (shrink !== 1) errors.push(`browser safety net shrank the sheet to ${shrink}`);

  for (const [label, list, withAnswer] of [['sheet', sheetPages, false], ['key', keyPages, true]]) {
    if (!list.length) { errors.push(`${label}: no page`); continue; }
    const nums = [];
    list.forEach((pg, pi) => {
      const where = `${label} page ${pi + 1}`;
      const box = pg.getBoundingClientRect();
      if (pg.scrollHeight > pg.clientHeight + 1) errors.push(`${where}: content taller than the page`);
      const items = [...pg.querySelectorAll('.pr')];
      if (!items.length) errors.push(`${where}: empty page`);
      const rects = items.map((li) => li.getBoundingClientRect());
      items.forEach((li, i) => {
        if (li.scrollWidth > li.clientWidth + 1) errors.push(`${where}: problem ${li.querySelector('.pn').textContent} too wide`);
        if (li.scrollHeight > li.clientHeight + 1) errors.push(`${where}: problem ${li.querySelector('.pn').textContent} too tall`);
        nums.push(Number(li.querySelector('.pn').textContent.replace('.', '')));
        // Answer key entries must be exactly what the engine draws for that problem with its answer.
        const k = nums[nums.length - 1] - 1;
        const html = li.querySelector('.pb').firstElementChild.outerHTML;
        const expected = window.MSL.renderProblem(problems[k], withAnswer);
        const tmp = document.createElement('div'); tmp.innerHTML = expected;
        if (tmp.firstElementChild.outerHTML !== html) errors.push(`${where}: problem ${k + 1} differs from the engine`);
        for (let j = 0; j < i; j++) {
          const a = rects[i], b = rects[j];
          if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) errors.push(`${where}: problems ${j + 1} and ${i + 1} overlap`);
        }
      });
      pg.querySelectorAll('svg.clk').forEach((svg) => {
        const r = svg.getBoundingClientRect();
        if (Math.abs(r.width - r.height) > 1) errors.push(`${where}: clock distorted (${r.width.toFixed(1)}×${r.height.toFixed(1)})`);
      });
      const grid = pg.querySelector('.sh-grid').getBoundingClientRect();
      const foot = pg.querySelector('.sh-foot').getBoundingClientRect();
      if (grid.bottom > foot.top + 0.5) errors.push(`${where}: grid runs into the footer`);
      if (foot.bottom > box.top + pg.offsetHeight - 10 * MM + 1) errors.push(`${where}: footer outside the printable area`);
      if (box.width > pg.offsetWidth + 1) errors.push(`${where}: zoomed while printing`);
    });
    const want = problems.map((_, i) => i + 1).join(',');
    if (nums.join(',') !== want) errors.push(`${label}: problem numbers ${nums.join(',')} (expected 1..${n})`);
  }
  return { errors, pages: pages.length, family: pages[0] && pages[0].dataset.family, font: pages[0] && pages[0].style.getPropertyValue('--fs') };
}

async function compareImage(page, a, b) {
  // Pixel difference ratio between two PNG files, computed with the browser's canvas.
  return page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
    const [x, y] = await Promise.all([load(a), load(b)]);
    if (x.width !== y.width || x.height !== y.height) return 1;
    const c = document.createElement('canvas'); c.width = x.width; c.height = x.height;
    const g = c.getContext('2d');
    g.drawImage(x, 0, 0); const d1 = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(y, 0, 0); const d2 = g.getImageData(0, 0, c.width, c.height).data;
    let diff = 0;
    for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 60) diff++;
    return diff / (d1.length / 4);
  }, ['data:image/png;base64,' + a.toString('base64'), 'data:image/png;base64,' + b.toString('base64')]);
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Run `node build.js` first.');
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const failures = [];
  let runs = 0;
  const families = {};
  const list = QUICK ? types.filter((t) => REFERENCES.includes(t.slug)) : types;
  for (const t of list) {
    const counts = QUICK ? [t.counts[t.counts.length - 1]] : t.counts;
    for (const n of counts) for (const paper of ['letter', 'a4']) for (const lg of [false, true]) {
      const q = `?s=123456&n=${n}${paper === 'a4' ? '&p=a4' : ''}${lg ? '&lg=1' : ''}`;
      const url = `${base}/${t.cat}/${t.slug}/${q}`;
      await page.emulateMedia({ media: 'screen' });
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(30);
      await page.emulateMedia({ media: 'print' });
      const r = await page.evaluate(inspect, { n, MM });
      const pdf = await page.pdf({ preferCSSPageSize: true });
      const pdfPages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      if (pdfPages !== r.pages) r.errors.push(`PDF has ${pdfPages} pages for ${r.pages} sheet pages (blank or split page)`);
      runs++;
      families[r.family] = (families[r.family] || 0) + 1;
      for (const e of r.errors) failures.push(`${t.slug} n=${n} ${paper}${lg ? ' large' : ''}: ${e}`);
    }
  }

  if (VISUAL) {
    fs.mkdirSync(REF, { recursive: true });
    for (const slug of REFERENCES) {
      const t = types.find((x) => x.slug === slug);
      for (const paper of ['letter', 'a4']) {
        await page.emulateMedia({ media: 'screen' });
        await page.goto(`${base}/${t.cat}/${t.slug}/?s=123456${paper === 'a4' ? '&p=a4' : ''}`);
        await page.evaluate(() => document.fonts.ready);
        await page.emulateMedia({ media: 'print' });
        const sheets = await page.$$('.sheet.pg');
        for (let i = 0; i < sheets.length; i++) {
          const png = await sheets[i].screenshot();
          const file = path.join(REF, `${slug}-${paper}-${i + 1}.png`);
          if (UPDATE || !fs.existsSync(file)) { fs.writeFileSync(file, png); continue; }
          const ratio = await compareImage(page, png, fs.readFileSync(file));
          if (ratio > 0.002) failures.push(`${slug} ${paper} page ${i + 1}: looks different from the reference (${(ratio * 100).toFixed(2)} % of pixels); check it, then run with --update`);
        }
      }
    }
  }

  await browser.close();
  srv.close();
  if (failures.length) {
    console.error(`Print tests FAILED (${failures.length}):\n` + failures.slice(0, 80).join('\n'));
    process.exit(1);
  }
  console.log(`Print OK: ${runs} printed worksheets checked (${list.length} generators; families ${Object.entries(families).map(([k, v]) => k + ' ' + v).join(', ')})${VISUAL ? ', visual references ' + (UPDATE ? 'updated' : 'match') : ''}.`);
})().catch((e) => { console.error(e); process.exit(1); });
