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
});

window.addEventListener("resize", () => {
  ScrollTrigger.refresh();
});
