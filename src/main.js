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
import { CONFIG, DIFFICULTY } from './config.js';
import { createMenu } from './ui.js';
import {
  loadHighScore, saveHighScore, loadColours, saveColours, loadDifficulty, saveDifficulty,
} from './storage.js';

const STEP = 1 / 60; // fixed update rate, independent of display refresh

const input = createInput();
const renderer = new Renderer(document.getElementById('game'));

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
};

const menu = createMenu({
  colours: game.colours,
  difficulty: game.difficulty,
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
  input.clearDir();
}

function addScore(points) {
  game.score += points;
  if (game.score > game.high) game.high = game.score;
}

function onPlayerTile(x, y) {
  const eaten = game.maze.eat(x, y);
  if (eaten === '.') addScore(CONFIG.score.pellet);
  if (eaten === 'o') {
    addScore(CONFIG.score.power);
    game.frightTime = CONFIG.frightTime(game.level) * game.diff.frightScale;
    game.frightTotal = game.frightTime;
    game.eatChain = 0;
    for (const gl of game.glitches) gl.frighten(game.maze);
  }
  if (eaten && game.maze.pellets === 0) {
    saveHighScore(game.difficulty, game.high);
    setState('levelClear');
  }
}

function updateModes(dt) {
  if (game.frightTime > 0) {
    // The scatter/chase clock stops while the Glitches are frightened.
    game.frightTime -= dt;
    if (game.frightTime <= 0) for (const gl of game.glitches) gl.frightened = false;
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
    } else {
      game.lives--;
      setState('dying');
      return;
    }
  }
}

function updatePlaying(dt) {
  game.lifeTime += dt;
  if (input.dir) game.player.want = input.dir;

  updateModes(dt);
  game.player.update(dt, game.maze, CONFIG.playerSpeed(game.level), onPlayerTile);
  if (game.state !== 'playing') return; // level cleared
  for (const gl of game.glitches) gl.update(dt, game);
  checkCollisions();
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
  game.time += dt;
  game.stateTime += dt;

  for (const pop of game.popups) pop.age += dt;
  game.popups = game.popups.filter((pop) => pop.age < CONFIG.popupTime);

  if (input.take('KeyP') || input.take('Escape')) {
    if (game.state === 'paused') setState(game.pausedFrom);
    else pause();
  }
  if (input.take('KeyQ') && (game.state === 'paused' || game.state === 'gameOver')) quitToMenu();

  switch (game.state) {
    case 'title':
      if (input.take('Enter')) newGame();
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
if (params.has('debug')) window.game = game;
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
