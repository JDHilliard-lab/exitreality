/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
   - Loading bar for page and video content
   - Swipe gestures for slide slideshows
   - Parallax scrolling effect (works on mobile and desktop with 1920x1080 images)
   - Scroll-driven video (360° rotation effect) with mobile debugging
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

 /*** 5) Global Slideshow Support - WITH PHYSICS DRAG ***/
function initSlideshows() {
  document.querySelectorAll('.slideshow').forEach(function (root) {
    const slides = Array.from(root.querySelectorAll('.slideshow__image'));
    const prevBtn = root.querySelector('.slideshow__arrow--prev');
    const nextBtn = root.querySelector('.slideshow__arrow--next');
    if (!slides.length) return;

    const isSlide = root.classList.contains('slideshow--slide');

    // For slideshow--slide variant, use physics drag
    if (isSlide) {
      initPhysicsDrag(root, slides, prevBtn, nextBtn);
      return; // Exit early - physics drag handles everything
    }

    // Regular fade slideshow (non-slide variant)
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

    if (prevBtn) prevBtn.addEventListener('click', () => show(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(index + 1));

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    // Autoplay
    const autoplayMs = 6000;
    let timer = setInterval(() => show(index + 1), autoplayMs);
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => {
      timer = setInterval(() => show(index + 1), autoplayMs);
    });
  });
}

