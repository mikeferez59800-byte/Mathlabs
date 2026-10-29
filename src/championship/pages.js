/*
 * Static pages of the Multiplication World Championship (built by build.js, in English, French and Japanese),
 * plus the pieces it adds to existing pages: header link, footer column, home-page section,
 * Multiplication banner and the privacy-policy section.
 * Live data (rankings, games) is loaded by src/championship/client.js from /api/championship/*.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { LANGS, LANG_NAMES, T } = require('./i18n');

const BASE = '/multiplication-championship/';
const SUB = { landing: '', play: 'play/', practice: 'practice/', leaderboard: 'leaderboard/', hall: 'hall-of-champions/', rules: 'rules/', player: 'player/' };
const prefix = (lang) => (lang === 'en' ? '' : '/' + lang);
const url = (lang, page) => prefix(lang) + BASE + SUB[page];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

const svg = (d, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TROPHY = svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>', 'i-trophy');
const ICONS = {
  trophy: TROPHY,
  bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/><path d="m4 4 16 16"/>'),
  scale: svg('<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>'),
  pause: svg('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M10 8v6M14 8v6"/>'),
  medal: svg('<circle cx="12" cy="15" r="6"/><path d="M8.5 3h7L13 9.3M8.5 3 11 9.3"/><path d="m12 12.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>'),
  arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  play: svg('<path d="M7 4v16l13-8z"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>')
};

// ---------- assets ----------
function buildAssets({ ROOT, write, hash }) {
  const font = fs.readFileSync(path.join(ROOT, 'src/fonts/TwemojiCountryFlags.woff2'));
  const fontName = `/assets/flags.${hash(font.toString('base64'))}.woff2`;
  write(fontName, font);
  const css = fs.readFileSync(path.join(ROOT, 'src/championship/championship.css'), 'utf8').replace('__FLAGS_WOFF2__', fontName);
  const js = fs.readFileSync(path.join(ROOT, 'src/championship/client.js'), 'utf8');
  const widget = fs.readFileSync(path.join(ROOT, 'src/championship/widget.js'), 'utf8');
  const champCss = `/assets/championship.${hash(css)}.css`;
  const champJs = `/assets/championship.${hash(js)}.js`;
  const champWidget = `/assets/champ-widget.${hash(widget)}.js`;
  write(champCss, css);
  write(champJs, js);
  write(champWidget, widget);
  return { champCss, champJs, champWidget, flagFont: fontName };
}

// ---------- countries ----------
const { COUNTRY_CODES } = require('./countries');
const countryCache = {};
function countries(lang) {
  if (countryCache[lang]) return countryCache[lang];
  const dn = new Intl.DisplayNames([lang], { type: 'region' });
  const list = COUNTRY_CODES.filter((c) => c !== 'ZZ').map((c) => {
    let name = c;
    try { name = dn.of(c) || c; } catch (e) { /* unknown code */ }
    return [c, name];
  });
  const coll = new Intl.Collator(lang);
  list.sort((a, b) => coll.compare(a[1], b[1]));
  list.unshift(['ZZ', T[lang].common.flagIntl]);
  countryCache[lang] = list;
  return list;
}

// ---------- pieces added to existing pages ----------
function footerColumn(lang) {
  const t = T[lang];
  const items = ['landing', 'play', 'practice', 'leaderboard', 'hall', 'rules'];
  return `<div><h2>${esc(t.chrome.footChamp)}</h2><ul>${items.map((p) => `<li><a href="${url(lang, p)}">${esc(p === 'landing' ? t.name : t.nav[p])}</a></li>`).join('')}</ul></div>`;
}

function podiumSlots(t) {
  return [2, 1, 3].map((r) => `<li class="pod pod-${r}" data-rank="${r}"><span class="pod-medal" aria-hidden="true">${r}</span><span class="pod-name" data-pod-name>${esc(t.common.podiumEmpty)}</span><span class="pod-score" data-pod-score></span><span class="pod-step"><b>${esc(t.common.place[r - 1])}</b></span></li>`).join('');
}

