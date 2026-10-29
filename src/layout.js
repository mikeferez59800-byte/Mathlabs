/*
 * MathSheetLab layout engine: turns a list of generated problems into printed pages.
 * Shared by the browser (window.MSL.layout) and the Node build/tests (module.exports).
 *
 * The steps are kept apart:
 *   1. engine.js generates the problems (math only) and draws one problem (problemHtml);
 *   2. measure() describes how much room each problem needs, in em of the problem font;
 *   3. familyOf() picks a layout family (A to F) from the problems, unless the catalog sets `layout`;
 *   4. plan() fits the problems on A4 or US Letter: columns, font size and number of pages;
 *   5. renderPages() draws the pages; the answer key is planned and paginated on its own.
 * Sizes are computed for the sheet font (Inter, tabular figures), so the build and every browser
 * get the same layout. In the browser, app.js also checks the result and shrinks it if a line overflows.
 */
(function (root) {
  'use strict';

  var MSL = typeof module !== 'undefined' && module.exports ? require('./engine') : root.MSL;

  // ---------- Paper ----------
  var MM = 72 / 25.4; // points per millimetre
  var PAPER = {
    letter: { w: 215.9, h: 279.4, label: 'US Letter' },
    a4: { w: 210, h: 297, label: 'A4' }
  };
  // Printable margins, inside the page (the browser page margin is set to 0, so the
  // "Margins" choice in the print dialog cannot push the sheet off the paper).
  var MARGIN = { top: 12, bottom: 10, side: 14 };

  // Fixed heights of the page furniture, in points (styles.css uses the same values).
  var HEAD = { brand: 12, titleLine: 1.25, ins: 15, fields: 26, rule: 14, cont: 15 };
  var FOOT = 24;

  // ---------- Families ----------
  // font: [min, max] problem font size in pt (Classic style); cols: [min, max] columns;
  // slack: preferred ratio between a row's height and the room the problem needs (answer space).
  var FAMILIES = {
    A: { name: 'Arithmetic grid', font: [11, 20], young: [14, 24], cols: [2, 5], slack: 1.9 },
    B: { name: 'Fractions & numbers', font: [11, 19], young: [14, 22], cols: [1, 4], slack: 1.8 },
    C: { name: 'Algebra & equations', font: [11.5, 16], cols: [1, 2], slack: 1.25 },
    D: { name: 'Geometry & measurement', font: [11, 19], young: [12, 21], cols: [2, 4], slack: 1.3 },
    E: { name: 'Word problems', font: [11, 13.5], cols: [1, 1], slack: 1.2 },
    F: { name: 'Written methods', font: [12, 17], cols: [2, 4], slack: 1.15 }
  };
  // Presentation styles. Classic is the default; Primary is the "Large print" option.
  var STYLES = {
    classic: { min: 1, max: 1, slack: 1 },
    primary: { min: 1.3, max: 1.25, slack: 1.1 },
    compact: { min: 0.88, max: 0.85, slack: 0.8 }
  };
  var FLOOR = 11;    // smallest problem font before a sheet takes another page (Classic, pt)
  var ROW_GAP = 0.8; // minimum space between rows, em
  var COL_GAP = 1.4; // space between columns, em
  var NUM = 2.0;     // problem number + its gap, em
  var WORK_LINES = 3, WORK_LINE = 1.6; // ruled lines for written working (families C and E), em

  // ---------- Text measurement (Inter, tabular figures; em per character) ----------
  var CW = { ' ': 0.27, ',': 0.27, '.': 0.27, ':': 0.27, ';': 0.27, '(': 0.39, ')': 0.39, '%': 0.98, '/': 0.36, '_': 0.46, '?': 0.51, '$': 0.64,
    i: 0.24, j: 0.24, l: 0.24, f: 0.33, t: 0.33, r: 0.39, m: 0.88, w: 0.82, M: 0.9, W: 1.01, I: 0.27 };
  function charW(c) {
    if (CW[c] !== undefined) return CW[c];
    if (/[0-9+−×÷=<>]/.test(c)) return 0.65;
    if (/[A-Z]/.test(c)) return 0.7;
    return 0.6;
  }
  function plain(html) {
    return String(html).replace(/<sup>[^<]*<\/sup>/g, '0').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;|&quot;/g, "'");
  }
  function textW(s) {
    s = plain(s);
    var w = 0;
    for (var i = 0; i < s.length; i++) w += charW(s.charAt(i));
    return w;
  }
  function fracW(f) { return Math.max(textW(String(f[0])), textW(String(f[1]))) + 0.45; }
  function mixedW(a) {
    if (a === undefined || a === null) return 0;
    if (typeof a === 'string' || typeof a === 'number') return textW(String(a));
    if (Array.isArray(a)) return fracW(a);
    if (!a.n) return textW(String(a.w));
    return (a.w ? textW(String(a.w)) + 0.15 + 0.45 : 0) + fracW([a.n, a.d]); // whole part, its margin and the flex gap
  }
  function blankW(ansW) { return Math.max(2.8, ansW + 0.8); }

  // Room one problem needs, in em of the problem font: w = width, h = height of the problem
  // itself, work = extra height for written working (left empty on the sheet).
  function measure(p, family, withAnswer) {
    var gap = 0.35, w, h, work = 0;
    switch (p.kind) {
      case 'v': {
        var len = Math.max(textW(String(p.a)), textW(String(p.b)) + 0.65 + 0.4, mixedW(p.answer));
        w = len + 0.3;
        h = 0.6 + 1.35 * 2 + 0.3 + 1.6; // carry room, two lines, rule, answer
        if (family === 'F' && p.op === '×') {
          var db = String(p.b).replace(/\D/g, '').length;
          work = db > 1 ? 1.35 * (db + 1) + 0.3 : 0;
        }
        break;
      }
      case 'ld': {
        w = textW(String(p.divisor)) + textW(String(p.dividend)) + 1.4;
        h = 1.4 * 2 + 0.2;
        var steps = String(p.dividend).length - String(p.divisor).length + 1;
        work = family === 'F' ? 1.4 * 2 * steps + 0.4 : 3.5;
        break;
      }
      case 'f':
        w = fracW(p.a) + fracW(p.b) + 2 * (0.65 + 0.2) + 4 * 0.45 + (withAnswer ? mixedW(p.answer) : blankW(mixedW(p.answer)));
        h = 2.6;
        break;
      case 'fs':
        w = fracW(p.a) + 0.85 + 2 * 0.45 + (withAnswer ? fracW(p.answer) : blankW(fracW(p.answer)));
        h = 2.6;
        break;
      case 'fc':
        w = fracW(p.a) + fracW(p.b) + 1.6 + 0.6 + 2 * 0.45;
        h = 2.6;
        break;
      case 'fm':
        w = mixedW(p.a) + 0.85 + 2 * 0.45 + (withAnswer ? mixedW(p.answer) : blankW(mixedW(p.answer)));
        h = 2.6;
        break;
      case 'clk':
        w = 6.2;
        h = 6.2 + 0.4 + 1.6;
        break;
      case 'wp': {
        // Word problem: the text wraps; measure() returns its length, plan() turns it into lines.
        w = 0;
        h = 1.6;
        work = 5;
        return { w: 0, h: h, work: withAnswer ? 0 : work, text: textW(p.text) };
      }
      default: {
        var text = p.text || '', ansW = textW(String(p.answer));
        if (plain(text).indexOf('___') !== -1) {
          w = textW(text.replace('___', '')) + (withAnswer ? Math.max(2, ansW + 0.3) : Math.max(2.4, ansW + 0.6)) + 2 * gap;
        } else {
          w = textW(text) + gap + (withAnswer ? ansW : blankW(ansW));
        }
        // Elements such as <sup> become separate flex items, each followed by a gap.
        w += ((text.match(/<sup>/g) || []).length * 2) * gap;
        h = 1.7;
        if (family === 'C') work = WORK_LINE * WORK_LINES;
      }
    }
    // 3 % margin for rounding in the browser's text layout.
    return { w: w * 1.03, h: h, work: withAnswer ? 0 : work };
  }

  // ---------- Family and level ----------
  function familyOf(type, problems) {
    if (type.layout && FAMILIES[type.layout]) return type.layout;
    var p = problems[0] || {};
    switch (p.kind) {
      case 'clk': return 'D';
      case 'wp': return 'E';
      case 'ld': return 'F';
      case 'f': case 'fs': case 'fc': case 'fm': return 'B';
      case 'v':
        return problems.some(function (q) { return q.op === '×' && String(q.b).replace(/\D/g, '').length > 1; }) ? 'F' : 'A';
      default:
        if (problems.some(function (q) { return /<i>/.test(q.text || ''); })) return 'C';
        if (problems.some(function (q) { return /[a-z%]/i.test(plain(q.text || '').replace(/___/g, '')); })) return 'B';
        return 'A';
    }
  }
  // Lowest grade in "Kindergarten – Grade 1" style labels (K = 0); null when unknown.
  function minGrade(type) {
    var g = type.grade || '';
    if (/kinder/i.test(g)) return 0;
    var m = g.match(/grade\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  }

  // ---------- Pagination ----------
  function headHeight(o, kind, contentW) {
    // kind: 'first' (sheet page 1), 'cont' (later pages), 'key' (answer key pages)
    var titlePt = o.titlePt;
    var h = HEAD.brand + titlePt * HEAD.titleLine + HEAD.rule;
    if (kind === 'cont') return HEAD.brand + HEAD.cont * HEAD.titleLine + HEAD.rule;
    if (kind === 'first') {
      if (o.instruction) h += HEAD.ins * Math.ceil(textW(o.instruction) * 10.5 / contentW);
      h += HEAD.fields;
    }
    return h;
  }

  function titleSize(title, contentW) {
    var w = textW(title) * 1.04 + 7; // bold, plus room for the key badge
    return Math.max(12, Math.min(17, contentW / w));
  }

  // Finds the columns × font size that fits `count` problems per page with the largest
  // readable type, while keeping a sensible amount of answer room below each problem.
  function bestFit(sizes, count, fam, style, pref, W, H, fontRange, firstH, otherH) {
    var best = null;
    var lo = fontRange[0], hi = fontRange[1];
    var wMax = 0, hMax = 0;
    for (var i = 0; i < sizes.length; i++) {
      wMax = Math.max(wMax, sizes[i].w);
      hMax = Math.max(hMax, sizes[i].h + sizes[i].work);
    }
    for (var cols = 1; cols <= fam.cols[1]; cols++) {
      var rows = Math.ceil(count / cols);
      var bodyH = Math.min(H - firstH, H - otherH);
      var wFit = W / (cols * (NUM + wMax) + (cols - 1) * COL_GAP);
      var hFit = bodyH / (rows * (hMax + ROW_GAP));
      var f = Math.min(hi, wFit, hFit);
      if (f < lo) continue;
      f = Math.floor(f * 4) / 4; // quarter points
      var slack = bodyH / (rows * (hMax + ROW_GAP) * f);
      var target = fam.slack * style.slack;
      var empty = rows * cols - count; // cells left empty on the last row
      var score = f / hi - 0.3 * Math.abs(Math.log(slack / target)) - 0.04 * Math.abs(cols - pref) - 0.12 * empty / cols -
        (cols < fam.cols[0] ? 0.5 : 0); // fewer columns than the family's minimum only when nothing else fits
      if (!best || score > best.score) best = { cols: cols, rows: rows, font: f, score: score, slack: slack };
    }
    return best;
  }

  function wordLayout(sizes, count, fam, W, H, fontRange, firstH, otherH) {
    // Word problems: one column; each problem gets its text lines + working space.
    for (var f = fontRange[1]; f >= fontRange[0]; f -= 0.25) {
      var perLine = (W / f) - NUM;
      var need = 0;
      for (var i = 0; i < count && i < sizes.length; i++) {
        var lines = Math.max(1, Math.ceil(sizes[i].text / perLine));
        need = Math.max(need, lines * 1.45 + sizes[i].h + sizes[i].work + ROW_GAP);
      }
      var bodyH = Math.min(H - firstH, H - otherH);
      if (count * need * f <= bodyH) return { cols: 1, rows: count, font: f, slack: bodyH / (count * need * f) };
    }
    return null;
  }

  function plan(type, problems, o) {
    o = o || {};
    var paper = PAPER[o.paper] || PAPER.letter;
    var style = STYLES[o.style] || STYLES.classic;
    var withAnswer = !!o.answers;
    var fam = familyOf(type, problems);
    var F = FAMILIES[fam];
    var grade = minGrade(type);
    var range = (grade !== null && grade <= 2 && F.young) ? F.young : F.font;
    var shrink = o.shrink || 1;
    var fontRange = [range[0] * style.min * shrink, range[1] * style.max * shrink];
    var classicFont = 0;
    if (o.style === 'primary') {
      // Large print is always at least 15 % larger than the Classic sheet with the same problems.
      var classic = {};
      for (var k in o) classic[k] = o[k];
      classic.style = 'classic';
      classicFont = plan(type, problems, classic).font;
      fontRange[0] = Math.max(fontRange[0], Math.min(20 * shrink, classicFont * 1.15));
    }
    var W = (paper.w - 2 * MARGIN.side) * MM;
    var H = (paper.h - MARGIN.top - MARGIN.bottom) * MM - FOOT;
    var title = o.title || '';
    var titlePt = titleSize(title, W);
    var ho = { titlePt: titlePt, instruction: withAnswer ? '' : o.instruction };
    var firstH = headHeight(ho, withAnswer ? 'key' : 'first', W);
    var otherH = headHeight(ho, withAnswer ? 'key' : 'cont', W);
    var sizes = problems.map(function (p) { return measure(p, fam, withAnswer); });
    // A problem wider than the page at the minimum size (very long lines): lower the minimum
    // so that it fits on one column instead of failing.
    var widest = 0;
    sizes.forEach(function (z) { widest = Math.max(widest, z.w); });
    if (widest) fontRange[0] = Math.min(fontRange[0], Math.floor(W / (NUM + widest) * 4) / 4);
    var pref = Math.max(F.cols[0], Math.min(F.cols[1], o.cols || type.cols || F.cols[1]));
    var n = problems.length, fit = null, pages = 1;
    // Fewest pages first. Before adding a page, accept a smaller size, down to a readable floor
    // (11 pt Classic): 60 short facts belong on one page, 20 long divisions do not.
    var floorRange = [Math.min(fontRange[0], Math.max(FLOOR * style.min * shrink, classicFont)), fontRange[1]];
    var fitWith = function (per, rangeTry) {
      return fam === 'E' ? wordLayout(sizes, per, F, W, H, rangeTry, firstH, otherH)
        : bestFit(sizes, per, F, style, pref, W, H, rangeTry, firstH, otherH);
    };
    for (pages = 1; pages <= n; pages++) {
      var per = Math.ceil(n / pages);
      fit = fitWith(per, fontRange) || fitWith(per, floorRange);
      if (fit) break;
    }
    if (!fit) { // cannot happen with sane sizes; fall back to one problem per page
      pages = n; fit = { cols: 1, rows: 1, font: fontRange[0], slack: 1 };
    }
    var perPage = Math.ceil(n / pages);
    var split = [];
    for (var i = 0; i < pages; i++) split.push([i * perPage, Math.min(n, (i + 1) * perPage)]);
    split = split.filter(function (s) { return s[0] < s[1]; });
    return {
      family: fam, familyName: F.name, style: o.style || 'classic', paper: o.paper === 'a4' ? 'a4' : 'letter',
      pageW: paper.w, pageH: paper.h, cols: fit.cols, rows: Math.ceil(perPage / fit.cols), font: fit.font,
      titlePt: titlePt, pages: split, answers: withAnswer
    };
  }

  // ---------- Rendering ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function r2(x) { return Math.round(x * 100) / 100; }

  function head(type, o, pl, kind, total) {
    var title = esc(o.title || type.sheetTitle || type.h1 || '');
    var brand = '<div class="sh-brand"><span class="sh-logo">' + esc(o.siteName || 'MathSheetLab') + '</span>' +
      (type.grade ? '<span>' + esc(type.grade) + '</span>' : '') + '</div>';
    var key = o.answers ? '<span class="sh-key">Answer key</span>' : '';
    if (kind === 'cont') {
      return '<header class="sh-head sh-cont">' + brand + '<div class="sh-title">' + title + key + ' <span class="sh-more">(continued)</span></div></header>';
    }
    var fields = o.answers ? '' :
      '<div class="sh-fields"><span class="f-name">Name <i></i></span><span class="f-date">Date <i></i></span>' +
      (o.score === false ? '' : '<span class="f-score">Score <i class="short"></i> / ' + total + '</span>') + '</div>';
    var ins = !o.answers && type.instruction ? '<p class="sh-ins">' + esc(type.instruction) + '</p>' : '';
    return '<header class="sh-head">' + brand + '<div class="sh-title">' + title + key + '</div>' + ins + fields + '</header>';
  }

  function foot(o, page, pages) {
    var host = o.siteHost ? ' · ' + esc(o.siteHost) : '';
    return '<footer class="sh-foot"><span>' + esc(o.siteName || 'MathSheetLab') + host + '</span>' +
      '<span>' + (o.seed ? 'Worksheet #' + esc(o.seed) : '') + '</span>' +
      '<span>' + (pages > 1 ? (o.answers ? 'Answer key · ' : '') + 'Page ' + page + ' of ' + pages : '') + '</span></footer>';
  }

  function items(problems, from, to, withAnswer, fam) {
    var out = '';
    for (var i = from; i < to; i++) {
      var p = problems[i];
      var work = !withAnswer && (fam === 'C' || fam === 'E') ? '<div class="work" aria-hidden="true">' + new Array(WORK_LINES + 1).join('<i></i>') + '</div>' : '';
      out += '<li class="pr pr-' + p.kind + '"><span class="pn">' + (i + 1) + '.</span><div class="pb">' +
        MSL.renderProblem(p, withAnswer) + work + '</div></li>';
    }
    return out;
  }

  // Pages of one sheet (problems or answer key). o: title, seed, siteName, siteHost, answers,
  // paper ('letter'|'a4'), style ('classic'|'primary'|'compact'), cols (preferred), shrink.
  function renderPages(type, problems, o) {
    o = o || {};
    var opts = {};
    for (var k in o) opts[k] = o[k];
    opts.title = o.title || type.sheetTitle || type.h1;
    opts.instruction = type.instruction;
    var pl = plan(type, problems, opts);
    var total = pl.pages.length;
    return pl.pages.map(function (range, i) {
      var kind = i === 0 ? (o.answers ? 'key' : 'first') : (o.answers ? 'key' : 'cont');
      var style = '--pw:' + pl.pageW + 'mm;--ph:' + pl.pageH + 'mm;--cols:' + pl.cols + ';--rows:' + pl.rows +
        ';--fs:' + r2(pl.font) + 'pt;--tfs:' + r2(pl.titlePt) + 'pt';
      return '<div class="sheet pg fam-' + pl.family + ' st-' + pl.style + (o.answers ? ' sheet-key' : '') +
        '" data-family="' + pl.family + '" data-page="' + (i + 1) + '/' + total + '" style="' + style + '">' +
        head(type, o, pl, kind === 'key' && i > 0 ? 'key' : kind, problems.length) +
        '<ol class="sh-grid">' + items(problems, range[0], range[1], !!o.answers, pl.family) + '</ol>' +
        foot(o, i + 1, total) + '</div>';
    }).join('');
  }

  // A whole printable worksheet: problem pages, then (optionally) the answer key pages.
  function renderWorksheet(type, problems, o) {
    o = o || {};
    var copy = {};
    for (var k in o) copy[k] = o[k];
    copy.answers = false;
    var html = renderPages(type, problems, copy);
    if (o.answers) { copy.answers = true; html += renderPages(type, problems, copy); }
    return html;
  }

  // One free-flowing sheet, without page size: used for illustrations (home page, share images).
  function renderSheet(type, problems, o) {
    o = o || {};
    var cols = o.cols || type.cols || 4;
    var opts = {};
    for (var k in o) opts[k] = o[k];
    var fam = familyOf(type, problems);
    return '<div class="sheet fam-' + fam + (o.answers ? ' sheet-key' : '') + (o.large ? ' sheet-lg' : '') + '" style="--cols:' + cols + '">' +
      head(type, opts, null, 'first', problems.length) +
      '<ol class="sh-grid">' + items(problems, 0, problems.length, !!o.answers, fam) + '</ol>' +
      foot(opts, 1, 1) + '</div>';
  }

  var api = {
    PAPER: PAPER, MARGIN: MARGIN, FAMILIES: FAMILIES, STYLES: STYLES,
    measure: measure, familyOf: familyOf, plan: plan,
    renderPages: renderPages, renderWorksheet: renderWorksheet, renderSheet: renderSheet
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.MSL.layout = api; root.MSL.renderSheet = renderSheet; }
})(typeof self !== 'undefined' ? self : this);
