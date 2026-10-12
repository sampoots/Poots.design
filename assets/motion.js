// Poots Design — shared motion layer. No dependencies.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header shadow on scroll
  var header = document.querySelector('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('pd-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Highlight the menu link for the section in view
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav a[href*="#"]'))
    .filter(function (a) { return a.getAttribute('href').indexOf('#') === 0; });
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && byId[e.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('pd-active'); });
          byId[e.target.id].classList.add('pd-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  if (reduce || !('IntersectionObserver' in window)) return;

  // Scroll reveal: only for content below the first screen, so nothing visible flickers
  var selector = [
    'section .head', 'section > .wrap > h2', 'section .sub',
    '.card', '.price-card', '.demo', '.step', '.box', '.addon', '.preview',
    '.areas li', '.item', '.offer', '.note', '.cta .wrap > *', '.cta-band .wrap > *',
    '.story > *', '.booking > *', '.menu h3',
    '.quality', '.promise li', '.quote'
  ].join(',');
  var items = Array.prototype.slice.call(document.querySelectorAll(selector))
    .filter(function (el) { return !el.closest('.hero') && el.getBoundingClientRect().top > window.innerHeight; });

  // Stagger siblings that sit in the same row/grid
  var groups = new Map();
  items.forEach(function (el) {
    var list = groups.get(el.parentNode) || [];
    list.push(el);
    groups.set(el.parentNode, list);
  });
  groups.forEach(function (list) {
    list.forEach(function (el, i) { el.style.setProperty('--pd-delay', Math.min(i, 6) * 0.08 + 's'); });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var el = e.target;
        el.classList.add('pd-in');
        io.unobserve(el);
        // Once it has appeared, hand back to normal hover transitions
        var delay = parseFloat(el.style.getPropertyValue('--pd-delay')) || 0;
        setTimeout(function () {
          el.classList.remove('pd-reveal', 'pd-in');
          el.style.removeProperty('--pd-delay');
        }, 900 + delay * 1000);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach(function (el) {
    el.classList.add('pd-reveal');
    io.observe(el);
  });
})();
