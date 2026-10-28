#!/usr/bin/env node
/*
 * Checks the built site in ./dist (run after `node build.js`):
 * internal links and assets exist, each page has one <h1>, a unique <title>,
 * a meta description and a canonical URL, and every sitemap URL maps to a file.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../site.config');

const DIST = path.join(__dirname, '..', 'dist');
const errors = [];
const titles = new Map();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}
function exists(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  const f = path.join(DIST, clean);
  if (clean.endsWith('/')) return fs.existsSync(path.join(f, 'index.html'));
  return fs.existsSync(f) || fs.existsSync(f + '.html') || fs.existsSync(path.join(f, 'index.html'));
}

const files = walk(DIST).filter((f) => f.endsWith('.html'));
for (const file of files) {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '');
  const html = fs.readFileSync(file, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) errors.push(`${rel}: missing <title>`);
  else if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`);
  else titles.set(title, rel);
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) errors.push(`${rel}: missing or short meta description`);
  if (!/<link rel="canonical" href="[^"]+"/.test(html)) errors.push(`${rel}: missing canonical`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: ${h1} <h1> elements`);
  if (!/<html lang="en">/.test(html)) errors.push(`${rel}: missing lang`);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(u)) continue;
    if (!u.startsWith('/')) { errors.push(`${rel}: relative link ${u}`); continue; }
    if (!exists(u)) errors.push(`${rel}: broken link ${u}`);
  }
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (og && (!og.startsWith(config.url) || !exists(og.slice(config.url.length)))) errors.push(`${rel}: og:image ${og} has no file`);
  // ids referenced by labels must exist
  for (const m of html.matchAll(/<label for="([^"]+)"/g)) if (!html.includes(`id="${m[1]}"`)) errors.push(`${rel}: label for missing id ${m[1]}`);
}

const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  if (!loc.startsWith(config.url)) errors.push(`sitemap: ${loc} not under ${config.url}`);
  else if (!exists(loc.slice(config.url.length) || '/')) errors.push(`sitemap: ${loc} has no file`);
}
if (!fs.existsSync(path.join(DIST, 'robots.txt'))) errors.push('robots.txt missing');
if (!fs.existsSync(path.join(DIST, '404.html'))) errors.push('404.html missing');

if (errors.length) {
  console.error(`Site check FAILED with ${errors.length} problem(s):\n` + errors.slice(0, 50).join('\n'));
  process.exit(1);
}
console.log(`Site OK: ${files.length} HTML files, ${locs.length} sitemap URLs, all internal links resolve.`);
