// The Glitches: four enemies, one simple targeting rule each.
//
// States:  house → leaving → active → (eaten → leaving → active)
// `frightened` is a flag on top of the state, set during Overcharge.

import { Mover, isOpposite, flip } from './entity.js';
import { DIRS, DIR_LIST } from './maze.js';
import { CONFIG } from './config.js';

export const GLITCH_DEFS = [
  { name: 'Hunter', colour: '#ff3b5c', shape: 'triangle', behaviour: 'hunter', corner: (m) => ({ x: m.cols - 2, y: -3 }) },
  { name: 'Sneak', colour: '#ff5fd2', shape: 'diamond', behaviour: 'sneak', corner: () => ({ x: 1, y: -3 }) },
  { name: 'Drift', colour: '#3ff0ff', shape: 'square', behaviour: 'drift', corner: (m) => ({ x: m.cols - 1, y: m.rows + 1 }) },
  { name: 'Skittish', colour: '#ffa53f', shape: 'hexagon', behaviour: 'skittish', corner: (m) => ({ x: 0, y: m.rows + 1 }) },
];

export class Glitch extends Mover {
  constructor(def, index, start, dir, state, releaseAt) {
    super(start.x, start.y, dir);
    this.def = def;
    this.index = index;
    this.state = state;
    this.releaseAt = releaseAt;
    this.frightened = false;
  }

  frighten(maze) {
    if (this.state === 'eaten') return;
    this.frightened = true;
    this.turnAround(maze);
  }

  // Active Glitches reverse when the mode changes — the player's cue that something shifted.
  turnAround(maze) {
    if (this.state === 'active') this.reverse(maze);
  }

  update(dt, game) {
    const m = game.maze;
    if (this.state === 'house') {
      if (game.lifeTime < this.releaseAt) return;
      this.state = 'leaving';
    }

    let speed = CONFIG.glitchSpeed(game.level);
    if (this.state === 'eaten') speed = CONFIG.eyesSpeed;
    else if (this.state === 'leaving') speed *= CONFIG.leavingMult;
    else if (this.frightened) speed *= CONFIG.frightMult;
    if (this.state !== 'eaten' && m.isTunnel(this.tx, this.ty)) speed *= CONFIG.tunnelMult;

    this.advance(speed * dt, m, () => this.choose(game), () => this.arrive(m));
  }

  arrive(m) {
    const { centre, door } = m.spawn;
    if (this.state === 'eaten' && this.tx === centre.x && this.ty === centre.y) {
      this.state = 'leaving';
    } else if (this.state === 'leaving' && this.tx === door.x && this.ty === door.y) {
      this.state = 'active';
    }
  }

  choose(game) {
    const m = game.maze;

    // Getting in or out of the house: follow the precomputed shortest path.
    if (this.state === 'eaten' || this.state === 'leaving') {
      const field = this.state === 'eaten' ? m.homeField : m.doorField;
      let best = null;
      let bestDist = Infinity;
      for (const d of DIR_LIST) {
        const nx = m.wrapX(this.tx + d.x);
        const ny = this.ty + d.y;
        if (!m.passable(nx, ny, true)) continue;
        if (field[ny][nx] < bestDist) {
          bestDist = field[ny][nx];
          best = d;
        }
      }
      return best;
    }

    // Out in the maze: never reverse by choice.
    const options = DIR_LIST.filter((d) => !isOpposite(d, this.dir) && m.passable(this.tx + d.x, this.ty + d.y));
    if (options.length === 0) {
      const back = flip(this.dir);
      return m.passable(this.tx + back.x, this.ty + back.y) ? back : null;
    }

    const wander = this.frightened || (this.def.behaviour === 'drift' && game.mode === 'chase');
    if (wander) return options[Math.floor(Math.random() * options.length)];

    const t = this.target(game);
    let best = options[0];
    let bestDist = Infinity;
    for (const d of options) {
      const dx = this.tx + d.x - t.x;
      const dy = this.ty + d.y - t.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  target(game) {
    const p = game.player;
    const m = game.maze;
    if (game.mode === 'scatter') return this.def.corner(m);
    switch (this.def.behaviour) {
      case 'sneak':
        return { x: p.tx + p.dir.x * 4, y: p.ty + p.dir.y * 4 };
      case 'skittish': {
        const dx = p.tx - this.tx;
        const dy = p.ty - this.ty;
        return dx * dx + dy * dy > 36 ? { x: p.tx, y: p.ty } : this.def.corner(m);
      }
      default:
        return { x: p.tx, y: p.ty };
    }
  }
}

export function createGlitches(maze, level) {
  const { door, house } = maze.spawn;
  const release = CONFIG.release.map((t) => Math.max(0, t - (level - 1) * CONFIG.releaseShrink));
  return [
    new Glitch(GLITCH_DEFS[0], 0, door, DIRS.left, 'active', 0),
    new Glitch(GLITCH_DEFS[1], 1, house[1], DIRS.up, 'house', release[1]),
    new Glitch(GLITCH_DEFS[2], 2, house[0], DIRS.up, 'house', release[2]),
    new Glitch(GLITCH_DEFS[3], 3, house[2], DIRS.up, 'house', release[3]),
  ];
}
