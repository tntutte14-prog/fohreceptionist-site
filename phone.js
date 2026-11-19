// phone.js: the demo phone on the homepage.
// Recents list with restaurant types (a new one slides in every few seconds), and a call screen.
// For now "Call" dials the real demo line. Later the call will happen inside the website instead.
(function () {
  'use strict';
  var DEMO_E164 = '+17786525367';
  var DEMO_SHOWN = '+1 778 652 5367';
  var DEMO_NAME = 'Maple and Ember Bistro';

  var KINDS = ['Pizza restaurant', 'Italian restaurant', 'Chinese restaurant', 'Sushi restaurant', 'Indian restaurant', 'Mexican restaurant', 'Thai restaurant', 'Steakhouse', 'Cafe', 'Burger restaurant', 'Seafood restaurant', 'Bakery'];
  var REASONS = ['Reservation', 'Hours', 'Menu question', 'General question', 'Reservation', 'Sent to staff'];
  var ROWS = 6;

  var list = document.getElementById('calls');
  if (!list) return;
  var recents = document.getElementById('viewRecents');
  var calling = document.getElementById('viewCall');
  var who = document.getElementById('callWho');
  var num = document.getElementById('callNum');
  var hint = document.getElementById('callHint');
  var go = document.getElementById('callGo');
  var back = document.getElementById('callBack');
  var clock = document.querySelector('.status .clock');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(pointer: coarse)').matches;

  function timeText(d) {
    var h = d.getHours(); var m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function initials(s) { return s.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }

  // Starting list: the newest at the top, a few minutes apart.
  var k = 0; var r = 0; var items = [];
  var now = Date.now();
  for (var i = 0; i < ROWS; i++) {
    items.push({ name: KINDS[k++ % KINDS.length], reason: REASONS[r++ % REASONS.length], at: new Date(now - (i * 11 + 3) * 60000) });
  }

  function row(it, fresh) {
    var li = document.createElement('li');
    if (fresh) li.className = 'new';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'call-row';
    b.setAttribute('aria-label', it.name + ', ' + it.reason + ', ' + timeText(it.at) + '. Call the demo');
    b.innerHTML = '<span class="av" aria-hidden="true"></span><span><span class="nm"></span><span class="sub"></span></span><span class="tm"></span><span class="info" aria-hidden="true">i</span>';
    b.querySelector('.av').textContent = initials(it.name);
    b.querySelector('.nm').textContent = it.name;
    b.querySelector('.sub').textContent = it.reason;
    b.querySelector('.tm').textContent = timeText(it.at);
    b.addEventListener('click', function () { openCall(it.name); });
    li.appendChild(b);
    return li;
  }
  function draw(fresh) {
    list.textContent = '';
    items.forEach(function (it, n) { list.appendChild(row(it, fresh && n === 0)); });
  }
  draw(false);

  function tick() {
    if (document.hidden || !calling.hidden) return;
    items.unshift({ name: KINDS[k++ % KINDS.length], reason: REASONS[r++ % REASONS.length], at: new Date() });
    items.length = ROWS;
    draw(true);
  }
  if (!still) setInterval(tick, 3600);

  function setClock() { if (clock) { var d = new Date(); clock.textContent = (d.getHours() % 12 || 12) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); } }
  setClock(); setInterval(setClock, 15000);

  // The call screen.
  go.href = 'tel:' + DEMO_E164;
  num.textContent = DEMO_SHOWN;
  hint.textContent = touch ? 'Tap Call to ring the demo line.' : 'Call this number from your phone.';
  var opener = null;
  function openCall(name) {
    opener = document.activeElement;
    who.textContent = name || DEMO_NAME;
    calling.querySelector('.line').textContent = name && name !== DEMO_NAME ? 'Answers as ' + DEMO_NAME : 'FOH AI receptionist';
    recents.hidden = true; calling.hidden = false;
    go.focus({ preventScroll: true });
  }
  function closeCall() {
    calling.hidden = true; recents.hidden = false;
    if (opener && document.body.contains(opener)) opener.focus({ preventScroll: true });
  }
  back.addEventListener('click', closeCall);
  calling.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCall(); });

  // "Call the demo" links (in the phone and on the page): on a phone they dial straight away (a real phone link);
  // on a computer they show the number to call on the demo phone instead.
  document.querySelectorAll('[data-demo-call]').forEach(function (a) {
    a.setAttribute('href', 'tel:' + DEMO_E164);
    a.addEventListener('click', function (e) {
      if (touch) return;
      e.preventDefault(); openCall(DEMO_NAME);
      var p = document.querySelector('.phone'); var rect = p.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) p.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    });
  });
  document.querySelectorAll('[data-open-call]').forEach(function (b) {
    if (calling.contains(b) || recents.contains(b)) { b.addEventListener('click', function () { openCall(b.getAttribute('data-open-call')); }); return; }
    b.addEventListener('click', function () {
      openCall(b.getAttribute('data-open-call'));
      var p = document.querySelector('.phone');
      var rect = p.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) p.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    });
  });
})();
