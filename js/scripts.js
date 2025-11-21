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

        root.addEventListener('mouseenter', () => clearInterval(timer));
        root.addEventListener('mouseleave', () => {
          timer = setInterval(() => show(index + 1), autoplayMs);
        });
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
        let dragThreshold = 50;

        root.addEventListener('mousedown', function(e) {
          if (e.target.classList.contains('slideshow__arrow') || 
              e.target.classList.contains('slideshow__arrow--prev') ||
              e.target.classList.contains('slideshow__arrow--next')) {
            return;
          }

          isDragging = true;
          dragStartX = e.clientX;
          dragCurrentX = e.clientX;
          root.style.cursor = 'grabbing';
          e.preventDefault();
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
              if (prevBtn && !prevBtn.disabled) {
                show(index - 1);
              }
            } else {
              if (nextBtn && !nextBtn.disabled) {
                show(index + 1);
              }
            }
          }

          isDragging = false;
          root.style.cursor = 'grab';
        });

        root.style.cursor = 'grab';

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

/*** 7) Scroll-Driven Video (360° rotation effect) - MOBILE DEBUG VERSION ***/
(function initScrollVideo() {
  const section = document.querySelector('.scroll-video-section');
  const video = document.querySelector('.scroll-video');

  console.log('🎬 1. Section found:', !!section);
  console.log('🎬 2. Video found:', !!video);

  if (!section || !video) {
    console.error('❌ ERROR: Video or section not found!');
    return;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  console.log('📱 3. Is Mobile:', isMobile);
  console.log('🍎 4. Is iOS:', isIOS);
  console.log('📁 5. Video src:', video.querySelector('source')?.src || 'NO SOURCE');

  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  video.addEventListener('loadstart', () => {
    console.log('⏳ 6. Video loading started');
  });

  video.addEventListener('loadedmetadata', () => {
    console.log('✅ 7. Metadata loaded - Duration:', video.duration);
  });

  video.addEventListener('loadeddata', () => {
    console.log('✅ 8. Video data loaded - Ready state:', video.readyState);
  });

  video.addEventListener('canplay', () => {
    console.log('✅ 9. Video can play');
  });

  video.addEventListener('error', (e) => {
    console.error('❌ 10. VIDEO ERROR:', e);
    console.error('Error code:', video.error?.code);
    console.error('Error message:', video.error?.message);
  });

  function forceLoad() {
    console.log('🔄 11. Forcing video load...');
    
    video.load();
    
    if (isIOS) {
      setTimeout(() => {
        video.play()
          .then(() => {
            console.log('▶️ 12. Play succeeded, pausing...');
            video.pause();
            video.currentTime = 0;
          })
          .catch(err => {
            console.log('⏸️ 13. Play failed (needs user interaction):', err.message);
            
            document.addEventListener('touchstart', function enableVideo() {
              console.log('👆 14. User touched, trying play again...');
              video.play()
                .then(() => {
                  video.pause();
                  video.currentTime = 0;
                  console.log('✅ 15. Video enabled via touch');
                })
                .catch(e => console.log('❌ Touch play failed:', e));
            }, { once: true, passive: true });
          });
      }, 500);
    }
  }

  const stickyStart = 0.25;
  const stickyEnd = 0.75;

  let ticking = false;
  let scrollUpdateCount = 0;

  function updateVideo() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = rect.height;
    
    const startScroll = windowHeight;
    const endScroll = -sectionHeight;
    const scrollRange = startScroll - endScroll;
    const currentPos = rect.top;
    
    let progress = (startScroll - currentPos) / scrollRange;
    progress = Math.max(0, Math.min(1, progress));

    const stickyRange = stickyEnd - stickyStart;
    let videoProgress = 0;
    
    if (progress < stickyStart) {
      videoProgress = 0;
    } else if (progress <= stickyEnd) {
      const stickyProgress = (progress - stickyStart) / stickyRange;
      videoProgress = stickyProgress;
    } else {
      videoProgress = 1;
    }

    if (video.duration && !isNaN(video.duration)) {
      const newTime = videoProgress * video.duration;
      
      try {
        video.currentTime = newTime;
        
        scrollUpdateCount++;
        if (scrollUpdateCount <= 5) {
          console.log(`📊 Scroll update #${scrollUpdateCount}: progress=${progress.toFixed(2)}, time=${newTime.toFixed(2)}s`);
        }
      } catch (e) {
        console.error('❌ Error setting currentTime:', e);
      }
    } else {
      if (scrollUpdateCount === 0) {
        console.warn('⚠️ Video duration not available yet');
      }
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateVideo);
      ticking = true;
    }
  }

  if (video.readyState >= 2) {
    console.log('✅ 16. Video already loaded, starting scroll handler');
    window.addEventListener('scroll', onScroll, { passive: true });
    updateVideo();
  } else {
    console.log('⏳ 17. Waiting for video to load...');
    
    video.addEventListener('loadeddata', function() {
      console.log('✅ 18. Video loaded, starting scroll handler');
      window.addEventListener('scroll', onScroll, { passive: true });
      updateVideo();
    }, { once: true });

    setTimeout(() => {
      if (video.readyState < 2) {
        console.warn('⚠️ 19. Video still not loaded after 3s, starting anyway');
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    }, 3000);
  }

  forceLoad();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('👀 20. Video section in view, loading...');
          forceLoad();
        }
      });
    }, { threshold: 0.01, rootMargin: '500px' });
    
    observer.observe(section);
  }

  video.pause();
  
  console.log('🎬 21. Setup complete. Scroll to the video section and watch console.');
})();

})();
