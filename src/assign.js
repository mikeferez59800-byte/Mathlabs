/* MathSheetLab class assignments (/assign/).
 * Teacher: builds a link (skills, level, questions, title, shared seed) and checks result lines.
 * Student: opens the link, answers online (MSL.practiceRunner), gets a result line with a check code.
 * The whole assignment lives in the link; nothing is sent to a server. */
(function () {
  'use strict';

  var cfgEl = document.getElementById('as-config');
  if (!cfgEl || !window.MSL || !MSL.practiceRunner) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var P = MSL.practice, R = MSL.practiceRunner;
  var byCode = {}, bySlug = {};
  cfg.catalog.forEach(function (t) { byCode[t.code] = t; bySlug[t.slug] = t; });
  var MAX = 5, LEVEL_KEYS = { e: 'easy', m: 'medium', h: 'hard' };
  var ATTEMPTS = 'msl-assign-v1';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(ATTEMPTS)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(ATTEMPTS, JSON.stringify(v)); } catch (e) { /* private mode */ } }

  // ---------- Assignment <-> link ----------
  function toQuery(a) {
    var q = 'w=' + a.types.map(function (t) { return t.code; }).join(',') + '&lv=' + a.level.charAt(0) + '&q=' + a.q + '&ps=' + a.seed;
    return a.title ? q + '&t=' + encodeURIComponent(a.title) : q;
  }
  function fromQuery(search) {
    var qs = new URLSearchParams(search);
    if (!qs.get('w')) return null;
    var codes = qs.get('w').split(',').slice(0, MAX);
    var list = codes.map(function (c) { return byCode[c]; });
    var seed = Number(qs.get('ps')), q = Number(qs.get('q')), lv = LEVEL_KEYS[qs.get('lv')];
    if (!codes.length || list.some(function (t) { return !t; }) || !lv || [5, 10, 20].indexOf(q) === -1 || !(seed >= 100000 && seed <= 999999)) return { invalid: true };
    return { types: list, level: lv, q: q, seed: seed, title: (qs.get('t') || '').slice(0, 60).trim() };
  }
  // Assignment id: depends on everything that defines the questions and the title.
  function assignmentId(a) { return hash32(toQuery(a), 1).toString(36); }

  // FNV-1a, with a seed so two independent halves can be combined.
  function hash32(s, seed) {
    var h = (2166136261 ^ seed) >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function checkCode(aid, name, right, total, secs, attempt) {
    var s = [aid, name.trim().toLowerCase(), right, total, secs, attempt].join('|');
    var n = hash32(s, 7) ^ (hash32(s, 13) << 7), out = '';
    for (var i = 0; i < 6; i++) { out += B32.charAt(n & 31); n >>>= 5; }
    return out;
  }
  function resultLine(name, r, attempt, code) {
    return name + ' — ' + r.right + '/' + r.total + ' — ' + R.clock(r.secs) + ' — try ' + attempt + ' — ' + code;
  }
  function parseLine(line) {
    var m = line.trim().match(/^(.+?)\s+[—–-]+\s+(\d+)\s*\/\s*(\d+)\s+[—–-]+\s+(\d+):(\d\d)\s+[—–-]+\s+try\s+(\d+)\s+[—–-]+\s+([0-9A-Za-z]{6})$/);
    if (!m) return null;
    return { name: m[1], right: +m[2], total: +m[3], secs: +m[4] * 60 + +m[5], attempt: +m[6], code: m[7].toUpperCase() };
  }
  function questionsFor(a) {
    var items = [];
    a.types.forEach(function (t, i) {
      P.questions(MSL, t, a.seed + i, a.q, a.level).forEach(function (p) { items.push({ type: t, p: p }); });
    });
    return items;
  }
  function defaultTitle(a) {
    return a.title || (a.types.length === 1 ? R.shortTitle(a.types[0].h1) : 'Math practice: ' + a.types.length + ' skills');
  }

  var current = fromQuery(location.search);
  if (current) student(current); else teacher();

  // ---------- Teacher ----------
  function teacher() {
    var chosen = [];
    var form = $('as-form'), pick = $('as-pick'), list = $('as-chosen'), err = $('as-error');
    var add = new URLSearchParams(location.search).get('add');
    if (add && bySlug[add]) chosen.push(bySlug[add]);
    renderChosen();

    $('as-add').addEventListener('click', addPicked);
    pick.addEventListener('change', function () { if (pick.value) addPicked(); });
    function addPicked() {
      var t = bySlug[pick.value];
      err.textContent = '';
      if (!t) { err.textContent = 'Choose a worksheet in the list first.'; return; }
      if (chosen.indexOf(t) !== -1) { err.textContent = 'This skill is already in the assignment.'; return; }
      if (chosen.length >= MAX) { err.textContent = 'You can add up to ' + MAX + ' skills.'; return; }
      chosen.push(t);
      pick.value = '';
      renderChosen();
    }
    function renderChosen() {
      list.innerHTML = chosen.map(function (t, i) {
        return '<li><a href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(R.shortTitle(t.h1)) + '</a> <span class="as-grade">' + esc(t.grade) +
          '</span><button type="button" class="as-remove" data-i="' + i + '" aria-label="Remove ' + esc(R.shortTitle(t.h1)) + '">×</button></li>';
      }).join('');
      $('as-empty').hidden = chosen.length > 0;
      Array.prototype.forEach.call(list.querySelectorAll('.as-remove'), function (b) {
        b.addEventListener('click', function () { chosen.splice(+b.getAttribute('data-i'), 1); renderChosen(); });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      if (!chosen.length) { err.textContent = 'Add at least one skill.'; return; }
      var a = { types: chosen.slice(), level: form.level.value, q: Number(form.q.value), seed: MSL.randomSeed(), title: form.t.value.trim().slice(0, 60) };
      var link = location.origin + location.pathname + '?' + toQuery(a);
      $('as-link').value = link;
      $('as-try').href = link;
      $('as-check-link').value = link;
      try { $('as-qr').innerHTML = MSL.qr.svg(link, 'QR code of the assignment link'); }
      catch (x) { $('as-qr').innerHTML = '<p class="as-note">The link is too long for a QR code. Shorten the title.</p>'; }
      $('as-share').hidden = false;
      $('as-share').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('as-copy').focus({ preventScroll: true });
    });
    $('as-copy').addEventListener('click', function () { copy($('as-link').value, $('as-copy'), 'Link copied'); });
    $('as-verify').addEventListener('click', verify);
  }

  function verify() {
    var out = $('as-table');
    var a = fromQuery(($('as-check-link').value.split('?')[1] || ''));
    if (!a || a.invalid) { out.innerHTML = '<p class="as-error">Paste the full assignment link first (it starts with ' + esc(location.origin) + '/assign/?w=).</p>'; return; }
    var aid = assignmentId(a);
    var rows = $('as-results').value.split(/\n+/).filter(function (l) { return l.trim(); }).map(function (l) {
      var r = parseLine(l);
      if (!r) return { raw: l };
      r.valid = checkCode(aid, r.name, r.right, r.total, r.secs, r.attempt) === r.code && r.total === a.q * a.types.length;
      return r;
    });
    if (!rows.length) { out.innerHTML = '<p class="as-error">Paste at least one result line.</p>'; return; }
    var ok = rows.filter(function (r) { return r.valid; });
    var avg = ok.length ? Math.round(ok.reduce(function (s, r) { return s + 100 * r.right / r.total; }, 0) / ok.length) : null;
    out.innerHTML = '<p class="as-summary">' + ok.length + ' valid result' + (ok.length === 1 ? '' : 's') + (avg !== null ? ', average ' + avg + '%' : '') + '.</p>' +
      '<div class="as-table-wrap"><table class="as-results"><thead><tr><th scope="col">Student</th><th scope="col">Score</th><th scope="col">%</th><th scope="col">Time</th><th scope="col">Try</th><th scope="col">Check</th></tr></thead><tbody>' +
      rows.map(function (r) {
        if (!r.name) return '<tr class="bad"><td colspan="5">' + esc(r.raw) + '</td><td>Not a result line</td></tr>';
        return '<tr class="' + (r.valid ? 'ok' : 'bad') + '"><td>' + esc(r.name) + '</td><td>' + r.right + '/' + r.total + '</td><td>' + Math.round(100 * r.right / r.total) + '%</td><td>' + R.clock(r.secs) + '</td><td>' + r.attempt + '</td><td>' +
          (r.valid ? '✓ Valid' : '✗ Not from this assignment or edited') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (ok.length ? '<button type="button" class="btn btn-secondary btn-sm" id="as-copy-table">Copy for a spreadsheet</button>' : '');
    var cp = $('as-copy-table');
    if (cp) cp.addEventListener('click', function () {
      var tsv = 'Student\tScore\tOut of\tPercent\tTime\tTry\n' + ok.map(function (r) {
        return [r.name, r.right, r.total, Math.round(100 * r.right / r.total), R.clock(r.secs), r.attempt].join('\t');
      }).join('\n');
      copy(tsv, cp, 'Copied');
    });
  }

  // ---------- Student ----------
  function student(a) {
    $('as-teacher').hidden = true;
    $('as-student').hidden = false;
    var head = $('as-st-h'), err = $('as-st-error'), form = $('as-st-form');
    if (a.invalid) {
      head.textContent = 'This assignment link is incomplete';
      form.hidden = true;
      err.textContent = 'Ask your teacher to send the link again, or copy it in full.';
      form.parentNode.appendChild(err);
      return;
    }
    var title = defaultTitle(a), aid = assignmentId(a);
    document.title = title + ' | MathSheetLab';
    var h1 = document.querySelector('.page-head h1'), lead = document.querySelector('.page-head .lead');
    if (h1) h1.textContent = title;
    if (lead) lead.textContent = 'Your teacher shared these questions. Answer them one at a time; you will see your score at the end.';
    head.textContent = 'Ready?';
    $('as-st-skills').innerHTML = a.types.map(function (t) { return '<li>' + esc(R.shortTitle(t.h1)) + '</li>'; }).join('') +
      '<li class="as-meta">' + R.LEVEL_NAMES[a.level] + ' level · ' + a.q * a.types.length + ' questions</li>';
    var nameIn = $('as-name');
    try { nameIn.value = localStorage.getItem('msl-nickname') || ''; } catch (e) { /* ignore */ }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameIn.value.replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 24);
      if (!name) { err.textContent = 'Type your first name or a nickname.'; nameIn.focus(); return; }
      err.textContent = '';
      try { localStorage.setItem('msl-nickname', name); } catch (x) { /* ignore */ }
      run(name);
    });

    function run(name) {
      R.open({
        title: title,
        meta: R.LEVEL_NAMES[a.level],
        explainJs: cfg.explainJs,
        items: questionsFor(a),
        onClose: function () { form.querySelector('button').focus(); },
        onFinish: function (r) {
          var all = load(), attempt = (all[aid] || 0) + 1;
          all[aid] = attempt; save(all);
          var line = resultLine(name, r, attempt, checkCode(aid, name, r.right, r.total, r.secs, attempt));
          return {
            chips: '<li>Try ' + attempt + '</li>',
            html: '<div class="as-result"><p class="as-result-h">Send this result to your teacher</p><p class="as-line" id="as-line">' + esc(line) + '</p>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="as-copy-line">Copy my result</button></div>',
            ready: function (body) { body.querySelector('#as-copy-line').addEventListener('click', function (e) { copy(line, e.currentTarget, 'Copied'); }); },
            actions: [{ label: 'Close', primary: true, run: R.close }, { label: 'Try again', run: function () { run(name); } }]
          };
        }
      });
    }
  }

  function copy(text, btn, done) {
    var label = btn.textContent;
    var ok = function () { btn.textContent = done; setTimeout(function () { btn.textContent = label; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }

  // For tests (scripts/test-practice.js runs in Node and cannot load this file; the browser test uses it).
  MSL.assign = { toQuery: toQuery, fromQuery: fromQuery, checkCode: checkCode, assignmentId: assignmentId, parseLine: parseLine, resultLine: resultLine };
})();
