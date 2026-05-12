// REVEAL CONTAINER — cập nhật 2 mask cùng lúc, RAF-throttled
// pointer-events: none khi ẩn → tự cách ly, không xung đột cursor các section khác
const revealContainer = document.getElementById("handler");
if (revealContainer) {
  const RADIUS = 150;
  const streaky = revealContainer.querySelector(".streaky-blur");
  const reveal  = revealContainer.querySelector(".reveal");
  let mx = -9999, my = -9999, rafQueued = false;

  function applyMask() {
    const x = mx + "px", y = my + "px", r = RADIUS + "px";
    const mReveal = `radial-gradient(${r} circle at ${x} ${y}, black 0%, black 55%, transparent 85%)`;
    const mStreak = `radial-gradient(${r} circle at ${x} ${y}, transparent 0%, transparent 45%, black 85%)`;
    reveal.style.webkitMaskImage  = mReveal;
    reveal.style.maskImage        = mReveal;
    streaky.style.webkitMaskImage = mStreak;
    streaky.style.maskImage       = mStreak;
    rafQueued = false;
  }

  revealContainer.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!rafQueued) { rafQueued = true; requestAnimationFrame(applyMask); }
  });
}
