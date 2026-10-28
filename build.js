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

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const LASTMOD_FILE = path.join(ROOT, 'data', 'lastmod.json');
const today = new Date().toISOString().slice(0, 10);
const warnings = [];

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const abs = (p) => config.url + p;
const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const typeBySlug = Object.fromEntries(types.map((t) => [t.slug, t]));
const typeUrl = (t) => `/${t.cat}/${t.slug}/`;

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
  const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'src/engine.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');
  const cssName = `/assets/styles.${hash(css)}.css`;
  const jsName = `/assets/app.${hash(js)}.js`;
  write(cssName, css);
  write(jsName, js);
  write('/favicon.svg', FAVICON);
  return { css: cssName, js: jsName };
}

const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2f5bea"/><path d="M18 22h12M24 16v12M36 22h12M19 42l10 10M29 42L19 52M36 44h12M36 50h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';
const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#2f5bea"/><path d="M18 22h12M24 16v12M36 22h12M19 42l10 10M29 42L19 52M36 44h12M36 50h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>';

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
function layout(assets, { title, desc, pathName, body, jsonld = [], noindex = false, scripts = true }) {
  const canonical = abs(pathName);
  const headExtra = [];
  if (config.googleSiteVerification) headExtra.push(`<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">`);
  if (/^ca-pub-\d{10,20}$/.test(config.ads.client)) headExtra.push(`<meta name="google-adsense-account" content="${esc(config.ads.client)}">`);
  if (adsOn) headExtra.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.ads.client)}" crossorigin="anonymous"></script>`);
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  const nav = categories.slice(0, 4).map((c) => `<a class="nav-cat" href="/${c.slug}/"${pathName.startsWith('/' + c.slug + '/') ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`).join('');
  return `<!doctype html>
<html lang="en">
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
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#2f5bea">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${assets.css}">
${headExtra.join('\n')}
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="logo" href="/">${LOGO}<span>${esc(config.name)}</span></a>
<nav class="nav" aria-label="Main">${nav}<a href="/#all"${pathName === '/' ? ' aria-current="page"' : ''}>All worksheets</a></nav>
</div></header>
<main id="main" class="wrap">
${body}
</main>
${footer()}
${scripts ? `<script src="${assets.js}" defer></script>` : ''}
</body>
</html>
`;
}

