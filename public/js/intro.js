(function () {
  'use strict';

  const COOKIE_KEY = 'ph_intro_seen';
  const COOKIE_DAYS = 1;

  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }

  const overlay = document.getElementById('intro-overlay');

  /* Returning visitor (cookie still valid) → skip intro completely */
  if (getCookie(COOKIE_KEY)) {
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('intro-playing');
    return;
  }

  /* First-time (or expired cookie) visitor → play intro once */
  document.body.classList.add('intro-playing');

  const percyWrap = document.getElementById('percy-wrap');
  const wordsWrap = document.getElementById('words-wrap');
  const letters = document.querySelectorAll('.percy-letter');
  const secWrap = document.getElementById('secondary-wrap');
  const secInner = document.getElementById('secondary-inner');
  const words = document.querySelectorAll('.secondary-word');

  document.fonts.ready.then(() => {
    const wordH = words[0].getBoundingClientRect().height;
    secWrap.style.height = wordH + 'px';

    const tl = gsap.timeline({
      onComplete() {
        document.body.classList.remove('intro-playing');
        window.dispatchEvent(new Event('scroll'));
        setCookie(COOKIE_KEY, '1', COOKIE_DAYS);
      }
    });

    /* ── SEQ 1: Letters plunge from 3D depth ── */
    letters.forEach((letter, i) => {
      tl.fromTo(letter,
        { opacity: 0, y: -60, z: 280 },
        {
          opacity: 1, y: 0, z: 0,
          duration: 0.55,
          ease: 'power4.out',
          onComplete() {
            gsap.to(letter, {
              scaleY: 0.87, scaleX: 1.09,
              duration: 0.055, yoyo: true, repeat: 1,
              ease: 'power2.inOut'
            });
          }
        },
        0.12 + i * 0.08
      );
    });

    /* ── SEQ 2: Percy shifts left, secondary fades in ── */
    tl.to(percyWrap, { x: -12, duration: 0.4, ease: 'power2.inOut' }, '+=0.18');
    tl.to(secWrap, { opacity: 1, duration: 0.2 }, '<0.05');

    /* ── SEQ 3: Cycle words — accelerating ── */
    const cycles = [
      { hold: 0.5,  slide: 0.35 },
      { hold: 0.42, slide: 0.28 },
      { hold: 0.32, slide: 0.22 },
    ];

    cycles.forEach(({ hold, slide }, i) => {
      tl.to(secInner, {
        y: -wordH * (i + 1),
        duration: slide,
        ease: 'power3.inOut'
      }, `+=${hold}`);
    });

    /* ── SEQ 4: Words scale up + fade out, overlay slides up ── */
    tl.to(wordsWrap, {
      scale: 1.18,
      opacity: 0,
      duration: 0.75,
      ease: 'power3.in'
    }, '+=0.28');

    tl.to(overlay, {
      yPercent: -100,
      duration: 0.75,
      ease: 'power4.inOut',
      onComplete() {
        overlay.style.display = 'none';
      }
    }, '<');
  });
})();
