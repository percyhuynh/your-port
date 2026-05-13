/* ── UIUX ZOOM INTRO ── */
(function () {
  /* Mobile: tắt hoàn toàn zoom animation — CSS đã hiện content trực tiếp */
  if (window.innerWidth <= 768) return;

  var section = document.getElementById('uiux-sticky-wrap');
  var heading = document.getElementById('uiux-heading');
  var pivot   = document.getElementById('uiux-pivot');
  var black   = document.getElementById('uiux-black');
  var content = document.getElementById('uiux-content');

  if (!section || !heading || !pivot) return;

  var MAX_SCALE = 100;
  var originSet = false;

  /* IntersectionObserver — chỉ quản lý GPU layer, KHÔNG block applyZoom */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        /* Section ra ngoài viewport hoàn toàn → giải phóng GPU layer */
        heading.style.willChange = 'auto';
        heading.style.transform  = 'scale(0.001)';
        originSet = false; /* Force reinit khi scroll trở lại */
      } else {
        heading.style.willChange = 'transform';
        /* Reinit origin nếu cần */
        if (!originSet) initOrigin();
      }
    });
  }, { rootMargin: '0px 0px 0px 0px' }); /* Không buffer — chỉ fire khi thật sự ra/vào */

  observer.observe(section);

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


      // Scale đủ phủ góc xa nhất × 6, nhưng cap ở 30
      // Trên 30x chữ đã phủ toàn màn hình — không cần scale thêm
      // black overlay sẽ fade in che phần còn lại → nhẹ hơn rất nhiều
      var maxDist = Math.max(
        Math.hypot(pvx,     pvy),
        Math.hypot(W - pvx, pvy),
        Math.hypot(pvx,     H - pvy),
        Math.hypot(W - pvx, H - pvy)
      );
      MAX_SCALE = Math.min((maxDist / (pr.width / 2)) * 6, 30);

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
    if (!originSet || window.__isJumping) return;

    var P_SPLIT  = 0.788;
    var MID_FRAC = 0.018;

    var scale;
    if (p <= P_SPLIT) {
      // Phase 1: zoom chậm từ 0 → MID_FRAC * MAX_SCALE (~3x)
      scale = (p / P_SPLIT) * MID_FRAC * MAX_SCALE;
    } else {
      // Phase 2: zoom nhanh đến MAX_SCALE (capped ở 30)
      var t2 = (p - P_SPLIT) / (1 - P_SPLIT);
      scale  = (MID_FRAC + t2 * (1 - MID_FRAC)) * MAX_SCALE;
    }
    heading.style.transform = 'scale(' + Math.max(scale, 0.001) + ')';

    var p2 = p <= P_SPLIT ? 0 : (p - P_SPLIT) / (1 - P_SPLIT);

    // Black: fade out trong phase 2 — cũng dùng để che khi scale chưa phủ hết
    black.style.opacity = String(Math.max(0, 1 - p2));

    if (content) {
      var t3 = Math.max(0, (p2 - 0.9) / 0.1);
      content.style.opacity       = String(Math.min(t3, 1));
      content.style.pointerEvents = t3 > 0.5 ? 'auto' : 'none';
    }
  }

  var rafPending = false;
  function onScroll() {
    /* Skip hoàn toàn khi đang navigate bằng menu — không render animation khi jump */
    if (window.__isJumping) return;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      var rect      = section.getBoundingClientRect();
      var sectionH  = section.offsetHeight;
      var viewportH = window.innerHeight;
      var scrolled  = -rect.top;
      var scrollable= sectionH - viewportH;

      if (scrolled <= 0)               applyZoom(0);
      else if (scrolled >= scrollable) applyZoom(1);
      else                             applyZoom(scrolled / scrollable);
    });
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
  /* Mobile: dùng CSS scroll-snap thay GSAP pin — nhẹ hơn, không cần JS */
  if (window.innerWidth <= 768) return;

  gsap.registerPlugin(ScrollTrigger);

  var section  = document.getElementById("hsSection");
  var track    = document.getElementById("hsTrack");
  var panels   = document.querySelectorAll(".hs-panel");
  var progress = document.getElementById("hsProgress");
  var dotsWrap = document.getElementById("hsDots");
  var N = panels.length;

  if (!section || !track || !N) return;

  panels.forEach(function(_, i) {
    var d = document.createElement("div");
    d.className = "hs-dot" + (i === 0 ? " active" : "");
    dotsWrap.appendChild(d);
  });
  var dots = dotsWrap.querySelectorAll(".hs-dot");

  /* OPT: scrub: 0.8 thay vì scrub: 1 → giảm bounce/nảy khi scroll nhanh.
     anticipatePin: 1 giữ nguyên để tránh flicker khi pin bắt đầu.
     Thêm __isJumping check trong onUpdate → skip khi đang navigate bằng menu */
  gsap.to(track, {
    x: function() { return -(track.scrollWidth - section.offsetWidth); },
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: function() { return "+=" + (track.scrollWidth - section.offsetWidth); },
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onEnter:     function() { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeave:     function() { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onEnterBack: function() { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeaveBack: function() { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onUpdate: function(self) {
        if (window.__isJumping) return; // skip khi đang navigate
        progress.style.width = (self.progress * 100) + "%";
        var idx = Math.round(self.progress * (N - 1));
        dots.forEach(function(d, i) { d.classList.toggle("active", i === idx); });
      },
    },
  });

  dots.forEach(function(dot, i) {
    dot.addEventListener("click", function() {
      // scroll ngang bằng GSAP — không ảnh hưởng scroll dọc
      var tr = ScrollTrigger.getById("hs");
      if (!tr) return;
      var target = tr.start + (tr.end - tr.start) * (i / (N - 1));
      gsap.to(window, { scrollTo: target, duration: 0.6, ease: "power2.inOut" });
    });
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