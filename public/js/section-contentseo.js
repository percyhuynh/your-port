(function () {
  "use strict";
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const sec = document.querySelector("#cs-portfolio");
  if (!sec) return;

  gsap.registerPlugin(ScrollTrigger);

  const qsa = (s) => sec.querySelectorAll(s);
  const qs  = (s) => sec.querySelector(s);

  /* ═══════════════════════════════════════════════════════════════
     FIX STICKY: overflow: hidden trên ancestor phá vỡ sticky.
     Dùng overflow: clip thay thế — clip không phá sticky context.
     Áp dụng cho cả #cs-portfolio và immediate parent (.section wrapper).
  ═══════════════════════════════════════════════════════════════ */
  sec.style.overflowX = "clip";
  if (sec.parentElement) {
    const parentStyle = getComputedStyle(sec.parentElement);
    /* overflow:hidden (kể cả Y) phá sticky → đổi toàn bộ sang clip */
    if (parentStyle.overflow === "hidden" || parentStyle.overflowY === "hidden") {
      sec.parentElement.style.overflow = "clip";
    }
  }

  /* ─────────────────────────────────────────
     1. HEADER TEXT SCROLL REVEAL
        Same mechanic as ab-line in section-about
  ───────────────────────────────────────── */
  const hdrLines = sec.querySelectorAll('.cs__hdr-line[data-csl]');
  /* OPT: cache vh + rAF throttle — không đọc innerHeight mỗi scroll event */
  var _csVh = window.innerHeight;
  window.addEventListener('resize', function() { _csVh = window.innerHeight; }, { passive: true });
  var _csHdrRaf = false;
  function csHdrReveal() {
    if (_csHdrRaf) return;
    _csHdrRaf = true;
    requestAnimationFrame(function() {
      _csHdrRaf = false;
      const pt = _csVh * 0.82;
      hdrLines.forEach(function (el) {
        if (el.getBoundingClientRect().top < pt) el.classList.add('cs-revealed');
      });
    });
  }
  if (hdrLines.length) {
    window.addEventListener('scroll', csHdrReveal, { passive: true });
    csHdrReveal();
  }

  /* ─────────────────────────────────────────
     2. STATS STAGGER
  ───────────────────────────────────────── */
  gsap.set(qsa(".cs__stat-item"), { y: 24, opacity: 0 });
  gsap.to(gsap.utils.toArray("#cs-portfolio .cs__stat-item"), {
    scrollTrigger: {
      trigger: "#cs-portfolio .cs__stats-strip",
      start: "top 80%",
    },
    opacity: 1, y: 0, duration: 0.7,
    ease: "power2.out", stagger: 0.12,
  });

  /* ─────────────────────────────────────────
     3. PARALLAX – dark zone bg
  ───────────────────────────────────────── */
  gsap.to("#cs-parallax-bg", {
    scrollTrigger: {
      trigger: "#cs-dark-zone",
      start: "top bottom", end: "bottom top",
      scrub: 1.5,
      onUpdate: function(self) { if (window.__isJumping) return; }, // OPT
    },
    yPercent: -18, ease: "none",
  });

  /* ─────────────────────────────────────────
     4. PROOF CARDS – zoom (scrub)
  ───────────────────────────────────────── */
  gsap.utils.toArray("#cs-portfolio .cs__proof-card").forEach((card) => {
    gsap.set(card, { scale: 0.93, opacity: 0 });
    gsap.to(card, {
      scrollTrigger: {
        trigger: card, start: "top 90%", end: "top 50%", scrub: 0.7,
      },
      scale: 1, opacity: 1, ease: "none",
    });
  });

  /* ─────────────────────────────────────────
     5. ZOOM SLOTS – zoom (scrub)
  ───────────────────────────────────────── */
  gsap.utils.toArray("#cs-portfolio .cs__zoom-slot").forEach((slot, i) => {
    gsap.set(slot, { scale: 0.93, opacity: 0 });
    gsap.to(slot, {
      scrollTrigger: {
        trigger: slot, start: "top 92%", end: "top 58%",
        scrub: 0.5 + i * 0.1,
      },
      scale: 1, opacity: 1, ease: "none",
    });
  });

  /* ─────────────────────────────────────────
     6. CTA fade-in
  ───────────────────────────────────────── */
  gsap.from("#cs-cta-strip .cs__cta-inner", {
    scrollTrigger: { trigger: "#cs-cta-strip", start: "top 80%" },
    y: 40, opacity: 0, duration: 0.9, ease: "power2.out",
  });

  /* ─────────────────────────────────────────
     6b. SCROLL LIGHT — zoom heading + dark-label
  ───────────────────────────────────────── */
  (function () {
    var slEls = sec.querySelectorAll('[data-sl]');
    if (!slEls.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('sl-lit'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    slEls.forEach(function (el) { io.observe(el); });
  }());

  /* ═══════════════════════════════════════════════════════════════
     7. PROCESS STICKY – rebuilt

     Cấu trúc cần có:
       #cs-process-wrap          ← full width, height = N × 70vh
         .cs__process-sticky     ← sticky, height: 100vh, top: 0
           .cs__process-inner    ← 2-col grid (left | right steps)

     Lỗi gốc:
     ① overflow-x:hidden trên #cs-portfolio → đã fix bằng overflow:clip
     ② .cs__process-wrap có max-width & margin bị CSS gốc giới hạn
        → reset lại để wrapper = full width, chỉ inner mới có max-width
  ═══════════════════════════════════════════════════════════════ */
  const processWrap  = qs("#cs-process-wrap");
  const stickyPanel  = qs(".cs__process-sticky");
  const steps        = Array.from(qsa(".cs__step"));
  const progressFill = qs("#cs-progress-fill");
  const N            = steps.length;

  if (!processWrap || !stickyPanel || !N) return;

  /* Reset CSS gốc của wrapper – max-width phải ở inner, không phải wrapper */
  Object.assign(processWrap.style, {
    maxWidth : "none",
    margin   : "0",
    padding  : "0",
    position : "relative",
    height   : (N * 45) + "vh",   // OPT: giảm từ 70vh → 45vh/step để scroll nhanh hơn
  });

  /* Sticky panel chiếm đúng 1 viewport, dính top */
  Object.assign(stickyPanel.style, {
    position  : "sticky",
    top       : "0",
    height    : "100vh",
    display   : "flex",
    alignItems: "center",
    overflow  : "visible",
  });

  /* State ban đầu: step 0 sáng, còn lại mờ */
  steps.forEach((step, i) => {
    step.classList.remove("is-active");
    Object.assign(step.style, {
      opacity   : i === 0 ? "1" : "0.2",
      transform : i === 0 ? "none" : "translateY(10px)",
      transition: "opacity 0.45s ease, transform 0.45s ease",
    });
    if (i === 0) step.classList.add("is-active");
  });

  let lastIndex = 0;

  function setActiveStep(index) {
    if (index === lastIndex) return;
    lastIndex = index;
    steps.forEach((step, i) => {
      const isActive = i === index;
      const isPast   = i < index;
      step.classList.toggle("is-active", isActive);
      step.style.opacity   = isActive ? "1" : isPast ? "0.38" : "0.2";
      step.style.transform = isActive ? "none" : "translateY(10px)";
    });
  }

  /* Dùng scroll listener thay vì scrub:true — scrub làm progress bị lag,
     onUpdate nhận progress mượt hoá nên step chuyển trễ / không thấy chuyển. */
  function updateProcess() {
    const rect        = processWrap.getBoundingClientRect();
    const scrolled    = -rect.top;                              // px đã cuộn qua top
    const totalScroll = processWrap.offsetHeight - window.innerHeight; // vùng hiệu lực

    if (scrolled <= 0) {
      lastIndex = -1; setActiveStep(0);
      if (progressFill) progressFill.style.height = "0%";
      return;
    }
    if (scrolled >= totalScroll) {
      lastIndex = -1; setActiveStep(N - 1);
      if (progressFill) progressFill.style.height = "100%";
      return;
    }

    const progress  = scrolled / totalScroll;
    if (progressFill) progressFill.style.height = (progress * 100) + "%";
    const stepIndex = Math.min(Math.floor(progress * N), N - 1);
    setActiveStep(stepIndex);
  }

  /* OPT: rAF throttle — updateProcess đọc getBoundingClientRect + offsetHeight mỗi scroll
     → layout thrashing. Bọc trong rAF để chỉ chạy 1 lần/frame */
  var _procRaf = false;
  function onScrollProcess() {
    if (_procRaf) return;
    _procRaf = true;
    requestAnimationFrame(function() { _procRaf = false; updateProcess(); });
  }
  window.addEventListener("scroll", onScrollProcess, { passive: true });
  updateProcess(); // chạy ngay khi tải để đặt trạng thái ban đầu đúng

  /* ─────────────────────────────────────────
     8. LIGHTBOX
  ───────────────────────────────────────── */
  const lightbox   = document.getElementById("cs-lightbox");
  const lbPanel    = document.getElementById("cs-lb-panel");
  const lbImg      = document.getElementById("cs-lb-img");
  const lbBackdrop = document.getElementById("cs-lb-backdrop");
  const lbClose    = document.getElementById("cs-lb-close");
  const lbPrev     = document.getElementById("cs-lb-prev");
  const lbNext     = document.getElementById("cs-lb-next");
  const lbTitle    = document.getElementById("cs-lb-caption-title");
  const lbTag      = document.getElementById("cs-lb-caption-tag");

  if (!lightbox) return;

  const imageWraps = Array.from(sec.querySelectorAll(".cs__card-image-wrap"));
  let currentIndex = 0;
  let lbTl         = null;

  gsap.set(lightbox, { opacity: 0 });
  gsap.set(lbPanel,  { scale: 0.88, y: 40 });

  function openLightbox(index) {
    currentIndex = index;
    const wrap   = imageWraps[index];
    lbImg.src            = wrap.dataset.src || wrap.querySelector("img").src;
    lbTitle.textContent  = wrap.dataset.title || "";
    lbTag.textContent    = wrap.dataset.tag   || "";
    lbPrev.style.display = imageWraps.length < 2 ? "none" : "flex";
    lbNext.style.display = imageWraps.length < 2 ? "none" : "flex";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (lbTl) lbTl.kill();
    lbTl = gsap.timeline()
      .to(lightbox, { opacity: 1, duration: 0.25, ease: "power2.out" })
      .to(lbPanel,  { scale: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }, "-=.1");
  }

  function closeLightbox() {
    if (lbTl) lbTl.kill();
    lbTl = gsap.timeline({
      onComplete() {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
        lbImg.src = "";
      },
    });
    lbTl
      .to(lbPanel,  { scale: 0.92, y: 30, duration: 0.28, ease: "power2.in" })
      .to(lightbox, { opacity: 0,          duration: 0.2,  ease: "power2.in" }, "-=.08");
  }

  function goTo(dir) {
    currentIndex = (currentIndex + dir + imageWraps.length) % imageWraps.length;
    gsap.to(lbImg, {
      x: dir * -80, opacity: 0, duration: 0.18, ease: "power2.in",
      onComplete() {
        const wrap      = imageWraps[currentIndex];
        lbImg.src       = wrap.dataset.src || wrap.querySelector("img").src;
        lbTitle.textContent = wrap.dataset.title || "";
        lbTag.textContent   = wrap.dataset.tag   || "";
        gsap.fromTo(lbImg,
          { x: dir * 80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.28, ease: "power2.out" }
        );
      },
    });
  }

  imageWraps.forEach((wrap, i) => wrap.addEventListener("click", () => openLightbox(i)));
  lbClose.addEventListener("click", closeLightbox);
  lbBackdrop.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => goTo(-1));
  lbNext.addEventListener("click", () => goTo(1));
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape")     closeLightbox();
    if (e.key === "ArrowLeft")  goTo(-1);
    if (e.key === "ArrowRight") goTo(1);
  });
})();

