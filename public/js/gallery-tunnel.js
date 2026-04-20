/* ═══════════════════════════════════════════════════════
   GALLERY TUNNEL — Deep Dark Corridor
   Depends on: GSAP + ScrollTrigger (loaded globally in index.html)
   All DOM queries scoped to #gallery-tunnel-wrapper
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var wrapper  = document.getElementById('gallery-tunnel-wrapper');
  var track    = document.getElementById('gt-track');
  var glow     = document.getElementById('gt-glow');
  var void_el  = document.getElementById('gt-void');
  var paintings = document.querySelectorAll('#gallery-tunnel-wrapper .gt-painting');

  if (!wrapper || !track || typeof ScrollTrigger === 'undefined') return;

  /* Z positions (px) of each painting inside the track — must match CSS */
  var Z_DEPTHS   = [600, 1200, 1800, 2400, 3000];
  var TRAVEL_END = 3600; /* total track translateZ at scroll end */

  gsap.registerPlugin(ScrollTrigger);

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   1.5
    }
  });

  /* ── Beat 1: Ceiling lights warm up (0 → 20%) ── */
  tl.to(glow, { opacity: 1, ease: 'power1.in', duration: 0.20 }, 0);

  /* ── Beat 2: Camera marches forward (0 → 90%) ── */
  tl.to(track, { z: TRAVEL_END, ease: 'none', duration: 0.90 }, 0);

  /* ── Beat 3: Paintings emerge from darkness one by one ── */
  paintings.forEach(function (painting, i) {
    var img    = painting.querySelector('.gt-img');
    var plaque = painting.querySelector('.gt-plaque');
    var depth  = Z_DEPTHS[i];

    /* Activate ~800px before painting reaches camera */
    var onAt  = Math.max(0.02, (depth - 800) / TRAVEL_END);
    /* Peak brightness as painting passes the "camera" */
    var peakAt = (depth / TRAVEL_END) * 0.90;

    /* Brightness fades in */
    tl.to(img,    { filter: 'brightness(1)',    ease: 'power2.out', duration: 0.14 }, onAt);
    tl.to(plaque, { opacity: 1,                 ease: 'power1.out', duration: 0.12 }, onAt + 0.02);

    /* After passing, dim the painting — it recedes behind camera */
    if (i < paintings.length - 1) {
      tl.to(img, { filter: 'brightness(0.14)', ease: 'power1.in',  duration: 0.10 }, peakAt + 0.07);
    }
  });

  /* ── Beat 4: The Exit — void swallows everything (84% → 100%) ── */
  tl.to(void_el, { opacity: 1, ease: 'power2.in', duration: 0.16 }, 0.84);

})();
