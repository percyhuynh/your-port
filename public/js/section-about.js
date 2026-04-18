// TYPED — animated role text
// @ts-ignore
new Typed('.input', {
  strings: ['SEO Strategy', 'Content SEO', 'Automation & Tech', 'UI/UX & Design', 'Frontend Developer'],
  typeSpeed: 70,
  backSpeed: 55,
  loop: true
});

// AB-PAINTING-SCREEN — sticky scroll spotlight + hover B&W→color
(function () {
  var screen = document.getElementById('ab-painting-screen');
  var dark   = document.getElementById('ab-spot-dark');
  var glow   = document.getElementById('ab-spot-glow');
  var frame  = document.getElementById('ab-pframe');
  var beam   = screen ? screen.querySelector('.ab-spot-beam') : null;
  if (!screen || !dark || !glow) return;

  // Adjust: how much of the 300vh scroll is "lighting up" vs "exit buffer"
  // 0 → 0.80 = spotlight opens fully
  // 0.80 → 0.95 = fully lit, frame grows slightly
  // 0.95 → 1.00 = short pause before next section

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: screen,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: function (self) {
        var p = Math.min(1, self.progress);

        // --- BEAM ---
        if (beam) beam.style.opacity = Math.min(1, p / 0.12).toFixed(3);

        // --- LIGHT PROGRESS (0→1 over first 80% of scroll) ---
        var lp = Math.min(1, p / 0.80);

        if (lp < 0.01) {
          dark.style.background = 'rgba(0,0,0,0.97)';
          glow.style.background = 'transparent';
        } else {
          var radius = Math.round(60 + lp * 270);
          var rH     = Math.round(radius * 1.35);
          var dC     = Math.max(0.04, 0.97 - lp * 0.88).toFixed(2);
          var dM     = Math.max(0.28, 0.97 - lp * 0.52).toFixed(2);
          var gA     = (lp * 0.09).toFixed(3);
          var gA2    = (lp * 0.04).toFixed(3);

          dark.style.background =
            'radial-gradient(ellipse ' + radius + 'px ' + rH + 'px at 50% 46%,' +
            'rgba(0,0,0,' + dC + ') 0%,' +
            'rgba(0,0,0,' + dM + ') 42%,' +
            'rgba(0,0,0,0.97) 68%,' +
            'rgba(0,0,0,0.99) 100%)';

          glow.style.background =
            'radial-gradient(ellipse ' + Math.round(radius * 0.7) + 'px ' + Math.round(rH * 0.7) + 'px at 50% 46%,' +
            'rgba(255,218,110,' + gA + ') 0%,' +
            'rgba(255,192,70,' + gA2 + ') 40%,' +
            'transparent 65%)';
        }

        // --- FRAME SCALE: grows 80%→95% of scroll (adjust 0.08 to taste) ---
        if (frame) {
          var scaleP  = p > 0.80 ? Math.min(1, (p - 0.80) / 0.15) : 0;
          var scale   = 1 + scaleP * 0.08; /* ← change 0.08 to resize */
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
    var revealPoint = winH * 0.82;

    allTargets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < revealPoint) el.classList.add('ab-revealed');
    });

    if (actions) {
      var lastRect = lines[lines.length - 1].getBoundingClientRect();
      if (lastRect.top < winH * 0.9) actions.classList.add('ab-revealed');
    }
  }

  window.addEventListener('scroll', revealCheck, { passive: true });
  revealCheck();
})();
