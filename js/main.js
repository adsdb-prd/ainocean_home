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
    if (window.innerWidth < 768) return false;
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
})();
