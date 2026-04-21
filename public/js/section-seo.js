(function () {
  "use strict";
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const sec = document.querySelector("#seo-trangy");
  if (!sec) return;
  const q  = (s) => sec.querySelector(s);
  const qa = (s) => sec.querySelectorAll(s);

  /* ══════════════════════════════════════════════
     1. HERO — zoom in từ nhỏ lên (Giữ nguyên không biến mất)
  ══════════════════════════════════════════════ */
  const heroEls = [q(".st__hero-eyebrow"), q(".st__hero-title"), q(".st__hero-sub")];

  // Trạng thái ban đầu: Ẩn và thu nhỏ một chút
  gsap.set(heroEls, { opacity: 0, scale: 0.72, y: 24 });

  // Khi cuộn tới phần Hero -> Hiện lên đẹp mắt
  ScrollTrigger.create({
    trigger: q(".st__hero"),
    start: "top 80%",
    once: true,
    onEnter() {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(q(".st__hero-eyebrow"), { opacity: 1, scale: 1, y: 0, duration: 0.65 })
        .to(q(".st__hero-title"),   { opacity: 1, scale: 1, y: 0, duration: 0.8 }, "-=0.38")
        .to(q(".st__hero-sub"),     { opacity: 1, scale: 1, y: 0, duration: 0.65 }, "-=0.45");
    },
  });

  // Đã XÓA đoạn code làm mờ (Fade out) gây lỗi. Bây giờ chữ sẽ luôn hiển thị sau khi chạy xong animation.

  /* ══════════════════════════════════════════════
     2. SPLIT — chart image: slide in from left
  ══════════════════════════════════════════════ */
  const gscFrame = q(".st__gsc-frame");
  if (gscFrame) {
    gsap.set(gscFrame, { opacity: 0, x: -60 });
    ScrollTrigger.create({
      trigger: q(".st__split-wrap"),
      start: "top 65%",
      once: true,
      onEnter() {
        gsap.to(gscFrame, { opacity: 1, x: 0, duration: 1, ease: "power3.out" });
      },
    });
  }

  /* ══════════════════════════════════════════════
     3. SPLIT — stats slide in (một lần)
  ══════════════════════════════════════════════ */
  ScrollTrigger.create({
    trigger: q(".st__split-wrap"),
    start: "top 40%",
    once: true,
    onEnter() {
      gsap.to(qa(".st__stat-row"), {
        opacity: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.13,
        ease: "power3.out",
      });

      // Count-up numbers
      qa(".st__ctr").forEach((el) => {
        const target = +el.dataset.target;
        gsap.to({ v: 0 }, {
          v: target,
          duration: 1.9,
          ease: "power2.out",
          onUpdate() {
            el.textContent = Math.round(this.targets()[0].v);
          },
        });
      });
    },
  });

  /* ══════════════════════════════════════════════
     4. PROOF slots — zoom reveal on scroll
  ══════════════════════════════════════════════ */
  qa(".st__proof-slot").forEach((slot) => {
    gsap.to(slot, {
      scrollTrigger: {
        trigger: slot,
        start: "top 88%",
        end: "top 50%",
        scrub: 0.6,
      },
      scale: 1,
      y: 0,
      opacity: 1,
      ease: "none",
    });
  });

  /* ══════════════════════════════════════════════
     5. LIGHTBOX — click proof slot để xem full
  ══════════════════════════════════════════════ */
  const lb = document.createElement("div");
  lb.className = "st__lightbox";
  lb.innerHTML = `
    <button class="st__lightbox-close" aria-label="Close">✕</button>
    <img class="st__lightbox-img" src="" alt="Preview" />
  `;
  document.body.appendChild(lb);

  const lbImg   = lb.querySelector(".st__lightbox-img");
  const lbClose = lb.querySelector(".st__lightbox-close");

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || "";
    lb.classList.add("st__lb-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.classList.remove("st__lb-open");
    document.body.style.overflow = "";
    setTimeout(() => { lbImg.src = ""; }, 400);
  }

  lbClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  qa(".st__proof-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const img = slot.querySelector("img");
      if (img) openLightbox(img.src, img.alt);
    });
  });

  qa(".st__p2-card").forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector("img");
      if (img) openLightbox(img.src, img.alt);
    });
  });

  /* ══════════════════════════════════════════════
     5b. SCROLL LIGHT — proof headings dim → bright
  ══════════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════════
     6. PROJECT 02 — animate cards & metrics
  ══════════════════════════════════════════════ */
  const proj2 = q(".st__proj2");
  if (proj2) {
    const p2header = proj2.querySelector(".st__proj2-header");
    if (p2header) {
      gsap.set(p2header, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: p2header,
        start: "top 82%",
        once: true,
        onEnter() {
          gsap.to(p2header, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
        },
      });
    }

    const cards = proj2.querySelectorAll(".st__p2-card");
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: "top 85%",
        once: true,
        onEnter() {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            delay: i * 0.12,
            ease: "power3.out",
          });
        },
      });
    });

    const metrics = proj2.querySelector(".st__proj2-metrics");
    if (metrics) {
      ScrollTrigger.create({
        trigger: metrics,
        start: "top 88%",
        once: true,
        onEnter() {
          gsap.to(metrics, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
          metrics.querySelectorAll(".st__p2ctr").forEach((el) => {
            const target = +el.dataset.target;
            gsap.to({ v: 0 }, {
              v: target,
              duration: 2,
              ease: "power2.out",
              onUpdate() { el.textContent = Math.round(this.targets()[0].v); },
            });
          });
        },
      });
    }

    const footer = proj2.querySelector(".st__proj2-footer");
    if (footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: "top 92%",
        once: true,
        onEnter() {
          gsap.to(footer, { opacity: 1, duration: 0.7, ease: "power2.out" });
        },
      });
    }
  }
})();



