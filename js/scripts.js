
/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
*/

(function () {
  'use strict';

  /*** Utils ***/
  function debounce(fn, wait) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), wait);
    };
  }

  /*** 1) Dynamic --nav-h CSS variable ***/
  function setNavHeightVar() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var h = nav.offsetHeight || 0;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  // Set once and on resize (debounced)
  window.addEventListener('load', setNavHeightVar);
  window.addEventListener('resize', debounce(setNavHeightVar, 150));

  /*** 2) Base-path safeguard (home preserves hashes) ***/
  function basePathSafeguard() {
    try {
      var parts = window.location.pathname.split('/').filter(Boolean);
      var base = parts.length ? '/' + parts[0] : '';
      var here = window.location.pathname || '/';
      var isHome = here === '/' || here.endsWith('/index.html') || here === (base + '/');

      document.querySelectorAll('nav a').forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href) return;

        var low = href.toLowerCase();
        var isHashOnly  = href.charAt(0) === '#';
        var isIndex     = low === 'index.html' || low === './index.html' || low === '/index.html';
        var isIndexHash = low.indexOf('index.html#') === 0 || low.indexOf('./index.html#') === 0 || low.indexOf('/index.html#') === 0;
        var isLogo = link.classList.contains('logo');

        // Logo: keep as-is on homepage (lets #hero smooth scroll); send to root from subpages
        if (isLogo) {
          if (!isHome && !isHashOnly) {
            link.setAttribute('href', base || '/');
          }
          return;
        }

        // Canonicalize explicit index.html
        if (isIndex) {
          link.setAttribute('href', base || '/');
          return;
        }

        // On the homepage: leave hash links alone for native smooth scroll
        if (isHome && isHashOnly) {
          return;
        }

        // On subpages: route hash-only or index.html#... back to homepage
        if (!isHome && (isHashOnly || isIndexHash)) {
          var anchor = isHashOnly ? href.slice(1) : (href.split('#')[1] || '');
          link.setAttribute('href', (base ? base : '') + '/index.html' + (anchor ? ('#' + anchor) : ''));
        }
      });
    } catch (e) {
      if (window.console && console.warn) console.warn('Nav safeguard error:', e);
    }
  }
  // Run once on load
  window.addEventListener('DOMContentLoaded', basePathSafeguard);

  /*** 3) Smooth scroll with fixed-nav offset (homepage only) ***/
  function getNavHeight() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h').trim();
    var n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }

  function smoothScrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var navH = getNavHeight();
    var target = window.scrollY + rect.top - (navH || 0);
    window.scrollTo({ top: target, behavior: 'smooth' });
  }

  function interceptHashClicks() {
    var here = window.location.pathname || '/';
    var parts = here.split('/').filter(Boolean);
    var base = parts.length ? '/' + parts[0] : '';
    var isHome = here === '/' || here.endsWith('/index.html') || here === (base + '/');
    if (!isHome) return; // Only intercept on homepage

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var id = href.slice(1);
        if (!id) return;
        e.preventDefault();
        smoothScrollToId(id);
        history.pushState(null, '', '#' + id);
      });
    });
  }
  window.addEventListener('DOMContentLoaded', interceptHashClicks);

  /*** 4) Correct deep links on load/hashchange (fixed-nav offset) ***/
  function correctInitialHash() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var id = hash.slice(1);
    // Delay to allow layout to settle
    setTimeout(function () { smoothScrollToId(id); }, 0);
  }
  window.addEventListener('load', correctInitialHash);
  window.addEventListener('hashchange', function () {
    var id = (window.location.hash || '').replace(/^#/, '');
    if (!id) return;
    smoothScrollToId(id);
  });

})();
