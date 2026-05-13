// Chỉ register nếu chưa register (tránh conflict với nav.js)
if (typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener('DOMContentLoaded', function() {

      const stage = document.getElementById("stage");
      const headingWrap = document.getElementById("headingWrap");
      const heading = document.getElementById("heading");
      const navLeft = document.getElementById("labelLeft");
      const navRight = document.getElementById("labelRight");

      /* Pre-set text panels off to the right */
      gsap.set(["#text1", "#text2", "#text3", "#text4", "#text5"], {
        x: 40,
        opacity: 0,
      });

      /* Colour snap */
      const SNAP_PROGRESS = 0.148;
      let snapped = false;
      function applyColour(isBlack) {
        if (isBlack === snapped) return;
        snapped = isBlack;
        stage.style.backgroundColor = isBlack ? "#000000" : "#fff";
        heading.style.color = isBlack ? "#ffffff" : "#000000";
        navLeft.style.color = isBlack ? "#fff" : "#0f0f0e";
        navRight.style.color = isBlack ? "#fff" : "#0f0f0e";
      }

      /* Sau jump: tính lại màu từ DOM ngay lập tức */
      window.addEventListener('__jumpdone', function() {
        const el = document.getElementById('scrollSection');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        snapped = !snapped; // force re-apply
        applyColour(p >= SNAP_PROGRESS);
      });

      /*
        Layout:
        • frame: left=27vw, top=2.5vh, width=47vw, height=95vh
        • transformOrigin: top left → shrinks from TL corner
        • TL_SCALE: 47vw × 0.19 ≈ 9vw  ✓   95vh × 0.17 ≈ 16vh ✓

        Slides 2-5 start at BR thumb position, offset from frame's left=27vw top=2.5vh:
          BR thumb: bottom:16px right:16px
          x-offset: (100vw - 16px - 9vw) - 27vw ≈ 64vw
          y-offset: (100vh - 16px - 16vh) - 2.5vh ≈ 81vh
      */
      const BR_X = "64vw";
      const BR_Y = "81vh";
      const TL_SCALE = 0.19;

      gsap.set(["#main2", "#main3", "#main4", "#main5"], {
        x: BR_X,
        y: BR_Y,
        scale: TL_SCALE,
        opacity: 0,
        transformOrigin: "top left",
      });
      gsap.set("#main1", { transformOrigin: "top left" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scrollSection",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.8,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onUpdate(self) {
            if (window.__isJumping) return;
            applyColour(self.progress >= SNAP_PROGRESS);
          },
        },
      });

      /* ─── PHASE A: Heading zoom ─── */
      tl.to(heading, { scale: 1, duration: 3, ease: "power2.out" }, 0);
      tl.to(
        headingWrap,
        { y: "-46.5vh", duration: 3, ease: "power2.inOut" },
        0,
      );

      /* ─── PHASE B: Image 1 rises ─── */
      tl.to(
        "#main1",
        { y: 0, scale: 1, opacity: 1, duration: 2.3, ease: "power3.out" },
        3.0,
      );
      tl.to(
        headingWrap,
        { y: "-115vh", duration: 0.9, ease: "power3.in" },
        3.0,
      );

      /* ─── PHASE C: Text 1 in ─── */
      tl.to(
        "#text1",
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
        5.5,
      );

      /* ─── PHASE D: Ken-burns 1 ─── */
      tl.to(
        "#inner1",
        { scale: 1.06, duration: 1.2, ease: "power1.inOut" },
        7.2,
      );

      /*
        When a frame shrinks to TL thumb position (top:16px left:16px):
        Frame CSS starts at left:27vw top:2.5vh.
        transformOrigin "top left" → TL corner stays at left:27vw top:2.5vh during scale.
        We need TL corner at left:16px top:16px.
        x = 16px - 27vw  → use CSS calc via GSAP
        y = 16px - 2.5vh → use CSS calc via GSAP
        Expressed in vw/vh approximation on 1440px screen:
          27vw = 388px → x = 16 - 388 = -372px ≈ -25.8vw → "-26vw"
          2.5vh on 800px screen = 20px → y = 16 - 20 = -4px ≈ "-0.5vh"
        Also boost z-index so shrunken frame stays above new slide until faded.
      */
      const TL_X = "-10vw";
      const TL_Y = "-0.5vh";

      /* Helper: boost z-index of outgoing frame so it stays on top as thumbnail */
      function shrinkToTL(id, startTime) {
        tl.set(id, { zIndex: 25 }, startTime);
        tl.to(
          id,
          {
            x: TL_X,
            y: TL_Y,
            scale: TL_SCALE,
            borderRadius: "16px",
            duration: 0.6,
            ease: "power3.inOut",
          },
          startTime,
        );
      }
      function fadeOut(id, startTime) {
        tl.to(id, { opacity: 0, duration: 2, ease: "power2.out" }, startTime);
        tl.set(id, { zIndex: 5 }, startTime + 2.01);
      }

      /* ══ SLIDE 2 ══ shrink 8.5→9.1, new enters 8.9 (overlap last 0.2 when already tiny) */
      tl.to(
        "#thumb2br",
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        7.9,
      );
      tl.to(
        "#text1",
        { opacity: 0, x: 40, duration: 0.35, ease: "power2.in" },
        8.2,
      );
      shrinkToTL("#main1", 8.5);
      tl.to("#thumb2br", { opacity: 0, duration: 0.2 }, 8.85);
      tl.to(
        "#main2",
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" },
        8.9,
      );
      tl.to(
        "#text2",
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
        9.8,
      );
      fadeOut("#main1", 10.5);
      tl.to(
        "#inner2",
        { scale: 1.06, duration: 1.2, ease: "power1.inOut" },
        10.2,
      );

      /* ══ SLIDE 3 ══ */
      tl.to("#thumb3br", { opacity: 1, duration: 0.4 }, 11.0);
      tl.to(
        "#text2",
        { opacity: 0, x: 40, duration: 0.35, ease: "power2.in" },
        11.3,
      );
      shrinkToTL("#main2", 11.6);
      tl.to("#thumb3br", { opacity: 0, duration: 0.2 }, 11.95);
      tl.to(
        "#main3",
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" },
        12.0,
      );
      tl.to(
        "#text3",
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
        12.9,
      );
      fadeOut("#main2", 13.6);
      tl.to(
        "#inner3",
        { scale: 1.06, duration: 1.2, ease: "power1.inOut" },
        13.3,
      );

      /* ══ SLIDE 4 ══ */
      tl.to("#thumb4br", { opacity: 1, duration: 0.4 }, 14.1);
      tl.to(
        "#text3",
        { opacity: 0, x: 40, duration: 0.35, ease: "power2.in" },
        14.4,
      );
      shrinkToTL("#main3", 14.7);
      tl.to("#thumb4br", { opacity: 0, duration: 0.2 }, 15.05);
      tl.to(
        "#main4",
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" },
        15.1,
      );
      tl.to(
        "#text4",
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
        16.0,
      );
      fadeOut("#main3", 16.7);
      tl.to(
        "#inner4",
        { scale: 1.06, duration: 1.2, ease: "power1.inOut" },
        16.4,
      );

      /* ══ SLIDE 5 ══ */
      tl.to("#thumb5br", { opacity: 1, duration: 0.4 }, 17.2);
      tl.to(
        "#text4",
        { opacity: 0, x: 40, duration: 0.35, ease: "power2.in" },
        17.5,
      );
      shrinkToTL("#main4", 17.8);
      tl.to("#thumb5br", { opacity: 0, duration: 0.2 }, 18.15);
      tl.to(
        "#main5",
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "expo.out" },
        18.2,
      );
      tl.to(
        "#text5",
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
        19.1,
      );
      fadeOut("#main4", 19.8);
      tl.to(
        "#inner5",
        { scale: 1.06, duration: 1.0, ease: "power1.inOut" },
        19.5,
      );

}); // end DOMContentLoaded