/* Poots Design site.js: header, scrollspy, menu, call bar, reveal, spotlight, demo scaling,
   copy, parallax. No dependencies. Each module is a no-op when its markup is missing. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var mq = function (q) { return w.matchMedia(q); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var motionOK = mq('(prefers-reduced-motion: no-preference)');
  var hasIO = 'IntersectionObserver' in w;

  // header shadow after 8px
  var header = d.querySelector('.site-h');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      w.requestAnimationFrame(function () { header.classList.toggle('is-scrolled', w.scrollY > 8); ticking = false; });
    };
    onScroll();
    w.addEventListener('scroll', onScroll, { passive: true });
  }

  // scrollspy for same-page #links
  function spy(links, apply) {
    if (!hasIO || !links.length) return;
    var map = {};
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var el = id && d.getElementById(id);
      if (el) (map[id] = map[id] || { el: el, links: [] }).links.push(a);
    });
    var ids = Object.keys(map);
    if (!ids.length) return;
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { current = e.target.id; apply(links, map[current].links); }
        else if (current === e.target.id) { current = null; apply(links, []); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ids.forEach(function (id) { io.observe(map[id].el); });
  }
  spy($$('.site-h .nav a[href^="#"]'), function (all, on) {
    all.forEach(function (a) { a.classList.toggle('is-active', on.indexOf(a) > -1); });
  });
  function markCurrent(all, on) {
    all.forEach(function (a) {
      if (on.indexOf(a) > -1) {
        a.setAttribute('aria-current', 'true');
        var bar = a.closest('ul');
        if (bar && bar.scrollWidth > bar.clientWidth) {
          var l = a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2;
          bar.scrollTo({ left: l, behavior: motionOK.matches ? 'smooth' : 'auto' });
        }
      } else if (a.getAttribute('aria-current') === 'true') a.removeAttribute('aria-current');
    });
  }
  $$('.subnav, .toc').forEach(function (nav) { spy($$('a[href^="#"]', nav), markCurrent); });

  // menu sheet
  var btn = d.getElementById('menu-btn');
  var sheet = d.getElementById('site-menu');
  if (btn && sheet) {
    var label = btn.querySelector('.menu-btn__label');
    var outside = $$('main, footer, .site-f, [data-callbar]');
    $$('.menu-sheet__links li, .menu-sheet__pk, .menu-sheet__actions', sheet).forEach(function (el, i) { el.style.setProperty('--i', i); });
    var isOpen = function () { return btn.getAttribute('aria-expanded') === 'true'; };
    var setOpen = function (open, refocus) {
      if (open === isOpen()) return;
      btn.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close' : 'Menu';
      sheet.hidden = !open;
      root.classList.toggle('menu-open', open);
      outside.forEach(function (el) { el.inert = open; });
      if (open) {
        var first = sheet.querySelector('a, button');
        if (first) first.focus();
      } else if (refocus) btn.focus();
    };
    btn.addEventListener('click', function () { setOpen(!isOpen(), true); });
    d.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) { e.preventDefault(); setOpen(false, true); }
    });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false, false); });
    var wide = mq('(min-width: 960px)');
    var onWide = function () { if (wide.matches) setOpen(false, isOpen()); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  // call bar hides while a [data-callbar-hide] block is 10%+ visible
  var bar = d.querySelector('[data-callbar]');
  var hiders = $$('[data-callbar-hide]');
  if (bar && hiders.length && hasIO) {
    var seen = new Set();
    var cbIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.1) seen.add(e.target); else seen.delete(e.target);
      });
      bar.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: [0, 0.1, 0.2] });
    hiders.forEach(function (el) { cbIO.observe(el); });
  }

  // reveal: [data-reveal] and [data-stagger] children
  $$('[data-stagger]').forEach(function (p) {
    Array.prototype.forEach.call(p.children, function (c, i) {
      c.setAttribute('data-reveal', '');
      c.style.setProperty('--i', Math.min(i, 6));
    });
    p.removeAttribute('data-stagger');
  });
  var items = $$('[data-reveal]');
  var done = function (el) { el.removeAttribute('data-reveal'); el.classList.remove('in'); el.style.removeProperty('--i'); };
  if (items.length) {
    if (!hasIO || !motionOK.matches) items.forEach(done);
    else {
      var vh = w.innerHeight;
      var rvIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          rvIO.unobserve(el);
          el.classList.add('in');
          var delay = (parseFloat(el.style.getPropertyValue('--i')) || 0) * 60;
          setTimeout(function () { done(el); }, 760 + delay);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top < vh) done(el); else rvIO.observe(el);
      });
    }
  }
  root.classList.add('rv-ready');

  // spotlight on .spot
  if (mq('(hover: hover) and (pointer: fine)').matches) {
    var spotEl = null, sx = 0, sy = 0, spotRaf = 0;
    d.addEventListener('pointermove', function (e) {
      if (!motionOK.matches) return;
      var t = e.target.closest && e.target.closest('.spot');
      if (!t) return;
      spotEl = t; sx = e.clientX; sy = e.clientY;
      if (spotRaf) return;
      spotRaf = w.requestAnimationFrame(function () {
        spotRaf = 0;
        var r = spotEl.getBoundingClientRect();
        spotEl.style.setProperty('--mx', (sx - r.left) + 'px');
        spotEl.style.setProperty('--my', (sy - r.top) + 'px');
      });
    }, { passive: true });
  }

  // demo previews: scale a 1280px iframe into .demo__vp at 721px+
  var vps = $$('.demo__vp');
  if (vps.length && 'ResizeObserver' in w) {
    var big = mq('(min-width: 721px)');
    var fit = function (vp) {
      if (!big.matches) {
        vp.classList.remove('is-scaled');
        vp.style.removeProperty('--s'); vp.style.removeProperty('--travel');
        return;
      }
      vp.classList.add('is-scaled');
      var s = vp.clientWidth / 1280;
      if (!s) return;
      vp.style.setProperty('--s', s.toFixed(5));
      vp.style.setProperty('--travel', Math.max(0, Math.round(2400 - vp.clientHeight / s)));
    };
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target); }); });
    vps.forEach(function (vp) { fit(vp); ro.observe(vp); });
    var refit = function () { vps.forEach(fit); };
    if (big.addEventListener) big.addEventListener('change', refit); else if (big.addListener) big.addListener(refit);
  }

  // copy buttons: <button data-copy="text" hidden>
  var copies = $$('[data-copy]');
  if (copies.length && navigator.clipboard && w.isSecureContext) {
    var live = d.createElement('p');
    live.className = 'sr';
    live.setAttribute('role', 'status');
    d.body.appendChild(live);
    copies.forEach(function (b) {
      b.hidden = false;
      var textNode = null;
      Array.prototype.forEach.call(b.childNodes, function (n) { if (n.nodeType === 3 && n.nodeValue.trim()) textNode = n; });
      if (!textNode) { textNode = d.createTextNode(''); b.appendChild(textNode); }
      var original = textNode.nodeValue, timer = 0;
      var use = b.querySelector('use'), href = use && use.getAttribute('href');
      b.addEventListener('click', function () {
        navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
          textNode.nodeValue = 'Copied';
          if (use) use.setAttribute('href', href.replace(/#i-[\w-]+$/, '#i-check'));
          live.textContent = 'Copied to clipboard';
          clearTimeout(timer);
          timer = setTimeout(function () {
            textNode.nodeValue = original;
            if (use) use.setAttribute('href', href);
            live.textContent = '';
          }, 2000);
        }, function () { live.textContent = 'Copy failed. Please select the text instead.'; });
      });
    });
  } else {
    copies.forEach(function (b) { b.hidden = true; });
  }

  // hero parallax on .stage .rig
  var stage = d.querySelector('.stage'), rig = stage && stage.querySelector('.rig');
  if (rig && mq('(hover: hover) and (pointer: fine)').matches) {
    var BX = 8, BY = -16, cur = { x: BX, y: BY }, tgt = { x: BX, y: BY }, pRaf = 0;
    var step = function () {
      cur.x += (tgt.x - cur.x) * 0.08;
      cur.y += (tgt.y - cur.y) * 0.08;
      rig.style.setProperty('--rx', cur.x.toFixed(3) + 'deg');
      rig.style.setProperty('--ry', cur.y.toFixed(3) + 'deg');
      if (Math.abs(tgt.x - cur.x) > 0.01 || Math.abs(tgt.y - cur.y) > 0.01) pRaf = w.requestAnimationFrame(step);
      else pRaf = 0;
    };
    var kick = function () { if (!pRaf) pRaf = w.requestAnimationFrame(step); };
    stage.addEventListener('pointermove', function (e) {
      if (!motionOK.matches || !mq('(min-width: 641px)').matches) return;
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      tgt.y = BY + px * 8;
      tgt.x = BX - py * 6;
      rig.style.transition = 'none';
      kick();
    });
    stage.addEventListener('pointerleave', function () { tgt.x = BX; tgt.y = BY; kick(); });
  }
  // free mock-up nudge: one small dismissible card per visit, never on form pages
  (function () {
    var mock = d.querySelector('.h-mock');
    var path = w.location.pathname;
    if (!mock || /\/(mock-up|start|care|privacy|terms|accessibility)(\/|$)/.test(path)) return;
    try { if (w.sessionStorage.getItem('pd_nudge')) return; } catch (e) {}
    var card, shown = false, opener;
    function close(remember) {
      if (!card) return;
      card.classList.remove('is-in');
      var c = card; card = null;
      setTimeout(function () { c.remove(); }, 300);
      if (remember) try { w.sessionStorage.setItem('pd_nudge', '1'); } catch (e) {}
      d.removeEventListener('keydown', onKey);
      if (opener && opener.isConnected) opener.focus();
    }
    function onKey(e) { if (e.key === 'Escape') close(true); }
    function show() {
      if (shown || root.classList.contains('menu-open')) return;
      shown = true;
      opener = d.activeElement !== d.body ? d.activeElement : null;
      card = d.createElement('aside');
      card.className = 'nudge dark';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-labelledby', 'nudge-t');
      card.innerHTML = '<button type="button" class="nudge__x" aria-label="Close">&times;</button>' +
        '<p class="nudge__k">Free, no obligation</p>' +
        '<h2 id="nudge-t" class="nudge__t">See your website before you pay a penny</h2>' +
        '<p class="nudge__p">Send me your business name and I\u2019ll make you a free one-page mock-up.</p>' +
        '<div class="nudge__a"><a class="btn btn-white btn-sm" href="' + mock.getAttribute('href') + '">Get my free mock-up</a>' +
        '<button type="button" class="nudge__n">Not now</button></div>';
      d.body.appendChild(card);
      card.querySelector('.nudge__x').addEventListener('click', function () { close(true); });
      card.querySelector('.nudge__n').addEventListener('click', function () { close(true); });
      card.querySelector('a').addEventListener('click', function () { try { w.sessionStorage.setItem('pd_nudge', '1'); } catch (e) {} });
      d.addEventListener('keydown', onKey);
      w.requestAnimationFrame(function () { card.classList.add('is-in'); });
    }
    // after 20s on the page, or once they have read about half of it
    var t = setTimeout(show, 20000);
    w.addEventListener('scroll', function f() {
      if (w.scrollY > (root.scrollHeight - w.innerHeight) * 0.5) { w.removeEventListener('scroll', f); clearTimeout(t); setTimeout(show, 800); }
    }, { passive: true });
  })();
})();
