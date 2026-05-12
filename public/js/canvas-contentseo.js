/* ── Canvas diagrams for nfa-grid (replaces section-contentseo images) ── */
(function () {
  'use strict';

  var FF = '"Courier New", Courier, monospace';
  var INK = '#111';

  /* ── primitives ── */
  function clr(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }
  function setInk(ctx, lw) {
    ctx.strokeStyle = INK;
    ctx.fillStyle   = INK;
    ctx.lineWidth   = lw || 1.4;
  }
  function ln(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function bx(ctx, x, y, w, h) {
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }
  function rbx(ctx, x, y, w, h, r) {
    r = r || 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
    ctx.stroke();
  }
  function dbx(ctx, x, y, w, h) {
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.restore();
  }
  function dot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r || 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  function txt(ctx, s, x, y, sz, bold, align) {
    ctx.font = (bold ? 'bold ' : '') + sz + 'px ' + FF;
    ctx.fillStyle = INK;
    ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
    ctx.textAlign = 'left';
  }
  function cTxt(ctx, s, cx, cy, sz, bold) {
    txt(ctx, s, cx, cy, sz, bold, 'center');
  }
  /* multi-line text centered inside rect */
  function boxLabel(ctx, lines, x, y, w, h, sz) {
    var lh = sz * 1.35, total = lines.length * lh;
    var sy = y + (h - total) / 2 + sz;
    ctx.font = sz + 'px ' + FF;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    lines.forEach(function (l, i) { ctx.fillText(l, x + w / 2, sy + i * lh); });
    ctx.textAlign = 'left';
  }

  /* ══════════════════════════════════════════════════
     CANVAS 1 — GTrip: Site Structure (topic cluster tree)
     W=560 H=525  (matches aspect-ratio 16/15)
  ══════════════════════════════════════════════════ */
  function drawGTrip(cvs) {
    var W = 560, H = 525;
    cvs.width = W; cvs.height = H;
    var ctx = cvs.getContext('2d');
    clr(ctx, W, H);
    setInk(ctx, 1.5);

    /* title */
    txt(ctx, 'GTrip – Content SEO', 18, 28, 18, true);

    /* Homepage */
    var hpX = 208, hpY = 44, hpW = 118, hpH = 28;
    bx(ctx, hpX, hpY, hpW, hpH);
    boxLabel(ctx, ['Homepage'], hpX, hpY, hpW, hpH, 11);

    /* line down → split */
    var mid = hpX + hpW / 2; // 267
    ln(ctx, mid, hpY + hpH, mid, 90);
    var lX = 130, rX = 415;
    ln(ctx, lX, 90, rX, 90);
    ln(ctx, lX, 90, lX, 110);
    ln(ctx, rX, 90, rX, 110);

    /* Attractions */
    var aW = 106, aH = 28, aX = lX - aW / 2, aY = 110;
    bx(ctx, aX, aY, aW, aH);
    boxLabel(ctx, ['Attractions'], aX, aY, aW, aH, 10);

    /* Travel Blogs */
    var tbW = 110, tbH = 28, tbX = rX - tbW / 2, tbY = 110;
    bx(ctx, tbX, tbY, tbW, tbH);
    boxLabel(ctx, ['Travel Blogs'], tbX, tbY, tbW, tbH, 10);

    /* vertical stem */
    var stemX = lX;
    ln(ctx, stemX, aY + aH, stemX, 335);

    /* pillar pages — plain rect, left of stem */
    var ppX = 8, ppW = 96, ppH = 26;
    var pillars = ['Ninh Binh', 'Hanoi', 'Ho Chi Minh', 'Da Nang'];
    var ppYs   = [152, 190, 228, 266];
    pillars.forEach(function (name, i) {
      var py = ppYs[i], pcy = py + ppH / 2;
      bx(ctx, ppX, py, ppW, ppH);
      boxLabel(ctx, [name], ppX, py, ppW, ppH, 9.5);
      ln(ctx, ppX + ppW, pcy, stemX, pcy);
      dot(ctx, stemX, pcy, 3);
    });
    txt(ctx, '⋯', 48, 322, 18, false); // ⋯

    /* URL hint (tiny) */
    ctx.font = '7px ' + FF;
    ctx.fillStyle = '#555';
    ctx.fillText('https://gtrip.vn/vietnam-tours', 144, 164);
    ctx.fillText('/attractions/slug', 144, 174);
    ctx.fillStyle = INK;

    /* cluster pages — rounded rect, right of stem */
    var cpX = 144, cpW = 122, cpH = 26;
    var clusters = ['One Pillar Pagoda', 'Hoan Kiem Lake', 'Hoa Lo Prison', 'Phan Dinh Phung St.'];
    var cpYs    = [178, 212, 246, 280];
    clusters.forEach(function (name, i) {
      var cy = cpYs[i], ccy = cy + cpH / 2;
      rbx(ctx, cpX, cy, cpW, cpH, 6);
      boxLabel(ctx, [name], cpX, cy, cpW, cpH, 9.5);
      ln(ctx, stemX, ccy, cpX, ccy);
      dot(ctx, stemX, ccy, 3);
    });

    /* Topic Cluster dashed box */
    var tcX = 294, tcY = 112, tcW = 206, tcH = 220;
    dbx(ctx, tcX, tcY, tcW, tcH);
    txt(ctx, 'Topic Cluster', tcX + 10, tcY + 20, 9.5, true);
    ctx.font = '7px ' + FF;
    ctx.fillStyle = '#555';
    ctx.fillText('https://gtrip.vn/travel-blogs/slug', tcX + 10, tcY + 36);
    ctx.fillStyle = INK;

    /* topic pages */
    var tpX = tcX + 20, tpW = 116, tpH = 26;
    var topics = ['Travel guide', 'Top list', 'Events', 'Things to do'];
    var tpYs   = [tcY + 48, tcY + 82, tcY + 116, tcY + 150];
    topics.forEach(function (name, i) {
      var ty = tpYs[i];
      rbx(ctx, tpX, ty, tpW, tpH, 6);
      boxLabel(ctx, [name], tpX, ty, tpW, tpH, 10);
    });

    /* Travel Blogs → first topic page */
    ln(ctx, rX, tbY + tbH, rX, tpYs[0] + tpH / 2);
    ln(ctx, rX, tpYs[0] + tpH / 2, tpX + tpW, tpYs[0] + tpH / 2);

    /* legend */
    var legY = 432;
    ln(ctx, 10, legY - 8, W - 10, legY - 8);
    bx(ctx, 12, legY, 50, 20);
    txt(ctx, 'Pillar Page', 70, legY + 14, 9, false);
    rbx(ctx, 160, legY, 55, 20, 5);
    txt(ctx, 'Cluster Page', 222, legY + 14, 9, false);
    ln(ctx, 328, legY + 10, 368, legY + 10);
    ctx.beginPath();
    ctx.moveTo(368, legY + 10);
    ctx.lineTo(361, legY + 5); ctx.moveTo(368, legY + 10);
    ctx.lineTo(361, legY + 15);
    ctx.stroke();
    txt(ctx, 'Internal Link', 376, legY + 14, 9, false);
  }

  /* ══════════════════════════════════════════════════
     CANVAS 2 — Royal Helmet: Hub & Spoke (6 nodes)
     W=560 H=490  (matches aspect-ratio 16/14)
  ══════════════════════════════════════════════════ */
  function drawRoyalHelmet(cvs) {
    var W = 560, H = 490;
    cvs.width = W; cvs.height = H;
    var ctx = cvs.getContext('2d');
    clr(ctx, W, H);
    setInk(ctx, 1.5);

    txt(ctx, 'Royal Helmet – Content SEO', 18, 26, 18, true);

    var cx = 278, cy = 265, CR = 50, SR = 126;

    /* dashed spoke ring */
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, SR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    /* center circle */
    ctx.beginPath(); ctx.arc(cx, cy, CR, 0, Math.PI * 2); ctx.stroke();

    /* crown icon */
    (function () {
      var bx0 = cx - 14, bt = cy - 28;
      ctx.fillStyle = INK;
      ctx.fillRect(bx0, bt + 15, 28, 5);
      ctx.beginPath();
      ctx.moveTo(bx0,      bt + 15);
      ctx.lineTo(bx0,      bt + 4);
      ctx.lineTo(bx0 + 9,  bt + 11);
      ctx.lineTo(bx0 + 14, bt);
      ctx.lineTo(bx0 + 19, bt + 11);
      ctx.lineTo(bx0 + 28, bt + 4);
      ctx.lineTo(bx0 + 28, bt + 15);
      ctx.closePath();
      ctx.fillStyle = INK;
      ctx.fill();
    })();

    cTxt(ctx, 'Royal', cx, cy + 22, 13, true);

    /* 6 nodes */
    var nodes = [
      { label: ['Helmet', 'Guide'],       angle: 270, bw: 90,  bh: 36, dir: 'left',
        bullets: ['How to choose', 'Helmet safety', 'Certifications'] },
      { label: ['Buying', 'Guide'],        angle: 330, bw: 88,  bh: 36, dir: 'right',
        bullets: ['Size Guide', 'Materials', 'Price Range'] },
      { label: ['Safety', 'Knowledge'],    angle:  30, bw: 92,  bh: 36, dir: 'right',
        bullets: ['Safety Standards', 'Impact Protection', 'Riding Safety'] },
      { label: ['Reviews &', 'Comparisons'], angle: 90, bw: 104, bh: 36, dir: 'right',
        bullets: ['Product Reviews', 'Top Picks', 'Comparisons'] },
      { label: ['Maintenance'],            angle: 150, bw: 96,  bh: 26, dir: 'left',
        bullets: ['Cleaning Tips', 'Storage', 'Helmet Care'] },
      { label: ['Product', 'Types'],       angle: 210, bw: 90,  bh: 36, dir: 'left',
        bullets: ['1/2 Helmet', '3/4 Helmet', 'Full Face', 'Kid Helmet'] },
    ];

    nodes.forEach(function (nd) {
      var rad = nd.angle * Math.PI / 180;
      var nx  = cx + SR * Math.cos(rad);
      var ny  = cy + SR * Math.sin(rad);
      var bX  = Math.max(2,      Math.min(W - nd.bw - 2, nx - nd.bw / 2));
      var bY  = Math.max(32,     Math.min(H - nd.bh - 4, ny - nd.bh / 2));

      /* spoke */
      var ex = cx + CR * Math.cos(rad), ey = cy + CR * Math.sin(rad);
      var ex2 = Math.max(bX, Math.min(bX + nd.bw, ex));
      var ey2 = Math.max(bY, Math.min(bY + nd.bh, ey));
      ln(ctx, ex, ey, ex2, ey2);
      dot(ctx, ex, ey, 3);

      /* box */
      bx(ctx, bX, bY, nd.bw, nd.bh);
      boxLabel(ctx, nd.label, bX, bY, nd.bw, nd.bh, 9.5);

      /* bullets */
      var bsz = 7.5, blh = 11;
      var btotal = nd.bullets.length * blh;
      var bsy = bY + (nd.bh - btotal) / 2 + bsz;

      ctx.font = bsz + 'px ' + FF;
      ctx.fillStyle = INK;
      if (nd.dir === 'right') {
        var bX2 = bX + nd.bw + 5;
        nd.bullets.forEach(function (b, bi) {
          ctx.textAlign = 'left';
          ctx.fillText('• ' + b, bX2, bsy + bi * blh);
        });
      } else {
        /* left: right-align flush to box-left */
        nd.bullets.forEach(function (b, bi) {
          ctx.textAlign = 'right';
          ctx.fillText('• ' + b, bX - 5, bsy + bi * blh);
        });
      }
      ctx.textAlign = 'left';
    });
  }

  /* ══════════════════════════════════════════════════
     CANVAS 3 — Freelance Content SEO (10-node hub)
     W=560 H=455  (matches aspect-ratio 16/13)
  ══════════════════════════════════════════════════ */
  function drawFreelance(cvs) {
    var W = 560, H = 455;
    cvs.width = W; cvs.height = H;
    var ctx = cvs.getContext('2d');
    clr(ctx, W, H);
    setInk(ctx, 1.5);

    txt(ctx, 'Freelance Content SEO', 18, 26, 18, true);
    txt(ctx, 'Multi-Industry Content Experience', 18, 44, 9.5, false);

    var cx = 278, cy = 218, CR = 44, SR = 116;

    /* center circle */
    ctx.beginPath(); ctx.arc(cx, cy, CR, 0, Math.PI * 2); ctx.stroke();

    /* pencil icon */
    (function () {
      ctx.save();
      ctx.translate(cx, cy - 12);
      ctx.rotate(-0.55);
      ctx.strokeRect(-3.5, -12, 7, 17);
      ctx.beginPath();
      ctx.moveTo(-3.5, 5); ctx.lineTo(3.5, 5); ctx.lineTo(0, 12); ctx.closePath();
      ctx.stroke();
      ctx.restore();
    })();

    cTxt(ctx, 'SEO CONTENT', cx, cy + 8,  7.5, true);
    cTxt(ctx, 'STRATEGY &',  cx, cy + 19, 7,   false);
    cTxt(ctx, 'EXECUTION',   cx, cy + 29, 7,   false);

    /* 10 nodes, starting top (270°), clockwise 36° each */
    var nodeData = [
      { label: 'Beauty',          sub: ['Blog · Guide',    'Brand · Skincare']      },
      { label: 'Investment',      sub: ['Blog · Guide',    'News · Analysis']       },
      { label: 'Healthcare',      sub: ['Medical Info',    'Health Guide']          },
      { label: 'Pharmaceuticals', sub: ['Drug Info',       '(Educational)']         },
      { label: 'Sports',          sub: ['News · Update',   'Tips · Analysis']       },
      { label: 'Education',       sub: ['Guide · Resource','Study Tips']            },
      { label: 'Lifestyle',       sub: ['Blog · Tips',     'Inspiration']           },
      { label: 'Technology',      sub: ['Review · Guide',  'How-to · Tutorial']     },
      { label: 'E-commerce',      sub: ['Product Guide',   'Review · Comparison']   },
      { label: 'Travel',          sub: ['Destination',     'Guide · Tips']          },
    ];

    var maxBY = H - 105 - 44;
    nodeData.forEach(function (nd, i) {
      var angle = (270 + i * 36) * Math.PI / 180;
      var nx    = cx + SR * Math.cos(angle);
      var ny    = cy + SR * Math.sin(angle);
      var bw = 98, bh = 44;
      var bX = Math.max(2, Math.min(W - bw - 2, nx - bw / 2));
      var bY = Math.max(52, Math.min(maxBY, ny - bh / 2));

      /* dashed spoke */
      var ex = cx + CR * Math.cos(angle), ey = cy + CR * Math.sin(angle);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ln(ctx, ex, ey, nx, ny);
      ctx.restore();
      dot(ctx, ex, ey, 2.5);

      /* rounded box */
      rbx(ctx, bX, bY, bw, bh, 7);

      /* tiny icon box */
      ctx.strokeRect(bX + 4, bY + 5, 9, 9);

      /* label */
      txt(ctx, nd.label, bX + 17, bY + 14, 8.5, true);

      /* sub lines */
      ctx.font = '7.5px ' + FF;
      ctx.fillStyle = '#333';
      nd.sub.forEach(function (s, si) {
        ctx.fillText(s, bX + 5, bY + 27 + si * 11);
      });
      ctx.fillStyle = INK;
    });

    /* ── CONTENT TYPES ── */
    var btY = H - 100;
    ln(ctx, 10, btY, W - 10, btY);
    txt(ctx, 'CONTENT TYPES', 14, btY + 14, 8.5, true);

    ctx.font = '7.5px ' + FF;
    var ctypes = ['Blog Posts', 'Guides', 'Product Pages', 'Landing Pages', 'News/Updates'];
    var ctX = 14;
    ctypes.forEach(function (tp) {
      var tw = ctx.measureText(tp).width + 14;
      rbx(ctx, ctX, btY + 18, tw, 17, 4);
      ctx.fillStyle = INK;
      ctx.fillText(tp, ctX + 5, btY + 30);
      ctX += tw + 5;
    });

    /* ── KEY FOCUS AREAS ── */
    ln(ctx, 10, btY + 42, W - 10, btY + 42);
    txt(ctx, 'KEY FOCUS AREAS', 14, btY + 56, 8.5, true);

    ctx.font = '8px ' + FF;
    var kfas = ['Keyword Research', 'Search Intent', 'Content Structure', 'On-Page SEO', 'Internal Linking'];
    var kfaX = 14;
    kfas.forEach(function (k, i) {
      ctx.fillStyle = INK;
      ctx.fillText(k, kfaX, btY + 72);
      if (i < kfas.length - 1) {
        kfaX += ctx.measureText(k).width;
        ctx.fillStyle = '#999';
        ctx.fillText(' | ', kfaX, btY + 72);
        kfaX += ctx.measureText(' | ').width;
      }
    });
  }

  /* ── init ── */
  function init() {
    var c1 = document.getElementById('canvasContentseo1');
    var c2 = document.getElementById('canvasContentseo2');
    var c3 = document.getElementById('canvasContentseo3');
    if (c1) drawGTrip(c1);
    if (c2) drawRoyalHelmet(c2);
    if (c3) drawFreelance(c3);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
