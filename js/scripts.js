/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
   - Loading bar for page and video content
   - Physics-based drag for slideshows (mobile & desktop)
   - Smart autoplay (pauses on interaction)
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

  /*** 5) Physics-Based Drag Slideshow with Smart Autoplay ***/
  function initPhysicsDrag(root, slides, prevBtn, nextBtn) {
    let index = 0;
    let offsetX = 0;
    let velocity = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let lastX = 0;
    let lastTime = Date.now();
    let animationFrame = null;

    // Autoplay state
    let autoplayTimer = null;
    let isInteracting = false;
    let idleTimeout = null;
    const autoplayMs = 6000;

    const container = document.createElement('div');
    container.className = 'slideshow__track';
    slides.forEach(s => container.appendChild(s));
    root.insertBefore(container, root.firstChild);

    function setTransform(x, transition = false) {
      container.style.transition = transition ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
      container.style.transform = `translateX(${x}px)`;
    }

    function snapToIndex(targetIndex, useVelocity = false) {
      targetIndex = Math.max(0, Math.min(slides.length - 1, targetIndex));
      index = targetIndex;
      const targetX = -index * root.offsetWidth;
      
      if (useVelocity && Math.abs(velocity) > 0.5) {
        const momentumX = targetX + velocity * 50;
        const finalIndex = Math.round(-momentumX / root.offsetWidth);
        index = Math.max(0, Math.min(slides.length - 1, finalIndex));
      }
      
      offsetX = -index * root.offsetWidth;
      setTransform(offsetX, true);
      velocity = 0;
    }

    function animate() {
      if (!isDragging && Math.abs(velocity) > 0.01) {
        velocity *= 0.92;
        offsetX += velocity;
        setTransform(offsetX);
        animationFrame = requestAnimationFrame(animate);
      } else if (!isDragging) {
        const nearestIndex = Math.round(-offsetX / root.offsetWidth);
        snapToIndex(nearestIndex, true);
      }
    }

    // Autoplay functions
    function startAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(() => {
        if (!isInteracting && !isDragging) {
          snapToIndex(index + 1);
        }
      }, autoplayMs);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function userInteracted() {
      isInteracting = true;
      stopAutoplay();

      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        isInteracting = false;
        startAutoplay();
      }, autoplayMs);
    }

    // Mouse/Touch Events
    function onStart(e) {
      userInteracted();
      isDragging = true;
      startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      currentX = startX;
      lastX = startX;
      lastTime = Date.now();
      velocity = 0;
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      
      container.style.transition = 'none';
    }

    function onMove(e) {
      if (!isDragging) return;
      
      currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      const deltaX = currentX - lastX;
      const deltaTime = Date.now() - lastTime;
      
      if (deltaTime > 0) {
        velocity = deltaX / deltaTime * 16;
      }
      
      offsetX += deltaX;
      setTransform(offsetX);
      
      lastX = currentX;
      lastTime = Date.now();
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      animationFrame = requestAnimationFrame(animate);
    }

    // Desktop
    root.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Mobile
    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: true });
    root.addEventListener('touchend', onEnd);

    // Arrow buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        userInteracted();
        snapToIndex(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        userInteracted();
        snapToIndex(index + 1);
      });
    }

    // Hover pause
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', () => {
      if (!isInteracting) startAutoplay();
    });

    // Keyboard
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        userInteracted();
        snapToIndex(index - 1);
      }
      if (e.key === 'ArrowRight') {
        userInteracted();
        snapToIndex(index + 1);
      }
    });

    // Initial position and start autoplay
    snapToIndex(0);
    startAutoplay();
  }

  /*** 6) Global Slideshow Support - Fade & Slide variants ***/
  function initSlideshows() {
    document.querySelectorAll('.slideshow').forEach(function (root) {
      const slides = Array.from(root.querySelectorAll('.slideshow__image'));
      const prevBtn = root.querySelector('.slideshow__arrow--prev');
      const nextBtn = root.querySelector('.slideshow__arrow--next');
      if (!slides.length) return;

      const isSlide = root.classList.contains('slideshow--slide');

      // Use physics drag for sliding variant
      if (isSlide) {
        initPhysicsDrag(root, slides, prevBtn, nextBtn);
        return;
      }

      // ===== FADE slideshow with smart autoplay =====
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

      const autoplayMs = 6000;
      let timer = null;
      let isInteracting = false;
      let idleTimeout = null;

      function startAutoplay() {
        if (timer) clearInterval(timer);
        timer = setInterval(function () {
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

      function userInteracted() {
        isInteracting = true;
        stopAutoplay();

        if (idleTimeout) clearTimeout(idleTimeout);
        idleTimeout = setTimeout(function () {
          isInteracting = false;
          startAutoplay();
        }, autoplayMs);
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

      // Hover: pause while hovered, resume when mouse leaves
      root.addEventListener('mouseenter', stopAutoplay);
      root.addEventListener('mouseleave', function () {
        if (!isInteracting) startAutoplay();
      });

      // Start autoplay
      startAutoplay();
    });
  }

  window.addEventListener('DOMContentLoaded', initSlideshows);

  /*** 7) Parallax scrolling effect ***/
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

/*** 8) Scroll-Driven Video (360° rotation effect) ***/
(function initScrollVideo() {
  const sections = document.querySelectorAll('.scroll-video-section');
  if (!sections.length) return;

  sections.forEach((section, index) => {
    const container = section.querySelector('.scroll-video-container');
    const video = section.querySelector('.scroll-video');
    if (!video || !container) return;

    video.pause();
    video.currentTime = 0;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    
    let targetTime = 0;
    let currentTime = 0;
    let isRenderLoopRunning = false;
    
    const smoothFactor = 0.1; 

    function render() {
      const diff = targetTime - currentTime;
      
      if (Math.abs(diff) < 0.01) {
        isRenderLoopRunning = false;
        return; 
      }

      currentTime += diff * smoothFactor;
      
      if (video.duration) {
         video.currentTime = Math.max(0, Math.min(currentTime, video.duration));
      }

      requestAnimationFrame(render);
    }

    function startRenderLoop() {
      if (!isRenderLoopRunning) {
        isRenderLoopRunning = true;
        render();
      }
    }

    function handleScroll() {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      const start = viewportHeight;
      const end = -sectionHeight;
      
      let progress = (start - rect.top) / (start - end);
      
      const buffer = 0.2; 
      progress = (progress - buffer) / (1 - (buffer * 2));
      const clampedProgress = Math.max(0, Math.min(1, progress));

      if (video.duration) {
        targetTime = clampedProgress * video.duration;
        startRenderLoop();
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    if (video.readyState >= 1) {
      handleScroll();
    } else {
      video.addEventListener('loadedmetadata', handleScroll);
    }
  });
})();

/*** 9) Auto-load correct scroll video based on screen size ***/
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
        } catch (e) {}
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

/*** 10) Before/After Slider ***/
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

/*** 11) Hide video controls on mobile until user taps ***/
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

/*** 12) Inject shared navbar ***/
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
   
/*** 13) Center hint for slideshows & BA on mobile ***/
(function initCenterHints() {
  function init() {
    if (window.innerWidth > 768) return;

    const blocks = Array.from(document.querySelectorAll('.slideshow, .ba'));
    if (!blocks.length) return;

    function updateAll() {
      const viewportCenter = window.innerHeight / 2;
      const tolerance = 100;

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

})();
