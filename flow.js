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

/* ---- v7 extras: word reveals, scroll story, voices, progress bar, cursor glow ---- */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // voices: choose one (works with or without motion)
  document.querySelectorAll('.orb button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.orb button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });
  // story: without motion, show every step lit
  var steps = document.querySelectorAll('.story-steps li');
  var sp = document.querySelector('.sp');
  if (reduce || !('IntersectionObserver' in window)) { document.body.classList.add('no-js-steps'); steps.forEach(function (li) { li.classList.add('on'); }); return; }
  var sio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      steps.forEach(function (li) { li.classList.toggle('on', li === e.target); });
      if (sp) sp.setAttribute('data-step', e.target.getAttribute('data-s'));
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function (li) { sio.observe(li); });
  // headlines: words slide up
  document.querySelectorAll('.hero-c h1, .story-head h2, .voices-head h2, .feat-head h2, .end2 h2').forEach(function (h, n) {
    var txt = h.textContent.trim().split(/\s+/); h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = txt.map(function (w, i) { return '<span class="w" aria-hidden="true" style="--wi:' + i + '"><span>' + w + '</span></span>'; }).join(' ');
    if (h.closest('.hero-c')) { setTimeout(function () { h.classList.add('words-in'); }, 150); return; }
    var wio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { h.classList.add('words-in'); wio.disconnect(); } }); }, { threshold: .4 });
    wio.observe(h);
  });
  // progress bar + cursor glow
  var bar = document.createElement('div'); bar.id = 'progress'; document.body.appendChild(bar);
  var hero = document.querySelector('.hero2');
  if (hero) {
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px'); hero.style.setProperty('--mo', 1); });
    hero.addEventListener('pointerleave', function () { hero.style.setProperty('--mo', 0); });
  }
})();
(function(){var b=document.body;function s(){b.classList.toggle('scrolled',window.scrollY>24)}s();addEventListener('scroll',s,{passive:true});})();
