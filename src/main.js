// Boot, game loop and state machine.
//
//   title → ready → playing ⇄ paused
//                     ├→ dying → ready | gameOver → title
//                     └→ levelClear → ready (next level)

import { Maze } from './maze.js';
import { Player } from './player.js';
import { createGlitches } from './glitches.js';
import { Renderer } from './render.js';
import { createInput } from './input.js';
import { CONFIG } from './config.js';
import { loadHighScore, saveHighScore, loadColours } from './storage.js';

const STEP = 1 / 60; // fixed update rate, independent of display refresh

const input = createInput();
const renderer = new Renderer(document.getElementById('game'));

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
  high: loadHighScore(),
  colours: loadColours(),
  mode: 'scatter',
  modeIndex: 0,
  modeTime: 0,
  frightTime: 0,
  eatChain: 0,
  lifeTime: 0,
};

function setState(state) {
  game.state = state;
  game.stateTime = 0;
}

function newGame() {
  game.score = 0;
  game.lives = CONFIG.lives;
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
  game.glitches = createGlitches(game.maze, game.level);
  game.mode = CONFIG.modes[0][0];
  game.modeIndex = 0;
  game.modeTime = 0;
  game.frightTime = 0;
  game.eatChain = 0;
  game.lifeTime = 0;
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
    game.frightTime = CONFIG.frightTime(game.level);
    game.eatChain = 0;
    for (const gl of game.glitches) gl.frighten(game.maze);
  }
  if (eaten && game.maze.pellets === 0) {
    saveHighScore(game.high);
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
  if (game.modeTime >= CONFIG.modes[game.modeIndex][1]) {
    game.modeIndex++;
    game.modeTime = 0;
    game.mode = CONFIG.modes[game.modeIndex][0];
    for (const gl of game.glitches) gl.turnAround(game.maze);
  }
}

function checkCollisions() {
  const p = game.player;
  const reach = CONFIG.collideDist ** 2;
  for (const gl of game.glitches) {
    if (gl.state !== 'active' && gl.state !== 'leaving') continue;
    const dx = gl.x - p.x;
    const dy = gl.y - p.y;
    if (dx * dx + dy * dy > reach) continue;
    if (gl.frightened) {
      gl.frightened = false;
      gl.state = 'eaten';
      addScore(CONFIG.score.glitch * 2 ** game.eatChain);
      game.eatChain++;
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

function update(dt) {
  game.time += dt;
  game.stateTime += dt;

  if (input.take('KeyP') || input.take('Escape')) {
    if (game.state === 'playing') setState('paused');
    else if (game.state === 'paused') setState('playing');
  }

  switch (game.state) {
    case 'title':
      if (input.take('Enter') || input.take('Space')) newGame();
      break;
    case 'ready':
      if (game.stateTime >= CONFIG.readyTime) setState('playing');
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
          saveHighScore(game.high);
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
      if (game.stateTime > 1 && input.take('Enter')) setState('title');
      break;
  }

  input.flush();
}

// Losing focus mid-game pauses it.
window.addEventListener('blur', () => {
  if (game.state === 'playing') setState('paused');
});

// Dev aid: ?play skips the title screen.
if (new URLSearchParams(location.search).has('play')) newGame();

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
