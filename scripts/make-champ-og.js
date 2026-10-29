#!/usr/bin/env node
/*
 * Renders the share images (1200x630 JPEG) of the Multiplication World Championship pages into
 * static/og/multiplication-championship{,-fr,-ja}.jpg. Shows no player and no score: only the concept.
 * Needs Playwright (dev only). Usage: node build.js && node scripts/make-champ-og.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { T, LANGS } = require('../src/championship/i18n');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'static', 'og');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inter = fs.readFileSync(path.join(ROOT, 'src/fonts/inter-latin-wght-normal.woff2')).toString('base64');

function html(lang) {
  const t = T[lang];
  const chips = { en: ['60 seconds', 'Tables 2–12', 'World ranking', 'Free'], fr: ['60 secondes', 'Tables de 2 à 12', 'Classement mondial', 'Gratuit'], ja: ['60秒', '2〜12の段', '世界ランキング', '無料'] }[lang];
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format("woff2"); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
.og { position: relative; box-sizing: border-box; width: 1200px; height: 630px; padding: 64px 72px; color: #F8FAFC;
  font-family: Inter, "Hiragino Sans", "Noto Sans CJK JP", "Noto Sans JP", sans-serif;
  background: radial-gradient(circle at 82% 18%, rgba(245, 184, 61, .38), transparent 50%), radial-gradient(circle at 10% 100%, rgba(139, 92, 246, .3), transparent 50%), linear-gradient(135deg, #0B1020, #111B35 55%, #1A1740); }
.brand { font-size: 30px; font-weight: 700; } .brand b { color: #A5B4FC; }
.kicker { margin: 40px 0 14px; font-size: 22px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #FCD679; }
h1 { margin: 0; max-width: 760px; font-size: ${lang === 'en' ? 72 : 64}px; line-height: 1.04; letter-spacing: -.03em; font-weight: 800; }
.slogan { margin: 22px 0 0; max-width: 760px; font-size: 28px; font-weight: 600; color: #FCD679; }
.chips { display: flex; gap: 12px; margin: 34px 0 0; padding: 0; list-style: none; }
.chips li { font-size: 22px; padding: 8px 18px; border-radius: 99px; background: rgba(148, 163, 184, .16); color: #E2E8F0; }
.trophy { position: absolute; right: 70px; top: 120px; width: 300px; height: 300px; }
.q { position: absolute; right: 64px; bottom: 60px; padding: 18px 26px; border-radius: 22px; background: rgba(255,255,255,.07); border: 1px solid rgba(245,184,61,.35); font-size: 54px; font-weight: 800; }
.q span { color: #FCD679; }
</style></head><body><div class="og">
<div class="brand">MathSheet<b>Lab</b></div>
<p class="kicker">${esc(lang === 'en' ? 'Every month · Worldwide' : lang === 'fr' ? 'Chaque mois · Monde entier' : '毎月開催・世界中から参加')}</p>
<h1>${esc(t.name)}</h1>
<p class="slogan">${esc(t.slogan)}</p>
<ul class="chips">${chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
<svg class="trophy" viewBox="0 0 24 24" fill="none" stroke="#F5B83D" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" fill="rgba(245,184,61,.18)"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>
<div class="q">7 <span>×</span> 8 <span>=</span> ?</div>
</div></body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const lang of LANGS) {
    await page.setContent(html(lang), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `multiplication-championship${lang === 'en' ? '' : '-' + lang}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    console.log('wrote', path.relative(ROOT, file));
  }
  await browser.close();
})();
