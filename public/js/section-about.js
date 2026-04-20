// TYPED — animated role text
// @ts-ignore
new Typed('.input', {
  strings: ['SEO Strategy', 'Content SEO', 'Automation & Tech', 'UI/UX & Design', 'Frontend Developer'],
  typeSpeed: 70,
  backSpeed: 55,
  loop: true
});

// AB-PAINTING-SCREEN — museum spotlight reveal + hover B&W→color
(function () {
  var screen = document.getElementById('ab-painting-screen');
  var dark   = document.getElementById('ab-spot-dark');
  var glow   = document.getElementById('ab-spot-glow');
  var frame  = document.getElementById('ab-pframe');
  var wrap   = screen ? screen.querySelector('.ab-painting-wrap') : null;
  var beam   = screen ? screen.querySelector('.ab-spot-beam') : null;
  if (!screen || !dark || !glow || !wrap) return;

  // Timeline (scroll progress):
  // 0.00 → 0.06  : complete darkness
  // 0.06 → 0.20  : ceiling beam fades in
  // 0.18 → 0.86  : spotlight opens from pinpoint → full
  // 0.86 → 0.96  : fully lit, frame scales up slightly
  // 0.96 → 1.00  : exit buffer

  // ease-out: spotlight bùng mở nhanh rồi chậm dần
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 2.5);
  }

  function norm(p, a, b) {
    return p <= a ? 0 : p >= b ? 1 : easeOut((p - a) / (b - a));
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: screen,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: function (self) {
        var p = Math.min(1, self.progress);

        // --- PAINTING FADE-IN: 14% → 72% (đồng thời với spotlight) ---
        wrap.style.opacity = norm(p, 0.14, 0.72).toFixed(3);

        // --- SPOTLIGHT: 10% → 88% ---
        var lp = norm(p, 0.10, 0.88);

        if (lp < 0.004) {
          dark.style.background = '#000';
          glow.style.background = 'transparent';
        } else {
          // ease-out → tại lp=0.3 đã mở tới ~59% → pinpoint bùng sáng rất nhanh
          var r  = Math.round(8 + lp * 310);   // 8px → 318px
          var rH = Math.round(r * 1.42);

          var dc = Math.max(0.02, 0.99 - lp * 0.97).toFixed(2);
          var dm = Math.max(0.25, 0.99 - lp * 0.58).toFixed(2);

          dark.style.background =
            'radial-gradient(ellipse ' + r + 'px ' + rH + 'px at 50% 44%,' +
            'rgba(0,0,0,' + dc + ') 0%,' +
            'rgba(0,0,0,' + dm + ') 45%,' +
            'rgba(0,0,0,0.97) 70%,' +
            'rgba(0,0,0,1) 100%)';

          var gA  = (lp * 0.14).toFixed(3);
          var gA2 = (lp * 0.055).toFixed(3);
          glow.style.background =
            'radial-gradient(ellipse ' + Math.round(r * 0.68) + 'px ' + Math.round(rH * 0.68) + 'px at 50% 44%,' +
            'rgba(255,222,125,' + gA + ') 0%,' +
            'rgba(255,195,75,' + gA2 + ') 42%,' +
            'transparent 68%)';
        }

        // --- FRAME SCALE: 88% → 97% ---
        if (frame) {
          var scale = 1 + norm(p, 0.88, 0.97) * 0.06;
          frame.style.transform = 'scale(' + scale.toFixed(4) + ')';
        }
      }
    });
  }
})();

// PH-CANVAS — interactive "Percy Huynh" ink-bleed canvas
(function () {
  const wrap = document.getElementById('ph-wrap');
  const canvas = document.getElementById('ph-canvas');
  if (!wrap || !canvas) return;
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
    const EDGE_DEPTH = Math.round(3 * DPR);
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
        const threshold = 0.36 - t * 0.30;
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

// SCROLL REVEAL — ab-text-block lines fade in as you scroll
(function () {
  'use strict';

  var lines   = document.querySelectorAll('#about [data-ab]');
  var actions = document.getElementById('ab-actions');
  var roleWrap = document.getElementById('ab-role');
  if (!lines.length) return;

  var allTargets = Array.from(lines);
  if (roleWrap) allTargets.unshift(roleWrap);

  function revealCheck() {
    var winH = window.innerHeight;
    var revealPoint = winH * 0.82;   // light on when crossing upward
    var dimPoint    = winH * 0.88;   // light off when crossing downward (scroll up)

    allTargets.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < revealPoint)  el.classList.add('ab-revealed');
      if (top > dimPoint)     el.classList.remove('ab-revealed');
    });

    if (actions) {
      var lastTop = lines[lines.length - 1].getBoundingClientRect().top;
      if (lastTop < winH * 0.9)  actions.classList.add('ab-revealed');
      if (lastTop > winH * 0.95) actions.classList.remove('ab-revealed');
    }
  }

  window.addEventListener('scroll', revealCheck, { passive: true });
  revealCheck();
})();
