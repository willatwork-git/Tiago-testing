// Arcade home screen: animated previews, best scores, arrow-key navigation between cards.

import { drawChomper } from './chomp/render.js';
import { GLITCH_DEFS } from './chomp/glitches.js';
import { loadColours } from './chomp/storage.js';
import { drawRig, POSES, walkPose, getPose } from './brawler/rig.js';
import { HEROES, ENEMIES } from './brawler/fighters.js';
import { createStore } from './shared/store.js';
import { createGamepad } from './shared/gamepad.js';

const RIGHT = { x: 1, y: 0 };

// ---- best scores
const chomp = createStore('neonChomp.');
const brawler = createStore('boroughBrawl.');
const chompBest = Math.max(chomp.read('high.normal', 0) || 0, chomp.read('high.hard', 0) || 0);
const brawlerBest = brawler.read('best', 0) || 0;
document.getElementById('best-chomp').textContent = chompBest ? `Best ${chompBest}` : 'Not played yet';
document.getElementById('best-brawler').textContent = brawlerBest ? `Best ${brawlerBest}` : 'Not played yet';

// ---- keyboard: arrows move between cards; the first card starts focused
const cards = [...document.querySelectorAll('.card')];
cards[0].focus({ preventScroll: true });
window.addEventListener('keydown', (e) => {
  const i = cards.indexOf(document.activeElement);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    cards[(i + 1 + cards.length) % cards.length].focus();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    cards[(i - 1 + cards.length) % cards.length].focus();
    e.preventDefault();
  }
});

// ---- controller: d-pad / stick to choose, ✕ / A (or Options / Menu) to play
const pad = createGamepad();
const hint = document.querySelector('.arcade header .hint');
let padKind = null;
(function pollPad() {
  pad.poll();
  if (pad.kind !== padKind) {
    padKind = pad.kind;
    hint.textContent = padKind
      ? `Pick a game. D-pad or stick to choose, ${pad.label('south')} to play.`
      : 'Pick a game. Arrow keys or Tab to choose, Enter to play.';
  }
  const d = pad.dirPressed();
  const i = Math.max(0, cards.indexOf(document.activeElement));
  if (d && (d.x || d.y)) cards[(i + (d.x || d.y) + cards.length) % cards.length].focus();
  if (pad.anyPressed(['south', 'start'])) cards[i].click();
  requestAnimationFrame(pollPad);
})();
if (new URLSearchParams(location.search).has('debug')) window.pad = pad;

// ---- animated previews
function setup(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const c = canvas.getContext('2d');
  return { c, dpr };
}

const chompView = setup(document.getElementById('preview-chomp'), 280, 120);
const brawlView = setup(document.getElementById('preview-brawler'), 280, 120);
// The brawler preview is drawn at low resolution and scaled up, like the game itself.
const low = document.createElement('canvas');
low.width = 140;
low.height = 60;
const lc = low.getContext('2d');
const colours = loadColours();

function polygon(c, n, r, rot) {
  c.beginPath();
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2;
    k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
}

function drawChompPreview(t) {
  const { c, dpr } = chompView;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#05030f';
  c.fillRect(0, 0, 280, 120);
  c.fillStyle = '#f3e8ff';
  const lead = ((t * 70) % 420) - 60;
  for (let x = 10; x < 280; x += 18) if (x > lead) c.fillRect(x, 59, 3, 3);
  drawChomper(c, lead, 60, 14, RIGHT, 0.06 + 0.2 * Math.abs(Math.sin(t * 14)), colours);
  const shapes = { triangle: [3, -Math.PI / 2, 1.15], diamond: [4, -Math.PI / 2, 1.1], square: [4, Math.PI / 4, 1.2], hexagon: [6, 0, 1.05] };
  GLITCH_DEFS.forEach((d, k) => {
    const [n, rot, sc] = shapes[d.shape];
    c.save();
    c.translate(lead - 44 - k * 32, 60);
    c.shadowColor = d.colour;
    c.shadowBlur = 10;
    c.fillStyle = d.colour;
    polygon(c, n, 12 * sc, rot);
    c.fill();
    c.restore();
  });
}

function drawBrawlPreview(t) {
  // A slice of the street: dusk sky, brick wall, sidewalk, road. Shark slashes a Punk.
  const sky = lc.createLinearGradient(0, 0, 0, 30);
  sky.addColorStop(0, '#231a3a');
  sky.addColorStop(1, '#e0784a');
  lc.fillStyle = sky;
  lc.fillRect(0, 0, 140, 30);
  lc.fillStyle = '#7a3b2e';
  lc.fillRect(0, 8, 140, 24);
  lc.fillStyle = '#5a2a22';
  for (let y = 10; y < 32; y += 3) lc.fillRect(0, y, 140, 1);
  lc.fillStyle = '#ffcf70';
  for (let x = 6; x < 140; x += 14) lc.fillRect(x, 12, 5, 6);
  lc.fillStyle = '#8d8a87';
  lc.fillRect(0, 32, 140, 5);
  lc.fillStyle = '#3b3a40';
  lc.fillRect(0, 37, 140, 23);
  lc.fillStyle = '#d9b23a';
  lc.fillRect(0, 48, 140, 1);
  const phase = Math.floor(t / 0.4) % 4; // a little slash loop
  drawRig(lc, 44, 56, 1, phase === 1 ? getPose('shark', 'slash') : phase === 2 ? getPose('shark', 'backslash') : getPose('shark', 'idle'), HEROES.shark.style, 0.6, { t });
  drawRig(lc, 22, 50, 1, POSES.idle, HEROES.nova.style, 0.5, { t, bob: Math.sin(t * 4) * 0.4 });
  const hit = phase === 1 || phase === 2;
  drawRig(lc, 76, 56, -1, hit ? POSES.hurt : POSES.idle, ENEMIES.punk.style, 0.5, { t, flash: hit && t % 0.4 < 0.08 });
  drawRig(lc, 110, 53, -1, POSES.idle, ENEMIES.bruiser.style, 0.62, { t, bob: Math.sin(t * 3) * 0.4 });

  const { c, dpr } = brawlView;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = false;
  c.drawImage(low, 0, 0, 280, 120);
}

// Respect "reduce motion": draw one still frame instead of animating.
const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function frame(now) {
  const t = now / 1000;
  drawChompPreview(t);
  drawBrawlPreview(t);
  if (!still) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
