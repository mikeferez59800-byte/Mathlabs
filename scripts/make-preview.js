#!/usr/bin/env node
/*
 * Copies dist/ to preview/ with relative links, so the site can be browsed
 * by double-clicking preview/index.html (no web server needed). For local preview only:
 * deploy dist/, not preview/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'dist');
const OUT = path.join(__dirname, '..', process.argv[2] || 'preview');

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });
(function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, d.name);
    if (d.isDirectory()) { walk(f); continue; }
    if (!f.endsWith('.html')) continue;
    const depth = path.relative(OUT, path.dirname(f)).split(path.sep).filter(Boolean).length;
    const up = depth ? '../'.repeat(depth) : './';
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(/(href|src)="\/([^"]*)"/g, (m, attr, rest) => {
      let target = rest;
      const hashIdx = target.indexOf('#');
      const hash = hashIdx >= 0 ? target.slice(hashIdx) : '';
      if (hashIdx >= 0) target = target.slice(0, hashIdx);
      if (target === '' || target.endsWith('/')) target += 'index.html';
      return `${attr}="${up}${target}${hash}"`;
    });
    fs.writeFileSync(f, html);
  }
})(OUT);
console.log('Preview written to ' + OUT + ' (open index.html in a browser).');
