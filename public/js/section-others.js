(function () {
        "use strict";

        const TABS = 6;
        // Scroll budget per phase (in vh units)
        const ZOOM_VH = 1.2; // how many screen-heights the zoom phase lasts
        const TAB_VH = 1.0; // screen-heights per tab step
        const EXIT_VH = 0.5; // buffer at end

        const track = document.getElementById("ps-scroll-track");
        const frameWrap = document.getElementById("ps-frame-wrap");
        const navItems = document.querySelectorAll(".ps-nav-item");
        const slides = document.querySelectorAll(".ps-slide");
        const panels = document.querySelectorAll(".ps-panel");
        const psRight = document.getElementById("ps-right");

        let currentTab = 0;
        let switching = false;

        /* ── Set scroll track height ── */
        function setTrackHeight() {
          const vh = window.innerHeight;
          const totalH = vh + ZOOM_VH * vh + TABS * TAB_VH * vh + EXIT_VH * vh;
          track.style.height = totalH + "px";
        }
        setTrackHeight();
        window.addEventListener("resize", setTrackHeight);

        /* ── Initial state: frame scaled down, invisible ── */
        frameWrap.style.opacity = "0";
        frameWrap.style.transform = "scale(0.7) translateY(50px)";

        /* ── Easing ── */
        function easeInOut(t) {
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        function clamp(v, a, b) {
          return Math.max(a, Math.min(b, v));
        }

        /* ── Main scroll handler ── */
        function onScroll() {
          const rect = track.getBoundingClientRect();
          const vh = window.innerHeight;
          // scrolledIn: how far we've scrolled into the track (0 = just reached top)
          const scrolledIn = -rect.top;

          if (scrolledIn < 0) {
            // Haven't reached section yet
            frameWrap.style.opacity = "0";
            frameWrap.style.transform = "scale(0.7) translateY(50px)";
            return;
          }

          const zoomScrollH = ZOOM_VH * vh;
          const tabsScrollH = TABS * TAB_VH * vh;

          /* ── Phase 1: ZOOM (scroll-linked) ── */
          if (scrolledIn <= zoomScrollH) {
            const t = scrolledIn / zoomScrollH;
            const te = easeInOut(clamp(t, 0, 1));
            const scale = 0.7 + 0.3 * te; // 0.7 → 1.0
            const ty = 50 - 50 * te; // 50px → 0
            const op = clamp(t * 2, 0, 1); // fade in quickly

            frameWrap.style.transform = `scale(${scale}) translateY(${ty}px)`;
            frameWrap.style.opacity = op;

            // Keep tab 0 active during zoom
            if (currentTab !== 0) switchTab(0);
            return;
          }

          /* ── Phase 2: TABS ── */
          frameWrap.style.transform = "scale(1) translateY(0)";
          frameWrap.style.opacity = "1";

          const tabScrolled = scrolledIn - zoomScrollH;
          const tabProgress = clamp(tabScrolled / tabsScrollH, 0, 1);
          const newTab = Math.min(TABS - 1, Math.floor(tabProgress * TABS));

          if (newTab !== currentTab) {
            switchTab(newTab);
          }
        }

        /* ── Switch tab: crossfade image (no black gap) + panel ── */
        function switchTab(idx) {
          if (switching) return;
          switching = true;

          navItems.forEach((n, i) => n.classList.toggle("active", i === idx));

          const oldSlide = document.querySelector(".ps-slide.show");
          const newSlide = document.querySelector(`.ps-slide[data-index="${idx}"]`);
          const oldPanel = document.querySelector(".ps-panel.show");
          const newPanel = document.querySelector(`.ps-panel[data-index="${idx}"]`);

          const FADE = 550;

          // ── Image: crossfade cả hai cùng lúc → không có khoảng đen ──
          if (newSlide && newSlide !== oldSlide) {
            newSlide.style.transition = "none";
            newSlide.style.opacity = "0";
            newSlide.style.transform = "none";
            newSlide.classList.add("show");

            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (oldSlide) {
                oldSlide.style.transition = `opacity ${FADE}ms ease`;
                oldSlide.style.opacity = "0";
              }
              newSlide.style.transition = `opacity ${FADE}ms ease`;
              newSlide.style.opacity = "1";
            }));
          }

          // ── Panel: exit ──
          if (oldPanel && oldPanel !== newPanel) {
            oldPanel.style.transition = "opacity 0.28s ease, transform 0.28s ease";
            oldPanel.style.opacity = "0";
            oldPanel.style.transform = "translateX(16px) translateY(-12px)";
          }

          // Panel cleanup + enter sau khi exit xong
          setTimeout(() => {
            if (oldPanel && oldPanel !== newPanel) {
              oldPanel.classList.remove("show");
              oldPanel.removeAttribute("style");
            }
            if (newPanel && newPanel !== oldPanel) {
              newPanel.style.transition = "none";
              newPanel.style.opacity = "0";
              newPanel.style.transform = "translateX(24px) translateY(18px) scale(0.97)";
              newPanel.classList.add("show");
              requestAnimationFrame(() => requestAnimationFrame(() => {
                newPanel.style.transition = "opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)";
                newPanel.style.opacity = "1";
                newPanel.style.transform = "none";
              }));
            }
          }, 310);

          // Slide cleanup + unlock sau khi crossfade xong
          setTimeout(() => {
            if (oldSlide && oldSlide !== newSlide) {
              oldSlide.classList.remove("show");
              oldSlide.removeAttribute("style");
            }
            currentTab = idx;
            switching = false;
          }, FADE + 80);
        }

        /* ── Nav click — jump scroll to exact tab position ── */
        navItems.forEach((btn) => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.index, 10);
            const vh = window.innerHeight;
            // Land solidly inside tab idx's range (start + 10% buffer)
            const targetScrolledIn = ZOOM_VH * vh + (idx * TAB_VH + TAB_VH * 0.1) * vh;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: trackTop + targetScrolledIn, behavior: "instant" });
          });
        });

        /* ── Listen ── */
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // init
      })();