/**
 * banner-hmd.js — Percy Huynh Portfolio
 * HMD Particle Morphing Banner
 *
 * Perf guards:
 *   - 30 fps cap
 *   - IntersectionObserver : dừng khi out-of-viewport
 *   - Page Visibility API  : dừng khi ẩn tab
 *   - Background + vignette cache 1 lần, redraw khi resize
 *   - Color strings pre-cached lúc init, không tạo mới mỗi frame
 *   - Connections dùng spatial grid O(n) thay vì O(n²)
 *   - RadialGradient chỉ cho hạt to (size>4), hạt nhỏ dùng arc thuần
 *   - IIFE hoàn toàn cô lập
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

    /* Ẩn picture/img gốc thay vì xóa — giữ LCP image trong DOM
       để browser vẫn parse + preload được, không ảnh hưởng LCP score */
    var existingPicture = section.querySelector('picture');
    if (existingPicture) existingPicture.style.display = 'none';

    var bgCv = document.createElement('canvas');
    bgCv.id  = 'banner-bg';
    bgCv.setAttribute('aria-hidden', 'true');

    var cv  = document.createElement('canvas');
    cv.id   = 'banner-canvas';
    cv.setAttribute('aria-hidden', 'true');

    var uiCv = document.createElement('canvas');
    uiCv.id  = 'banner-ui';
    uiCv.setAttribute('aria-hidden', 'true');

    var hintEl = document.createElement('div');
    hintEl.id  = 'banner-hint';
    hintEl.textContent = 'click to reveal';

    section.appendChild(bgCv);
    section.appendChild(cv);
    section.appendChild(uiCv);
    section.appendChild(hintEl);

    var bgCtx = bgCv.getContext('2d');
    var ctx   = cv.getContext('2d');
    var uiCtx = uiCv.getContext('2d');

    var W = 0, H = 0;
    var mouse       = { x: -999, y: -999 };
    var entered     = false;
    var formed      = false;
    var rafId       = null;
    var lastFrame   = 0;
    /* Cache rect — tránh getBoundingClientRect mỗi mousemove → không trigger layout */
    var sectionRect = { left: 0, top: 0 };

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* ── Background vẽ 1 lần ── */
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
        var x = rnd(0,W), y = rnd(0,H), len = rnd(8,65), th = rnd(1,5), ang = rnd(-0.1,0.1);
        bgCtx.save();
        bgCtx.translate(x, y); bgCtx.rotate(ang);
        bgCtx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(120,0,0,0.4)';
        bgCtx.fillRect(-len/2, -th/2, len, th);
        bgCtx.restore();
      }
      bgCtx.restore();
    }

    /* ── Sample điểm HMD trên offscreen W×H ── */
    function getHMDPoints(count) {
      var off   = document.createElement('canvas');
      off.width = W; off.height = H;
      var o = off.getContext('2d');
      o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
      o.fillStyle    = '#fff';
      o.font         = '900 ' + Math.round(W * 0.28) + 'px "Arial Black", Arial, sans-serif';
      o.textAlign    = 'center';
      o.textBaseline = 'middle';
      o.fillText('HMD', W / 2, H / 2);
      var d = o.getImageData(0, 0, W, H).data;
      var cands = [];
      for (var y = 0; y < H; y += 2) {
        for (var x = 0; x < W; x += 2) {
          if (d[(y * W + x) * 4] > 180) cands.push({ x: x, y: y });
        }
      }
      for (var i = cands.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = cands[i]; cands[i] = cands[j]; cands[j] = t;
      }
      var result = cands.slice(0, count);
      while (result.length < count) {
        var base = cands[Math.floor(Math.random() * cands.length)];
        result.push({ x: base.x + rnd(-2,2), y: base.y + rnd(-2,2) });
      }
      return result;
    }

    var BLACKS = [[6,2,2],[10,3,3],[8,2,2],[14,4,4],[5,1,1],[18,5,5],[4,1,1],[12,3,3],[20,6,6],[3,1,1]];
    function rb() { return BLACKS[Math.floor(Math.random() * BLACKS.length)]; }

    var TOTAL = 600;
    var P = [], targets = [];

    function initParticles() {
      targets = getHMDPoints(TOTAL);
      P = [];
      for (var i = 0; i < TOTAL; i++) {
        var t = i / TOTAL, roll = Math.random(), col = rb();
        var base = W / 2700;
        var sz;
        if      (roll < 0.10) sz = rnd(14, 24) * base;
        else if (roll < 0.30) sz = rnd(7,  14) * base;
        else if (roll < 0.65) sz = rnd(3.5, 7) * base;
        else                  sz = rnd(1.5, 3.5) * base;
        sz = Math.max(1.5, sz);
        var al = 0.72 - t * 0.20;
        var r = col[0], g = col[1], b = col[2];

        /* ── Pre-cache tất cả color strings — dùng lại mỗi frame ── */
        P.push({
          x: rnd(0,W), y: rnd(0,H),
          vx: rnd(-1.8,1.8), vy: rnd(-1.8,1.8),
          r: r, g: g, b: b,
          size: sz,
          alpha: al,
          /* Cached strings — không bao giờ tạo lại trừ khi resize */
          cs0: 'rgba('+Math.min(255,r+18)+','+g+','+b+','+al.toFixed(3)+')',
          cs1: 'rgba('+r+','+g+','+b+','+(al*0.85).toFixed(3)+')',
          cs2: 'rgba('+r+','+g+','+b+','+(al*0.3).toFixed(3)+')',
          csg: 'rgba('+r+','+g+','+b+','+(al*0.38).toFixed(3)+')',
          wPhase: rnd(0, Math.PI*2), wFreq: rnd(0.006, 0.015),
          glow: sz > 7,
        });
      }
      P.sort(function(a,b){ return a.size - b.size; });
    }

    var vignetteGrad = null;
    function buildVignette() {
      vignetteGrad = ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,W*0.9);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.42)');
    }

    /* ── Spatial grid — O(n) connections thay vì O(n²) ── */
    var CELL_SIZE = 110;
    var gridCells = {};

    function buildGrid() {
      gridCells = {};
      for (var i = 0; i < P.length; i++) {
        var key = (Math.floor(P[i].x / CELL_SIZE) + '_' + Math.floor(P[i].y / CELL_SIZE));
        if (!gridCells[key]) gridCells[key] = [];
        gridCells[key].push(i);
      }
    }

    /* Pre-built bucket styles — 5 mức opacity cố định, không tạo string mỗi frame */
    var CONN_BUCKETS = 5;
    var CONN_STYLES  = ['rgba(4,1,1,0.08)','rgba(4,1,1,0.16)','rgba(4,1,1,0.24)','rgba(4,1,1,0.32)','rgba(4,1,1,0.40)'];
    /* Mỗi bucket là 1 mảng segment [x1,y1,x2,y2,...] */
    var connBuckets = [];
    (function(){ for(var i=0;i<CONN_BUCKETS;i++) connBuckets.push([]); })();

    function drawConns() {
      var maxD  = CELL_SIZE;
      var maxD2 = maxD * maxD;

      /* Reset buckets — reuse array tránh GC */
      for (var b = 0; b < CONN_BUCKETS; b++) connBuckets[b].length = 0;

      /* Phân loại từng cặp vào bucket theo tv */
      for (var i = 0; i < P.length; i++) {
        var a  = P[i];
        var cx = Math.floor(a.x / CELL_SIZE);
        var cy = Math.floor(a.y / CELL_SIZE);
        for (var nx = cx - 1; nx <= cx + 1; nx++) {
          for (var ny = cy - 1; ny <= cy + 1; ny++) {
            var cell = gridCells[nx + '_' + ny];
            if (!cell) continue;
            for (var k = 0; k < cell.length; k++) {
              var j = cell[k];
              if (j <= i) continue;
              var pb = P[j];
              var dx = a.x - pb.x, dy = a.y - pb.y;
              var d2 = dx*dx + dy*dy;
              if (d2 < maxD2) {
                var tv  = 1 - Math.sqrt(d2) / maxD;
                var bkt = Math.min(CONN_BUCKETS - 1, Math.floor(tv * CONN_BUCKETS));
                var arr = connBuckets[bkt];
                arr.push(a.x, a.y, pb.x, pb.y);
              }
            }
          }
        }
      }

      /* Vẽ từng bucket: 1 beginPath → nhiều moveTo/lineTo → 1 stroke() duy nhất */
      ctx.lineWidth = 0.8;
      for (var b = 0; b < CONN_BUCKETS; b++) {
        var segs = connBuckets[b];
        if (!segs.length) continue;
        ctx.strokeStyle = CONN_STYLES[b];
        ctx.beginPath();
        for (var s = 0; s < segs.length; s += 4) {
          ctx.moveTo(segs[s],   segs[s+1]);
          ctx.lineTo(segs[s+2], segs[s+3]);
        }
        ctx.stroke(); /* 1 GPU call cho toàn bucket */
      }
    }

    function frame(ts) {
      if (ts - lastFrame < 33) { rafId = requestAnimationFrame(frame); return; }
      lastFrame = ts;
      ctx.clearRect(0, 0, W, H);
      var mx = mouse.x, my = mouse.y;

      for (var i = 0; i < P.length; i++) {
        var p = P[i], tgt = targets[i];
        p.wPhase += p.wFreq;

        if (formed) {
          p.vx += (tgt.x - p.x) * 0.12;
          p.vy += (tgt.y - p.y) * 0.12;
          p.vx += Math.sin(p.wPhase) * 0.006;
          p.vy += Math.cos(p.wPhase * 0.75) * 0.005;
          p.vx *= 0.78; p.vy *= 0.78;
        } else {
          p.vx += Math.sin(p.wPhase) * 0.025;
          p.vy += Math.cos(p.wPhase * 0.73) * 0.020;
          if (p.x < 20)     p.vx += 0.3;
          if (p.x > W - 20) p.vx -= 0.3;
          if (p.y < 20)     p.vy += 0.3;
          if (p.y > H - 20) p.vy -= 0.3;
          p.vx *= 0.97; p.vy *= 0.97;
          var spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
          if (spd > 2.5) { p.vx = p.vx/spd*2.5; p.vy = p.vy/spd*2.5; }
          var pad = p.size*2;
          if (p.x < -pad)  p.x = W+pad;
          if (p.x > W+pad) p.x = -pad;
          if (p.y < -pad)  p.y = H+pad;
          if (p.y > H+pad) p.y = -pad;
        }

        if (mx > 0) {
          var ddx = mx-p.x, ddy = my-p.y;
          var dist = Math.sqrt(ddx*ddx+ddy*ddy) || 1;
          var rad  = 140 + p.size*5;
          if (dist < rad) {
            var f = (rad-dist)/rad;
            p.vx -= ddx/dist*f*f*2.5*0.08;
            p.vy -= ddy/dist*f*f*2.5*0.08;
          }
        }
        p.x += p.vx; p.y += p.vy;
      }

      buildGrid();
      drawConns();

      /* ── Draw particles — cached color strings, gradient chỉ cho hạt to ── */
      for (var si = 0; si < P.length; si++) {
        var p = P[si];

        if (p.glow) {
          /* Glow: globalAlpha + arc thay vì createRadialGradient */
          ctx.save();
          ctx.globalAlpha = 0.13;
          ctx.fillStyle   = p.csg;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (p.size > 4) {
          /* Hạt to: vẫn dùng gradient cho đẹp, dùng cached color strings */
          var bg2 = ctx.createRadialGradient(
            p.x - p.size*0.3, p.y - p.size*0.3, 0,
            p.x, p.y, p.size
          );
          bg2.addColorStop(0,   p.cs0);
          bg2.addColorStop(0.5, p.cs1);
          bg2.addColorStop(1,   p.cs2);
          ctx.fillStyle = bg2;
        } else {
          /* Hạt nhỏ: arc thuần — không tạo gradient object */
          ctx.fillStyle = p.cs1;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }

      if (mx > 0) {
        var sp = ctx.createRadialGradient(mx,my,0,mx,my,140);
        sp.addColorStop(0,'rgba(0,0,0,0.16)'); sp.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = sp; ctx.fillRect(0,0,W,H);
      }
      if (vignetteGrad) { ctx.fillStyle = vignetteGrad; ctx.fillRect(0,0,W,H); }

      uiCtx.clearRect(0,0,W,H);
      if (entered && mx > 0) {
        uiCtx.beginPath(); uiCtx.arc(mx,my,16,0,Math.PI*2);
        uiCtx.strokeStyle = 'rgba(6,2,2,0.32)'; uiCtx.lineWidth = 1; uiCtx.stroke();
        uiCtx.beginPath(); uiCtx.arc(mx,my,2.5,0,Math.PI*2);
        uiCtx.fillStyle = 'rgba(8,2,2,0.5)'; uiCtx.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    function resize() {
      var rect = section.getBoundingClientRect();
      W = Math.round(rect.width)  || window.innerWidth;
      H = Math.round(rect.height) || 600;
      /* Update cached rect — dùng lại trong mousemove, không gọi lại getBCR */
      sectionRect.left = rect.left;
      sectionRect.top  = rect.top;
      bgCv.width = W; bgCv.height = H;
      cv.width   = W; cv.height   = H;
      uiCv.width = W; uiCv.height = H;
      drawBg(); buildVignette();
      if (W > 0 && H > 0) initParticles();
    }

    section.addEventListener('mouseenter', function () { entered = true; });
    section.addEventListener('mouseleave', function () { entered = false; mouse.x = -999; mouse.y = -999; });
    section.addEventListener('mousemove', function (e) {
      /* Dùng cached rect — không gọi getBoundingClientRect mỗi mousemove */
      mouse.x = e.clientX - sectionRect.left;
      mouse.y = e.clientY - sectionRect.top;
    }, { passive: true });
    /* Update cache khi scroll vì rect.top thay đổi */
    window.addEventListener('scroll', function () {
      var r = section.getBoundingClientRect();
      sectionRect.left = r.left;
      sectionRect.top  = r.top;
    }, { passive: true });
    section.addEventListener('click', function () {
      formed = !formed;
      hintEl.textContent = formed ? 'click to scatter' : 'click to reveal';
      if (!formed) { for (var i = 0; i < P.length; i++) { P[i].vx = rnd(-4,4); P[i].vy = rnd(-4,4); } }
    });

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { resize(); }).observe(section);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }

    resize();

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!rafId) rafId = requestAnimationFrame(frame); }
      else { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    }, { threshold: 0.01 }).observe(section);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
      else { if (!rafId) rafId = requestAnimationFrame(frame); }
    });

    rafId = requestAnimationFrame(frame);
  });
})();