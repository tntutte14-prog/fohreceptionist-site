// tune.js: the style tester. Open any page with ?tune at the end of the address (for example fohreceptionist.com/?tune)
// to get a small panel for trying text strength, colours, fonts and light/dark. Your choices stay while you click around
// the site in this browser, and "Copy settings" copies them so they can be sent over and made permanent.
// Visitors never see the panel. Saved choices only apply in the browser that made them.
(function () {
  'use strict';
  var KEY = 'foh_tune';
  var HEAD_FONTS = { 'Instrument Serif': '', 'Newsreader': 'Newsreader:opsz,wght@6..72,400;6..72,500', 'Fraunces': 'Fraunces:opsz,wght@9..144,400;9..144,500', 'Playfair Display': 'Playfair+Display:wght@400;500', 'DM Serif Display': 'DM+Serif+Display', 'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@500;600;700', 'Inter': '' };
  var BODY_FONTS = { 'Inter': 'Inter:wght@400;500;600;700', 'Manrope': 'Manrope:wght@400;500;600;700', 'DM Sans': 'DM+Sans:wght@400;500;600;700', 'Work Sans': 'Work+Sans:wght@400;500;600;700', 'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700' };
  var DEFAULTS = { theme: 'light', strong: 86, soft: 57, head: 'Instrument Serif', body: 'Inter', bg: '', accent: '' };

  function load() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: still applied on this page */ } }
  var loaded = {};
  function font(name, table) {
    if (!table[name] || loaded[name]) return; // '' = already on the page
    loaded[name] = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + table[name] + '&display=swap';
    document.head.appendChild(l);
  }
  function apply(s) {
    var r = document.documentElement.style;
    if (s.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    r.setProperty('--o-strong', String(s.strong / 100));
    r.setProperty('--o-soft', String(s.soft / 100));
    if (s.head !== DEFAULTS.head) { font(s.head, HEAD_FONTS); r.setProperty('--f-head', '"' + s.head + '", Georgia, serif'); } else r.removeProperty('--f-head');
    if (s.body !== DEFAULTS.body) { font(s.body, BODY_FONTS); r.setProperty('--f-body', '"' + s.body + '", system-ui, sans-serif'); } else r.removeProperty('--f-body');
    if (s.bg) { r.setProperty('--bg', s.bg); r.setProperty('--bg-2', 'color-mix(in srgb, ' + s.bg + ' 88%, ' + (s.theme === 'dark' ? '#ffffff' : '#111827') + ' 4%)'); } else { r.removeProperty('--bg'); r.removeProperty('--bg-2'); }
    if (s.accent) r.setProperty('--accent', s.accent); else r.removeProperty('--accent');
  }

  var state = load();
  var open = /[?&]tune\b/.test(location.search) || state.panel;
  // Only apply saved choices for someone who has used the tester, so visitors always get the real design.
  var used = false; try { used = Boolean(localStorage.getItem(KEY)); } catch (e) { used = false; }
  if (open || used) apply(state);
  if (!open) return;
  state.panel = true; save(state);

  function panel() {
    var p = document.createElement('div');
    p.id = 'tunePanel';
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Style tester');
    p.innerHTML =
      '<style>#tunePanel{position:fixed;right:16px;bottom:16px;z-index:9999;width:290px;max-height:calc(100vh - 32px);overflow:auto;background:#111c29;color:#fff;border:1px solid #2b3b4f;border-radius:16px;padding:16px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 20px 50px rgb(0 0 0 / .5)}#tunePanel h4{margin:0 0 10px;font:600 15px system-ui}#tunePanel label{display:block;margin:10px 0 4px;color:#c9d3df}#tunePanel input[type=range]{width:100%}#tunePanel select,#tunePanel input[type=color]{width:100%;height:34px;border-radius:8px;border:1px solid #2b3b4f;background:#0b1520;color:#fff}#tunePanel .r{display:flex;gap:8px;margin-top:12px}#tunePanel button{flex:1;min-height:34px;border-radius:999px;border:1px solid #2b3b4f;background:#18283a;color:#fff;cursor:pointer;font:600 13px system-ui}#tunePanel .x{position:absolute;top:10px;right:10px;flex:none;width:28px;min-height:28px;padding:0}#tunePanel .seg2{display:flex;gap:6px}#tunePanel .seg2 button[aria-pressed=true]{background:#4aa5dd;color:#06121d;border-color:#4aa5dd}#tunePanel small{color:#8a99ab}</style>' +
      '<h4>Style tester</h4><button class="x" type="button" data-t="close" aria-label="Close the tester">×</button>' +
      '<label>Light or dark</label><div class="seg2"><button type="button" data-theme="dark">Dark</button><button type="button" data-theme="light">Light</button></div>' +
      '<label for="tStrong">Main writing: <b data-v="strong"></b>%</label><input id="tStrong" type="range" min="40" max="100" step="1" data-k="strong">' +
      '<label for="tSoft">Under the titles: <b data-v="soft"></b>%</label><input id="tSoft" type="range" min="25" max="95" step="1" data-k="soft">' +
      '<label for="tHead">Headline font</label><select id="tHead" data-k="head"></select>' +
      '<label for="tBody">Writing font</label><select id="tBody" data-k="body"></select>' +
      '<label for="tBg">Background colour</label><input id="tBg" type="color" data-k="bg">' +
      '<label for="tAcc">Link colour</label><input id="tAcc" type="color" data-k="accent">' +
      '<div class="r"><button type="button" data-t="reset">Reset</button><button type="button" data-t="copy">Copy settings</button></div>' +
      '<small>Only you see this. It stays on while you click around the site.</small>';
    document.body.appendChild(p);
    var fill = function (sel, table) { Object.keys(table).forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); }); };
    fill(p.querySelector('#tHead'), HEAD_FONTS); fill(p.querySelector('#tBody'), BODY_FONTS);
    function show() {
      p.querySelector('#tStrong').value = state.strong; p.querySelector('#tSoft').value = state.soft;
      p.querySelector('[data-v=strong]').textContent = state.strong; p.querySelector('[data-v=soft]').textContent = state.soft;
      p.querySelector('#tHead').value = state.head; p.querySelector('#tBody').value = state.body;
      var cs = getComputedStyle(document.documentElement);
      p.querySelector('#tBg').value = toHex(state.bg || cs.getPropertyValue('--bg'));
      p.querySelector('#tAcc').value = toHex(state.accent || cs.getPropertyValue('--accent'));
      p.querySelectorAll('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme') === state.theme)); });
    }
    function toHex(v) { v = String(v).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000'; }
    p.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      state[k] = e.target.type === 'range' ? Number(e.target.value) : e.target.value;
      apply(state); save(state); show();
    });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-theme')) { state.theme = b.getAttribute('data-theme'); state.bg = ''; apply(state); save(state); show(); return; }
      var t = b.getAttribute('data-t');
      if (t === 'reset') { state = Object.assign({}, DEFAULTS, { panel: true }); apply(state); save(state); show(); }
      if (t === 'close') { try { localStorage.removeItem(KEY); } catch (e2) { /* fine */ } location.href = location.pathname; }
      if (t === 'copy') {
        var text = 'FOH AI style settings: theme ' + state.theme + ', main writing ' + state.strong + '%, under titles ' + state.soft + '%, headline font ' + state.head + ', writing font ' + state.body + ', background ' + (state.bg || 'default') + ', button colour ' + (state.accent || 'default');
        var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy settings'; }, 1600); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this:', text); });
        else window.prompt('Copy this:', text);
      }
    });
    show();
  }
  if (document.body) panel(); else document.addEventListener('DOMContentLoaded', panel);
})();
