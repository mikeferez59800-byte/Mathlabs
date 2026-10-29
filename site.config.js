/*
 * Site configuration. Edit this file, then run `node build.js`.
 * Environment variables override the values below (useful on Cloudflare Pages).
 */
'use strict';

// Accepts only a full URL like https://example.pages.dev; anything else falls back to the default
// (a malformed SITE_URL would otherwise break every canonical link and the sitemap).
function siteUrl(value, fallback) {
  const v = (value || '').trim().replace(/\/$/, '');
  if (/^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v)) return v;
  if (v) console.warn(`WARNING: SITE_URL "${v}" is not a full URL like https://example.pages.dev; using ${fallback}`);
  return fallback;
}

module.exports = {
  name: 'MathSheetLab',
  tagline: 'Free printable math worksheets, generated in your browser',

  // Public URL of the site, without trailing slash. Used for canonical URLs and the sitemap.
  // Set SITE_URL in Cloudflare Pages (e.g. https://mathsheetlab.pages.dev or your own domain).
  url: siteUrl(process.env.SITE_URL, 'https://mathlabs.pages.dev'),

  // Contact address shown on the Contact and Legal pages. Leave empty until you have one:
  // the pages then say so honestly instead of showing a fake address.
  contactEmail: process.env.CONTACT_EMAIL || '',

  // Name of the person or organisation publishing the site (legal notice). Optional for
  // private individuals in some countries; see docs/ADSENSE-ET-LEGAL.md.
  publisherName: process.env.PUBLISHER_NAME || '',

  // Hosting provider shown in the legal notice.
  host: {
    name: 'Cloudflare, Inc. (Cloudflare Pages)',
    address: '101 Townsend St, San Francisco, CA 94107, USA',
    url: 'https://www.cloudflare.com'
  },

  // Google AdSense. Keep enabled=false until AdSense has APPROVED the site.
  // client looks like "ca-pub-1234567890123456". Slots are ad unit IDs created in AdSense.
  ads: {
    enabled: process.env.ADS_ENABLED === 'true',
    client: process.env.ADSENSE_CLIENT || '',
    slots: {
      top: process.env.ADSENSE_SLOT_TOP || '',
      bottom: process.env.ADSENSE_SLOT_BOTTOM || ''
    }
  },

  // Cloudflare Web Analytics (cookieless). Easiest: enable it in Cloudflare Pages > project > Metrics,
  // which injects the script automatically and needs no token here. Only set CF_ANALYTICS_TOKEN
  // if you add the site manually under Analytics & Logs > Web Analytics.
  analyticsToken: process.env.CF_ANALYTICS_TOKEN || '',

  // Optional Google Search Console HTML-tag verification token (content="..." value).
  // Optional Pinterest "claim website" token (the content="..." value of the p:domain_verify tag).
  pinterestVerification: process.env.PINTEREST_VERIFICATION || '97ae1f2701bd0ae1032f0eb6615d95d7',

  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || 'deIIPbG75CvFmDynGaFyyoXJi-uRz0MJ2rIRozS6Trw'
};
