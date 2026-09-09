/* ==========================================================================
   Ainocean - site behaviour
   1) header: solid background once the page is scrolled
   2) mobile menu toggle
   3) active nav link based on the section in view
   4) background video: only fetched on wide screens / non-metered connections
   ========================================================================== */
(function () {
  'use strict';

  var hdr = document.querySelector('.hdr');
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.menu');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));

  /* ---------- 1) header background on scroll ---------- */
  function onScroll() {
    if (!hdr) return;
    if (window.scrollY > 24) hdr.classList.add('solid');
    else hdr.classList.remove('solid');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2) mobile menu ---------- */
  function closeMenu() {
    if (!menu || !burger) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // tapping a link closes the panel
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    // clicking outside, pressing Escape, or growing past the breakpoint closes it
    document.addEventListener('click', function (e) {
      if (!hdr.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- 3) active nav link ---------- */
  var targets = navLinks
    .map(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = id ? document.getElementById(id) : null;
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var visible = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        var current = null;
        targets.forEach(function (t) {
          if (visible[t.el.id]) current = current || t;
        });
        navLinks.forEach(function (a) {
          a.classList.remove('active');
        });
        if (current) current.link.classList.add('active');
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    targets.forEach(function (t) {
      io.observe(t.el);
    });
  }

  /* ---------- 4) background video ---------- */
  // The two hero/contact videos are decoration. On narrow screens, on metered
  // connections, or when the visitor prefers reduced motion we simply leave the
  // poster image in place and never download the file.
  function videoAllowed() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      if (c.saveData) return false;
      if (/^(slow-)?2g$/.test(c.effectiveType || '')) return false;
    }
    return true;
  }

  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-src]'));

  function loadVideo(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    v.src = v.dataset.src;
    var p = v.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay blocked: poster stays */ });
  }

  if (videos.length && videoAllowed()) {
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              loadVideo(entry.target);
              vio.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px 0px' }
      );
      videos.forEach(function (v) { vio.observe(v); });
    } else {
      videos.forEach(loadVideo);
    }
  }

  /* ---------- 5) remember the visitor's language choice ---------- */
  // Keeps the KR/EN switch pointing at the same page after a reload.
  var langLinks = document.querySelectorAll('.lang a');
  Array.prototype.forEach.call(langLinks, function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('ain-lang', a.dataset.lang || ''); } catch (err) { /* private mode */ }
    });
  });

  /* ---------- 6) reveal elements as they scroll into view ---------- */
  // Classes are added here rather than in the markup, so with JS disabled
  // everything simply stays visible.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce && 'IntersectionObserver' in window) {
    var groups = [
      '#ain-app .hd',
      '#ain-app .card',
      '#ain-app .pl > div',
      '#ain-app .mc',
      '#ain-app .nc',
      '#ain-app .cap',
      '#ain-app .note',
      '#ain-app .ecow',
      '#ain-app .mq',
      '#ain-app .na',
      '#ain-app .rt > div',
      '#ain-app .fin h2',
      '#ain-app .fin .lead',
      '#ain-app .fin .btn',
      '#ain-app .fg > div'
    ];

    var items = [];
    groups.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        if (el.closest('.hero')) return;          // the hero is already on screen
        if (items.indexOf(el) === -1) items.push(el);
      });
    });

    // Stagger siblings that share a parent so rows of cards cascade.
    var seen = {};
    items.forEach(function (el) {
      el.classList.add('rv');
      var key = el.parentNode.className + '|' + el.parentNode.tagName;
      seen[key] = (seen[key] || 0) + 1;
      var i = seen[key] - 1;
      if (i > 0) el.style.transitionDelay = Math.min(i * 0.09, 0.45) + 's';
    });

    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          rio.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    items.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- 7) timeline: draw the rail left to right on arrival ---------- */
  var tls = document.querySelectorAll('#ain-app .tl');
  if (tls.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(tls, function (t) { t.classList.add('in'); });
    } else {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            tio.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -20% 0px', threshold: 0.15 });
      Array.prototype.forEach.call(tls, function (t) { tio.observe(t); });
    }
  }

  /* ---------- 8) model cards: freeze the collapsed height ---------- */
  // The three cards used to stretch to the tallest sibling, so opening one
  // disclosure made every card grow and pushed the closed chevrons down.
  // Instead the grid no longer stretches and each card gets a min-height
  // measured with all panels collapsed: opening one card grows only that card.
  function sizeModelCards() {
    Array.prototype.forEach.call(document.querySelectorAll('#ain-app .mdl'), function (grid) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.mc'));
      if (!cards.length) return;

      cards.forEach(function (c) { c.style.minHeight = ''; });

      // single column on phones: equal heights would only add empty space
      if (window.innerWidth <= 900) return;

      // measure and restore within one frame, so this is never painted
      grid.classList.add('measuring');
      var tallest = 0;
      cards.forEach(function (c) {
        tallest = Math.max(tallest, c.getBoundingClientRect().height);
      });
      grid.classList.remove('measuring');

      if (tallest > 0) {
        var h = Math.ceil(tallest) + 'px';
        cards.forEach(function (c) { c.style.minHeight = h; });
      }
    });
  }

  sizeModelCards();
  window.addEventListener('load', sizeModelCards);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sizeModelCards).catch(function () {});
  }
  var mcTimer;
  window.addEventListener('resize', function () {
    clearTimeout(mcTimer);
    mcTimer = setTimeout(sizeModelCards, 150);
  });

  /* ---------- 9) border tracer: size the SVG to the real box ---------- */
  // A rect drawn at the element's pixel size keeps the corner radius circular
  // and lets one dash travel the perimeter at a constant speed.
  function sizeTracers() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tracer]'), function (box) {
      var svg = box.querySelector('.tracer');
      if (!svg) return;
      var r = svg.querySelector('rect');
      if (!r) return;

      var w = box.clientWidth;
      var h = box.clientHeight;
      if (!w || !h) return;

      var sw = 2.5;
      var radius = parseFloat(getComputedStyle(box).borderTopLeftRadius) || 24;
      var rx = Math.min(radius, (w - sw) / 2, (h - sw) / 2);

      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      r.setAttribute('x', sw / 2);
      r.setAttribute('y', sw / 2);
      r.setAttribute('width', w - sw);
      r.setAttribute('height', h - sw);
      r.setAttribute('rx', rx);

      var innerW = w - sw - 2 * rx;
      var innerH = h - sw - 2 * rx;
      var len = 2 * innerW + 2 * innerH + 2 * Math.PI * rx;

      r.style.strokeDasharray = (len * 0.14) + ' ' + (len * 0.86);
      r.style.setProperty('--tr-len', (-len) + 'px');
    });
  }

  sizeTracers();
  window.addEventListener('load', sizeTracers);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(sizeTracers);
    Array.prototype.forEach.call(document.querySelectorAll('[data-tracer]'), function (b) { ro.observe(b); });
  } else {
    window.addEventListener('resize', sizeTracers);
  }
})();
