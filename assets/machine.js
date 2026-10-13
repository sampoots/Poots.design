/* Poots Design machine.js (home page only).
   1. The "Try it" mock-up machine (#try): redraws the code-drawn preview as you type or pick
      a trade, town and colours, and hands the choices to the enquiry form (#contact) on submit.
   2. The small "Included" scenes (#included): ripple rings once on reveal, replay on hover.
   No storage and no network. Without this file the static preview shows and the machine form
   simply links to #contact. */
(function () {
  'use strict';
  var d = document, w = window;
  var motion = w.matchMedia('(prefers-reduced-motion: no-preference)');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  // trade: [default palette, headline, sub, tiles, main CTA, form title]  ({t} = town)
  var TR = {
    'Electrician': ['navy', 'Safe, tidy electrical work in {t}.', 'Rewires, fuse boards, EV chargers and fault finding across {t}. Clear fixed quotes.', ['Rewires', 'Fuse boards', 'EV chargers'], 'Get a free quote', 'Request a quote'],
    'Roofer': ['charcoal', 'Roof repairs in {t}, done properly.', 'Repairs, new roofs, flat roofs and guttering across {t} and nearby. Free, fixed quotes.', ['Roof repairs', 'Flat roofs', 'Guttering'], 'Get a free quote', 'Request a quote'],
    'Café': ['moss', 'Good coffee and proper breakfasts in {t}.', 'Fresh bakes, seasonal soups and a warm welcome.', ['Menu', 'Book a table', 'Find us'], 'See the menu', 'Book a table'],
    'Salon': ['plum', 'Look good. Feel better. In {t}.', 'Cuts, colour and treatments. Book online in under a minute.', ['Treatments', 'Price list', 'Book now'], 'Book now', 'Book online'],
    'Cleaner': ['teal', 'Spotless homes and offices in {t}.', 'Regular, end-of-tenancy and one-off cleans. Fixed prices.', ['Regular cleans', 'End of tenancy', 'Offices'], 'Get a quote', 'Request a quote'],
    'Personal trainer': ['lime', 'Get stronger in {t}.', 'One-to-one and small group sessions, built around your goals.', ['1-to-1', 'Small groups', 'Online plans'], 'Book a free chat', 'Book a free chat']
  };
  var PAL = { navy: 'Navy and amber', moss: 'Moss and cream', charcoal: 'Charcoal and red', plum: 'Plum and blush', teal: 'Teal and mint', lime: 'Black and lime' };
  // made-up example names for the shuffle button (illustration only)
  var EX = { 'Electrician': 'Volthaven Electrical', 'Roofer': 'Slatecrest Roofing', 'Café': 'Hollowmoss Café', 'Salon': 'Fernlight Hair', 'Cleaner': 'Brightsill Cleaning', 'Personal trainer': 'Ironcove Fitness' };

  var form = $('.hm-ctrl'), rig = $('.hm-rig');
  if (form && rig) machine();
  scenes();

  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function mono(name) {
    var words = name.split(' ').filter(function (x) { return /[0-9A-Za-z\u00C0-\u024F]/.test(x); });
    return words.slice(0, 2).map(function (x) { return x.match(/[0-9A-Za-z\u00C0-\u024F]/)[0]; }).join('').toUpperCase() || 'YB';
  }
  function slug(name) {
    var s = name.normalize ? name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : name;
    return (s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) || 'yourbusiness') + '.co.uk';
  }

  function machine() {
    var nameIn = $('#mm-name', form), townIn = $('#mm-town', form), live = $('[data-mm-live]', form);
    var shuffle = $('[data-shuffle]', form);
    var said = '', timer = 0;

    var checked = function (n) { var el = $('[name="' + n + '"]:checked', form); return el ? el.value : ''; };
    var state = function () {
      var trade = TR[checked('trade')] ? checked('trade') : 'Electrician';
      return { name: clean(nameIn.value), trade: trade, town: townIn.value || 'Belfast' };
    };
    // start from whatever the browser restored (back button), else the trade's own colours
    var palette = checked('colours') || TR[state().trade][0];
    var put = function (key, text, fade) {
      $$('[data-mm="' + key + '"]', rig).forEach(function (el) {
        if (el.textContent === text) return;
        el.textContent = text;
        if (fade && motion.matches && el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
      });
    };

    function render(src) {
      var s = state(), t = TR[s.trade], name = s.name || 'Your Business';
      if (src && src.name === 'trade') {
        palette = t[0];
        $$('[name="colours"]', form).forEach(function (r) { r.checked = r.value === palette; });
      } else if (src && src.name === 'colours') {
        palette = src.value;
      }
      rig.setAttribute('data-palette', palette);
      var fade = !!src && src !== nameIn;
      put('name', name); put('mono', mono(name)); put('url', slug(s.name)); put('call', 'Call ' + name);
      put('tag', s.trade + ' · ' + s.town, fade);
      put('h', t[1].replace('{t}', s.town), fade);
      put('p', t[2].replace('{t}', s.town), fade);
      put('s1', t[3][0], fade); put('s2', t[3][1], fade); put('s3', t[3][2], fade);
      put('cta', t[4], fade); put('form', t[5], fade);
      if (src && live) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var msg = 'Preview updated: ' + name + ', ' + s.trade.toLowerCase() + ', ' + s.town + '.';
          if (msg !== said) { said = msg; live.textContent = msg; }
        }, 600);
      }
    }

    form.addEventListener('input', function (e) { if (e.target === nameIn) render(nameIn); });
    // phones: the preview sticks above the controls, so never let it cover the focused control
    var stage = rig.parentNode;
    form.addEventListener('focusin', function (e) {
      if (w.getComputedStyle(stage).position !== 'sticky') return;
      var top = e.target.getBoundingClientRect().top, edge = stage.getBoundingClientRect().bottom + 16;
      if (top < edge) w.scrollBy(0, top - edge);
    });
    form.addEventListener('change', function (e) { if (e.target !== nameIn) render(e.target); });

    if (shuffle) {
      shuffle.hidden = false;
      shuffle.addEventListener('click', function () {
        var now = state();
        var trades = Object.keys(TR).filter(function (k) { return k !== now.trade; });
        var trade = trades[Math.floor(Math.random() * trades.length)];
        var towns = Array.prototype.map.call(townIn.options, function (o) { return o.value; }).filter(function (x) { return x !== now.town; });
        var radio = $$('[name="trade"]', form).filter(function (r) { return r.value === trade; })[0];
        if (!radio) return;
        radio.checked = true;
        nameIn.value = EX[trade];
        townIn.value = towns[Math.floor(Math.random() * towns.length)];
        render(radio);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = state();
      var biz = d.getElementById('f-business'), msg = d.getElementById('f-msg'), src = d.getElementById('f-source');
      if (biz && s.name) biz.value = s.name;
      if (msg && !msg.value.trim()) {
        msg.value = "I'd like a free mock-up. Trade: " + s.trade + '. Town: ' + s.town + '. Colours: ' + (PAL[palette] || palette) + '.';
      }
      if (src) src.value = 'home-machine';
      var target = d.getElementById('contact'), first = d.getElementById('f-name');
      if (target) target.scrollIntoView({ behavior: motion.matches ? 'smooth' : 'auto', block: 'start' });
      if (first) {
        try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
      }
    });

    render(null);
  }

  // "Included" scenes: ripple rings once when seen, again on hover; phone tilts on hover
  function scenes() {
    if (!motion.matches || !('IntersectionObserver' in w) || !d.body.animate) return;
    var prep = function (el) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; };
    $$('.hm-c .hm-art').forEach(function (art) {
      var cell = art.parentNode, rings = $$('.hm-ring', art), tilt = $('.hm-tilt', art);
      if (tilt) {
        prep(tilt);
        tilt.style.transition = 'transform .32s cubic-bezier(.16,1,.3,1)';
        cell.addEventListener('pointerenter', function () { if (motion.matches) tilt.style.transform = 'rotate(-6deg)'; });
        cell.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
      }
      if (!rings.length) return;
      rings.forEach(prep);
      var play = function () {
        if (!motion.matches) return;
        rings.forEach(function (r, i) {
          r.animate([{ opacity: 0.85, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.25,1.9)' }],
            { duration: 1400, delay: 250 + i * 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
      };
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); play(); }
      }, { threshold: 0.6 });
      io.observe(art);
      cell.addEventListener('pointerenter', play);
    });
  }
})();
