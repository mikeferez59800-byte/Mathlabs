#!/usr/bin/env node
/*
 * Static site generator for MathSheetLab. No dependencies: `node build.js` writes ./dist.
 * Pages: home, category pages, one page per worksheet type, legal pages, 404,
 * plus sitemap.xml, robots.txt, _headers (Cloudflare Pages) and ads.txt (when configured).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = require('./site.config');
const { categories, types } = require('./src/catalog');
const MSL = require('./src/engine');
const LAYOUT = require('./src/layout');
const { explain } = require('./src/explain');
const CHAMP = require('./src/championship/pages');
const { grades, gradesOf } = require('./src/grades');
const { mistakesFor } = require('./src/mistakes');
const { T: CT } = require('./src/championship/i18n');
const { kukuPage, KUKU_PATH } = require('./src/kuku-ja');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const LASTMOD_FILE = path.join(ROOT, 'data', 'lastmod.json');
const STATIC = path.join(ROOT, 'static');
const today = new Date().toISOString().slice(0, 10);
const warnings = [];

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const abs = (p) => config.url + p;
const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const typeBySlug = Object.fromEntries(types.map((t) => [t.slug, t]));
const typeUrl = (t) => `/${t.cat}/${t.slug}/`;
const gradeUrl = (g) => `/${g.slug}/`;
const gradeByN = Object.fromEntries(grades.map((g) => [g.n, g]));
const typesForGrade = (g) => types.filter((t) => gradesOf(t).includes(g.n));

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function validateCatalog() {
  const seen = new Set();
  for (const t of types) {
    if (seen.has(t.slug)) throw new Error('Duplicate slug: ' + t.slug);
    seen.add(t.slug);
    if (!catBySlug[t.cat]) throw new Error(`Unknown category "${t.cat}" in ${t.slug}`);
    if (!MSL.generators[t.gen]) throw new Error(`Unknown generator "${t.gen}" in ${t.slug}`);
    if (!t.counts.includes(t.count)) throw new Error(`Default count not in counts for ${t.slug}`);
    for (const r of t.related || []) if (!typeBySlug[r]) throw new Error(`Unknown related slug "${r}" in ${t.slug}`);
    if (t.title.length > 70) warnings.push(`Title longer than 70 chars (${t.title.length}): ${t.slug}`);
    if (t.desc.length > 160) warnings.push(`Meta description longer than 160 chars (${t.desc.length}): ${t.slug}`);
  }
}

// ---------- assets ----------
function buildAssets() {
  const font = fs.readFileSync(path.join(ROOT, 'src/fonts/inter-latin-wght-normal.woff2'));
  const fontName = `/assets/inter.${crypto.createHash('sha256').update(font).digest('hex').slice(0, 10)}.woff2`;
  write(fontName, font);
  const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8').replace('__INTER_WOFF2__', fontName);
  const js = ['src/engine.js', 'src/layout.js', 'src/app.js', 'src/practice.js', 'src/practice-ui.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const ui = fs.readFileSync(path.join(ROOT, 'src/ui.js'), 'utf8');
  const cssName = `/assets/styles.${hash(css)}.css`;
  const jsName = `/assets/app.${hash(js)}.js`;
  const uiName = `/assets/ui.${hash(ui)}.js`;
  write(cssName, css);
  write(jsName, js);
  write(uiName, ui);
  // Step-by-step explanations for online practice: loaded on demand, only when a student asks "Show me how".
  const explainJs = `(function () { var module = { exports: {} };\n${fs.readFileSync(path.join(ROOT, 'src/explain.js'), 'utf8')}\nself.MSLExplain = module.exports.explain; })();\n`;
  const explainName = `/assets/explain.${hash(explainJs)}.js`;
  write(explainName, explainJs);
  const qrJs = fs.readFileSync(path.join(ROOT, 'src/qr.js'), 'utf8');
  const assignJs = fs.readFileSync(path.join(ROOT, 'src/assign.js'), 'utf8');
  const qrName = `/assets/qr.${hash(qrJs)}.js`, assignName = `/assets/assign.${hash(assignJs)}.js`;
  write(qrName, qrJs);
  write(assignName, assignJs);
  write('/favicon.svg', FAVICON);
  return { css: cssName, js: jsName, ui: uiName, explain: explainName, qr: qrName, assign: assignName, font: fontName, ...CHAMP.buildAssets({ ROOT, write, hash }) };
}

const LOGO_MARK = (id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#4F46E5"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>` +
  `<rect width="64" height="64" rx="16" fill="url(#${id})"/><path d="M18 22h12M24 16v12M36 22h12M19 42l10 10M29 42L19 52M36 44h12M36 50h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${LOGO_MARK('g')}</svg>`;
const LOGO = (id) => `<svg viewBox="0 0 64 64" aria-hidden="true">${LOGO_MARK(id)}</svg>`;

// 24px line icons (stroke = currentColor).
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CAT_ICONS = {
  addition: '<path d="M12 5v14M5 12h14"/>',
  subtraction: '<path d="M5 12h14"/>',
  multiplication: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  division: '<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.3" fill="currentColor"/><circle cx="12" cy="17.5" r="1.3" fill="currentColor"/>',
  fractions: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/>',
  decimals: '<circle cx="5" cy="17.5" r="1.2" fill="currentColor"/><rect x="8.5" y="5" width="5" height="13" rx="2.5"/><rect x="15.5" y="5" width="5" height="13" rx="2.5"/>',
  'number-sense': '<path d="M3 15h18M6 12v6M12 12v6M18 12v6"/><path d="m9 7 3-3 3 3"/>',
  'pre-algebra': '<path d="M7 4c-2 2.5-3 5-3 8s1 5.5 3 8M17 4c2 2.5 3 5 3 8s-1 5.5-3 8"/><path d="m9 9 6 6M15 9l-6 6"/>',
  measurement: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>'
};
const ICON = {
  arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  menu: '<svg class="i-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg class="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  key: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 15 2 2 4-4"/>'),
  infinite: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  sliders: svg('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  grad: svg('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>')
};
const catIcon = (slug) => svg(CAT_ICONS[slug] || CAT_ICONS.addition);

// ---------- ads ----------
const adsOn = config.ads.enabled && /^ca-pub-\d{10,20}$/.test(config.ads.client);
if (config.ads.enabled && !adsOn) warnings.push('ADS_ENABLED is true but ADSENSE_CLIENT is missing or invalid: ads were NOT included.');

function adSlot(name) {
  const slot = config.ads.slots[name];
  if (!adsOn || !slot) return '';
  return `<aside class="ad" aria-label="Advertisement"><span class="ad-label">Advertisement</span>` +
    `<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(config.ads.client)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>` +
    `<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></aside>`;
}

// ---------- layout ----------
function ogImageFor(pathName) {
  // Share images are pre-rendered by scripts/make-og.js into static/og/ (committed to the repo).
  const slug = pathName.split('/').filter(Boolean).pop() || 'home';
  for (const name of [slug, 'default']) if (fs.existsSync(path.join(STATIC, 'og', name + '.jpg'))) return abs(`/og/${name}.jpg`);
  return '';
}

// "Save to Pinterest" link with the vertical pin image rendered by scripts/make-pins.js (plain link,
// no Pinterest script, so nothing third-party loads until the visitor clicks).
function pinLink(t) {
  if (!fs.existsSync(path.join(STATIC, 'pins', t.slug + '.jpg'))) return '';
  const q = new URLSearchParams({ url: abs(typeUrl(t)), media: abs(`/pins/${t.slug}.jpg`), description: `${t.h1.charAt(0).toUpperCase() + t.h1.slice(1)} – free printable with answer key` });
  return `<a class="btn btn-secondary" id="ws-pin" href="https://www.pinterest.com/pin/create/button/?${esc(q.toString())}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-6"/><path d="M8 3h8l-1 6 3 3v2H6v-2l3-3z"/></svg><span>Save<span class="hide-sm"> to Pinterest</span></span></a>`;
}

function layout(assets, { title, desc, pathName, body, jsonld = [], noindex = false, scripts = true, bodyClass = '', lang = 'en', alternates = [], ogImage: ogOverride = '', css = [], js = [], champ = false }) {
  const canonical = abs(pathName);
  const ogImage = ogOverride || ogImageFor(pathName);
  const ch = CT[lang].chrome;
  const champHome = (lang === 'en' ? '' : '/' + lang) + '/multiplication-championship/';
  const headExtra = [];
  if (config.pinterestVerification) headExtra.push(`<meta name="p:domain_verify" content="${esc(config.pinterestVerification)}">`);
  if (config.googleSiteVerification) headExtra.push(`<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">`);
  if (/^ca-pub-\d{10,20}$/.test(config.ads.client)) headExtra.push(`<meta name="google-adsense-account" content="${esc(config.ads.client)}">`);
  if (config.analyticsToken) headExtra.push(`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: config.analyticsToken })}'></script>`);
  // Championship pages are used by children: when ads are on, only non-personalised ads are requested there.
  if (adsOn && champ) headExtra.push('<script>(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1</script>');
  if (adsOn) headExtra.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.ads.client)}" crossorigin="anonymous"></script>`);
  for (const a of alternates) headExtra.push(`<link rel="alternate" hreflang="${a.lang}" href="${esc(abs(a.path))}">`);
  if (alternates.length) headExtra.push(`<link rel="alternate" hreflang="x-default" href="${esc(abs(alternates[0].path))}">`);
  for (const href of css) headExtra.push(`<link rel="stylesheet" href="${href}">`);
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  const catName = (c) => ch.cats[c.slug] || c.name;
  const nav = `<li class="nav-champ"><a href="${champHome}"${pathName.includes('/multiplication-championship/') ? ' aria-current="page"' : ''}>${CHAMP.TROPHY}${esc(ch.championship)}</a></li>` +
    categories.map((c) => `<li><a href="/${c.slug}/"${pathName.startsWith('/' + c.slug + '/') ? ' aria-current="page"' : ''}>${esc(catName(c))}</a></li>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(ogImage)}">` : '<meta name="twitter:card" content="summary">'}
<meta name="theme-color" content="#0B1020">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${assets.font}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
<script>document.documentElement.classList.add('js')</script>
${headExtra.join('\n')}
${ld}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">${esc(ch.skip)}</a>
<header class="site-head" id="site-head"><div class="wrap head-row">
<a class="logo" href="/" aria-label="${esc(config.name)} home">${LOGO('lg-h')}<span>MathSheet<b>Lab</b></span></a>
<nav class="nav" id="site-nav" aria-label="Main"><ul>${nav}</ul></nav>
<a class="btn btn-primary btn-sm head-cta" href="/#all">${esc(ch.allWorksheets)}</a>
<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="visually-hidden">${esc(ch.menu)}</span>${ICON.menu}${ICON.close}</button>
</div></header>
<main id="main">
${body}
</main>
${footer(lang)}
<script src="${assets.ui}" defer></script>
${scripts ? `<script src="${assets.js}" defer></script>` : ''}${js.map((src) => `<script src="${src}" defer></script>`).join('')}
</body>
</html>
`;
}

function footer(lang = 'en') {
  const ch = CT[lang].chrome;
  const cols = [
    [ch.footWorksheets, categories.slice(0, 4)],
    [ch.footMore, categories.slice(4)]
  ].map(([h, cats]) => `<div><h2>${esc(h)}</h2><ul>${cats.map((c) => `<li><a href="/${c.slug}/">${esc(ch.cats[c.slug] || c.name)}</a></li>`).join('')}</ul></div>`).join('');
  const privacyBtn = adsOn ? '<li><button type="button" class="linklike" onclick="(window.googlefc=window.googlefc||{}).callbackQueue=(window.googlefc.callbackQueue||[]);googlefc.callbackQueue.push(googlefc.showRevocationMessage)">Privacy &amp; cookie settings</button></li>' : '';
  return `<footer class="site-foot dark"><div class="glow" aria-hidden="true"></div><div class="wrap foot-grid">
<div class="foot-brand"><a class="logo" href="/">${LOGO('lg-f')}<span>MathSheet<b>Lab</b></span></a><p>${lang === 'en' ? `${esc(config.tagline)}. Answer keys included, no sign-up.` : esc(ch.tagline)}</p></div>
${cols}
${CHAMP.footerColumn(lang)}
<div><h2>${esc(ch.footSite)}</h2><ul>${lang === 'en' ? '<li><a href="/assign/">Class assignments</a></li>' : ''}${lang === 'ja' ? `<li><a href="${KUKU_PATH}">九九ゲーム</a></li>` : ''}<li><a href="/about/">${esc(ch.about)}</a></li><li><a href="/contact/">${esc(ch.contact)}</a></li><li><a href="/privacy/">${esc(ch.privacy)}</a></li><li><a href="/terms/">${esc(ch.terms)}</a></li><li><a href="/legal/">${esc(ch.legal)}</a></li>${privacyBtn}</ul></div>
<p class="foot-note">${esc(ch.footNote)} © ${new Date().getFullYear()} ${esc(config.name)}.</p>
</div></footer>`;
}

function crumbs(items) {
  const html = '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + items.map((it, i) =>
    i === items.length - 1 ? `<li aria-current="page">${esc(it.name)}</li>` : `<li><a href="${it.path}">${esc(it.name)}</a></li>`).join('') + '</ol></nav>';
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) }))
  };
  return { html, ld };
}

function card(t, i = 0) {
  const search = [t.h1, t.title, t.grade, catBySlug[t.cat].name, t.slug.replace(/-/g, ' ')].join(' ').toLowerCase();
  return `<li class="card reveal" style="--d:${i % 4}" data-search="${esc(search)}"><a class="stretch" href="${typeUrl(t)}">${esc(t.h1)}</a><p>${esc(t.intro[0].split('. ')[0])}.</p><span class="grade">${esc(t.grade)}</span></li>`;
}

function clientTypeOf(t) {
  return { slug: t.slug, gen: t.gen, params: t.params, cols: t.cols, counts: t.counts, count: t.count, h1: t.h1, sheetTitle: sheetTitle(t), instruction: t.instruction, grade: t.grade, layout: t.layout };
}

const siteHost = () => new URL(config.url).host;

// Title printed on the sheet: the page heading without the trailing "worksheets" (SEO wording).
function sheetTitle(t) {
  const s = t.h1.replace(/\s+worksheets?$/i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// A real sheet from the engine (same output as the generator page), used as an illustration.
function sampleSheets(slug, count, withKey) {
  const ct = clientTypeOf(typeBySlug[slug]);
  const seed = MSL.hashString(ct.slug);
  const problems = MSL.generate(ct, seed, count);
  const opts = { seed, siteName: config.name, cols: ct.cols, title: ct.sheetTitle };
  return { seed, sheet: MSL.renderSheet(ct, problems, opts), key: withKey ? MSL.renderSheet(ct, problems, { ...opts, answers: true }) : '' };
}

function gradeLinks(current) {
  return `<ul class="grade-grid">${grades.map((g) => `<li><a href="${gradeUrl(g)}"${g === current ? ' aria-current="page"' : ''}><b>${esc(g.short)}</b><span>${esc(g.name)}</span><small>${typesForGrade(g).length} worksheets</small></a></li>`).join('')}</ul>`;
}

function catCard(c, i = 0) {
  const n = types.filter((t) => t.cat === c.slug).length;
  return `<li class="cat-card reveal" style="--d:${i % 4}"><span class="cat-icon">${catIcon(c.slug)}</span><h3><a class="stretch" href="/${c.slug}/">${esc(c.name)}</a></h3><p>${esc(c.blurb)}</p><span class="cat-count">${n} worksheets ${ICON.arrow}</span></li>`;
}

// "Grade 3 – Grade 4" / "Kindergarten – Grade 1" → overall range of a list, e.g. "K–Grade 4".
function gradeRange(list) {
  const nums = list.flatMap((t) => (t.grade.match(/Kindergarten|\d+/g) || []).map((g) => (g === 'Kindergarten' ? 0 : +g)));
  const lo = Math.min(...nums), hi = Math.max(...nums);
  if (lo === hi) return lo === 0 ? 'Kindergarten' : `Grade ${lo}`;
  return lo === 0 ? `K–Grade ${hi}` : `Grades ${lo}–${hi}`;
}

// ---------- pages ----------
function homePage(assets) {
  const front = sampleSheets('multiplication-table-of-7', 15);
  const stack = `<div class="hero-visual no-print" aria-hidden="true"><div class="stack">
<div class="stack-card c3">${sampleSheets('long-division-no-remainder', 6).sheet}</div>
<div class="stack-card c2">${sampleSheets('adding-fractions-like-denominators', 9).sheet}</div>
<div class="stack-card c1">${front.sheet}</div>
<span class="stack-tag t2">Worksheet #${front.seed}</span>
<span class="stack-tag t1"><span class="ok">${ICON.check}</span>Answer key included</span>
</div></div>`;

  const catCards = categories.map(catCard).join('');

  const demo = sampleSheets('three-digit-addition', 12, true);
  const groups = categories.map((c) => {
    const list = types.filter((t) => t.cat === c.slug);
    return `<section class="group" data-group aria-labelledby="g-${c.slug}"><div class="cat-head"><h2 id="g-${c.slug}">${catIcon(c.slug)}${esc(c.name)}</h2><a href="/${c.slug}/">All ${list.length} ${esc(c.name.toLowerCase())} worksheets</a></div><ul class="cards">${list.map(card).join('')}</ul></section>`;
  }).join('\n');

  const benefits = [
    [ICON.key, 'Answer key with every sheet', 'The answer key prints on a separate page, computed by the same rules as the problems.'],
    [ICON.infinite, 'Unlimited fresh sheets', 'Press New problems as often as you like for a different sheet. No limit and no account.'],
    [ICON.link, 'Share the exact sheet', 'Every sheet has a number, for example #482913. Its link always opens exactly the same problems, handy for a whole class.'],
    [ICON.shield, 'Private, nothing to install', 'Problems are generated in your browser. Nothing you type is sent to a server, and there is no sign-up or email.']
  ].map(([icon, h, p], i) => `<li class="benefit reveal" style="--d:${i}"><span class="b-icon">${icon}</span><h3>${h}</h3><p>${p}</p></li>`).join('');

  const body = `
<section class="hero dark" aria-labelledby="hero-h">
<div class="glow" aria-hidden="true"></div><div class="glow glow-2" aria-hidden="true"></div>
<div class="wrap hero-grid">
<div class="hero-copy">
<p class="eyebrow"><span class="pill">Free</span>Printable math worksheets · K–Grade 7</p>
<h1 id="hero-h">Beautiful math worksheets. <span class="grad-text">Made in seconds.</span></h1>
<p class="lead">Create, customize and print free math worksheets with answer keys, from kindergarten to grade 7.</p>
<div class="hero-actions"><a class="btn btn-primary btn-lg" href="#all">Browse all ${types.length} worksheets ${ICON.arrow}</a><a class="btn btn-ghost btn-lg" href="/multiplication/multiplication-facts-0-12/">Try the times tables</a></div>
<ul class="hero-facts"><li>${ICON.check}${types.length} worksheet types</li><li>${ICON.check}Answer keys</li><li>${ICON.check}No sign-up</li></ul>
</div>
${stack}
</div>
</section>

<section class="section" aria-labelledby="cats-h">
<div class="wrap">
<div class="section-head reveal"><p class="kicker">Browse by topic</p><h2 id="cats-h">Every core skill, from first sums to pre‑algebra</h2><p>${categories.length} topics and ${types.length} focused generators. Each one makes a new printable sheet in one click.</p></div>
<ul class="cat-grid">${catCards}</ul>
</div>
</section>

<section class="section grades-sec" aria-labelledby="grades-h">
<div class="wrap">
<div class="section-head reveal"><p class="kicker">Browse by grade</p><h2 id="grades-h">Math worksheets for every grade, K to 7</h2><p>Every worksheet that fits a grade, grouped by topic, with what students usually learn that year.</p></div>
${gradeLinks()}
</div>
</section>

<section class="section demo dark" aria-labelledby="how-h">
<div class="glow" aria-hidden="true"></div>
<div class="wrap demo-grid">
<div>
<div class="section-head reveal"><p class="kicker">How it works</p><h2 id="how-h">From skill to printed sheet in three steps</h2></div>
<ol class="steps">
<li class="reveal" style="--d:0"><h3>Pick a skill</h3><p>Each worksheet page focuses on one precise skill and has its own generator.</p></li>
<li class="reveal" style="--d:1"><h3>Set the options</h3><p>Choose the number of problems, a title, US Letter or A4, large print and the answer key. Press <strong>New problems</strong> for a different sheet.</p></li>
<li class="reveal" style="--d:2"><h3>Print or save as PDF</h3><p>Press <strong>Print / Save as PDF</strong>. Only the worksheet prints, and the answer key comes out on its own page.</p></li>
</ol>
<a class="btn btn-primary" href="/addition/three-digit-addition/">Open this generator ${ICON.arrow}</a>
</div>
<div class="demo-visual no-print" aria-hidden="true">
<figure class="demo-paper reveal" style="--d:1"><div class="frame">${demo.sheet}</div><figcaption><b>Worksheet</b> · page 1</figcaption></figure>
<figure class="demo-paper reveal" style="--d:2"><div class="frame">${demo.key}</div><figcaption><b>Answer key</b> · page 2</figcaption></figure>
</div>
</div>
</section>

<section class="section" aria-labelledby="why-h">
<div class="wrap">
<div class="section-head reveal"><p class="kicker">Why teachers and parents use it</p><h2 id="why-h">Simple, free and made for the classroom</h2></div>
<ul class="benefits">${benefits}</ul>
</div>
</section>

${CHAMP.homeSection()}

<section class="section all" id="all" aria-labelledby="all-h">
<div class="wrap">
<div class="all-head"><div class="section-head"><p class="kicker">All worksheets</p><h2 id="all-h">Find the right worksheet</h2></div>
<div class="search" role="search"><label for="ws-search" class="visually-hidden">Search worksheets</label>
<input id="ws-search" type="search" placeholder="Search: fractions, 7 times table, long division…" autocomplete="off">
<p class="search-meta" id="ws-search-count" aria-live="polite"></p></div></div>
<p id="ws-search-empty" hidden>No worksheet matches your search. Try a simpler word such as “addition” or “fractions”.</p>
<div>${groups}</div>
</div>
</section>`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url: abs('/'), description: config.tagline, inLanguage: 'en'
  }];
  return layout(assets, {
    title: `Free Printable Math Worksheets With Answer Keys | ${config.name}`,
    desc: `Generate free printable math worksheets: addition, subtraction, times tables, long division, fractions, decimals and more. Answer keys, unlimited sheets, no sign-up.`,
    pathName: '/', body, jsonld: ld, bodyClass: 'home', css: [assets.champCss], js: [assets.champWidget]
  });
}

function categoryPage(assets, c) {
  const list = types.filter((t) => t.cat === c.slug);
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}/` }]);
  const others = categories.filter((x) => x.slug !== c.slug);
  const body = `<section class="page-head dark ws-intro"><div class="glow" aria-hidden="true"></div><div class="wrap">${bc.html}
<div class="title-row"><span class="head-icon" aria-hidden="true">${catIcon(c.slug)}</span><h1>${esc(c.name)} worksheets</h1></div>
<ul class="chips meta" aria-label="About these worksheets"><li>${ICON.grad}${esc(gradeRange(list))}</li><li>${list.length} worksheets</li><li>Free</li><li>Answer keys included</li></ul>
<p class="lead">${esc(c.blurb)} All ${list.length} worksheets below are free to print, generate new problems every time and include an answer key.</p></div></section>
<div class="wrap page-body"><ul class="cards">${list.map(card).join('')}</ul>${c.slug === 'multiplication' ? CHAMP.multBanner() : ''}</div>
<section class="section other-topics" aria-labelledby="other-h"><div class="wrap">
<div class="section-head reveal"><p class="kicker">Keep practicing</p><h2 id="other-h">Other topics</h2></div>
<ul class="cat-grid">${others.map(catCard).join('')}</ul>
</div></section>`;
  const ld = [bc.ld, {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${c.name} worksheets`, url: abs(`/${c.slug}/`),
    hasPart: list.map((t) => ({ '@type': 'LearningResource', name: t.h1, url: abs(typeUrl(t)) }))
  }];
  return layout(assets, {
    title: `${c.name} Worksheets – Free Printable With Answer Keys | ${config.name}`.slice(0, 90),
    desc: `${list.length} free printable ${c.name.toLowerCase()} worksheets. ${c.blurb}`.slice(0, 160),
    pathName: `/${c.slug}/`, body, jsonld: ld, ...(c.slug === 'multiplication' ? { css: [assets.champCss] } : {})
  });
}

function worksheetPage(assets, t) {
  const c = catBySlug[t.cat];
  const seed = MSL.hashString(t.slug);
  const clientType = clientTypeOf(t);
  const problems = MSL.generate(clientType, seed, t.count);
  const sheetOpts = { seed, siteName: config.name, siteHost: siteHost(), cols: t.cols, title: clientType.sheetTitle, paper: 'letter', answers: true };
  const sheets = LAYOUT.renderWorksheet(clientType, problems, sheetOpts);
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}/` }, { name: t.h1, path: typeUrl(t) }]);
  const siblings = types.filter((x) => x.cat === t.cat && x.slug !== t.slug);
  const related = (t.related || []).map((s) => typeBySlug[s]);
  const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const worked = workedExample(t, clientType);

  const body = `<section class="page-head dark ws-intro has-panel"><div class="glow" aria-hidden="true"></div><div class="wrap">${bc.html}
<h1>${esc(t.h1.charAt(0).toUpperCase() + t.h1.slice(1))}</h1>
<ul class="chips meta" aria-label="About this worksheet"><li>${ICON.grad}Level: ${esc(t.grade)}</li><li>Free</li><li>Printable</li><li>Answer key included</li></ul>
<p class="lead">${esc(t.intro[0])}</p>
<p class="head-actions"><a class="btn btn-ghost btn-sm" href="#practice">${icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>')}Practice online</a></p>
</div></section>
<div class="workspace"><div class="wrap ws-layout">
<aside class="panel ws-controls" aria-labelledby="opts-h">
<h2 id="opts-h" class="panel-title">${ICON.sliders}Worksheet options</h2>
<form id="ws-form">
<fieldset>
<legend>Layout</legend>
<div class="field-row">
<div class="field"><label for="f-count">Problems</label>
<select id="f-count" name="count">${t.counts.map((n) => `<option value="${n}"${n === t.count ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
<div class="field"><label for="f-paper">Paper size</label>
<select id="f-paper" name="paper"><option value="letter">US Letter</option><option value="a4">A4</option></select></div>
</div>
</fieldset>
<fieldset>
<legend>Sheet</legend>
<div class="field"><label for="f-title">Sheet title (optional)</label>
<input id="f-title" name="title" type="text" maxlength="80" placeholder="${esc(clientType.sheetTitle)}"></div>
<label class="check"><input type="checkbox" name="answers" checked> Include answer key (page 2)</label>
<label class="check"><input type="checkbox" name="large"> Large print</label>
</fieldset>
</form>
<div class="ws-actions">
<button type="button" class="btn btn-primary" id="ws-print">${icon('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>')}<span>Print<span class="hide-sm"> / Save as PDF</span></span></button>
<button type="button" class="btn btn-secondary" id="ws-new">${icon('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>')}<span>New<span class="hide-sm"> problems</span></span></button>
<button type="button" class="btn btn-secondary" id="ws-copy">${icon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>')}<span>Copy link<span class="visually-hidden"> to this sheet</span></span></button>
${pinLink(t)}
<p class="status" id="ws-status" role="status" aria-live="polite"></p>
</div>
<p class="seed"><span>Worksheet <span id="ws-seed">#${seed}</span>. The same link always gives the same problems.</span></p>
<noscript><p class="notice">JavaScript is off: you can still print the sample worksheet below with your browser’s print command.</p></noscript>
</aside>
<section aria-label="Worksheet preview" class="preview">
<div class="preview-bar no-print"><span class="live"><i aria-hidden="true"></i>Live preview</span><span class="hint">Updates as you change the options</span></div>
<div class="sheet-wrap desk" id="ws-output">${sheets}</div>
</section>
</div></div>
<div class="wrap more">
${practiceCard(t)}
${t.cat === 'multiplication' ? CHAMP.multBanner('compact') : ''}
${adSlot('top')}
<section class="content">
<h2>About this worksheet</h2>
${t.intro.slice(1).map((p) => `<p>${esc(p)}</p>`).join('')}
<p>Each sheet contains ${t.counts.join(', ').replace(/, (\d+)$/, ' or $1')} problems (your choice) and is generated at random. Press “New problems” as many times as you like; there is no limit and no account needed.</p>
${worked}
${mistakesHtml(t)}
<h2>Teaching tips</h2>
<ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>How to print or save as PDF</h2>
<ol><li>Choose the options on the left (on a phone, above the preview).</li><li>Press <strong>Print / Save as PDF</strong>.</li><li>In the print window, pick your printer, or choose “Save as PDF” as the destination.</li></ol>
<p>Only the worksheet and its answer key are printed; menus and buttons are hidden automatically.</p>
<p class="grade-line">Grade level: ${gradesOf(t).map((n) => `<a href="${gradeUrl(gradeByN[n])}">${esc(gradeByN[n].h1)}</a>`).join(' · ')}</p>
</section>
${skillPath(t)}
${related.length ? `<section class="related"><h2>Related worksheets</h2><ul>${related.map((r) => `<li><a href="${typeUrl(r)}">${esc(r.h1)}</a></li>`).join('')}</ul></section>` : ''}
${siblings.length ? `<section class="related"><h2>More ${esc(c.name.toLowerCase())} worksheets</h2><ul>${siblings.map((r) => `<li><a href="${typeUrl(r)}">${esc(r.h1)}</a></li>`).join('')}</ul></section>` : ''}
${adSlot('bottom')}
</div>
<script type="application/json" id="ws-config">${JSON.stringify({ type: clientType, defaultSeed: seed, siteName: config.name, siteHost: siteHost(), explainJs: assets.explain }).replace(/</g, '\\u003c')}</script>`;

  const ld = [bc.ld, {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: clientType.sheetTitle, description: t.desc,
    url: abs(typeUrl(t)), learningResourceType: 'Worksheet', educationalLevel: t.grade, inLanguage: 'en',
    isAccessibleForFree: true, about: c.name, publisher: { '@type': 'Organization', name: config.name, url: abs('/') }
  }];
  return layout(assets, { title: t.title, desc: t.desc, pathName: typeUrl(t), body, jsonld: ld, bodyClass: 'has-actionbar', ...(t.cat === 'multiplication' ? { css: [assets.champCss] } : {}) });
}

// Short, stable code per worksheet for assignment links (keeps links short enough for a QR code).
const assignCode = (t) => MSL.hashString(t.slug).toString(36);
function validateAssignCodes() {
  const seen = new Map();
  for (const t of types) {
    const c = assignCode(t);
    if (seen.has(c)) throw new Error(`Assignment code collision: ${t.slug} and ${seen.get(c)} (${c})`);
    seen.set(c, t.slug);
  }
}

// Class assignments: the teacher builds a link here; students open the same page with ?w=... and do the
// questions online (src/assign.js). Everything runs in the browser; no account and no stored data.
function assignPage(assets) {
  validateAssignCodes();
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: 'Class assignments', path: '/assign/' }]);
  const catalog = types.map((t) => ({ slug: t.slug, code: assignCode(t), gen: t.gen, params: t.params, h1: t.h1, instruction: t.instruction, grade: t.grade, url: typeUrl(t) }));
  const options = categories.map((c) => `<optgroup label="${esc(c.name)}">${types.filter((t) => t.cat === c.slug)
    .map((t) => `<option value="${esc(t.slug)}">${esc(t.h1.replace(/ worksheets?$/i, ''))} (${esc(t.grade)})</option>`).join('')}</optgroup>`).join('');
  const level = (v, label, sub) => `<label class="seg-opt"><input type="radio" name="level" value="${v}"${v === 'medium' ? ' checked' : ''}><span><strong>${label}</strong><small>${sub}</small></span></label>`;
  const body = `<section class="page-head dark"><div class="glow" aria-hidden="true"></div><div class="wrap">${bc.html}
<h1>Free online math assignments for your class</h1>
<p class="lead">Pick up to five skills, share one link or QR code, and students answer on any device with instant feedback. They send you a score code you can check here. No sign-up for you or your students.</p>
</div></section>
<div class="wrap page-body">
<div id="as-teacher">
<section class="as-panel" aria-labelledby="as-build-h">
<h2 id="as-build-h">1. Build the assignment</h2>
<form id="as-form" novalidate>
<div class="field"><label for="as-pick">Skills (up to 5)</label>
<div class="as-pick-row"><select id="as-pick"><option value="">Choose a worksheet…</option>${options}</select>
<button type="button" class="btn btn-secondary" id="as-add">Add</button></div></div>
<ol class="as-chosen" id="as-chosen" aria-live="polite"></ol>
<p class="as-empty" id="as-empty">No skill added yet.</p>
<fieldset class="seg"><legend>Level</legend>${level('easy', 'Easy', 'Smaller numbers')}${level('medium', 'Medium', 'Like the worksheets')}${level('hard', 'Hard', 'Bigger challenge')}</fieldset>
<div class="field-row">
<div class="field"><label for="as-q">Questions per skill</label><select id="as-q" name="q"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option></select></div>
<div class="field"><label for="as-title">Title (optional)</label><input id="as-title" name="t" type="text" maxlength="60" placeholder="e.g. Week 3 homework"></div>
</div>
<button type="submit" class="btn btn-primary btn-lg" id="as-create">Create the link</button>
<p class="as-error" id="as-error" role="alert"></p>
</form>
</section>
<section class="as-panel" id="as-share" hidden aria-labelledby="as-share-h">
<h2 id="as-share-h">2. Share it with your students</h2>
<div class="as-share-grid">
<div class="as-qr" id="as-qr"></div>
<div>
<div class="field"><label for="as-link">Assignment link</label><input id="as-link" type="text" readonly></div>
<div class="as-buttons"><button type="button" class="btn btn-primary" id="as-copy">Copy link</button><a class="btn btn-secondary" id="as-try" href="#" target="_blank" rel="noopener">Try it as a student</a></div>
<p class="as-note">Every student gets the same questions, so scores are comparable. Show the QR code on the board, or paste the link in your class page or e-mail.</p>
</div>
</div>
</section>
<section class="as-panel" aria-labelledby="as-check-h">
<h2 id="as-check-h">3. Check the results</h2>
<p>At the end, each student gets a result line such as <code>Lea — 18/20 — 4:32 — try 1 — K7Q2MD</code> to copy and send you. Paste the lines below: the code shows whether a line belongs to this assignment and was not edited.</p>
<div class="field"><label for="as-check-link">Assignment link</label><input id="as-check-link" type="text" placeholder="Paste the assignment link"></div>
<div class="field"><label for="as-results">Result lines (one per student)</label><textarea id="as-results" rows="6" placeholder="Lea — 18/20 — 4:32 — try 1 — K7Q2MD"></textarea></div>
<button type="button" class="btn btn-secondary" id="as-verify">Check results</button>
<div id="as-table" aria-live="polite"></div>
</section>
<section class="content as-about">
<h2>How it works</h2>
<ol><li>Choose the skills, the level and the number of questions. Questions come from the same generators as the printable worksheets.</li><li>Share the link or the QR code. Students open it on a phone, tablet or computer and type a first name or nickname.</li><li>They answer one question at a time, see the right answer and a step-by-step explanation after a mistake, and get a score.</li><li>They send you their result line; paste the lines here to see everyone’s score in a table.</li></ol>
<h2>Privacy</h2>
<p>Nothing is stored on our servers: the assignment is entirely in the link, and the student’s answers and nickname stay on their device. A result line only leaves the device if the student copies and sends it. Ask students to use a first name or nickname, never a full name. The check code lets you spot a line that was edited by hand; it cannot prove who typed the answers.</p>
</section>
</div>
<div id="as-student" hidden>
<section class="as-panel as-student-panel" aria-labelledby="as-st-h">
<p class="kicker">Class assignment</p>
<h2 id="as-st-h"></h2>
<ul class="as-skills" id="as-st-skills"></ul>
<form id="as-st-form" novalidate>
<div class="field"><label for="as-name">Your first name or nickname</label><input id="as-name" type="text" maxlength="24" autocomplete="off" placeholder="e.g. Lea"></div>
<p class="as-note">Don’t type your full name. It stays on this device and only appears on the result you choose to send.</p>
<button type="submit" class="btn btn-primary btn-lg">Start</button>
<p class="as-error" id="as-st-error" role="alert"></p>
</form>
</section>
</div>
<noscript><p class="notice">Class assignments need JavaScript.</p></noscript>
</div>
<script type="application/json" id="as-config">${JSON.stringify({ catalog, explainJs: assets.explain }).replace(/</g, '\\u003c')}</script>`;
  return layout(assets, {
    title: `Free Online Math Assignments for Teachers, No Sign-Up | ${config.name}`,
    desc: 'Create a free online math assignment in seconds: pick skills, share a link or QR code, students get instant feedback and send you a checkable score. No accounts.',
    pathName: '/assign/', body, jsonld: [bc.ld], js: [assets.qr, assets.assign]
  });
}

function mistakesHtml(t) {
  const list = mistakesFor(t);
  if (!list.length) return '';
  return `<h2>Common mistakes and how to fix them</h2>
<ul class="mistakes">${list.map(([m, f]) => `<li><strong>${esc(m)}</strong> ${esc(f)}</li>`).join('')}</ul>`;
}

// Previous and next worksheet in the same topic (the catalog lists each topic from easiest to hardest).
function skillPath(t) {
  const list = types.filter((x) => x.cat === t.cat), i = list.indexOf(t);
  const prev = list[i - 1], next = list[i + 1];
  if (!prev && !next) return '';
  const link = (x, label) => `<a class="path-step" href="${typeUrl(x)}"><small>${label}</small><span>${esc(x.h1)}</span></a>`;
  return `<nav class="skill-path no-print" aria-label="Skill path">${prev ? link(prev, 'Before this') : '<span></span>'}${next ? link(next, 'Next step') : ''}</nav>`;
}

function gradePage(assets, g) {
  const list = typesForGrade(g);
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: g.name, path: gradeUrl(g) }]);
  const groups = categories.map((c) => {
    const ofCat = list.filter((t) => t.cat === c.slug);
    if (!ofCat.length) return '';
    return `<section class="group" aria-labelledby="g-${c.slug}"><div class="cat-head"><h2 id="g-${c.slug}">${catIcon(c.slug)}${esc(c.name)}</h2><a href="/${c.slug}/">All ${esc(c.name.toLowerCase())} worksheets</a></div><ul class="cards">${ofCat.map(card).join('')}</ul></section>`;
  }).join('\n');
  const prev = gradeByN[g.n - 1], next = gradeByN[g.n + 1];
  const body = `<section class="page-head dark ws-intro"><div class="glow" aria-hidden="true"></div><div class="wrap">${bc.html}
<h1>${esc(g.h1.charAt(0).toUpperCase() + g.h1.slice(1))}</h1>
<ul class="chips meta" aria-label="About these worksheets"><li>${ICON.grad}${esc(g.name)}</li><li>${list.length} worksheets</li><li>Free</li><li>Answer keys included</li><li>Online practice</li></ul>
<p class="lead">${esc(g.intro[0])}</p></div></section>
<div class="wrap page-body">
<section class="content grade-intro">
<p>${esc(g.intro[1])}</p>
<h2>What ${esc(g.name.toLowerCase() === 'kindergarten' ? 'kindergarten' : g.name)} students practice here</h2>
<ul>${g.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<p>Every worksheet generates new problems each time, prints with an answer key on page 2, and can also be done online with instant checking. Teachers can <a href="/assign/">send several of them as one online assignment</a>, with no sign-up.</p>
</section>
${groups}
<section class="content grade-more">
<h2>Other grades</h2>
<p>${prev ? `Need a review? See the <a href="${gradeUrl(prev)}">${esc(prev.h1)}</a>. ` : ''}${next ? `Ready for more? Try the <a href="${gradeUrl(next)}">${esc(next.h1)}</a>.` : ''}</p>
${gradeLinks(g)}
</section>
</div>`;
  const ld = [bc.ld, {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: g.h1, url: abs(gradeUrl(g)), educationalLevel: g.name,
    hasPart: list.map((t) => ({ '@type': 'LearningResource', name: t.h1, url: abs(typeUrl(t)) }))
  }];
  return layout(assets, { title: `${g.title}`, desc: g.desc, pathName: gradeUrl(g), body, jsonld: ld });
}

// Online practice entry point (the practice itself runs in a dialog, see src/practice-ui.js).
function practiceCard(t) {
  const level = (v, label, sub) => `<label class="seg-opt"><input type="radio" name="level" value="${v}"${v === 'medium' ? ' checked' : ''}><span><strong>${label}</strong><small>${sub}</small></span></label>`;
  return `<section class="practice-card no-print" id="practice" aria-labelledby="pr-h">
<div class="pr-card-text"><p class="kicker">Answer on screen</p><h2 id="pr-h">Practice online</h2>
<p>Answer the problems right here, one at a time. Each answer is checked instantly, with a step-by-step explanation after a mistake and a score at the end. No account needed, and nothing is sent to our servers.</p>
<p class="pr-best" id="pr-best"></p>
<p class="pr-teacher"><a href="/assign/?add=${esc(t.slug)}">Teachers: assign this to your class</a> (one link, no sign-up).</p></div>
<form id="pr-start" class="pr-start">
<fieldset class="seg"><legend>Level</legend>${level('easy', 'Easy', 'Smaller numbers')}${level('medium', 'Medium', 'Like the worksheet')}${level('hard', 'Hard', 'Bigger challenge')}</fieldset>
<div class="pr-start-row"><div class="field"><label for="pr-n">Questions</label><select id="pr-n" name="n"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option></select></div>
<button type="submit" class="btn btn-primary btn-lg">Start practice</button></div>
<noscript><p class="notice">Online practice needs JavaScript. You can still print the worksheet above.</p></noscript>
</form>
</section>`;
}

// One fully explained problem per page. Among a few candidates, take the one with the most steps
// (usually the one that shows regrouping, borrowing, simplifying...).
function workedExample(t, clientType) {
  const candidates = MSL.generate(clientType, MSL.hashString(t.slug) + 1, 12);
  let best = null;
  for (const p of candidates) {
    const ex = explain(clientType, p);
    if (!best || ex.steps.length > best.ex.steps.length) best = { p, ex };
  }
  const { p, ex } = best;
  // "1 5/21" reads like 15/21 in running text: spell mixed numbers as "1 and 5/21".
  const mixed = (x) => esc(x).replace(/(^|[^\d/])(\d+) (\d+\/\d+)/g, '$1$2 and $3');
  return `<h2>Worked example</h2>
<div class="worked">
<div class="worked-problem" aria-label="Example problem">${MSL.renderProblem(p, false)}</div>
<ol class="worked-steps">${ex.steps.map((x) => `<li>${mixed(x)}</li>`).join('')}</ol>
<p class="worked-answer">Answer: <strong>${mixed(ex.answer)}</strong></p>
</div>`;
}

function contactLine() {
  return config.contactEmail
    ? `<a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>`
    : '<em>(no contact address has been published yet)</em>';
}

function staticPages(assets) {
  const pages = [];
  const page = (p, title, desc, h1, html) => pages.push({ p, html: layout(assets, { title: `${title} | ${config.name}`, desc, pathName: p, body: `<section class="page-head dark"><div class="glow" aria-hidden="true"></div><div class="wrap"><p class="kicker">${esc(config.name)}</p><h1>${esc(h1)}</h1></div></section><div class="wrap page-body"><article class="content paper">${html}</article></div>`, scripts: false }) });

  page('/about/', 'About', `About ${config.name}: free printable math worksheets generated in the browser.`, `About ${config.name}`, `
<p>${esc(config.name)} is a free collection of math worksheet generators for parents, teachers, tutors and home-schoolers. Each page focuses on one precise skill, from addition within 10 to integers and percentages, and produces a new printable sheet with an answer key in one click.</p>
<h2>Why another worksheet site?</h2>
<p>Most worksheet sites offer a fixed set of PDFs. Here every sheet is generated on demand, so you never run out of practice, and each sheet has a reproducible number so a whole class can work on the same problems.</p>
<h2>How the problems are made</h2>
<p>Problems are produced by small, tested programs that follow explicit rules (for example “every problem needs regrouping” or “answers are never negative”). There is no artificial intelligence and no human picking numbers; the rules for each sheet are described on its page. Answer keys are computed, not typed by hand.</p>
<h2>Free to use</h2>
<p>You may print and photocopy the worksheets for personal, home and classroom use. See the <a href="/terms/">terms of use</a>.</p>
<h2>Contact</h2><p>Found a mistake or want a new worksheet type? See the <a href="/contact/">contact page</a>.</p>`);

  page('/contact/', 'Contact', `How to contact ${config.name} to report a mistake in a worksheet, suggest a new worksheet type or ask a question.`, 'Contact', `
<p>To report an error in a worksheet, suggest a new worksheet type or ask a question, write to: ${contactLine()}.</p>
<p>When reporting an error, please include the worksheet number (for example #482913) or copy the page link; it lets us reproduce exactly the same sheet.</p>`);

  const adsSection = adsOn ? `
<h2>Advertising and cookies</h2>
<p>This site shows advertising provided by Google AdSense. Google and its partners may use cookies or similar technologies to serve ads and measure their performance, including ads based on your previous visits to this and other websites, where you have allowed it.</p>
<p>Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for consent through a consent message provided by Google before personalised ads are shown. You can change your choice at any time with the “Privacy &amp; cookie settings” link at the bottom of every page.</p>
<p>You can learn how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a> and opt out of personalised advertising at <a href="https://adssettings.google.com" rel="noopener">adssettings.google.com</a>.</p>`
    : `
<h2>Cookies and advertising</h2>
<p>This site currently shows no advertising and sets no advertising or tracking cookies. The only cookie is the strictly necessary sign-in cookie of the championship, set only if you create or restore a championship profile. If advertising is introduced in the future, this policy will be updated before it starts, and you will be asked for consent where the law requires it.</p>`;

  page('/privacy/', 'Privacy Policy', `Privacy policy of ${config.name}: what data is processed and why.`, 'Privacy policy', `
<p>Last updated: ${today}.</p>
<h2>Summary</h2>
<p>${esc(config.name)} does not require an account and does not ask for your name, email or any other personal information. Worksheets are generated entirely in your browser; the options you choose and any title you type stay on your device and are only placed in the page address so the link can reproduce the sheet.</p>
<p>Online practice and <a href="/assign/">class assignments</a> also run entirely in your browser. Answers are checked on your device and are never sent to us. Your best scores, display preferences, nickname and number of tries are kept only in your browser’s local storage, which you can clear at any time. A class assignment result leaves your device only if you copy it and send it yourself.</p>
<p>The optional <a href="/multiplication-championship/">Multiplication World Championship</a> works with a nickname and a country only; see the section about it below.</p>
<h2>Hosting, server logs and visit statistics</h2>
<p>The site is hosted by ${esc(config.host.name)}. Like any web host, it processes technical data such as your IP address, browser type and the pages requested, in order to deliver the site and protect it against abuse. See <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare’s privacy policy</a>.</p>
<p>To know which worksheets are useful, we count visits with Cloudflare Web Analytics. It does not use cookies, does not store anything on your device and does not track you across websites; we only see aggregated numbers such as page views per page and per country.</p>
${adsSection}
${CHAMP.privacySection()}
<h2>Your rights</h2>
<p>Depending on where you live (for example under the EU/UK GDPR or US state privacy laws) you may have rights to access, correct or delete personal data, or to object to its processing. Since this site does not itself store personal data about visitors, most requests concern our providers listed above. You can also contact us: ${contactLine()}.</p>
<h2>Children</h2>
<p>The worksheets are intended to be chosen and printed by adults (parents, teachers, tutors). The championship can be played by children: it asks for no e-mail address, no real name and no precise location, has no chat or messaging, and shows no advertising during a game. Children under 13 (or under the age set by the law of their country) should ask a parent or teacher before creating a championship profile. A parent may delete the profile at any time from the “My profile” page, or ask us to do it.</p>
<h2>Changes</h2><p>We will update this page whenever the way the site works changes.</p>`);

  page('/terms/', 'Terms of Use', `Terms of use of ${config.name}: how you may print, copy and share the free math worksheets generated on this site.`, 'Terms of use', `
<p>Last updated: ${today}.</p>
<h2>Use of the worksheets</h2>
<p>You may use, print and photocopy worksheets generated on ${esc(config.name)} for free, for personal, home-school, tutoring and classroom use, including distribution to your students. You may not sell the worksheets or republish them in bulk on another website.</p>
<h2>Accuracy</h2>
<p>Problems and answer keys are generated automatically by tested rules. We work to keep them correct, but they are provided “as is”, without warranty. If you find a mistake, please tell us via the <a href="/contact/">contact page</a>.</p>
<h2>Availability</h2>
<p>The site is offered free of charge and may change or be unavailable at times.</p>
<h2>Links</h2><p>We are not responsible for the content of external websites linked from this site.</p>`);

  page('/legal/', 'Legal Notice', `Legal notice (publisher and host) of ${config.name}.`, 'Legal notice', `
<h2>Publisher</h2>
<p>${config.publisherName ? esc(config.publisherName) : `${esc(config.name)}, published by a private individual`}. Contact: ${contactLine()}.</p>
<h2>Hosting</h2>
<p>${esc(config.host.name)}, ${esc(config.host.address)}. <a href="${esc(config.host.url)}" rel="noopener">${esc(config.host.url.replace('https://', ''))}</a></p>
<h2>Intellectual property</h2>
<p>The site’s design, texts and code are the property of the publisher. Generated worksheets may be used as described in the <a href="/terms/">terms of use</a>.</p>`);

  for (const pg of pages) write(pg.p + 'index.html', pg.html);
  if (!config.contactEmail) warnings.push('contactEmail is empty: Contact/Legal pages say no address is published. Set CONTACT_EMAIL before applying to AdSense.');
  return pages.map((x) => x.p);
}

function notFoundPage(assets) {
  const body = `<section class="page-head dark"><div class="glow" aria-hidden="true"></div><div class="wrap"><p class="kicker">Error 404</p><h1>Page not found</h1>
<p class="lead">Sorry, this page does not exist or has moved. You can find every worksheet on the home page, or open a category below.</p>
<div class="hero-actions head-actions"><a class="btn btn-primary" href="/">Go to the home page ${ICON.arrow}</a><a class="btn btn-ghost" href="/#all">Browse all worksheets</a></div></div></section>
<div class="wrap page-body"><ul class="cat-grid">${categories.map(catCard).join('')}</ul></div>`;
  return layout(assets, { title: `Page not found | ${config.name}`, desc: 'This page does not exist. Browse all free printable math worksheets from the home page or a category.', pathName: '/404.html', body, noindex: true, scripts: false });
}

// ---------- sitemap with stable lastmod ----------
function sitemap(entries) {
  let store = {};
  try { store = JSON.parse(fs.readFileSync(LASTMOD_FILE, 'utf8')); } catch (e) { store = {}; }
  const urls = entries.map(({ p, html }) => {
    // Hash the page without volatile parts (asset hashes and dates) so lastmod only changes with content.
    const h = hash(html.replace(/\/assets\/[a-z]+\.[0-9a-f]+\.(css|js)/g, '').replace(/\d{4}-\d{2}-\d{2}/g, '').replace(/© \d{4}/, ''));
    if (!store[p] || store[p].hash !== h) store[p] = { hash: h, lastmod: today };
    return `<url><loc>${esc(abs(p))}</loc><lastmod>${store[p].lastmod}</lastmod></url>`;
  });
  fs.mkdirSync(path.dirname(LASTMOD_FILE), { recursive: true });
  const keep = Object.fromEntries(entries.map(({ p }) => [p, store[p]]));
  fs.writeFileSync(LASTMOD_FILE, JSON.stringify(keep, null, 1) + '\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/multiplication-championship/admin/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-store
`;

// ---------- main ----------
function main() {
  validateCatalog();
  fs.rmSync(DIST, { recursive: true, force: true });
  const assets = buildAssets();
  const entries = [];
  const add = (p, html) => { write(p + 'index.html', html); entries.push({ p, html }); };

  add('/', homePage(assets));
  for (const c of categories) add(`/${c.slug}/`, categoryPage(assets, c));
  for (const t of types) add(typeUrl(t), worksheetPage(assets, t));
  for (const g of grades) add(gradeUrl(g), gradePage(assets, g));
  add('/assign/', assignPage(assets));
  for (const e of CHAMP.buildPages({ assets, layout, write, abs, esc, crumbs, adSlot, config, ICON })) {
    write(e.p + 'index.html', e.html);
    if (e.index) entries.push({ p: e.p, html: e.html });
  }
  const kuku = kukuPage({ assets, layout, esc, crumbs, abs, ICON });
  add(kuku.p, kuku.html);
  const legal = staticPages(assets);
  for (const p of legal) entries.push({ p, html: fs.readFileSync(path.join(DIST, p, 'index.html'), 'utf8') });
  write('/404.html', notFoundPage(assets));

  write('/sitemap.xml', sitemap(entries));
  write('/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /multiplication-championship/admin/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
  write('/_headers', HEADERS);
  // Only the championship API and the Pinterest claim file run as Pages Functions; every page stays a free static request.
  write('/_routes.json', JSON.stringify({ version: 1, include: ['/api/*', '/pinterest-97ae1.html'], exclude: [] }, null, 2) + '\n');
  if (fs.existsSync(STATIC)) fs.cpSync(STATIC, DIST, { recursive: true });
  if (/^ca-pub-\d{10,20}$/.test(config.ads.client)) {
    write('/ads.txt', `google.com, ${config.ads.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
  }

  console.log(`Built ${entries.length} pages into dist/ (${types.length} worksheets, ${categories.length} categories). Ads: ${adsOn ? 'ON' : 'off'}. URL: ${config.url}`);
  for (const w of warnings) console.warn('WARNING: ' + w);
}

main();
