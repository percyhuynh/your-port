gsap.registerPlugin(ScrollTrigger);

(function () {
  'use strict';

  const reveal  = document.querySelector('.reveal-container');
  const others  = document.querySelector('.section-others');
  const handler = document.getElementById('handler');
  const svgContent = reveal ? reveal.querySelector('svg') : null;

  if (!reveal || !others) return;

  /* ── Initial state — hidden ── */
  reveal.style.opacity       = '0';
  reveal.style.pointerEvents = 'none';

  /* ── Helper: hide reveal ngay lập tức, kill scrub tween ── */
  function forceHide() {
    gsap.killTweensOf(reveal);
    reveal.style.opacity       = '0';
    reveal.style.pointerEvents = 'none';
    document.body.classList.remove('reveal-on');
  }

  /* ── ScrollTrigger curtain ── */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.reveal-trigger-spacer',
      start:   'top bottom',
      end:     'bottom 50%',
      scrub:   1,
      onUpdate(self) {
        /* Skip khi đang jump HOẶC đã về gần top — tránh reveal bật lại sau back-to-top */
        if (window.__isJumping || window.scrollY < window.innerHeight * 0.5) {
          forceHide();
          return;
        }
        const visible = self.progress > 0;
        reveal.style.opacity       = visible ? '1' : '0';
        reveal.style.pointerEvents = visible ? 'all' : 'none';
        document.body.classList.toggle('reveal-on', visible);
      },
      onLeaveBack() {
        /* Scroll ngược ra khỏi vùng trigger → hide ngay */
        forceHide();
      },
    },
  });

  tl.to(others, { clipPath: 'inset(0% 0% 100% 0%)', ease: 'none' });

  if (svgContent) {
    tl.fromTo(svgContent,
      { scale: 0.5, opacity: 0 },
      { scale: 1,   opacity: 1, ease: 'power2.out' },
      0
    );
  }

  /* ── Jump: force hide reveal ngay khi __isJumping bật ── */
  window.addEventListener('__jumpdone', forceHide);

  /* ── Reveal mask — mousemove với rAF throttle ── */
  if (handler) {
    const RADIUS    = 150;
    const streaky   = handler.querySelector('.streaky-blur');
    const revealLyr = handler.querySelector('.reveal');
    let rafQueued   = false;
    let pendingX    = -9999;
    let pendingY    = -9999;

    /* Track visibility bằng IntersectionObserver — không đọc style mỗi mousemove */
    let handlerVisible = false;
    new IntersectionObserver(function (entries) {
      handlerVisible = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(handler);

    function applyMask(mx, my) {
      const x = mx + 'px', y = my + 'px', r = RADIUS + 'px';
      const mReveal = `radial-gradient(${r} circle at ${x} ${y}, black 0%, black 55%, transparent 85%)`;
      const mStreak = `radial-gradient(${r} circle at ${x} ${y}, transparent 0%, transparent 45%, black 85%)`;
      if (revealLyr) {
        revealLyr.style.webkitMaskImage = mReveal;
        revealLyr.style.maskImage       = mReveal;
      }
      if (streaky) {
        streaky.style.webkitMaskImage = mStreak;
        streaky.style.maskImage       = mStreak;
      }
    }

    window.addEventListener('mousemove', function (e) {
      if (!handlerVisible) return;
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafQueued) {
        rafQueued = true;
        requestAnimationFrame(function () {
          applyMask(pendingX, pendingY);
          rafQueued = false;
        });
      }
    }, { passive: true });
  }

  /* ── ScrollTrigger.refresh debounced ── */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });

  var _resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
  }, { passive: true });

})();