function homeSection() {
  const t = T.en;
  return `<section class="section champ-home dark" aria-labelledby="champ-home-h" data-champ-widget>
<div class="glow" aria-hidden="true"></div><div class="glow glow-gold" aria-hidden="true"></div>
<div class="wrap champ-home-grid">
<div>
<p class="kicker kicker-gold">${TROPHY}${esc(t.home.kicker)}</p>
<h2 id="champ-home-h">${esc(t.home.h)}</h2>
<p class="lead">${esc(t.home.p)}</p>
<p class="slogan">${esc(t.slogan)}</p>
<div class="hero-actions"><a class="btn btn-gold btn-lg" href="${url('en', 'play')}">${esc(t.home.join)} ${ICONS.arrow}</a><a class="btn btn-ghost btn-lg" href="${url('en', 'leaderboard')}">${esc(t.home.board)}</a></div>
</div>
<div class="live-card">
<div class="live-head"><span class="live-dot" aria-hidden="true"></span><span>${esc(t.home.current)}</span><b data-w-month></b></div>
<ol class="podium" aria-label="Podium">${podiumSlots(t)}</ol>
<p class="live-foot"><span data-w-ends></span><span data-w-players></span></p>
</div>
</div>
</section>`;
}

function multBanner(variant) {
  const t = T.en.multBanner;
  return `<aside class="mult-banner no-print${variant === 'compact' ? ' compact' : ''}" aria-label="${esc(T.en.name)}">
<span class="mb-icon" aria-hidden="true">${TROPHY}</span>
<div><p class="mb-h">${esc(t.h)}</p><p>${esc(t.p)}</p></div>
<a class="btn btn-gold" href="${url('en', 'landing')}">${esc(t.cta)} ${ICONS.arrow}</a>
</aside>`;
}

function privacySection() {
  return `
<h2 id="championship">Multiplication World Championship</h2>
<p>The championship is optional. Practice mode works entirely in your browser and sends nothing. To appear in the official rankings you create a player profile:</p>
<ul>
<li><strong>What we store:</strong> the nickname and the country you choose, your official results (score, errors, number of answers, date and two timing statistics used to detect impossible speeds), your medals, and a random sign-in key. We do not ask for an e-mail address, a real name, an age or a precise location, and we do not store individual answers after a game ends.</li>
<li><strong>What is public:</strong> your nickname, the country you chose (with its flag), your scores, ranks and titles. Never your IP address, location or any technical identifier.</li>
<li><strong>Cookie:</strong> one strictly necessary cookie (<code>__Host-msl_player</code>) keeps you signed in on that device. It contains a random key; we only keep a one-way fingerprint (hash) of it. It is not used for advertising or tracking.</li>
<li><strong>Recovery code:</strong> instead of an e-mail address you receive a secret code, shown once. We only keep a hash of it. Anyone who has the code can open the profile, so keep it safe.</li>
<li><strong>Abuse protection:</strong> to limit abuse (for example mass profile creation), a salted fingerprint of your network address, which changes every day, is kept for at most 2 days. The address itself is never stored by the championship.</li>
<li><strong>Retention:</strong> finished games are deleted after 7 days; individual results after about 13 months, except your best scores and medals, which form the rankings; moderation and error logs after 6 months; profiles unused for 2 years are anonymised automatically.</li>
<li><strong>Deletion:</strong> you can delete your profile at any time from the “My profile” page. Your nickname, recovery code and devices are deleted; past results remain in rankings as “Former player” so that other players’ ranks do not change, and can no longer be linked to you.</li>
<li><strong>Moderation:</strong> nicknames are filtered automatically and may be changed by a moderator; suspicious scores may be removed. There is no chat, no private messaging and no public profile beyond the nickname, flag and results.</li>
<li><strong>Where:</strong> the data is stored in Cloudflare D1, a database service of our host Cloudflare.</li>
</ul>`;
}

