/* MathSheetLab online practice: one question at a time, instant feedback, score.
 * Problems and checking come from engine.js and practice.js; nothing leaves the browser
 * (best scores and display preferences are kept in localStorage on this device only).
 * MSL.practiceRunner.open() is shared by worksheet pages and class assignments (assign.js). */
(function () {
  'use strict';

  if (!window.MSL || !window.MSL.practice) return;
  var MSL = window.MSL, P = MSL.practice;
  var LEVEL_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  var STORE = 'msl-practice-v1', PREFS = 'msl-display-v1';

  function load(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function shortTitle(h1) { return cap(h1.replace(/ worksheets?$/i, '')); }
  function clock(secs) { return Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2); }

  // ---------- Runner ----------
  // opts: { title, meta (e.g. level name), items: [{ type, p }], explainJs,
  //         onFinish(result) -> { html, actions: [{ label, primary, run }] }, onClose }
  var dlg, round, opts;
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'pr-dlg';
    dlg.setAttribute('aria-labelledby', 'pr-title');
    dlg.innerHTML =
      '<div class="pr-head">' +
        '<div class="pr-head-main"><p class="pr-kicker" id="pr-meta"></p><h2 id="pr-title"></h2></div>' +
        '<details class="pr-display"><summary>Display</summary><div class="pr-display-menu">' +
          '<label class="check"><input type="checkbox" name="lg"> Larger text</label>' +
          '<label class="check"><input type="checkbox" name="hc"> High contrast</label>' +
          '<label class="check"><input type="checkbox" name="rd"> Easy-read spacing</label>' +
        '</div></details>' +
        '<button type="button" class="pr-close" aria-label="Close practice">×</button>' +
      '</div>' +
      '<div class="pr-bar" aria-hidden="true"><i></i></div>' +
      '<div class="pr-body" id="pr-body"></div>' +
      '<p class="pr-live visually-hidden" aria-live="polite" id="pr-live"></p>';
    document.body.appendChild(dlg);
    dlg.querySelector('.pr-close').addEventListener('click', close);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    var prefs = load(PREFS);
    ['lg', 'hc', 'rd'].forEach(function (k) {
      var box = dlg.querySelector('input[name="' + k + '"]');
      box.checked = !!prefs[k];
      dlg.classList.toggle('pr-' + k, !!prefs[k]);
      box.addEventListener('change', function () {
        var p = load(PREFS); p[k] = box.checked; save(PREFS, p);
        dlg.classList.toggle('pr-' + k, box.checked);
      });
    });
  }

  function open(o) {
    if (!dlg) build();
    opts = o;
    round = { i: 0, right: 0, missed: [], tries: 0, count: o.items.length, started: Date.now() };
    dlg.querySelector('#pr-title').textContent = o.title;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    document.documentElement.classList.add('pr-open');
    ask();
  }
  function close() {
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
    document.documentElement.classList.remove('pr-open');
    if (opts && opts.onClose) opts.onClose();
  }

  function setMeta(done) {
    dlg.querySelector('#pr-meta').textContent = (opts.meta ? opts.meta + ' · ' : '') +
      (done ? 'Finished' : 'Question ' + (round.i + 1) + ' of ' + round.count);
    dlg.querySelector('.pr-bar i').style.width = (100 * (done ? 1 : round.i / round.count)) + '%';
  }
  function say(text) { var live = dlg.querySelector('#pr-live'); live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30); }

  // ---------- One question ----------
  function ask() {
    var item = opts.items[round.i], p = item.p;
    round.tries = 0;
    setMeta(false);
    var kind = P.inputKind(p);
    var body = dlg.querySelector('#pr-body');
    var showTopic = opts.items.some(function (x) { return x.type.slug !== item.type.slug; });
    body.innerHTML =
      (showTopic ? '<p class="pr-topic">' + esc(shortTitle(item.type.h1)) + '</p>' : '') +
      '<p class="pr-instruction">' + esc(item.type.instruction || '') + '</p>' +
      '<div class="pr-problem pr-q" aria-hidden="true">' + MSL.renderProblem(p, false) + '</div>' +
      '<p class="visually-hidden">' + esc(spoken(p)) + '</p>' +
      '<form class="pr-answer" novalidate>' + inputHtml(p, kind) + '</form>' +
      '<div class="pr-feedback" id="pr-feedback"></div>';
    var form = body.querySelector('form');
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(item, kind, form); });
    if (kind === 'choice') {
      Array.prototype.forEach.call(form.querySelectorAll('[data-choice]'), function (b) {
        b.addEventListener('click', function () { form.choice.value = b.getAttribute('data-choice'); submit(item, kind, form); });
      });
    }
    var first = form.querySelector('input:not([type="hidden"]), button');
    if (first) first.focus();
  }

  function inputHtml(p, kind) {
    if (kind === 'choice') {
      return '<input type="hidden" name="choice"><div class="pr-choices" role="group" aria-label="Choose the sign">' +
        ['<', '=', '>'].map(function (c) {
          var name = c === '<' ? 'is less than' : c === '>' ? 'is greater than' : 'is equal to';
          return '<button type="button" class="btn btn-secondary pr-choice" data-choice="' + esc(c) + '" aria-label="' + name + '">' + esc(c) + '</button>';
        }).join('') + '</div>';
    }
    if (kind === 'clock') {
      return '<div class="pr-row"><div class="pr-clock"><label class="visually-hidden" for="pr-hr">Hour</label>' +
        '<input id="pr-hr" name="h" class="pr-input sm" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="h">' +
        '<span aria-hidden="true">:</span><label class="visually-hidden" for="pr-min">Minutes</label>' +
        '<input id="pr-min" name="m" class="pr-input sm" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="mm"></div>' +
        '<button type="submit" class="btn btn-primary pr-check">Check</button></div>';
    }
    var exp = P.expectedText(p);
    var numeric = kind === 'text' && /^\d[\d,]*(\.\d+)?$/.test(exp.replace('$', ''));
    var hint = kind === 'fraction' ? 'Type fractions like 3/4 and mixed numbers like 1 3/4.'
      : / R\d+$/.test(exp) || p.kind === 'ld' ? 'Write a remainder with R, like 12 R3.'
      : / \+ /.test(exp) ? 'Write it like 300 + 40 + 5.' : '';
    return '<div class="pr-row"><label class="visually-hidden" for="pr-in">Your answer</label>' +
      '<input id="pr-in" name="a" class="pr-input" autocomplete="off" autocapitalize="off" spellcheck="false"' +
      (numeric ? ' inputmode="decimal"' : '') + (hint ? ' aria-describedby="pr-hint"' : '') + ' placeholder="Your answer">' +
      '<button type="submit" class="btn btn-primary pr-check">Check</button></div>' +
      (hint ? '<p class="pr-hint" id="pr-hint">' + esc(hint) + '</p>' : '');
  }

  function submit(item, kind, form) {
    var p = item.p;
    var input = kind === 'choice' ? form.choice.value : kind === 'clock' ? { h: form.h.value, m: form.m.value } : form.a.value;
    var empty = kind === 'clock' ? !input.h.trim() : !String(input).trim();
    var fb = dlg.querySelector('#pr-feedback');
    if (empty) { fb.innerHTML = '<p class="pr-msg">Type your answer first.</p>'; say('Type your answer first.'); return; }
    var res = P.check(p, input);
    if (!res.ok && res.almost && round.tries < 2) {
      round.tries++;
      fb.innerHTML = '<p class="pr-msg pr-almost">' + esc(res.almost) + '</p>';
      say(res.almost);
      return;
    }
    Array.prototype.forEach.call(form.querySelectorAll('input, button'), function (el) { el.disabled = true; });
    if (res.ok) {
      round.right++;
      fb.innerHTML = '<p class="pr-msg pr-ok">Correct!</p>' + nextButton();
      say('Correct!');
    } else {
      round.missed.push(p);
      fb.innerHTML = '<p class="pr-msg pr-no">Not quite. The answer is:</p>' +
        '<div class="pr-problem pr-solution">' + MSL.renderProblem(p, true) + '</div>' +
        '<details class="pr-how"><summary>Show me how</summary><ol class="pr-steps"><li>Loading…</li></ol></details>' + nextButton();
      say('Not quite. The answer is ' + P.expectedText(p) + '.');
      var how = fb.querySelector('.pr-how');
      how.addEventListener('toggle', function () { if (how.open) explainInto(item, how.querySelector('.pr-steps')); });
    }
    var next = fb.querySelector('.pr-next');
    next.addEventListener('click', function () {
      round.i++;
      if (round.i < round.count) ask(); else finish();
    });
    next.focus();
  }
  function nextButton() {
    return '<button type="button" class="btn btn-primary pr-next">' + (round.i + 1 < round.count ? 'Next question' : 'See my score') + '</button>';
  }

  // Step-by-step explanation, loaded only when a student asks for it.
  var explainReady;
  function explainInto(item, list) {
    if (!explainReady) {
      explainReady = new Promise(function (resolve, reject) {
        if (window.MSLExplain) return resolve();
        var s = document.createElement('script');
        s.src = opts.explainJs; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    explainReady.then(function () {
      var ex = window.MSLExplain(item.type, item.p);
      list.innerHTML = ex.steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('');
    }).catch(function () {
      explainReady = null;
      list.innerHTML = '<li>The explanation could not be loaded. See the worked example on the worksheet page.</li>';
    });
  }

  // ---------- Score ----------
  function finish() {
    var result = { right: round.right, total: round.count, secs: Math.round((Date.now() - round.started) / 1000) };
    result.pct = Math.round(100 * result.right / result.total);
    var extra = opts.onFinish ? opts.onFinish(result) : { html: '', actions: [] };
    var msg = result.pct === 100 ? 'Perfect score!' : result.pct >= 80 ? 'Great work!' : result.pct >= 50 ? 'Good effort, keep practicing.' : 'Keep going: practice makes progress.';
    setMeta(true);
    var body = dlg.querySelector('#pr-body');
    body.innerHTML =
      '<div class="pr-result"><p class="pr-score"><strong>' + result.right + '</strong> / ' + result.total + '</p>' +
      '<p class="pr-result-msg">' + msg + '</p>' +
      '<ul class="chips pr-stats"><li>' + result.pct + '% correct</li><li>Time ' + clock(result.secs) + '</li>' + (extra.chips || '') + '</ul></div>' +
      (extra.html || '') +
      (round.missed.length ? '<h3 class="pr-review-h">Review your mistakes</h3><ul class="pr-review">' + round.missed.map(function (p) {
        return '<li class="pr-problem">' + MSL.renderProblem(p, true) + '</li>';
      }).join('') + '</ul>' : '') +
      '<div class="pr-end-actions">' + (extra.actions || []).map(function (a, i) {
        return '<button type="button" class="btn ' + (a.primary ? 'btn-primary' : 'btn-secondary') + '" data-action="' + i + '">' + esc(a.label) + '</button>';
      }).join('') + '</div>';
    say('You scored ' + result.right + ' out of ' + result.total + '. ' + msg);
    Array.prototype.forEach.call(body.querySelectorAll('[data-action]'), function (b) {
      b.addEventListener('click', function () { extra.actions[+b.getAttribute('data-action')].run(); });
    });
    if (extra.ready) extra.ready(body);
    var first = body.querySelector('.pr-end-actions .btn');
    if (first) first.focus();
  }

  // ---------- Text for screen readers ----------
  function fr(f) { return f[0] + '/' + f[1]; }
  function mixed(m) { return m.w + ' and ' + m.n + '/' + m.d; }
  function spoken(p) {
    switch (p.kind) {
      case 'v': return p.a + ' ' + p.op + ' ' + p.b;
      case 'ld': return p.dividend + ' divided by ' + p.divisor;
      case 'f': return fr(p.a) + ' ' + p.op + ' ' + fr(p.b);
      case 'fs': return 'Simplify ' + fr(p.a);
      case 'fm': return p.a.w !== undefined ? 'Write ' + mixed(p.a) + ' as an improper fraction' : 'Write ' + fr(p.a) + ' as a mixed number';
      case 'fc': return 'Compare ' + fr(p.a) + ' and ' + fr(p.b);
      case 'clk': return 'What time does the clock show? Hour hand and minute hand are drawn on the clock face.';
      default:
        return String(p.text).replace(/<sup>(\d+)<\/sup>/g, ' to the power of $1').replace(/<[^>]*>/g, ' ')
          .replace(/___/g, 'blank').replace(/\s+/g, ' ').trim();
    }
  }

  MSL.practiceRunner = { open: open, close: close, shortTitle: shortTitle, clock: clock, LEVEL_NAMES: LEVEL_NAMES };

  // ---------- Worksheet page ----------
  var cfgEl = document.getElementById('ws-config');
  var start = document.getElementById('pr-start');
  if (!cfgEl || !start) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var type = cfg.type;
  var bestEl = document.getElementById('pr-best');
  showBest();
  start.addEventListener('submit', function (e) {
    e.preventDefault();
    practice(start.level.value, Number(start.n.value) || 10, MSL.randomSeed());
  });
  // Direct link: ?practice=easy|medium|hard[&q=10][&ps=123456] opens the practice straight away.
  var qs = new URLSearchParams(location.search);
  if (qs.get('practice')) {
    var lv = P.LEVELS.indexOf(qs.get('practice')) === -1 ? 'medium' : qs.get('practice');
    var qn = [5, 10, 20].indexOf(Number(qs.get('q'))) === -1 ? 10 : Number(qs.get('q'));
    var ps = Number(qs.get('ps'));
    start.level.value = lv;
    start.n.value = String(qn);
    practice(lv, qn, ps >= 100000 && ps <= 999999 ? ps : MSL.randomSeed());
  }

  function showBest() {
    if (!bestEl) return;
    var mine = load(STORE)[type.slug] || {};
    var parts = P.LEVELS.filter(function (l) { return mine[l]; }).map(function (l) {
      return LEVEL_NAMES[l] + ' ' + mine[l].pct + '%';
    });
    bestEl.textContent = parts.length ? 'Your best on this device: ' + parts.join(' · ') : '';
  }

  function practice(level, count, seed) {
    open({
      title: shortTitle(type.h1),
      meta: LEVEL_NAMES[level],
      explainJs: cfg.explainJs,
      items: P.questions(MSL, type, seed, count, level).map(function (p) { return { type: type, p: p }; }),
      onClose: function () { showBest(); var b = start.querySelector('button[type="submit"]'); if (b) b.focus(); },
      onFinish: function (r) {
        var all = load(STORE), mine = all[type.slug] || {}, prev = mine[level];
        var record = !prev || r.pct > prev.pct;
        if (record) { mine[level] = { pct: r.pct, right: r.right, total: r.total, secs: r.secs }; all[type.slug] = mine; save(STORE, all); }
        var li = P.LEVELS.indexOf(level);
        var nextLevel = r.pct >= 80 && li < 2 ? P.LEVELS[li + 1] : r.pct < 50 && li > 0 ? P.LEVELS[li - 1] : null;
        var actions = [];
        if (nextLevel) actions.push({ label: 'Try ' + LEVEL_NAMES[nextLevel] + ' level', primary: true, run: function () { start.level.value = nextLevel; practice(nextLevel, count, MSL.randomSeed()); } });
        actions.push({ label: 'New questions', primary: !nextLevel, run: function () { practice(level, count, MSL.randomSeed()); } });
        actions.push({ label: 'Back to the worksheet', run: close });
        return { chips: record ? '<li>New best on this device</li>' : '<li>Best: ' + prev.pct + '%</li>', actions: actions };
      }
    });
  }
})();
