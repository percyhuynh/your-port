
(function () {
  gsap.registerPlugin(ScrollTrigger);

  const section  = document.getElementById("hsSection");
  const track    = document.getElementById("hsTrack");
  const panels   = gsap.utils.toArray(".hs-panel");
  const progress = document.getElementById("hsProgress");
  const dotsWrap = document.getElementById("hsDots");
  const N = panels.length;

  section.style.setProperty("--hs-np", N);

  panels.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "hs-dot" + (i === 0 ? " active" : "");
    dotsWrap.appendChild(d);
  });
  const dots = dotsWrap.querySelectorAll(".hs-dot");

  const st = gsap.to(track, {
  x: () => -(track.scrollWidth - section.offsetWidth),
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: () => `+=${track.scrollWidth - section.offsetWidth}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter:     () => { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeave:     () => { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onEnterBack: () => { dotsWrap.style.opacity = "1"; progress.style.opacity = "1"; },
      onLeaveBack: () => { dotsWrap.style.opacity = "0"; progress.style.opacity = "0"; },
      onUpdate(self) {
        progress.style.width = self.progress * 100 + "%";
        const idx = Math.round(self.progress * (N - 1));
        dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      },
    },
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const tr = st.scrollTrigger;
      const target = tr.start + (tr.end - tr.start) * (i / (N - 1));
      gsap.to(window, { scrollTo: target, duration: .8, ease: "power2.inOut" });
    });
  });

  ScrollTrigger.addEventListener("refreshInit", () => {
    section.style.setProperty("--hs-np", N);
  });
})();


// PHASE 2

 (function () {
        /* ── Scroll reveal ── */
        var cards = document.querySelectorAll(".pf-card");

        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add("pf-visible");
                  io.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.12 },
          );

          cards.forEach(function (card) {
            io.observe(card);
          });
        } else {
          cards.forEach(function (card) {
            card.classList.add("pf-visible");
          });
        }

        /* ── Lightbox ── */
        var lb = document.getElementById("pfLightbox");
        var inner = document.getElementById("pfLbInner");
        var img = document.getElementById("pfLbImg");

        cards.forEach(function (card) {
          card.addEventListener("click", function () {
            img.src = card.querySelector("img").src;
            lb.classList.add("pf-open");
            document.body.style.overflow = "hidden";
          });
        });

        function closeLB() {
          lb.classList.remove("pf-open");
          document.body.style.overflow = "";
          img.src = "";
        }

        /* click ra ngoài ảnh (vùng backdrop) thì đóng */
        lb.addEventListener("click", function (e) {
          if (!inner.contains(e.target)) closeLB();
        });

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") closeLB();
        });
      })();