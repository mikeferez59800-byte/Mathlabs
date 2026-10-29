/*
 * Minimal QR code generator (byte mode, error correction level M, versions 1 to 10),
 * used to show class assignment links as a scannable code. No dependency, no network.
 * Follows the structure of Project Nayuki's QR Code generator (MIT licence).
 * Shared by the browser (window.MSL.qr) and the Node tests (module.exports).
 */
(function (root) {
  'use strict';

  // Error correction level M, index = version.
  var ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  var MAX_VERSION = 10;

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver) { return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; }

  // ---------- Reed-Solomon over GF(256) ----------
  function mul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function divisor(degree) {
    var r = [];
    for (var i = 0; i < degree - 1; i++) r.push(0);
    r.push(1);
    var rt = 1;
    for (i = 0; i < degree; i++) {
      for (var j = 0; j < r.length; j++) {
        r[j] = mul(r[j], rt);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      rt = mul(rt, 0x02);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      div.forEach(function (c, i) { r[i] ^= mul(c, f); });
    });
    return r;
  }

  function utf8(s) {
    var out = [], e = unescape(encodeURIComponent(s));
    for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i));
    return out;
  }

  // ---------- Encoding ----------
  function encode(text) {
    var bytes = utf8(text), ver;
    for (ver = 1; ver <= MAX_VERSION; ver++) {
      if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > MAX_VERSION) throw new Error('Text too long for a QR code');
    var bits = [];
    var put = function (v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4);
    put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCodewords(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    return draw(ver, interleave(ver, data));
  }

  function interleave(ver, data) {
    var nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = divisor(eccLen), blocks = [];
    for (var i = 0, k = 0; i < nb; i++) {
      var dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
      k += dat.length;
      var ecc = remainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var out = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) if (i !== shortLen - eccLen || j >= nShort) out.push(blocks[j][i]);
    }
    return out;
  }

  // ---------- Drawing ----------
  function draw(ver, codewords) {
    var size = ver * 4 + 17, m = [], fn = [];
    for (var y = 0; y < size; y++) { m.push([]); fn.push([]); for (var x = 0; x < size; x++) { m[y].push(false); fn[y].push(false); } }
    var set = function (x, y, dark) { m[y][x] = dark; fn[y][x] = true; };

    for (var i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    var finder = function (cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = alignment(ver, size), last = pos.length - 1;
    for (i = 0; i < pos.length; i++) for (var j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) set(pos[i] + ax, pos[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
    }
    formatBits(set, size, 0);
    if (ver >= 7) {
      var rem = ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = ver << 12 | rem;
      for (i = 0; i < 18; i++) {
        var bit = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, bit); set(b, a, bit);
      }
    }

    // Data, in the zigzag order.
    var k = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var v = 0; v < size; v++) for (var jj = 0; jj < 2; jj++) {
        var xx = right - jj, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - v : v;
        if (!fn[yy][xx] && k < codewords.length * 8) { m[yy][xx] = ((codewords[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
      }
    }

    // Pick the mask with the lowest penalty.
    var best = null;
    for (var mask = 0; mask < 8; mask++) {
      var t = m.map(function (row) { return row.slice(); });
      applyMask(t, fn, mask);
      formatBits(function (x, y, d) { t[y][x] = d; }, size, mask);
      var p = penalty(t);
      if (!best || p < best.p) best = { p: p, t: t };
    }
    return best.t;
  }

  function alignment(ver, size) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
    for (var pos = size - 7; r.length < n; pos -= step) r.splice(1, 0, pos);
    return r;
  }

  function formatBits(set, size, mask) {
    var data = (0 << 3) | mask; // level M = 0b00
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = (data << 10 | rem) ^ 0x5412;
    var bit = function (n) { return ((bits >>> n) & 1) === 1; };
    for (i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  }

  function applyMask(m, fn, mask) {
    for (var y = 0; y < m.length; y++) for (var x = 0; x < m.length; x++) {
      if (fn[y][x]) continue;
      var inv;
      switch (mask) {
        case 0: inv = (x + y) % 2 === 0; break;
        case 1: inv = y % 2 === 0; break;
        case 2: inv = x % 3 === 0; break;
        case 3: inv = (x + y) % 3 === 0; break;
        case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: inv = x * y % 2 + x * y % 3 === 0; break;
        case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
        default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
      }
      if (inv) m[y][x] = !m[y][x];
    }
  }

  // Simplified penalty: runs of 5+, 2x2 blocks, dark/light balance.
  function penalty(m) {
    var n = m.length, p = 0, dark = 0;
    for (var a = 0; a < n; a++) {
      var runR = 1, runC = 1;
      for (var b = 0; b < n; b++) {
        if (m[a][b]) dark++;
        if (b > 0) {
          if (m[a][b] === m[a][b - 1]) { runR++; if (runR === 5) p += 3; else if (runR > 5) p++; } else runR = 1;
          if (m[b][a] === m[b - 1][a]) { runC++; if (runC === 5) p += 3; else if (runC > 5) p++; } else runC = 1;
        }
        if (a > 0 && b > 0 && m[a][b] === m[a - 1][b] && m[a][b] === m[a][b - 1] && m[a][b] === m[a - 1][b - 1]) p += 3;
      }
    }
    return p + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
  }

  // SVG with a 4-module quiet zone.
  function svg(text, label) {
    var m = encode(text), n = m.length, q = 4, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * q) + ' ' + (n + 2 * q) + '" shape-rendering="crispEdges" role="img" aria-label="' +
      String(label || 'QR code').replace(/"/g, '&quot;') + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  var api = { encode: encode, svg: svg, MAX_VERSION: MAX_VERSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MSL = root.MSL || {}; root.MSL.qr = api; }
})(typeof self !== 'undefined' ? self : this);
