/**
 * cursor-effect.js
 *
 * - Chấm tròn chạy theo chuột, tự đổi màu tương phản với nền phía dưới
 * - Hover vào a/button/[data-cursor]: chấm phình to nhẹ
 * - Click: sóng lan ra 1 lần như gợn mặt nước
 * - Chấm tròn ẩn: .reveal-container (cursor hệ thống ẩn toàn trang)
 */

(function () {
  'use strict';

  /* ── Elements/selectors ẩn chấm tròn ── */
  const EXCLUDE = '.reveal-container, .banner';

  function isExcluded(el) {
    if (!el || el.nodeType !== 1) return false;
    return !!el.closest(EXCLUDE);
  }

  /* ── Inject keyframe + ẩn cursor gốc toàn trang ── */
  const style = document.createElement('style');
  style.textContent =
    '@keyframes _ce_r{to{transform:scale(1);opacity:0;}}' +
    '*,*::before,*::after{cursor:none!important;}';
  document.head.appendChild(style);

  /* ── Tạo chấm ── */
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position:      'fixed',
    width:         '10px',
    height:        '10px',
    borderRadius:  '50%',
    background:    '#ffffff',
    pointerEvents: 'none',
    transform:     'translate(-50%,-50%)',
    transition:    'width .15s, height .15s, background .22s',
    zIndex:        '2147483647',
    opacity:       '0',
  });
  document.body.appendChild(dot);

  let mx = 0, my = 0, cx = 0, cy = 0, started = false;

  const revealEl = document.querySelector('.reveal-container');
  function isRevealActive() {
    return revealEl && parseFloat(getComputedStyle(revealEl).opacity) > 0;
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!started) { cx = mx; cy = my; started = true; }
    dot.style.opacity = (isExcluded(e.target) || isRevealActive()) ? '0' : '1';
  });
  document.addEventListener('mouseleave', () => dot.style.opacity = '0');
  document.addEventListener('mouseenter', e => {
    dot.style.opacity = isRevealActive() ? '0' : '1';
  });

  (function loop() {
    cx += (mx - cx) * 0.14;
    cy += (my - cy) * 0.14;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();

  /* ── Lấy màu nền thực, leo lên cha nếu transparent ── */
  function getBg(el) {
    let node = el;
    while (node && node.nodeType === 1) {
      const c = getComputedStyle(node).backgroundColor;
      const m = c.match(/[\d.]+/g);
      if (!m || m.length < 3) { node = node.parentElement; continue; }
      const a = m[3] !== undefined ? +m[3] : 1;
      if (a < 0.05 || (+m[0] === 0 && +m[1] === 0 && +m[2] === 0 && a < 0.05)) {
        node = node.parentElement; continue;
      }
      return { r: +m[0], g: +m[1], b: +m[2] };
    }
    return { r: 255, g: 255, b: 255 };
  }

  function lum({ r, g, b }) {
    return [r, g, b].reduce((s, v, i) => {
      v /= 255;
      v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return s + v * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  }

  function contrast(el) {
    return lum(getBg(el)) > 0.35 ? '#111111' : '#ffffff';
  }

  /* ── Cập nhật màu chấm theo element dưới chuột ── */
  document.addEventListener('mousemove', e => {
    if (isExcluded(e.target)) return;
    dot.style.display = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    dot.style.display = '';
    if (under && !isExcluded(under)) dot.style.background = contrast(under);
  });

  /* ── Ripple chỉ khi click ── */
  function spawnRipple(e, el) {
    if (isExcluded(el)) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const fg = contrast(el);

    const rip = document.createElement('span');
    Object.assign(rip.style, {
      position:      'absolute',
      borderRadius:  '50%',
      width:         r * 2 + 'px',
      height:        r * 2 + 'px',
      left:          (x - r) + 'px',
      top:           (y - r) + 'px',
      background:    fg,
      opacity:       '0.18',
      transform:     'scale(0)',
      animation:     '_ce_r 0.6s ease-out forwards',
      pointerEvents: 'none',
    });

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  }

  /* ── Bind elements (bỏ qua excluded) ── */
  const SEL = 'a, button, [data-cursor], [role="button"], input[type="submit"], input[type="button"]';

  function bind(el) {
    if (el._ce || isExcluded(el)) return;
    el._ce = true;
    el.addEventListener('mouseenter', () => { dot.style.width = '18px'; dot.style.height = '18px'; });
    el.addEventListener('mouseleave', () => { dot.style.width = '10px'; dot.style.height = '10px'; });
    el.addEventListener('click', e => spawnRipple(e, el));
  }

  document.querySelectorAll(SEL).forEach(bind);
  new MutationObserver(ms => ms.forEach(m =>
    m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches(SEL)) bind(n);
      n.querySelectorAll && n.querySelectorAll(SEL).forEach(bind);
    })
  )).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('mousedown', e => {
    if (isExcluded(e.target)) return;
    dot.style.width = '7px'; dot.style.height = '7px';
  });
  document.addEventListener('mouseup', () => {
    dot.style.width = '10px'; dot.style.height = '10px';
  });

})();

