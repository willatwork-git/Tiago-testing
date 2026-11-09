// Boot, game loop and state machine.
//
//   title → ready → playing          (ready waits for the first direction key)
//           ready ⇄ paused ⇄ playing
//                   playing → dying → ready | gameOver → ready (retry) | title
//                   playing → levelClear → ready (next level)

import { Maze } from './maze.js';
import { Player } from './player.js';
import { createGlitches } from './glitches.js';
import { Renderer } from './render.js';
import { createInput } from './input.js';
import { createGamepad } from '../shared/gamepad.js';
import { CONFIG, DIFFICULTY } from './config.js';
import { createMenu } from './ui.js';
import { createAudio } from './audio.js';
import { createFx } from './fx.js';
import {
  loadHighScore, saveHighScore, loadColours, saveColours, loadDifficulty, saveDifficulty,
  loadMuted, saveMuted,
} from './storage.js';

const STEP = 1 / 60; // fixed update rate, independent of display refresh

const pad = createGamepad();
const input = createInput(window, pad);
const renderer = new Renderer(document.getElementById('game'));
const audio = createAudio(loadMuted());

const difficulty = loadDifficulty(Object.keys(DIFFICULTY));

const game = {
  state: 'title',
  stateTime: 0,
  time: 0,
  maze: null,
  player: null,
  glitches: [],
  score: 0,
  lives: CONFIG.lives,
  level: 1,
  difficulty,
  diff: DIFFICULTY[difficulty],
  high: loadHighScore(difficulty),
  colours: loadColours(),
  mode: 'scatter',
  modeIndex: 0,
  modeTime: 0,
  frightTime: 0,
  frightTotal: 0,
  eatChain: 0,
  lifeTime: 0,
  pausedFrom: 'playing',
  popups: [], // { x, y, text, age } — floating score numbers, in tile units
  events: [], // things that happened this step, for sound and effects
  muted: audio.muted,
  toast: null, // { text, age } — brief centre-screen notice, e.g. "SOUND OFF"
  fx: createFx(),
};

/** Record something that happened, for audio and effects to react to. */
function emit(type, data = {}) {
  game.events.push({ type, ...data });
}

function setMuted(muted) {
  game.muted = muted;
  if (game.state !== 'title') game.toast = { text: muted ? 'SOUND OFF' : 'SOUND ON', age: 0 };
  audio.setMuted(muted);
  saveMuted(muted);
  menu.setMuted(muted);
}

const menu = createMenu({
  colours: game.colours,
  difficulty: game.difficulty,
  muted: audio.muted,
  onMuted: setMuted,
  onColours(colours, save) {
    game.colours = colours;
    if (save) saveColours(colours);
  },
  onDifficulty(key) {
    game.difficulty = key;
    game.diff = DIFFICULTY[key];
    game.high = loadHighScore(key);
    saveDifficulty(key);
    menu.setHigh(game.high); // not show(): that would pull focus off the radios
  },
  onPlay() {
    if (game.state === 'title') newGame();
  },
});

function setState(state) {
  game.state = state;
  game.stateTime = 0;
  if (state === 'title') menu.show(game.high);
  else menu.hide();
}

function quitToMenu() {
  saveHighScore(game.difficulty, game.high);
  setState('title');
}

function newGame() {
  game.score = 0;
  game.lives = game.diff.lives;
  game.level = 1;
  startLevel();
}

function startLevel() {
  game.maze = new Maze();
  renderer.setMaze(game.maze);
  resetActors();
  setState('ready');
}

function resetActors() {
  game.player = new Player(game.maze.spawn.player);
  game.glitches = createGlitches(game.maze, game.level, game.diff);
  game.mode = CONFIG.modes[0][0];
  game.modeIndex = 0;
  game.modeTime = 0;
  game.frightTime = 0;
  game.frightTotal = 0;
  game.eatChain = 0;
  game.lifeTime = 0;
  game.popups = [];
  game.fx.clear();
  input.clearDir();
}

function addScore(points) {
  game.score += points;
  if (game.score > game.high) game.high = game.score;
}

function onPlayerTile(x, y) {
  const eaten = game.maze.eat(x, y);
  if (eaten === '.') {
    addScore(CONFIG.score.pellet);
    emit('pellet', { x, y });
  }
  if (eaten === 'o') {
    addScore(CONFIG.score.power);
    emit('power', { x, y });
    game.frightTime = CONFIG.frightTime(game.level) * game.diff.frightScale;
    game.frightTotal = game.frightTime;
    game.eatChain = 0;
    for (const gl of game.glitches) gl.frighten(game.maze);
  }
  if (eaten && game.maze.pellets === 0) {
    saveHighScore(game.difficulty, game.high);
    emit('levelClear');
    setState('levelClear');
  }
}

function updateModes(dt) {
  if (game.frightTime > 0) {
    // The scatter/chase clock stops while the Glitches are frightened.
    game.frightTime -= dt;
    if (game.frightTime <= 0) {
      for (const gl of game.glitches) gl.frightened = false;
      emit('frightEnd');
    }
    return;
  }
  game.modeTime += dt;
  const [mode, length] = CONFIG.modes[game.modeIndex];
  const scaled = mode === 'scatter' ? length * game.diff.scatterScale : length;
  if (game.modeTime >= scaled) {
    game.modeIndex++;
    game.modeTime = 0;
    game.mode = CONFIG.modes[game.modeIndex][0];
    for (const gl of game.glitches) gl.turnAround(game.maze);
  }
}

