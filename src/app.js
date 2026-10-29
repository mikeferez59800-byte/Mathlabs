/* MathSheetLab page script: worksheet generator UI and home-page search. */
(function () {
  'use strict';

  var cfgEl = document.getElementById('ws-config');
  if (cfgEl) initWorksheet(JSON.parse(cfgEl.textContent));
  var search = document.getElementById('ws-search');
  if (search) initSearch(search);

  function initWorksheet(cfg) {
    var type = cfg.type;
    var form = document.getElementById('ws-form');
    var out = document.getElementById('ws-output');
    var status = document.getElementById('ws-status');
    var seedLabel = document.getElementById('ws-seed');
    var params = new URLSearchParams(location.search);

    var state = {
      seed: toInt(params.get('s'), cfg.defaultSeed, 100000, 999999),
      count: pickAllowed(toInt(params.get('n'), type.count), type.counts, type.count),
      answers: params.get('key') !== '0',
      large: params.get('lg') === '1',
      title: (params.get('t') || '').slice(0, 80),
      paper: params.get('p') === 'a4' ? 'a4' : 'letter'
    };

    form.count.value = String(state.count);
    form.answers.checked = state.answers;
    form.large.checked = state.large;
    form.title.value = state.title;
    form.paper.value = state.paper;

    // The server-rendered sheet already matches the default seed on US Letter; only re-render if needed.
    var isDefault = state.seed === cfg.defaultSeed && state.count === type.count && !state.large && !state.title && state.paper === 'letter';
    applyPaper();
    if (!isDefault || !state.answers) render(false);
    else afterRender();
    updateSeedLabel();
    window.addEventListener('resize', debounce(fitToScreen, 150));
    // Re-check the layout once the sheet font has loaded (sizes are computed for it).
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkFit);

    form.addEventListener('change', function (e) {
      if (e.target.name === 'title') return;
      readForm();
      render(true);
    });
    form.title.addEventListener('input', debounce(function () { readForm(); render(true); }, 300));
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    document.getElementById('ws-new').addEventListener('click', function () {
      state.seed = window.MSL.randomSeed();
      render(true);
      announce('New worksheet generated.');
    });
    document.getElementById('ws-print').addEventListener('click', function () {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.print(); });
      else window.print();
    });
    document.getElementById('ws-copy').addEventListener('click', function () {
      var url = location.href;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { announce('Link copied. It always opens this exact worksheet.'); },
          function () { fallbackCopy(url); });
      } else fallbackCopy(url);
    });

    function readForm() {
      state.count = pickAllowed(toInt(form.count.value, type.count), type.counts, type.count);
      state.answers = form.answers.checked;
      state.large = form.large.checked;
      state.title = form.title.value.slice(0, 80);
      state.paper = form.paper.value === 'a4' ? 'a4' : 'letter';
      applyPaper();
    }

    function render(updateUrl, shrink) {
      try {
        var problems = window.MSL.generate(type, state.seed, state.count);
        var opts = {
          title: state.title || type.sheetTitle, seed: state.seed, siteName: cfg.siteName, siteHost: cfg.siteHost,
          cols: type.cols, paper: state.paper, style: state.large ? 'primary' : 'classic', answers: state.answers, shrink: shrink
        };
        out.innerHTML = window.MSL.layout.renderWorksheet(type, problems, opts);
        state.shrink = shrink || 1;
        out.setAttribute('data-shrink', String(state.shrink));
        if (updateUrl) syncUrl();
        updateSeedLabel();
        afterRender();
      } catch (err) {
        out.innerHTML = '<p class="error" role="alert">Sorry, this worksheet could not be generated. Please reload the page. If the problem continues, the error was: ' +
          String(err && err.message || err).replace(/</g, '&lt;') + '</p>';
      }
    }

    function afterRender() {
      fitToScreen();
      checkFit();
    }

    // Safety net: the layout is computed for the sheet font; if a browser still draws a problem
    // wider or taller than its cell, redraw slightly smaller (never hide anything).
    function checkFit() {
      var bad = Array.prototype.some.call(out.querySelectorAll('.sheet.pg .pr'), function (li) {
        return li.scrollWidth > li.clientWidth + 1 || li.scrollHeight > li.clientHeight + 1;
      }) || Array.prototype.some.call(out.querySelectorAll('.sheet.pg'), function (pg) {
        return pg.scrollHeight > pg.clientHeight + 1;
      });
      var shrink = state.shrink || 1;
      if (bad && shrink > 0.75) render(false, Math.round(shrink * 0.94 * 100) / 100);
    }

    // Pages are drawn at their real paper size; on narrow screens they are scaled down to fit.
    function fitToScreen() {
      var sheets = out.querySelectorAll('.sheet.pg');
      if (!sheets.length) return;
      Array.prototype.forEach.call(sheets, function (s) { s.style.zoom = ''; });
      var avail = out.clientWidth - 2;
      var w = sheets[0].offsetWidth;
      var k = w > avail ? Math.max(0.3, avail / w) : 1;
      if (k < 1) Array.prototype.forEach.call(sheets, function (s) { s.style.zoom = String(Math.floor(k * 1000) / 1000); });
    }

    function syncUrl() {
      var q = new URLSearchParams();
      q.set('s', state.seed);
      if (state.count !== type.count) q.set('n', state.count);
      if (!state.answers) q.set('key', '0');
      if (state.large) q.set('lg', '1');
      if (state.title) q.set('t', state.title);
      if (state.paper === 'a4') q.set('p', 'a4');
      history.replaceState(null, '', location.pathname + '?' + q.toString());
    }

    function applyPaper() {
      var el = document.getElementById('page-size');
      if (!el) { el = document.createElement('style'); el.id = 'page-size'; document.head.appendChild(el); }
      el.textContent = '@page{size:' + (state.paper === 'a4' ? 'A4' : 'letter') + ';margin:0}';
    }

    function updateSeedLabel() { seedLabel.textContent = '#' + state.seed; }

    function announce(msg) {
      status.textContent = '';
      setTimeout(function () { status.textContent = msg; }, 30);
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      announce(ok ? 'Link copied.' : 'Copy failed. You can copy the address from your browser bar.');
    }
  }

  function initSearch(input) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-group]'));
    var empty = document.getElementById('ws-search-empty');
    var count = document.getElementById('ws-search-count');
    input.addEventListener('input', function () {
      var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (c) {
        var hay = c.getAttribute('data-search');
        var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector('[data-search]:not([hidden])'); });
      empty.hidden = shown !== 0;
      count.textContent = terms.length ? shown + ' worksheet' + (shown === 1 ? '' : 's') + ' found' : '';
    });
  }

  function toInt(v, def, min, max) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return def;
    if (min !== undefined && (n < min || n > max)) return def;
    return n;
  }
  function pickAllowed(n, allowed, def) { return allowed.indexOf(n) !== -1 ? n : def; }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
})();
