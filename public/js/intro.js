document.body.classList.add('intro-playing');

const overlay = document.getElementById('intro-overlay');
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
    }
  });

  // ── SEQ 1: Letters plunge from 3D depth ──
  letters.forEach((letter, i) => {
    tl.fromTo(letter,
      { opacity: 0, y: -60, z: 280 },
      {
        opacity: 1, y: 0, z: 0,
        duration: 0.35,        // 0.55 → 0.35
        ease: 'power4.out',
        onComplete() {
          gsap.to(letter, {
            scaleY: 0.87, scaleX: 1.09,
            duration: 0.04, yoyo: true, repeat: 1,
            ease: 'power2.inOut'
          });
        }
      },
      0.08 + i * 0.055         // 0.12 + i*0.08 → 0.08 + i*0.055
    );
  });

  // ── SEQ 2: Percy shifts left, secondary fades in ──
  tl.to(percyWrap, { x: -12, duration: 0.28, ease: 'power2.inOut' }, '+=0.1');  // 0.4 → 0.28
  tl.to(secWrap, { opacity: 1, duration: 0.15 }, '<0.05');

  // ── SEQ 3: Cycle words — accelerating ──
  const cycles = [
    { hold: 0.32, slide: 0.22 },   // nhanh hơn ~35%
    { hold: 0.26, slide: 0.18 },
    { hold: 0.20, slide: 0.14 },
  ];

  cycles.forEach(({ hold, slide }, i) => {
    tl.to(secInner, {
      y: -wordH * (i + 1),
      duration: slide,
      ease: 'power3.inOut'
    }, `+=${hold}`);
  });

  // ── SEQ 4: Words scale up + fade out, overlay slides up ──
  tl.to(wordsWrap, {
    scale: 1.18,
    opacity: 0,
    duration: 0.5,             // 0.75 → 0.5
    ease: 'power3.in'
  }, '+=0.16');

  tl.to(overlay, {
    yPercent: -100,
    duration: 0.55,            // 0.75 → 0.55
    ease: 'power4.inOut',
    onComplete() {
      overlay.style.display = 'none';
    }
  }, '<');

});