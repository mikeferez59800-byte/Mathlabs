#!/usr/bin/env node
/*
 * Renders the Pinterest pin images (1000x1500 JPEG, the 2:3 ratio Pinterest recommends) into
 * static/pins/, one per entry of src/pins.js, plus static/pins/pins.json (titles, descriptions,
 * links and boards). Run after `node build.js`, then commit static/pins.
 * Needs Playwright (dev only, not needed by Cloudflare), like scripts/make-og.js.
 * Usage: node scripts/make-pins.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const MSL = require('../src/engine');
const { types } = require('../src/catalog');
const { pins, boards } = require('../src/pins');
const config = require('../site.config');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'static', 'pins');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const host = config.url.replace(/^https?:\/\//, '');

const css = fs.readdirSync(path.join(DIST, 'assets')).find((f) => /^styles\..+\.css$/.test(f));
if (!css) throw new Error('Run `node build.js` first.');

// One accent per category so a board of pins does not look like the same image repeated.
const ACCENT = {
  addition: ['#4F46E5', '#8B5CF6'], subtraction: ['#0EA5E9', '#6366F1'], multiplication: ['#DB2777', '#8B5CF6'],
  division: ['#EA580C', '#DB2777'], fractions: ['#059669', '#0EA5E9'], decimals: ['#0891B2', '#4F46E5'],
  'number-sense': ['#CA8A04', '#EA580C'], 'pre-algebra': ['#7C3AED', '#DB2777']
};

function sheetFor(slug) {
  const t = types.find((x) => x.slug === slug);
  const ct = { ...t, sheetTitle: cap(t.h1) };
  return MSL.renderSheet(ct, MSL.generate(ct, MSL.hashString('pin:' + t.slug), t.cols * 9), { cols: t.cols, title: ct.sheetTitle });
}

function card(p) {
  const [a, b] = ACCENT[p.cat] || ACCENT.addition;
  const size = p.heading.length > 40 ? 68 : p.heading.length > 26 ? 80 : 92;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/${css}">
<style>
  html, body { margin: 0; width: 1000px; height: 1500px; overflow: hidden; }
  .pin { position: relative; width: 1000px; height: 1500px; box-sizing: border-box; overflow: hidden; font-family: var(--font); color: #F8FAFC; display: flex; flex-direction: column;
         background: radial-gradient(circle at 90% 8%, ${b}66, transparent 50%), linear-gradient(160deg, #0B1020, #111B35 60%, #1A1740); }
  .top { padding: 64px 70px 0; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 34px; font-weight: 700; }
  .brand svg { width: 58px; height: 58px; }
  .brand b { color: #A5B4FC; }
  .pin-kicker { display: inline-block; color: #fff; margin: 46px 0 18px; padding: 10px 22px; border-radius: 99px; font-size: 26px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: linear-gradient(90deg, ${a}, ${b}); }
  h1 { margin: 0; font-size: ${size}px; line-height: 1.04; letter-spacing: -.025em; font-weight: 800; text-wrap: balance; }
  .sub { margin-top: 20px; font-size: 32px; color: #CBD5E1; font-weight: 600; }
  .mid { position: relative; flex: 1; margin: 64px 70px 0; }
  .paper { position: absolute; inset: 0; background: #fff; border-radius: 18px; box-shadow: 0 40px 80px -24px rgba(0, 0, 0, .7); transform: rotate(-1.5deg); overflow: hidden; }
  .paper::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 120px; background: linear-gradient(transparent, #fff); }
  .paper .sheet { width: 760px; max-width: none; margin: 0; border: 0; box-shadow: none; padding: 34px 38px; transform: scale(1.13); transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .paper .sh-foot { display: none; }
  .badge { position: absolute; right: -20px; top: -50px; width: 170px; height: 170px; border-radius: 50%; display: grid; place-items: center; text-align: center; font-size: 27px; font-weight: 800; line-height: 1.1; color: #0B1020; background: #FDE047; transform: rotate(10deg); box-shadow: 0 16px 30px -10px rgba(0, 0, 0, .5); z-index: 2; }
  .foot { height: 150px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
  .foot .cta { font-size: 34px; font-weight: 800; }
  .foot .url { font-size: 28px; color: #A5B4FC; font-weight: 600; }
</style></head><body><div class="pin">
<div class="top"><div class="brand"><svg viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#4F46E5"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><path d="M18 22h12M24 16v12M36 22h12M19 42l10 10M29 42L19 52M36 44h12M36 50h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg><span>MathSheet<b>Lab</b></span></div>
<div class="pin-kicker">${esc(p.kicker)}</div><h1>${esc(p.heading)}</h1><div class="sub">${esc(p.sub)}</div></div>
<div class="mid"><div class="paper">${sheetFor(p.sheet)}</div><div class="badge">FREE<br>+ answer<br>key</div></div>
<div class="foot"><div class="cta">Print unlimited sheets free</div><div class="url">${esc(host)}</div></div>
</div></body></html>`;
}

(async () => {
  const pages = new Map(pins.map((p) => [`/__pin/${p.name}.html`, card(p)]));
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  for (const p of pins) {
    await page.goto(`http://localhost:${port}/__pin/${p.name}.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, p.name + '.jpg'), type: 'jpeg', quality: 80 });
  }
  await browser.close();
  server.close();
  const data = pins.map(({ name, title, description, link, board, keywords }) => ({
    image: `${config.url}/pins/${name}.jpg`, title, description, link: config.url + link, board, keywords
  }));
  fs.writeFileSync(path.join(OUT, 'pins.json'), JSON.stringify({ boards, pins: data }, null, 1) + '\n');
  console.log(`Wrote ${pins.length} pin images and pins.json to static/pins/ for ${config.url}`);
})();
