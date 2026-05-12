/* ── UIUX ZOOM INTRO ── */
(function () {
  var section = document.getElementById('uiux-sticky-wrap');
  var heading = document.getElementById('uiux-heading');
  var pivot   = document.getElementById('uiux-pivot');
  var black   = document.getElementById('uiux-black');
  var content = document.getElementById('uiux-content');

  if (!section || !heading || !pivot) return;

  var MAX_SCALE = 100;
  var originSet = false;

  function initOrigin() {
    // BƯỚC 1: reset transform TRƯỚC
    heading.style.transform       = 'scale(1)';
    heading.style.transformOrigin = '50% 50%';

    // BƯỚC 2: đợi browser render xong scale(1) mới đo
    requestAnimationFrame(function () {

      // BƯỚC 3: đo cả 2 element SAU KHI browser đã apply scale(1)
      var pr = pivot.getBoundingClientRect();   // vị trí chữ F
      var hr = heading.getBoundingClientRect(); // vị trí toàn heading

      var W = window.innerWidth;
      var H = window.innerHeight;

      // BƯỚC 4: tâm GIỮA chữ F trong viewport (center, không phải top-left)
      var pvx = pr.left + pr.width  / 2.9;
      var pvy = pr.top  + pr.height * 0.45;


      // Scale đủ phủ góc xa nhất × 6
      var maxDist = Math.max(
        Math.hypot(pvx,     pvy),
        Math.hypot(W - pvx, pvy),
        Math.hypot(pvx,     H - pvy),
        Math.hypot(W - pvx, H - pvy)
      );
      MAX_SCALE = (maxDist / (pr.width / 2)) * 6;

      // BƯỚC 5: offset tâm F so với top-left của heading element
      var ox = pvx - hr.left;
      var oy = pvy - hr.top;

      // BƯỚC 6: set transform-origin bằng px tuyệt đối
      heading.style.transformOrigin = ox + 'px ' + oy + 'px';

      // BƯỚC 7: SAU ĐÓ mới reset về scale(0)
      heading.style.transform = 'scale(0)';
      originSet = true;
    });
  }

  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  function applyZoom(p) {
    if (!originSet) return;

    // ── 2-phase zoom ──
    var P_SPLIT  = 0.788; // phase 1: 2000vh chậm, phase 2: 180vh nhanh
    var MID_FRAC = 0.018; // tại p_split, scale ≈ 3× — full text vừa phủ ngang viewport

    var scale;
    if (p <= P_SPLIT) {
      // Phase 1: zoom chậm đều — người xem thấy chữ tăng kích cỡ
      scale = (p / P_SPLIT) * MID_FRAC * MAX_SCALE;
    } else {
      // Phase 2: zoom nhanh — thuần hiệu ứng chuyển cảnh
      var t2 = (p - P_SPLIT) / (1 - P_SPLIT);
      scale  = (MID_FRAC + t2 * (1 - MID_FRAC)) * MAX_SCALE;
    }
    heading.style.transform = 'scale(' + Math.max(scale, 0.001) + ')';

    // p2: tiến độ tương đối trong phase 2 (0→1), luôn đúng bất kể P_SPLIT
    var p2 = p <= P_SPLIT ? 0 : (p - P_SPLIT) / (1 - P_SPLIT);

    // Black: giữ nguyên phase 1, fade toàn bộ trong phase 2
    black.style.opacity = String(Math.max(0, 1 - p2));

    // Content: xuất hiện nửa sau phase 2
    if (content) {
      var t3 = Math.max(0, (p2 - 0.4) / 0.6);
      content.style.opacity       = String(Math.min(t3, 1));
      content.style.pointerEvents = t3 > 0.5 ? 'auto' : 'none';
    }
  }

  function onScroll() {
    var rect       = section.getBoundingClientRect();
    var sectionH   = section.offsetHeight;
    var viewportH  = window.innerHeight;
    var scrolled   = -rect.top;
    var scrollable = sectionH - viewportH;

    if (scrolled <= 0)               applyZoom(0);
    else if (scrolled >= scrollable) applyZoom(1);
    else                             applyZoom(scrolled / scrollable);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      initOrigin();
      requestAnimationFrame(onScroll);
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    originSet = false;
    initOrigin();
    setTimeout(onScroll, 50);
  });

})();

(function () {
  gsap.registerPlugin(ScrollTrigger);

  const section  = document.getElementById("hsSection");
  const track    = document.getElementById("hsTrack");
  const panels   = gsap.utils.toArray(".hs-panel");
  const progress = document.getElementById("hsProgress");
  const dotsWrap = document.getElementById("hsDots");
  const N = panels.length;

  section.style.setProperty("--hs-np", N);

  panels.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "hs-dot" + (i === 0 ? " active" : "");
    dotsWrap.appendChild(d);
  });
  const dots = dotsWrap.querySelectorAll(".hs-dot");

  const st = gsap.to(track, {
  x: () => -(track.scrollWidth - section.offsetWidth),
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: () => `+=${track.scrollWidth - section.offsetWidth}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter:     () => { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeave:     () => { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onEnterBack: () => { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeaveBack: () => { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onUpdate(self) {
        progress.style.width = self.progress * 100 + "%";
        const idx = Math.round(self.progress * (N - 1));
        dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      },
    },
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const tr = st.scrollTrigger;
      const target = tr.start + (tr.end - tr.start) * (i / (N - 1));
      gsap.to(window, { scrollTo: target, duration: .8, ease: "power2.inOut" });
    });
  });

  ScrollTrigger.addEventListener("refreshInit", () => {
    section.style.setProperty("--hs-np", N);
  });
})();


// PHASE 2

(function () {
  /* ── Scroll reveal — GSAP ScrollTrigger.batch ── */
  gsap.set('.pf-card', { opacity: 0, y: 60, scale: 0.9 });

  ScrollTrigger.batch('.pf-card', {
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        overwrite: true,
        force3D: true,
      });
    },
    start: 'top 90%',
    once: true,
  });

  /* ── Lightbox ── */
  var lb    = document.getElementById("pfLightbox");
  var inner = document.getElementById("pfLbInner");
  var img   = document.getElementById("pfLbImg");

  document.querySelectorAll(".pf-card").forEach(function (card) {
    card.addEventListener("click", function () {
      img.src = card.querySelector("img").src;
      lb.classList.add("pf-open");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLB() {
    lb.classList.remove("pf-open");
    document.body.style.overflow = "";
    img.src = "";
  }

  lb.addEventListener("click", function (e) {
    if (!inner.contains(e.target)) closeLB();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLB();
  });
})();