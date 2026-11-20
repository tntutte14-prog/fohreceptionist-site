/* flow.js: scroll animation for the homepage. Things rise in as they reach the screen, the phones drift with the scroll,
   and the page background glow moves slowly so every section feels like part of one long page.
   If JavaScript or motion is off, everything simply shows. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (reduce || !('IntersectionObserver' in window)) { root.classList.remove('js'); return; }

  var groups = [
    '.hero-c > *', '.cost h2', '.cost .soft', '.cost .mono-label', '.ticket', '.outcomes li',
    '.cf-head > *', '.cf-head div > *', '.livecall', '.cf-link', '.slip',
    '.feat-head > *', '.icard', '.feat-cols > div',
    '.how-head > *', '.steps li',
    '.voice-grid > div:first-child > *', '.picker',
    '.login-copy > *', '.browser',
    '.support-grid > div:first-child > *', '.sup-tiles li',
    '.end2 .in > *'
  ];
  var seen = new Set();
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      if (seen.has(el)) return;
      seen.add(el);
      el.setAttribute('data-r', '');
      el.style.setProperty('--d', Math.min(i, 6) * 90 + 'ms');
    });
  });
  document.querySelectorAll('.lc-lines > div').forEach(function (el, i) { el.style.setProperty('--d', (350 + i * 650) + 'ms'); });
  document.querySelectorAll('.lc-wave i').forEach(function (el, i) { el.style.setProperty('--i', i); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in-view'); io.unobserve(e.target); } /* also reveal anything scrolled past in a jump */
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-r], .livecall, .slip, .steps, .tickets, .showcase').forEach(function (el) { io.observe(el); });

  // slow parallax: phones drift, glow follows the page
  var ticking = false;
  function frame() {
    var y = window.scrollY, max = Math.max(1, document.body.scrollHeight - innerHeight);
    root.style.setProperty('--p', (y / max).toFixed(4));
    root.style.setProperty('--sy', Math.min(y, 900));
    // anything already above the bottom of the screen is shown, even if a fast scroll or a menu jump skipped it
    document.querySelectorAll('[data-r]:not(.in-view), .showcase:not(.in-view), .livecall:not(.in-view), .slip:not(.in-view), .steps:not(.in-view)').forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('in-view');
    });
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();
})();
