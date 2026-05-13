gsap.registerPlugin(ScrollTrigger);

const initRevealEffect = () => {
  const others = document.querySelector(".section-others");
  const reveal = document.querySelector(".reveal-container");
  const svgContent = document.querySelector(".reveal-container svg");

  if (!others || !reveal) return;

  reveal.style.opacity = '0';
  reveal.style.pointerEvents = 'none';

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".reveal-trigger-spacer",
      start: "top bottom",
      end: "bottom 50%",
      scrub: 1,
      onUpdate: (self) => {
        if (window.__isJumping) return;
        const visible = self.progress > 0;
        reveal.style.opacity = visible ? '1' : '0';
        reveal.style.pointerEvents = visible ? 'all' : 'none';
      },
    },
  });

  tl.to(others, {
    clipPath: "inset(0% 0% 100% 0%)",
    ease: "none",
  });

  if (svgContent) {
    tl.fromTo(
      svgContent,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, ease: "power2.out" },
      0
    );
  }
};

window.addEventListener("load", () => {
  initRevealEffect();
  ScrollTrigger.refresh();

  // REVEAL MASK — thêm vào đây, sau initRevealEffect
  const handler = document.getElementById("handler");
  if (handler) {
    const RADIUS = 150;
    const streaky = handler.querySelector(".streaky-blur");
    const revealLayer = handler.querySelector(".reveal");
    let rafQueued = false;

    function applyMask(mx, my) {
      const x = mx + "px", y = my + "px", r = RADIUS + "px";
      const mReveal = `radial-gradient(${r} circle at ${x} ${y}, black 0%, black 55%, transparent 85%)`;
      const mStreak = `radial-gradient(${r} circle at ${x} ${y}, transparent 0%, transparent 45%, black 85%)`;
      if (revealLayer) {
        revealLayer.style.webkitMaskImage = mReveal;
        revealLayer.style.maskImage = mReveal;
      }
      if (streaky) {
        streaky.style.webkitMaskImage = mStreak;
        streaky.style.maskImage = mStreak;
      }
    }

    /* OPT: track visibility bằng biến thay vì getComputedStyle mỗi mousemove
       getComputedStyle là layout read — gọi liên tục theo chuột rất nặng */
    let handlerVisible = false;
    const visObserver = new IntersectionObserver(function(entries) {
      handlerVisible = entries[0].isIntersecting;
    }, { threshold: 0.01 });
    visObserver.observe(handler);

    let pendingX = -9999, pendingY = -9999;
    window.addEventListener("mousemove", (e) => {
      if (!handlerVisible) return;
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafQueued) {
        rafQueued = true;
        requestAnimationFrame(() => {
          applyMask(pendingX, pendingY);
          rafQueued = false;
        });
      }
    });
  }
});

/* OPT: debounce resize — tránh ScrollTrigger.refresh() gọi liên tục khi resize */
var _resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(function() { ScrollTrigger.refresh(); }, 200);
});