(function () {
        "use strict";

        const TABS = 5;
        const ZOOM_VH = 0.8;  /* OPT: giảm 1.2→0.8 — zoom phase ngắn hơn, vào content nhanh hơn */
        const TAB_VH  = 0.7;  /* OPT: giảm 1.0→0.7 — mỗi tab scroll ngắn hơn */
        const EXIT_VH = 0.3;

        const track    = document.getElementById("ps-scroll-track");
        const frameWrap = document.getElementById("ps-frame-wrap");
        const navItems = document.querySelectorAll(".ps-nav-item");
        const slides   = document.querySelectorAll(".ps-slide");
        const panels   = document.querySelectorAll(".ps-panel");
        const psRight  = document.getElementById("ps-right");
        const psNav    = document.getElementById("ps-nav");

        let currentTab  = 0;
        let switching   = false;
        let navRevealed = false;

        /* ── Set scroll track height ── */
        function setTrackHeight() {
          const vh = window.innerHeight;
          const totalH = vh + ZOOM_VH * vh + TABS * TAB_VH * vh + EXIT_VH * vh;
          track.style.height = totalH + "px";
        }
        setTrackHeight();

        let _resizeTimer;
        window.addEventListener("resize", function() {
          clearTimeout(_resizeTimer);
          _resizeTimer = setTimeout(setTrackHeight, 200);
        }, { passive: true });

        /* ── Initial state ── */
        frameWrap.style.opacity   = "0";
        frameWrap.style.transform = "scale(0.7) translateY(50px)";

        /* ── Easing ── */
        function easeInOut(t) {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        function clamp(v, a, b) {
          return Math.max(a, Math.min(b, v));
        }

        /* ── Main scroll handler — rAF throttled ── */
        var rafPending = false;
        function onScroll() {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(function() {
            rafPending = false;
            _onScrollFrame();
          });
        }

        function _onScrollFrame() {
          const rect      = track.getBoundingClientRect();
          const vh        = window.innerHeight;
          const scrolledIn = -rect.top;

          if (scrolledIn < 0) {
            frameWrap.style.opacity   = "0";
            frameWrap.style.transform = "scale(0.7) translateY(50px)";
            return;
          }

          const zoomScrollH = ZOOM_VH * vh;
          const tabsScrollH = TABS * TAB_VH * vh;

          /* Phase 1: ZOOM */
          if (scrolledIn <= zoomScrollH) {
            const t  = scrolledIn / zoomScrollH;
            const te = easeInOut(clamp(t, 0, 1));
            frameWrap.style.transform = `scale(${0.7 + 0.3 * te}) translateY(${50 - 50 * te}px)`;
            frameWrap.style.opacity   = String(clamp(t * 2, 0, 1));
            if (currentTab !== 0) switchTab(0);
            return;
          }

          /* Phase 2: TABS */
          frameWrap.style.transform = "scale(1) translateY(0)";
          frameWrap.style.opacity   = "1";

          if (!navRevealed) {
            navRevealed = true;
            psNav.classList.add("ps-revealed");
            psRight.classList.add("ps-revealed");
          }

          const tabScrolled = scrolledIn - zoomScrollH;
          const tabProgress = clamp(tabScrolled / tabsScrollH, 0, 1);
          const newTab      = Math.min(TABS - 1, Math.floor(tabProgress * TABS));
          if (newTab !== currentTab) switchTab(newTab);
        }

        /* ── Switch tab ── */
        function switchTab(idx) {
          if (switching) return;
          switching = true;

          navItems.forEach((n, i) => n.classList.toggle("active", i === idx));

          const oldSlide = document.querySelector(".ps-slide.show");
          const newSlide = document.querySelector(`.ps-slide[data-index="${idx}"]`);
          const oldPanel = document.querySelector(".ps-panel.show");
          const newPanel = document.querySelector(`.ps-panel[data-index="${idx}"]`);

          const FADE = 400; /* OPT: 550→400ms */

          if (newSlide && newSlide !== oldSlide) {
            newSlide.style.transition = "none";
            newSlide.style.opacity    = "0";
            newSlide.style.transform  = "none";
            newSlide.classList.add("show");
            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (oldSlide) {
                oldSlide.style.transition = `opacity ${FADE}ms ease`;
                oldSlide.style.opacity    = "0";
              }
              newSlide.style.transition = `opacity ${FADE}ms ease`;
              newSlide.style.opacity    = "1";
            }));
          }

          if (oldPanel && oldPanel !== newPanel) {
            oldPanel.style.transition = "opacity 0.22s ease, transform 0.22s ease";
            oldPanel.style.opacity    = "0";
            oldPanel.style.transform  = "translateX(16px) translateY(-12px)";
          }

          setTimeout(() => {
            if (oldPanel && oldPanel !== newPanel) {
              oldPanel.classList.remove("show");
              oldPanel.removeAttribute("style");
            }
            if (newPanel && newPanel !== oldPanel) {
              newPanel.style.transition = "none";
              newPanel.style.opacity    = "0";
              newPanel.style.transform  = "translateX(24px) translateY(18px) scale(0.97)";
              newPanel.classList.add("show");
              requestAnimationFrame(() => requestAnimationFrame(() => {
                newPanel.style.transition = "opacity 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1)";
                newPanel.style.opacity    = "1";
                newPanel.style.transform  = "none";
              }));
            }
          }, 240);

          setTimeout(() => {
            if (oldSlide && oldSlide !== newSlide) {
              oldSlide.classList.remove("show");
              oldSlide.removeAttribute("style");
            }
            currentTab = idx;
            switching  = false;
          }, FADE + 60);
        }

        /* ── Nav click ── */
        navItems.forEach((btn) => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.index, 10);
            switching = false;
            const vh = window.innerHeight;
            const targetScrolledIn = ZOOM_VH * vh + (idx * TAB_VH + TAB_VH * 0.1) * vh;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: trackTop + targetScrolledIn, behavior: "instant" });
          });
        });

        /* ── Expose jumpToContent cho sidenav jumpTo
           Khi menu click vào s4, gọi hàm này để skip zoom phase ── */
        window.__othersJumpToContent = function() {
          const vh  = window.innerHeight;
          const top = track.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: top + ZOOM_VH * vh + 10, behavior: 'instant' });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      })();