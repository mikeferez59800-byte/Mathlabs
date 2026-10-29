#!/usr/bin/env node
/*
 * QR code generator test: encodes many texts (every version 1 to 10) and decodes them back with jsQR.
 * Needs jsqr (CI: npm i --no-save jsqr@1.4.0); skipped with a message when it is not installed.
 */
'use strict';

const qr = require('../src/qr');
let jsQR;
try { jsQR = require('jsqr'); } catch (e) { console.log('jsqr not installed: QR test skipped.'); process.exit(0); }

function decode(text) {
  const m = qr.encode(text), n = m.length, quiet = 4, scale = 4, W = (n + 2 * quiet) * scale;
  const px = new Uint8ClampedArray(W * W * 4).fill(255);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) {
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const i = (((y + quiet) * scale + dy) * W + (x + quiet) * scale + dx) * 4;
      px[i] = px[i + 1] = px[i + 2] = 0;
    }
  }
  const r = jsQR(px, W, W);
  return r && r.data;
}

let ok = 0, bad = 0, seed = 1;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const texts = ['https://mathlabs.pages.dev/assign/?w=g9f0,g2b9,91k6&lv=e&q=5&ps=257827&t=Week%203%20homework', 'Grade 3 · ✓ é'];
for (let len = 1; len <= 210; len += 4) { let s = ''; for (let i = 0; i < len; i++) s += String.fromCharCode(32 + Math.floor(rand() * 90)); texts.push(s); }
for (const t of texts) { if (decode(t) === t) ok++; else { bad++; console.error('FAIL length ' + t.length); } }
let tooLong = false;
try { qr.encode('x'.repeat(400)); } catch (e) { tooLong = true; }
if (!tooLong) { bad++; console.error('FAIL: 400 characters should be refused'); }
console.log(`QR: ${ok} texts decoded, ${bad} failure(s).`);
process.exit(bad ? 1 : 0);
