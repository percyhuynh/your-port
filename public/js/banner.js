/**
 * banner.js — Percy Huynh Portfolio
 * Particles đen dày hơn, kết nối rõ hơn, bg tĩnh 1 lần
 * IIFE hoàn toàn cô lập
 */
;(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {

    var section = document.querySelector('section.banner');
    if (!section) return;

    section.innerHTML = '';

    var bgCv = document.createElement('canvas');
    bgCv.id  = 'banner-bg';
    bgCv.setAttribute('aria-hidden', 'true');

    var cv  = document.createElement('canvas');
    cv.id   = 'banner-canvas';
    cv.setAttribute('aria-hidden', 'true');

    var uiCv = document.createElement('canvas');
    uiCv.id  = 'banner-ui';
    uiCv.setAttribute('aria-hidden', 'true');

    var textEl = document.createElement('div');
    textEl.id  = 'banner-text';
    textEl.innerHTML = '<h1>Portfolio</h1><p>Huynh Man Dat</p>';

    section.appendChild(bgCv);
    section.appendChild(cv);
    section.appendChild(uiCv);
    section.appendChild(textEl);

    var bgCtx = bgCv.getContext('2d');
    var ctx   = cv.getContext('2d');
    var uiCtx = uiCv.getContext('2d');

    var W = 0, H = 0;
    var mouse   = { x: -999, y: -999 };
    var entered = false;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* ── Background — vẽ 1 lần ── */
    function drawBg() {
      var g = bgCtx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0,    '#820909');
      g.addColorStop(0.35, '#980b0b');
      g.addColorStop(0.65, '#8a0a0a');
      g.addColorStop(1,    '#720808');
      bgCtx.fillStyle = g;
      bgCtx.fillRect(0, 0, W, H);

      bgCtx.save();
      bgCtx.globalAlpha = 0.042;
      for (var i = 0; i < 500; i++) {
        var x   = rnd(0, W), y   = rnd(0, H);
        var len = rnd(8, 65), th = rnd(1, 5);
        var ang = rnd(-0.1, 0.1);
        bgCtx.save();
        bgCtx.translate(x, y);
        bgCtx.rotate(ang);
        bgCtx.fillStyle = Math.random() < 0.5
          ? 'rgba(0,0,0,0.5)' : 'rgba(120,0,0,0.4)';
        bgCtx.fillRect(-len / 2, -th / 2, len, th);
        bgCtx.restore();
      }
      bgCtx.restore();
    }

    /* ── Palette đen ── */
    var BLACKS = [
      [6,2,2],[10,3,3],[8,2,2],[14,4,4],[5,1,1],
      [18,5,5],[4,1,1],[12,3,3],[20,6,6],[3,1,1]
    ];
    function rb() { return BLACKS[Math.floor(Math.random() * BLACKS.length)]; }

    /* ── Particles — tăng lên 180, size rõ hơn ── */
    var TOTAL = 180;
    var P = [];

    function initParticles() {
      P = [];
      for (var i = 0; i < TOTAL; i++) {
        var t   = i / TOTAL;
        /* size quadratic: nhiều nhỏ, ít to — tăng range lên */
        var sz  = Math.max(0.8, 1.2 + t * t * 16 + rnd(-1.5, 1.5));
        var col = rb();
        P.push({
          x     : rnd(0, W),  y    : rnd(0, H),
          vx    : rnd(-0.45, 0.45), vy: rnd(-0.45, 0.45),
          r     : col[0], g: col[1], b: col[2],
          size  : sz,
          /* alpha cao hơn để thấy rõ hơn */
          alpha : 0.62 - t * 0.22,
          wPhase: rnd(0, Math.PI * 2),
          wFreq : rnd(0.006, 0.014),
          glow  : t > 0.5,
          t     : t
        });
      }
    }

    /* ── Connections — opacity cao hơn, maxD rộng hơn ── */
    function drawConns() {
      for (var i = 0; i < P.length; i++) {
        for (var j = i + 1; j < P.length; j++) {
          var a = P[i], b = P[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          /* tăng maxD và opacity */
          var maxD = 100 + Math.min(a.size, b.size) * 10;
          if (d2 < maxD * maxD) {
            var tv = 1 - Math.sqrt(d2) / maxD;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            /* tăng opacity từ 0.22 lên 0.38 */
            ctx.strokeStyle = 'rgba(4,1,1,' + (tv * tv * 0.38) + ')';
            ctx.lineWidth   = 0.5 + tv * 0.9;
            ctx.stroke();
          }
        }
      }
    }

    var rafId = null; // OPT: track rAF để có thể cancel

    /* ── Main loop ── */
    function frame() {
      ctx.clearRect(0, 0, W, H);

      var mx = mouse.x, my = mouse.y;

      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.wPhase += p.wFreq;

        if (mx > 0) {
          var dx   = mx - p.x, dy = my - p.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var rad  = 160 + p.size * 5;
          if (dist < rad) {
            var f = (rad - dist) / rad;
            p.vx += dx / dist * f * f * (1.8 + p.size * 0.12) * 0.07;
            p.vy += dy / dist * f * f * (1.8 + p.size * 0.12) * 0.07;
          }
        }

        p.vx += Math.sin(p.wPhase) * 0.016;
        p.vy += Math.cos(p.wPhase * 0.75) * 0.012;
        p.vx *= 0.955; p.vy *= 0.955;
        p.x  += p.vx;  p.y  += p.vy;

        var pad = p.size * 2;
        if (p.x < -pad)    p.x = W + pad;
        if (p.x > W + pad) p.x = -pad;
        if (p.y < -pad)    p.y = H + pad;
        if (p.y > H + pad) p.y = -pad;
      }

      drawConns();

      /* nhỏ → to */
      var sorted = P.slice().sort(function (a, b) { return a.size - b.size; });
      for (var si = 0; si < sorted.length; si++) {
        var p = sorted[si];

        if (p.glow) {
          var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2);
          gg.addColorStop(0, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (p.alpha * 0.32) + ')');
          gg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        var bg2 = ctx.createRadialGradient(
          p.x - p.size * 0.3, p.y - p.size * 0.3, 0,
          p.x, p.y, p.size
        );
        bg2.addColorStop(0,   'rgba(' + Math.min(30, p.r + 18) + ',' + p.g + ',' + p.b + ',' + p.alpha + ')');
        bg2.addColorStop(0.5, 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (p.alpha * 0.85) + ')');
        bg2.addColorStop(1,   'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (p.alpha * 0.3) + ')');
        ctx.fillStyle = bg2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      /* cursor shadow */
      if (mx > 0) {
        var sp = ctx.createRadialGradient(mx, my, 0, mx, my, 140);
        sp.addColorStop(0, 'rgba(0,0,0,0.16)');
        sp.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sp;
        ctx.fillRect(0, 0, W, H);
      }

      /* vignette */
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, W * 0.9);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      /* cursor UI */
      uiCtx.clearRect(0, 0, W, H);
      if (entered && mx > 0) {
        uiCtx.beginPath();
        uiCtx.arc(mx, my, 16, 0, Math.PI * 2);
        uiCtx.strokeStyle = 'rgba(6,2,2,0.32)';
        uiCtx.lineWidth   = 1;
        uiCtx.stroke();
        uiCtx.beginPath();
        uiCtx.arc(mx, my, 2.5, 0, Math.PI * 2);
        uiCtx.fillStyle = 'rgba(8,2,2,0.5)';
        uiCtx.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    /* ── Resize ── */
    function resize() {
      var rect = section.getBoundingClientRect();
      W = Math.round(rect.width)  || window.innerWidth;
      H = Math.round(rect.height) || 600;

      bgCv.width = W; bgCv.height = H;
      cv.width   = W; cv.height   = H;
      uiCv.width = W; uiCv.height = H;

      drawBg();
      if (W > 0 && H > 0) initParticles();
    }

    /* ── Events ── */
    section.addEventListener('mouseenter', function () { entered = true; }, false);
    section.addEventListener('mouseleave', function () {
      entered = false; mouse.x = -999; mouse.y = -999;
    }, false);
    section.addEventListener('mousemove', function (e) {
      var rect = section.getBoundingClientRect();
      mouse.x  = e.clientX - rect.left;
      mouse.y  = e.clientY - rect.top;
    }, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { resize(); }).observe(section);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }

    resize();

    /* OPT: IntersectionObserver — tắt hoàn toàn rAF loop khi banner
       không trong viewport. 180 particles O(n²) mỗi frame = ~16k phép tính.
       Khi ở cuối trang scroll lên, banner visible → loop bật lại ngay. */
    var bannerObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        if (!rafId) rafId = requestAnimationFrame(frame);
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    }, { threshold: 0.01 });
    bannerObserver.observe(section);

    rafId = requestAnimationFrame(frame);

  });
})();