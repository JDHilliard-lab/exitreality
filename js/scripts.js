/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
   - Loading bar for page and video content
   - Swipe gestures for slide slideshows
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

  /*** LOADING BAR ***/
  (function initLoadingBar() {
    // Create loading bar element
    const loadingBar = document.createElement('div');
    loadingBar.id = 'loading-bar';
    document.body.insertBefore(loadingBar, document.body.firstChild);

    let progress = 0;
    let totalVideos = 0;
    let loadedVideos = 0;
    let totalImages = 0;
    let loadedImages = 0;

    function updateProgress() {
      const totalMedia = totalVideos + totalImages;
      const loadedMedia = loadedVideos + loadedImages;
      
      if (totalMedia === 0) {
        progress = 100;
      } else {
        progress = (loadedMedia / totalMedia) * 100;
      }
      
      loadingBar.style.width = progress + '%';
      
      if (progress >= 100) {
        setTimeout(() => {
          loadingBar.classList.add('complete');
          setTimeout(() => {
            loadingBar.remove();
          }, 300);
        }, 200);
      }
    }

    function trackVideos() {
      const videos = document.querySelectorAll('video');
      totalVideos = videos.length;

      if (totalVideos === 0) {
        updateProgress();
        return;
      }

      videos.forEach(video => {
        // Check if video is already loaded
        if (video.readyState >= 3) {
          loadedVideos++;
          updateProgress();
        } else {
          video.addEventListener('canplaythrough', function onLoad() {
            loadedVideos++;
            updateProgress();
            video.removeEventListener('canplaythrough', onLoad);
          }, { once: true });

          video.addEventListener('error', function onError() {
            loadedVideos++;
            updateProgress();
            video.removeEventListener('error', onError);
          }, { once: true });
        }
      });
    }

    function trackImages() {
      const images = document.querySelectorAll('img');
      totalImages = images.length;

      if (totalImages === 0) {
        updateProgress();
        return;
      }

      images.forEach(img => {
        if (img.complete) {
          loadedImages++;
          updateProgress();
        } else {
          img.addEventListener('load', function onLoad() {
            loadedImages++;
            updateProgress();
            img.removeEventListener('load', onLoad);
          }, { once: true });

          img.addEventListener('error', function onError() {
            loadedImages++;
            updateProgress();
            img.removeEventListener('error', onError);
          }, { once: true });
        }
      });
    }

    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        trackVideos();
        trackImages();
      });
    } else {
      trackVideos();
      trackImages();
    }

    // Fallback: ensure bar completes even if something fails
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (progress < 100) {
          progress = 100;
          updateProgress();
        }
      }, 500);
    });
  })();

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

/*** 5) Global Slideshow Support (fade + slide variant) ***/
function initSlideshows() {
  document.querySelectorAll('.slideshow').forEach(function (root) {
    var slides = Array.prototype.slice.call(
      root.querySelectorAll('.slideshow__image')
    );
    var prevBtn = root.querySelector('.slideshow__arrow--prev');
    var nextBtn = root.querySelector('.slideshow__arrow--next');
    if (!slides.length) return;

    // Is this the side-to-side sliding version?
    var isSlide = root.classList.contains('slideshow--slide');

    // Find initial active slide
    var index = slides.findIndex(function (s) {
      return s.classList.contains('active');
    });
    if (index < 0) {
      index = 0;
      slides[0].classList.add('active');
    }

    // For slide variant: arrange slides side-by-side as a track
    function layout() {
      if (!isSlide) return; // fade version doesn't use transform

      slides.forEach(function (slide, idx) {
        var offset = idx - index; // 0 = current, -1 = left, +1 = right
        // Use translate3d for better rendering and to avoid subpixel gaps
        slide.style.transform = 'translate3d(' + (offset * 100) + '%, 0, 0)';
        slide.style.webkitTransform = 'translate3d(' + (offset * 100) + '%, 0, 0)';
      });
    }

    // Enable/disable arrows at the ends for slide mode
    function updateArrows() {
      if (!isSlide) return;
      if (prevBtn) prevBtn.disabled = (index === 0);
      if (nextBtn) nextBtn.disabled = (index === slides.length - 1);
    }

    function show(nextIndex) {
      if (isSlide) {
        // Clamp instead of wrap
        if (nextIndex < 0 || nextIndex >= slides.length) return;
      } else {
        // Wrap-around behavior for non-slide (fade) slideshows
        nextIndex = (nextIndex + slides.length) % slides.length;
      }

      if (nextIndex === index) return;

      slides[index].classList.remove('active');
      index = nextIndex;
      slides[index].classList.add('active');

      layout();
      updateArrows();
    }
     // AUTOPLAY – ONLY for slide variant (smooth bouncing)
if (isSlide) {
  var direction = 1; // 1 = forward, -1 = backward

  var autoTimer = setInterval(function () {

    // If at the last slide, reverse direction
    if (index === slides.length - 1) {
      direction = -1;
    }

    // If at the first slide, reverse direction
    if (index === 0) {
      direction = 1;
    }

    show(index + direction);

  }, 4000); // autoplay speed in ms

  // Pause autoplay on hover
  root.addEventListener('mouseenter', function () {
    clearInterval(autoTimer);
  });

  // Resume on un-hover
  root.addEventListener('mouseleave', function () {
    autoTimer = setInterval(function () {
      if (index === slides.length - 1) direction = -1;
      if (index === 0) direction = 1;
      show(index + direction);
    }, 4000);
  });
}


    // Initial setup
    layout();
    updateArrows();

    // Prev/Next arrows
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        show(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        show(index + 1);
      });
    }

    // Keyboard control
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    // Autoplay only for non-slide (fade) slideshows
    if (!isSlide) {
      var autoplayMs = 6000;
      var timer = setInterval(function () {
        show(index + 1);
      }, autoplayMs);

      root.addEventListener('mouseenter', function () {
        clearInterval(timer);
      });

      root.addEventListener('mouseleave', function () {
        timer = setInterval(function () {
          show(index + 1);
        }, autoplayMs);
      });
    }

    // Add swipe gesture support for slide variant
    if (isSlide) {
      let touchStartX = 0;
      let touchEndX = 0;
      
      root.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      root.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
      
      function handleSwipe() {
        const swipeThreshold = 50; // Minimum distance for swipe
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            // Swiped left - go to next
            if (nextBtn && !nextBtn.disabled) {
              show(index + 1);
            }
          } else {
            // Swiped right - go to previous
            if (prevBtn && !prevBtn.disabled) {
              show(index - 1);
            }
          }
        }
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', initSlideshows);


})();
