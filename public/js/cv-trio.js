/* ══════════════════════════════════════════════════
   CV TRIO — 3 canvas effects, fully isolated
   [cv1] fractal-tree  [cv2] snake  [cv3] fungus

   Perf guards (tất cả 3):
   - 30fps cap (skip frame < 33ms)
   - IntersectionObserver : dừng khi out-of-viewport
   - Page Visibility API  : dừng khi ẩn tab
   - ResizeObserver thay window resize
   - getBoundingClientRect cached, không gọi mỗi mousemove
══════════════════════════════════════════════════ */

/* ── 1. FRACTAL TREE ── */
(function () {
  const canvas = document.getElementById('cv1-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, raf = null, lastT = 0, mouseOffset = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width  = Math.round(r.width);
    H = canvas.height = Math.round(r.height);
  }

  function branch(x, y, angle, len, depth) {
    if (depth === 0 || len < 2) return;
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.lineWidth   = depth * 0.8;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.2 + (depth / 10) * 0.8) + ')';
    ctx.stroke();
    const spread = 0.42;
    const wind   = (mouseOffset + Math.sin(Date.now() / 1800) * 0.12) * (depth / 10);
    branch(x2, y2, angle - spread + wind, len * 0.67, depth - 1);
    branch(x2, y2, angle + spread + wind, len * 0.67, depth - 1);
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (now - lastT < 33) return; /* 30fps cap */
    lastT = now;
    ctx.clearRect(0, 0, W, H);
    branch(W / 2, H * 0.95, -Math.PI / 2, H * 0.22, 10);
  }

  function start() { if (!raf) raf = requestAnimationFrame(draw); }
  function stop()  { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* Cache rect — không gọi getBCR mỗi mousemove */
  let rc = { left: 0, top: 0 };
  canvas.addEventListener('mouseenter', function () {
    const r = canvas.getBoundingClientRect();
    rc.left = r.left; rc.top = r.top;
  });
  canvas.addEventListener('mousemove', function (e) {
    mouseOffset = ((e.clientX - rc.left) / W - 0.5) * 0.5;
  }, { passive: true });
  canvas.addEventListener('mouseleave', function () { mouseOffset = 0; });

  new IntersectionObserver(function (es) {
    es[0].isIntersecting ? start() : stop();
  }, { threshold: 0.01 }).observe(canvas);

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { resize(); }).observe(canvas);
  }
  resize();
})();


/* ── 2. SNAKE ── */
(function () {
  const canvas = document.getElementById('cv2-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, raf = null, lastT = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width  = Math.round(r.width);
    H = canvas.height = Math.round(r.height);
  }
  resize();

  const N = 28, DIST = 12;
  let head = { x: W / 2, y: H / 2, vx: 2, vy: 1 };
  const pts = Array.from({ length: N }, function () { return { x: head.x, y: head.y }; });
  let mouse = null;

  /* Cache rect */
  let rc = { left: 0, top: 0 };
  canvas.addEventListener('mouseenter', function () {
    const r = canvas.getBoundingClientRect();
    rc.left = r.left; rc.top = r.top;
  });
  canvas.addEventListener('mousemove', function (e) {
    mouse = { x: e.clientX - rc.left, y: e.clientY - rc.top };
  }, { passive: true });
  canvas.addEventListener('mouseleave', function () { mouse = null; });
  window.addEventListener('scroll', function () {
    if (mouse) { const r = canvas.getBoundingClientRect(); rc.left = r.left; rc.top = r.top; }
  }, { passive: true });

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (now - lastT < 33) return; /* 30fps cap */
    lastT = now;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, W, H);

    const t = Date.now() / 1000;
    if (mouse) {
      const dx = mouse.x - head.x, dy = mouse.y - head.y;
      const d  = Math.sqrt(dx * dx + dy * dy) + 1;
      head.vx += (dx / d) * 1.0;
      head.vy += (dy / d) * 1.0;
    } else {
      head.vx += Math.cos(t * 1.1) * 0.3;
      head.vy += Math.sin(t * 0.8) * 0.3;
    }

    head.vx *= 0.88; head.vy *= 0.88;
    const spd    = Math.sqrt(head.vx * head.vx + head.vy * head.vy);
    const maxSpd = mouse ? 8 : 4;
    if (spd > maxSpd) { head.vx = head.vx / spd * maxSpd; head.vy = head.vy / spd * maxSpd; }

    head.x += head.vx; head.y += head.vy;
    if (head.x < 0) { head.x = 0; head.vx *= -1; }
    if (head.x > W) { head.x = W; head.vx *= -1; }
    if (head.y < 0) { head.y = 0; head.vy *= -1; }
    if (head.y > H) { head.y = H; head.vy *= -1; }

    pts[0].x = head.x; pts[0].y = head.y;
    for (let i = 1; i < N; i++) {
      const dx = pts[i-1].x - pts[i].x, dy = pts[i-1].y - pts[i].y;
      const d  = Math.sqrt(dx * dx + dy * dy) + 0.01;
      if (d > DIST) { pts[i].x += (dx / d) * (d - DIST); pts[i].y += (dy / d) * (d - DIST); }
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let j = 1; j < N - 1; j++) {
      const qx = (pts[j].x + pts[j+1].x) / 2;
      const qy = (pts[j].y + pts[j+1].y) / 2;
      ctx.quadraticCurveTo(pts[j].x, pts[j].y, qx, qy);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let k = 0; k < N; k++) {
      const alpha = 1 - k / N;
      const size  = 2.5 - k / N * 1.5;
      ctx.beginPath();
      ctx.arc(pts[k].x, pts[k].y, size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
      ctx.fill();
    }
  }

  function start() { if (!raf) raf = requestAnimationFrame(draw); }
  function stop()  { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  new IntersectionObserver(function (es) {
    es[0].isIntersecting ? start() : stop();
  }, { threshold: 0.01 }).observe(canvas);

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { resize(); }).observe(canvas);
  }
})();


