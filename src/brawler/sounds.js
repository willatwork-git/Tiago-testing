// Nebula Knockout's sound set, on the shared synth.

import { createAudio } from '../shared/audio.js';

export function createSounds(startMuted = false) {
  let lastWindup = 0;
  return createAudio((s) => ({
    swing(ev) {
      if (ev.side !== 'hero') return;
      s.noise({ dur: ev.heavy ? 0.12 : 0.07, vol: 0.12, f0: 900, f1: 2600 });
    },
    hit(ev) {
      s.noise({ dur: ev.heavy ? 0.18 : 0.1, vol: ev.heavy ? 0.6 : 0.45, f0: 1800, f1: 160, q: 0.8 });
      s.tone({ type: 'square', f0: ev.heavy ? 130 : 180, f1: 50, dur: ev.heavy ? 0.18 : 0.09, vol: 0.3 });
      if (ev.toHero) s.tone({ type: 'sawtooth', f0: 320, f1: 140, dur: 0.14, vol: 0.2 });
    },
    windup() {
      // A soft tick, so you can hear an attack coming. Throttled for crowds.
      if (s.now - lastWindup < 0.15) return;
      lastWindup = s.now;
      s.tone({ type: 'sine', f0: 1100, dur: 0.05, vol: 0.12 });
    },
    jump() { s.tone({ type: 'sine', f0: 280, f1: 620, dur: 0.12, vol: 0.18 }); },
    thud() { s.noise({ dur: 0.12, vol: 0.25, f0: 300, f1: 80 }); },
    tag() { s.arpeggio([440, 660, 880], 0.045, { type: 'triangle', vol: 0.35 }); },
    special(ev) {
      if (ev.hero === 'nova') s.noise({ dur: 0.25, vol: 0.45, f0: 300, f1: 3200 });
    },
    beam() {
      s.tone({ type: 'sawtooth', f0: 180, f1: 1400, dur: 0.3, vol: 0.3 });
      s.noise({ dur: 0.3, vol: 0.2, f0: 2000, f1: 600 });
    },
    ko(ev) {
      if (ev.side === 'enemy') s.tone({ type: 'triangle', f0: 520, f1: 110, dur: 0.35, vol: 0.3 });
      else s.tone({ type: 'sawtooth', f0: 400, f1: 70, dur: 0.6, vol: 0.35 });
    },
    go() { s.arpeggio([660, 880, 660, 880], 0.08, { type: 'square', vol: 0.18 }); },
    stageClear() { s.arpeggio([523, 659, 784, 1047, 1319, 1568], 0.1, { type: 'triangle', vol: 0.4 }); },
    gameOver() { s.tone({ type: 'sawtooth', f0: 420, f1: 55, dur: 1.2, vol: 0.4 }); },
  }), startMuted);
}
