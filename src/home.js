// Arcade home screen: animated previews, best scores, arrow-key navigation between cards.

import { drawChomper } from './chomp/render.js';
import { GLITCH_DEFS } from './chomp/glitches.js';
import { loadColours } from './chomp/storage.js';
import { drawRig, POSES, walkPose } from './brawler/rig.js';
import { HEROES, ENEMIES } from './brawler/fighters.js';
import { createStore } from './shared/store.js';

const RIGHT = { x: 1, y: 0 };

// ---- best scores
const chomp = createStore('neonChomp.');
const brawler = createStore('nebulaKnockout.');
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
  lc.fillStyle = '#1b0938';
  lc.fillRect(0, 0, 140, 60);
  lc.fillStyle = '#ff5fd2';
  lc.fillRect(0, 34, 140, 1);
  lc.fillStyle = '#12062a';
  lc.fillRect(0, 35, 140, 25);
  const phase = Math.floor(t / 0.35) % 4; // a little jab loop
  drawRig(lc, 46, 54, 1, phase === 1 ? POSES.jab : phase === 2 ? POSES.cross : walkPose(t * 3), HEROES.nova.style, 0.55, { t });
  drawRig(lc, 28, 50, 1, POSES.idle, HEROES.titan.style, 0.62, { t, bob: Math.sin(t * 4) * 0.4 });
  const hit = phase === 1 || phase === 2;
  drawRig(lc, 70, 54, -1, hit ? POSES.hurt : POSES.idle, ENEMIES.voidling.style, 0.5, { t, flash: hit && t % 0.35 < 0.08 });
  drawRig(lc, 104, 52, -1, POSES.idle, ENEMIES.brute.style, 0.7, { t, bob: Math.sin(t * 3) * 0.4 });

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