// PHASE 2

gsap.registerPlugin(ScrollTrigger);

  const nfaData = [
    {
      img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=1400&q=88",
      cap: "Joby Completes Piloted Electric Air Taxi Flight Across San Francisco Bay",
    },
    {
      img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=88",
      cap: "Joby's First FAA-Conforming Aircraft Takes Flight",
    },
    {
      img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?w=1400&q=88",
      cap: "Joby to Begin U.S. Operations in 2026 Under White House Air Taxi Program",
    },
  ];

  gsap.to("#nfaHeading", {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.1,
  });

  const cols = ["#nfaCol0", "#nfaCol1", "#nfaCol2"];

  cols.forEach((sel, i) => {
    const el = document.querySelector(sel);
    const img = el.querySelector("img");

    function revealCol() {
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(
        el,
        { opacity: 0, x: 90, y: 70, scale: 0.88 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: "power4.out",
          delay: 0.25 + i * 0.15,
          scrollTrigger: {
            trigger: "#nfaGrid",
            start: "top 85%",
            once: true,
          },
        },
      );
    }

    if (img.complete) {
      revealCol();
    } else {
      img.onload = revealCol;
    }
  });

  [0, 1, 2].forEach((i) => {
    const wrap = document.getElementById("nfaWrap" + i);
    const img = document.getElementById("nfaImg" + i);

    wrap.addEventListener("mouseenter", () => {
      gsap.to(wrap, {
        scaleY: 1.07,
        transformOrigin: "bottom center",
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.to(img, { scale: 1.06, duration: 0.55, ease: "power3.out" });
    });
    wrap.addEventListener("mouseleave", () => {
      gsap.to(wrap, {
        scaleY: 1,
        duration: 0.55,
        ease: "power3.inOut",
      });
      gsap.to(img, { scale: 1, duration: 0.55, ease: "power3.inOut" });
    });
  });

  let lbOpen = false;
  function nfaOpen(i) {
    if (lbOpen) return;
    lbOpen = true;
    const overlay = document.getElementById("nfaOverlay");
    const lb = document.getElementById("nfaLb");
    const box = document.getElementById("nfaLbBox");
    document.getElementById("nfaLbImg").src = nfaData[i].img;
    document.getElementById("nfaLbCap").textContent = nfaData[i].cap;
    lb.classList.add("open");

    gsap.to(overlay, {
      background: "rgba(10,10,8,0.78)",
      backdropFilter: "blur(8px)",
      pointerEvents: "all",
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.fromTo(
      box,
      { scale: 0.78, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.4)" },
    );
  }
  function nfaClose() {
    if (!lbOpen) return;
    const overlay = document.getElementById("nfaOverlay");
    const lb = document.getElementById("nfaLb");
    const box = document.getElementById("nfaLbBox");
    gsap.to(box, {
      scale: 0.82,
      opacity: 0,
      y: 20,
      duration: 0.35,
      ease: "power2.in",
    });
    gsap.to(overlay, {
      background: "rgba(0,0,0,0)",
      backdropFilter: "blur(0px)",
      pointerEvents: "none",
      duration: 0.38,
      ease: "power2.in",
      onComplete: () => {
        lb.classList.remove("open");
        lbOpen = false;
      },
    });
  }
  // Refresh ScrollTrigger sau khi layout settle xong (fix embedded component)
  setTimeout(() => ScrollTrigger.refresh(), 300);

  document.getElementById("nfaOverlay").addEventListener("click", nfaClose);
  document.getElementById("nfaLbX").addEventListener("click", nfaClose);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") nfaClose();
  });