function footer() {
  const cols = [
    ['Worksheets', categories.slice(0, 4)],
    ['More worksheets', categories.slice(4)]
  ].map(([h, cats]) => `<div><h2>${h}</h2><ul>${cats.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></div>`).join('');
  const privacyBtn = adsOn ? '<li><button type="button" class="linklike" onclick="(window.googlefc=window.googlefc||{}).callbackQueue=(window.googlefc.callbackQueue||[]);googlefc.callbackQueue.push(googlefc.showRevocationMessage)">Privacy &amp; cookie settings</button></li>' : '';
  return `<footer class="site-foot"><div class="wrap">
${cols}
<div><h2>Site</h2><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy/">Privacy policy</a></li><li><a href="/terms/">Terms of use</a></li><li><a href="/legal/">Legal notice</a></li>${privacyBtn}</ul></div>
<p class="foot-note">Worksheets are generated in your browser and may be printed and copied freely for personal, home-school and classroom use. © ${new Date().getFullYear()} ${esc(config.name)}.</p>
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

function card(t) {
  const search = [t.h1, t.title, t.grade, catBySlug[t.cat].name, t.slug.replace(/-/g, ' ')].join(' ').toLowerCase();
  return `<li class="card" data-search="${esc(search)}"><a class="stretch" href="${typeUrl(t)}">${esc(t.h1)}</a><p>${esc(t.intro[0].split('. ')[0])}.</p><span class="grade">${esc(t.grade)}</span></li>`;
}

// ---------- pages ----------
function homePage(assets) {
  const groups = categories.map((c) => {
    const list = types.filter((t) => t.cat === c.slug);
    return `<section data-group aria-labelledby="g-${c.slug}"><div class="cat-head"><h2 id="g-${c.slug}">${esc(c.name)}</h2><a href="/${c.slug}/">All ${list.length} ${esc(c.name.toLowerCase())} worksheets</a></div><ul class="cards">${list.map(card).join('')}</ul></section>`;
  }).join('\n');
  const body = `
<section class="hero">
<h1>Free printable math worksheets</h1>
<p class="lead">Choose a skill, get a fresh worksheet instantly, then print it or save it as a PDF. Every sheet comes with an answer key. No sign-up, no email, nothing to install.</p>
<ul class="badges"><li>${types.length} worksheet types</li><li>Kindergarten to grade 7</li><li>Unlimited random sheets</li><li>Answer keys</li></ul>
</section>
<div class="search" role="search"><label for="ws-search" class="visually-hidden">Search worksheets</label>
<input id="ws-search" type="search" placeholder="Search: fractions, 7 times table, long division…" autocomplete="off">
<p class="search-meta" id="ws-search-count" aria-live="polite"></p></div>
<p id="ws-search-empty" hidden>No worksheet matches your search. Try a simpler word such as “addition” or “fractions”.</p>
<div id="all">${groups}</div>
<section class="content"><h2>How it works</h2>
<p>Each worksheet page has a generator. Pick the number of problems and options, press <strong>New problems</strong> for a different sheet, and <strong>Print / Save as PDF</strong> to print it. The answer key prints on a separate page.</p>
<p>Every sheet has a number (for example #482913). The page address contains that number, so sharing or bookmarking the link always opens exactly the same problems, which is handy for a whole class.</p>
<p>Problems are generated in your browser. Nothing you type is sent to a server.</p></section>`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url: abs('/'), description: config.tagline, inLanguage: 'en'
  }];
  return layout(assets, {
    title: `Free Printable Math Worksheets With Answer Keys | ${config.name}`,
    desc: `Generate free printable math worksheets: addition, subtraction, times tables, long division, fractions, decimals and more. Answer keys, unlimited sheets, no sign-up.`,
    pathName: '/', body, jsonld: ld
  });
}

function categoryPage(assets, c) {
  const list = types.filter((t) => t.cat === c.slug);
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}/` }]);
  const body = `${bc.html}
<section class="ws-intro"><h1>${esc(c.name)} worksheets</h1><p class="lead">${esc(c.blurb)} All ${list.length} worksheets below are free to print, generate new problems every time and include an answer key.</p></section>
<ul class="cards">${list.map(card).join('')}</ul>`;
  const ld = [bc.ld, {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${c.name} worksheets`, url: abs(`/${c.slug}/`),
    hasPart: list.map((t) => ({ '@type': 'LearningResource', name: t.h1, url: abs(typeUrl(t)) }))
  }];
  return layout(assets, {
    title: `${c.name} Worksheets – Free Printable With Answer Keys | ${config.name}`.slice(0, 90),
    desc: `${list.length} free printable ${c.name.toLowerCase()} worksheets. ${c.blurb}`.slice(0, 160),
    pathName: `/${c.slug}/`, body, jsonld: ld
  });
}

function worksheetPage(assets, t) {
  const c = catBySlug[t.cat];
  const seed = MSL.hashString(t.slug);
  const clientType = { slug: t.slug, gen: t.gen, params: t.params, cols: t.cols, counts: t.counts, count: t.count, h1: t.h1, sheetTitle: t.h1.charAt(0).toUpperCase() + t.h1.slice(1), instruction: t.instruction };
  const problems = MSL.generate(clientType, seed, t.count);
  const sheetOpts = { seed, siteName: config.name, cols: t.cols, title: clientType.sheetTitle };
  const sheets = MSL.renderSheet(clientType, problems, sheetOpts) + MSL.renderSheet(clientType, problems, { ...sheetOpts, answers: true });
  const bc = crumbs([{ name: 'Home', path: '/' }, { name: c.name, path: `/${c.slug}/` }, { name: t.h1, path: typeUrl(t) }]);
  const siblings = types.filter((x) => x.cat === t.cat && x.slug !== t.slug);
  const related = (t.related || []).map((s) => typeBySlug[s]);
  const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const body = `${bc.html}
<section class="ws-intro">
<h1>${esc(t.h1.charAt(0).toUpperCase() + t.h1.slice(1))}</h1>
<p class="meta">Level: ${esc(t.grade)} · Free · Printable · Answer key included</p>
<p>${esc(t.intro[0])}</p>
</section>
<div class="ws-layout">
<aside class="panel ws-controls" aria-labelledby="opts-h">
<h2 id="opts-h" class="visually-hidden">Worksheet options</h2>
<form id="ws-form">
<fieldset>
<legend class="visually-hidden">Options</legend>
<div class="field"><label for="f-count">Number of problems</label>
<select id="f-count" name="count">${t.counts.map((n) => `<option value="${n}"${n === t.count ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
<div class="field"><label for="f-title">Sheet title (optional)</label>
<input id="f-title" name="title" type="text" maxlength="80" placeholder="${esc(clientType.sheetTitle)}"></div>
<div class="field"><label for="f-paper">Paper size</label>
<select id="f-paper" name="paper"><option value="letter">US Letter</option><option value="a4">A4</option></select></div>
<label class="check"><input type="checkbox" name="answers" checked> Include answer key (page 2)</label>
<label class="check"><input type="checkbox" name="large"> Large print</label>
</fieldset>
</form>
<button type="button" class="btn" id="ws-print">${icon('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>')}Print / Save as PDF</button>
<button type="button" class="btn secondary" id="ws-new">${icon('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>')}New problems</button>
<button type="button" class="btn secondary" id="ws-copy">${icon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>')}Copy link to this sheet</button>
<p class="seed">Worksheet <span id="ws-seed">#${seed}</span>. The same link always gives the same problems.</p>
<p class="status" id="ws-status" role="status" aria-live="polite"></p>
<noscript><p class="notice">JavaScript is off: you can still print the sample worksheet below with your browser’s print command.</p></noscript>
</aside>
<section aria-label="Worksheet preview" class="sheet-wrap" id="ws-output">${sheets}</section>
</div>
${adSlot('top')}
<section class="content">
<h2>About this worksheet</h2>
${t.intro.slice(1).map((p) => `<p>${esc(p)}</p>`).join('')}
<p>Each sheet contains ${t.counts.join(', ').replace(/, (\d+)$/, ' or $1')} problems (your choice) and is generated at random. Press “New problems” as many times as you like; there is no limit and no account needed.</p>
<h2>Teaching tips</h2>
<ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>How to print or save as PDF</h2>
<ol><li>Choose the options on the left (on a phone, above the preview).</li><li>Press <strong>Print / Save as PDF</strong>.</li><li>In the print window, pick your printer, or choose “Save as PDF” as the destination.</li></ol>
<p>Only the worksheet and its answer key are printed; menus and buttons are hidden automatically.</p>
</section>
${related.length ? `<section class="related"><h2>Related worksheets</h2><ul>${related.map((r) => `<li><a href="${typeUrl(r)}">${esc(r.h1)}</a></li>`).join('')}</ul></section>` : ''}
${siblings.length ? `<section class="related"><h2>More ${esc(c.name.toLowerCase())} worksheets</h2><ul>${siblings.map((r) => `<li><a href="${typeUrl(r)}">${esc(r.h1)}</a></li>`).join('')}</ul></section>` : ''}
${adSlot('bottom')}
<script type="application/json" id="ws-config">${JSON.stringify({ type: clientType, defaultSeed: seed, siteName: config.name }).replace(/</g, '\\u003c')}</script>`;

  const ld = [bc.ld, {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: clientType.sheetTitle, description: t.desc,
    url: abs(typeUrl(t)), learningResourceType: 'Worksheet', educationalLevel: t.grade, inLanguage: 'en',
    isAccessibleForFree: true, about: c.name, publisher: { '@type': 'Organization', name: config.name, url: abs('/') }
  }];
  return layout(assets, { title: t.title, desc: t.desc, pathName: typeUrl(t), body, jsonld: ld });
}

function contactLine() {
  return config.contactEmail
    ? `<a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>`
    : '<em>(no contact address has been published yet)</em>';
}

function staticPages(assets) {
  const pages = [];
  const page = (p, title, desc, h1, html) => pages.push({ p, html: layout(assets, { title: `${title} | ${config.name}`, desc, pathName: p, body: `<article class="content"><h1>${esc(h1)}</h1>${html}</article>`, scripts: false }) });

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
<p>This site currently sets no cookies and shows no advertising. If advertising is introduced in the future, this policy will be updated before it starts, and you will be asked for consent where the law requires it.</p>`;

  page('/privacy/', 'Privacy Policy', `Privacy policy of ${config.name}: what data is processed and why.`, 'Privacy policy', `
<p>Last updated: ${today}.</p>
<h2>Summary</h2>
<p>${esc(config.name)} does not require an account and does not ask for your name, email or any other personal information. Worksheets are generated entirely in your browser; the options you choose and any title you type stay on your device and are only placed in the page address so the link can reproduce the sheet.</p>
<h2>Hosting and server logs</h2>
<p>The site is hosted by ${esc(config.host.name)}. Like any web host, it processes technical data such as your IP address, browser type and the pages requested, in order to deliver the site and protect it against abuse. See <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare’s privacy policy</a>.</p>
${adsSection}
<h2>Your rights</h2>
<p>Depending on where you live (for example under the EU/UK GDPR or US state privacy laws) you may have rights to access, correct or delete personal data, or to object to its processing. Since this site does not itself store personal data about visitors, most requests concern our providers listed above. You can also contact us: ${contactLine()}.</p>
<h2>Children</h2>
<p>The worksheets are intended to be chosen and printed by adults (parents, teachers, tutors). The site does not knowingly collect personal information from children.</p>
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
  const body = `<article class="content"><h1>Page not found</h1>
<p>Sorry, this page does not exist or has moved. You can find every worksheet on the <a href="/">home page</a>, or open a category:</p>
<ul>${categories.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)} worksheets</a></li>`).join('')}</ul></article>`;
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
  const legal = staticPages(assets);
  for (const p of legal) entries.push({ p, html: fs.readFileSync(path.join(DIST, p, 'index.html'), 'utf8') });
  write('/404.html', notFoundPage(assets));

  write('/sitemap.xml', sitemap(entries));
  write('/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
  write('/_headers', HEADERS);
  if (/^ca-pub-\d{10,20}$/.test(config.ads.client)) {
    write('/ads.txt', `google.com, ${config.ads.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
  }

  console.log(`Built ${entries.length} pages into dist/ (${types.length} worksheets, ${categories.length} categories). Ads: ${adsOn ? 'ON' : 'off'}. URL: ${config.url}`);
  for (const w of warnings) console.warn('WARNING: ' + w);
}

main();
