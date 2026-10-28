/*
 * Site configuration. Edit this file, then run `node build.js`.
 * Environment variables override the values below (useful on Cloudflare Pages).
 */
'use strict';

module.exports = {
  name: 'MathSheetLab',
  tagline: 'Free printable math worksheets, generated in your browser',

  // Public URL of the site, without trailing slash. Used for canonical URLs and the sitemap.
  // Set SITE_URL in Cloudflare Pages (e.g. https://mathsheetlab.pages.dev or your own domain).
  url: (process.env.SITE_URL || 'https://mathsheetlab.pages.dev').replace(/\/$/, ''),

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

  // Optional Google Search Console HTML-tag verification token (content="..." value).
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || ''
};
