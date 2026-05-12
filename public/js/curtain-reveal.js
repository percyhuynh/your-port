gsap.registerPlugin(ScrollTrigger);

const initRevealEffect = () => {
  const others = document.querySelector(".section-others");
  const reveal = document.querySelector(".reveal-container");
  const svgContent = document.querySelector(".reveal-container svg");

  if (!others || !reveal) return;

  gsap.set(reveal, { opacity: 0, pointerEvents: "none" });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".reveal-trigger-spacer",
      start: "top bottom",
      end: "bottom 50%",
      scrub: 1,
      onUpdate: (self) => {
        if (self.progress > 0) {
          gsap.set(reveal, { opacity: 1, pointerEvents: "all" });
        } else {
          gsap.set(reveal, { opacity: 0, pointerEvents: "none" });
        }
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

    let pendingX = -9999, pendingY = -9999;
    window.addEventListener("mousemove", (e) => {
      if (parseFloat(getComputedStyle(handler).opacity) === 0) return;
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

window.addEventListener("resize", () => {
  ScrollTrigger.refresh();
});
