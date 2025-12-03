/* ===== GLOBAL SITE SCRIPT =====
   - Loading bar for images & videos
   - Navbar injection
   - Smooth anchor scrolling (fixed nav)
   - Before/after sliders (.ba)
   - Mobile video controls
   - Scroll-driven 360° videos
   - Slideshows (fade + slide with grab / autoplay)
   - Parallax scroll
   - Mobile center hint helper
*/

(function () {
  'use strict';

  /* ==============================
   * 1) LOADING BAR (#loading-bar)
   * ============================== */
  (function initLoadingBar() {
    const loadingBar = document.getElementById('loading-bar');
    if (!loadingBar) return;

    const media = Array.from(document.querySelectorAll('img, video'));
    const totalMedia = media.length;
    if (!totalMedia) {
      loadingBar.style.width = '100%';
      loadingBar.classList.add('complete');
      return;
    }

    let loadedMedia = 0;

    function updateProgress() {
      loadedMedia++;
      const progress = Math.min(100, (loadedMedia / totalMedia) * 100);
      loadingBar.style.width = progress + '%';

      if (progress >= 100) {
        setTimeout(function () {
          loadingBar.classList.add('complete');
        }, 300);
      }
    }

    media.forEach(function (el) {
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth !== 0) {
          updateProgress();
        } else {
          el.addEventListener('load', updateProgress, { once: true });
          el.addEventListener('error', updateProgress, { once: true });
        }
      } else if (el.tagName === 'VIDEO') {
        if (el.readyState >= 2) {
          updateProgress();
        } else {
          el.addEventListener('loadeddata', updateProgress, { once: true });
          el.addEventListener('error', updateProgress, { once: true });
        }
      }
    });
  })();

  /* ==============================
   * 2) NAVBAR INJECTION
   * ============================== */
  (function initNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    fetch('navbar.html')
      .then(function (res) {
        if (!res.ok) throw new Error('Navbar fetch failed');
        return res.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;
      })
      .catch(function (err) {
        console.warn('Navbar load error:', err);
      });
  })();

  /* ==============================
   * 3) SMOOTH SCROLLING FOR ANCHORS
   * ============================== */
  (function initSmoothScroll() {
    function scrollToId(id) {
      const target = document.getElementById(id);
      if (!target) return;

      const nav = document.querySelector('nav');
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;

      const rect = target.getBoundingClientRect();
      const offset = rect.top + window.scrollY - navHeight;

      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }

    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      const id = href.slice(1);
      if (!id) return;

      if (document.getElementById(id)) {
        e.preventDefault();
        scrollToId(id);
      }
    });

    // Handle initial hash on load
    window.addEventListener('load', function () {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const id = hash.slice(1);
        if (document.getElementById(id)) {
          setTimeout(function () { scrollToId(id); }, 0);
        }
      }
    });
  })();

  /* ==============================
   * 4) BEFORE/AFTER SLIDERS (.ba)
   * ============================== */
  (function initBeforeAfter() {
    const sliders = Array.from(document.querySelectorAll('.ba'));
    if (!sliders.length) return;

    sliders.forEach(function (root) {
      const range = root.querySelector('.ba__range');
      if (!range) return;

      function update(val) {
        const x = Number(val);
        root.style.setProperty('--x', x + '%');
      }

      range.addEventListener('input', function () {
        update(this.value);
      });

      // Set initial
      update(range.value || 50);
    });
  })();

  /* ==============================
   * 5) MOBILE VIDEO CONTROLS
   * ============================== */
  (function initMobileVideoControls() {
    if (window.innerWidth > 768) return;

    const videos = Array.from(document.querySelectorAll('.full-image video'));
    if (!videos.length) return;

    videos.forEach(function (video) {
      try {
        video.controls = false;
      } catch (_) {}

      let hasShownControls = false;

      function showControls() {
        if (hasShownControls) return;
        hasShownControls = true;
        video.classList.add('show-controls');
        try {
          video.controls = true;
        } catch (_) {}
        video.removeEventListener('click', showControls);
        video.removeEventListener('touchstart', showControls);
      }

      video.addEventListener('click', showControls);
      video.addEventListener('touchstart', showControls, { passive: true });
    });
  })();

  /* ==============================
   * 6) SCROLL-DRIVEN 360° VIDEO
   * ============================== */
  (function initScrollVideos() {
    const sections = Array.from(document.querySelectorAll('.scroll-video-section'));
    if (!sections.length) return;

    const items = [];

    sections.forEach(function (section) {
      const video = section.querySelector('video.scroll-video');
      if (!video) return;

      const data = { section: section, video: video, duration: 0, ready: false };
      items.push(data);

      function handleMetadata() {
        data.duration = video.duration || 0;
        data.ready = true;
      }

      if (video.readyState >= 1) {
        handleMetadata();
      } else {
        video.addEventListener('loadedmetadata', handleMetadata, { once: true });
      }
    });

    if (!items.length) return;

    function update() {
      const vh = window.innerHeight;

      items.forEach(function (item) {
        if (!item.ready || !item.duration) return;

        const rect = item.section.getBoundingClientRect();
        const sectionHeight = rect.height || 1;

        const start = rect.top - vh;
        const end = rect.bottom;
        const scrollRange = end - start || 1;
        const center = vh / 2;

        const progress = (center - start) / scrollRange;
        const clamped = Math.max(0, Math.min(1, progress));

        const time = clamped * item.duration;
        if (!isNaN(time)) {
          item.video.currentTime = time;
        }
      });
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();

  /* ==============================
   * 7) SLIDESHOWS (FADE + SLIDE)
   * ============================== */

  /*** 7a) Sliding slideshow with grab / swipe physics ***/
  function initPhysicsDrag(root, slides, prevBtn, nextBtn) {
    if (slides.length <= 1) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    let index = 0;
    let direction = 1; // 1 = forward, -1 = backward

    const activeIndex = slides.findIndex(function (s) {
      return s.classList.contains('active');
    });
    if (activeIndex >= 0) {
      index = activeIndex;
    } else {
      index = 0;
      slides[0].classList.add('active');
    }

    function layout(extraOffsetPx) {
      if (extraOffsetPx === undefined) extraOffsetPx = 0;
      const width = root.clientWidth || root.offsetWidth || 1;
      const extraPct = (extraOffsetPx / width) * 100;

      slides.forEach(function (slide, i) {
        const base = (i - index) * 100;
        const total = base + extraPct;
        slide.style.transform = 'translateX(' + total + '%)';
      });
    }

    function updateArrows() {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    }

    function goTo(newIndex) {
      newIndex = Math.max(0, Math.min(slides.length - 1, newIndex));
      if (newIndex === index) {
        layout(0);
        return;
      }

      slides[index].classList.remove('active');
      index = newIndex;
      slides[index].classList.add('active');

      layout(0);
      updateArrows();
    }

    // Autoplay with bounce + pause-on-interaction
    const autoplayMs = 6000;
    let timer = null;
    let isInteracting = false;
    let idleTimeout = null;

    function autoStep() {
      if (isInteracting) return;

      if (index === slides.length - 1) {
        direction = -1;
      } else if (index === 0) {
        direction = 1;
      }
      goTo(index + direction);
    }

    function startAutoplay() {
      if (timer) clearInterval(timer);
      timer = setInterval(autoStep, autoplayMs);
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

    // Grab / swipe
    let isDragging = false;
    let startX = 0;
    let lastX = 0;

    root.style.touchAction = 'pan-y';

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.slideshow__arrow')) return;

      isDragging = true;
      startX = e.clientX;
      lastX = e.clientX;

      userInteracted();
      stopAutoplay();

      slides.forEach(function (slide) {
        slide.style.transition = 'none';
      });

      if (root.setPointerCapture && e.pointerId != null) {
        root.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      lastX = e.clientX;
      const dx = lastX - startX;
      layout(dx);
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;

      const dx = lastX - startX;
      const width = root.clientWidth || root.offsetWidth || 1;
      const threshold = width * 0.15;

      slides.forEach(function (slide) {
        slide.style.transition = 'transform 0.6s ease';
      });

      let targetIndex = index;
      if (dx > threshold && index > 0) {
        targetIndex = index - 1;
      } else if (dx < -threshold && index < slides.length - 1) {
        targetIndex = index + 1;
      }

      goTo(targetIndex);

      if (root.releasePointerCapture && e.pointerId != null) {
        root.releasePointerCapture(e.pointerId);
      }
    }

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    root.addEventListener('pointerleave', function (e) {
      if (isDragging) onPointerUp(e);
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        userInteracted();
        goTo(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        userInteracted();
        goTo(index + 1);
      });
    }

    root.addEventListener('mouseenter', function () {
      stopAutoplay();
    });

    root.addEventListener('mouseleave', function () {
      if (!isInteracting) {
        startAutoplay();
      }
    });

    slides.forEach(function (slide) {
      slide.style.transition = 'transform 0.6s ease';
    });
    layout(0);
    updateArrows();
    startAutoplay();
  }

  /*** 7b) Fade slideshows + wiring ***/
  function initSlideshows() {
    document.querySelectorAll('.slideshow').forEach(function (root) {
      const slides = Array.from(root.querySelectorAll('.slideshow__image'));
      const prevBtn = root.querySelector('.slideshow__arrow--prev');
      const nextBtn = root.querySelector('.slideshow__arrow--next');
      if (!slides.length) return;

      const isSlide = root.classList.contains('slideshow--slide');

      if (isSlide) {
        initPhysicsDrag(root, slides, prevBtn, nextBtn);
        return;
      }

      // Fade variant
      let index = slides.findIndex(function (s) {
        return s.classList.contains('active');
      });
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

      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          userInteracted();
          show(index - 1);
        } else if (e.key === 'ArrowRight') {
          userInteracted();
          show(index + 1);
        }
      });

      root.addEventListener('mouseenter', function () {
        stopAutoplay();
      });

      root.addEventListener('mouseleave', function () {
        if (!isInteracting) {
          startAutoplay();
        }
      });

      startAutoplay();
    });
  }

  window.addEventListener('DOMContentLoaded', initSlideshows);

  /* ==============================
   * 8) PARALLAX SECTIONS
   * ============================== */
  (function initParallax() {
    const sections = Array.from(document.querySelectorAll('.parallax-section'));
    if (!sections.length) return;

    function handle() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight;

      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + scrollY;
        const sectionHeight = rect.height || 1;
        const center = scrollY + vh / 2;
        const progress = (center - sectionTop) / sectionHeight;

        const layers = Array.from(section.querySelectorAll('.parallax-layer'));
        layers.forEach(function (layer) {
          const speedAttr = layer.getAttribute('data-speed');
          const speed = speedAttr ? parseFloat(speedAttr) : 0.3;
          const y = (progress - 0.5) * speed * -200;
          layer.style.transform = 'translate3d(0,' + y + 'px,0)';
        });
      });
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        handle();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  })();

  /* ==============================
   * 9) MOBILE CENTER HINT (.is-centered)
   * ============================== */
  (function initCenterHints() {
    function init() {
      if (window.innerWidth > 768) return;

      const blocks = Array.from(document.querySelectorAll('.slideshow, .ba'));
      if (!blocks.length) return;

      function updateAll() {
        const viewportCenter = window.innerHeight / 2;
        const tolerance = 100;

        blocks.forEach(function (block) {
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
