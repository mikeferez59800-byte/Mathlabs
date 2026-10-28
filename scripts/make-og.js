#!/usr/bin/env node
/*
 * Renders the social share images (1200x630 JPEG) into static/og/: one per worksheet, one per
 * category, one for the home page and a default. Run after `node build.js`, then commit static/og.
 * Needs Playwright (dev only, not needed by Cloudflare): `npx playwright install chromium` if missing.
 * Usage: node scripts/make-og.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const MSL = require('../src/engine');
const { categories, types } = require('../src/catalog');
const config = require('../site.config');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'static', 'og');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const css = fs.readdirSync(path.join(DIST, 'assets')).find((f) => /^styles\..+\.css$/.test(f));
if (!css) throw new Error('Run `node build.js` first.');

function card({ kicker, title, chips, sheetHtml }) {
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/${css}">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  .og { position: relative; width: 1200px; height: 630px; box-sizing: border-box; padding: 64px 72px; display: grid; grid-template-columns: 1fr 470px; gap: 48px; align-items: center;
        background: radial-gradient(circle at 85% 20%, rgba(139, 92, 246, .35), transparent 55%), linear-gradient(135deg, #0B1020, #111B35 55%, #1A1740); color: #F8FAFC; font-family: var(--font); }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 700; letter-spacing: -.01em; }
  .brand svg { width: 52px; height: 52px; }
  .brand b { color: #A5B4FC; font-weight: 700; }
  .kicker { margin: 44px 0 12px; font-size: 22px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #A5B4FC; }
  h1 { margin: 0; font-size: ${title.length > 34 ? 54 : 64}px; line-height: 1.08; letter-spacing: -.02em; font-weight: 800; text-wrap: balance; }
  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; padding: 0; list-style: none; }
  .chips li { font-size: 21px; padding: 8px 16px; border-radius: 99px; background: rgba(148, 163, 184, .16); color: #E2E8F0; }
  .paper { position: relative; background: #fff; border-radius: 14px; box-shadow: 0 30px 60px -20px rgba(0, 0, 0, .6); transform: rotate(2deg); overflow: hidden; height: 500px; }
  .paper .sheet { width: 760px; max-width: none; margin: 0; border: 0; box-shadow: none; padding: 34px 38px; transform: scale(.62); transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .paper .sh-foot { display: none; }
</style></head><body><div class="og">
<div><div class="brand"><svg viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#4F46E5"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M18 22h12M24 16v12M36 22h12M19 42l10 10M29 42L19 52M36 44h12M36 50h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg><span>MathSheet<b>Lab</b></span></div>
<p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1>
<ul class="chips">${chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
<div class="paper">${sheetHtml}</div>
</div></body></html>`;
}

function sheetFor(t) {
  const ct = { ...t, sheetTitle: cap(t.h1) };
  const n = Math.min(t.cols * 5, 20);
  return MSL.renderSheet(ct, MSL.generate(ct, MSL.hashString(t.slug), n), { cols: t.cols, title: ct.sheetTitle });
}

const jobs = [];
for (const t of types) {
  jobs.push({ name: t.slug, html: card({ kicker: 'Free printable worksheet', title: cap(t.h1), chips: [t.grade, 'Answer key', 'Unlimited sheets'], sheetHtml: sheetFor(t) }) });
}
for (const c of categories) {
  const first = types.find((t) => t.cat === c.slug);
  const count = types.filter((t) => t.cat === c.slug).length;
  jobs.push({ name: c.slug, html: card({ kicker: `${count} free worksheets`, title: `${c.name} worksheets`, chips: ['Printable', 'Answer keys', 'No sign-up'], sheetHtml: sheetFor(first) }) });
}
const showcase = types.find((t) => t.slug === 'two-digit-addition-with-regrouping') || types[0];
for (const name of ['home', 'default']) {
  jobs.push({ name, html: card({ kicker: `${types.length} worksheet generators`, title: 'Free printable math worksheets', chips: ['K to grade 7', 'Answer keys', 'No sign-up'], sheetHtml: sheetFor(showcase) }) });
}

(async () => {
  const pages = new Map(jobs.map((j) => [`/__og/${j.name}.html`, j.html]));
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (pages.has(u)) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pages.get(u)); }
    const f = path.join(DIST, u);
    if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    const type = { '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const port = server.address().port;
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const j of jobs) {
    await page.goto(`http://localhost:${port}/__og/${j.name}.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, j.name + '.jpg'), type: 'jpeg', quality: 82 });
  }
  await browser.close();
  server.close();
  console.log(`Wrote ${jobs.length} share images to static/og/ for ${config.url}`);
})();
