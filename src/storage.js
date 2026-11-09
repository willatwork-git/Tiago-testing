// localStorage, wrapped so a private window or blocked storage never breaks the game.

const PREFIX = 'neonChomp.';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable — the game still works, it just won't remember.
  }
}

export const DEFAULT_COLOURS = { body: '#7cff4f', glow: '#7cff4f' };
const HEX = /^#[0-9a-f]{6}$/i;

export function loadHighScore() {
  const v = read('high', 0);
  return Number.isFinite(v) ? v : 0;
}

export function saveHighScore(score) {
  write('high', score);
}

export function loadColours() {
  const v = read('colours', null) ?? {};
  return {
    body: HEX.test(v.body) ? v.body : DEFAULT_COLOURS.body,
    glow: HEX.test(v.glow) ? v.glow : DEFAULT_COLOURS.glow,
  };
}

export function saveColours(colours) {
  write('colours', colours);
}
