// Title-screen menu: difficulty and player colours. DOM, not canvas,
// so the native colour picker and keyboard focus come for free.

import { GLITCH_DEFS } from './glitches.js';
import { PALETTE } from './render.js';
import { DIFFICULTY } from './config.js';

// Chosen to stay clear of every Glitch, frightened blue and the walls (RGB distance ≥ 77).
export const PRESETS = [
  { name: 'Lime', hex: '#7cff4f' },
  { name: 'Chartreuse', hex: '#c8ff3f' },
  { name: 'Jade', hex: '#00c96b' },
  { name: 'Mint', hex: '#4fffb0' },
  { name: 'Lemon', hex: '#fff04f' },
  { name: 'Lavender', hex: '#d2b4ff' },
  { name: 'Peach', hex: '#ffd0a8' },
  { name: 'Silver', hex: '#b8c4d6' },
];

const LOOKALIKES = [
  ...GLITCH_DEFS.map((d) => ({ name: `${d.name}`, hex: d.colour })),
  { name: 'frightened Glitches', hex: PALETTE.fright },
  { name: 'the walls', hex: PALETTE.wall },
  { name: 'flashing Glitches', hex: PALETTE.frightFlash },
];
const CLASH_DIST = 70;

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const distance = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));

/** A warning sentence if this colour will be hard to see or to tell apart, else null. */
export function colourWarning(hex) {
  if (Math.max(...rgb(hex)) < 90) return 'That colour is very dark — it will be hard to see on the black background.';
  const near = LOOKALIKES.find((l) => distance(hex, l.hex) < CLASH_DIST);
  return near ? `That colour is close to ${near.name} — you may lose track of yourself.` : null;
}

export function createMenu({ colours, difficulty, onColours, onDifficulty, onPlay }) {
  const root = document.getElementById('menu');
  const diffBox = document.getElementById('difficulty');
  const diffHint = document.getElementById('difficulty-hint');
  const bodyBox = document.getElementById('body-swatches');
  const glowBox = document.getElementById('glow-swatches');
  const match = document.getElementById('glow-match');
  const clash = document.getElementById('clash');
  const high = document.getElementById('menu-high');

  // --- difficulty ---
  const diffButtons = Object.entries(DIFFICULTY).map(([key, d]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.textContent = d.label;
    b.addEventListener('click', () => {
      difficulty = key;
      renderDifficulty();
      onDifficulty(key);
    });
    diffBox.append(b);
    return [key, b];
  });

  function renderDifficulty() {
    for (const [key, b] of diffButtons) b.setAttribute('aria-checked', String(key === difficulty));
    diffHint.textContent = DIFFICULTY[difficulty].hint;
  }

  // --- colours ---
  function swatchRow(box, slot) {
    const buttons = PRESETS.map((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', p.name);
      b.title = p.name;
      b.style.background = p.hex;
      b.style.color = p.hex;
      b.addEventListener('click', () => setColour(slot, p.hex, true));
      box.append(b);
      return [p.hex, b];
    });
    const label = document.createElement('label');
    label.className = 'swatch custom';
    label.title = 'Custom colour';
    const input = document.createElement('input');
    input.type = 'color';
    input.setAttribute('aria-label', `Custom ${slot} colour`);
    input.addEventListener('input', () => setColour(slot, input.value, false)); // live while dragging
    input.addEventListener('change', () => setColour(slot, input.value, true));
    label.append(input);
    box.append(label);
    return { buttons, label, input };
  }

  const rows = { body: swatchRow(bodyBox, 'body'), glow: swatchRow(glowBox, 'glow') };

  function setColour(slot, hex, save) {
    colours = { ...colours, [slot]: hex };
    if (colours.matchGlow) colours.glow = colours.body;
    renderColours();
    onColours(colours, save);
  }

  match.addEventListener('change', () => {
    colours = { ...colours, matchGlow: match.checked };
    if (colours.matchGlow) colours.glow = colours.body;
    renderColours();
    onColours(colours, true);
  });

  function renderColours() {
    for (const slot of ['body', 'glow']) {
      const { buttons, label, input } = rows[slot];
      const current = colours[slot].toLowerCase();
      let preset = false;
      for (const [hex, b] of buttons) {
        const on = hex === current;
        preset ||= on;
        b.setAttribute('aria-checked', String(on));
      }
      label.setAttribute('aria-checked', String(!preset));
      if (!preset) label.style.color = current;
      input.value = current;
    }
    match.checked = colours.matchGlow;
    glowBox.classList.toggle('disabled', colours.matchGlow);

    const warning = colourWarning(colours.body);
    clash.hidden = !warning;
    clash.textContent = warning ?? '';
  }

  document.getElementById('play').addEventListener('click', onPlay);

  renderDifficulty();
  renderColours();

  return {
    show(highScore) {
      high.textContent = `High score (${DIFFICULTY[difficulty].label}): ${highScore}`;
      high.hidden = !(highScore > 0);
      root.hidden = false;
    },
    hide() {
      root.hidden = true;
      // Drop focus so Space/Enter in-game don't re-click a menu button.
      if (root.contains(document.activeElement)) document.activeElement.blur();
    },
  };
}