/* ═══════════════════════════════════════════════════════════════
   GTrip SEO Widget — interactive canvas diagram
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   GTrip SEO Widget — Canvas diagram
   Paste vào cuối section-contentseo.js
   Requires: #gtrip-seo-canvas, #gtrip-seo-links, #nfaWrap0
   TODO: thêm href vào từng node (xem comment /* href *\/)
════════════════════════════════════════════════════════════════ */
(function () {
  var cv = document.getElementById('gtrip-seo-canvas');
  if (!cv) return;

  /* ── Colors ── */
  var RED    = '#6b1a1a';
  var RED_LT = '#c04040';
  var C_STROKE = 'rgba(200,190,175,0.5)';
  var C_FILL   = 'rgba(255,255,255,0.92)';
  var C_TEXT   = '#111111';
  var C_LINE   = 'rgba(255,255,255,0.45)';
  var C_URL    = 'rgba(255,255,255,0.70)';

  /* ── Canvas ── */
  var W = 562, H = 742, PAD = 10;
  var DPR = window.devicePixelRatio || 1;
  var ctx = cv.getContext('2d');
  cv.width  = (W + PAD * 2) * DPR;
  cv.height = (H + PAD * 2) * DPR;
  cv.style.width  = (W + PAD * 2) + 'px';
  cv.style.height = (H + PAD * 2) + 'px';
  ctx.scale(DPR, DPR);
  ctx.translate(PAD, PAD);

  /* ── Nodes — tọa độ từ SVG gốc ── */
  /* Y coordinates scaled ×1.6 vs SVG original for taller diagram */
  var NODES = [
    { id: 'gtrip',        x: 200, y: 0,   w: 120, h: 48, text: 'GTrip',             branch: 'root'  },
    { id: 'attractions',  x: 0,   y: 176, w: 120, h: 64, text: 'Attractions',        branch: 'left'  },
    { id: 'travel_blogs', x: 400, y: 176, w: 120, h: 64, text: 'Travel Blogs',       branch: 'right' },
    { id: 'hanoi',        x: 0,   y: 320, w: 120, h: 64, text: 'Hanoi',              branch: 'left'  },
    { id: 'ninh_binh',    x: 0,   y: 384, w: 120, h: 64, text: 'Ninh Binh',          branch: 'left'  },
    { id: 'da_nang',      x: 0,   y: 448, w: 120, h: 64, text: 'Da Nang',            branch: 'left'  },
    { id: 'hcm',          x: 0,   y: 512, w: 120, h: 64, text: 'Ho Chi Minh',        branch: 'left'  },
    { id: 'pagoda',       x: 180, y: 368, w: 100, h: 64, text: 'One Pillar Pagoda',  branch: 'left'  },
    { id: 'hoan_kiem',    x: 180, y: 432, w: 100, h: 64, text: 'Hoan Kiem Lake',     branch: 'left'  },
    { id: 'hoa_lo',       x: 180, y: 496, w: 100, h: 64, text: 'Hoa Lo Prison',      branch: 'left'  },
    { id: 'phan_dinh',    x: 180, y: 560, w: 100, h: 64, text: 'Phan Dinh Phung St', branch: 'left'  },
    { id: 'travel_guide', x: 410, y: 400, w: 100, h: 64, text: 'Travel Guide',       branch: 'right' },
    { id: 'toplist',      x: 410, y: 480, w: 100, h: 64, text: 'Toplist',            branch: 'right' },
    { id: 'things_to_do', x: 410, y: 560, w: 100, h: 64, text: 'Things to do',       branch: 'right' },
    { id: 'events',       x: 410, y: 640, w: 100, h: 64, text: 'Events',             branch: 'right' },
  ];

  /* ── Edges — animated paths ── */
  /* Edge paths: Y coordinates ×1.6 */
  var EDGES = [
    { from: 'gtrip',       to: 'attractions',  path: 'M260,48 V112 H70 Q60,112 60,128 V176' },
    { from: 'gtrip',       to: 'travel_blogs', path: 'M260,48 V112 H450 Q460,112 460,128 V176' },
    { from: 'attractions', to: 'hanoi',         path: 'M60,240 V320' },
    { from: 'hanoi',       to: 'pagoda',        path: 'M120,352 H140 Q150,352 150,368 V400 Q150,416 160,416 H180' },
    { from: 'hanoi',       to: 'hoan_kiem',     path: 'M120,352 H140 Q150,352 150,368 V464 Q150,480 160,480 H180' },
    { from: 'hanoi',       to: 'hoa_lo',        path: 'M120,352 H140 Q150,352 150,368 V528 Q150,544 160,544 H180' },
    { from: 'hanoi',       to: 'phan_dinh',     path: 'M120,352 H140 Q150,352 150,368 V592 Q150,608 160,608 H180' },
  ];

  /* ── Helpers ── */
  function getNode(id) { return NODES.find(function (n) { return n.id === id; }); }

  function getChain(tid) {
    var c = [], cur = tid, seen = {};
    while (cur && !seen[cur]) {
      seen[cur] = 1;
      var e = EDGES.find(function (e) { return e.to === cur; });
      if (!e) break;
      c.unshift(e); cur = e.from;
    }
    return c;
  }

  function parsePath(d) {
    var pts = [], ox = 0, oy = 0;
    (d.match(/[MVHQLmvhql][^MVHQLmvhql]*/gi) || []).forEach(function (tok) {
      var t = tok[0];
      var ns = tok.slice(1).trim().split(/[\s,]+/).map(Number).filter(function (n) { return !isNaN(n); });
      if      (t === 'M') { ox = ns[0]; oy = ns[1]; pts.push([ox, oy]); }
      else if (t === 'L') { ox = ns[0]; oy = ns[1]; pts.push([ox, oy]); }
      else if (t === 'H') { ox = ns[0]; pts.push([ox, oy]); }
      else if (t === 'V') { oy = ns[0]; pts.push([ox, oy]); }
      else if (t === 'Q') {
        var x1 = ns[0], y1 = ns[1], x2 = ns[2], y2 = ns[3];
        for (var s = 0.1; s <= 1.001; s += 0.1)
          pts.push([(1-s)*(1-s)*ox + 2*(1-s)*s*x1 + s*s*x2,
                    (1-s)*(1-s)*oy + 2*(1-s)*s*y1 + s*s*y2]);
        ox = x2; oy = y2;
      }
    });
    return pts;
  }

  function arrowHead(pts, color, sz) {
    if (pts.length < 2) return; sz = sz || 7;
    var a = pts[pts.length - 1], b = pts[pts.length - 2];
    var ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(a[0] - sz * Math.cos(ang - .38), a[1] - sz * Math.sin(ang - .38));
    ctx.lineTo(a[0] - sz * Math.cos(ang + .38), a[1] - sz * Math.sin(ang + .38));
    ctx.closePath(); ctx.fill();
  }

  function drawPts(pts, color, lw) {
    if (pts.length < 2) return;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  function drawPtsPartial(pts, color, lw, prog) {
    if (pts.length < 2 || prog <= 0) return;
    var tot = pts.length - 1, drawn = prog * tot, full = Math.floor(drawn), frac = drawn - full;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i <= Math.min(full, tot); i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (full < tot) ctx.lineTo(
      pts[full][0] + (pts[full + 1][0] - pts[full][0]) * frac,
      pts[full][1] + (pts[full + 1][1] - pts[full][1]) * frac
    );
    ctx.stroke();
  }

  function drawNode(n, active) {
    ctx.save();
    ctx.fillStyle   = active ? RED    : C_FILL;
    ctx.strokeStyle = active ? RED_LT : C_STROKE;
    ctx.lineWidth   = active ? 2 : 1.5;
    ctx.beginPath(); ctx.roundRect(n.x + .5, n.y + .5, n.w, n.h, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#fff' : C_TEXT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tx = n.x + n.w / 2, ty = n.y + n.h / 2;
    if (n.id === 'gtrip') {
      ctx.font = 'bold 15px "Courier Prime", monospace'; ctx.fillText(n.text, tx, ty);
    } else if (n.text.length > 13 && n.w <= 105) {
      var words = n.text.split(' '), mid = Math.ceil(words.length / 2);
      ctx.font = (active ? 'bold ' : '') + '11.5px "Courier Prime", monospace';
      ctx.fillText(words.slice(0, mid).join(' '), tx, ty - 11);
      ctx.fillText(words.slice(mid).join(' '), tx, ty + 11);
    } else {
      ctx.font = (active ? 'bold ' : '') + '12px "Courier Prime", monospace';
      ctx.fillText(n.text, tx, ty);
    }
    ctx.restore();
  }

  function drawBase() {
    ctx.save();
    // All edges gray
    EDGES.forEach(function (e) {
      var pts = parsePath(e.path); drawPts(pts, C_LINE, 1.5); arrowHead(pts, C_LINE);
    });
    // Travel Blogs → cluster box (Y×1.6)
    drawPts([[459.8, 240], [459.8, 309]], C_LINE, 1.5);
    arrowHead([[459.8, 298], [459.8, 318]], C_LINE);
    // Dashed cluster box
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(360.5, 337, 200, 400, 30); ctx.stroke(); ctx.setLineDash([]);
    // Labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.fillText('Topic Cluster', 460, 355);
    // Dots below HCM (Y×1.6)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 8]);
    ctx.beginPath(); ctx.moveTo(59.83, 664); ctx.lineTo(59.83, 728); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }

  /* ── State ── */
  var activeId = null, chain = [], eIdx = 0, eProg = 0, running = false, SPEED = 0.03;

  function render() {
    ctx.clearRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
    drawBase();
    for (var i = 0; i < chain.length; i++) {
      var pts = parsePath(chain[i].path);
      if      (i < eIdx)    { drawPts(pts, RED_LT, 2.5); arrowHead(pts, RED_LT); }
      else if (i === eIdx)  { drawPtsPartial(pts, RED_LT, 2.5, eProg); }
    }
    NODES.forEach(function (n) { drawNode(n, n.id === activeId); });
  }

  function tick() {
    if (!running) return;
    eProg += SPEED;
    if (eProg >= 1) { eProg = 0; eIdx++; }
    if (eIdx >= chain.length) { running = false; eIdx = chain.length; eProg = 1; }
    render(); if (running) requestAnimationFrame(tick);
  }

  function activate(id) {
    activeId = id;
    var n = getNode(id);
    if (n && n.branch === 'right') {
      // Right branch: animate GTrip → Travel Blogs
      chain = [EDGES.find(function (e) { return e.to === 'travel_blogs'; })];
    } else {
      chain = getChain(id);
    }
    eIdx = 0; eProg = 0; running = true; requestAnimationFrame(tick);
  }

  /* ── Anchor overlays ── */
  var linksDiv = document.getElementById('gtrip-seo-links');
  linksDiv.style.cssText = 'position:absolute;top:' + PAD + 'px;left:' + PAD + 'px;';
  NODES.forEach(function (n) {
    var a = document.createElement('a');
    if (n.href) { a.href = n.href; a.target = '_blank'; a.rel = 'noopener'; }
    a.title = n.text;
    a.style.cssText = 'position:absolute;left:' + n.x + 'px;top:' + n.y + 'px;width:' + n.w + 'px;height:' + n.h + 'px;border-radius:5px;cursor:pointer;text-decoration:none;';
    a.addEventListener('click', function (e) {
      e.preventDefault(); activate(n.id);
      if (n.href) setTimeout(function () { window.open(n.href, '_blank'); }, chain.length * 420 + 300);
    });
    linksDiv.appendChild(a);
  });

  render();

  /* ── Responsive: zoom (affects layout + pointer events) ── */
  var gWidgetEl = document.getElementById('gtrip-seo-widget');
  var gWrapEl   = document.getElementById('nfaWrap0');
  var G_NAT = W + PAD * 2;

  function scaleGTrip() {
    if (!gWrapEl || !gWidgetEl) return;
    var cw = gWrapEl.offsetWidth; if (!cw) return;
    var sc = Math.min(1, cw / G_NAT);
    gWidgetEl.style.zoom      = sc < 1 ? String(sc) : '';
    gWidgetEl.style.transform = '';
  }
  requestAnimationFrame(scaleGTrip);
  window.addEventListener('resize', scaleGTrip, { passive: true });
}());

/* ═══════════════════════════════════════════════════════════════
   Freelance Content SEO Widget — radial industry diagram
═══════════════════════════════════════════════════════════════ */
(function () {
  var cv = document.getElementById('fseo-canvas');
  if (!cv) return;

  var RED = '#6b1a1a';
  var CX = 310, CY = 278, R = 240, CR = 54, BW = 115, BH = 60;
  var W = 640, H = 564, PAD = 10;
  var DPR = window.devicePixelRatio || 1;
  var ctx = cv.getContext('2d');
  cv.width  = (W+PAD*2)*DPR; cv.height = (H+PAD*2)*DPR;
  cv.style.width  = (W+PAD*2)+'px'; cv.style.height = (H+PAD*2)+'px';
  ctx.scale(DPR,DPR); ctx.translate(PAD,PAD);

  var nodeData = [
    { id:'travel',      angle:-90,  label:'Travel',          sub:['Destination','Guide · Toplist'] },
    { id:'investment',  angle:-54,  label:'Investment',      sub:['Blog · Guide','News · Analysis'] },
    { id:'healthcare',  angle:-18,  label:'Healthcare',      sub:['Medical Info','Health Guide'] },
    { id:'pharma',      angle:18,   label:'Pharmaceuticals', sub:['Drug Info','(Educational)'] },
    { id:'sports',      angle:54,   label:'Sports',          sub:['News · Update','Tips · Analysis'] },
    { id:'education',   angle:90,   label:'Education',       sub:['Guide · Resource','Study Tips'] },
    { id:'lifestyle',   angle:126,  label:'Lifestyle',       sub:['Blog · Tips','Inspiration'] },
    { id:'technology',  angle:162,  label:'Technology',      sub:['Review · Guide','How-to · Tutorial'] },
    { id:'ecommerce',   angle:198,  label:'E-commerce',      sub:['Product Guide','Review · Comparison'] },
    { id:'beauty',      angle:234,  label:'Beauty',          sub:['Blog · Guide','Brand · Skincare'] },
  ];

  var NODES = nodeData.map(function (n) {
    var rad = n.angle * Math.PI / 180;
    var ncx = CX + R*Math.cos(rad), ncy = CY + R*Math.sin(rad);
    return { id:n.id, label:n.label, sub:n.sub, rad:rad, bx:ncx-BW/2, by:ncy-BH/2, bw:BW, bh:BH, cx:ncx, cy:ncy };
  });

  var activeId = null, animProg = 0, running = false, SPEED = 0.07;

  function circleEdgePt(n) { return { x: CX+CR*Math.cos(n.rad), y: CY+CR*Math.sin(n.rad) }; }
  function boxEdgePt(n) {
    var dx = CX-n.cx, dy = CY-n.cy, ang = Math.atan2(dy,dx);
    var ac = Math.abs(Math.cos(ang)), as = Math.abs(Math.sin(ang));
    var t = (BW/2*as <= BH/2*ac) ? (BW/2)/ac : (BH/2)/as;
    return { x: n.cx+Math.cos(ang)*t, y: n.cy+Math.sin(ang)*t };
  }
  function arrowHead(x1,y1,x2,y2,color,sz) {
    var ang = Math.atan2(y2-y1,x2-x1);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2,y2); ctx.lineTo(x2-sz*Math.cos(ang-.4),y2-sz*Math.sin(ang-.4));
    ctx.lineTo(x2-sz*Math.cos(ang+.4),y2-sz*Math.sin(ang+.4)); ctx.closePath(); ctx.fill();
  }

  var FC_FILL   = 'rgba(255,255,255,0.92)';
  var FC_STROKE = 'rgba(200,190,175,0.5)';
  var FC_TEXT   = '#111111';
  var FC_SUB    = '#555555';
  var FC_LINE   = 'rgba(255,255,255,0.45)';

  function drawCenter() {
    ctx.save();
    ctx.fillStyle = FC_FILL; ctx.strokeStyle = FC_STROKE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(CX,CY,CR,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // ctx.font = '18px serif'; ctx.fillStyle = '#888';
    // ctx.fillText(', CX, CY - 18);
    ctx.fillStyle = FC_TEXT; ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.fillText('SEO CONTENT', CX, CY + 3);
    ctx.fillStyle = FC_SUB; ctx.font = '9.5px "Courier Prime", monospace';
    ctx.fillText('STRATEGY &', CX, CY + 16); ctx.fillText('EXECUTION', CX, CY + 27);
    ctx.restore();
  }

  function drawNode(n, active) {
    ctx.save();
    ctx.fillStyle   = active ? RED : FC_FILL;
    ctx.strokeStyle = active ? RED : FC_STROKE;
    ctx.lineWidth   = active ? 2 : 1.5;
    ctx.beginPath(); ctx.roundRect(n.bx+.5,n.by+.5,n.bw,n.bh,10); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tx = n.cx;
    ctx.fillStyle = active ? '#fff' : FC_TEXT;
    ctx.font = 'bold 11px "Courier Prime", monospace';
    if (ctx.measureText(n.label).width > n.bw - 10) {
      var words = n.label.split(' '), mid = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0,mid).join(' '), tx, n.by + 12);
      ctx.fillText(words.slice(mid).join(' '),   tx, n.by + 24);
      ctx.fillStyle = active ? 'rgba(255,255,255,.88)' : FC_SUB;
      ctx.font = '9.5px "Courier Prime", monospace';
      n.sub.forEach(function(l,i){ ctx.fillText(l, tx, n.by + 37 + i * 12); });
    } else {
      ctx.fillText(n.label, tx, n.by + 15);
      ctx.fillStyle = active ? 'rgba(255,255,255,.88)' : FC_SUB;
      ctx.font = '9.5px "Courier Prime", monospace';
      n.sub.forEach(function(l,i){ ctx.fillText(l, tx, n.by + 30 + i * 12); });
    }
    ctx.restore();
  }

  function drawAllLines(aid, prog) {
    ctx.save();
    NODES.forEach(function (n) {
      var isActive = n.id === aid, sp = circleEdgePt(n), ep = boxEdgePt(n);
      if (isActive) {
        var px = sp.x + (ep.x - sp.x)*prog, py = sp.y + (ep.y - sp.y)*prog;
        ctx.beginPath(); ctx.strokeStyle = RED; ctx.lineWidth = 2.5;
        ctx.moveTo(sp.x, sp.y); ctx.lineTo(px, py); ctx.stroke();
        if (prog > 0.15) arrowHead(sp.x,sp.y,px,py,RED,7);
      } else {
        ctx.beginPath(); ctx.strokeStyle = FC_LINE; ctx.lineWidth = 1.2;
        ctx.moveTo(sp.x, sp.y); ctx.lineTo(ep.x, ep.y); ctx.stroke();
        arrowHead(sp.x,sp.y,ep.x,ep.y,FC_LINE,5);
      }
    });
    ctx.restore();
  }

  function render() {
    ctx.clearRect(-PAD,-PAD,W+PAD*2,H+PAD*2); drawAllLines(activeId,animProg); drawCenter();
    NODES.forEach(function (n){drawNode(n,n.id===activeId);});
  }
  function tick() {
    if(!running)return; animProg+=SPEED; if(animProg>=1){animProg=1;running=false;}
    render(); if(running)requestAnimationFrame(tick);
  }
  function activate(id){activeId=id;animProg=0;running=true;requestAnimationFrame(tick);}

  var fLinksDiv = document.getElementById('fseo-links');
  fLinksDiv.style.cssText='position:absolute;top:'+PAD+'px;left:'+PAD+'px;';
  NODES.forEach(function(n){
    var a=document.createElement('a');
    a.title=n.label;
    a.style.cssText='position:absolute;left:'+n.bx+'px;top:'+n.by+'px;width:'+n.bw+'px;height:'+n.bh+'px;border-radius:10px;cursor:pointer;text-decoration:none;';
    a.addEventListener('mouseover',function(){a.style.background='rgba(107,26,26,.07)';});
    a.addEventListener('mouseout', function(){a.style.background='';});
    a.addEventListener('click',function(e){e.preventDefault();activate(n.id);});
    fLinksDiv.appendChild(a);
  });
  render();

  // Responsive scale via zoom — affects layout + pointer events correctly
  var fWidgetEl = document.getElementById('fseo-widget');
  var fWrapEl   = document.getElementById('nfaWrap2');
  var F_W = W + PAD * 2 + 32;
  function scaleFseo() {
    if (!fWrapEl || !fWidgetEl) return;
    var cw = fWrapEl.offsetWidth; if (!cw) return;
    var sc = Math.min(1, cw / F_W);
    fWidgetEl.style.zoom = sc < 1 ? String(sc) : '';
    fWidgetEl.style.transform = '';
    fWidgetEl.style.transformOrigin = '';
  }
  requestAnimationFrame(scaleFseo);
  window.addEventListener('resize', scaleFseo);
})();