// ---------- page frame ----------
function subnav(lang, current) {
  const t = T[lang];
  const items = [['landing', ICONS.trophy], ['play', ICONS.play], ['practice', ICONS.target], ['leaderboard', ICONS.list], ['hall', ICONS.medal], ['rules', ICONS.book], ['player', ICONS.user]];
  return `<nav class="champ-nav" aria-label="${esc(t.name)}"><ul>${items.map(([p, icon]) =>
    `<li><a href="${url(lang, p)}"${p === current ? ' aria-current="page"' : ''}>${icon}<span>${esc(p === 'landing' ? t.nav.landing : t.nav[p])}</span></a></li>`).join('')}</ul></nav>`;
}
function langSwitch(lang, page) {
  return `<nav class="lang-switch" aria-label="Language"><ul>${LANGS.map((l) =>
    `<li><a href="${url(l, page)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${esc(LANG_NAMES[l])}</a></li>`).join('')}</ul></nav>`;
}
function head(lang, page, { h1, lead, kicker }, crumbsHtml) {
  return `<section class="page-head dark champ-head"><div class="glow" aria-hidden="true"></div><div class="glow glow-gold" aria-hidden="true"></div><div class="wrap">
<div class="champ-head-top">${crumbsHtml}${page === 'admin' ? '' : langSwitch(lang, page)}</div>
<p class="kicker kicker-gold">${TROPHY}${esc(kicker)}</p>
<h1>${esc(h1)}</h1>
${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
${page === 'admin' ? '' : subnav(lang, page)}
</div></section>`;
}

