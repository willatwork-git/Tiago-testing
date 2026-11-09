// Borough Brawl's sound set, on the shared synth.

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
      // Running attacks and dives get a rushing whoosh; throws sound on release (below).
      if (ev.kind === 'run') s.noise({ dur: 0.25, vol: 0.45, f0: 300, f1: 3200 });
      if (ev.kind === 'air') s.tone({ type: 'square', f0: 900, f1: 200, dur: 0.22, vol: 0.2 });
    },
    throw(ev) {
      if (ev.kind === 'blade') {
        s.noise({ dur: 0.28, vol: 0.3, f0: 2600, f1: 900, q: 3 });
        s.tone({ type: 'triangle', f0: 1200, f1: 500, dur: 0.25, vol: 0.2 });
      } else {
        s.arpeggio([1568, 2093], 0.04, { type: 'square', vol: 0.15 });
      }
    },
    quake() {
      s.tone({ type: 'sine', f0: 120, f1: 40, dur: 0.4, vol: 0.6 });
      s.noise({ dur: 0.35, vol: 0.4, f0: 600, f1: 60 });
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
