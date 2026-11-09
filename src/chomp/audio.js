// Neon Chomp's sound set, on the shared synth. Each sound marks an event:
// pickup, Overcharge starting/ending, a catch, a death.

import { createAudio as createSynthAudio } from '../shared/audio.js';

export function createAudio(startMuted = false) {
  let lastPellet = 0;
  let pelletHigh = false;

  return createSynthAudio((s) => ({
    pellet() {
      // Alternating two-note chomp, throttled so a fast run doesn't turn into a buzz.
      if (s.now - lastPellet < 0.07) return;
      lastPellet = s.now;
      pelletHigh = !pelletHigh;
      s.tone({ type: 'square', f0: pelletHigh ? 620 : 520, dur: 0.05, vol: 0.12 });
    },
    power() { s.tone({ type: 'sawtooth', f0: 180, f1: 900, dur: 0.35, vol: 0.35 }); },
    frightEnd() { s.tone({ type: 'triangle', f0: 700, f1: 180, dur: 0.35, vol: 0.4 }); },
    eatGlitch() { s.arpeggio([523, 659, 784, 1047], 0.05, { type: 'square', vol: 0.25 }); },
    death() {
      s.tone({ type: 'sawtooth', f0: 600, f1: 50, dur: 1.0, vol: 0.4 });
      s.noise({ dur: 0.5, vol: 0.3, f0: 1200, f1: 100 });
    },
    levelClear() { s.arpeggio([523, 659, 784, 1047, 1319], 0.09, { type: 'triangle', vol: 0.4 }); },
    dash() { s.noise({ dur: 0.22, vol: 0.5, f0: 300, f1: 3000 }); },
    dashReady() { s.tone({ type: 'sine', f0: 1400, dur: 0.06, vol: 0.18 }); },
  }), startMuted);
}
