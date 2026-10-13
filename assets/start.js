/* Poots Design: start your project page (start/).
   Package picker (reads ?package= from the link) and the sticky summary card, checklist progress
   with ticks saved on this device (localStorage, wrapped in try/catch), the step indicator, and the
   print button. The page works without this file: the form still posts and nothing is hidden. */
(function () {
  'use strict';
  var d = document;
  var $$ = function (s) { return Array.prototype.slice.call(d.querySelectorAll(s)); };
  var KEY = 'pd-start-ticks';
  var store = {
    get: function () {
      try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    },
    set: function (v) {
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage blocked: ticks just won't be remembered */ }
    }
  };

  // ---- Package picker + summary card ----
  var radios = $$('input[name="package"]');
  var sum = {};
  $$('[data-sum]').forEach(function (el) { sum[el.getAttribute('data-sum')] = el; });
  var unsure = {};
  Object.keys(sum).forEach(function (k) { unsure[k] = sum[k].textContent; });
  function set(k, v) { if (sum[k] && sum[k].textContent !== v) sum[k].textContent = v; }
  function showPackage() {
    var r = d.querySelector('input[name="package"]:checked');
    var p = r && r.dataset;
    if (!p || !p.price) {
      Object.keys(unsure).forEach(function (k) { set(k, unsure[k]); });
      return;
    }
    set('name', p.name);
    set('price', p.price);
    set('deposit', p.deposit);
    set('time', p.time.charAt(0).toUpperCase() + p.time.slice(1));
    set('note', "You'll need " + p.photos + '. Timings start once I have your deposit and content.');
  }
  var wanted = '';
  try { wanted = (new URLSearchParams(location.search).get('package') || '').toLowerCase().replace(/[^a-z]/g, ''); } catch (e) { /* old browser */ }
  radios.forEach(function (r) {
    if (wanted && r.value === wanted) r.checked = true;
    r.addEventListener('change', showPackage);
  });
  showPackage();

  // ---- Checklist progress (ticks saved on this device) ----
  var ticks = $$('input[data-tick]');
  var text = d.getElementById('progress-text');
  var bar = d.getElementById('progress-bar');
  var saved = store.get();
  ticks.forEach(function (t) { if (saved.indexOf(t.id) !== -1) t.checked = true; });
  function update(save) {
    var done = ticks.filter(function (t) { return t.checked; });
    if (text) {
      text.textContent = done.length === ticks.length
        ? 'All ' + ticks.length + ' ready. Great, send them over in step 3.'
        : done.length + ' of ' + ticks.length + ' ready';
    }
    if (bar) bar.style.setProperty('--p', ticks.length ? (done.length / ticks.length).toFixed(4) : '0');
    if (save) store.set(done.map(function (t) { return t.id; }));
  }
  ticks.forEach(function (t) { t.addEventListener('change', function () { update(true); }); });
  var clear = d.getElementById('clear-ticks');
  if (clear) {
    clear.addEventListener('click', function () {
      ticks.forEach(function (t) { t.checked = false; });
      update(true);
    });
  }
  update(false);

  // ---- Print the checklist ----
  var print = d.getElementById('print-list');
  if (print && window.print) {
    print.hidden = false;
    print.addEventListener('click', function () { window.print(); });
  }

  // ---- Step indicator: the current step follows the scroll position ----
  var links = $$('.st-stepper a[href^="#"]');
  var steps = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
  if (links.length && steps.every(Boolean)) {
    var ticking = false;
    var mark = function () {
      ticking = false;
      var line = window.innerHeight * 0.4, cur = 0;
      steps.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) cur = i; });
      if ((window.innerHeight + window.scrollY) >= d.documentElement.scrollHeight - 4) {
        // at the very bottom, the last step that is on screen wins
        steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < window.innerHeight) cur = i; });
      }
      links.forEach(function (a, i) {
        if (i === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(mark); }
    }, { passive: true });
    window.addEventListener('resize', mark);
    mark();
  }
})();
