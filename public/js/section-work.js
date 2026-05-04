// ================================================================
// SECTION WORK — 3 hiệu ứng:
//   1. work-header bị đẩy lên trên biến mất khi scroll
//   2. brand-grid hiện ra từng card stagger sau header
//   3. scroll-space: khung snap dính cứng → nội dung bên trong trượt mượt
// ================================================================

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ── 1. WORK HEADER: đẩy lên trên biến mất khi scroll ──────────
gsap.to('.work-header', {
  y: '-30%',
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '.work-header',
    start: 'top top',
    end: '+=400',
    scrub: 0.6,
  }
});


// ── 2. BRAND GRID: cards reveal stagger khi màn hình 2 vào view ──
gsap.set('.brand-card', { y: 60, opacity: 0, scale: 0.93 });

ScrollTrigger.create({
  trigger: '.brand-grid-screen',
  start: 'top 60%',
  once: true,
  onEnter: () => {
    gsap.to('.brand-card', {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: {
        amount: 0.45,
        from: 'start',
        grid: [2, 4],
      }
    });
  }
});

// Parallax mousemove
document.querySelectorAll('.brand-card').forEach(function(card) {
  var bg = card.querySelector('.card-bg');
  if (!bg) return;
  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    var xPct = (e.clientX - rect.left) / rect.width  - 0.5;
    var yPct = (e.clientY - rect.top)  / rect.height - 0.5;
    bg.style.transform = 'scale(1.0) translate(' + (xPct * -16) + 'px, ' + (yPct * -16) + 'px)';
  });
  card.addEventListener('mouseleave', function() {
    bg.style.transform = 'scale(1.1)';
  });
});


// ── 3. SCROLL-SPACE: pin khung cứng, nội dung trượt mượt ──
const slides = [
  {
    title: "©Brand\nArchitecture",
    desc: "Structured visual identities designed to position, differentiate, and scale with precision and clarity.",
    img: "public/images/section-work-1.png",
  },
  {
    title: "©Digital\nStrategy",
    desc: "Thoughtfully crafted digital journeys designed to maximise engagement, retention, and delight.",
    img: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=85",
  },
  {
    title: "©Content\nSEO",
    desc: "Every touchpoint deliberate. Every mark intentional. Cohesive systems built to last and evolve.",
    img: "public/images/section-work-3.png",
  },
  {
    title: "©UI/UX\nDesign",
    desc: "Animation that breathes life into brand moments — felt more than seen, subtle yet unforgettable.",
    img: "public/images/section-work-4.png",
  },
  {
    title: "©Automation\nTechnical",
    desc: "Vision-led strategy unifying aesthetics, messaging, and culture into a singular brand point of view.",
    img: "public/images/section-work-5.png",
  },
  {
    title: "©Others",
    desc: "Data-informed decisions fused with creative instinct to build brands that connect and convert.",
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=85",
  },
];

const N = slides.length;

const imgPanel    = document.getElementById("imgPanel");
const headingClip = document.getElementById("headingClip");
const descClip    = document.getElementById("descClip");
const dotsEl      = document.getElementById("dots");
const counterEl   = document.getElementById("counter");

const imgs   = [];
const heads  = [];
const descs  = [];
const dotEls = [];

slides.forEach((s, i) => {
  const img = document.createElement("img");
  img.src = s.img;
  img.alt = "";
  imgPanel.appendChild(img);
  imgs.push(img);

  const h = document.createElement("div");
  h.className = "slide-heading";
  h.innerHTML = `<h2 class="slide-title">${s.title.replace("\n", "<br>")}</h2>`;
  headingClip.appendChild(h);
  heads.push(h);

  const d = document.createElement("div");
  d.className = "slide-desc";
  d.textContent = s.desc;
  descClip.appendChild(d);
  descs.push(d);

  const dot = document.createElement("div");
  dot.className = "dot" + (i === 0 ? " active" : "");
  dot.dataset.i = i;
  dotsEl.appendChild(dot);
  dotEls.push(dot);
});

imgs.forEach((img, i) => {
  gsap.set(img, i === 0
    ? { y: "0%", scale: 1, opacity: 1, zIndex: N - i }
    : { y: "105%", scale: 1, opacity: 1, zIndex: N - i }
  );
});
heads.forEach((h, i) => {
  gsap.set(h, i === 0 ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 });
});
descs.forEach((d, i) => {
  gsap.set(d, i === 0 ? { y: "0px", opacity: 1 } : { y: "60px", opacity: 0 });
});

