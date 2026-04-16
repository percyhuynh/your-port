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
  scrub     : 1,          // tăng lên 1 để mượt hơn
  animation : bannerTl,
});


  // TYPED
  // @ts-ignore — Typed is a CDN global
  var typed = new Typed(".input", {
    strings: ["SEO Strategy", "Content SEO", "Automation & Tech", "UI/UX & Design", "Frontend Developer"],
    typedSpeed: 70,
    backSpeed: 55,
    loop: true
  });

 

  // REVEAL CONTAINER
  const container = document.getElementById("handler");
  if (container) {
    window.addEventListener("mousemove", (e) => {
      container.style.setProperty("--x", e.clientX + "px");
      container.style.setProperty("--y", e.clientY + "px");
    });
  }

  (function () {
  const wrap = document.getElementById('ph-wrap');
  const canvas = document.getElementById('ph-canvas');
  const ctx = canvas.getContext('2d');

  const TEXT = 'Percy Huynh';
  const FONT_SIZE = 130;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let srcCanvas, srcCtx;
  let mouse = { x: -9999, y: -9999 };
  let isHovering = false;
  let raf = null;
  let tick = 0;

  function setupSize() {
    const availW = wrap.clientWidth;
    const tmp = document.createElement('canvas').getContext('2d');
    tmp.font = `italic ${FONT_SIZE}px Georgia, serif`;
    W = Math.min(availW, tmp.measureText(TEXT).width + 60);
    H = FONT_SIZE * 1.8;
  }

  function hash(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function smoothNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return hash(ix,iy)*(1-ux)*(1-uy) + hash(ix+1,iy)*ux*(1-uy)
         + hash(ix,iy+1)*(1-ux)*uy   + hash(ix+1,iy+1)*ux*uy;
  }
  function fbm(x, y) {
    return smoothNoise(x, y) * 0.65 + smoothNoise(x * 2.1, y * 2.1) * 0.35;
  }

  function buildSource() {
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = W * DPR;
    srcCanvas.height = H * DPR;
    srcCtx = srcCanvas.getContext('2d');
    srcCtx.scale(DPR, DPR);
    srcCtx.font = `italic ${FONT_SIZE}px Georgia, serif`;
    srcCtx.fillStyle = '#6b1a1a';
    srcCtx.textBaseline = 'middle';
    srcCtx.textAlign = 'center';
    srcCtx.fillText(TEXT, W / 2, H / 2);

    const sw = srcCanvas.width, sh = srcCanvas.height;
    const imgData = srcCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    const EDGE_DEPTH = Math.round(3 * DPR); // mỏng hơn → ít rách hơn

    const alpha = new Uint8Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) alpha[i] = d[i * 4 + 3];

    const distMap = new Float32Array(sw * sh).fill(999);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (alpha[y * sw + x] < 10) continue;
        let minDist = 999;
        for (let dy = -EDGE_DEPTH; dy <= EDGE_DEPTH; dy++) {
          for (let dx = -EDGE_DEPTH; dx <= EDGE_DEPTH; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= sw || ny < 0 || ny >= sh || alpha[ny * sw + nx] < 10) {
              const d2 = Math.sqrt(dx * dx + dy * dy);
              if (d2 < minDist) minDist = d2;
            }
          }
        }
        distMap[y * sw + x] = minDist;
      }
    }

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = y * sw + x;
        const dist = distMap[idx];
        if (dist >= EDGE_DEPTH || dist === 999) continue;

        const t = dist / EDGE_DEPTH;
        const px = x / DPR, py = y / DPR;
        const n = fbm(px * 0.28, py * 0.28);
        const n2 = fbm(px * 0.55 + 3.1, py * 0.55 + 1.7);

        // Ngưỡng thấp hơn → ít đục lỗ hơn
        const threshold = 0.36 - t * 0.30; // trước: 0.52 - t*0.38
        const i4 = idx * 4;

        if (n < threshold) {
          d[i4 + 3] = 0;
        } else if (n < threshold + 0.10) {
          d[i4 + 3] = Math.round(d[i4 + 3] * (t * 0.7 + n2 * 0.3));
        }
      }
    }

    srcCtx.putImageData(imgData, 0, 0);
  }

  function initCanvas() {
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(srcCanvas, 0, 0, W * DPR, H * DPR, 0, 0, W, H);
  }

  function renderFrame() {
    tick++;
    const sw = srcCanvas.width, sh = srcCanvas.height;
    const srcData = srcCtx.getImageData(0, 0, sw, sh);
    const src = srcData.data;
    const out = ctx.createImageData(sw, sh);
    const dst = out.data;
    const RADIUS = 90, STRENGTH = 22, WAVE = 6;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const px = x / DPR, py = y / DPR;
        const toMouseX = mouse.x - px, toMouseY = mouse.y - py;
        const dist = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
        let srcX = x, srcY = y;

        if (dist < RADIUS && dist > 0.1) {
          const falloff = Math.pow(1 - dist / RADIUS, 2);
          const pull = falloff * STRENGTH;
          const angle = Math.atan2(toMouseY, toMouseX);
          const perp = angle + Math.PI / 2;
          const wobble = Math.sin(dist * 0.15 - tick * 0.08) * falloff * WAVE;
          srcX = x - (toMouseX / dist) * pull * DPR + Math.cos(perp) * wobble * DPR;
          srcY = y - (toMouseY / dist) * pull * DPR + Math.sin(perp) * wobble * DPR;
        }

        const fx = srcX - Math.floor(srcX), fy = srcY - Math.floor(srcY);
        const x0 = Math.floor(srcX), y0 = Math.floor(srcY);
        const x1 = x0 + 1, y1 = y0 + 1;
        function g(xx, yy, c) {
          if (xx < 0 || xx >= sw || yy < 0 || yy >= sh) return 0;
          return src[(yy * sw + xx) * 4 + c];
        }
        const di = (y * sw + x) * 4;
        for (let c = 0; c < 4; c++) {
          dst[di+c] = g(x0,y0,c)*(1-fx)*(1-fy) + g(x1,y0,c)*fx*(1-fy)
                    + g(x0,y1,c)*(1-fx)*fy      + g(x1,y1,c)*fx*fy;
        }
      }
    }

    ctx.clearRect(0, 0, W, H);
    ctx.putImageData(out, 0, 0);
  }

  function startLoop() {
    if (raf) return;
    function loop() {
      if (!isHovering) { raf = null; drawStatic(); return; }
      renderFrame();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener('mouseenter', () => { isHovering = true; startLoop(); });
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { isHovering = false; mouse.x = -9999; mouse.y = -9999; });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left; mouse.y = e.touches[0].clientY - r.top;
    isHovering = true; startLoop();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { isHovering = false; mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf); raf = null;
    ctx.setTransform(1,0,0,1,0,0);
    setupSize(); buildSource(); initCanvas(); drawStatic();
  });

  setupSize(); buildSource(); initCanvas(); drawStatic();
})();