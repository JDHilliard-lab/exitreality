/* ===== GLOBAL SITE SCRIPT (reset) =====
   - Loading bar for images & videos (#loading-bar)
   - Navbar injection into #navbar-placeholder
   - Smooth scrolling with fixed nav offset
   - Before/After sliders (.ba)
   - Mobile video controls (tap once to show controls)
   - Scroll-driven 360° videos (.scroll-video-section)
     * Uses -desktop.mp4 on desktop
     * Uses -mobile-square.mp4 + square poster on mobile
   - Slideshows:
     * .slideshow           -> fade variant with autoplay pause/resume
     * .slideshow--slide    -> grab/drag variant with autoplay pause/resume
   - Parallax sections (.parallax-section > .parallax-layer)
*/

(function () {
  'use strict';

  /* ==============================
   * 0) Small utility
   * ============================== */
  function debounce(fn, delay) {
    let t;
    return function () {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* ==============================
   * 1) LOADING BAR
   * ============================== */
  (function initLoadingBar() {
    let loadingBar = document.getElementById('loading-bar');
    if (!loadingBar) {
      // Fallback: create it if it's missing
      loadingBar = document.createElement('div');
      loadingBar.id = 'loading-bar';
      document.body.insertBefore(loadingBar, document.body.firstChild);
    }

    const media = Array.from(document.querySelectorAll('img, video'));
    const total = media.length;
    if (!total) {
      loadingBar.style.width = '100%';
      loadingBar.classList.add('complete');
      return;
    }

    let loaded = 0;

    function update() {
      loaded++;
      const pct = Math.min(100, (loaded / total) * 100);
      loadingBar.style.width = pct + '%';
      if (pct >= 100) {
        setTimeout(function () {
          loadingBar.classList.add('complete');
        }, 400);
      }
    }

    media.forEach(function (el) {
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth !== 0) {
          update();
        } else {
          el.addEventListener('load', update, { once: true });
          el.addEventListener('error', update, { once: true });
        }
      } else if (el.tagName === 'VIDEO') {
        // We treat video as "loaded enough" when metadata is ready
        if (el.readyState >= 1) {
          update();
        } else {
          el.addEventListener('loadedmetadata', update, { once: true });
          el.addEventListener('error', update, { once: true });
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
   * 3) SMOOTH SCROLL FOR ANCHORS
   * ============================== */
  (function initSmoothScroll() {
    function scrollToId(id) {
      const target = document.getElementById(id);
      if (!target) return;

      const nav = document.querySelector('nav');
      const navH = nav ? nav.getBoundingClientRect().height : 0;

      const rect = target.getBoundingClientRect();
      const offset = rect.top + window.scrollY - navH;

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

    window.addEventListener('load', function () {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const id = hash.slice(1);
        if (document.getElementById(id)) {
          setTimeout(function () {
            scrollToId(id);
          }, 0);
        }
      }
    });
  })();

  /* ==============================
   * 4) BEFORE/AFTER SLIDERS
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
      } catch (e) {}

      let shown = false;

      function showControls() {
        if (shown) return;
        shown = true;
        try {
          video.controls = true;
        } catch (e) {}
        video.classList.add('show-controls');
        video.removeEventListener('click', showControls);
        video.removeEventListener('touchstart', showControls);
      }

      video.addEventListener('click', showControls);
      video.addEventListener('touchstart', showControls, { passive: true });
    });
  })();

  /* ==============================
   * 6) SCROLL-DRIVEN 360° VIDEOS
   * ============================== */
  (function initScrollVideos() {
    const sections = Array.from(document.querySelectorAll('.scroll-video-section'));
    if (!sections.length) return;

    const items = [];

    function setupSourcesAndPosters() {
      const isMobile = window.innerWidth <= 768;

      sections.forEach(function (section) {
        const video = section.querySelector('video.scroll-video');
        const container = section.querySelector('.scroll-video-container');
        if (!video) return;

        const sourceEl = video.querySelector('source');
        if (!sourceEl) return;

        const currentSrc = sourceEl.getAttribute('src');
        if (!currentSrc) return;

        const lastSlash = currentSrc.lastIndexOf('/');
        const dir = lastSlash >= 0 ? currentSrc.slice(0, lastSlash + 1) : '';
        const file = lastSlash >= 0 ? currentSrc.slice(lastSlash + 1) : currentSrc;

        const baseName = file
          .replace('-desktop', '')
          .replace('-mobile-square', '')
          .replace('.mp4', '');

        const desktopSrc = dir + baseName + '-desktop.mp4';
        const mobileSrc = dir + baseName + '-mobile-square.mp4';

        const desktopPoster =
          video.getAttribute('data-desktop-poster') ||
          video.getAttribute('poster') ||
          '';

        const mobilePoster =
          video.getAttribute('data-mobile-poster') ||
          video.dataset.mobilePoster ||
          '';

        const wantedSrc = isMobile && mobileSrc ? mobileSrc : desktopSrc;
        const wantedPoster = isMobile && mobilePoster ? mobilePoster : desktopPoster;

        if (currentSrc !== wantedSrc) {
          const t = video.currentTime || 0;
          sourceEl.setAttribute('src', wantedSrc);
          video.load();
          try {
            video.currentTime = t;
          } catch (e) {}
        }

        if (wantedPoster) {
          video.setAttribute('poster', wantedPoster);
          if (container) {
            container.style.setProperty('--poster-image', "url('" + wantedPoster + "')");
          }
        }
      });
    }

    // Prepare items for scroll scrubbing
    sections.forEach(function (section) {
      const video = section.querySelector('video.scroll-video');
      if (!video) return;

      video.pause();
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const item = {
        section: section,
        video: video,
        duration: 0,
        ready: false,
        targetTime: 0,
        currentTime: 0
      };

      function onMeta() {
        item.duration = video.duration || 0;
        item.ready = true;
      }

      if (video.readyState >= 1) {
        onMeta();
      } else {
        video.addEventListener('loadedmetadata', onMeta, { once: true });
      }

      items.push(item);
    });

    function updateTargets() {
      const vh = window.innerHeight;

      items.forEach(function (item) {
        if (!item.ready || !item.duration) return;

        const rect = item.section.getBoundingClientRect();
        const sectionHeight = rect.height || 1;

        // progress based on section center vs viewport center
        const viewportCenter = vh / 2;
        const sectionCenter = rect.top + sectionHeight / 2;
        let progress = 1 - Math.abs(sectionCenter - viewportCenter) / (vh + sectionHeight / 2);
        progress = Math.max(0, Math.min(1, progress));

        item.targetTime = progress * item.duration;
      });
    }

    function tick() {
      items.forEach(function (item) {
        if (!item.ready || !item.duration) return;
        const diff = item.targetTime - item.currentTime;
        const smoothing = 0.15;
        item.currentTime += diff * smoothing;
        if (!isNaN(item.currentTime)) {
          try {
            item.video.currentTime = item.currentTime;
          } catch (e) {}
        }
      });
      requestAnimationFrame(tick);
    }

    setupSourcesAndPosters();
    updateTargets();
    requestAnimationFrame(tick);

    window.addEventListener(
      'scroll',
      function () {
        updateTargets();
      },
      { passive: true }
    );

    window.addEventListener(
      'resize',
      debounce(function () {
        setupSourcesAndPosters();
        updateTargets();
      }, 200)
    );
  })();

  /* ==============================
   * 7) SLIDESHOWS (FADE + SLIDE)
   * ============================== */

  // 7a) Sliding slideshow with grab / swipe physics
  function initPhysicsDrag(root, slides, prevBtn, nextBtn) {
    if (slides.length <= 1) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    let index = slides.findIndex(function (s) {
      return s.classList.contains('active');
    });
    if (index < 0) {
      index = 0;
      slides[0].classList.add('active');
    }

    let isDragging = false;
    let startX = 0;
    let lastX = 0;
    let dragOffset = 0;
    let velocity = 0;
    let animationFrame = null;
    let isInteracting = false;
    let autoplayTimer = null;

    function layout(extraPx) {
      if (extraPx === void 0) extraPx = 0;
      const width = root.clientWidth || root.offsetWidth || 1;
      const extraPct = (extraPx / width) * 100;

      slides.forEach(function (slide, i) {
        const base = (i - index) * 100;
        const total = base + extraPct;
        slide.style.transform = 'translate3d(' + total + '%, 0, 0)';
      });
    }

    function updateArrows() {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    }

    function goTo(newIndex) {
      newIndex = Math.max(0, Math.min(slides.length - 1, newIndex));
      if (newIndex === index) {
        dragOffset = 0;
        velocity = 0;
        layout(0);
        return;
      }
      slides[index].classList.remove('active');
      index = newIndex;
      slides[index].classList.add('active');
      dragOffset = 0;
      velocity = 0;
      layout(0);
      updateArrows();
    }

    const autoplayMs = 6000;
    let idleTimeout = null;

    function autoStep() {
      if (isInteracting) return;
      let direction = 1;
      if (index === slides.length - 1) direction = -1;
      if (index === 0) direction = 1;
      goTo(index + direction);
    }

    function startAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(autoStep, autoplayMs);
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
      idleTimeout = setTimeout(function () {
        isInteracting = false;
        startAutoplay();
      }, autoplayMs);
    }

    // Drag / swipe (pointer events)
    root.style.touchAction = 'pan-y';

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.slideshow__arrow')) return;

      isDragging = true;
      startX = e.clientX;
      lastX = e.clientX;
      dragOffset = 0;
      velocity = 0;

      userInteracted();

      slides.forEach(function (slide) {
        slide.style.transition = 'none';
      });

      if (root.setPointerCapture && e.pointerId != null) {
        root.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX;
      const dx = currentX - startX;
      const now = Date.now();

      const dt = now - (onPointerMove._lastTime || now);
      if (dt > 0) {
        const deltaMove = currentX - lastX;
        velocity = ((deltaMove / (root.clientWidth || 1)) * 100) / (dt / 16);
      }

      onPointerMove._lastTime = now;
      lastX = currentX;
      dragOffset = (dx / (root.clientWidth || 1)) * 100;

      if (index === 0 && dragOffset > 0) {
        dragOffset *= 0.3;
      } else if (index === slides.length - 1 && dragOffset < 0) {
        dragOffset *= 0.3;
      }

      layout(dragOffset * (root.clientWidth || 1) / 100);
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;

      slides.forEach(function (slide) {
        slide.style.transition = 'transform 0.6s ease';
      });

      const width = root.clientWidth || 1;
      const threshold = width * 0.15;
      const finalDx = lastX - startX;

      let targetIndex = index;
      if (finalDx > threshold && index > 0) {
        targetIndex = index - 1;
      } else if (finalDx < -threshold && index < slides.length - 1) {
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

    // Arrow buttons
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
      if (!isInteracting) startAutoplay();
    });

    slides.forEach(function (slide) {
      slide.style.transition = 'transform 0.6s ease';
    });
    layout(0);
    updateArrows();
    startAutoplay();
  }

  // 7b) Fade slideshows
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
        if (!isInteracting) startAutoplay();
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
      const vh = window.innerHeight;

      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const viewportCenter = vh / 2;
        const rel = (center - viewportCenter) / vh; // ~ -1 to +1

        const layers = Array.from(section.querySelectorAll('.parallax-layer'));
        layers.forEach(function (layer, i) {
          const speedAttr = layer.getAttribute('data-speed');
          const speed = speedAttr ? parseFloat(speedAttr) : (i + 1) * 0.3;
          const offset = -rel * speed * 200; // bigger = more visible
          layer.style.transform = 'translate3d(0,' + offset + 'px,0)';
        });
      });
    }

    const onScroll = debounce(handle, 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    handle();
  })();

})();
