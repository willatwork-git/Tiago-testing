// Title-screen menu: Play, difficulty and player colours. Real HTML form controls,
// so keyboard use (Tab, arrows between radios, Space, Enter) works natively.

import { GLITCH_DEFS } from './glitches.js';
import { PALETTE, drawChomper } from './render.js';
import { DIFFICULTY } from './config.js';
import { DIRS } from './maze.js';

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
  ...GLITCH_DEFS.map((d) => ({ name: d.name, hex: d.colour })),
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

const $ = (id) => document.getElementById(id);

function radio(name, value, label) {
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  if (label) input.setAttribute('aria-label', label);
  return input;
}

export function createMenu({ colours, difficulty, onColours, onDifficulty, onPlay }) {
  const root = $('menu');
  const play = $('play');
  const match = $('glow-match');
  const clash = $('clash');
  const high = $('menu-high');
  const dot = $('summary-dot');
  const preview = $('preview');

  // --- difficulty: segmented control built from native radios ---
  const diffRadios = Object.entries(DIFFICULTY).map(([key, d]) => {
    const label = document.createElement('label');
    const input = radio('difficulty', key);
    input.addEventListener('change', () => {
      if (!input.checked) return;
      difficulty = key;
      renderDifficulty();
      onDifficulty(key);
    });
    const text = document.createElement('span');
    text.textContent = d.label;
    label.append(input, text);
    $('difficulty').append(label);
    return input;
  });

  function renderDifficulty() {
    for (const r of diffRadios) r.checked = r.value === difficulty;
    $('difficulty-hint').textContent = DIFFICULTY[difficulty].hint;
  }

  // --- colours: a row of preset radios plus a custom colour input ---
  function swatchRow(box, slot) {
    const radios = PRESETS.map((p) => {
      const label = document.createElement('label');
      label.className = 'swatch';
      label.title = p.name;
      label.style.setProperty('--c', p.hex);
      const input = radio(slot, p.hex, p.name);
      input.addEventListener('change', () => input.checked && setColour(slot, p.hex, true));
      label.append(input);
      box.append(label);
      return input;
    });
    const label = document.createElement('label');
    label.className = 'swatch custom';
    label.title = 'Custom colour';
    const custom = document.createElement('input');
    custom.type = 'color';
    custom.setAttribute('aria-label', `Custom ${slot} colour`);
    custom.addEventListener('input', () => setColour(slot, custom.value, false)); // live while dragging
    custom.addEventListener('change', () => setColour(slot, custom.value, true));
    label.append(custom);
    box.append(label);
    return { radios, label, custom, box };
  }

  const rows = { body: swatchRow($('body-swatches'), 'body'), glow: swatchRow($('glow-swatches'), 'glow') };

  function setColour(slot, hex, save) {
    colours = { ...colours, [slot]: hex.toLowerCase() };
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
      const { radios, label, custom, box } = rows[slot];
      const current = colours[slot].toLowerCase();
      let preset = false;
      for (const r of radios) {
        r.checked = r.value === current;
        preset ||= r.checked;
      }
      label.classList.toggle('selected', !preset);
      if (!preset) label.style.setProperty('--c', current);
      custom.value = current;
    }
    // Matching glow: its controls are genuinely disabled, so they leave the tab order.
    match.checked = colours.matchGlow;
    rows.glow.box.classList.toggle('disabled', colours.matchGlow);
    for (const el of [...rows.glow.radios, rows.glow.custom]) el.disabled = colours.matchGlow;

    dot.style.setProperty('--c', colours.body);
    dot.style.setProperty('--g', colours.glow);
    drawPreview();

    const warning = colourWarning(colours.body);
    clash.hidden = !warning;
    clash.textContent = warning ?? '';
  }

  // Stationary preview, so body and glow can be compared without waiting for the parade.
  function drawPreview() {
    const size = 72;
    const dpr = window.devicePixelRatio || 1;
    preview.width = size * dpr;
    preview.height = size * dpr;
    const c = preview.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);
    drawChomper(c, size / 2, size / 2, size * 0.3, DIRS.right, 0.2, colours);
  }

  play.addEventListener('click', onPlay);

  renderDifficulty();
  renderColours();

  function setHigh(highScore) {
    high.textContent = `High score (${DIFFICULTY[difficulty].label}): ${highScore}`;
    high.hidden = !(highScore > 0);
  }

  return {
    setHigh,
    show(highScore) {
      setHigh(highScore);
      root.hidden = false;
      play.focus({ preventScroll: true }); // Enter or Space starts straight away
    },
    hide() {
      root.hidden = true;
      // Drop focus so in-game keys go to the game, not a hidden button.
      if (root.contains(document.activeElement)) document.activeElement.blur();
    },
  };
}
