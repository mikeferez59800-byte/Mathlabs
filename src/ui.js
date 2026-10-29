/* MathSheetLab interface polish: header state, mobile menu, scroll reveals, preview feedback.
 * Purely presentational: the generator logic lives in app.js and is not touched here. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header: more opaque once the page has scrolled.
  var head = document.getElementById('site-head');
  if (head) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { head.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu
    var toggle = head.querySelector('.nav-toggle');
    var setOpen = function (open) {
      head.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    if (toggle) {
      toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
      head.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.nav a')) setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && head.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
      });
      document.addEventListener('click', function (e) { if (!head.contains(e.target)) setOpen(false); });
      window.addEventListener('resize', function () { if (window.innerWidth > 1399) setOpen(false); });
    }
  }

  // Scroll reveal: only elements that start below the fold are hidden, so nothing visible ever flashes,
  // and everything stays visible if this script does not run.
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (items.length && !reduceMotion && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.classList.remove('pre');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh) { el.classList.add('pre'); io.observe(el); }
    });
  }

  // Generator page: soft fade when the sheet is regenerated, and a short-lived confirmation toast on phones.
  var out = document.getElementById('ws-output');
  if (out && 'MutationObserver' in window) {
    new MutationObserver(function () {
      out.classList.remove('is-updating');
      void out.offsetWidth; // restart the animation
      out.classList.add('is-updating');
    }).observe(out, { childList: true });
  }
  var status = document.getElementById('ws-status');
  if (status && 'MutationObserver' in window) {
    var hideTimer;
    new MutationObserver(function () {
      clearTimeout(hideTimer);
      status.classList.toggle('is-visible', !!status.textContent);
      if (status.textContent) hideTimer = setTimeout(function () { status.classList.remove('is-visible'); }, 3500);
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }
})();