function clientData(lang, page, extra = {}) {
  const t = T[lang];
  const data = {
    page, lang,
    t: { name: t.name, slogan: t.slogan, nav: t.nav, play: t.play, practice: t.practice, board: t.board, hall: t.hall, player: t.player, common: t.common, landing: { endsIn: t.landing.endsIn, startsIn: t.landing.startsIn, playersGames: t.landing.playersGames }, home: t.home },
    links: Object.fromEntries(Object.keys(SUB).map((p) => [p, url(lang, p)])),
    privacy: '/privacy/#championship',
    countries: countries(lang),
    ...extra
  };
  return `<script type="application/json" id="champ-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

// ---------- reusable blocks ----------
function gameBlock(t, mode) {
  const p = t.play;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => `<button type="button" data-key="${k}">${k}</button>`).join('') +
    `<button type="button" data-key="del" class="k-del" aria-label="${esc(p.erase)}">⌫</button><button type="button" data-key="0">0</button><button type="button" data-key="ok" class="k-ok">${esc(p.ok)}</button>`;
  return `<div class="game" id="game" data-mode="${mode}" hidden>
<div class="g-top">
<div class="g-stat g-time"><span class="g-label" id="g-time-label">${esc(p.timeLeft)}</span><span class="g-val" id="g-time">60</span></div>
<div class="g-stat"><span class="g-label">${esc(p.points)}</span><span class="g-val" id="g-score">0</span></div>
<div class="g-stat"><span class="g-label">${esc(p.errorsLabel)}</span><span class="g-val g-err" id="g-errors">0</span></div>
</div>
<div class="g-bar" aria-hidden="true"><i id="g-bar"></i></div>
<div class="g-stage">
<p class="g-question" id="g-question" aria-live="polite"><span id="g-a">&nbsp;</span><span class="g-x">×</span><span id="g-b">&nbsp;</span><span class="g-eq">=</span></p>
<form class="g-form" id="g-form" autocomplete="off"><label class="visually-hidden" for="g-input">${esc(p.answerLabel)}</label>
<input id="g-input" class="g-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done">
<button type="submit" class="btn btn-gold g-submit">${esc(p.ok)}</button></form>
<p class="g-feedback" id="g-feedback" role="status" aria-live="assertive"></p>
<div class="g-count" id="g-count" hidden aria-live="assertive"></div>
</div>
<div class="keypad" id="g-keypad">${keys}</div>
</div>`;
}

function result(t) {
  return `<section class="panel champ-panel result" id="result" hidden aria-live="polite">
<p class="kicker kicker-gold">${TROPHY}<span id="r-title"></span></p>
<p class="r-score" id="r-score"></p>
<p class="r-errors" id="r-errors"></p>
<p class="r-msg" id="r-msg"></p>
<div class="r-extra" id="r-extra"></div>
<div class="r-actions" id="r-actions"></div>
</section>`;
}

function signupBlock(t, lang) {
  const p = t.play;
  const agree = fill(esc(p.agree), { rules: `<a href="${url(lang, 'rules')}">${esc(p.rulesLink)}</a>`, privacy: `<a href="/privacy/#championship">${esc(p.privacyLink)}</a>` });
  return `<section class="panel champ-panel" id="signup" hidden aria-labelledby="signup-h">
<h2 id="signup-h">${esc(p.signupH)}</h2>
<p class="muted">${esc(p.signupP)}</p>
<form id="signup-form" novalidate>
<div class="field"><label for="s-nick">${esc(p.nickname)}</label>
<div class="nick-row"><input id="s-nick" name="nickname" type="text" minlength="3" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="s-nick-help"><button type="button" class="btn btn-secondary" id="s-suggest">${esc(p.suggest)}</button></div>
<p class="help" id="s-nick-help">${esc(p.nickHelp)}</p></div>
<div class="field"><label for="s-country">${esc(p.country)}</label>
<select id="s-country" name="country" required aria-describedby="s-country-help"></select>
<p class="help" id="s-country-help">${esc(p.countryHelp)}</p></div>
<p class="notice-kid">${esc(p.under13)}</p>
<label class="check"><input type="checkbox" id="s-agree" required> <span>${agree}</span></label>
<p class="form-error" id="s-error" role="alert"></p>
<div class="row-actions"><button type="submit" class="btn btn-gold btn-lg">${esc(p.create)}</button><button type="button" class="linklike" data-show="restore">${esc(p.haveCode)}</button></div>
</form>
</section>
<section class="panel champ-panel" id="code" hidden aria-labelledby="code-h">
<h2 id="code-h">${esc(p.codeH)}</h2>
<p>${esc(p.codeP)}</p>
<p class="recovery"><code id="code-value"></code><button type="button" class="btn btn-secondary btn-sm" id="code-copy">${esc(p.copy)}</button></p>
<button type="button" class="btn btn-gold" id="code-done">${esc(p.codeDone)}</button>
</section>
<section class="panel champ-panel" id="restore" hidden aria-labelledby="restore-h">
<h2 id="restore-h">${esc(p.restoreH)}</h2>
<p class="muted">${esc(p.restoreP)}</p>
<form id="restore-form" novalidate><div class="field"><label for="r-code">${esc(p.code)}</label><input id="r-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"></div>
<p class="form-error" id="r-error" role="alert"></p>
<div class="row-actions"><button type="submit" class="btn btn-gold">${esc(p.restore)}</button><button type="button" class="linklike" data-show="signup">${esc(p.cancel)}</button></div></form>
</section>`;
}

function privacyBox(t) {
  return `<aside class="privacy-box"><h2>${ICONS.shield}${esc(t.privacyBox.h)}</h2><ul>${t.privacyBox.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a href="/privacy/#championship">${esc(t.privacyBox.link)}</a></aside>`;
}

// ---------- pages ----------
function landingBody(lang, ctx) {
  const t = T[lang], L = t.landing;
  const faq = t.faq.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const steps = L.steps.map(([h, p], i) => `<li class="reveal" style="--d:${i}"><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('');
  const safeIcons = [ICONS.user, ICONS.chat, ICONS.scale, ICONS.pause];
  const safe = L.safe.map(([h, p], i) => `<li class="benefit reveal" style="--d:${i}"><span class="b-icon">${safeIcons[i]}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('');
  return `<section class="hero dark champ-hero" aria-labelledby="hero-h">
<div class="glow" aria-hidden="true"></div><div class="glow glow-gold" aria-hidden="true"></div>
<div class="wrap">
<div class="champ-head-top">${ctx.crumbs.html}${langSwitch(lang, 'landing')}</div>
<div class="hero-grid">
<div class="hero-copy">
<p class="eyebrow"><span class="pill pill-gold">${esc(L.eyebrowPill)}</span>${esc(L.eyebrow)}</p>
<h1 id="hero-h">${esc(L.h1)}</h1>
<p class="slogan slogan-lg">${esc(t.slogan)}</p>
<p class="lead">${esc(L.lead)}</p>
<div class="hero-actions"><a class="btn btn-gold btn-lg" href="${url(lang, 'play')}">${esc(L.join)} ${ICONS.arrow}</a><a class="btn btn-ghost btn-lg" href="${url(lang, 'practice')}">${esc(L.practice)}</a></div>
<ul class="hero-facts">${L.facts.map((f) => `<li>${ICONS.check}${esc(f)}</li>`).join('')}</ul>
</div>
<div class="live-card" data-champ-live>
<div class="live-head"><span class="live-dot" aria-hidden="true"></span><span>${esc(L.liveTitle)}</span><b data-w-month></b></div>
<ol class="podium" aria-label="Podium">${podiumSlots(t)}</ol>
<p class="live-foot"><span data-w-ends></span><span data-w-players></span></p>
</div>
</div>
${subnav(lang, 'landing')}
</div>
</section>
<div class="wrap">${ctx.adSlot('top')}</div>
<section class="section" aria-labelledby="steps-h"><div class="wrap">
<div class="section-head reveal"><p class="kicker">${esc(L.stepsKicker)}</p><h2 id="steps-h">${esc(L.stepsH)}</h2></div>
<ol class="steps steps-light">${steps}</ol>
</div></section>
<section class="section board-preview" aria-labelledby="board-h"><div class="wrap two-col">
<div>
<div class="section-head"><p class="kicker">${esc(L.boardKicker)}</p><h2 id="board-h">${esc(L.boardH)}</h2></div>
<div class="board-wrap" id="top10" data-board="month" data-limit="10"><p class="muted">${esc(t.board.loading)}</p></div>
<p><a class="btn btn-secondary" href="${url(lang, 'leaderboard')}">${esc(L.fullBoard)} ${ICONS.arrow}</a></p>
</div>
<div class="hall-teaser">
<p class="kicker">${esc(L.hallKicker)}</p><h2>${esc(L.hallH)}</h2><p>${esc(L.hallP)}</p>
<div id="last-champion" class="last-champion"></div>
<a class="btn btn-gold" href="${url(lang, 'hall')}">${esc(L.hallLink)} ${ICONS.arrow}</a>
</div>
</div></section>
<section class="section" aria-labelledby="safe-h"><div class="wrap">
<div class="section-head reveal"><p class="kicker">${esc(L.safeKicker)}</p><h2 id="safe-h">${esc(L.safeH)}</h2></div>
<ul class="benefits">${safe}</ul>
</div></section>
<section class="section faq" aria-labelledby="faq-h"><div class="wrap narrow">
<h2 id="faq-h">${esc(L.faqH)}</h2>
${faq}
<p class="faq-more"><a href="${url(lang, 'rules')}">${esc(t.nav.rules)} ${ICONS.arrow}</a></p>
</div></section>
<div class="wrap">${ctx.adSlot('bottom')}</div>`;
}

function playBody(lang) {
  const t = T[lang], p = t.play;
  return `<div class="wrap champ-body">
<div class="champ-grid">
<div class="champ-main">
<p class="notice champ-notice" id="soon" hidden>${esc(p.soon)} <a href="${url(lang, 'practice')}">${esc(t.nav.practice)}</a></p>
<p class="muted" id="loading">${esc(t.board.loading)}</p>
${signupBlock(t, lang)}
<section class="panel champ-panel ready" id="ready" hidden aria-labelledby="ready-h">
<h2 id="ready-h"></h2>
<dl class="stats"><div><dt>${esc(p.bestMonth)}</dt><dd id="st-best">—</dd></div><div><dt>${esc(p.rankMonth)}</dt><dd id="st-rank">—</dd></div><div><dt>${esc(p.allTime)}</dt><dd id="st-all">—</dd></div></dl>
<p class="form-error" id="ready-error" role="alert"></p>
<button type="button" class="btn btn-gold btn-xl" id="start">${ICONS.play}<span>${esc(p.start)}</span></button>
<p class="muted small">${esc(p.startHint)}</p>
</section>
${gameBlock(t, 'official')}
${result(t)}
<noscript><p class="notice">JavaScript is needed to play.</p></noscript>
</div>
<aside class="champ-side">
<section class="side-card"><h2>${esc(t.rules.sections[1][0])}</h2><ul>${t.rules.sections[1][1].slice(0, 2).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a href="${url(lang, 'rules')}">${esc(t.nav.rules)} ${ICONS.arrow}</a></section>
${privacyBox(t)}
</aside>
</div>
</div>`;
}

function practiceBody(lang) {
  const t = T[lang], pr = t.practice;
  const tables = [];
  for (let n = 1; n <= 12; n++) tables.push(`<label class="chip-opt"><input type="radio" name="table" value="${n}"><span>${esc(n === 1 ? pr.table1 : fill(pr.table, { n }))}</span></label>`);
  return `<div class="wrap champ-body">
<div class="champ-grid">
<div class="champ-main">
<section class="panel champ-panel" id="setup" aria-labelledby="setup-h">
<form id="practice-form">
<fieldset class="chips-field"><legend id="setup-h">${esc(pr.pick)}</legend>
<div class="chip-opts"><label class="chip-opt chip-wide"><input type="radio" name="table" value="mixed" checked><span>${esc(pr.mixed)}</span></label>${tables.join('')}</div></fieldset>
<fieldset class="chips-field"><legend>${esc(pr.mode)}</legend>
<div class="chip-opts"><label class="chip-opt"><input type="radio" name="mode" value="time" checked><span>${esc(pr.mode60)}</span></label><label class="chip-opt"><input type="radio" name="mode" value="count"><span>${esc(pr.mode20)}</span></label></div></fieldset>
<button type="submit" class="btn btn-gold btn-xl">${ICONS.play}<span>${esc(pr.start)}</span></button>
<p class="muted small">${esc(pr.note)}</p>
</form>
</section>
${gameBlock(t, 'practice')}
${result(t)}
<section class="panel champ-panel" id="progress" aria-labelledby="progress-h"><h2 id="progress-h">${esc(pr.progress)}</h2><div id="progress-table"></div></section>
</div>
<aside class="champ-side">
<section class="side-card side-gold"><h2>${esc(t.name)}</h2><p>${esc(t.slogan)}</p><a class="btn btn-gold" href="${url(lang, 'play')}">${esc(pr.goOfficial)} ${ICONS.arrow}</a></section>
</aside>
</div>
</div>`;
}

function leaderboardBody(lang, ctx) {
  const t = T[lang], b = t.board;
  const tabs = ['month', 'alltime', 'countries', 'champions'];
  return `<div class="wrap champ-body">
${ctx.adSlot('top')}
<section class="panel champ-panel board-panel">
<div class="tabs" role="tablist" aria-label="${esc(b.h1)}">${tabs.map((k, i) => `<button type="button" role="tab" id="tab-${k}" aria-controls="tabpanel" aria-selected="${i === 0}" data-tab="${k}"${i ? ' tabindex="-1"' : ''}>${esc(b.tabs[k])}</button>`).join('')}</div>
<div class="board-filters">
<div class="field" id="f-month-wrap"><label for="f-month">${esc(b.month)}</label><select id="f-month"></select></div>
<div class="field" id="f-country-wrap"><label for="f-country">${esc(b.country)}</label><select id="f-country"><option value="">${esc(b.allCountries)}</option></select></div>
</div>
<div class="me-bar" id="me-bar" hidden></div>
<div id="tabpanel" role="tabpanel" aria-labelledby="tab-month" class="board-wrap"><p class="muted">${esc(b.loading)}</p></div>
<p class="muted small" id="team-note" hidden>${esc(b.teamNote)}</p>
<nav class="pager" id="pager" aria-label="Pagination" hidden><button type="button" class="btn btn-secondary btn-sm" id="pg-prev">${esc(b.prev)}</button><span id="pg-info"></span><button type="button" class="btn btn-secondary btn-sm" id="pg-next">${esc(b.next)}</button></nav>
</section>
${ctx.adSlot('bottom')}
<p class="credit">Flags: <a href="https://github.com/twitter/twemoji" rel="noopener">Twemoji</a> (CC BY 4.0).</p>
</div>`;
}

function hallBody(lang, ctx) {
  const t = T[lang], h = t.hall;
  return `<div class="wrap champ-body">
<section class="reigning" id="reigning" aria-labelledby="reigning-h"><h2 id="reigning-h" class="visually-hidden">${esc(h.latest)}</h2><p class="muted">${esc(t.board.loading)}</p></section>
${ctx.adSlot('top')}
<section class="section-tight" aria-labelledby="gallery-h"><h2 id="gallery-h">${esc(h.gallery)}</h2><div id="gallery" class="gallery"></div></section>
<section class="section-tight" aria-labelledby="records-h"><h2 id="records-h">${esc(h.records)}</h2><p class="muted">${esc(h.recordsP)}</p>
<div class="panel champ-panel"><div class="board-wrap" id="records" data-board="alltime" data-limit="10"></div><p><a href="${url(lang, 'leaderboard')}#alltime">${esc(t.board.tabs.alltime)} ${ICONS.arrow}</a></p></div></section>
</div>`;
}

function rulesBody(lang, ctx) {
  const t = T[lang];
  return `<div class="wrap champ-body">
<div class="champ-grid">
<article class="content paper rules">
${t.rules.sections.map(([h, items]) => `<h2>${esc(h)}</h2><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`).join('\n')}
<p><a class="btn btn-gold" href="${url(lang, 'play')}">${esc(t.landing.join)} ${ICONS.arrow}</a></p>
</article>
<aside class="champ-side">${privacyBox(t)}</aside>
</div>
${ctx.adSlot('bottom')}
</div>`;
}

function playerBody(lang) {
  const t = T[lang], p = t.player, pl = t.play;
  return `<div class="wrap champ-body">
<p class="muted" id="loading">${esc(t.board.loading)}</p>
<p class="notice champ-notice" id="soon" hidden>${esc(pl.soon)}</p>
<section class="panel champ-panel" id="nosign" hidden><p>${esc(p.notSigned)}</p><div class="row-actions"><a class="btn btn-gold" href="${url(lang, 'play')}">${esc(p.create)}</a><button type="button" class="btn btn-secondary" data-show="restore">${esc(p.restore)}</button></div></section>
${signupBlock(t, lang)}
<div id="profile" hidden>
<section class="panel champ-panel profile-card"><h2>${esc(p.public)}</h2><p class="profile-name" id="pf-name"></p>
<dl class="stats"><div><dt>${esc(pl.bestMonth)}</dt><dd id="pf-month">—</dd></div><div><dt>${esc(pl.rankMonth)}</dt><dd id="pf-rank">—</dd></div><div><dt>${esc(pl.allTime)}</dt><dd id="pf-all">—</dd></div><div><dt>${esc(t.board.titles)}</dt><dd id="pf-titles">0</dd></div></dl></section>
<section class="panel champ-panel"><h2>${esc(p.medals)}</h2><div id="pf-medals"></div></section>
<section class="panel champ-panel"><h2>${esc(p.recent)}</h2><div id="pf-recent"></div></section>
<section class="panel champ-panel"><h2>${esc(p.edit)}</h2><p class="muted small">${esc(p.cooldown)}</p>
<form id="edit-form" novalidate><div class="field-row"><div class="field"><label for="e-nick">${esc(pl.nickname)}</label><input id="e-nick" type="text" maxlength="16" autocomplete="off" spellcheck="false"></div>
<div class="field"><label for="e-country">${esc(pl.country)}</label><select id="e-country"></select></div></div>
<p class="form-error" id="e-error" role="alert"></p><button type="submit" class="btn btn-secondary">${esc(p.save)}</button></form></section>
<section class="panel champ-panel"><h2>${esc(p.codeH)}</h2><p class="muted">${esc(p.codeP)}</p><button type="button" class="btn btn-secondary" id="new-code">${esc(p.newCode)}</button></section>
<section class="panel champ-panel"><h2>${esc(p.signOut)}</h2><p class="muted">${esc(p.signOutP)}</p><button type="button" class="btn btn-secondary" id="sign-out">${esc(p.signOut)}</button></section>
<section class="panel champ-panel danger"><h2>${esc(p.deleteH)}</h2><p class="muted">${esc(p.deleteP)}</p><button type="button" class="btn btn-danger" id="delete">${esc(p.deleteBtn)}</button></section>
</div>
</div>`;
}

function adminBody() {
  return `<div class="wrap champ-body admin">
<section class="panel champ-panel" id="admin-login"><h2>Administrator access</h2><p class="muted">Paste the ADMIN_TOKEN secret set in Cloudflare Pages. It is kept only in this browser tab.</p>
<form id="admin-form"><div class="field"><label for="admin-token">Admin token</label><input id="admin-token" type="password" autocomplete="off"></div><p class="form-error" id="admin-error" role="alert"></p><button class="btn btn-primary" type="submit">Open</button></form></section>
<div id="admin-app" hidden>
<div class="admin-stats" id="a-stats"></div>
<section class="panel champ-panel"><h2>Scores waiting for review</h2><div id="a-review"></div></section>
<section class="panel champ-panel"><h2>Reports and anomalies</h2><div id="a-events"></div></section>
<section class="panel champ-panel"><h2>Player</h2><form id="a-player-form" class="inline-form"><div class="field"><label for="a-nick">Nickname</label><input id="a-nick" type="text"></div><button class="btn btn-secondary" type="submit">Look up</button></form><div id="a-player"></div></section>
<section class="panel champ-panel"><h2>This month: top 20</h2><div id="a-top"></div></section>
<section class="panel champ-panel"><h2>This month by country</h2><div id="a-countries"></div></section>
<section class="panel champ-panel"><h2>Months and champions</h2><div id="a-months"></div></section>
<section class="panel champ-panel"><h2>Technical errors</h2><div id="a-errors"></div></section>
<section class="panel champ-panel"><h2>Moderator actions</h2><div id="a-actions"></div></section>
</div>
</div>`;
}

// ---------- build ----------
function buildPages(ctx) {
  const { assets, layout, abs } = ctx;
  const out = [];
  const pageDefs = [
    ['landing', landingBody, true],
    ['play', playBody, false],
    ['practice', practiceBody, true],
    ['leaderboard', leaderboardBody, true],
    ['hall', hallBody, true],
    ['rules', rulesBody, true],
    ['player', playerBody, false]
  ];
  for (const lang of LANGS) {
    const t = T[lang];
    for (const [page, bodyFn, index] of pageDefs) {
      const p = url(lang, page);
      const trail = [{ name: t.chrome.home, path: '/' }, { name: t.nav.landing, path: url(lang, 'landing') }];
      if (page !== 'landing') trail.push({ name: page === 'play' ? t.nav.play : t.nav[page], path: p });
      const bc = ctx.crumbs(trail);
      const local = { ...ctx, crumbs: bc };
      const heads = {
        play: { h1: t.play.h1, lead: t.play.lead }, practice: { h1: t.practice.h1, lead: t.practice.lead },
        leaderboard: { h1: t.board.h1, lead: t.board.lead }, hall: { h1: t.hall.h1, lead: t.hall.lead },
        rules: { h1: t.rules.h1, lead: t.rules.lead }, player: { h1: t.player.h1, lead: t.player.lead }
      };
      const body = (page === 'landing' ? '' : head(lang, page, { ...heads[page], kicker: t.name }, bc.html)) + bodyFn(lang, local) + clientData(lang, page);
      const [title, desc] = t.meta[page];
      const jsonld = [bc.ld];
      if (page === 'landing') {
        jsonld.push({
          '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, url: abs(p), description: desc, inLanguage: lang,
          applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@type': 'Organization', name: ctx.config.name, url: abs('/') }
        });
        jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
      }
      const html = layout(assets, {
        title, desc, pathName: p, body, jsonld, noindex: !index, scripts: false, lang, champ: true,
        alternates: LANGS.map((l) => ({ lang: l, path: url(l, page) })),
        ogImage: abs(`/og/multiplication-championship${lang === 'en' ? '' : '-' + lang}.jpg`),
        css: [assets.champCss], js: [assets.champJs], bodyClass: `champ champ-${page}`
      });
      out.push({ p, html, index });
    }
  }
  // Admin page: English only, never indexed, no advertising.
  const t = T.en;
  const html = layout(assets, {
    title: t.meta.admin[0], desc: t.meta.admin[1], pathName: BASE + 'admin/', noindex: true, scripts: false, champ: true,
    body: head('en', 'admin', { h1: 'Championship administration', lead: 'Moderation and statistics. Not linked from the site.', kicker: t.name }, '') + adminBody() + clientData('en', 'admin'),
    ogImage: abs('/og/multiplication-championship.jpg'), css: [assets.champCss], js: [assets.champJs], bodyClass: 'champ champ-admin'
  });
  out.push({ p: BASE + 'admin/', html, index: false });
  return out;
}

module.exports = { buildAssets, buildPages, footerColumn, homeSection, multBanner, privacySection, TROPHY, url, countries, BASE };