/* ── 3. FUNGUS ── */
(function () {
  const wrap = document.getElementById('cv3-root');
  const cv   = document.getElementById('cv3-canvas');
  if (!wrap || !cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, fungi = [], raf = null, lastT = 0;
  let mx = -9999, my = -9999, mActive = false;

  const CFG = {
    idle:  { speed: 0.6, splitP: 1.2, dAmt: 1.8 * Math.PI / 180, maxAge: 110, attractR: 0,   attractF: 0    },
    hover: { speed: 1.6, splitP: 2.8, dAmt: 2.5 * Math.PI / 180, maxAge: 90,  attractR: 220, attractF: 0.22 },
  };

  function resize() {
    const r = wrap.getBoundingClientRect();
    W = cv.width  = Math.round(r.width);
    H = cv.height = Math.round(r.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    fungi = [];
    for (let i = 0; i < 3; i++) fungi.push(new F(W / 2, H / 2));
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function F(x, y, angle) {
    this.x  = this.px = x;
    this.y  = this.py = y;
    this.angle = angle !== undefined ? angle : rnd(0, Math.PI * 2);
    this.age = 0;
  }

  F.prototype.update = function () {
    this.age++;
    const cfg = mActive ? CFG.hover : CFG.idle;
    if (mActive && cfg.attractR > 0) {
      const dx = mx - this.x, dy = my - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < cfg.attractR) {
        const ta = Math.atan2(dy, dx);
        let da = ta - this.angle;
        while (da >  Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        this.angle += da * Math.pow(1 - d / cfg.attractR, 1.4) * cfg.attractF;
      }
    }
    this.angle += rnd(-cfg.dAmt, cfg.dAmt);
    this.px = this.x; this.py = this.y;
    this.x += Math.cos(this.angle) * cfg.speed;
    this.y += Math.sin(this.angle) * cfg.speed;
    if (Math.random() * 100 < cfg.splitP && fungi.length < 500) {
      const sa = 16 * Math.PI / 180;
      fungi.push(new F(this.x, this.y, this.angle + sa));
      this.angle -= sa;
    }
  };

  F.prototype.draw = function () {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.x,  this.y);
    ctx.stroke();
  };

  F.prototype.dead = function () {
    const cfg = mActive ? CFG.hover : CFG.idle;
    const dx  = W / 2 - this.x, dy = H / 2 - this.y;
    return Math.sqrt(dx * dx + dy * dy) >= Math.min(W, H) / 2 - 50 || this.age > cfg.maxAge;
  };

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < (mActive ? 33 : 50)) return; /* 30fps hover / 20fps idle */
    lastT = now;
    for (let i = fungi.length - 1; i >= 0; i--) {
      const f = fungi[i];
      f.update();
      if (f.dead()) { fungi.splice(i, 1); continue; }
      f.draw();
    }
    if (fungi.length === 0) resize();
  }

  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  function stop()  { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  let rc = { left: 0, top: 0 };
  function updateRect() { const r = wrap.getBoundingClientRect(); rc.left = r.left; rc.top = r.top; }

  wrap.addEventListener('mouseenter', function () { updateRect(); mActive = true; });
  wrap.addEventListener('mousemove',  function (e) { mx = e.clientX - rc.left; my = e.clientY - rc.top; }, { passive: true });
  wrap.addEventListener('mouseleave', function () { mActive = false; mx = -9999; my = -9999; });
  window.addEventListener('scroll',  function () { if (mActive) updateRect(); }, { passive: true });

  new IntersectionObserver(function (es) {
    es[0].isIntersecting ? start() : stop();
  }, { threshold: 0.01 }).observe(wrap);

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { resize(); }).observe(wrap);
  }

  resize();
})();