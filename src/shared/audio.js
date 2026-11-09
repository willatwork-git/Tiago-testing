// Shared sound synth (Web Audio). No audio files. Each game supplies its own sound list.
//
//   const audio = createAudio((s) => ({ hit() { s.noise({ dur: 0.1 }); } }), startMuted);
//   audio.play({ type: 'hit' });
//
// Browsers only allow audio after a user gesture, so the context starts on the first key or click.

const VOLUME = 0.22;

export function createAudio(defineSounds, startMuted = false) {
  let ctx = null;
  let master = null;
  let muted = startMuted;

  function ensure() {
    if (muted) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  window.addEventListener('keydown', ensure);
  window.addEventListener('pointerdown', ensure);

  const synth = {
    get now() { return ctx.currentTime; },

    /** One oscillator note with a pitch slide and a fast decay. */
    tone({ type = 'square', f0, f1 = f0, dur, vol = 0.5, delay = 0 }) {
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
    },

    /** Filtered noise sweep: whooshes, crunches, impacts. */
    noise({ dur, vol = 0.4, f0 = 400, f1 = 2000, q = 1.2, delay = 0 }) {
      const t = ctx.currentTime + delay;
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = q;
      filter.frequency.setValueAtTime(f0, t);
      filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter).connect(gain).connect(master);
      src.start(t);
    },

    /** Notes in quick succession. */
    arpeggio(notes, step, opts = {}) {
      notes.forEach((f, i) => synth.tone({ f0: f, dur: step * 1.6, delay: i * step, ...opts }));
    },
  };

  const sounds = defineSounds(synth);

  return {
    play(event) {
      const sound = sounds[event.type];
      if (sound && ensure()) sound(event);
    },
    get muted() { return muted; },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : VOLUME;
    },
  };
}