// Royal Helmet SEO Widget

(function(){
  'use strict';
  var cv=document.getElementById('rh-seo-canvas');
  if(!cv)return;
  var W=780,H=1000,CX=382,CY=500,BW=130,BH=60,BR=9;
  cv.width=W; cv.height=H;

  var ctx=cv.getContext('2d');

  var overlay=document.getElementById('rh-seo-links');
  overlay.style.cssText='position:absolute;top:0;left:0;width:'+W+'px;height:'+H+'px;pointer-events:none;';

  var _oldTip=document.getElementById('rh-tip');
  if(_oldTip)_oldTip.parentNode.removeChild(_oldTip);
  var tip=document.createElement('div');
  tip.id='rh-tip';
  tip.style.cssText='position:fixed;z-index:999999;display:none;background:#111;color:#fff;font-family:"Courier Prime",monospace;font-size:11px;line-height:1.6;padding:7px 11px;border-radius:6px;max-width:180px;pointer-events:none;';
  document.body.appendChild(tip);

  function deg2rad(d){return(d-90)*Math.PI/180;}
  function boxEdgePoint(cx,cy,bw,bh,ux,uy){
    var tx=Infinity,ty=Infinity;
    if(Math.abs(ux)>1e-9)tx=(ux>0?bw/2:-bw/2)/ux;
    if(Math.abs(uy)>1e-9)ty=(uy>0?bh/2:-bh/2)/uy;
    var t=Math.min(tx,ty);return[cx+ux*t,cy+uy*t];
  }

  var BOXES=[
    {id:'hg',lbl:'Helmet Guide',          angle:0,  dist:360,tips:['How to choose','Helmet safety','Certifications'],      tipsDir:'above'},
    {id:'pt',lbl:'Product Types',         angle:300,dist:360,tips:['1/2 Helmet','3/4 Helmet','Full Face','Kid Helmet'],     tipsDir:'above'},
    {id:'bg',lbl:'Buying Guide',          angle:60, dist:360,tips:['Materials','Size Guide','Price Range'],                 tipsDir:'above'},
    {id:'mt',lbl:'Maintenance',           angle:240,dist:360,tips:['Storage','Helmet Care','Cleaning Tips'],                tipsDir:'below'},
    {id:'sk',lbl:'Safety\nKnowledge',     angle:120,dist:360,tips:['Safety Standards','Impact Protection','Riding Safety'], tipsDir:'below'},
    {id:'rv',lbl:'Reviews &\nComparisons',angle:180,dist:360,tips:['Product Reviews','Top Picks','Comparisons'],            tipsDir:'below'},
  ];

  BOXES.forEach(function(b){
    var rad=deg2rad(b.angle);
    b.cx=CX+b.dist*Math.cos(rad); b.cy=CY+b.dist*Math.sin(rad);
    b.x=b.cx-BW/2; b.y=b.cy-BH/2; b.rad=rad;
    b.lx1=CX+120*Math.cos(rad); b.ly1=CY+120*Math.sin(rad);
    var ux=-Math.cos(rad),uy=-Math.sin(rad),ep=boxEdgePoint(b.cx,b.cy,BW,BH,ux,uy);
    b.lx2=ep[0]; b.ly2=ep[1];
  });

  var active=null,animT={},rafId=null,SPEED=0.035;

  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

  function arrowHead(x1,y1,x2,y2,col){
    var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<1)return;
    var ux=dx/len,uy=dy/len,px=-uy,py=ux,hw=5,hl=11,t2x=x2-ux,t2y=y2-uy;
    ctx.beginPath();ctx.moveTo(t2x,t2y);ctx.lineTo(t2x-ux*hl+px*hw,t2y-uy*hl+py*hw);ctx.lineTo(t2x-ux*hl-px*hw,t2y-uy*hl-py*hw);ctx.closePath();ctx.fillStyle=col;ctx.fill();
  }

  function lineEnd(b){
    var dx=b.lx2-b.lx1,dy=b.ly2-b.ly1,len=Math.sqrt(dx*dx+dy*dy),ux=dx/len,uy=dy/len;
    return[b.lx2-ux*12,b.ly2-uy*12];
  }

  function drawBullets(b,isA){
    var lh=14,n=b.tips.length,tx=b.x+4,ty=b.tipsDir==='above'?b.y-6-n*lh:b.y+BH+6;
    ctx.fillStyle=isA?'#c04040':'rgba(255,255,255,0.68)';ctx.font='10px "Courier Prime", monospace';
    ctx.textAlign='left';ctx.textBaseline='top';
    b.tips.forEach(function(t,j){ctx.fillText('• '+t,tx,ty+j*lh);});
  }

  function render(){
    ctx.clearRect(0,0,W,H);
    [[280,[3,3],1.2],[120,[3,3],1.2],[70,[],1.8]].forEach(function(e){
      ctx.beginPath();ctx.ellipse(CX,CY,e[0],e[0],0,0,Math.PI*2);
      ctx.setLineDash(e[1]);ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=e[2];ctx.stroke();ctx.setLineDash([]);
    });
    BOXES.forEach(function(b){var le=lineEnd(b);ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.lx1,b.ly1);ctx.lineTo(le[0],le[1]);ctx.stroke();});
    if(active){BOXES.forEach(function(b){if(b.id!==active)return;var t=animT[b.id]||0,le=lineEnd(b),ex=b.lx1+(le[0]-b.lx1)*t,ey=b.ly1+(le[1]-b.ly1)*t;ctx.strokeStyle='#c04040';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(b.lx1,b.ly1);ctx.lineTo(ex,ey);ctx.stroke();});}
    BOXES.forEach(function(b){drawBullets(b,active===b.id);});
    BOXES.forEach(function(b){
      var isA=active===b.id;
      ctx.fillStyle=isA?'#6b1a1a':'rgba(255,255,255,0.92)';ctx.strokeStyle=isA?'#6b1a1a':'rgba(200,190,175,0.5)';ctx.lineWidth=isA?2:1;
      rr(b.x,b.y,BW,BH,BR);ctx.fill();ctx.stroke();
      ctx.fillStyle=isA?'#ffffff':'#111111';ctx.textAlign='center';ctx.textBaseline='middle';
      var lines=b.lbl.split('\n');
      if(lines.length===1){ctx.font='bold 12px "Courier Prime", monospace';ctx.fillText(b.lbl,b.cx,b.cy);}
      else{ctx.font='bold 11px "Courier Prime", monospace';ctx.fillText(lines[0],b.cx,b.cy-8);ctx.fillText(lines[1],b.cx,b.cy+8);}
    });
    BOXES.forEach(function(b){arrowHead(b.lx1,b.ly1,b.lx2,b.ly2,'rgba(255,255,255,0.5)');});
    if(active)BOXES.forEach(function(b){if(b.id!==active||((animT[b.id]||0)<0.99))return;arrowHead(b.lx1,b.ly1,b.lx2,b.ly2,'#c04040');});
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.beginPath();ctx.ellipse(CX,CY,70,70,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(200,190,175,0.5)';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(CX,CY,70,70,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#111111';ctx.font='bold 13px "Courier Prime", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Royal',CX,CY-8);ctx.fillText('Helmet',CX,CY+8);
  }

  function animate(){
    var t=animT[active]||0;
    if(t<1){animT[active]=Math.min(t+SPEED,1);render();rafId=requestAnimationFrame(animate);}
    else{render();}
  }

  BOXES.forEach(function(b){
    var el=document.createElement('div');
    el.style.cssText='position:absolute;left:'+b.x+'px;top:'+b.y+'px;width:'+BW+'px;height:'+BH+'px;border-radius:'+BR+'px;cursor:pointer;pointer-events:auto;';
    el.addEventListener('mouseenter',function(){
      tip.innerHTML='<b>'+b.lbl.replace('\n',' ')+'</b>'+b.tips.map(function(t){return'<br>• '+t;}).join('');
      tip.style.display='block';
    });
    el.addEventListener('mousemove',function(e){
      var l=e.clientX+12,t2=e.clientY+8;
      if(l+tip.offsetWidth>window.innerWidth-8)l=e.clientX-tip.offsetWidth-12;
      if(t2+tip.offsetHeight>window.innerHeight-8)t2=e.clientY-tip.offsetHeight-8;
      tip.style.left=l+'px';tip.style.top=t2+'px';
    });
    el.addEventListener('mouseleave',function(){tip.style.display='none';});
    el.addEventListener('click',function(){
      if(active===b.id){active=null;render();return;}
      active=b.id;animT[b.id]=0;if(rafId)cancelAnimationFrame(rafId);animate();
    });
    overlay.appendChild(el);
  });

  var coreEl=document.createElement('div');
  coreEl.style.cssText='position:absolute;left:'+(CX-70)+'px;top:'+(CY-70)+'px;width:140px;height:140px;border-radius:50%;cursor:pointer;pointer-events:auto;';
  coreEl.addEventListener('click',function(){active=null;if(rafId)cancelAnimationFrame(rafId);render();});
  overlay.appendChild(coreEl);

  render();

  var rhWidgetEl=document.getElementById('rh-seo-widget');
  var rhWrapEl=document.getElementById('nfaWrap1');
  function scaleRH(){
    if(!rhWrapEl||!rhWidgetEl)return;
    var cw=rhWrapEl.offsetWidth;if(!cw)return;
    var sc=Math.min(1,cw/W);
    rhWidgetEl.style.zoom=sc<1?String(sc):'';
    rhWidgetEl.style.transform='';
  }
  requestAnimationFrame(scaleRH);
  window.addEventListener('resize',scaleRH);
})();