// onboarding.js: the restaurant onboarding form.
// Sections are described once (SECTIONS below); the page draws the current one, checks what is still missing,
// and only lets the owner go forward when the section is complete. Back always works. Nothing is saved until Submit,
// which sends everything to the FOH AI dashboard (Submissions page).
(function () {
  'use strict';

  var API = 'https://restaurant-platform-production-1f82.up.railway.app/public/onboarding';
  var MAX_FILE = 5 * 1024 * 1024;   // per file
  var MAX_FILES = 3;                // per upload box

  var DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];
  var DAY_NAMES = DAYS.map(function (d) { return d[1]; });
  function defaultHours() {
    var h = {};
    DAYS.forEach(function (d, i) {
      var open = i >= 5 ? '12:00' : '11:00';
      var close = i === 4 || i === 5 ? '23:00' : i === 6 ? '21:00' : '22:00';
      h[d[0]] = { mode: 'open', open: open, close: close };
    });
    return h;
  }
  var copyHours = function (h) { return JSON.parse(JSON.stringify(h)); };

  // ---------- what the form asks ----------
  // Field kinds: text, email, tel, url, area (long text), choice (one or many, with "Other"), yesno, time, hours, files, note.
  // `when` shows a field only when it returns true. `req` = needed before Next.
  var has = function (id, v) { return function (s) { var x = s[id]; return Array.isArray(x) ? x.indexOf(v) >= 0 : x === v; }; };
  var SECTIONS = [
    { id: 'details', title: 'Restaurant details', fields: [
      { id: 'restaurant_name', kind: 'text', label: 'Restaurant name', req: true, placeholder: 'Enter restaurant name', auto: 'organization' },
      { id: 'restaurant_phone', kind: 'tel', label: 'Restaurant phone number', req: true, help: 'This is the number your AI receptionist will answer.', placeholder: '(604) 000-0000' },
      { kind: 'note', title: 'Your contact information', text: 'Your personal or business contact details. We use these to reach you, not as the restaurant\'s incoming phone number.' },
      { id: 'contact_name', kind: 'text', label: 'Your full name', req: true, auto: 'name', half: true },
      { id: 'contact_phone', kind: 'tel', label: 'Your direct phone number', req: true, auto: 'tel', placeholder: '(604) 000-0000', half: true },
      { id: 'contact_email', kind: 'email', label: 'Your email address', req: true, auto: 'email' },
      { kind: 'note', title: 'Restaurant address' },
      { id: 'address_street', kind: 'text', label: 'Street address', req: true, auto: 'address-line1' },
      { id: 'address_city', kind: 'text', label: 'City', req: true, auto: 'address-level2', third: true },
      { id: 'address_region', kind: 'text', label: 'Province or state', req: true, auto: 'address-level1', third: true },
      { id: 'address_postal', kind: 'text', label: 'Postal code', req: true, auto: 'postal-code', third: true },
      { id: 'website', kind: 'url', label: 'Restaurant website', placeholder: 'https://yourrestaurant.com', help: 'Optional.' },
      { id: 'locations', kind: 'choice', label: 'How many locations do you have?', req: true, options: ['1', '2', '3', '4', '5 or more'], row: true },
      { kind: 'note', when: function (s) { return s.locations && s.locations !== '1'; }, text: 'Fill out this form once for each location, starting with this one. Each location can have its own hours, menu and phone number.' },
      { id: 'location_name', kind: 'text', label: 'Which location is this?', req: true, placeholder: 'For example: Downtown', when: function (s) { return s.locations && s.locations !== '1'; } },
      { id: 'restaurant_type', kind: 'choice', multi: true, label: 'Type of restaurant', help: 'Choose all that fit.', req: true, other: true,
        options: ['Casual dining', 'Fine dining', 'Fast food', 'Cafe / coffee shop', 'Bakery', 'Bar / pub', 'Pizza', 'Sushi / Japanese', 'Chinese', 'Indian', 'Mexican', 'Italian', 'Seafood', 'Other'] },
    ] },
    { id: 'hours', title: 'Business hours', intro: 'We\'ve filled in common hours. Change any day, or mark it closed.', fields: [
      { id: 'hours', kind: 'hours', label: 'Weekly opening hours', req: true },
      { id: 'kitchen_separate', kind: 'yesno', label: 'Does the kitchen close before the restaurant does?', req: true },
      { id: 'kitchen_hours', kind: 'hours', closeOnly: true, label: 'Kitchen closing time', req: true, from: 'hours', when: has('kitchen_separate', 'yes') },
      { id: 'dinein_separate', kind: 'yesno', label: 'Are dine-in hours different from the hours above?', req: true },
      { id: 'dinein_hours', kind: 'hours', label: 'Dine-in hours', req: true, from: 'hours', when: has('dinein_separate', 'yes') },
      { id: 'happy_hour', kind: 'yesno', label: 'Do you offer happy hour?', req: true },
      { id: 'happy_days', kind: 'choice', multi: true, label: 'Which days?', req: true, options: DAY_NAMES, when: has('happy_hour', 'yes'), row: true },
      { id: 'happy_start', kind: 'time', label: 'Starts', req: true, def: '15:00', half: true, when: has('happy_hour', 'yes') },
      { id: 'happy_end', kind: 'time', label: 'Ends', req: true, def: '18:00', half: true, when: has('happy_hour', 'yes') },
      { id: 'happy_for', kind: 'choice', multi: true, label: 'Happy hour is for', req: true, options: ['Food', 'Drinks'], when: has('happy_hour', 'yes'), row: true },
      { id: 'happy_details', kind: 'area', label: 'Other happy hour details', help: 'Optional.', when: has('happy_hour', 'yes') },
    ] },
    { id: 'services', title: 'Services offered', intro: 'Your answers here decide which questions come next.', fields: [
      { id: 'services', kind: 'choice', multi: true, label: 'Which services does your restaurant offer?', help: 'Choose all that apply.', req: true,
        options: ['Dine-in', 'Pickup / Takeout', 'Delivery', 'Reservations', 'Catering / Large orders'] },
      { id: 'catering_details', kind: 'area', label: 'Tell us about catering and large orders', help: 'Optional. For example: how much notice you need, and the smallest order.', when: has('services', 'Catering / Large orders') },
    ] },
    { id: 'pickup', title: 'Pickup', when: has('services', 'Pickup / Takeout'), fields: [
      { id: 'pickup_prep', kind: 'choice', label: 'Typical preparation time', req: true, other: true, row: true, options: ['10 min', '15 min', '20 min', '25 min', '30 min', '45 min', '60 min', 'Other'] },
      { id: 'pickup_asap', kind: 'yesno', label: 'Do you take orders for as soon as possible?', req: true },
      { id: 'pickup_scheduled', kind: 'yesno', label: 'Do you take orders for a later time?', req: true },
      { id: 'pickup_notice', kind: 'choice', label: 'Least notice you need for a later order', req: true, other: true, row: true, options: ['15 min', '30 min', '45 min', '60 min', 'Other'], when: has('pickup_scheduled', 'yes') },
      { id: 'pickup_payment', kind: 'choice', multi: true, label: 'How do guests pay for pickup?', req: true, other: true, options: ['Online', 'In person', 'Over the phone', 'Other'] },
      { id: 'pickup_where', kind: 'choice', multi: true, label: 'Where do guests pick up?', req: true, other: true, options: ['Front counter', 'Drive-through', 'Pickup shelf or area', 'Other'] },
      { id: 'pickup_reject', kind: 'yesno', label: 'Can staff turn down an order?', req: true },
      { id: 'pickup_busy', kind: 'choice', multi: true, label: 'When it gets busy', req: true, other: true, options: ['Give longer wait times', 'Pause new orders', 'Send calls to staff', 'Other'] },
      { id: 'pickup_instructions', kind: 'area', label: 'Pickup instructions for guests', help: 'Optional. For example: where to park or which door to use.' },
      { id: 'pickup_separate', kind: 'yesno', label: 'Are pickup hours different from your opening hours?', req: true },
      { id: 'pickup_hours', kind: 'hours', label: 'Pickup hours', req: true, from: 'hours', when: has('pickup_separate', 'yes') },
    ] },
    { id: 'delivery', title: 'Delivery', when: has('services', 'Delivery'), fields: [
      { id: 'delivery_by', kind: 'choice', multi: true, label: 'Who delivers your orders?', help: 'Choose all that apply.', req: true, other: true, options: ['Our own drivers', 'DoorDash', 'Uber Eats', 'SkipTheDishes', 'Other'] },
      { id: 'delivery_time', kind: 'choice', label: 'Typical delivery time', req: true, other: true, row: true, options: ['20 min', '30 min', '45 min', '60 min', '75 min', '90 min', 'Other'] },
      { id: 'delivery_fee', kind: 'choice', label: 'Delivery fee', req: true, other: true, options: ['Free', 'Fixed fee', 'Based on distance', 'Depends on the order', 'Other'] },
      { id: 'delivery_fee_amount', kind: 'text', label: 'How much is the fixed fee?', req: true, placeholder: '$5.00', when: has('delivery_fee', 'Fixed fee'), half: true },
      { id: 'delivery_min', kind: 'choice', label: 'Minimum order', req: true, other: true, row: true, options: ['No minimum', '$10', '$15', '$20', '$25', '$30', 'Other'] },
      { id: 'delivery_radius', kind: 'choice', label: 'How far do you deliver?', req: true, other: true, row: true, options: ['3 km', '5 km', '10 km', '15 km', '20 km', 'Other'] },
      { id: 'delivery_areas', kind: 'area', label: 'Delivery areas', help: 'Optional. Postal codes or neighbourhoods.' },
      { id: 'delivery_scheduled', kind: 'yesno', label: 'Can guests order delivery for a later time?', req: true },
      { id: 'delivery_pause', kind: 'yesno', label: 'Do you pause delivery when it gets busy?', req: true },
      { id: 'delivery_separate', kind: 'yesno', label: 'Are delivery hours different from your opening hours?', req: true },
      { id: 'delivery_hours', kind: 'hours', label: 'Delivery hours', req: true, from: 'hours', when: has('delivery_separate', 'yes') },
    ] },
    { id: 'reservations', title: 'Reservations', when: has('services', 'Reservations'), fields: [
      { id: 'res_system', kind: 'choice', label: 'Which reservation system do you use?', req: true, other: true,
        options: ['OpenTable', 'Resy', 'SevenRooms', 'Tock', 'Yelp Reservations', 'Our own system', 'Phone only', 'Other'] },
      { id: 'res_max_party', kind: 'choice', label: 'Largest party you take a reservation for', req: true, other: true, row: true, options: ['4', '6', '8', '10', '12', '15', '20', 'Other'] },
      { id: 'res_ahead', kind: 'choice', label: 'How far ahead can guests book?', req: true, other: true, row: true, options: ['1 week', '2 weeks', '30 days', '60 days', '90 days', 'Other'] },
      { id: 'res_length', kind: 'choice', label: 'How long is a table usually booked for?', req: true, other: true, row: true, options: ['60 min', '75 min', '90 min', '2 hours', 'Other'] },
      { id: 'res_same_day', kind: 'yesno', label: 'Do you take same-day reservations?', req: true },
      { id: 'res_deposit', kind: 'yesno', label: 'Do you require deposits?', req: true },
      { id: 'res_change', kind: 'yesno', label: 'Can callers change a reservation?', req: true },
      { id: 'res_cancel', kind: 'yesno', label: 'Can callers cancel a reservation?', req: true },
      { id: 'res_seating', kind: 'choice', multi: true, label: 'Seating guests can ask for', help: 'Optional. Choose all that apply.', other: true, options: ['Indoor', 'Patio', 'Bar', 'Private dining', 'Other'] },
      { id: 'res_large_rules', kind: 'area', label: 'Rules for large parties', help: 'Optional.' },
      { id: 'res_cancel_policy', kind: 'area', label: 'Cancellation policy', help: 'Optional.' },
    ] },
    { id: 'systems', title: 'POS and ordering systems', fields: [
      { id: 'pos', kind: 'choice', label: 'Which POS system do you use?', req: true, other: true,
        options: ['Toast', 'Square', 'Clover', 'Lightspeed', 'TouchBistro', 'Aloha', 'Oracle MICROS', 'Revel', 'Other', 'Not sure'] },
      { id: 'online_ordering', kind: 'choice', multi: true, label: 'Where do guests order online?', help: 'Choose all that apply.', req: true, other: true, none: 'We don\'t have online ordering',
        options: ['Our own website', 'Toast Online Ordering', 'Square Online', 'Deliverect', 'DoorDash', 'Uber Eats', 'SkipTheDishes', 'Other', 'We don\'t have online ordering'] },
      { id: 'multi_systems', kind: 'yesno', label: 'Do you use more than one system for orders?', req: true },
      { id: 'menu_differs', kind: 'yesno', label: 'Is your online menu different from your in-store menu?', req: true, when: function (s) { return Array.isArray(s.online_ordering) && s.online_ordering.length && s.online_ordering.indexOf('We don\'t have online ordering') < 0; } },
    ] },
    { id: 'extra', title: 'More about your restaurant', intro: 'Everything here is optional, but the more we know, the better your receptionist answers.', fields: [
      { id: 'menu_files', kind: 'files', label: 'Upload your menu', help: 'PDF, Word, Excel or a photo. Up to 3 files, 5 MB each.' },
      { id: 'menu_link', kind: 'url', label: 'Or a link to your online menu', placeholder: 'https://' },
      { id: 'policy_files', kind: 'files', label: 'Upload your restaurant policies', help: 'Optional. Up to 3 files, 5 MB each.' },
      { id: 'special_instructions', kind: 'area', label: 'Special instructions for your receptionist' },
      { id: 'common_questions', kind: 'area', label: 'Questions guests often ask' },
      { id: 'allergens', kind: 'area', label: 'Allergens and dietary information' },
      { id: 'promotions', kind: 'area', label: 'Promotions and specials' },
      { id: 'anything_else', kind: 'area', label: 'Anything else we should know?' },
    ] },
    { id: 'review', title: 'Review', review: true, fields: [] },
  ];

  // ---------- state ----------
  var S = { hours: defaultHours() };
  var files = {};            // field id -> [{name,type,size,data}]
  var cur = 0;
  var touched = false;
  var sent = false;

  var $ = function (id) { return document.getElementById(id); };
  var form = $('obForm'); var box = $('obSection');
  var btnBack = $('obBack'); var btnNext = $('obNext'); var missingEl = $('obMissing');

  var visibleSections = function () { return SECTIONS.filter(function (s) { return !s.when || s.when(S); }); };
  var visibleFields = function (sec) { return sec.fields.filter(function (f) { return !f.when || f.when(S); }); };

  // ---------- checking answers ----------
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var digits = function (v) { return String(v || '').replace(/\D/g, ''); };
  var telOk = function (v) { var d = digits(v); return d.length === 10 || (d.length === 11 && d[0] === '1'); };
  var urlOk = function (v) { return !v || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(String(v).trim()); };
  function hoursOk(h, closeOnly) {
    if (!h) return false;
    return DAYS.every(function (d) {
      var x = h[d[0]]; if (!x) return false;
      if (x.mode === 'closed' || x.mode === '24h') return true;
      if (closeOnly) return Boolean(x.close);
      return Boolean(x.open && x.close && x.open !== x.close);
    });
  }
  function fieldDone(f) {
    var v = S[f.id];
    switch (f.kind) {
      case 'note': case 'files': return true;
      case 'email': return f.req ? EMAIL.test(String(v || '').trim()) : (!v || EMAIL.test(String(v).trim()));
      case 'tel': return f.req ? telOk(v) : (!v || telOk(v));
      case 'url': return urlOk(v) && (!f.req || Boolean(v));
      case 'hours': return hoursOk(v, f.closeOnly);
      case 'choice':
        if (f.multi) {
          if (!Array.isArray(v) || !v.length) return !f.req;
          return v.indexOf('Other') < 0 || Boolean(String(S[f.id + '_other'] || '').trim());
        }
        if (!v) return !f.req;
        return v !== 'Other' || Boolean(String(S[f.id + '_other'] || '').trim());
      default: return f.req ? Boolean(String(v || '').trim()) : true;
    }
  }
  var needed = function (f) { return f.kind !== 'note' && (f.req || ['email', 'tel', 'url'].indexOf(f.kind) >= 0 || (f.kind === 'choice' && f.other)); };
  function missingIn(sec) { return visibleFields(sec).filter(function (f) { return needed(f) && !fieldDone(f); }); }
  var sectionDone = function (sec) { return sec.review || missingIn(sec).length === 0; };

  // Until services are picked, the pickup, delivery and reservation sections count as still to do,
  // so the bar only ever moves forward (picking fewer services makes it jump ahead instead of back).
  function progress() {
    var total = 0; var done = 0;
    var picked = Array.isArray(S.services) && S.services.length > 0;
    SECTIONS.filter(function (s) { return !s.review && (!s.when || s.when(S) || !picked); }).forEach(function (sec) {
      visibleFields(sec).forEach(function (f) { if (f.req) { total++; if (fieldDone(f)) done++; } });
    });
    return total ? Math.round(done / total * 100) : 0;
  }

  // ---------- drawing ----------
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmtTime = function (t) { if (!t) return ''; var p = t.split(':'); var h = Number(p[0]); return (h % 12 || 12) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM'); };
  var mins = function (t) { var p = String(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); };

  function labelFor(f, tag) {
    return '<' + (tag || 'label') + ' class="ob-label"' + (tag ? '' : ' for="f_' + f.id + '"') + '>' + esc(f.label) + (f.req ? '' : ' <span class="opt">(optional)</span>') + '</' + (tag || 'label') + '>' + (f.help && f.help !== 'Optional.' ? '<p class="ob-help" id="h_' + f.id + '">' + esc(f.help) + '</p>' : '');
  }
  function renderField(f) {
    var cls = 'ob-field' + (f.half ? ' half' : '') + (f.third ? ' third' : '');
    var v = S[f.id];
    var desc = f.help && f.help !== 'Optional.' ? ' aria-describedby="h_' + f.id + '"' : '';
    switch (f.kind) {
      case 'note':
        return '<div class="ob-note' + (f.title && !f.text ? ' plain' : '') + '">' + (f.title ? '<h3>' + esc(f.title) + '</h3>' : '') + (f.text ? '<p>' + esc(f.text) + '</p>' : '') + '</div>';
      case 'text': case 'email': case 'tel': case 'url':
        return '<div class="' + cls + '" data-f="' + f.id + '">' + labelFor(f) + '<input class="ob-input" id="f_' + f.id + '" name="' + f.id + '" type="' + (f.kind === 'text' ? 'text' : f.kind) + '"' + (f.kind === 'tel' ? ' inputmode="tel"' : '') + ' value="' + esc(v || '') + '" placeholder="' + esc(f.placeholder || '') + '" autocomplete="' + esc(f.auto || 'off') + '" maxlength="300"' + desc + '></div>';
      case 'area':
        return '<div class="' + cls + '" data-f="' + f.id + '">' + labelFor(f) + '<textarea class="ob-input" id="f_' + f.id + '" name="' + f.id + '" rows="3" maxlength="5000"' + desc + '>' + esc(v || '') + '</textarea></div>';
      case 'yesno':
        return '<fieldset class="' + cls + '" data-f="' + f.id + '">' + labelFor(f, 'legend') + '<div class="ob-yesno">' +
          ['yes', 'no'].map(function (o) { return '<label class="tile"><input type="radio" name="' + f.id + '" value="' + o + '"' + (v === o ? ' checked' : '') + '><span>' + (o === 'yes' ? 'Yes' : 'No') + '</span></label>'; }).join('') + '</div></fieldset>';
      case 'choice':
        var sel = f.multi ? (Array.isArray(v) ? v : []) : v;
        var tiles = f.options.map(function (o) {
          var on = f.multi ? sel.indexOf(o) >= 0 : sel === o;
          return '<label class="tile' + (f.multi ? ' check' : '') + '"><input type="' + (f.multi ? 'checkbox' : 'radio') + '" name="' + f.id + '" value="' + esc(o) + '"' + (on ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
        }).join('');
        var showOther = f.other && (f.multi ? sel.indexOf('Other') >= 0 : sel === 'Other');
        return '<fieldset class="' + cls + '" data-f="' + f.id + '">' + labelFor(f, 'legend') + '<div class="ob-tiles' + (f.row ? ' row' : '') + '">' + tiles + '</div>' +
          (showOther ? '<div class="ob-other"><label class="sr" for="f_' + f.id + '_other">Please specify</label><input class="ob-input" id="f_' + f.id + '_other" name="' + f.id + '_other" placeholder="Please specify" value="' + esc(S[f.id + '_other'] || '') + '" maxlength="300"></div>' : '') + '</fieldset>';
      case 'time':
        if (!v && f.def) S[f.id] = v = f.def;
        return '<div class="' + cls + '" data-f="' + f.id + '">' + labelFor(f) + '<button type="button" class="ob-time" aria-haspopup="dialog" aria-expanded="false" id="f_' + f.id + '" data-time="' + f.id + '">' + (v ? esc(fmtTime(v)) : 'Choose time') + '</button></div>';
      case 'hours':
        if (!v) S[f.id] = v = f.from && S[f.from] ? copyHours(S[f.from]) : defaultHours();
        return '<fieldset class="ob-field" data-f="' + f.id + '">' + labelFor(f, 'legend') + '<div class="ob-hours">' + DAYS.map(function (d) {
          var x = v[d[0]];
          var modes = f.closeOnly ? [['open', 'Closes at'], ['closed', 'Closed'], ['24h', '24 hours']] : [['open', 'Open'], ['closed', 'Closed'], ['24h', '24 hours']];
          var times = x.mode === 'open' ? (f.closeOnly ? timeBtn(f.id, d[0], 'close', x.close, 'Kitchen closes') : timeBtn(f.id, d[0], 'open', x.open, 'Opens') + '<span class="ob-tlabel">to</span>' + timeBtn(f.id, d[0], 'close', x.close, 'Closes')) + (!f.closeOnly && x.open && x.close && mins(x.close) <= mins(x.open) ? '<span class="nextday">next day</span>' : '') : '<span class="ob-day-note">' + (x.mode === 'closed' ? 'Closed all day' : f.closeOnly ? 'Kitchen open all day and night' : 'Open all day and night') + '</span>';
          return '<div class="ob-day"><b>' + d[1] + '</b><div class="ob-modes" role="radiogroup" aria-label="' + d[1] + '">' + modes.map(function (m) {
            return '<label class="mode"><input type="radio" name="' + f.id + '_' + d[0] + '" value="' + m[0] + '" data-hours="' + f.id + '" data-day="' + d[0] + '"' + (x.mode === m[0] ? ' checked' : '') + '><span>' + m[1] + '</span></label>';
          }).join('') + '</div><div class="ob-times">' + times + '</div></div>';
        }).join('') + '</div><button type="button" class="ob-link" data-copy-monday="' + f.id + '">Use Monday for every day</button></fieldset>';
      case 'files':
        var list = files[f.id] || [];
        return '<div class="ob-field" data-f="' + f.id + '">' + labelFor(f) + '<label class="ob-drop" for="f_' + f.id + '"><input type="file" id="f_' + f.id + '" data-files="' + f.id + '" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.heic"' + desc + '><span>Choose files</span><small>or drag them here</small></label>' +
          (list.length ? '<ul class="ob-filelist">' + list.map(function (x, i) { return '<li><span>' + esc(x.name) + ' <small>' + Math.max(1, Math.round(x.size / 1024)) + ' KB</small></span><button type="button" class="ob-link" data-remove-file="' + f.id + '" data-i="' + i + '">Remove</button></li>'; }).join('') + '</ul>' : '') + '</div>';
    }
    return '';
  }
  function timeBtn(field, day, which, val, label) {
    return '<button type="button" class="ob-time" aria-haspopup="dialog" aria-expanded="false" data-time="' + field + '" data-day="' + day + '" data-which="' + which + '" aria-label="' + label + ', ' + DAY_NAMES[DAYS.map(function (d) { return d[0]; }).indexOf(day)] + ': ' + (val ? fmtTime(val) : 'not set') + '">' + (val ? esc(fmtTime(val)) : 'Choose') + '</button>';
  }

  function answerText(f) {
    var v = S[f.id];
    if (f.kind === 'yesno') return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '';
    if (f.kind === 'time') return fmtTime(v);
    if (f.kind === 'files') return (files[f.id] || []).map(function (x) { return x.name; }).join(', ');
    if (f.kind === 'hours') {
      return DAYS.map(function (d) {
        var x = v && v[d[0]]; if (!x) return '';
        if (x.mode === 'closed') return d[1] + ': Closed';
        if (x.mode === '24h') return d[1] + ': 24 hours';
        if (f.closeOnly) return d[1] + ': kitchen closes ' + fmtTime(x.close);
        return d[1] + ': ' + fmtTime(x.open) + ' to ' + fmtTime(x.close) + (mins(x.close) <= mins(x.open) ? ' (next day)' : '');
      }).join('\n');
    }
    if (f.kind === 'choice') {
      var arr = f.multi ? (Array.isArray(v) ? v : []) : (v ? [v] : []);
      return arr.map(function (o) { return o === 'Other' ? 'Other: ' + String(S[f.id + '_other'] || '').trim() : o; }).join(', ');
    }
    if (f.kind === 'tel') return formatTel(v);
    return String(v || '').trim();
  }
  function answers() {
    return visibleSections().filter(function (s) { return !s.review; }).map(function (sec) {
      return { section: sec.title, items: visibleFields(sec).filter(function (f) { return f.kind !== 'note'; }).map(function (f) { return { label: f.label, value: answerText(f) }; }).filter(function (x) { return x.value; }) };
    });
  }

  function renderReview() {
    return '<p class="ob-help">Check everything, then send it. Tap Edit to change a section.</p>' + visibleSections().filter(function (s) { return !s.review; }).map(function (sec) {
      var idx = visibleSections().indexOf(sec);
      var items = visibleFields(sec).filter(function (f) { return f.kind !== 'note'; }).map(function (f) { return { label: f.label, value: answerText(f) }; });
      return '<div class="ob-rev"><div class="ob-rev-head"><h3>' + esc(sec.title) + '</h3><button type="button" class="ob-link" data-goto="' + idx + '">Edit</button></div><dl>' +
        items.map(function (x) { return '<dt>' + esc(x.label) + '</dt><dd>' + (x.value ? esc(x.value).replace(/\n/g, '<br>') : '<span class="none">Not answered</span>') + '</dd>'; }).join('') + '</dl></div>';
    }).join('');
  }

  function draw(focusFirst) {
    var secs = visibleSections();
    if (cur >= secs.length) cur = secs.length - 1;
    var sec = secs[cur];
    box.innerHTML = '<h2 class="ob-title" tabindex="-1">' + esc(sec.title) + '</h2>' + (sec.intro ? '<p class="ob-help">' + esc(sec.intro) + '</p>' : '') +
      (sec.review ? renderReview() : '<div class="ob-grid">' + visibleFields(sec).map(renderField).join('') + '</div>');
    status();
    if (focusFirst) {
      var y = document.querySelector('.ob-card').getBoundingClientRect().top + window.scrollY - 12;
      if (window.scrollY > y) window.scrollTo({ top: y });
      box.querySelector('.ob-title').focus({ preventScroll: true });
    }
  }

  // Updates the arc and Back/Next without redrawing the fields (so typing is never interrupted).
  // The arc shows a little green from the start, so it never looks empty.
  function status() {
    var secs = visibleSections(); var sec = secs[cur];
    var pct = progress();
    $('obFill').setAttribute('stroke-dasharray', Math.max(pct, 3) + ' 100');
    $('obGauge').setAttribute('aria-valuenow', String(pct));
    $('obPct').textContent = pct + '%';
    $('obStep').textContent = sec.review ? 'Last step' : 'Section ' + (cur + 1) + ' of ' + (secs.length - 1);
    btnBack.hidden = cur === 0;
    var done = sectionDone(sec);
    btnNext.innerHTML = (sec.review ? (sent ? 'Sending…' : 'Send') : 'Next') + ' <span aria-hidden="true">›</span>';
    btnNext.setAttribute('aria-disabled', String(!done || sent));
    btnNext.classList.toggle('is-off', !done);
    if (done) { missingEl.hidden = true; box.querySelectorAll('.ob-bad').forEach(function (el) { el.classList.remove('ob-bad'); }); }
  }

  function showMissing() {
    var secs = visibleSections(); var miss = missingIn(secs[cur]);
    box.querySelectorAll('.ob-bad').forEach(function (el) { el.classList.remove('ob-bad'); });
    miss.forEach(function (f) { var el = box.querySelector('[data-f="' + f.id + '"]'); if (el) el.classList.add('ob-bad'); });
    missingEl.textContent = 'Still needed: ' + miss.map(function (f) { return f.label; }).join(', ') + '.';
    missingEl.hidden = false;
    var first = miss[0] && box.querySelector('[data-f="' + miss[0].id + '"]');
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); var inp = first.querySelector('input:not([type=hidden]),textarea,button'); if (inp) inp.focus({ preventScroll: true }); }
  }

  // ---------- typing and ticking ----------
  function formatTel(v) {
    var d = digits(v); if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length !== 10) return String(v || '');
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'obHp' || t.type === 'file') return;
    touched = true;
    var name = t.name; if (!name) return;
    if (t.type === 'checkbox') {
      var f = findField(name);
      var arr = Array.isArray(S[name]) ? S[name].slice() : [];
      if (t.checked) {
        if (f && f.none && t.value === f.none) arr = [f.none];
        else { arr = arr.filter(function (x) { return !f || x !== f.none; }); if (arr.indexOf(t.value) < 0) arr.push(t.value); }
      } else arr = arr.filter(function (x) { return x !== t.value; });
      S[name] = arr;
      return redraw(name);
    }
    if (t.type === 'radio') {
      if (t.dataset.hours) { S[t.dataset.hours][t.dataset.day].mode = t.value; return redraw(t.dataset.hours); }
      S[name] = t.value; return redraw(name);
    }
    S[name] = t.value;
    status();
  });
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type === 'tel') { var f = formatTel(t.value); if (f !== t.value) { t.value = f; S[t.name] = f; } status(); }
    if (t.type === 'file') addFiles(t.dataset.files, t.files);
  });
  function findField(id) { for (var i = 0; i < SECTIONS.length; i++) for (var j = 0; j < SECTIONS[i].fields.length; j++) if (SECTIONS[i].fields[j].id === id) return SECTIONS[i].fields[j]; return null; }
  // A tick can show or hide other questions, so the section is drawn again, keeping focus on what was ticked.
  function redraw(name) {
    var a = document.activeElement; var key = a && a.name ? a.name + '|' + a.value : null;
    draw(false);
    if (key) { var again = box.querySelector('input[name="' + CSS.escape(a.name) + '"][value="' + CSS.escape(a.value) + '"]'); if (again) again.focus({ preventScroll: true }); }
    var other = box.querySelector('#f_' + name + '_other');
    if (other && !other.value && a && a.value === 'Other' && a.checked) other.focus();
  }

  form.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.time) return !picker.hidden && target === b ? closePicker() : openPicker(b);
    if (b.dataset.copyMonday) {
      var h = S[b.dataset.copyMonday]; DAYS.forEach(function (d) { h[d[0]] = JSON.parse(JSON.stringify(h.mon)); }); touched = true; return draw(false);
    }
    if (b.dataset.removeFile) { files[b.dataset.removeFile].splice(Number(b.dataset.i), 1); return draw(false); }
    if (b.dataset.goto) { cur = Number(b.dataset.goto); return draw(true); }
  });
  btnBack.addEventListener('click', function () { if (cur > 0) { cur--; draw(true); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var secs = visibleSections(); var sec = secs[cur];
    if (sent) return;
    if (!sectionDone(sec)) return showMissing();
    if (sec.review) return send();
    cur++; draw(true);
  });

  // ---------- files ----------
  function addFiles(id, list) {
    var have = files[id] = files[id] || [];
    var problems = [];
    var jobs = Array.prototype.slice.call(list || []).map(function (file) {
      if (have.length >= MAX_FILES) { problems.push(file.name + ': only ' + MAX_FILES + ' files here'); return null; }
      if (file.size > MAX_FILE) { problems.push(file.name + ' is over 5 MB'); return null; }
      var entry = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: null };
      have.push(entry);
      return new Promise(function (resolve) {
        var r = new FileReader();
        r.onload = function () { entry.data = String(r.result).split(',')[1] || ''; resolve(); };
        r.onerror = function () { have.splice(have.indexOf(entry), 1); problems.push(file.name + ' could not be read'); resolve(); };
        r.readAsDataURL(file);
      });
    }).filter(Boolean);
    Promise.all(jobs).then(function () {
      touched = true; draw(false);
      if (problems.length) { missingEl.textContent = problems.join('. ') + '.'; missingEl.hidden = false; }
    });
  }
  form.addEventListener('dragover', function (e) { if (e.target.closest('.ob-drop')) { e.preventDefault(); e.target.closest('.ob-drop').classList.add('over'); } });
  form.addEventListener('dragleave', function (e) { var d = e.target.closest('.ob-drop'); if (d) d.classList.remove('over'); });
  form.addEventListener('drop', function (e) { var d = e.target.closest('.ob-drop'); if (!d) return; e.preventDefault(); d.classList.remove('over'); addFiles(d.querySelector('input').dataset.files, e.dataTransfer.files); });

  // ---------- the scroll-wheel time picker ----------
  var picker = $('timePicker');
  var ITEM = 28;
  var HOURS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  var MINS = ['00', '15', '30', '45'];
  var APS = ['AM', 'PM'];
  var wheels = { h: $('wHour'), m: $('wMin'), a: $('wAp') };
  var target = null;
  // Hours and minutes roll round like a phone's wheel: the list is repeated, and after a scroll the wheel is
  // quietly moved back to the middle copy at the same value.
  var LOOPS = { wHour: 7, wMin: 9, wAp: 1 };
  function fillWheel(el, vals) {
    var loops = LOOPS[el.id]; el._n = vals.length; el._loops = loops; var html = '';
    for (var c = 0; c < loops; c++) vals.forEach(function (v, i) { var raw = c * vals.length + i; html += '<div class="it" role="option" id="' + el.id + '_' + raw + '" data-i="' + raw + '" data-v="' + i + '">' + v + '</div>'; });
    el.innerHTML = '<div class="pad"></div>' + html + '<div class="pad"></div>';
  }
  fillWheel(wheels.h, HOURS); fillWheel(wheels.m, MINS); fillWheel(wheels.a, APS);
  function rawIndex(el) { var n = el._n * el._loops; return Math.max(0, Math.min(n - 1, Math.round(el.scrollTop / ITEM))); }
  function wheelIndex(el) { return rawIndex(el) % el._n; }
  function middle(el, v) { return Math.floor(el._loops / 2) * el._n + v; }
  function markWheel(el) {
    var i = rawIndex(el);
    el.querySelectorAll('.it.on').forEach(function (it) { it.classList.remove('on'); it.setAttribute('aria-selected', 'false'); });
    var it = document.getElementById(el.id + '_' + i); if (it) { it.classList.add('on'); it.setAttribute('aria-selected', 'true'); }
    el.setAttribute('aria-activedescendant', el.id + '_' + i);
  }
  function setWheel(el, raw, smooth) { el.scrollTo({ top: raw * ITEM, behavior: smooth ? 'smooth' : 'auto' }); if (!smooth) markWheel(el); }
  function recenter(el) { var raw = rawIndex(el); var mid = middle(el, raw % el._n); if (el._loops > 1 && Math.abs(raw - mid) >= el._n) setWheel(el, mid, false); }
  Object.keys(wheels).forEach(function (k) {
    var el = wheels[k]; var t = null; var t2 = null;
    el.addEventListener('scroll', function () {
      markWheel(el); clearTimeout(t); clearTimeout(t2);
      t = setTimeout(function () { setWheel(el, rawIndex(el), true); t2 = setTimeout(function () { recenter(el); }, 260); }, 120);
    });
    el.addEventListener('click', function (e) { var it = e.target.closest('.it'); if (it) setWheel(el, Number(it.dataset.i), true); });
    el.addEventListener('keydown', function (e) {
      var n = el._n; var v = wheelIndex(el);
      if (e.key === 'ArrowDown') { e.preventDefault(); setWheel(el, middle(el, el._loops > 1 ? (v + 1) % n : Math.min(n - 1, v + 1)), false); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setWheel(el, middle(el, el._loops > 1 ? (v - 1 + n) % n : Math.max(0, v - 1)), false); }
      if (e.key === 'Home') { e.preventDefault(); setWheel(el, middle(el, 0), false); }
      if (e.key === 'End') { e.preventDefault(); setWheel(el, middle(el, n - 1), false); }
      if (e.key === 'Enter') { e.preventDefault(); $('tpDone').click(); }
    });
  });
  function currentValue(b) {
    if (b.dataset.day) { var x = S[b.dataset.time][b.dataset.day]; return x[b.dataset.which]; }
    return S[b.dataset.time];
  }
  function openPicker(b) {
    target = b;
    var v = currentValue(b) || (b.dataset.which === 'close' ? '22:00' : '11:00');
    var p = v.split(':'); var h = Number(p[0]); var m = Number(p[1]);
    picker.hidden = false; place(b); b.setAttribute('aria-expanded', 'true');
    setWheel(wheels.h, middle(wheels.h, HOURS.indexOf(String(h % 12 || 12))), false);
    setWheel(wheels.m, middle(wheels.m, Math.max(0, MINS.indexOf(String(m).padStart(2, '0')))), false);
    setWheel(wheels.a, middle(wheels.a, h < 12 ? 0 : 1), false);
    wheels.h.focus();
  }
  // The wheel sits right under the time box (or above it when there's no room below), inside the page.
  function place(b) {
    var r = b.getBoundingClientRect(); var w = picker.offsetWidth; var h = picker.offsetHeight;
    var left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, document.documentElement.clientWidth - w - 8));
    var top = r.bottom + 6 + h > window.innerHeight && r.top - 6 - h > 0 ? r.top - 6 - h : r.bottom + 6;
    picker.style.left = (left + window.scrollX) + 'px'; picker.style.top = (top + window.scrollY) + 'px';
  }
  function hidePicker() { picker.hidden = true; if (target) target.setAttribute('aria-expanded', 'false'); }
  function closePicker() { if (picker.hidden) return; hidePicker(); if (target && document.body.contains(target)) target.focus(); }
  document.addEventListener('mousedown', function (e) { if (!picker.hidden && !picker.contains(e.target) && !(target && target.contains(e.target))) hidePicker(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !picker.hidden) closePicker(); });
  window.addEventListener('resize', function () { if (!picker.hidden && target && document.body.contains(target)) place(target); });
  $('tpCancel').addEventListener('click', closePicker);
  $('tpDone').addEventListener('click', function () {
    var h = Number(HOURS[wheelIndex(wheels.h)]) % 12 + (wheelIndex(wheels.a) === 1 ? 12 : 0);
    var val = String(h).padStart(2, '0') + ':' + MINS[wheelIndex(wheels.m)];
    var b = target; touched = true;
    if (b.dataset.day) S[b.dataset.time][b.dataset.day][b.dataset.which] = val; else S[b.dataset.time] = val;
    var key = b.dataset.time + '|' + (b.dataset.day || '') + '|' + (b.dataset.which || '');
    hidePicker();
    draw(false);
    var again = Array.prototype.find.call(box.querySelectorAll('[data-time]'), function (x) { return x.dataset.time + '|' + (x.dataset.day || '') + '|' + (x.dataset.which || '') === key; });
    if (again) again.focus();
  });

  // ---------- sending ----------
  function send() {
    sent = true; status();
    missingEl.hidden = true;
    var raw = {};
    visibleSections().forEach(function (sec) { visibleFields(sec).forEach(function (f) {
      if (f.kind === 'note' || f.kind === 'files') return;
      raw[f.id] = S[f.id] == null ? '' : S[f.id];
      if (f.other && S[f.id + '_other']) raw[f.id + '_other'] = S[f.id + '_other'];
    }); });
    var upload = [];
    Object.keys(files).forEach(function (id) { (files[id] || []).forEach(function (x) { if (x.data) upload.push({ field: id, name: x.name, type: x.type, data: x.data }); }); });
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: raw, answers: answers(), files: upload, company_fax: $('obHp').value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'The form could not be sent (' + r.status + ').'); return j; }); })
      .then(function () {
        touched = false;
        form.hidden = true; $('obGauge').hidden = true; document.querySelector('.ob-h').hidden = true;
        $('obDoneText').textContent = 'We\'ll be in touch at ' + String(S.contact_email || '').trim() + ' to set up your receptionist.';
        $('obDone').hidden = false; $('obDone').focus();
        window.scrollTo({ top: 0 });
      })
      .catch(function (err) {
        sent = false; status();
        missingEl.textContent = (err && err.message && !/fetch|network/i.test(err.message) ? err.message : 'We couldn\'t reach our server.') + ' Your answers are still here, so you can try again. If it keeps happening, email sales@fohreceptionist.com.';
        missingEl.hidden = false;
      });
  }

  window.addEventListener('beforeunload', function (e) { if (touched) { e.preventDefault(); e.returnValue = ''; } });
  draw(false);
})();
