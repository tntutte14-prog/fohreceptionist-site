// site.js: the menu button in the header on phones.
(function () {
  'use strict';
  var btn = document.getElementById('menuBtn'); var nav = document.getElementById('siteNav');
  if (!btn || !nav) return;
  function set(open) { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
})();
