#!/usr/bin/env node
/*
 * Uptime and link check of the LIVE site: downloads sitemap.xml and requests every URL.
 * Usage: SITE_URL=https://example.pages.dev node scripts/check-live.js
 * Used by the scheduled GitHub Actions workflow (.github/workflows/monitor.yml). Node 18+.
 */
'use strict';

const base = (process.env.SITE_URL || require('../site.config').url).replace(/\/$/, '');

async function get(url) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'MathSheetLab-monitor/1.0' } });
    return { url, status: res.status, ms: Date.now() - t0, text: url.endsWith('.xml') ? await res.text() : '' };
  } catch (e) {
    return { url, status: 0, ms: Date.now() - t0, error: e.message };
  }
}

(async () => {
  const sm = await get(base + '/sitemap.xml');
  if (sm.status !== 200) {
    console.error(`DOWN: ${sm.url} returned ${sm.status} ${sm.error || ''}`);
    process.exit(1);
  }
  const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  urls.push(base + '/robots.txt', base + '/this-page-should-not-exist-404-check');
  const bad = [];
  const slow = [];
  for (let i = 0; i < urls.length; i += 8) {
    const batch = await Promise.all(urls.slice(i, i + 8).map(get));
    for (const r of batch) {
      const expect404 = r.url.endsWith('404-check');
      if (expect404 ? r.status !== 404 : r.status !== 200) bad.push(`${r.status} ${r.url} ${r.error || ''}`);
      if (r.ms > 3000) slow.push(`${r.ms} ms ${r.url}`);
    }
  }
  console.log(`Checked ${urls.length} URLs on ${base}.`);
  if (slow.length) console.log('Slow responses:\n' + slow.join('\n'));
  if (bad.length) {
    console.error('Problems:\n' + bad.join('\n'));
    process.exit(1);
  }
  console.log('All good.');
})();