/*** Physics-Based Slideshow Drag ***/
function initPhysicsDrag(root, slides, prevBtn, nextBtn) {
  let currentIndex = slides.findIndex(s => s.classList.contains('active'));
  if (currentIndex < 0) currentIndex = 0;

  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let dragOffset = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let animationFrame = null;
  let autoplayTimer = null;

  // Position slides
  function updatePositions(animated = true) {
    slides.forEach((slide, idx) => {
      const offset = (idx - currentIndex) * 100 + dragOffset;
      slide.style.transition = animated ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
      slide.style.transform = `translate3d(${offset}%, 0, 0)`;
      slide.style.webkitTransform = `translate3d(${offset}%, 0, 0)`;
    });
  }

  // Physics animation with friction
  function animate() {
    if (!isDragging && Math.abs(velocity) > 0.1) {
      dragOffset += velocity;
      velocity *= 0.92; // Friction

      const threshold = 30;
      
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0 && currentIndex > 0) {
          goToSlide(currentIndex - 1);
          return;
        } else if (dragOffset < 0 && currentIndex < slides.length - 1) {
          goToSlide(currentIndex + 1);
          return;
        }
      }

      updatePositions(false);
      animationFrame = requestAnimationFrame(animate);
    } else if (!isDragging && dragOffset !== 0) {
      dragOffset = 0;
      velocity = 0;
      updatePositions(true);
    }
  }

  function goToSlide(newIndex) {
    if (newIndex < 0 || newIndex >= slides.length) {
      dragOffset = 0;
      velocity = 0;
      updatePositions(true);
      return;
    }

    slides[currentIndex].classList.remove('active');
    currentIndex = newIndex;
    slides[currentIndex].classList.add('active');
    dragOffset = 0;
    velocity = 0;
    updatePositions(true);

    if (prevBtn) prevBtn.disabled = (currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentIndex === slides.length - 1);
  }

  // DESKTOP: Mouse drag
  function onMouseDown(e) {
    if (e.target.classList.contains('slideshow__arrow')) return;

    pauseAutoplay(); // Pause autoplay while dragging
    isDragging = true;
    startX = e.clientX;
    currentX = e.clientX;
    lastX = e.clientX;
    lastTime = Date.now();
    velocity = 0;
    
    root.style.cursor = 'grabbing';
    
    if (animationFrame) cancelAnimationFrame(animationFrame);

    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;

    currentX = e.clientX;
    const deltaX = currentX - startX;
    const now = Date.now();
    const deltaTime = now - lastTime;

    if (deltaTime > 0) {
      const deltaMove = currentX - lastX;
      velocity = (deltaMove / root.offsetWidth) * 100 / (deltaTime / 16);
    }

    lastX = currentX;
    lastTime = now;

    dragOffset = (deltaX / root.offsetWidth) * 100;
    
    // Edge resistance
    if (currentIndex === 0 && dragOffset > 0) {
      dragOffset *= 0.3;
    } else if (currentIndex === slides.length - 1 && dragOffset < 0) {
      dragOffset *= 0.3;
    }

    updatePositions(false);
  }

  function onMouseUp(e) {
    if (!isDragging) return;

    isDragging = false;
    root.style.cursor = 'grab';
    animationFrame = requestAnimationFrame(animate);
    
    // Resume autoplay after a short delay (after throw animation settles)
    setTimeout(() => {
      resumeAutoplay();
    }, 700);
  }

  // MOBILE: Touch drag
  function onTouchStart(e) {
    pauseAutoplay(); // Pause autoplay while touching
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    currentX = touch.clientX;
    lastX = touch.clientX;
    lastTime = Date.now();
    velocity = 0;

    if (animationFrame) cancelAnimationFrame(animationFrame);
  }

  function onTouchMove(e) {
    if (!isDragging) return;

    const touch = e.touches[0];
    currentX = touch.clientX;
    const deltaX = currentX - startX;
    const now = Date.now();
    const deltaTime = now - lastTime;

    if (deltaTime > 0) {
      const deltaMove = currentX - lastX;
      velocity = (deltaMove / root.offsetWidth) * 100 / (deltaTime / 16);
    }

    lastX = currentX;
    lastTime = now;

    dragOffset = (deltaX / root.offsetWidth) * 100;

    if (currentIndex === 0 && dragOffset > 0) {
      dragOffset *= 0.3;
    } else if (currentIndex === slides.length - 1 && dragOffset < 0) {
      dragOffset *= 0.3;
    }

    updatePositions(false);
  }

  function onTouchEnd(e) {
    if (!isDragging) return;

    isDragging = false;
    animationFrame = requestAnimationFrame(animate);
    
    // Resume autoplay after throw animation settles
    setTimeout(() => {
      resumeAutoplay();
    }, 700);
  }

  // Autoplay - runs constantly but pauses during interaction
  let autoplayTimer = null;
  let isInteracting = false;

  function startAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    
    let direction = 1;
    autoplayTimer = setInterval(() => {
      // Don't autoplay if user is actively interacting
      if (isInteracting) return;
      
      if (currentIndex === slides.length - 1) direction = -1;
      if (currentIndex === 0) direction = 1;
      goToSlide(currentIndex + direction);
    }, 4000);
  }

  function pauseAutoplay() {
    isInteracting = true;
  }

  function resumeAutoplay() {
    isInteracting = false;
  }

  // Event listeners
  root.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  // Pause autoplay on hover, resume on leave
  root.addEventListener('mouseenter', pauseAutoplay);
  root.addEventListener('mouseleave', resumeAutoplay);

  // Arrow buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pauseAutoplay();
      goToSlide(currentIndex - 1);
      // Resume after a moment
      setTimeout(resumeAutoplay, 1000);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pauseAutoplay();
      goToSlide(currentIndex + 1);
      // Resume after a moment
      setTimeout(resumeAutoplay, 1000);
    });
  }

  // Keyboard
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      pauseAutoplay();
      goToSlide(currentIndex - 1);
      setTimeout(resumeAutoplay, 1000);
    }
    if (e.key === 'ArrowRight') {
      pauseAutoplay();
      goToSlide(currentIndex + 1);
      setTimeout(resumeAutoplay, 1000);
    }
  });

  // Initial setup
  root.style.cursor = 'grab';
  updatePositions(false);
  
  if (prevBtn) prevBtn.disabled = (currentIndex === 0);
  if (nextBtn) nextBtn.disabled = (currentIndex === slides.length - 1);
  
  // Start autoplay immediately
  startAutoplay();
}

window.addEventListener('DOMContentLoaded', initSlideshows);
   })();

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

