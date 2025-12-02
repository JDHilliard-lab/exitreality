/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
   - Loading bar for page and video content
   - Swipe gestures for slide slideshows
   - Parallax scrolling effect (works on mobile and desktop with 1920x1080 images)
   - Scroll-driven video (360° rotation effect) with mobile debugging
   - Before/After slider functionality
   - Mobile video controls
   - Navbar injection
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
        // Skip scroll-video from loading bar (loads separately)
        if (video.classList.contains('scroll-video')) {
          totalVideos--;
          if (totalVideos === 0) updateProgress();
          return;
        }

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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        trackVideos();
        trackImages();
      });
    } else {
      trackVideos();
      trackImages();
    }

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
    const nav = document.querySelector('nav');
    if (!nav) return;
    const h = nav.offsetHeight || 0;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  
  window.addEventListener('load', setNavHeightVar);
  window.addEventListener('resize', debounce(setNavHeightVar, 150));

  /*** 2) Base-path safeguard (home preserves hashes) ***/
  function basePathSafeguard() {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const base = parts.length ? '/' + parts[0] : '';
      const here = window.location.pathname || '/';
      const isHome = here === '/' || here.endsWith('/index.html') || here === (base + '/');

      document.querySelectorAll('nav a').forEach(function (link) {
        const href = link.getAttribute('href');
        if (!href) return;

        const low = href.toLowerCase();
        const isHashOnly = href.charAt(0) === '#';
        const isIndex = low === 'index.html' || low === './index.html' || low === '/index.html';
        const isIndexHash = low.indexOf('index.html#') === 0 || low.indexOf('./index.html#') === 0 || low.indexOf('/index.html#') === 0;
        const isLogo = link.classList.contains('logo');

        if (isLogo) {
          if (!isHome && !isHashOnly) {
            link.setAttribute('href', base || '/');
          }
          return;
        }

        if (isIndex) {
          link.setAttribute('href', base || '/');
          return;
        }

        if (isHome && isHashOnly) {
          return;
        }

        if (!isHome && (isHashOnly || isIndexHash)) {
          const anchor = isHashOnly ? href.slice(1) : (href.split('#')[1] || '');
          link.setAttribute('href', (base ? base : '') + '/index.html' + (anchor ? ('#' + anchor) : ''));
        }
      });
    } catch (e) {
      if (window.console && console.warn) console.warn('Nav safeguard error:', e);
    }
  }
  
  window.addEventListener('DOMContentLoaded', basePathSafeguard);

  /*** 3) Smooth scroll with fixed-nav offset (homepage only) ***/
  function getNavHeight() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h').trim();
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }

  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const navH = getNavHeight();
    const target = window.scrollY + rect.top - (navH || 0);
    window.scrollTo({ top: target, behavior: 'smooth' });
  }

  function interceptHashClicks() {
    const here = window.location.pathname || '/';
    const parts = here.split('/').filter(Boolean);
    const base = parts.length ? '/' + parts[0] : '';
    const isHome = here === '/' || here.endsWith('/index.html') || here === (base + '/');
    if (!isHome) return;

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const id = href.slice(1);
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
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = hash.slice(1);
    setTimeout(function () { smoothScrollToId(id); }, 0);
  }
  
  window.addEventListener('load', correctInitialHash);
  window.addEventListener('hashchange', function () {
    const id = (window.location.hash || '').replace(/^#/, '');
    if (!id) return;
    smoothScrollToId(id);
  });

  //*** 5) Global Slideshow Support - WITH PHYSICS DRAG ***/
function initSlideshows() {
  document.querySelectorAll('.slideshow').forEach(function (root) {
    const slides = Array.from(root.querySelectorAll('.slideshow__image'));
    const prevBtn = root.querySelector('.slideshow__arrow--prev');
    const nextBtn = root.querySelector('.slideshow__arrow--next');
    if (!slides.length) return;

    const isSlide = root.classList.contains('slideshow--slide');

    // Use existing physics-drag logic for the sliding variant
    if (isSlide) {
      initPhysicsDrag(root, slides, prevBtn, nextBtn);
      return;
    }

    // ===== Regular FADE slideshow with smart autoplay pause/resume =====
    let index = slides.findIndex(s => s.classList.contains('active'));
    if (index < 0) {
      index = 0;
      slides[0].classList.add('active');
    }

    function show(nextIndex) {
      nextIndex = (nextIndex + slides.length) % slides.length;
      if (nextIndex === index) return;

      slides[index].classList.remove('active');
      index = nextIndex;
      slides[index].classList.add('active');
    }

    const autoplayMs = 6000; // autoplay interval
    let timer = null;
    let isInteracting = false;
    let idleTimeout = null;

    function startAutoplay() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        // Do not advance while the user is actively interacting
        if (isInteracting) return;
        show(index + 1);
      }, autoplayMs);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Call when user clicks arrows or uses keyboard
    function userInteracted() {
      isInteracting = true;
      stopAutoplay();

      // Restart autoplay after a period of no interaction
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(function () {
        isInteracting = false;
        startAutoplay();
      }, autoplayMs); // change this delay if you want faster/slower resume
    }

    // Arrow buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        userInteracted();
        show(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        userInteracted();
        show(index + 1);
      });
    }

    // Keyboard navigation
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        userInteracted();
        show(index - 1);
      }
      if (e.key === 'ArrowRight') {
        userInteracted();
        show(index + 1);
      }
    });

    // Hover: pause while hovered, resume when mouse leaves (if not interacting)
    root.addEventListener('mouseenter', function () {
      stopAutoplay();
    });

    root.addEventListener('mouseleave', function () {
      if (!isInteracting) {
        startAutoplay();
      }
    });

    // Kick off autoplay
    startAutoplay();
  });
}


  window.addEventListener('DOMContentLoaded', initSlideshows);

  /*** 6) Parallax scrolling effect - Works on both desktop and mobile ***/
  (function initParallax() {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    
    if (parallaxSections.length === 0) return;
    
    const isMobile = window.innerWidth <= 768;
    const mobileMultiplier = 0.2;
    
    function handleScroll() {
      parallaxSections.forEach(section => {
        const layers = section.querySelectorAll('.parallax-layer');
        const rect = section.getBoundingClientRect();
        const scrolled = rect.top;
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          layers.forEach((layer, index) => {
            let speed = layer.dataset.speed ? parseFloat(layer.dataset.speed) : (index + 1) * 0.3;
            
            if (isMobile) {
              speed *= mobileMultiplier;
            }
            
            const yPos = -(scrolled * speed);
            layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
          });
        }
      });
    }
    
    let ticking = false;
    
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    handleScroll();
  })();