// <---->

(() => {
  'use strict';

  const SECTIONS = [
    { id: 's0', name: 'SEO Strategy' },
    { id: 's1', name: 'Content SEO' },
    { id: 's2', name: 'UI/UX & Design' },
    { id: 'scrollSection', name: 'Automation & Tech' },
    { id: 's4', name: 'Others' },
  ];

  const nav = document.getElementById('nav');
  const layerDots = document.getElementById('layerDots');
  const layerLinks = document.getElementById('layerLinks');

  const dotEls = SECTIONS.map((sec) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.title = sec.name;
    const fill = document.createElement('div');
    fill.className = 'dot-fill';
    dot.appendChild(fill);
    layerDots.appendChild(dot);
    dot.addEventListener('click', () =>
      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' })
    );
    return { dot, fill };
  });

  const linkEls = SECTIONS.map((sec, i) => {
    if (i > 0) {
      const div = document.createElement('span');
      div.className = 'nav-divider';
      div.setAttribute('aria-hidden', 'true');
      layerLinks.appendChild(div);
    }
    const btn = document.createElement('button');
    btn.className = 'nav-link';
    btn.textContent = sec.name;
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Go to ${sec.name}`);
    btn.addEventListener('click', () =>
      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' })
    );
    layerLinks.appendChild(btn);
    return btn;
  });

  let isHovered = false;
  let activeIdx = 0;
  let rafId = null;

  function applyState() {
    nav.dataset.state = isHovered ? 'pill' : 'dots';
  }

  nav.addEventListener('mouseenter', () => { isHovered = true; applyState(); });
  nav.addEventListener('mouseleave', () => { isHovered = false; applyState(); });

  // function getSectionProgress(el) {
  //   const { top } = el.getBoundingClientRect();
  //   const h = el.offsetHeight;
  //   return Math.min(1, Math.max(0, -top / h));
  // }
function getSectionProgress(el) {
  // s4 dùng scroll-track riêng, lấy progress từ ps-scroll-track
  if (el.id === 's4') {
    const track = document.getElementById('ps-scroll-track');
    if (track) {
      const { top } = track.getBoundingClientRect();
      const h = track.offsetHeight;
      return Math.min(1, Math.max(0, -top / h));
    }
  }
  const { top } = el.getBoundingClientRect();
  const h = el.offsetHeight;
  return Math.min(1, Math.max(0, -top / h));
}
  function getActiveSection() {
    const mid = window.innerHeight / 2;
    let best = 0, bestDist = Infinity;
    SECTIONS.forEach(({ id }, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const { top, bottom } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (top < vh && bottom > 0) {
        const dist = Math.abs(top - mid * 0.5);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
    });
    return best;
  }

  function render() {
    rafId = null;
    const current = getActiveSection();
    SECTIONS.forEach(({ id }, i) => {
      const el = document.getElementById(id);
      const p = el ? getSectionProgress(el) : 0;
      const { dot, fill } = dotEls[i];
      const isActive = (i === current) && (p > 0.001);
      const isVisited = (p >= 0.999);
      dot.classList.toggle('is-active', isActive);
      dot.classList.toggle('is-visited', isVisited);
      if (isActive) {
        fill.style.width = (p * 100).toFixed(2) + '%';
      } else {
        fill.style.width = isVisited ? '100%' : '0%';
      }
    });
    if (current !== activeIdx) {
      activeIdx = current;
      linkEls.forEach((lnk, i) => lnk.classList.toggle('is-active', i === current));
    }
  }

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  linkEls[0].classList.add('is-active');
  applyState();
  render();

})();

// GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // BANNER
const heroHeader = document.getElementById("heroHeader");
const bannerImg  = document.querySelector(".banner .hero-img");

/* ── Dùng timeline + animation: bannerTl thay vì gsap.set() trong onUpdate.
   gsap.set() trong onUpdate tạo tween mới mỗi frame → giật.
   GSAP tự drive timeline qua render loop riêng → mượt. ── */
const bannerTl = gsap.timeline({ defaults: { ease: "none", force3D: true } });
bannerTl.to(heroHeader, { scale: 0.9, borderRadius: 24 }, 0);
if (bannerImg) bannerTl.to(bannerImg, { yPercent: -12 }, 0);

ScrollTrigger.create({
  trigger   : ".banner-scroll-wrapper",
  start     : "top top",
  end       : "bottom bottom",
  scrub     : 1,
  animation : bannerTl,
});

// reveal logic → public/js/reveal.js

// ── Back to top ──
(function () {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}());