/*** 7) Scroll-Driven Video - CLEAN VERSION (NO FALL) ***/
(function initScrollVideo() {
  const section = document.querySelector('.scroll-video-section');
  const video = document.querySelector('.scroll-video');

  if (!section || !video) return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  let videoReady = false;
  let userInteracted = false;

  // iOS enabler
  function enableIOSVideo() {
    if (userInteracted) return;
    userInteracted = true;
    video.play().then(() => {
      video.pause();
      video.currentTime = 0;
    }).catch(() => {});
  }

  if (isIOS) {
    ['touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, enableIOSVideo, { once: true, passive: true });
    });
  }

  video.addEventListener('loadedmetadata', () => {
    videoReady = true;
  });

  video.addEventListener('loadeddata', () => {
    videoReady = true;
  });

  // Simple scroll progress
  let ticking = false;

  function updateVideo() {
    if (!videoReady || (isIOS && !userInteracted)) {
      ticking = false;
      return;
    }

    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;

    // Progress: 0 when section top enters viewport, 1 when section bottom exits
    const start = windowHeight;
    const end = -sectionHeight;
    const range = start - end;
    let progress = (start - rect.top) / range;
    progress = Math.max(0, Math.min(1, progress));

    // Video only plays in middle portion of scroll
    const playStart = 0.25; // Start playing at 25%
    const playEnd = 0.75;   // Stop playing at 75%
    const playRange = playEnd - playStart;

    let videoProgress = 0;
    
    if (progress < playStart) {
      videoProgress = 0; // Before: stay at start
    } else if (progress <= playEnd) {
      videoProgress = (progress - playStart) / playRange; // During: scrub
    } else {
      videoProgress = 1; // After: stay at end
    }

    if (video.duration && !isNaN(video.duration)) {
      video.currentTime = videoProgress * video.duration;
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateVideo);
      ticking = true;
    }
  }

  // Initialize
  video.load();
  
  video.addEventListener('canplay', () => {
    videoReady = true;
  }, { once: true });

  window.addEventListener('scroll', onScroll, { passive: true });

  video.pause();
})();
   
/*** 8) Auto-load correct scroll video based on screen size ***/
(function initScrollVideoSource() {
  const scrollVideo = document.querySelector('.scroll-video');
  if (!scrollVideo) return;
  
  function loadCorrectVideo() {
    const isMobile = window.innerWidth <= 768;
    
    // Get the base path from the first source tag
    const firstSource = scrollVideo.querySelector('source');
    if (!firstSource) return;
    
    const originalSrc = firstSource.getAttribute('src');
    
    // Extract directory and base filename
    // Example: "BEAST/beast-360-desktop.mp4" or "BEAST/beast-360W_mobile.mp4"
    const lastSlash = originalSrc.lastIndexOf('/');
    const directory = originalSrc.substring(0, lastSlash + 1);
    const filename = originalSrc.substring(lastSlash + 1);
    
    // Construct mobile and desktop filenames
    // Convention: filename-mobile-square.mp4 for mobile, original for desktop
    const baseFilename = filename.replace('-desktop', '').replace('_mobile', '').replace('-mobile-square', '').replace('.mp4', '');
    
    const desktopSrc = directory + baseFilename + '-desktop.mp4';
    const mobileSrc = directory + baseFilename + '-mobile-square.mp4';
    
    const correctSrc = isMobile ? mobileSrc : desktopSrc;
    const currentSrc = firstSource.getAttribute('src');
    
    // Only reload if source needs to change
    if (currentSrc !== correctSrc) {
      const currentTime = scrollVideo.currentTime || 0;
      scrollVideo.innerHTML = `<source src="${correctSrc}" type="video/mp4">`;
      scrollVideo.load();
      scrollVideo.currentTime = currentTime;
    }
  }
  
  // Load on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCorrectVideo);
  } else {
    loadCorrectVideo();
  }
  
  // Reload if window is resized
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(loadCorrectVideo, 250);
  });
})(); // closes initScrollVideoSource()

})(); // <--- ADD THIS: closes the outer (function () { ... }) at the top