/*** 7) Scroll-Driven Video (360° rotation effect) - SMOOTHED & FIXED ***/
(function initScrollVideo() {
  const sections = document.querySelectorAll('.scroll-video-section');
  if (!sections.length) return;

  sections.forEach((section, index) => {
    const container = section.querySelector('.scroll-video-container');
    const video = section.querySelector('.scroll-video');
    if (!video || !container) return;

    // 1. Setup Video Properties
    video.pause();
    video.currentTime = 0;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    
    // 2. State for Smoothing (Lerp)
    let targetTime = 0;
    let currentTime = 0;
    let isRenderLoopRunning = false;
    
    // Physics constant: Lower = smoother/slower catchup (0.05), Higher = snappier (0.2)
    const smoothFactor = 0.1; 

    // 3. Render Loop (Decouples scroll from video update for smoothness)
    function render() {
      // Calculate difference between where we are and where we want to be
      const diff = targetTime - currentTime;
      
      // If difference is small enough, stop the loop to save battery
      if (Math.abs(diff) < 0.01) {
        isRenderLoopRunning = false;
        return; 
      }

      // Ease current time towards target
      currentTime += diff * smoothFactor;
      
      // Safety check for video duration
      if (video.duration) {
         video.currentTime = Math.max(0, Math.min(currentTime, video.duration));
      }

      requestAnimationFrame(render);
    }

    // 4. Start Smoothing Loop
    function startRenderLoop() {
      if (!isRenderLoopRunning) {
        isRenderLoopRunning = true;
        render();
      }
    }

    // 5. Scroll Handler
  function handleScroll() {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Calculate when the video is actually "stuck"
      // It sticks when rect.top hits the calculated center offset
      
      // We start playing when the section top enters the viewport
      const start = viewportHeight;
      // We finish playing when the bottom of the section leaves the viewport
      const end = -sectionHeight;
      
      // Calculate raw progress (0 to 1)
      let progress = (start - rect.top) / (start - end);
      
      // TIGHTEN THE PLAYBACK:
      // 0.2 = wait until it's 20% up the screen to start moving
      // 0.8 = finish playing before it completely leaves
      // This ensures it plays mostly while "Centered/Stuck"
      const buffer = 0.2; 
      
      // Remap progress to ignore the entry/exit edges
      progress = (progress - buffer) / (1 - (buffer * 2));
      
      // Clamp between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, progress));

      if (video.duration) {
        targetTime = clampedProgress * video.duration;
        startRenderLoop();
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial Trigger
    if (video.readyState >= 1) {
      handleScroll();
    } else {
      video.addEventListener('loadedmetadata', handleScroll);
    }
  });
})();
/*** 8) Auto-load correct scroll video based on screen size (ALL .scroll-video) ***/
(function initScrollVideoSource() {
  function updateAllScrollVideos() {
    const isMobile = window.innerWidth <= 768;
    const videos = document.querySelectorAll('.scroll-video');
    if (!videos.length) return;

    videos.forEach(video => {
      const firstSource = video.querySelector('source');
      if (!firstSource) return;

      const originalSrc = firstSource.getAttribute('src');
      if (!originalSrc) return;

      const lastSlash = originalSrc.lastIndexOf('/');
      const directory = originalSrc.substring(0, lastSlash + 1);
      const filename  = originalSrc.substring(lastSlash + 1);

      // Strip known suffixes, then rebuild desktop + mobile names
      const baseFilename = filename
        .replace('-desktop', '')
        .replace('_mobile', '')
        .replace('-mobile-square', '')
        .replace('.mp4', '');

      const desktopSrc = directory + baseFilename + '-desktop.mp4';
      const mobileSrc  = directory + baseFilename + '-mobile-square.mp4';
      const correctSrc = isMobile ? mobileSrc : desktopSrc;

      if (originalSrc !== correctSrc) {
        const currentTime = video.currentTime || 0;
        firstSource.setAttribute('src', correctSrc);
        video.load();
        try {
          video.currentTime = currentTime;
        } catch (e) {
          // ignore if seek fails early
        }
        console.log('🎥 Updated scroll-video src to', correctSrc);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAllScrollVideos);
  } else {
    updateAllScrollVideos();
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateAllScrollVideos, 250);
  });
})();


/*** 9) Before/After Slider ***/
(function initBeforeAfterSliders() {
  function init() {
    document.querySelectorAll('.ba').forEach((root) => {
      const range = root.querySelector('.ba__range');
      const setPct = (p) => {
        const clamped = Math.max(0, Math.min(100, p));
        root.style.setProperty('--x', clamped + '%');
        range.value = clamped;
      };
      const toPctFromClientX = (clientX) => {
        const rect = root.getBoundingClientRect();
        return ((clientX - rect.left) / rect.width) * 100;
      };
      const onPointerDown = (e) => {
        setPct(toPctFromClientX(e.clientX));
        const onMove = (ev) => setPct(toPctFromClientX(ev.clientX));
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };
      root.addEventListener('mousedown', onPointerDown);
      root.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        setPct(toPctFromClientX(t.clientX));
      }, { passive: true });
      root.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        setPct(toPctFromClientX(t.clientX));
      }, { passive: true });
      range.addEventListener('input', (e) => setPct(parseFloat(e.target.value)));
      setPct(parseFloat(range.value) || 50);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/*** 10) Hide video controls on mobile until user taps ***/
(function initMobileVideoControls() {
  function init() {
    if (window.innerWidth <= 768) {
      const videos = document.querySelectorAll('.full-image video');
      
      videos.forEach(video => {
        video.removeAttribute('controls');
        
        video.addEventListener('click', function() {
          this.setAttribute('controls', '');
          this.classList.add('show-controls');
        }, { once: true });
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/*** 11) Inject shared navbar ***/
(function injectNavbar() {
  function loadNavbar() {
    fetch('navbar.html')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var mount = document.getElementById('navbar-placeholder');
        if (mount) mount.innerHTML = html;
      })
      .catch(function (e) { console.error('Navbar load failed:', e); });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
})();
   
/*** 12) Center hint for slideshows & BA on mobile ***/
(function initCenterHints() {
  function init() {
    if (window.innerWidth > 768) return; // mobile only

    const blocks = Array.from(document.querySelectorAll('.slideshow, .ba'));
    if (!blocks.length) return;

    function updateAll() {
      const viewportCenter = window.innerHeight / 2;
      const tolerance = 100; // px around center

      blocks.forEach(block => {
        const rect = block.getBoundingClientRect();
        const inCenter =
          rect.top <= viewportCenter + tolerance &&
          rect.bottom >= viewportCenter - tolerance;

        if (inCenter) {
          block.classList.add('is-centered');
        } else {
          block.classList.remove('is-centered');
        }
      });
    }

    updateAll();
    window.addEventListener('scroll', updateAll, { passive: true });
    window.addEventListener('resize', updateAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

})()