function setUI(i) {
  if (counterEl) counterEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
  dotEls.forEach((d, j) => d.classList.toggle("active", j === i));
}

const ease1 = gsap.parseEase("power2.inOut");
const ease2 = gsap.parseEase("power3.out");

function applyProgress(totalProg) {
  totalProg = Math.max(0, Math.min(N - 1 - 0.0001, totalProg));
  const stepIdx  = Math.floor(totalProg);
  const stepProg = totalProg - stepIdx;
  const cur = stepIdx;
  const nxt = stepIdx + 1;

  for (let i = 0; i < N; i++) {
    if (i < cur) {
      gsap.set(imgs[i],  { y: "-105%", scale: 1 });
      gsap.set(heads[i], { y: "-110%", opacity: 0 });
      gsap.set(descs[i], { y: "0px",   opacity: 0 });
    } else if (i > nxt) {
      gsap.set(imgs[i],  { y: "105%",  scale: 1 });
      gsap.set(heads[i], { y: "110%",  opacity: 0 });
      gsap.set(descs[i], { y: "60px",  opacity: 0 });
    }
  }

  if (stepIdx === 0) {
    const e = ease1(stepProg);
    gsap.set(imgs[0],  { y: `${-e * 105}%`,      scale: 1 + e * 0.12 });
    gsap.set(heads[0], { y: `${-e * 110}%`,      opacity: 1 - e });
    gsap.set(descs[0], { y: `${-e * 30}px`,      opacity: Math.max(0, 1 - e * 1.8) });
    gsap.set(imgs[1],  { y: `${(1 - e) * 105}%`, scale: 1 });
    gsap.set(heads[1], { y: `${(1 - e) * 110}%`, opacity: e });
    gsap.set(descs[1], { y: `${(1 - e) * 60}px`, opacity: e });
    setUI(stepProg > 0.5 ? 1 : 0);
    return;
  }
const split = 0.68;
const pA = Math.min(stepProg / split, 1);
const pB = Math.max((stepProg - split) / (1 - split), 0);
  // const pA = Math.min(stepProg / 0.5, 1);
  // const pB = Math.max((stepProg - 0.5) / 0.5, 0);
  const eA = ease1(pA);
  const eB = ease2(pB);

  gsap.set(imgs[cur],  { y: `${-eA * 105}%`,        scale: 1 + (1 - eA) * 0.12 });
  gsap.set(heads[cur], { y: `${-eA * 110}%`,        opacity: 1 - eA });
  gsap.set(descs[cur], { y: `${-eA * 30}px`,        opacity: Math.max(0, 1 - pA * 1.8) });
  gsap.set(imgs[nxt],  { y: `${(1 - eA) * 105}%`,   scale: 1 + eB * 0.12 });
  gsap.set(heads[nxt], { y: `${(1 - eA) * 110}%`,   opacity: eA });
  gsap.set(descs[nxt], { y: `${(1 - eB) * 60}px`,   opacity: eB });

  setUI(stepProg > 0.5 ? nxt : cur);
}

// Pin: scrub nhỏ = trượt mượt, không giật
// Khung #pin-anchor được ghim → không nhảy
// onUpdate chạy liên tục = nội dung trượt theo đúng progress
const SCROLL_DISTANCE = 1400;
const TAIL = 700; // extra scroll after last slide so last desc fully renders before section ends
const totalScroll = (N - 1) * SCROLL_DISTANCE + TAIL;

// set scroll-space tall enough for the full scroll range at any viewport height
const scrollSpaceEl = document.getElementById('scroll-space');
if (scrollSpaceEl) scrollSpaceEl.style.minHeight = (totalScroll + window.innerHeight + 200) + 'px';

ScrollTrigger.create({
  id: "main",
  trigger: "#pin-anchor",
  start: "top top",
  end: () => `+=${totalScroll}`,
  pin: false,
  pinSpacing: false,
  scrub: 1.6,
  onUpdate(self) {
    // convert scroll progress to slide units; TAIL region clamps at N-1
    applyProgress(self.progress * totalScroll / SCROLL_DISTANCE);
  },
});

// Dot clicks — target exact scroll position of each slide start
dotEls.forEach((dot) => {
  dot.addEventListener("click", () => {
    const i  = parseInt(dot.dataset.i);
    const st = ScrollTrigger.getById("main");
    if (!st) return;
    const pos = st.start + i * SCROLL_DISTANCE;
    gsap.to(window, { scrollTo: pos, duration: 0.9, ease: "power2.inOut" });
  });
});