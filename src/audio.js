// Synthesised sound effects (Web Audio). No audio files.
//
// Each sound explains an event: pickup, Overcharge starting/ending, a catch, a death.
// Browsers only allow audio after a user gesture, so the context starts on the first key or click.

export function createAudio(startMuted = false) {
  let ctx = null;
  let master = null;
  let muted = startMuted;
  let lastPellet = 0;
  let pelletHigh = false;

  function ensure() {
    if (muted) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  window.addEventListener('keydown', ensure);
  window.addEventListener('pointerdown', ensure);

  /** One oscillator note with a pitch slide and a fast decay. */
  function tone({ type = 'square', f0, f1 = f0, dur, vol = 0.5, delay = 0 }) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** Filtered noise sweep — whooshes and crunches. */
  function noise({ dur, vol = 0.4, f0 = 400, f1 = 2000, delay = 0 }) {
    const t = ctx.currentTime + delay;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t);
  }

  const arpeggio = (notes, step, opts) => notes.forEach((f, i) => tone({ f0: f, dur: step * 1.6, delay: i * step, ...opts }));

  const SOUNDS = {
    pellet() {
      // Alternating two-note chomp, throttled so a fast run doesn't turn into a buzz.
      const now = ctx.currentTime;
      if (now - lastPellet < 0.07) return;
      lastPellet = now;
      pelletHigh = !pelletHigh;
      tone({ type: 'square', f0: pelletHigh ? 620 : 520, dur: 0.05, vol: 0.12 });
    },
    power() { tone({ type: 'sawtooth', f0: 180, f1: 900, dur: 0.35, vol: 0.35 }); },
    frightEnd() { tone({ type: 'triangle', f0: 700, f1: 180, dur: 0.35, vol: 0.4 }); },
    eatGlitch() { arpeggio([523, 659, 784, 1047], 0.05, { type: 'square', vol: 0.25 }); },
    death() {
      tone({ type: 'sawtooth', f0: 600, f1: 50, dur: 1.0, vol: 0.4 });
      noise({ dur: 0.5, vol: 0.3, f0: 1200, f1: 100 });
    },
    levelClear() { arpeggio([523, 659, 784, 1047, 1319], 0.09, { type: 'triangle', vol: 0.4 }); },
    dash() { noise({ dur: 0.22, vol: 0.5, f0: 300, f1: 3000 }); },
    dashReady() { tone({ type: 'sine', f0: 1400, dur: 0.06, vol: 0.18 }); },
  };

  return {
    play(event) {
      const sound = SOUNDS[event.type];
      if (sound && ensure()) sound();
    },
    get muted() { return muted; },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.22;
    },
  };
}
