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
  function csHdrReveal() {
    const pt = window.innerHeight * 0.82;
    hdrLines.forEach(function (el) {
      if (el.getBoundingClientRect().top < pt) el.classList.add('cs-revealed');
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
    height   : (N * 70) + "vh",   // 4 steps = 280vh scroll room (shorter)
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

  window.addEventListener("scroll", updateProcess, { passive: true });
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