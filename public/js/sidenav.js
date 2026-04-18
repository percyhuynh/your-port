(() => {
  'use strict';

  const SECTIONS = [
    { id: 's0', name: 'SEO Strategy' },
    { id: 's1', name: 'Content SEO' },
    { id: 's2', name: 'UI/UX & Design' },
    { id: 'scrollSection', name: 'Automation & Tech' },
    { id: 's4', name: 'Others' },
  ];

  const nav = document.getElementById('nav');
  const layerDots = document.getElementById('layerDots');
  const layerLinks = document.getElementById('layerLinks');

  const dotEls = SECTIONS.map((sec) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.title = sec.name;
    const fill = document.createElement('div');
    fill.className = 'dot-fill';
    dot.appendChild(fill);
    layerDots.appendChild(dot);
    dot.addEventListener('click', () =>
      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' })
    );
    return { dot, fill };
  });

  const linkEls = SECTIONS.map((sec, i) => {
    if (i > 0) {
      const div = document.createElement('span');
      div.className = 'nav-divider';
      div.setAttribute('aria-hidden', 'true');
      layerLinks.appendChild(div);
    }
    const btn = document.createElement('button');
    btn.className = 'nav-link';
    btn.textContent = sec.name;
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Go to ${sec.name}`);
    btn.addEventListener('click', () =>
      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' })
    );
    layerLinks.appendChild(btn);
    return btn;
  });

  let isHovered = false;
  let activeIdx = 0;
  let rafId = null;

  function applyState() {
    nav.dataset.state = isHovered ? 'pill' : 'dots';
  }

  nav.addEventListener('mouseenter', () => { isHovered = true; applyState(); });
  nav.addEventListener('mouseleave', () => { isHovered = false; applyState(); });

  function getSectionProgress(el) {
    const { top } = el.getBoundingClientRect();
    const h = el.offsetHeight;
    return Math.min(1, Math.max(0, -top / h));
  }

  function getActiveSection() {
    const mid = window.innerHeight / 2;
    let best = 0, bestDist = Infinity;
    SECTIONS.forEach(({ id }, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (top < vh && bottom > 0) {
        const dist = Math.abs(top - mid * 0.5);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
    });
    return best;
  }

  function render() {
    rafId = null;
    const current = getActiveSection();
    SECTIONS.forEach(({ id }, i) => {
      const el = document.getElementById(id);
      const p = el ? getSectionProgress(el) : 0;
      const { dot, fill } = dotEls[i];
      const isActive = (i === current) && (p > 0.001);
      const isVisited = (p >= 0.999);
      dot.classList.toggle('is-active', isActive);
      dot.classList.toggle('is-visited', isVisited);
      if (isActive) {
        fill.style.width = (p * 100).toFixed(2) + '%';
      } else {
        fill.style.width = isVisited ? '100%' : '0%';
      }
    });
    if (current !== activeIdx) {
      activeIdx = current;
      linkEls.forEach((lnk, i) => lnk.classList.toggle('is-active', i === current));
    }
  }

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  linkEls[0].classList.add('is-active');
  applyState();
  render();

})();

// GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // BANNER
const heroHeader = document.getElementById("heroHeader");
const bannerImg  = document.querySelector(".banner .hero-img");

/* ── Dùng timeline + animation: bannerTl thay vì gsap.set() trong onUpdate.
   gsap.set() trong onUpdate tạo tween mới mỗi frame → giật.
   GSAP tự drive timeline qua render loop riêng → mượt. ── */
const bannerTl = gsap.timeline({ defaults: { ease: "none", force3D: true } });
bannerTl.to(heroHeader, { scale: 0.9, borderRadius: 24 }, 0);
if (bannerImg) bannerTl.to(bannerImg, { yPercent: -12 }, 0);

ScrollTrigger.create({
  trigger   : ".banner-scroll-wrapper",
  start     : "top top",
  end       : "bottom bottom",
  scrub     : 1,
  animation : bannerTl,
});

// REVEAL CONTAINER — SVG streak effect follows mouse
const revealContainer = document.getElementById("handler");
if (revealContainer) {
  window.addEventListener("mousemove", (e) => {
    revealContainer.style.setProperty("--x", e.clientX + "px");
    revealContainer.style.setProperty("--y", e.clientY + "px");
  });
}

