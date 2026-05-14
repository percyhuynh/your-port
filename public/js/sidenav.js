/**
 * cursor.js — custom cursor đơn giản
 * - Chấm tròn trắng chạy theo chuột với smoothing
 * - Phình to khi hover vào interactive elements
 * - Ẩn khi ở .banner và .reveal-container (các section đó tự xử lý cursor)
 * - Không tự đổi màu — tránh getComputedStyle mỗi frame
 */

(function () {
  'use strict';

  /* ── Ẩn cursor hệ thống toàn trang ── */
  const cursorStyle = document.createElement('style');
  cursorStyle.textContent = '*,*::before,*::after{cursor:none!important;}';
  document.head.appendChild(cursorStyle);

  /* ── Tạo chấm ── */
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position:      'fixed',
    width:         '10px',
    height:        '10px',
    borderRadius:  '50%',
    background:    '#6b1a1a',
    pointerEvents: 'none',
    transform:     'translate(-50%,-50%)',
    transition:    'width .15s ease, height .15s ease, opacity .2s ease',
    zIndex:        '2147483647',
    opacity:       '0',
    left:          '-100px',
    top:           '-100px',
  });
  document.body.appendChild(dot);

  /* ── Vùng ẩn cursor ── */
  const HIDE_ZONES = ['.banner', '.reveal-container'];

  function isInHideZone(el) {
    if (!el || el.nodeType !== 1) return false;
    return HIDE_ZONES.some(sel => el.closest(sel));
  }

  /* ── Track reveal visibility bằng MutationObserver ── */
  let revealVisible = false;
  const revealEl = document.querySelector('.reveal-container');
  if (revealEl) {
    new MutationObserver(() => {
      revealVisible = parseFloat(revealEl.style.opacity || '0') > 0;
    }).observe(revealEl, { attributes: true, attributeFilter: ['style'] });
  }

  /* ── Smoothing ── */
  let mx = 0, my = 0, cx = 0, cy = 0, started = false;
  let loopRunning = false;

  function startLoop() {
    if (loopRunning) return;
    loopRunning = true;
    function loop() {
      cx += (mx - cx) * 0.14;
      cy += (my - cy) * 0.14;
      dot.style.left = cx + 'px';
      dot.style.top  = cy + 'px';
      /* Dừng loop khi cursor đã đến đích — tránh chạy 60fps vĩnh viễn */
      const dx = mx - cx, dy = my - cy;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        loopRunning = false;
        return;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!started) { cx = mx; cy = my; started = true; }
    const hide = isInHideZone(e.target) || revealVisible;
    dot.style.opacity = hide ? '0' : '1';
    startLoop(); /* chỉ bật loop khi chuột di chuyển */
  }, { passive: true });

  /* ── Phình to khi hover interactive elements ── */
  const INTERACTIVE = 'a, button, [data-cursor], [role="button"]';

  function bindCursor(el) {
    if (el._cursorBound || isInHideZone(el)) return;
    el._cursorBound = true;
    el.addEventListener('mouseenter', () => {
      dot.style.width = '18px';
      dot.style.height = '18px';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.width = '10px';
      dot.style.height = '10px';
    });
  }

  document.querySelectorAll(INTERACTIVE).forEach(bindCursor);
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches?.(INTERACTIVE)) bindCursor(n);
      n.querySelectorAll?.(INTERACTIVE).forEach(bindCursor);
    }));
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('mousedown', e => {
    if (!isInHideZone(e.target)) {
      dot.style.width = '7px';
      dot.style.height = '7px';
    }
  });
  document.addEventListener('mouseup', () => {
    dot.style.width = '10px';
    dot.style.height = '10px';
  });

})();

/* ── Smart Nav expand — JS controlled với delay đóng ── */
(function () {
  const containers = document.querySelectorAll('.smart-container');
  containers.forEach(container => {
    let closeTimer = null;

    container.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
      container.classList.add('is-open');
    });

    container.addEventListener('mouseleave', () => {
      /* Delay 400ms trước khi đóng — user có thể di chuột ra ngoài 1 chút mà không bị đóng */
      closeTimer = setTimeout(() => {
        container.classList.remove('is-open');
      }, 400);
    });
  });
})();

// <---->

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

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    window.__isJumping = true;

    /* s4 (Others): skip zoom phase, scroll thẳng vào content */
    if (id === 's4' && typeof window.__othersJumpToContent === 'function') {
      window.__othersJumpToContent();
    } else {
      el.scrollIntoView({ behavior: 'instant' });
    }

    clearTimeout(window.__jumpTimer);
    window.__jumpTimer = setTimeout(function () {
      window.__isJumping = false;
      window.dispatchEvent(new Event('__jumpdone'));
      window.dispatchEvent(new Event('scroll'));
    }, 200);
  }

  const dotEls = SECTIONS.map((sec) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.title = sec.name;
    const fill = document.createElement('div');
    fill.className = 'dot-fill';
    dot.appendChild(fill);
    layerDots.appendChild(dot);
    dot.addEventListener('click', () => jumpTo(sec.id));
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
    btn.addEventListener('click', () => jumpTo(sec.id));
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
    /* Chỉ cần: hide reveal → scroll instant → bật isJumping để onUpdate skip
       Không cần ScrollTrigger.update() — nó trigger onUpdate lại gây reveal bật nhầm */
    const reveal = document.querySelector('.reveal-container');
    if (reveal) {
      reveal.style.opacity = '0';
      reveal.style.pointerEvents = 'none';
    }
    window.__isJumping = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    clearTimeout(window.__jumpTimer);
    window.__jumpTimer = setTimeout(function () {
      window.__isJumping = false;
    }, 200);
  });
}());