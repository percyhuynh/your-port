(function () {
  'use strict';

  const CHARS = '!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$%&';

  const SCRAMBLE_FRAMES = 5;  /* phase 1: pure chaos duration (logical frames) */
  const TOTAL_FRAMES    = 20; /* phase 1 + phase 2 combined */

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function rndChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  class ScrambleShuffle {
    constructor(el) {
      this.el = el;
      this.frameRequest = null;
      this._raf = 0;
      this._tick = this._tick.bind(this);
    }

    run(text) {
      cancelAnimationFrame(this.frameRequest);
      this._raf = 0;
      this.frame = 0;

      const len = text.length;
      const lockOrder = shuffle(Array.from({ length: len }, (_, i) => i));

      this.slots = Array.from({ length: len }, (_, i) => ({
        to: text[i] || '',
        lockAt: lockOrder.indexOf(i),
        char: rndChar(),
      }));
      this.total = len;

      return new Promise(res => {
        this.resolve = res;
        this._tick();
      });
    }

    _tick() {
      /* ~30 fps throttle — skip 1 of every 2 RAF calls */
      this._raf++;
      if (this._raf % 2 !== 0) {
        this.frameRequest = requestAnimationFrame(this._tick);
        return;
      }

      let out = '';
      let complete = 0;

      if (this.frame < SCRAMBLE_FRAMES) {
        /* ── Phase 1: Text Scramble — all chars chaos, high swap rate ── */
        for (const slot of this.slots) {
          slot.char = rndChar();
          out += `<span class="sk-scramble-char">${slot.char}</span>`;
        }
      } else {
        /* ── Phase 2: Random Shuffle — chars lock in random order ── */
        const progress  = (this.frame - SCRAMBLE_FRAMES) / (TOTAL_FRAMES - SCRAMBLE_FRAMES);
        const threshold = Math.floor(progress * this.total);

        for (const slot of this.slots) {
          if (slot.lockAt <= threshold) {
            complete++;
            out += slot.to;
          } else {
            if (Math.random() < 0.38) slot.char = rndChar();
            out += `<span class="sk-scramble-char">${slot.char}</span>`;
          }
        }
      }

      this.el.innerHTML = out;

      if (complete >= this.total) {
        this.resolve?.();
      } else {
        this.frame++;
        this.frameRequest = requestAnimationFrame(this._tick);
      }
    }

    cancel(original) {
      cancelAnimationFrame(this.frameRequest);
      this.el.innerHTML = original;
    }
  }

  function init() {
    document.querySelectorAll('#sk-root .sk-pill').forEach(pill => {
      const original = pill.dataset.val;
      const fx = new ScrambleShuffle(pill);
      pill.addEventListener('mouseenter', () => fx.run(original));
      pill.addEventListener('mouseleave', () => fx.cancel(original));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
