// All drawing. Positions come in as tile units; the renderer owns the tile size.

import { CONFIG } from './config.js';
import { GLITCH_DEFS } from './glitches.js';
import { DIRS } from './maze.js';

const TAU = Math.PI * 2;

export const PALETTE = {
  bg: '#05030f',
  wall: '#8a5cff',
  wallCore: '#e4d9ff',
  gate: '#ff9de6',
  pellet: '#f3e8ff',
  power: '#ffffff',
  text: '#f3e8ff',
  dim: '#8f84b8',
  ready: '#ffe14f',
  danger: '#ff3b5c',
  fright: '#2d7dff',
  frightFlash: '#ffffff',
  pupil: '#1a1033',
};

const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = null;
    this.walls = null;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setMaze(maze) {
    this.maze = maze;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    Object.assign(this, { dpr, w, h });
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const cols = this.maze?.cols ?? 21;
    const rows = this.maze?.rows ?? 21;
    this.ts = Math.max(8, Math.floor(Math.min(w / (cols + 1), h / (rows + 3))));
    this.bw = cols * this.ts;
    this.bh = rows * this.ts;
    this.ox = Math.round((w - this.bw) / 2);
    this.oy = Math.round((h - this.bh) / 2 + this.ts * 0.75);
    this.walls = this.maze ? this.buildWalls(this.maze) : null;
  }

  // Walls are static, and glow is expensive, so draw them once to an offscreen canvas.
  // Each wall tile strokes an inset line along every side that faces open floor,
  // which turns solid blocks into neon tubes.
  buildWalls(m) {
    const { ts, dpr } = this;
    const pad = ts;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((this.bw + pad * 2) * dpr);
    cv.height = Math.ceil((this.bh + pad * 2) * dpr);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(pad, pad);

    const wall = (x, y) => m.rawTile(x, y) === '#';
    const i = ts * 0.35;
    g.beginPath();
    for (let y = 0; y < m.rows; y++) {
      for (let x = 0; x < m.cols; x++) {
        if (!wall(x, y)) continue;
        const x0 = x * ts, y0 = y * ts, x1 = x0 + ts, y1 = y0 + ts;
        const up = !wall(x, y - 1), dn = !wall(x, y + 1), lf = !wall(x - 1, y), rt = !wall(x + 1, y);
        const line = (pts) => { g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); };

        // Straight edges facing open floor.
        if (up) line([[lf ? x0 + i : x0, y0 + i], [rt ? x1 - i : x1, y0 + i]]);
        if (dn) line([[lf ? x0 + i : x0, y1 - i], [rt ? x1 - i : x1, y1 - i]]);
        if (lf) line([[x0 + i, up ? y0 + i : y0], [x0 + i, dn ? y1 - i : y1]]);
        if (rt) line([[x1 - i, up ? y0 + i : y0], [x1 - i, dn ? y1 - i : y1]]);

        // Inside corners: walls on two sides, open on the diagonal between them.
        if (!up && !lf && !wall(x - 1, y - 1)) line([[x0 + i, y0], [x0 + i, y0 + i], [x0, y0 + i]]);
        if (!up && !rt && !wall(x + 1, y - 1)) line([[x1 - i, y0], [x1 - i, y0 + i], [x1, y0 + i]]);
        if (!dn && !lf && !wall(x - 1, y + 1)) line([[x0 + i, y1], [x0 + i, y1 - i], [x0, y1 - i]]);
        if (!dn && !rt && !wall(x + 1, y + 1)) line([[x1 - i, y1], [x1 - i, y1 - i], [x1, y1 - i]]);
      }
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = PALETTE.wall;
    g.shadowColor = PALETTE.wall;
    g.lineWidth = Math.max(2, ts * 0.14);
    g.shadowBlur = ts * 0.6;
    g.stroke();
    g.strokeStyle = PALETTE.wallCore; // hot white core down the middle of each tube
    g.lineWidth = Math.max(1, ts * 0.05);
    g.shadowBlur = ts * 0.2;
    g.stroke();
    return cv;
  }

  draw(game) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = PALETTE.bg;
    c.fillRect(0, 0, this.w, this.h);

    if (game.state === 'title' || !game.maze) {
      this.drawTitle(game);
      return;
    }

    const { ts, bw, bh } = this;
    this.drawHud(game);

    c.save();
    const shake = game.fx.shake * ts;
    c.translate(this.ox + (Math.random() - 0.5) * 2 * shake, this.oy + (Math.random() - 0.5) * 2 * shake);

    // Level clear: the maze flashes.
    const flashing = game.state === 'levelClear' && Math.floor(game.stateTime * 6) % 2 === 1;
    c.globalAlpha = flashing ? 0.25 : 1;
    c.drawImage(this.walls, -ts, -ts, bw + ts * 2, bh + ts * 2);
    c.globalAlpha = 1;
    this.drawGates(game.maze);
    this.drawPellets(game);

    // Clip so actors in the tunnel slide off the edge instead of over the HUD.
    c.beginPath();
    c.rect(0, 0, bw, bh);
    c.clip();

    const over = game.state === 'gameOver';
    const showGlitches = !over && game.state !== 'levelClear' && !(game.state === 'dying' && game.stateTime > 0.5);
    if (showGlitches) {
      for (const gl of game.glitches) this.drawGlitch(gl, game);
    }
    this.drawParticles(game, 'ghost');
    if (!over) this.drawPlayer(game);
    this.drawParticles(game, 'spark');
    this.drawPopups(game);
    c.restore();

    this.drawOverlay(game);
  }

  drawGates(m) {
    const c = this.ctx, ts = this.ts;
    c.save();
    c.strokeStyle = PALETTE.gate;
    c.shadowColor = PALETTE.gate;
    c.shadowBlur = ts * 0.4;
    c.lineWidth = Math.max(2, ts * 0.12);
    c.beginPath();
    for (const { x, y } of m.gates) {
      c.moveTo(x * ts, (y + 0.5) * ts);
      c.lineTo((x + 1) * ts, (y + 0.5) * ts);
    }
    c.stroke();
    c.restore();
  }

  drawPellets(game) {
    const c = this.ctx, ts = this.ts, m = game.maze;
    const r = Math.max(1.5, ts * 0.09);
    const power = [];
    c.fillStyle = PALETTE.pellet;
    c.beginPath();
    for (let y = 0; y < m.rows; y++) {
      for (let x = 0; x < m.cols; x++) {
        const t = m.tiles[y][x];
        if (t === 'o') power.push([x, y]);
        if (t !== '.') continue;
        const cx = (x + 0.5) * ts, cy = (y + 0.5) * ts;
        c.moveTo(cx + r, cy);
        c.arc(cx, cy, r, 0, TAU);
      }
    }
    c.fill();

    if (!power.length) return;
    const pulse = 0.8 + 0.2 * Math.sin(game.time * 6);
    c.save();
    c.fillStyle = PALETTE.power;
    c.shadowColor = PALETTE.power;
    c.shadowBlur = ts * 0.7;
    c.beginPath();
    for (const [x, y] of power) {
      const cx = (x + 0.5) * ts, cy = (y + 0.5) * ts;
      c.moveTo(cx + ts * 0.26 * pulse, cy);
      c.arc(cx, cy, ts * 0.26 * pulse, 0, TAU);
    }
    c.fill();
    c.restore();
  }

  drawPlayer(game) {
    const p = game.player, ts = this.ts;
    let mouth = 0.06 + 0.2 * Math.abs(Math.sin(p.mouth)); // as a fraction of π
    let alpha = 1;
    if (game.state === 'dying') {
      const t = Math.min(1, game.stateTime / 1.1);
      mouth = 0.1 + 0.9 * t;
      alpha = 1 - Math.max(0, (game.stateTime - 1.1) / 0.4);
    }
    // Overcharged: a crisp white outline, blinking once the warning window starts.
    const outline = game.frightTime > 0 && !(overchargeWarning(game) && Math.floor(game.time * 8) % 2 === 0);
    for (const x of wrapCopies(p.x, game.maze.cols)) {
      this.chomper((x + 0.5) * ts, (p.y + 0.5) * ts, ts * 0.42, p.dir, mouth, game.colours, alpha, outline);
      if (p.dashCooldown > 0 && game.state !== 'dying') this.dashRing((x + 0.5) * ts, (p.y + 0.5) * ts, p, game.colours.glow);
    }
  }

  /** Dash cooldown: a thin ring that fills clockwise as dash recharges. */
  dashRing(px, py, p, colour) {
    const c = this.ctx, r = this.ts * 0.62;
    const filled = 1 - p.dashCooldown / CONFIG.dash.cooldown;
    c.save();
    c.lineWidth = Math.max(1.5, this.ts * 0.07);
    c.strokeStyle = 'rgba(243, 232, 255, 0.15)';
    c.beginPath();
    c.arc(px, py, r, 0, TAU);
    c.stroke();
    c.strokeStyle = colour;
    c.globalAlpha = 0.75;
    c.beginPath();
    c.arc(px, py, r, -Math.PI / 2, -Math.PI / 2 + filled * TAU);
    c.stroke();
    c.restore();
  }

  drawParticles(game, kind) {
    const c = this.ctx, ts = this.ts;
    c.save();
    for (const q of game.fx.particles) {
      if (q.kind !== kind) continue;
      const t = q.life / q.max;
      c.globalAlpha = kind === 'ghost' ? t * 0.35 : t;
      c.fillStyle = q.colour;
      c.beginPath();
      c.arc((q.x + 0.5) * ts, (q.y + 0.5) * ts, q.size * ts * (kind === 'ghost' ? 1 : 0.5 + t * 0.5), 0, TAU);
      c.fill();
    }
    c.restore();
  }

  /** The player character, at pixel coordinates. */
  chomper(px, py, r, dir, mouth, colours, alpha = 1, outline = false) {
    drawChomper(this.ctx, px, py, r, dir, mouth, colours, alpha, outline);
  }

  drawGlitch(gl, game) {
    const ts = this.ts;
    const bob = gl.state === 'house' ? Math.sin(game.time * 6 + gl.index) * 0.12 : 0;
    let colour = gl.def.colour;
    if (gl.frightened) {
      const warn = overchargeWarning(game) && Math.floor(game.time * 8) % 2 === 0;
      colour = warn ? PALETTE.frightFlash : PALETTE.fright;
    }
    for (const x of wrapCopies(gl.x, game.maze.cols)) {
      this.glitch((x + 0.5) * ts, (gl.y + 0.5 + bob) * ts, ts * 0.44, gl.def.shape, colour, gl.dir,
        { frightened: gl.frightened, eyesOnly: gl.state === 'eaten', time: game.time });
    }
  }

  drawPopups(game) {
    const ts = this.ts;
    for (const pop of game.popups) {
      const t = pop.age / CONFIG.popupTime;
      const c = this.ctx;
      c.save();
      c.globalAlpha = 1 - t * t;
      this.text(pop.text, (pop.x + 0.5) * ts, (pop.y + 0.2 - t * 0.9) * ts,
        { size: ts * 0.6, colour: '#bfe3ff', glow: ts * 0.4 });
      c.restore();
    }
  }

  /** A Glitch, at pixel coordinates. */
  glitch(px, py, r, shape, colour, dir, { frightened = false, eyesOnly = false, time = 0 } = {}) {
    const c = this.ctx;
    c.save();
    c.translate(px, py);

    if (!eyesOnly) {
      c.save();
      if (frightened) c.rotate(Math.sin(time * 10) * 0.12); // nervous wobble
      c.shadowColor = colour;
      c.shadowBlur = r * 1.2;
      c.fillStyle = colour;
      c.beginPath();
      polygon(c, shape, r);
      c.fill();
      c.restore();
    }

    const eyeY = shape === 'triangle' ? r * 0.15 : -r * 0.1;
    if (frightened && !eyesOnly) {
      // Scared face: two dots and a zig-zag mouth.
      c.fillStyle = PALETTE.pupil;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.arc(s * r * 0.28, eyeY, r * 0.1, 0, TAU);
        c.fill();
      }
      c.strokeStyle = PALETTE.pupil;
      c.lineWidth = Math.max(1, r * 0.09);
      c.beginPath();
      for (let k = 0; k <= 4; k++) {
        const x = -r * 0.36 + k * r * 0.18;
        const y = eyeY + r * 0.38 + (k % 2 ? -r * 0.08 : r * 0.08);
        k ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    } else {
      for (const s of [-1, 1]) {
        const ex = s * r * 0.3;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(ex, eyeY, r * 0.24, 0, TAU);
        c.fill();
        c.fillStyle = eyesOnly ? '#2d7dff' : PALETTE.pupil;
        c.beginPath();
        c.arc(ex + dir.x * r * 0.1, eyeY + dir.y * r * 0.1, r * 0.11, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  }

  text(str, x, y, { size = this.ts * 0.8, colour = PALETTE.text, align = 'center', glow = 0, weight = 700 } = {}) {
    const c = this.ctx;
    c.save();
    c.font = `${weight} ${Math.round(size)}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillStyle = colour;
    if (glow) {
      c.shadowColor = colour;
      c.shadowBlur = glow;
    }
    c.fillText(str, x, y);
    c.restore();
  }

  drawHud(game) {
    const { ts, ox, oy, bw } = this;
    const y = oy - ts * 1.1;
    const size = ts * 0.75;
    this.text(`SCORE ${game.score}`, ox + ts * 0.3, y, { size, align: 'left' });
    const hard = game.difficulty === 'hard';
    this.text(`${hard ? 'HARD  ' : ''}HIGH ${game.high}`, ox + bw / 2, y, { size, colour: hard ? PALETTE.danger : PALETTE.dim });
    this.text(`LV ${game.level}`, ox + bw - ts * 0.3, y, { size, align: 'right' });

    // Spare lives as small chompers, just left of the level number.
    const spare = game.state === 'dying' ? game.lives : Math.max(0, game.lives - 1);
    for (let k = 0; k < spare; k++) {
      this.chomper(ox + bw - ts * (3.6 + k * 0.9), y, ts * 0.3, DIRS.right, 0.2, game.colours);
    }

    // Overcharge bar: shrinks as it runs out, flashes in the warning window.
    if (game.frightTime > 0 && game.state !== 'gameOver') {
      const c = this.ctx;
      const by = oy - ts * 0.3;
      const warn = overchargeWarning(game) && Math.floor(game.time * 8) % 2 === 0;
      const colour = warn ? PALETTE.frightFlash : PALETTE.fright;
      this.text('OVERCHARGE', ox + ts * 0.3, by, { size: ts * 0.42, colour, align: 'left' });
      const x0 = ox + ts * 4.3;
      const full = bw - ts * 4.6;
      const frac = Math.max(0, game.frightTime / game.frightTotal);
      c.save();
      c.fillStyle = 'rgba(45, 125, 255, 0.18)';
      c.fillRect(x0, by - ts * 0.08, full, ts * 0.16);
      c.fillStyle = colour;
      c.shadowColor = colour;
      c.shadowBlur = ts * 0.4;
      c.fillRect(x0, by - ts * 0.08, full * frac, ts * 0.16);
      c.restore();
    }
  }

  drawOverlay(game) {
    const { ts, ox, oy, bw, bh } = this;
    const cx = ox + bw / 2;
    const midY = oy + (game.maze.spawn.door.y + 4.5) * ts; // the corridor below the house

    if (game.toast) this.pill(game.toast.text, cx, oy + ts * 1.5, ts * 0.5);

    if (game.state === 'ready') {
      this.text('READY!', cx, midY, { size: ts * 0.9, colour: PALETTE.ready, glow: ts * 0.5 });
      if (game.stateTime >= CONFIG.readyTime) {
        // Prompt just under the player, on a backing so it reads over the walls.
        const py = oy + (game.player.y + 1.6) * ts;
        this.pill('ARROWS / WASD TO MOVE', cx, py, ts * 0.5);
      }
    } else if (game.state === 'levelClear') {
      this.text(`LEVEL ${game.level} CLEARED`, cx, midY, { size: ts * 0.8, colour: PALETTE.ready, glow: ts * 0.5 });
    } else if (game.state === 'gameOver') {
      this.text('GAME OVER', cx, midY, { size: ts * 0.9, colour: PALETTE.danger, glow: ts * 0.5 });
      if (game.stateTime > 1) this.pill('ENTER  RETRY     Q  MENU', cx, midY + ts * 1.4, ts * 0.5);
    } else if (game.state === 'paused') {
      const c = this.ctx;
      c.fillStyle = 'rgba(5, 3, 15, 0.7)';
      c.fillRect(0, 0, this.w, this.h);
      this.text('PAUSED', cx, oy + bh / 2, { size: ts * 1.2, glow: ts * 0.6 });
      this.text('P  RESUME     Q  QUIT TO MENU', cx, oy + bh / 2 + ts * 1.3, { size: ts * 0.55, colour: PALETTE.dim });
      this.text(`M  SOUND ${game.muted ? 'OFF' : 'ON'}`, cx, oy + bh / 2 + ts * 2.1, { size: ts * 0.55, colour: PALETTE.dim });
    }
  }

  /** Text on a dark rounded backing. */
  pill(str, x, y, size) {
    const c = this.ctx;
    c.save();
    c.font = `700 ${Math.round(size)}px ${FONT}`;
    const w = c.measureText(str).width + size * 1.6;
    const h = size * 1.9;
    c.fillStyle = 'rgba(5, 3, 15, 0.88)';
    c.strokeStyle = PALETTE.dim;
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    c.fill();
    c.stroke();
    c.restore();
    this.text(str, x, y, { size, colour: PALETTE.text });
  }

  drawTitle(game) {
    const { w, h } = this;
    const unit = Math.min(w / 16, h / 14);
    const cx = w / 2;
    const t = game.time;

    this.text('NEON CHOMP', cx, h * 0.11, { size: unit * 1.15, colour: '#ff5fd2', glow: unit * 0.6, weight: 800 });
    if (h >= 520) this.text('a maze-chase of light', cx, h * 0.11 + unit * 0.9, { size: unit * 0.35, colour: PALETTE.dim, weight: 500 });

    // Parade: the chomper (in the player's chosen colours — the live preview) runs
    // right with the Glitches in pursuit. Starts on-screen, then loops.
    const span = w + unit * 8;
    const lead = ((t * unit * 3 + w * 0.6) % span) - unit * 2;
    const y = h * (h < 520 ? 0.21 : 0.27); // short screens: matches the menu's media query
    this.chomper(lead, y, unit * 0.45, DIRS.right, 0.06 + 0.2 * Math.abs(Math.sin(t * 14)), game.colours);
    GLITCH_DEFS.forEach((def, k) => {
      this.glitch(lead - unit * (1.6 + k * 1.1), y, unit * 0.4, def.shape, def.colour, DIRS.right);
    });
  }
}

/** In the warning window at the end of Overcharge? */
function overchargeWarning(game) {
  return game.frightTime > 0 && game.frightTime < game.frightTotal * CONFIG.frightWarn;
}

/** An actor crossing the wrap seam is drawn at both edges. */
function wrapCopies(x, cols) {
  if (x < 0) return [x, x + cols];
  if (x > cols - 1) return [x, x - cols];
  return [x];
}

/** The player character, at pixel coordinates. Exported for the menu preview. */
export function drawChomper(c, px, py, r, dir, mouth, colours, alpha = 1, outline = false) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  c.translate(px, py);
  c.rotate(Math.atan2(dir.y, dir.x));
  if (dir.x < 0) c.scale(1, -1); // keep the eye on top when facing left
  c.shadowColor = colours.glow;
  c.shadowBlur = r * 1.4;
  c.fillStyle = colours.body;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, r, mouth * Math.PI, TAU - mouth * Math.PI);
  c.closePath();
  c.fill();
  if (outline) {
    c.shadowColor = '#ffffff';
    c.shadowBlur = r * 0.6;
    c.strokeStyle = '#ffffff';
    c.lineWidth = Math.max(1.5, r * 0.14);
    c.lineJoin = 'round';
    c.stroke();
  }
  if (mouth < 0.6) {
    c.shadowBlur = 0;
    c.fillStyle = PALETTE.pupil;
    c.beginPath();
    c.arc(r * 0.12, -r * 0.5, r * 0.13, 0, TAU);
    c.fill();
  }
  c.restore();
}

function polygon(c, shape, r) {
  const shapes = {
    triangle: { n: 3, rot: -Math.PI / 2, scale: 1.15 },
    diamond: { n: 4, rot: -Math.PI / 2, scale: 1.1 },
    square: { n: 4, rot: Math.PI / 4, scale: 1.2 },
    hexagon: { n: 6, rot: 0, scale: 1.05 },
  };
  const { n, rot, scale } = shapes[shape];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * TAU;
    const x = Math.cos(a) * r * scale;
    const y = Math.sin(a) * r * scale;
    k ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
