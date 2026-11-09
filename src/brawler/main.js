// Borough Brawl: boot, loop, screens. The fight itself lives in game.js (no DOM).
//
//   title → play (intro → playing → stageClear | gameOver) → retry | arcade
//   play ⇄ paused

import { createGame, update } from './game.js';
import { Renderer } from './render.js';
import { createInput } from './input.js';
import { createFx } from './fx.js';
import { createSounds } from './sounds.js';
import { loadBest, saveBest, loadMuted, saveMuted } from './storage.js';

const STEP = 1 / 60;

const input = createInput();
const renderer = new Renderer(document.getElementById('game'));
const audio = createSounds(loadMuted());
const fx = createFx();
const back = document.getElementById('back');

const app = {
  mode: 'title', // title | play
  paused: false,
  time: 0,
  game: createGame(),
  best: loadBest(),
};

function setMode(mode) {
  app.mode = mode;
  app.paused = false;
  showBackLink();
}

// The "← Arcade" link is for menus only; during a fight it would steal Space and Enter.
function showBackLink() {
  const menu = app.mode === 'title' || app.paused || ['gameOver', 'stageClear'].includes(app.game.state);
  back.hidden = !menu;
  if (!menu && document.activeElement === back) back.blur();
}

function newGame() {
  app.game = createGame();
  fx.clear();
  input.clear();
  setMode('play');
}

function toArcade() {
  saveBest(app.best);
  window.location.href = '../';
}

function recordScore() {
  if (app.game.score > app.best) {
    app.best = app.game.score;
    saveBest(app.best);
  }
}

function step(dt) {
  app.time += dt;
  const g = app.game;

  if (input.pressed('mute')) {
    audio.setMuted(!audio.muted);
    saveMuted(audio.muted);
  }

  if (app.mode === 'title') {
    if (input.pressed('start')) newGame();
  } else {
    const ended = g.state === 'gameOver' || g.state === 'stageClear';
    if (input.pressed('pause') && !ended) {
      app.paused = !app.paused;
      showBackLink();
    }
    if (app.paused) {
      if (input.pressed('quit')) toArcade();
    } else {
      const before = g.state;
      update(g, dt, input.controls());
      if (g.state !== before) {
        recordScore();
        showBackLink();
      }
      if (ended && g.stateTime > 1.5) {
        if (input.pressed('start')) newGame();
        else if (input.pressed('quit')) toArcade();
      }
    }
  }

  for (const ev of app.game.events) {
    audio.play(ev);
    fx.handle(ev, app.game);
  }
  app.game.events = [];
  if (!app.paused) fx.update(dt);
  input.flush();
}

// Losing focus pauses a fight, and the best score is saved when the page is hidden.
function pauseFight() {
  if (app.mode === 'play' && ['intro', 'playing'].includes(app.game.state) && !app.paused) {
    app.paused = true;
    showBackLink();
  }
}
window.addEventListener('blur', () => {
  input.clear();
  pauseFight();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    pauseFight();
    recordScore();
  }
});
window.addEventListener('pagehide', recordScore);

// Dev aids: ?play skips the title; ?debug exposes state as window.app / window.game.
const params = new URLSearchParams(location.search);
if (params.has('debug')) {
  window.app = app;
  Object.defineProperty(window, 'game', { get: () => app.game });
}
if (params.has('play')) newGame();
showBackLink();

let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  renderer.draw({ ...app, fx, muted: audio.muted });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
