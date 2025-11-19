/* ===== GLOBAL SITE SCRIPT =====
   - Base-path safeguard for GitHub Pages
   - Dynamic --nav-h (nav height) CSS var
   - Smooth scrolling with fixed-nav offset
   - Loading bar for page and video content
   - Swipe gestures for slide slideshows
   - Parallax scrolling effect (works on mobile and desktop with 1920x1080 images)
   - Scroll-driven video (360° rotation effect)
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

  /*** 5) Global Slideshow Support (fade + slide variant) with Desktop Drag ***/
  function initSlideshows() {
    document.querySelectorAll('.slideshow').forEach(function (root) {
      const slides = Array.from(root.querySelectorAll('.slideshow__image'));
      const prevBtn = root.querySelector('.slideshow__arrow--prev');
      const nextBtn = root.querySelector('.slideshow__arrow--next');
      if (!slides.length) return;

      const isSlide = root.classList.contains('slideshow--slide');

      let index = slides.findIndex(s => s.classList.contains('active'));
      if (index < 0) {
        index = 0;
        slides[0].classList.add('active');
      }

      function layout() {
        if (!isSlide) return;

        slides.forEach(function (slide, idx) {
          const offset = idx - index;
          slide.style.transform = `translate3d(${offset * 100}%, 0, 0)`;
          slide.style.webkitTransform = `translate3d(${offset * 100}%, 0, 0)`;
        });
      }

      function updateArrows() {
        if (!isSlide) return;
        if (prevBtn) prevBtn.disabled = (index === 0);
        if (nextBtn) nextBtn.disabled = (index === slides.length - 1);
      }

      function show(nextIndex) {
        if (isSlide) {
          if (nextIndex < 0 || nextIndex >= slides.length) return;
        } else {
          nextIndex = (nextIndex + slides.length) % slides.length;
        }

        if (nextIndex === index) return;

        slides[index].classList.remove('active');
        index = nextIndex;
        slides[index].classList.add('active');

        layout();
        updateArrows();
      }

      if (isSlide) {
        let direction = 1;

        let autoTimer = setInterval(function () {
          if (index === slides.length - 1) direction = -1;
          if (index === 0) direction = 1;
          show(index + direction);
        }, 4000);

        root.addEventListener('mouseenter', function () {
          clearInterval(autoTimer);
        });

        root.addEventListener('mouseleave', function () {
          autoTimer = setInterval(function () {
            if (index === slides.length - 1) direction = -1;
            if (index === 0) direction = 1;
            show(index + direction);
          }, 4000);
        });
      }

      layout();
      updateArrows();

      if (prevBtn) {
        prevBtn.addEventListener('click', () => show(index - 1));
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => show(index + 1));
      }

      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
      });

      if (!isSlide) {
  const autoplayMs = 6000;
  let timer = setInterval(() => show(index + 1), autoplayMs);

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Stop autoplay when the user interacts
  root.addEventListener('mouseenter', stopAutoplay);

  if (prevBtn) {
    prevBtn.addEventListener('click', stopAutoplay);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', stopAutoplay);
  }
}


      if (isSlide) {
        // ===== MOBILE TOUCH SWIPE =====
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
          const swipeThreshold = 50;
          const diff = touchStartX - touchEndX;
          
          if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
              if (nextBtn && !nextBtn.disabled) {
                show(index + 1);
              }
            } else {
              if (prevBtn && !prevBtn.disabled) {
                show(index - 1);
              }
            }
          }
        }

        // ===== DESKTOP MOUSE DRAG =====
        let isDragging = false;
        let dragStartX = 0;
        let dragCurrentX = 0;
        let dragThreshold = 50; // pixels to drag before triggering slide change

        root.addEventListener('mousedown', function(e) {
          // Don't interfere with arrow button clicks
          if (e.target.classList.contains('slideshow__arrow') || 
              e.target.classList.contains('slideshow__arrow--prev') ||
              e.target.classList.contains('slideshow__arrow--next')) {
            return;
          }

          isDragging = true;
          dragStartX = e.clientX;
          dragCurrentX = e.clientX;
          root.style.cursor = 'grabbing';
          e.preventDefault(); // Prevent image dragging
        });

        window.addEventListener('mousemove', function(e) {
          if (!isDragging) return;
          dragCurrentX = e.clientX;
        });

        window.addEventListener('mouseup', function(e) {
          if (!isDragging) return;

          const dragDistance = dragCurrentX - dragStartX;

          if (Math.abs(dragDistance) > dragThreshold) {
            if (dragDistance > 0) {
              // Dragged right = show previous
              if (prevBtn && !prevBtn.disabled) {
                show(index - 1);
              }
            } else {
              // Dragged left = show next
              if (nextBtn && !nextBtn.disabled) {
                show(index + 1);
              }
            }
          }

          isDragging = false;
          root.style.cursor = 'grab';
        });

        // Set initial cursor
        root.style.cursor = 'grab';

        // Reset cursor when mouse leaves
        root.addEventListener('mouseleave', function() {
          if (isDragging) {
            isDragging = false;
            root.style.cursor = 'grab';
          }
        });
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initSlideshows);

  /*** 6) Parallax scrolling effect - Works on both desktop and mobile ***/
  (function initParallax() {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    
    if (parallaxSections.length === 0) return;
    
    const isMobile = window.innerWidth <= 768;
    const mobileMultiplier = 0.2; // Reduced movement on mobile
    
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

/*** 7) Scroll-Driven Video (360° rotation effect) - FIXED VERSION ***/
(function initScrollVideo() {
  const sections = document.querySelectorAll('.scroll-video-section');
  if (!sections.length) return;

  sections.forEach(section => {
    const video = section.querySelector('.scroll-video');
    if (!video) return;

    video.addEventListener('loadedmetadata', function () {
      let ticking = false;

      // ===== CONFIGURATION =====
      const stickyStart = 0.4; // when video is reaching center
      const stickyEnd   = 0.6; // when video starts to release
      // =========================

      function updateVideo() {
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const sectionHeight = rect.height;

        // Start when top of section enters viewport,
        // end when bottom leaves viewport
        const startScroll = windowHeight;
        const endScroll = -sectionHeight;
        const scrollRange = startScroll - endScroll;
        const currentPos = rect.top;

        let progress = (startScroll - currentPos) / scrollRange;
        progress = Math.max(0, Math.min(1, progress));

        const stickyRange = stickyEnd - stickyStart;
        let videoProgress = 0;

        if (progress < stickyStart) {
          // entering – hold first frame
          videoProgress = 0;
        } else if (progress <= stickyEnd) {
          // sticky phase – play through
          const stickyProgress = (progress - stickyStart) / stickyRange;
          videoProgress = stickyProgress;
        } else {
          // exiting – hold last frame
          videoProgress = 1;
        }

        if (video.duration && !isNaN(video.duration)) {
          video.currentTime = videoProgress * video.duration;
        }

        ticking = false;
      }

      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(updateVideo);
          ticking = true;
        }
      }

      window.addEventListener('scroll', onScroll);
      window.addEventListener('resize', onScroll);

      // Initial sync
      updateVideo();
    });

    // make sure it doesn’t autoplay on its own
    video.pause();
  });
})();

