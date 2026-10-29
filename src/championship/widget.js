/* Home page and Multiplication page: live podium of the current Multiplication World Championship.
 * Shows real players only; if nobody has played yet (or the API is not set up), the empty podium stays. */
(function () {
  'use strict';
  var root = document.querySelector('[data-champ-widget]');
  if (!root || !window.fetch) return;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var flag = function (code) {
    if (!code || code === 'ZZ') return '🌍';
    return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65);
  };
  fetch('/api/championship/status', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (st) {
    if (!st || !st.month) return;
    var upcoming = !!st.opensAt; // before the first official month
    var p = (upcoming ? st.firstMonth : st.month).split('-');
    var month = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, 15)));
    var m = root.querySelector('[data-w-month]');
    if (m) m.textContent = month + ' Championship';
    Array.prototype.forEach.call(root.querySelectorAll('.pod'), function (li) {
      var row = st.podium[+li.getAttribute('data-rank') - 1];
      if (!row) return;
      li.classList.add('filled');
      li.querySelector('[data-pod-name]').innerHTML = '<span class="flag" aria-hidden="true">' + flag(row.country) + '</span>' + (row.nickname == null ? 'Former player' : esc(row.nickname));
      li.querySelector('[data-pod-score]').textContent = row.score + ' pts';
    });
    var offset = st.serverNow - Date.now();
    var ends = root.querySelector('[data-w-ends]');
    var tick = function () {
      var ms = Math.max(0, (upcoming ? st.opensAt : st.endsAt) - (Date.now() + offset));
      var d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, mi = Math.floor(ms / 60000) % 60;
      if (ends) ends.textContent = (upcoming ? 'Starts in ' : 'Ends in ') + (d ? d + ' d ' + h + ' h' : h + ' h ' + mi + ' min');
    };
    tick(); setInterval(tick, 30000);
    var pl = root.querySelector('[data-w-players]');
    if (pl && st.participants) pl.textContent = st.participants + (st.participants === 1 ? ' player' : ' players') + ' this month';
  }).catch(function () { /* the static podium stays */ });
})();