function checkCollisions() {
  const p = game.player;
  const cols = game.maze.cols;
  const reach = CONFIG.collideDist ** 2;
  for (const gl of game.glitches) {
    if (gl.state !== 'active' && gl.state !== 'leaving') continue;
    let dx = gl.x - p.x;
    dx -= cols * Math.round(dx / cols); // the tunnel wraps: x = 20.9 and x = 0.1 are neighbours
    const dy = gl.y - p.y;
    if (dx * dx + dy * dy > reach) continue;
    if (gl.frightened) {
      const points = CONFIG.score.glitch * 2 ** game.eatChain;
      gl.frightened = false;
      gl.state = 'eaten';
      addScore(points);
      game.eatChain++;
      game.popups.push({ x: gl.x, y: gl.y, text: String(points), age: 0 });
      emit('eatGlitch', { x: gl.x, y: gl.y, colour: gl.def.colour });
    } else {
      game.lives--;
      emit('death', { x: p.x, y: p.y });
      setState('dying');
      return;
    }
  }
}

function updateDash(dt) {
  const p = game.player;
  const wasCooling = p.dashCooldown > 0;
  p.dashTime = Math.max(0, p.dashTime - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  if (wasCooling && p.dashCooldown === 0) emit('dashReady', { x: p.x, y: p.y });

  // Only while moving: a dash into a wall would just waste the cooldown.
  if (input.take('Space') && p.dashCooldown === 0 && p.moving) {
    p.dashTime = CONFIG.dash.time;
    p.dashCooldown = CONFIG.dash.cooldown;
    emit('dash', { x: p.x, y: p.y });
  }
}

function updatePlaying(dt) {
  game.lifeTime += dt;
  if (input.dir) game.player.want = input.dir;

  updateModes(dt);
  updateDash(dt);
  const dashing = game.player.dashTime > 0 ? CONFIG.dash.mult : 1;
  game.player.update(dt, game.maze, CONFIG.playerSpeed(game.level) * dashing, onPlayerTile);
  if (game.state !== 'playing') return; // level cleared
  for (const gl of game.glitches) gl.update(dt, game);
  checkCollisions();
}

/** On-screen prompts for keyboard or the controller in hand (✕ on PlayStation, A on Xbox). */
let lastPad = null;
function hints() {
  const now = pad.connected ? pad.kind : null;
  if (now !== lastPad) {
    lastPad = now;
    const el = document.getElementById('controls-hint');
    if (el) {
      el.textContent = now
        ? `Stick / d-pad move · ${pad.label('south')} dash · ${pad.label('start')} pause · ◀ ▶ difficulty · ${pad.label('south')} play`
        : 'Arrows / WASD move · Space dash · P pause · M sound';
    }
  }
  if (!now) return { move: 'ARROWS / WASD', start: 'ENTER', pause: 'P', quit: 'Q' };
  return { move: 'STICK / D-PAD', start: pad.label('south'), pause: pad.label('start'), quit: pad.label('select') };
}

function pause() {
  if (game.state !== 'playing' && game.state !== 'ready') return;
  game.pausedFrom = game.state;
  setState('paused');
}

// After READY, nothing moves until the player picks a direction they can actually go.
function updateReady() {
  const d = input.dir;
  if (game.stateTime < CONFIG.readyTime || !d) return;
  const p = game.player;
  if (!game.maze.passable(p.tx + d.x, p.ty + d.y)) return;
  p.want = d;
  p.dir = d;
  setState('playing');
}

function update(dt) {
  input.poll();
  game.hints = hints();
  game.time += dt;
  game.stateTime += dt;


  if (input.take('KeyP') || input.take('Escape')) {
    if (game.state === 'paused') setState(game.pausedFrom);
    else pause();
  }
  if (input.take('KeyQ') && (game.state === 'paused' || game.state === 'gameOver')) quitToMenu();
  if (input.take('KeyM')) setMuted(!audio.muted);

  switch (game.state) {
    case 'title': {
      // Controller: left/right switches difficulty on the menu.
      const d = input.padDir();
      if (d?.x) {
        const keys = Object.keys(DIFFICULTY);
        const next = keys[(keys.indexOf(game.difficulty) + d.x + keys.length) % keys.length];
        document.querySelector(`input[name=difficulty][value=${next}]`)?.click();
      }
      if (input.take('Enter')) newGame();
    }
      break;
    case 'ready':
      updateReady();
      break;
    case 'playing':
      updatePlaying(dt);
      break;
    case 'dying':
      if (game.stateTime >= CONFIG.deathTime) {
        if (game.lives > 0) {
          resetActors();
          setState('ready');
        } else {
          saveHighScore(game.difficulty, game.high);
          setState('gameOver');
        }
      }
      break;
    case 'levelClear':
      if (game.stateTime >= CONFIG.clearTime) {
        game.level++;
        startLevel();
      }
      break;
    case 'gameOver':
      if (game.stateTime > 1 && input.take('Enter')) newGame(); // retry, same settings
      break;
  }

  for (const ev of game.events) {
    audio.play(ev);
    game.fx.handle(ev, game);
  }
  game.events = [];
  if (game.state !== 'paused') {
    game.fx.update(dt, game);
    for (const pop of game.popups) pop.age += dt;
    if (game.toast && (game.toast.age += dt) > 1.2) game.toast = null;
    game.popups = game.popups.filter((pop) => pop.age < CONFIG.popupTime);
  }

  input.flush();
}

// Losing focus pauses the game; leaving the page also saves the best score,
// so a refresh mid-run can't lose a record the HUD already showed.
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  pause();
  saveHighScore(game.difficulty, game.high);
});
window.addEventListener('pagehide', () => saveHighScore(game.difficulty, game.high));

// Dev aids: ?play skips the title screen; ?debug exposes the game state as window.game.
const params = new URLSearchParams(location.search);
if (params.has('debug')) {
  window.game = game;
  window.pad = pad;
}
if (params.has('play')) newGame();
else setState('title');

let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  renderer.draw(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
