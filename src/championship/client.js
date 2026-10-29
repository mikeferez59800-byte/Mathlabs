/* Multiplication World Championship: browser side (game, practice, rankings, profile, admin).
 * The official score is always computed by the server (/api/championship/*); this script only
 * displays questions, collects answers and their timing, and shows results.
 * Page texts arrive in <script id="champ-data"> in the page language. */
(function () {
  'use strict';

  var dataEl = document.getElementById('champ-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var T = D.t, LANG = D.lang;
  var FIRST_MONTH = '2026-10';
  var API = '/api/championship/';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (typeof el === 'string') el = $(el); if (el) el.hidden = !on; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; }); }
  function num(n) { return new Intl.NumberFormat(LANG).format(n); }
  var countryNames = {};
  D.countries.forEach(function (c) { countryNames[c[0]] = c[1]; });
  function flag(code) {
    if (!code || code === 'ZZ') return '<span class="flag" aria-hidden="true">🌍</span>';
    return '<span class="flag" aria-hidden="true">' + String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65) + '</span>';
  }
  function countryLabel(code) { return countryNames[code] || code; }
  function monthLabel(key) {
    var p = key.split('-');
    return new Intl.DateTimeFormat(LANG, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, 15)));
  }
  function currentMonth(offset) {
    var d = new Date(Date.now() + (offset || 0));
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }
  function monthsSinceLaunch() {
    var out = [], cur = currentMonth();
    var y = +FIRST_MONTH.slice(0, 4), m = +FIRST_MONTH.slice(5);
    for (var k = 0; k < 600; k++) {
      var key = y + '-' + String(m).padStart(2, '0');
      if (key > cur) break;
      out.unshift(key);
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  function duration(ms) {
    var c = T.common;
    if (ms <= 0) return '0 ' + c.minutes;
    var d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    if (d) return d + ' ' + c.days + ' ' + h + ' ' + c.hours;
    if (h) return h + ' ' + c.hours + ' ' + m + ' ' + c.minutes;
    return m + ' ' + c.minutes + ' ' + s + ' ' + c.seconds;
  }
  function playerCell(r, me) {
    var name = r.nickname == null ? '<span class="former">' + esc(T.board.former) + '</span>' : '<span class="nick">' + esc(r.nickname) + '</span>';
    var titles = r.titles ? ' <span class="titles" title="' + esc(r.titles === 1 ? T.hall.titleWon : fmt(T.hall.titlesWon, { n: r.titles })) + '">🏆' + (r.titles > 1 ? '×' + r.titles : '') + '</span>' : '';
    var you = me && r.nickname === me ? ' <span class="you">' + esc(T.board.you) + '</span>' : '';
    return flag(r.country) + name + titles + you + '<span class="country-name">' + esc(countryLabel(r.country)) + '</span>';
  }
  function colon() { return LANG === 'fr' ? '\u00a0: ' : LANG === 'ja' ? '：' : ': '; }
  function errMsg(code) { return (T.play.errors && T.play.errors[code]) || T.play.errors.generic; }

  function api(method, path, body, headers) {
    var opts = { method: method, credentials: 'same-origin', headers: headers || {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { status: res.status, data: data || {} }; });
    }, function () { return { status: 0, data: { error: 'network' } }; });
  }

  // ---------- rankings ----------
  function medalFor(rank) { return rank <= 3 ? '<span class="medal m' + rank + '" title="' + esc(T.common.medals[rank - 1]) + '">' + rank + '</span>' : '<span class="rank-n">' + rank + '</span>'; }
  function boardTable(rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<p class="empty">' + esc(T.board.empty) + '</p>';
    var html = '<table class="board"><thead><tr><th scope="col">' + esc(T.board.rank) + '</th><th scope="col">' + esc(T.board.player) + '</th><th scope="col" class="num">' + esc(T.board.score) + '</th><th scope="col" class="num hide-xs">' + esc(T.board.errors) + '</th>' + (opts.report ? '<th scope="col"><span class="visually-hidden">' + esc(T.board.report) + '</span></th>' : '') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var mine = opts.me && r.nickname === opts.me;
      html += '<tr class="' + (r.rank <= 3 ? 'top top' + r.rank : '') + (mine ? ' mine' : '') + '"><td>' + medalFor(r.rank) + '</td><td class="who">' + playerCell(r, opts.me) + '</td><td class="num score">' + num(r.score) + '</td><td class="num hide-xs">' + num(r.errors) + '</td>' +
        (opts.report ? '<td class="rep">' + (r.nickname && !mine ? '<button type="button" class="linklike small" data-report="' + esc(r.nickname) + '">' + esc(T.board.report) + '</button>' : '') + '</td>' : '') + '</tr>';
    });
    return html + '</tbody></table>';
  }

  // Live card (podium, month, countdown): landing page. The home page uses widget.js.
  function fillLive(root, st) {
    var q = function (sel) { return root.querySelector(sel); };
    var offset = st.serverNow - Date.now();
    var upcoming = !!st.opensAt; // before the first official month: show that month and count down to its start
    if (q('[data-w-month]')) q('[data-w-month]').textContent = fmt(T.common.monthChampionship, { month: monthLabel(upcoming ? st.firstMonth : st.month) });
    var pods = root.querySelectorAll('.pod');
    Array.prototype.forEach.call(pods, function (li) {
      var r = st.podium[+li.getAttribute('data-rank') - 1];
      if (!r) return;
      li.classList.add('filled');
      li.querySelector('[data-pod-name]').innerHTML = flag(r.country) + ' ' + (r.nickname == null ? esc(T.board.former) : esc(r.nickname));
      li.querySelector('[data-pod-score]').textContent = num(r.score);
    });
    var ends = q('[data-w-ends]');
    var tick = function () { if (ends) ends.textContent = upcoming ? T.landing.startsIn + ' ' + duration(st.opensAt - (Date.now() + offset)) : T.landing.endsIn + ' ' + duration(st.endsAt - (Date.now() + offset)); };
    tick(); setInterval(tick, 1000);
    if (q('[data-w-players]')) q('[data-w-players]').textContent = fmt(T.landing.playersGames, { p: num(st.participants), g: num(st.games) });
  }

  // ---------- nickname suggestions (same spirit as the server's) ----------
  var ADJ = ['Swift', 'Brave', 'Clever', 'Rapid', 'Bright', 'Lucky', 'Mighty', 'Sunny', 'Cosmic', 'Turbo', 'Happy', 'Silent', 'Golden', 'Quick', 'Witty', 'Jolly', 'Super', 'Nimble', 'Epic', 'Stellar'];
  var ANIMALS = ['Otter', 'Falcon', 'Panda', 'Tiger', 'Koala', 'Dolphin', 'Fox', 'Owl', 'Lynx', 'Penguin', 'Gecko', 'Badger', 'Comet', 'Rocket', 'Hawk', 'Bison', 'Narwhal', 'Puffin', 'Lemur', 'Orca'];
  function rnd(n) { return crypto.getRandomValues(new Uint32Array(1))[0] % n; }
  function suggestNick() { return ADJ[rnd(ADJ.length)] + ANIMALS[rnd(ANIMALS.length)] + (10 + rnd(90)); }
  function fillCountries(select, value) {
    var html = '<option value="" disabled' + (value ? '' : ' selected') + '>—</option>';
    D.countries.forEach(function (c) {
      var f = c[0] === 'ZZ' ? '🌍' : String.fromCodePoint(0x1F1E6 + c[0].charCodeAt(0) - 65, 0x1F1E6 + c[0].charCodeAt(1) - 65);
      html += '<option value="' + c[0] + '"' + (c[0] === value ? ' selected' : '') + '>' + f + ' ' + esc(c[1]) + '</option>';
    });
    select.innerHTML = html;
  }

  // ---------- the game (official and practice share the same screen) ----------
  // source: { start() -> Promise<{questions, startsInMs, durationMs, limit}>, submit(events, seq) -> Promise<{questions}>,
  //           finish(events, seq) -> Promise<result> }
  function Game(root, source, onEnd) {
    var input = $('g-input'), qa = $('g-a'), qb = $('g-b'), fb = $('g-feedback'), countEl = $('g-count');
    var timeEl = $('g-time'), bar = $('g-bar'), scoreEl = $('g-score'), errEl = $('g-errors');
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    root.classList.toggle('touch', !!touch);
    if (touch) { input.setAttribute('inputmode', 'none'); input.readOnly = true; }
    var qs = {}, cursor = 0, attempts = 0, score = 0, errors = 0, mistakes = [];
    var pending = [], seq = 0, inflight = null, failed = null, running = false, ended = false;
    var t0 = 0, durationMs = 60000, limit = 0, lastSubmit = 0, raf = 0, fbTimer = 0;

    function addQuestions(list) { (list || []).forEach(function (q) { qs[q.i] = q; }); }
    function now() { return Math.round(performance.now() - t0); }
    function current() { return qs[cursor]; }
    function render() {
      var q = current();
      if (q) { qa.textContent = q.a; qb.textContent = q.b; root.classList.remove('waiting'); }
      else { qa.textContent = '…'; qb.textContent = '…'; root.classList.add('waiting'); }
      scoreEl.textContent = score; errEl.textContent = errors;
    }
    function feedback(msg, kind) {
      fb.textContent = msg; fb.className = 'g-feedback ' + (kind || '');
      clearTimeout(fbTimer);
      if (kind === 'ok') fbTimer = setTimeout(function () { fb.textContent = ''; fb.className = 'g-feedback'; }, 500);
    }
    function flush(final) {
      if (inflight || ended && !final) return inflight;
      if (!pending.length && !final) return null;
      var batch = pending.slice(), mySeq = seq + 1;
      var tries = 0;
      var send = function () {
        return (final ? source.finish(batch, mySeq) : source.submit(batch, mySeq)).then(function (res) {
          if (res && res.retry && tries++ < 5) {
            feedback(T.play.connection, 'warn');
            return new Promise(function (r) { setTimeout(r, 400 * tries); }).then(send);
          }
          return res;
        });
      };
      inflight = send().then(function (res) {
        inflight = null;
        if (!res || res.error) { failed = res || { error: 'network' }; return res; }
        seq = mySeq;
        pending = pending.slice(batch.length);
        addQuestions(res.questions);
        if (!final && running) {
          render();
          if (pending.length >= 4 || (pending.length && !qs[cursor + 3])) flush();
        }
        return res;
      });
      return inflight;
    }
    function submit(raw) {
      if (!running) return;
      var t = now();
      if (t - lastSubmit < 150 || raw === '') return; // ignore double taps
      var q = current();
      if (!q) return;
      lastSubmit = t;
      var v = parseInt(raw, 10);
      input.value = '';
      pending.push([q.i, v, t]);
      if (v === q.a * q.b) {
        if (attempts < 2) { score++; feedback(T.play.correct, 'ok'); } else feedback('', '');
        cursor++; attempts = 0;
        if (limit && cursor >= limit) { finish(); return; }
      } else {
        errors++; attempts++;
        mistakes.push([q.a, q.b, v]);
        if (attempts >= 2) feedback(fmt(T.play.reveal, { answer: q.a * q.b }), 'reveal');
        else feedback(T.play.wrong, 'bad');
        root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
      }
      render();
      if (pending.length >= 4 || !qs[cursor + 3]) flush();
    }
    function tick() {
      if (!running) return;
      var t = now();
      var left = limit ? 0 : Math.max(0, durationMs - t);
      if (limit) timeEl.textContent = (limit - cursor);
      else timeEl.textContent = Math.ceil(left / 1000);
      bar.style.transform = 'scaleX(' + (limit ? (limit - cursor) / limit : left / durationMs) + ')';
      root.classList.toggle('hurry', !limit && left < 10000);
      if (!limit && t >= durationMs) { finish(); return; }
      raf = requestAnimationFrame(tick);
    }
    function finish() {
      if (ended) return;
      ended = true; running = false;
      cancelAnimationFrame(raf);
      input.disabled = true;
      root.classList.add('over');
      document.removeEventListener('keydown', onKey);
      var elapsed = now();
      Promise.resolve(inflight).then(function () {
        if (failed && failed.error === 'rejected') return { result: { status: 'invalid', score: 0, errors: errors } };
        return flush(true);
      }).then(function (res) {
        var r = (res && res.result) || (res && !res.error ? res : null) || { status: 'invalid', score: score, errors: errors };
        onEnd(r, { score: score, errors: errors, mistakes: mistakes, elapsed: elapsed, answered: cursor });
      });
    }
    function onKey(e) {
      if (!running || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.activeElement === input && !touch) return; // the input handles itself
      if (/^[0-9]$/.test(e.key)) { if (input.value.length < 3) input.value += e.key; e.preventDefault(); }
      else if (e.key === 'Backspace') { input.value = input.value.slice(0, -1); e.preventDefault(); }
      else if (e.key === 'Enter') { submit(input.value); e.preventDefault(); }
    }
    $('g-form').onsubmit = function (e) { e.preventDefault(); submit(input.value.trim()); if (!touch) input.focus(); };
    input.oninput = function () { input.value = input.value.replace(/\D/g, '').slice(0, 3); };
    $('g-keypad').onclick = function (e) {
      var k = e.target.closest('[data-key]');
      if (!k || !running) return;
      var key = k.getAttribute('data-key');
      if (key === 'del') input.value = input.value.slice(0, -1);
      else if (key === 'ok') submit(input.value);
      else if (input.value.length < 3) input.value += key;
    };

    this.run = function () {
      show(root, true);
      root.classList.remove('over', 'hurry', 'waiting');
      input.disabled = true; input.value = ''; feedback('', '');
      qa.textContent = '…'; qb.textContent = '…';
      return source.start().then(function (st) {
        if (!st || st.error) return st || { error: 'network' };
        addQuestions(st.questions);
        durationMs = st.durationMs || 60000;
        limit = st.limit || 0;
        $('g-time-label').textContent = limit ? T.practice.questionsLeft : T.play.timeLeft;
        t0 = performance.now() + st.startsInMs;
        show(countEl, true);
        var head = document.getElementById('site-head');
        window.scrollTo(0, root.getBoundingClientRect().top + window.pageYOffset - (head ? head.offsetHeight : 64) - 8);
        var cd = function () {
          var left = Math.ceil((t0 - performance.now()) / 1000);
          if (left > 0) { countEl.textContent = left; setTimeout(cd, 100); return; }
          show(countEl, false);
          running = true;
          input.disabled = false;
          render();
          if (!touch) input.focus();
          document.addEventListener('keydown', onKey);
          if (limit) t0 = performance.now();
          tick();
        };
        cd();
        return st;
      });
    };
  }

  function officialSource() {
    var session = null;
    function wrap(r) {
      if (r.status === 0 || r.status >= 500) return { retry: true };
      if (r.status !== 200) return { error: r.data.error || 'error', status: r.status };
      return r.data;
    }
    return {
      start: function () {
        return api('POST', 'start', {}).then(function (r) {
          if (r.status !== 200) return { error: r.data.error || 'network' };
          session = r.data.session;
          return { questions: r.data.questions, startsInMs: r.data.startsInMs, durationMs: r.data.durationMs };
        });
      },
      submit: function (events, seq) { return api('POST', 'answer', { session: session, seq: seq, events: events }).then(wrap); },
      finish: function (events, seq) { return api('POST', 'finish', { session: session, seq: seq, events: events }).then(wrap); }
    };
  }

  function practiceSource(table, mode) {
    function deck() {
      var d = [];
      if (table === 'mixed') { for (var a = 2; a <= 12; a++) for (var b = 2; b <= 12; b++) d.push([a, b]); }
      else { for (var k = 1; k <= 12; k++) d.push(rnd(2) ? [+table, k] : [k, +table]); }
      for (var i = d.length - 1; i > 0; i--) { var j = rnd(i + 1); var x = d[i]; d[i] = d[j]; d[j] = x; }
      return d;
    }
    var list = [];
    while (list.length < 400) list = list.concat(deck());
    var qsAll = list.map(function (f, i) { return { i: i, a: f[0], b: f[1] }; });
    return {
      start: function () { return Promise.resolve({ questions: qsAll, startsInMs: 3000, durationMs: 60000, limit: mode === 'count' ? 20 : 0 }); },
      submit: function () { return Promise.resolve({}); },
      finish: function () { return Promise.resolve({ local: true }); }
    };
  }

  // ---------- share card ----------
  function shareScore(n) {
    var text = fmt(T.play.shareText, { n: n });
    var link = location.origin + D.links.landing;
    var canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    var c = canvas.getContext('2d');
    var g = c.createLinearGradient(0, 0, 1200, 630);
    g.addColorStop(0, '#0B1020'); g.addColorStop(.55, '#111B35'); g.addColorStop(1, '#1A1740');
    c.fillStyle = g; c.fillRect(0, 0, 1200, 630);
    var glow = c.createRadialGradient(960, 120, 10, 960, 120, 520);
    glow.addColorStop(0, 'rgba(245,184,61,.28)'); glow.addColorStop(1, 'rgba(245,184,61,0)');
    c.fillStyle = glow; c.fillRect(0, 0, 1200, 630);
    var font = '"Inter", system-ui, "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';
    c.fillStyle = '#F5B83D'; c.font = '700 30px ' + font; c.fillText(T.name.toUpperCase ? T.name.toUpperCase() : T.name, 80, 110);
    c.fillStyle = '#FFFFFF'; c.font = '800 220px ' + font; c.fillText(String(n), 80, 360);
    var w = c.measureText(String(n)).width;
    c.fillStyle = '#C7D2FE'; c.font = '700 54px ' + font; c.fillText(T.play.points.toLowerCase(), 100 + w, 360);
    c.fillStyle = '#E2E8F0'; c.font = '500 34px ' + font;
    wrapText(c, text, 80, 440, 1040, 46);
    c.fillStyle = '#A5B4FC'; c.font = '600 28px ' + font; c.fillText(location.host + D.links.landing.replace(/\/$/, ''), 80, 570);
    c.font = '150px ' + font; c.fillText('🏆', 960, 340);
    canvas.toBlob(function (blob) {
      var file = blob && window.File ? new File([blob], 'mathsheetlab-score-' + n + '.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text + ' ' + link }).catch(function () {});
        return;
      }
      if (navigator.share) { navigator.share({ text: text, url: link }).catch(function () {}); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'mathsheetlab-score-' + n + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + link).catch(function () {});
      var m = $('r-share-msg'); if (m) m.textContent = T.play.shareDone;
    }, 'image/png');
  }
  function wrapText(c, text, x, y, maxW, lh) {
    var words = /[぀-ヿ一-龯]/.test(text) ? text.split('') : text.split(' ');
    var sep = words.length === text.length ? '' : ' ';
    var line = '';
    words.forEach(function (w) {
      var test = line ? line + sep + w : w;
      if (c.measureText(test).width > maxW && line) { c.fillText(line, x, y); y += lh; line = w; } else line = test;
    });
    if (line) c.fillText(line, x, y);
  }

  // ---------- pages ----------
  function loadStatus() { return api('GET', 'status'); }
  // Before the first official month: the date it opens, in the page language (UTC).
  function opensText(st) {
    if (!st || !st.opensAt) return '';
    var date;
    try { date = new Intl.DateTimeFormat(LANG, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(st.opensAt)); }
    catch (e) { date = new Date(st.opensAt).toISOString().slice(0, 10); }
    return fmt(T.play.opensOn, { date: date });
  }
  function showOpens(text) {
    var el = $('soon'); if (!el) return;
    if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = text + ' ';
    else el.insertBefore(document.createTextNode(text + ' '), el.firstChild);
    show('loading', false); show('soon', true);
  }

  function landingPage() {
    loadStatus().then(function (r) {
      if (r.status !== 200) {
        $('top10').innerHTML = '<p class="muted">' + esc(r.data.error === 'not_configured' ? T.play.soon : T.board.offline) + '</p>';
        return;
      }
      if (r.data.opensAt) $('top10').innerHTML = '<p class="muted">' + esc(opensText(r.data)) + '</p>';
      var live = document.querySelector('[data-champ-live]');
      if (live) fillLive(live, r.data);
      if (!r.data.opensAt) api('GET', 'leaderboard').then(function (lb) {
        if (lb.status === 200) $('top10').innerHTML = boardTable(lb.data.rows.slice(0, 10));
      });
      var lc = r.data.lastChampion;
      if (lc) $('last-champion').innerHTML = '<div class="champ-card gold"><span class="cc-month">' + esc(fmt(T.board.champTitle, { month: monthLabel(lc.month) })) + '</span><span class="cc-name">' + flag(lc.country) + ' ' + (lc.nickname == null ? esc(T.board.former) : esc(lc.nickname)) + '</span><span class="cc-score">' + num(lc.score) + ' ' + esc(T.play.points.toLowerCase()) + '</span></div>';
    });
  }

  function playPage() {
    var me = null;
    var sections = ['signup', 'code', 'restore', 'ready', 'result'];
    function only(id) { sections.forEach(function (s) { show(s, s === id); }); show('loading', false); }
    function refreshReady() {
      return api('GET', 'me').then(function (r) {
        me = r.data;
        if (!me.signedIn) { openSignup(); return; }
        $('ready-h').innerHTML = esc(fmt(T.play.ready, { name: me.nickname })) + ' ' + flag(me.country);
        $('st-best').textContent = me.month.best ? num(me.month.best.score) : T.play.none;
        $('st-rank').textContent = me.month.best ? '#' + num(me.month.best.rank) : T.play.none;
        $('st-all').textContent = me.allTime ? num(me.allTime.score) : T.play.none;
        $('start').disabled = !!me.banned;
        $('ready-error').textContent = me.banned ? T.play.banned : '';
        only('ready');
      });
    }
    function openSignup() {
      fillCountries($('s-country'));
      if (!$('s-nick').value) $('s-nick').value = suggestNick();
      only('signup');
    }
    $('s-suggest').onclick = function () { $('s-nick').value = suggestNick(); };
    bindAccountForms(function (code) {
      if (code) { $('code-value').textContent = code; only('code'); }
      else refreshReady();
    }, only);
    $('code-done').onclick = refreshReady;
    $('start').onclick = function () {
      $('start').disabled = true;
      var game = new Game($('game'), officialSource(), function (res, local) { showOfficialResult(res, local, refreshReady); });
      show('ready', false);
      game.run().then(function (st) {
        $('start').disabled = false;
        if (st && st.error) {
          show('game', false); show('ready', true);
          $('ready-error').textContent = st.error === 'banned' ? T.play.banned : errMsg(st.error);
        }
      });
    };
    loadStatus().then(function (r) {
      if (r.data.error === 'not_configured') { show('loading', false); show('soon', true); return; }
      if (r.data.opensAt) { showOpens(opensText(r.data)); return; }
      refreshReady();
    });
  }

  function bindAccountForms(onDone, only) {
    var sForm = $('signup-form'), rForm = $('restore-form');
    Array.prototype.forEach.call(document.querySelectorAll('[data-show]'), function (b) {
      b.onclick = function () {
        var target = b.getAttribute('data-show');
        if (target === 'signup' && D.page === 'player') { only('nosign'); return; }
        if (target === 'signup') fillCountries($('s-country'), $('s-country').value);
        only(target);
        var f = $(target).querySelector('input'); if (f) f.focus();
      };
    });
    if (sForm) sForm.onsubmit = function (e) {
      e.preventDefault();
      var err = $('s-error');
      if (!$('s-country').value) { err.textContent = errMsg('bad_country'); return; }
      if (!$('s-agree').checked) { $('s-agree').focus(); err.textContent = '✓ ' + T.play.rulesLink + ' / ' + T.play.privacyLink; return; }
      err.textContent = '';
      api('POST', 'player', { nickname: $('s-nick').value.trim(), country: $('s-country').value }).then(function (r) {
        if (r.status === 201) onDone(r.data.recoveryCode);
        else if (r.data.error === 'already_signed_in') onDone();
        else err.textContent = errMsg(r.data.error);
      });
    };
    if (rForm) rForm.onsubmit = function (e) {
      e.preventDefault();
      api('POST', 'recover', { code: $('r-code').value }).then(function (r) {
        if (r.status === 200) onDone();
        else $('r-error').textContent = errMsg(r.data.error);
      });
    };
    var copy = $('code-copy');
    if (copy) copy.onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText($('code-value').textContent).then(function () { copy.textContent = T.play.copied; });
    };
  }

  function showOfficialResult(res, local, again) {
    show('game', false);
    var R = $('result');
    $('r-title').textContent = T.play.resultH;
    $('r-score').textContent = fmt(T.play.resultScore, { n: num(res.score || 0) });
    $('r-errors').textContent = res.errors === 1 ? T.play.resultError : fmt(T.play.resultErrors, { n: num(res.errors || 0) });
    var msg = '';
    if (res.status === 'valid') msg = res.monthBest ? T.play.newBest + ' ' + T.play.valid : '';
    else if (res.status === 'review') msg = T.play.review;
    else if (res.status === 'invalid') msg = T.play.invalid;
    $('r-msg').textContent = msg;
    $('r-msg').className = 'r-msg ' + (res.status || '');
    $('r-extra').innerHTML = '';
    $('r-actions').innerHTML = '<button type="button" class="btn btn-gold btn-lg" id="r-again">' + esc(T.play.again) + '</button>' +
      '<a class="btn btn-secondary btn-lg" href="' + D.links.leaderboard + '">' + esc(T.play.seeBoard) + '</a>' +
      (res.status === 'valid' && res.score > 0 ? '<button type="button" class="btn btn-secondary btn-lg" id="r-share">' + esc(T.play.share) + '</button><p class="small muted" id="r-share-msg" aria-live="polite"></p>' : '');
    show(R, true);
    R.classList.remove('pop'); void R.offsetWidth; R.classList.add('pop');
    R.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    $('r-again').onclick = function () { show(R, false); again(); };
    if ($('r-share')) $('r-share').onclick = function () { shareScore(res.score); };
    if (res.status === 'valid') api('GET', 'me').then(function (r) {
      var m = r.data && r.data.month && r.data.month.best;
      if (!m) return;
      var extra = fmt(T.play.rankNow, { rank: num(m.rank), month: monthLabel(r.data.month.key) });
      if (!res.monthBest) extra = fmt(T.play.notBest, { best: num(m.score) }) + ' ' + extra;
      $('r-extra').innerHTML = '<p class="r-rank">' + esc(extra) + '</p>';
    });
  }

  function practicePage() {
    var KEY = 'msl-practice-v1';
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }
    function label(table) { return table === 'mixed' ? T.practice.mixed : (+table === 1 ? T.practice.table1 : fmt(T.practice.table, { n: table })); }
    function renderProgress() {
      var p = load(), keys = Object.keys(p);
      if (!keys.length) { show('progress', false); return; }
      show('progress', true);
      keys.sort(function (a, b) { return (a.split(':')[0] === 'mixed' ? 0 : +a.split(':')[0]) - (b.split(':')[0] === 'mixed' ? 0 : +b.split(':')[0]); });
      var html = '<table class="board compact"><thead><tr><th scope="col">' + esc(T.practice.pick) + '</th><th scope="col">' + esc(T.practice.mode) + '</th><th class="num" scope="col">' + esc(T.practice.best) + '</th><th class="num" scope="col">' + esc(T.practice.last) + '</th><th class="num" scope="col">' + esc(T.practice.tries) + '</th></tr></thead><tbody>';
      keys.forEach(function (k) {
        var e = p[k], parts = k.split(':'), timed = parts[1] === 'time';
        var f = function (v) { return timed ? num(v) : (v / 1000).toFixed(1) + ' s'; };
        html += '<tr><td>' + esc(label(parts[0])) + '</td><td>' + esc(timed ? T.practice.mode60 : T.practice.mode20) + '</td><td class="num score">' + f(e.best) + '</td><td class="num">' + f(e.last) + '</td><td class="num">' + num(e.games) + '</td></tr>';
      });
      $('progress-table').innerHTML = html + '</tbody></table>';
    }
    renderProgress();
    $('practice-form').onsubmit = function (e) {
      e.preventDefault();
      var table = this.table.value, mode = this.mode.value;
      show('setup', false); show('result', false);
      var game = new Game($('game'), practiceSource(table, mode), function (res, local) {
        show('game', false);
        var key = table + ':' + mode, all = load(), timed = mode === 'time';
        var value = timed ? local.score : local.elapsed;
        var e2 = all[key] || { best: timed ? 0 : Infinity, games: 0 };
        all[key] = { best: timed ? Math.max(e2.best, value) : Math.min(e2.best, value), last: value, games: e2.games + 1 };
        save(all);
        $('r-title').textContent = T.practice.resultH;
        $('r-score').textContent = timed ? fmt(T.play.resultScore, { n: num(local.score) }) : (local.elapsed / 1000).toFixed(1) + ' s';
        $('r-errors').textContent = local.errors === 1 ? T.play.resultError : fmt(T.play.resultErrors, { n: num(local.errors) });
        $('r-msg').textContent = T.practice.correct + colon() + num(local.score);
        $('r-msg').className = 'r-msg';
        var seen = {}, list = local.mistakes.filter(function (m) { var k = m[0] + 'x' + m[1]; if (seen[k]) return false; seen[k] = 1; return true; });
        $('r-extra').innerHTML = '<h3>' + esc(T.practice.mistakes) + '</h3>' + (list.length ? '<ul class="mistakes">' + list.map(function (m) {
          return '<li><span>' + m[0] + ' × ' + m[1] + ' = <b>' + (m[0] * m[1]) + '</b></span><span class="was">' + esc(T.play.answerLabel) + colon() + '<s>' + m[2] + '</s></span></li>';
        }).join('') + '</ul>' : '<p class="ok-msg">' + esc(T.practice.noMistakes) + '</p>');
        $('r-actions').innerHTML = '<button type="button" class="btn btn-gold btn-lg" id="r-again">' + esc(T.practice.again) + '</button><a class="btn btn-secondary btn-lg" href="' + D.links.play + '">' + esc(T.practice.goOfficial) + '</a>';
        show('result', true);
        $('result').scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        $('r-again').onclick = function () { show('result', false); show('setup', true); };
        renderProgress();
      });
      game.run();
    };
  }

  function leaderboardPage() {
    var state = { tab: 'month', month: currentMonth(), country: '', page: 1 };
    var me = null;
    var tabs = document.querySelectorAll('[role="tab"]');
    var monthSel = $('f-month'), countrySel = $('f-country'), panel = $('tabpanel');
    monthSel.innerHTML = monthsSinceLaunch().map(function (m) { return '<option value="' + m + '">' + esc(monthLabel(m)) + '</option>'; }).join('');
    D.countries.forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; countrySel.appendChild(o); });
    var hash = location.hash.slice(1);
    if (/^(month|alltime|countries|champions)$/.test(hash)) state.tab = hash;
    function setTab(k) {
      state.tab = k; state.page = 1;
      Array.prototype.forEach.call(tabs, function (b) {
        var on = b.getAttribute('data-tab') === k;
        b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
        if (on) panel.setAttribute('aria-labelledby', b.id);
      });
      try { history.replaceState(null, '', '#' + k); } catch (e) { /* ignore */ }
      load();
    }
    Array.prototype.forEach.call(tabs, function (b, i) {
      b.onclick = function () { setTab(b.getAttribute('data-tab')); };
      b.onkeydown = function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click();
      };
    });
    monthSel.onchange = function () { state.month = monthSel.value; state.page = 1; load(); };
    countrySel.onchange = function () { state.country = countrySel.value; state.page = 1; load(); };
    $('pg-prev').onclick = function () { state.page--; load(); };
    $('pg-next').onclick = function () { state.page++; load(); };
    panel.addEventListener('click', function (e) {
      var rep = e.target.closest('[data-report]');
      if (rep) {
        var name = rep.getAttribute('data-report');
        if (!window.confirm(fmt(T.board.reportAsk, { name: name }))) return;
        api('POST', 'report', { nickname: name, month: state.tab === 'month' ? state.month : undefined }).then(function (r) {
          rep.replaceWith(document.createTextNode(r.status === 200 ? T.board.reported : errMsg(r.data.error)));
        });
      }
      var cbtn = e.target.closest('[data-country]');
      if (cbtn) { state.country = cbtn.getAttribute('data-country'); countrySel.value = state.country; setTab('month'); }
    });
    function meBar() {
      var bar = $('me-bar');
      if (!me || !me.signedIn || state.tab !== 'month' || state.month !== currentMonth()) { show(bar, false); return; }
      var b = me.month.best;
      bar.innerHTML = '<span>' + flag(me.country) + ' <b>' + esc(me.nickname) + '</b></span>' + (b ? '<span>' + esc(T.board.yourRank) + colon() + '<b>#' + num(b.rank) + '</b> · ' + num(b.score) + '</span>' : '<span>' + esc(T.board.notRanked) + '</span> <a class="btn btn-gold btn-sm" href="' + D.links.play + '">' + esc(T.board.playNow) + '</a>');
      show(bar, true);
    }
    function load() {
      show('f-month-wrap', state.tab === 'month' || state.tab === 'countries');
      show('f-country-wrap', state.tab === 'month' || state.tab === 'alltime');
      show('team-note', state.tab === 'countries');
      meBar();
      panel.setAttribute('aria-busy', 'true');
      var path;
      if (state.tab === 'countries') path = 'countries?board=month&month=' + state.month;
      else if (state.tab === 'champions') path = 'champions';
      else path = 'leaderboard?board=' + state.tab + (state.tab === 'month' ? '&month=' + state.month : '') + (state.country ? '&country=' + state.country : '') + '&page=' + state.page;
      api('GET', path).then(function (r) {
        panel.removeAttribute('aria-busy');
        if (r.status !== 200) { panel.innerHTML = '<p class="muted">' + esc(r.data.error === 'not_configured' ? T.play.soon : T.board.offline) + '</p>'; show('pager', false); return; }
        var d = r.data;
        if (state.tab === 'countries') {
          panel.innerHTML = !d.rows.length ? '<p class="empty">' + esc(T.board.empty) + '</p>' : '<table class="board"><thead><tr><th scope="col">' + esc(T.board.rank) + '</th><th scope="col">' + esc(T.board.country) + '</th><th class="num" scope="col">' + esc(T.board.team) + '</th><th class="num" scope="col">' + esc(T.board.best) + '</th><th class="num hide-xs" scope="col">' + esc(T.board.playersCol) + '</th></tr></thead><tbody>' +
            d.rows.map(function (c) { return '<tr class="' + (c.rank <= 3 ? 'top top' + c.rank : '') + '"><td>' + medalFor(c.rank) + '</td><td class="who"><button type="button" class="linklike country-btn" data-country="' + c.country + '">' + flag(c.country) + esc(countryLabel(c.country)) + '</button></td><td class="num score">' + num(c.team) + '</td><td class="num">' + num(c.best) + '</td><td class="num hide-xs">' + num(c.players) + '</td></tr>'; }).join('') + '</tbody></table>';
          show('pager', false);
          return;
        }
        if (state.tab === 'champions') {
          panel.innerHTML = !d.rows.length ? '<p class="empty">' + esc(fmt(T.hall.empty, { month: monthLabel(currentMonth()) })) + '</p>' : '<table class="board"><thead><tr><th scope="col">' + esc(T.board.month) + '</th><th scope="col">' + esc(T.board.rank) + '</th><th scope="col">' + esc(T.board.player) + '</th><th class="num" scope="col">' + esc(T.board.score) + '</th></tr></thead><tbody>' +
            d.rows.map(function (c) { return '<tr class="top top' + c.rank + '"><td>' + esc(monthLabel(c.month)) + '</td><td>' + medalFor(c.rank) + '</td><td class="who">' + playerCell(c) + '</td><td class="num score">' + num(c.score) + '</td></tr>'; }).join('') + '</tbody></table>';
          show('pager', false);
          return;
        }
        panel.innerHTML = boardTable(d.rows, { me: me && me.signedIn ? me.nickname : null, report: true });
        show('pager', d.pages > 1);
        $('pg-info').textContent = fmt(T.board.page, { page: d.page, pages: d.pages });
        $('pg-prev').disabled = d.page <= 1; $('pg-next').disabled = d.page >= d.pages;
      });
    }
    api('GET', 'me').then(function (r) { me = r.data; meBar(); });
    setTab(state.tab);
  }

  function hallPage() {
    api('GET', 'champions').then(function (r) {
      var box = $('reigning');
      if (r.status !== 200) { box.innerHTML = '<p class="muted">' + esc(r.data.error === 'not_configured' ? T.play.soon : T.board.offline) + '</p>'; return; }
      var rows = r.data.rows;
      if (!rows.length) { box.innerHTML = '<div class="hall-empty">🏆<p>' + esc(fmt(T.hall.empty, { month: monthLabel(currentMonth()) })) + '</p><a class="btn btn-gold" href="' + D.links.play + '">' + esc(T.board.playNow) + '</a></div>'; return; }
      var top = rows[0];
      var name = function (c) { return c.nickname == null ? esc(T.board.former) : esc(c.nickname); };
      var titles = function (c) { return c.titles ? (c.titles === 1 ? T.hall.titleWon : fmt(T.hall.titlesWon, { n: c.titles })) : ''; };
      box.innerHTML = '<div class="reigning-card"><span class="rc-crown" aria-hidden="true">🏆</span><p class="kicker kicker-gold">' + esc(T.hall.latest) + ' · ' + esc(monthLabel(top.month)) + '</p><p class="rc-name">' + flag(top.country) + ' ' + name(top) + '</p><p class="rc-meta">' + esc(countryLabel(top.country)) + ' · ' + num(top.score) + ' ' + esc(T.play.points.toLowerCase()) + (titles(top) ? ' · ' + esc(titles(top)) : '') + '</p></div>';
      var months = {};
      rows.forEach(function (c) { (months[c.month] = months[c.month] || []).push(c); });
      $('gallery').innerHTML = Object.keys(months).sort().reverse().map(function (m) {
        return '<article class="month-card"><h3>' + esc(fmt(T.common.monthChampionship, { month: monthLabel(m) })) + '</h3><ol>' + months[m].map(function (c) {
          return '<li class="m' + c.rank + '"><span class="medal m' + c.rank + '" title="' + esc(T.common.medals[c.rank - 1]) + '">' + c.rank + '</span><span class="mc-name">' + flag(c.country) + ' ' + name(c) + (c.rank === 1 && c.titles > 1 ? ' <span class="titles">🏆×' + c.titles + '</span>' : '') + '</span><span class="mc-score">' + num(c.score) + '</span></li>';
        }).join('') + '</ol></article>';
      }).join('');
    });
    api('GET', 'leaderboard?board=alltime').then(function (r) {
      if (r.status === 200) $('records').innerHTML = boardTable(r.data.rows.slice(0, 10));
    });
  }

  function playerPage() {
    var ids = ['nosign', 'signup', 'code', 'restore', 'profile'];
    function only(id) { ids.forEach(function (s) { show(s, s === id); }); show('loading', false); }
    function statusLabel(s) { return { valid: T.player.statusValid, review: T.player.statusReview, invalid: T.player.statusInvalid, empty: T.player.statusEmpty }[s] || s; }
    function load() {
      api('GET', 'me').then(function (r) {
        if (r.data.error === 'not_configured') { show('loading', false); show('soon', true); return; }
        var me = r.data;
        if (!me.signedIn) { only('nosign'); return; }
        $('pf-name').innerHTML = flag(me.country) + ' <b>' + esc(me.nickname) + '</b> <span class="muted">' + esc(countryLabel(me.country)) + '</span>';
        $('pf-month').textContent = me.month.best ? num(me.month.best.score) : '—';
        $('pf-rank').textContent = me.month.best ? '#' + num(me.month.best.rank) : '—';
        $('pf-all').textContent = me.allTime ? num(me.allTime.score) : '—';
        $('pf-titles').textContent = num(me.titles || 0);
        $('pf-medals').innerHTML = me.medals.length ? '<ul class="medal-list">' + me.medals.map(function (m) { return '<li><span class="medal m' + m.rank + '">' + m.rank + '</span>' + esc(fmt(T.common.monthChampionship, { month: monthLabel(m.month) })) + ' · ' + num(m.score) + '</li>'; }).join('') + '</ul>' : '<p class="muted">' + esc(T.player.noMedals) + '</p>';
        $('pf-recent').innerHTML = me.recent.length ? '<ul class="recent">' + me.recent.map(function (g) { return '<li><span>' + esc(new Intl.DateTimeFormat(LANG, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(g.at))) + '</span><b>' + num(g.score) + '</b><span class="st st-' + g.status + '">' + esc(statusLabel(g.status)) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">—</p>';
        $('e-nick').value = me.nickname;
        fillCountries($('e-country'), me.country);
        only('profile');
      });
    }
    bindAccountForms(function (code) { if (code) { $('code-value').textContent = code; only('code'); } else load(); }, only);
    $('code-done').onclick = load;
    $('edit-form').onsubmit = function (e) {
      e.preventDefault();
      api('PATCH', 'player', { nickname: $('e-nick').value.trim(), country: $('e-country').value }).then(function (r) {
        $('e-error').textContent = r.status === 200 ? T.player.saved : errMsg(r.data.error);
        $('e-error').className = 'form-error' + (r.status === 200 ? ' ok' : '');
        if (r.status === 200) load();
      });
    };
    $('new-code').onclick = function () {
      api('POST', 'recovery-code', {}).then(function (r) { if (r.status === 200) { $('code-value').textContent = r.data.recoveryCode; only('code'); } });
    };
    $('sign-out').onclick = function () { api('POST', 'logout', {}).then(function () { only('nosign'); }); };
    $('delete').onclick = function () {
      if (!window.confirm(T.player.deleteAsk)) return;
      api('DELETE', 'player', {}).then(function (r) {
        if (r.status === 200) { only('nosign'); window.alert(T.player.deleted); }
      });
    };
    load();
  }

  function adminPage() {
    var KEY = 'msl-admin-token';
    var token = '';
    try { token = sessionStorage.getItem(KEY) || ''; } catch (e) { /* ignore */ }
    function A(method, path, body) { return api(method, 'admin/' + path, body, { Authorization: 'Bearer ' + token }); }
    function dt(ms) { return ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : ''; }
    function table(rows, cols) {
      if (!rows || !rows.length) return '<p class="muted">Nothing here.</p>';
      return '<div class="table-scroll"><table class="board compact"><thead><tr>' + cols.map(function (c) { return '<th scope="col">' + esc(c[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + c[1](r) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    var nick = function (r) { return r.nickname == null ? '<i>deleted</i>' : esc(r.nickname) + (r.status === 'banned' || r.player_status === 'banned' ? ' <b>(banned)</b>' : ''); };
    function load() {
      A('GET', 'overview').then(function (r) {
        if (r.status !== 200) { show('admin-app', false); show('admin-login', true); $('admin-error').textContent = r.data.error || 'error'; return; }
        show('admin-login', false); show('admin-app', true);
        var d = r.data;
        $('a-stats').innerHTML = [['Active players', d.activePlayers], ['Banned', d.bannedPlayers], ['Players this month', d.monthPlayers], ['Games this month', d.monthGames], ['Games in total', d.totalGames], ['Scores to review', d.pendingReview], ['Open reports', d.openReports], ['Errors (24 h)', d.errors24h]]
          .map(function (x) { return '<div class="a-stat"><b>' + num(x[1] || 0) + '</b><span>' + esc(x[0]) + '</span></div>'; }).join('');
        $('a-top').innerHTML = table(d.top, [['Player', nick], ['Country', function (r) { return flag(r.country) + r.country; }], ['Score', function (r) { return r.score; }], ['Errors', function (r) { return r.errors; }], ['When', function (r) { return dt(r.achieved_at); }]]);
        $('a-countries').innerHTML = table(d.byCountry, [['Country', function (r) { return flag(r.country) + esc(countryLabel(r.country)); }], ['Players', function (r) { return r.players; }], ['Best', function (r) { return r.best; }]]);
        $('a-months').innerHTML = table(d.months, [['Month', function (r) { return r.month; }], ['Status', function (r) { return r.status; }], ['Players', function (r) { return r.participants; }], ['Games', function (r) { return r.games; }],
          ['Podium', function (r) { return d.champions.filter(function (c) { return c.month === r.month; }).map(function (c) { return c.rank + '. ' + nick(c) + ' (' + c.score + ')'; }).join('<br>'); }],
          ['', function (r) { return r.status === 'closed' ? '<button class="btn btn-secondary btn-sm" data-recompute="' + r.month + '">Recompute podium</button>' : ''; }]]);
      });
      A('GET', 'review').then(function (r) {
        if (r.status !== 200) return;
        $('a-review').innerHTML = table(r.data.scores, [['Player', nick], ['Month', function (s) { return s.month; }], ['Score', function (s) { return s.score; }], ['Errors', function (s) { return s.errors; }], ['Avg / min gap', function (s) { return s.avg_gap + ' / ' + s.min_gap + ' ms'; }], ['Flags', function (s) { return esc(s.flags); }], ['When', function (s) { return dt(s.achieved_at); }],
          ['', function (s) { return '<button class="btn btn-secondary btn-sm" data-score="' + s.id + '" data-action="approve">Approve</button> <button class="btn btn-danger btn-sm" data-score="' + s.id + '" data-action="invalidate">Invalidate</button>'; }]]);
        $('a-events').innerHTML = table(r.data.events, [['Type', function (e) { return esc(e.type); }], ['Player', nick], ['Detail', function (e) { return esc(e.detail) + (e.ref ? ' <small>' + esc(e.ref) + '</small>' : ''); }], ['When', function (e) { return dt(e.created_at); }], ['', function (e) { return '<button class="btn btn-secondary btn-sm" data-event="' + e.id + '">Resolve</button>'; }]]);
      });
      A('GET', 'errors').then(function (r) { if (r.status === 200) $('a-errors').innerHTML = table(r.data.rows, [['When', function (e) { return dt(e.created_at); }], ['Where', function (e) { return esc(e.ref); }], ['Detail', function (e) { return '<code>' + esc(e.detail) + '</code>'; }]]); });
      A('GET', 'actions').then(function (r) { if (r.status === 200) $('a-actions').innerHTML = table(r.data.rows, [['When', function (e) { return dt(e.created_at); }], ['Action', function (e) { return esc(e.detail); }]]); });
    }
    function lookup(n) {
      A('GET', 'player?nickname=' + encodeURIComponent(n)).then(function (r) {
        if (r.status !== 200) { $('a-player').innerHTML = '<p class="form-error">' + esc(r.data.error) + '</p>'; return; }
        var p = r.data;
        $('a-player').innerHTML = '<p><b>' + esc(p.nickname) + '</b> ' + flag(p.country) + ' · status ' + esc(p.status) + ' · titles ' + p.titles + ' · created ' + dt(p.createdAt) + ' · last seen ' + dt(p.lastSeenAt) + '</p>' +
          '<p class="row-actions">' + (p.status === 'banned' ? '<button class="btn btn-secondary btn-sm" data-player="unban">Unban</button>' : '<button class="btn btn-danger btn-sm" data-player="ban">Ban</button>') + ' <button class="btn btn-secondary btn-sm" data-player="reset_nickname">Reset nickname</button></p>' +
          table(p.scores, [['Month', function (s) { return s.month; }], ['Score', function (s) { return s.score; }], ['Errors', function (s) { return s.errors; }], ['Avg / min gap', function (s) { return s.avg_gap + ' / ' + s.min_gap + ' ms'; }], ['Status', function (s) { return esc(s.status) + ' ' + esc(s.flags); }], ['When', function (s) { return dt(s.achieved_at); }],
            ['', function (s) { return s.status !== 'invalid' ? '<button class="btn btn-danger btn-sm" data-score="' + s.id + '" data-action="invalidate">Invalidate</button>' : '<button class="btn btn-secondary btn-sm" data-score="' + s.id + '" data-action="approve">Restore</button>'; }]]);
        $('a-player').setAttribute('data-nick', p.nickname);
      });
    }
    $('admin-form').onsubmit = function (e) {
      e.preventDefault();
      token = $('admin-token').value.trim();
      try { sessionStorage.setItem(KEY, token); } catch (e2) { /* ignore */ }
      load();
    };
    $('a-player-form').onsubmit = function (e) { e.preventDefault(); lookup($('a-nick').value.trim()); };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var done = function (r) { if (r.status !== 200) window.alert(r.data.error || 'error'); load(); var n = $('a-player').getAttribute('data-nick'); if (n && b.hasAttribute('data-player')) lookup(n); };
      if (b.hasAttribute('data-score')) {
        if (!window.confirm(b.getAttribute('data-action') + ' this score?')) return;
        A('POST', 'score', { id: b.getAttribute('data-score'), action: b.getAttribute('data-action') }).then(done);
      } else if (b.hasAttribute('data-event')) A('POST', 'event', { id: +b.getAttribute('data-event') }).then(done);
      else if (b.hasAttribute('data-player')) {
        if (!window.confirm(b.getAttribute('data-player') + '?')) return;
        A('POST', 'player', { nickname: $('a-player').getAttribute('data-nick'), action: b.getAttribute('data-player') }).then(done);
      } else if (b.hasAttribute('data-recompute')) A('POST', 'recompute', { month: b.getAttribute('data-recompute') }).then(done);
    });
    if (token) load();
  }

  var pages = { landing: landingPage, play: playPage, practice: practicePage, leaderboard: leaderboardPage, hall: hallPage, player: playerPage, admin: adminPage };
  if (pages[D.page]) pages[D.page]();
})();
