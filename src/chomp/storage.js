// Neon Chomp's saved settings and scores (on the shared localStorage wrapper).

import { createStore } from '../shared/store.js';

const { read, write } = createStore('neonChomp.');

export const DEFAULT_COLOURS = { body: '#7cff4f', glow: '#7cff4f', matchGlow: true };
const HEX = /^#[0-9a-f]{6}$/i;

// One high score per difficulty. Scores saved before difficulties existed count as Normal.
export function loadHighScore(difficulty) {
  const legacy = difficulty === 'normal' ? read('high', 0) : 0;
  const v = read(`high.${difficulty}`, legacy);
  return Number.isFinite(v) ? v : 0;
}

export function saveHighScore(difficulty, score) {
  write(`high.${difficulty}`, score);
}

export function loadDifficulty(valid) {
  const v = read('difficulty', 'normal');
  return valid.includes(v) ? v : 'normal';
}

export function saveDifficulty(difficulty) {
  write('difficulty', difficulty);
}

export function loadMuted() {
  return read('muted', false) === true;
}

export function saveMuted(muted) {
  write('muted', muted);
}

export function loadColours() {
  const v = read('colours', null) ?? {};
  return {
    body: HEX.test(v.body) ? v.body : DEFAULT_COLOURS.body,
    glow: HEX.test(v.glow) ? v.glow : DEFAULT_COLOURS.glow,
    matchGlow: typeof v.matchGlow === 'boolean' ? v.matchGlow : DEFAULT_COLOURS.matchGlow,
  };
}

export function saveColours(colours) {
  write('colours', colours);
}
