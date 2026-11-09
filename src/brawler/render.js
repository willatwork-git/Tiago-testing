// Nebula Knockout drawing.
// The world is drawn at 480 × 270 on an offscreen canvas, then scaled up without smoothing
// (retro pixels). The HUD and overlays are drawn at full resolution on top (modern, sharp).

import { W, H, FLOOR } from './config.js';
import { HEROES, ENEMIES } from './fighters.js';
import { STAGES } from './stage.js';
import { drawRig, POSES, walkPose } from './rig.js';
import { activeHero, partnerHero, phaseOf } from './game.js';

const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const C = {
  bg: '#05030f', text: '#f3e8ff', dim: '#8f84b8', pink: '#ff5fd2', cyan: '#3ff0ff',
  yellow: '#ffe14f', red: '#ff3b5c', outline: '#0b0614',
};

/** Small seeded random, so the backdrop is identical every visit. */
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.low = document.createElement('canvas');
    this.low.width = W;
    this.low.height = H;
    this.lc = this.low.getContext('2d');

    const r = seeded(11);
    this.stars = Array.from({ length: 140 }, () => ({ x: r() * 960, y: r() * (FLOOR.top - 20), size: r() < 0.12 ? 2 : 1, phase: r() * 6 }));
    this.skyline = this.buildSkyline(STAGES[0]);

    window.addEventListener('resize', () => this.resize());
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

    // Whole-pixel scaling keeps the pixels square. Fall back to exact fit if whole steps
    // would waste more than a fifth of the screen.
    const fit = Math.min(w / W, h / H) * dpr;
    const whole = Math.floor(fit);
    const devScale = whole >= 1 && whole / fit >= 0.8 ? whole : fit;
    this.u = devScale / dpr; // CSS px per game px
    this.gw = W * this.u;
    this.gh = H * this.u;
    this.gx = Math.round((w - this.gw) / 2);
    this.gy = Math.round((h - this.gh) / 2);
  }

  // ------------------------------------------------------------ backdrop

  buildSkyline(stage) {
    const width = Math.ceil((stage.length - W) * 0.45 + W) + 40;
    const cv = document.createElement('canvas');
    cv.width = width;
    cv.height = FLOOR.top;
    const g = cv.getContext('2d');
    const r = seeded(7);
    const neon = [C.pink, C.cyan, C.yellow];

    // Far towers: flat silhouettes.
    for (let x = -10; x < width;) {
      const w = 14 + r() * 30;
      const h = 30 + r() * 80;
      g.fillStyle = '#140829';
      g.fillRect(Math.round(x), Math.round(FLOOR.top - h), Math.round(w), Math.round(h));
      x += w + r() * 6;
    }
    // Near towers: neon roof lines, lit windows, the odd antenna.
    for (let x = -5; x < width;) {
      const w = Math.round(24 + r() * 46);
      const h = Math.round(40 + r() * 95);
      const top = FLOOR.top - h;
      const glow = neon[Math.floor(r() * neon.length)];
      g.fillStyle = '#1c0c38';
      g.fillRect(Math.round(x), top, w, h);
      g.fillStyle = glow;
      g.fillRect(Math.round(x), top, w, 1);
      for (let wy = top + 5; wy < FLOOR.top - 4; wy += 6) {
        for (let wx = x + 3; wx < x + w - 3; wx += 5) {
          const roll = r();
          if (roll < 0.3) {
            g.globalAlpha = roll < 0.08 ? 0.95 : 0.45;
            g.fillStyle = roll < 0.15 ? glow : '#f3e8ff';
            g.fillRect(Math.round(wx), wy, 2, 2);
            g.globalAlpha = 1;
          }
        }
      }
      if (r() < 0.35) {
        g.fillStyle = '#2a1650';
        g.fillRect(Math.round(x + w / 2), top - 9, 1, 9);
        g.fillStyle = C.red;
        g.fillRect(Math.round(x + w / 2) - 1, top - 10, 2, 2);
      }
      x += w + 4 + r() * 10;
    }
    return cv;
  }

  drawBackground(camX, t) {
    const lc = this.lc;
    const sky = lc.createLinearGradient(0, 0, 0, FLOOR.top);
    sky.addColorStop(0, '#06021a');
    sky.addColorStop(0.65, '#1b0938');
    sky.addColorStop(1, '#3d1052');
    lc.fillStyle = sky;
    lc.fillRect(0, 0, W, FLOOR.top);

    // Stars (barely move), twinkling.
    for (const s of this.stars) {
      const x = (((s.x - camX * 0.06) % 960) + 960) % 960;
      if (x >= W) continue;
      lc.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.phase);
      lc.fillStyle = '#ffffff';
      lc.fillRect(Math.round(x), Math.round(s.y), s.size, s.size);
    }
    lc.globalAlpha = 1;

    // Ringed planet.
    const px = Math.round(330 - camX * 0.12);
    const py = 66;
    const pg = lc.createRadialGradient(px - 10, py - 12, 4, px, py, 34);
    pg.addColorStop(0, '#ffb3ec');
    pg.addColorStop(0.5, '#c04bd8');
    pg.addColorStop(1, '#4a1a7a');
    lc.fillStyle = pg;
    lc.beginPath();
    lc.arc(px, py, 32, 0, Math.PI * 2);
    lc.fill();
    lc.strokeStyle = C.yellow;
    lc.globalAlpha = 0.75;
    lc.lineWidth = 2;
    lc.beginPath();
    lc.ellipse(px, py, 56, 10, -0.25, 0, Math.PI * 2);
    lc.stroke();
    lc.globalAlpha = 1;

    // City silhouettes.
    lc.drawImage(this.skyline, -Math.round(camX * 0.45), 0);

    // Horizon glow.
    lc.fillStyle = 'rgba(255, 95, 210, 0.25)';
    lc.fillRect(0, FLOOR.top - 6, W, 6);
    lc.fillStyle = C.pink;
    lc.fillRect(0, FLOOR.top - 2, W, 2);

    // Floor + perspective grid.
    const fl = lc.createLinearGradient(0, FLOOR.top, 0, H);
    fl.addColorStop(0, '#1d0b3a');
    fl.addColorStop(1, '#0a041a');
    lc.fillStyle = fl;
    lc.fillRect(0, FLOOR.top, W, H - FLOOR.top);
    lc.lineWidth = 1;
    lc.strokeStyle = 'rgba(255, 95, 210, 0.35)';
    lc.beginPath();
    const start = Math.floor((camX - 600) / 48) * 48;
    for (let wx = start; wx < camX + W + 600; wx += 48) {
      const bx = wx - camX;
      lc.moveTo(W / 2 + (bx - W / 2) * 0.35, FLOOR.top);
      lc.lineTo(W / 2 + (bx - W / 2) * 1.3, H);
    }
    lc.stroke();
    lc.strokeStyle = 'rgba(63, 240, 255, 0.22)';
    lc.beginPath();
    for (let i = 1; i <= 7; i++) {
      const y = Math.round(FLOOR.top + (H - FLOOR.top) * (i / 7) ** 1.7) + 0.5;
      lc.moveTo(0, y);
      lc.lineTo(W, y);
    }
    lc.stroke();
  }

  // ------------------------------------------------------------ world

  drawShadow(x, z, h, scale) {
    const lc = this.lc;
    const k = 1 - Math.min(h, 90) / 180;
    lc.fillStyle = 'rgba(0, 0, 0, 0.45)';
    lc.beginPath();
    lc.ellipse(Math.round(x), Math.round(z), 13 * scale * k, 3.5 * k, 0, 0, Math.PI * 2);
    lc.fill();
  }

  poseFor(f) {
    switch (f.state) {
      case 'walk': return walkPose(f.t * (f.side === 'hero' ? 11 : 8));
      case 'jump': return f.airAttack ? POSES[f.def.air.pose] : POSES.jump;
      case 'attack': return POSES[f.move.pose];
      case 'windup': return POSES[`${f.def.attack.pose}Windup`];
      case 'hurt': return POSES.hurt;
      case 'down':
      case 'ko': return POSES.down;
      case 'getup': return POSES.getup;
      default: return POSES.idle;
    }
  }

  drawFighter(f, camX, t) {
    const lc = this.lc;
    const x = f.x - camX;
    const y = f.z - f.h;
    let alpha = 1;
    let rotate = 0;
    let flash = f.flash > 0;

    if (f.state === 'down' || f.state === 'ko') {
      // Fall backwards, away from the way we face.
      rotate = -f.facing * (f.lying || f.state === 'ko' ? Math.PI / 2 : Math.min(Math.PI / 2, f.t * 6));
    }
    if (f.state === 'ko' && f.side === 'enemy') alpha = Math.max(0, 1 - f.t / 0.9) * (Math.floor(f.t * 16) % 2 ? 0.4 : 1);
    if (f.state === 'windup') flash = flash || Math.floor(f.t * 12) % 2 === 0;
    if (f.invuln > 0 && Math.floor(t * 20) % 2 === 1) alpha *= 0.45;

    const bob = f.state === 'idle' ? Math.sin(t * 4 + f.id) * 0.6 : 0;
    drawRig(lc, x, y, f.facing, this.poseFor(f), f.def.style, f.def.scale, { flash, alpha, rotate, t, bob });

    // Telegraph: a "!" over an enemy about to strike.
    if (f.state === 'windup') {
      const top = Math.round(y - 70 * f.def.scale);
      lc.fillStyle = C.yellow;
      lc.fillRect(Math.round(x) - 1, top, 3, 7);
      lc.fillRect(Math.round(x) - 1, top + 9, 3, 3);
    }

    // Smear: a motion arc on a hero's active attack frames.
    if (f.side === 'hero' && f.state === 'attack' && phaseOf(f) === 'active' && f.move.reach && f.move.pose !== 'tagIn') {
      const s = f.def.scale;
      const r = f.move.reach[1] * s * 0.8;
      const cy = y - (f.move.pose === 'highKick' ? 36 : 31) * s;
      const a0 = f.facing > 0 ? -0.9 : Math.PI - 0.5;
      lc.save();
      lc.globalAlpha = 0.55;
      lc.strokeStyle = f.def.style.accent;
      lc.lineWidth = 3;
      lc.beginPath();
      lc.arc(Math.round(x), Math.round(cy), r, a0, a0 + 1.4);
      lc.stroke();
      lc.restore();
    }
    if (f.side === 'hero' && f.state === 'attack' && f.move.pose === 'tagIn' && phaseOf(f) !== 'recovery') {
      lc.save();
      lc.globalAlpha = 0.6;
      lc.strokeStyle = f.def.style.accent;
      lc.lineWidth = 2;
      lc.beginPath();
      lc.ellipse(Math.round(x), Math.round(y - 24), 30, 10, 0, 0, Math.PI * 2);
      lc.stroke();
      lc.restore();
    }
  }

  drawProjectile(p, camX, t) {
    const lc = this.lc;
    const x = Math.round(p.x - camX);
    const y = Math.round(p.z - p.h);
    const d = Math.sign(p.vx);
    lc.save();
    lc.fillStyle = 'rgba(63, 240, 255, 0.25)';
    lc.fillRect(x - 16 - (d < 0 ? 0 : 8), y - 6, 32, 12);
    lc.fillStyle = 'rgba(63, 240, 255, 0.6)';
    lc.fillRect(x - 12, y - 4, 24, 8);
    lc.fillStyle = '#ffffff';
    lc.fillRect(x - 9, y - 2, 18, 4);
    // trail
    for (let i = 1; i <= 4; i++) {
      lc.globalAlpha = 0.5 - i * 0.1;
      lc.fillStyle = C.cyan;
      lc.fillRect(x - d * (12 + i * 7) - 2, y - 1 + Math.round(Math.sin(t * 30 + i) * 2), 5, 2);
    }
    lc.restore();
  }

  drawSparks(fx, camX) {
    const lc = this.lc;
    lc.save();
    for (const s of fx.sparks) {
      const a = s.life / s.max;
      const x = s.x - camX;
      lc.globalAlpha = a;
      if (s.kind === 'ring') {
        lc.strokeStyle = s.colour;
        lc.lineWidth = 2;
        lc.beginPath();
        lc.arc(Math.round(x), Math.round(s.y), 4 + (1 - a) * 18, 0, Math.PI * 2);
        lc.stroke();
      } else if (s.kind === 'dust') {
        lc.fillStyle = s.colour;
        lc.fillRect(Math.round(x), Math.round(s.y), 2, 2);
      } else {
        lc.strokeStyle = s.colour;
        lc.lineWidth = 2;
        lc.beginPath();
        lc.moveTo(Math.round(x), Math.round(s.y));
        lc.lineTo(Math.round(x - s.vx * 0.03), Math.round(s.y - s.vy * 0.03));
        lc.stroke();
      }
    }
    lc.restore();
  }

  drawWorld(g, fx, t) {
    const camX = g.camX;
    const fighters = [activeHero(g), ...g.enemies];
    for (const f of fighters) this.drawShadow(f.x - camX, f.z, f.h, f.def.scale);
    const items = [
      ...fighters.map((f) => ({ z: f.z, draw: () => this.drawFighter(f, camX, t) })),
      ...g.projectiles.map((p) => ({ z: p.z + 0.5, draw: () => this.drawProjectile(p, camX, t) })),
    ];
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.draw();
    this.drawSparks(fx, camX);
  }

  drawTitleCast(t) {
    // The two heroes squaring up to a Brute and a Voidling.
    const cast = [
      { def: HEROES.nova, x: 150, z: 236, facing: 1 },
      { def: HEROES.titan, x: 112, z: 212, facing: 1 },
      { def: ENEMIES.brute, x: 350, z: 214, facing: -1 },
      { def: ENEMIES.voidling, x: 318, z: 240, facing: -1 },
    ];
    cast.sort((a, b) => a.z - b.z);
    for (const c of cast) this.drawShadow(c.x, c.z, 0, c.def.scale);
    cast.forEach((c, i) => {
      drawRig(this.lc, c.x, c.z, c.facing, POSES.idle, c.def.style, c.def.scale, { t, bob: Math.sin(t * 4 + i) * 0.6 });
    });
  }

  // ------------------------------------------------------------ frame

  draw(v) {
    const { game: g, mode, time: t } = v;
    const camX = mode === 'title' ? (t * 22) % (STAGES[0].length - W) : g.camX;
    this.drawBackground(camX, t);
    if (mode === 'title') this.drawTitleCast(t);
    else this.drawWorld(g, v.fx, t);

    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = C.bg;
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.imageSmoothingEnabled = false;
    const shake = mode === 'title' ? 0 : v.fx.shake * this.u;
    const ox = Math.round((Math.random() - 0.5) * 2 * shake);
    const oy = Math.round((Math.random() - 0.5) * 2 * shake);
    c.drawImage(this.low, this.gx + ox, this.gy + oy, this.gw, this.gh);

    if (mode === 'title') this.drawTitle(v);
    else {
      this.drawHud(v);
      this.drawOverlay(v);
    }
  }

  // ------------------------------------------------------------ full-resolution HUD

  text(str, x, y, { size = 12, colour = C.text, align = 'left', glow = 0, weight = 700 } = {}) {
    const c = this.ctx;
    c.save();
    c.font = `${weight} ${Math.round(size)}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    if (glow) {
      c.shadowColor = colour;
      c.shadowBlur = glow;
    }
    c.lineWidth = Math.max(2, size * 0.18);
    c.strokeStyle = C.outline;
    c.strokeText(str, x, y);
    c.fillStyle = colour;
    c.fillText(str, x, y);
    c.restore();
  }

  bar(x, y, w, h, frac, colour) {
    const c = this.ctx;
    c.fillStyle = C.outline;
    c.fillRect(x - 2, y - 2, w + 4, h + 4);
    c.fillStyle = '#2a1650';
    c.fillRect(x, y, w, h);
    c.fillStyle = colour;
    c.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  }

  drawHud(v) {
    const g = v.game;
    const u = this.u;
    const x0 = this.gx;
    const y0 = this.gy;
    const hero = activeHero(g);
    const partner = partnerHero(g);
    const st = hero.def.style;

    // Active hero: name, big health bar, special readiness.
    this.text(hero.def.name, x0 + 8 * u, y0 + 9 * u, { size: 8 * u, colour: st.body });
    this.bar(x0 + 40 * u, y0 + 6 * u, 110 * u, 6 * u, hero.hp / hero.maxHp, st.body);
    const ready = hero.specialCooldown <= 0;
    this.text(ready ? `${hero.def.special.name} READY` : hero.def.special.name, x0 + 40 * u, y0 + 18 * u,
      { size: 5 * u, colour: ready ? C.yellow : C.dim, weight: 600 });
    if (!ready) this.bar(x0 + 104 * u, y0 + 17 * u, 46 * u, 2 * u, 1 - hero.specialCooldown / hero.def.special.cooldown, C.dim);

    // Partner: smaller bar, tag readiness.
    const ps = partner.def.style;
    this.text(partner.def.name, x0 + 8 * u, y0 + 29 * u, { size: 6 * u, colour: ps.body });
    this.bar(x0 + 40 * u, y0 + 27 * u, 70 * u, 4 * u, partner.hp / partner.maxHp, ps.body);
    let tagText = 'KO';
    let tagColour = C.red;
    if (partner.hp > 0) {
      const canTag = g.tagCooldown <= 0;
      tagText = canTag ? 'TAG: SPACE' : 'TAG …';
      tagColour = canTag ? C.yellow : C.dim;
    }
    this.text(tagText, x0 + 116 * u, y0 + 29 * u, { size: 5 * u, colour: tagColour, weight: 600 });

    this.text(`SCORE ${g.score}`, x0 + this.gw - 8 * u, y0 + 9 * u, { size: 8 * u, align: 'right' });
    if (v.muted) this.text('SOUND OFF', x0 + this.gw - 8 * u, y0 + 19 * u, { size: 5 * u, colour: C.dim, align: 'right' });

    const cx = x0 + this.gw / 2;
    if (g.state === 'intro') {
      this.text(g.stage.name, cx, y0 + 70 * u, { size: 12 * u, colour: C.cyan, align: 'center', glow: 8 * u });
      if (g.stateTime > 0.6) this.text('FIGHT!', cx, y0 + 92 * u, { size: 16 * u, colour: C.yellow, align: 'center', glow: 10 * u });
    }
    if (g.go > 0 && Math.floor(g.go * 4) % 2 === 0) {
      this.text('GO →', x0 + this.gw - 14 * u, y0 + 110 * u, { size: 16 * u, colour: C.yellow, align: 'right', glow: 10 * u });
    }
  }

  dim() {
    const c = this.ctx;
    c.fillStyle = 'rgba(5, 3, 15, 0.7)';
    c.fillRect(this.gx, this.gy, this.gw, this.gh);
  }

  drawOverlay(v) {
    const g = v.game;
    const u = this.u;
    const cx = this.gx + this.gw / 2;
    const cy = this.gy + this.gh / 2;
    if (v.paused) {
      this.dim();
      this.text('PAUSED', cx, cy - 12 * u, { size: 20 * u, align: 'center', glow: 10 * u });
      this.text(`P resume   ·   Q arcade   ·   M sound ${v.muted ? 'on' : 'off'}`, cx, cy + 14 * u, { size: 7 * u, colour: C.dim, align: 'center', weight: 600 });
    } else if (g.state === 'gameOver' && g.stateTime > 0.8) {
      this.dim();
      this.text('GAME OVER', cx, cy - 22 * u, { size: 20 * u, colour: C.red, align: 'center', glow: 10 * u });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text('ENTER retry   ·   Q arcade', cx, cy + 22 * u, { size: 7 * u, colour: C.yellow, align: 'center' });
    } else if (g.state === 'stageClear' && g.stateTime > 0.5) {
      this.dim();
      this.text('STAGE CLEAR!', cx, cy - 22 * u, { size: 20 * u, colour: C.yellow, align: 'center', glow: 10 * u });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text('ENTER play again   ·   Q arcade', cx, cy + 22 * u, { size: 7 * u, colour: C.cyan, align: 'center' });
    }
  }

  drawTitle(v) {
    const u = this.u;
    const cx = this.gx + this.gw / 2;
    const y0 = this.gy;
    this.text('NEBULA KNOCKOUT', cx, y0 + 40 * u, { size: 26 * u, colour: C.pink, align: 'center', glow: 12 * u, weight: 800 });
    this.text('a tag-team brawl among the stars', cx, y0 + 60 * u, { size: 8 * u, colour: C.text, align: 'center', weight: 500 });
    if (Math.floor(v.time * 2) % 2 === 0) {
      this.text('PRESS ENTER', cx, y0 + 88 * u, { size: 11 * u, colour: C.yellow, align: 'center', glow: 6 * u });
    }
    const keys = 'MOVE Arrows/WASD   ATTACK J/Z   JUMP K/X   SPECIAL L/C   TAG Space';
    this.text(keys, cx, y0 + this.gh - 10 * u, { size: 5.5 * u, colour: C.text, align: 'center', weight: 600 });
    if (v.best > 0) this.text(`BEST ${v.best}`, cx, y0 + 102 * u, { size: 7 * u, colour: C.dim, align: 'center' });
  }
}
