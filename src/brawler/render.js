// Borough Brawl drawing: a New York street in late-afternoon light, in pixel art.
//
// The world is drawn at 480 × 270 and scaled up without smoothing. Fighters, projectiles and
// sparks go on their own layer whose edges are hardened (alpha snapped to on/off), so they read
// as hand-placed pixels instead of soft vector shapes. The HUD and overlays are drawn at full
// resolution on top, in a chunky arcade style.

import { W, H, FLOOR } from './config.js';
import { HEROES, ENEMIES } from './fighters.js';
import { STAGES } from './stage.js';
import { drawRig, getPose } from './rig.js';
import { razorfinSword } from './razorfin.js';
import { activeHero, partnerHero, phaseOf } from './game.js';
import { Scenery } from './scenery.js';

const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const P = {
  bg: '#0d0a10', ink: '#120d16', paper: '#f2ede4', dim: '#9a8f9c',
  yellow: '#ffd23f', red: '#d6402b', blue: '#5fb3d9', green: '#39d353',
  sidewalk: '#8d8a87', joint: '#75726f', curb: '#bdb8b0', asphalt: '#3b3a40',
};
function canvas(w, h, read = false) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  return [cv, cv.getContext('2d', read ? { willReadFrequently: true } : undefined)];
}

export class Renderer {
  constructor(el) {
    this.canvas = el;
    this.ctx = el.getContext('2d');
    [this.low, this.lc] = canvas(W, H);
    [this.actors, this.ac] = canvas(W, H, true);

    this.scenery = new Scenery(STAGES[0]);

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

    // Whole-pixel scaling keeps the pixels square; fall back to an exact fit if whole steps
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

  drawBackground(camX, t) {
    this.scenery.draw(this.lc, camX, t);
  }

  // ------------------------------------------------------------ fighters and effects

  drawShadow(x, z, h, scale) {
    const lc = this.lc;
    const k = 1 - Math.min(h, 90) / 180;
    lc.fillStyle = 'rgba(30, 20, 48, 0.55)';
    lc.beginPath();
    lc.ellipse(Math.round(x), Math.round(z), 12 * scale * k, 3 * scale * k, 0, 0, Math.PI * 2);
    lc.fill();
  }

  /** The pose name for a fighter's current state (and attack phase). */
  poseName(f) {
    switch (f.state) {
      case 'walk': return f.running ? 'run' : 'walk';
      case 'jump': return f.airAttack ? f.move.pose : 'jump';
      case 'attack': {
        // Startup shows the wind-up, recovery the follow-through, if the move has them.
        const ph = phaseOf(f);
        if (ph === 'startup' && f.move.windPose) return f.move.windPose;
        if (ph === 'recovery' && f.move.followPose) return f.move.followPose;
        return f.move.pose;
      }
      case 'windup': return `${f.def.attack.pose}Windup`;
      case 'down':
      case 'ko': return 'down';
      default: return f.state; // idle, hurt, getup
    }
  }

  poseFor(f) {
    const speed = f.style.kind === 'shark' ? (f.running ? 13 : 7.5) : f.running ? 16 : f.side === 'hero' ? 11 : 8;
    return getPose(f.style.kind, this.poseName(f), { phase: f.t * speed });
  }

  drawFighter(f, camX, t) {
    const ac = this.ac;
    const x = f.x - camX;
    const y = f.z - f.h;
    let alpha = 1;
    let rotate = 0;
    let flash = f.flash > 0;

    if (f.state === 'down' || f.state === 'ko') {
      // Fall backwards, away from the way we face.
      rotate = -f.facing * (f.lying || f.state === 'ko' ? Math.PI / 2 : Math.min(Math.PI / 2, f.t * 6));
    }
    // Blinks rather than fades: the pixel layer is either drawn or not.
    if (f.state === 'ko' && f.side === 'enemy') alpha = f.t > 0.9 || Math.floor(f.t * 14) % 2 ? 0 : 1;
    if (f.state === 'windup') flash = flash || Math.floor(f.t * 12) % 2 === 0;
    if (f.invuln > 0 && Math.floor(t * 20) % 2 === 1) alpha = 0;
    if (alpha === 0) return;

    const bob = f.state === 'idle' ? Math.sin(t * 4 + f.id) * 0.6 : 0;
    // Speed lines behind a lunge or a dive, like an anime streak.
    const lunging = (f.state === 'attack' && f.move.lunge && phaseOf(f) === 'active') || f.diving;
    if (lunging) {
      const s = f.def.scale;
      ac.save();
      for (let i = 0; i < 6; i++) {
        const ly = Math.round(y - (8 + i * 8) * s);
        const len = (20 + ((i * 37 + Math.floor(t * 60)) % 18)) * s;
        ac.fillStyle = i % 2 ? f.style.accent ?? '#ffd23f' : '#ffffff';
        ac.fillRect(Math.round(x - f.facing * (8 * s + len)), ly, Math.round(len), 2);
      }
      ac.restore();
    }
    drawRig(ac, x, y, f.facing, this.poseFor(f), f.style, f.def.scale, { flash, alpha, rotate, t, bob });

    // Telegraph: a "!" over an enemy about to strike.
    if (f.state === 'windup') {
      const top = Math.round(y - 66 * f.def.scale);
      ac.fillStyle = P.ink;
      ac.fillRect(Math.round(x) - 2, top - 1, 5, 15);
      ac.fillStyle = P.yellow;
      ac.fillRect(Math.round(x) - 1, top, 3, 8);
      ac.fillRect(Math.round(x) - 1, top + 10, 3, 3);
    }

    // Smear: a motion arc on a hero's active frames. Razorfin's follows his real blade tip,
    // from where it was in the wind-up to where it is in the swing.
    const bladeArc = f.style.kind === 'shark' && f.state === 'attack' && f.move.blade && f.move.windPose && phaseOf(f) === 'active';
    if (bladeArc) {
      const s = f.def.scale;
      const from = razorfinSword(getPose('shark', f.move.windPose), f.facing, s);
      const to = razorfinSword(getPose('shark', f.move.pose), f.facing, s);
      const [cx, cy] = to.shoulder;
      const a0 = Math.atan2(from.tip[1] - cy, from.tip[0] - cx);
      const a1 = Math.atan2(to.tip[1] - cy, to.tip[0] - cx);
      let d = a1 - a0;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const r = Math.hypot(to.tip[0] - cx, to.tip[1] - cy);
      ac.save();
      ac.translate(Math.round(x), Math.round(y));
      for (const [w, col, rr] of [[6, '#bcd6ff', r * 0.96], [3, '#ffffff', r]]) {
        ac.lineWidth = w;
        ac.strokeStyle = col;
        ac.beginPath();
        ac.arc(cx, cy, rr, a0, a1, d < 0);
        ac.stroke();
      }
      ac.restore();
    } else if (f.side === 'hero' && f.state === 'attack' && phaseOf(f) === 'active' && f.move.reach && f.move.pose !== 'tagIn' && !f.move.lunge) {
      // (Lunges like Shark Rush get speed lines instead of a slash arc.)
      const s = f.def.scale;
      const r = f.move.reach[1] * s * 0.8;
      const cy = y - (f.move.pose === 'highKick' ? 36 : 31) * s;
      const a0 = f.facing > 0 ? -0.9 : Math.PI - 0.5;
      ac.save();
      ac.lineWidth = f.move.blade ? 4 : 3;
      ac.strokeStyle = f.move.blade ? '#e6f0ff' : f.style.accent;
      ac.beginPath();
      ac.arc(Math.round(x), Math.round(cy), r, a0, a0 + 1.4);
      ac.stroke();
      ac.restore();
    }
    if (f.side === 'hero' && f.state === 'attack' && ['tagIn', 'quake'].includes(f.move.pose) && phaseOf(f) !== 'recovery') {
      ac.save();
      ac.strokeStyle = f.style.accent;
      ac.lineWidth = 2;
      ac.beginPath();
      ac.ellipse(Math.round(x), Math.round(f.move.pose === 'quake' ? f.z - 2 : y - 24), f.move.pose === 'quake' ? 46 : 30, 9, 0, 0, Math.PI * 2);
      ac.stroke();
      ac.restore();
    }
  }

  drawProjectile(p, camX) {
    const ac = this.ac;
    const x = Math.round(p.x - camX);
    const y = Math.round(p.z - p.h);
    const d = Math.sign(p.vx);
    ac.save();
    ac.translate(x, y);
    if (p.kind === 'blade') {
      // Razorfin's Fin Blade: a spinning steel crescent with a speed trail.
      ac.fillStyle = '#9aa3ad';
      for (let i = 1; i <= 3; i++) ac.fillRect(-d * (8 + i * 7) - 1, -1, 5, 2);
      ac.rotate(p.spin * 18 * d);
      ac.strokeStyle = P.ink;
      ac.lineWidth = 6;
      ac.beginPath();
      ac.arc(0, 0, 8, -1.1, 1.1);
      ac.stroke();
      ac.strokeStyle = '#e6edf3';
      ac.lineWidth = 3.5;
      ac.stroke();
    } else {
      // Nova's Star Throw: a spinning four-point star.
      ac.rotate(p.spin * 20);
      ac.fillStyle = P.ink;
      ac.fillRect(-6, -2, 12, 4);
      ac.fillRect(-2, -6, 4, 12);
      ac.fillStyle = P.yellow;
      ac.fillRect(-5, -1, 10, 2);
      ac.fillRect(-1, -5, 2, 10);
    }
    ac.restore();
  }

  drawSparks(fx, camX) {
    const ac = this.ac;
    ac.save();
    for (const s of fx.sparks) {
      const a = s.life / s.max;
      const x = s.x - camX;
      if (s.kind === 'star') {
        // Comic impact burst: a jagged white star with a yellow rim.
        const grow = s.size * (0.6 + 0.4 * (1 - a));
        for (const [col, sc] of [[P.ink, 1.15], [s.colour, 1], ['#ffffff', 0.62]]) {
          ac.fillStyle = col;
          ac.beginPath();
          for (let i = 0; i < 16; i++) {
            const ang = s.spin + (i / 16) * Math.PI * 2;
            const rr = (i % 2 ? 0.42 : 1) * grow * sc * (i % 4 === 0 ? 1.15 : 1);
            const px = x + Math.cos(ang) * rr;
            const py = s.y + Math.sin(ang) * rr * 0.8;
            i ? ac.lineTo(px, py) : ac.moveTo(px, py);
          }
          ac.closePath();
          ac.fill();
        }
      } else if (s.kind === 'ring') {
        ac.strokeStyle = s.colour;
        ac.lineWidth = 2;
        ac.beginPath();
        ac.ellipse(Math.round(x), Math.round(s.y), 4 + (1 - a) * 20, 2 + (1 - a) * 7, 0, 0, Math.PI * 2);
        ac.stroke();
      } else if (s.kind === 'dust') {
        ac.fillStyle = s.colour;
        const size = a > 0.5 ? 3 : 2;
        ac.fillRect(Math.round(x), Math.round(s.y), size, size);
      } else {
        ac.strokeStyle = s.colour;
        ac.lineWidth = 2;
        ac.beginPath();
        ac.moveTo(Math.round(x), Math.round(s.y));
        ac.lineTo(Math.round(x - s.vx * 0.03), Math.round(s.y - s.vy * 0.03));
        ac.stroke();
      }
    }
    ac.restore();
  }

  /** Snap the actor layer's alpha to fully on or off: crisp pixel edges, no soft vector look. */
  hardenActors() {
    const img = this.ac.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0;
    this.ac.putImageData(img, 0, 0);
  }

  drawActors(list) {
    this.ac.clearRect(0, 0, W, H);
    list.sort((a, b) => a.z - b.z);
    for (const it of list) it.draw();
  }

  drawWorld(g, fx, t) {
    const camX = g.camX;
    const fighters = [activeHero(g), ...g.enemies];
    for (const f of fighters) this.drawShadow(f.x - camX, f.z, f.h, f.def.scale);
    this.drawActors([
      ...fighters.map((f) => ({ z: f.z, draw: () => this.drawFighter(f, camX, t) })),
      ...g.projectiles.map((p) => ({ z: p.z + 0.5, draw: () => this.drawProjectile(p, camX) })),
      { z: Infinity, draw: () => this.drawSparks(fx, camX) },
    ]);
    this.hardenActors();
    this.lc.drawImage(this.actors, 0, 0);
  }

  drawTitleCast(t) {
    // The heroes squaring up to two of the Gutter Kings.
    // Razorfin is the focal point: centre stage, larger, three-quarter, hand on his planted
    // sword, with the full engraving and chainmail that gameplay size can't show.
    const cast = [
      { def: HEROES.nova, x: 120, z: 214, facing: 1 },
      { def: HEROES.shark, x: 214, z: 238, facing: 1, pose: 'title', scale: 1.3, detail: true },
      { def: ENEMIES.bruiser, x: 372, z: 212, facing: -1 },
      { def: ENEMIES.punk, x: 338, z: 240, facing: -1 },
    ];
    for (const c of cast) this.drawShadow(c.x, c.z, 0, c.def.scale * (c.scale ?? 1));
    this.drawActors(cast.map((c, i) => ({
      z: c.z,
      draw: () => drawRig(this.ac, c.x, c.z, c.facing, getPose(c.def.style.kind, c.pose ?? 'idle'), c.def.style, c.def.scale * (c.scale ?? 1),
        { t, bob: c.pose ? 0 : Math.sin(t * 4 + i) * 0.6, detail: c.detail }),
    })));
    this.hardenActors();
    this.lc.drawImage(this.actors, 0, 0);
  }

  // ------------------------------------------------------------ frame

  draw(v) {
    const { game: g, mode, time: t } = v;
    const camX = mode === 'title' ? (t * 18) % (STAGES[0].length - W) : g.camX;
    this.drawBackground(camX, t);
    if (mode === 'title') this.drawTitleCast(t);
    else this.drawWorld(g, v.fx, t);

    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = P.bg;
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

  // ------------------------------------------------------------ full-resolution HUD (arcade style)

  text(str, x, y, { size = 12, colour = P.paper, align = 'left', shadow = P.ink } = {}) {
    const c = this.ctx;
    c.save();
    c.font = `900 ${Math.round(size)}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    const off = Math.max(1, Math.round(size * 0.1));
    c.fillStyle = shadow;
    c.fillText(str, x + off, y + off); // hard drop shadow, no glow
    c.lineWidth = Math.max(2, size * 0.2);
    c.strokeStyle = P.ink;
    c.strokeText(str, x, y);
    c.fillStyle = colour;
    c.fillText(str, x, y);
    c.restore();
  }

  panel(x, y, w, h) {
    const c = this.ctx;
    const u = this.u;
    c.fillStyle = P.ink;
    c.fillRect(x + 2 * u, y + 2 * u, w, h);
    c.fillStyle = '#1e1824';
    c.fillRect(x, y, w, h);
    c.strokeStyle = P.paper;
    c.lineWidth = Math.max(1, u);
    c.strokeRect(x, y, w, h);
  }

  bar(x, y, w, h, frac, colour) {
    const c = this.ctx;
    c.fillStyle = P.ink;
    c.fillRect(x, y, w, h);
    c.fillStyle = colour;
    c.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
    // Segment ticks, arcade style.
    c.fillStyle = 'rgba(18, 13, 22, 0.5)';
    for (let sx = x + w / 10; sx < x + w - 1; sx += w / 10) c.fillRect(sx, y, Math.max(1, this.u * 0.6), h);
  }

  drawHud(v) {
    const g = v.game;
    const u = this.u;
    const x0 = this.gx;
    const y0 = this.gy;
    const hero = activeHero(g);
    const partner = partnerHero(g);

    this.panel(x0 + 6 * u, y0 + 5 * u, 156 * u, 34 * u);
    this.text(hero.def.name, x0 + 11 * u, y0 + 12 * u, { size: 7 * u, colour: P.yellow });
    this.bar(x0 + 64 * u, y0 + 9 * u, 92 * u, 6 * u, hero.hp / hero.maxHp, hero.def.style.hud);
    const ready = hero.specialCooldown <= 0;
    this.text(ready ? 'SPECIAL READY' : 'SPECIAL …', x0 + 11 * u, y0 + 22 * u, { size: 4.5 * u, colour: ready ? P.green : P.dim });

    this.text(partner.def.name, x0 + 11 * u, y0 + 32 * u, { size: 5 * u, colour: P.paper });
    this.bar(x0 + 64 * u, y0 + 30 * u, 52 * u, 4 * u, partner.hp / partner.maxHp, partner.def.style.hud);
    let tag = 'KO';
    let tagColour = P.red;
    if (partner.hp > 0) {
      const can = g.tagCooldown <= 0;
      tag = can ? `TAG: ${v.hints.tag}` : 'TAG …';
      tagColour = can ? P.yellow : P.dim;
    }
    this.text(tag, x0 + 120 * u, y0 + 32 * u, { size: 4.5 * u, colour: tagColour });

    this.text(`${g.score}`.padStart(6, '0'), x0 + this.gw - 10 * u, y0 + 13 * u, { size: 10 * u, align: 'right', colour: P.paper });
    if (v.muted) this.text('SOUND OFF', x0 + this.gw - 10 * u, y0 + 25 * u, { size: 4.5 * u, colour: P.dim, align: 'right' });

    // Hit combo counter.
    if (g.chain >= 2) {
      const pop = 1 + Math.max(0, g.chainPop) * 0.6;
      this.text(`×${g.chain}`, x0 + 168 * u, y0 + 22 * u, { size: 14 * u * pop, colour: P.yellow, shadow: P.red });
      this.text('HITS', x0 + 168 * u, y0 + 33 * u, { size: 5 * u, colour: P.paper });
    }
    // Floating damage numbers, drawn sharp at full resolution over the pixel world.
    for (const n of v.fx.numbers) {
      const a = n.life / n.max;
      if (a < 0.15 && Math.floor(n.life * 30) % 2) continue;
      this.text(n.text, x0 + (n.x - g.camX) * u, y0 + n.y * u, { size: (n.big ? 9 : 7) * u, colour: n.big ? P.yellow : P.paper });
    }

    const cx = x0 + this.gw / 2;
    if (g.state === 'intro') {
      this.text(g.stage.name, cx, y0 + 70 * u, { size: 13 * u, colour: P.paper, align: 'center', shadow: P.red });
      if (g.stateTime > 0.6) this.text('FIGHT!', cx, y0 + 94 * u, { size: 22 * u, colour: P.yellow, align: 'center', shadow: P.red });
    }
    if (g.go > 0 && Math.floor(g.go * 4) % 2 === 0) {
      this.text('GO ▶', x0 + this.gw - 14 * u, y0 + 110 * u, { size: 18 * u, colour: P.yellow, align: 'right', shadow: P.red });
    }
  }

  dim() {
    const c = this.ctx;
    c.fillStyle = 'rgba(13, 10, 16, 0.72)';
    c.fillRect(this.gx, this.gy, this.gw, this.gh);
  }

  drawOverlay(v) {
    const g = v.game;
    const u = this.u;
    const cx = this.gx + this.gw / 2;
    const cy = this.gy + this.gh / 2;
    if (v.paused) {
      this.dim();
      this.text('PAUSED', cx, cy - 14 * u, { size: 24 * u, align: 'center', colour: P.paper, shadow: P.red });
      this.text(`${v.hints.pause} resume  ·  ${v.hints.quit} arcade  ·  M sound ${v.muted ? 'on' : 'off'}`, cx, cy + 14 * u, { size: 7 * u, colour: P.dim, align: 'center' });
    } else if (g.state === 'gameOver' && g.stateTime > 0.8) {
      this.dim();
      this.text('GAME OVER', cx, cy - 24 * u, { size: 24 * u, colour: P.red, align: 'center' });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text(`${v.hints.start} retry  ·  ${v.hints.quit} arcade`, cx, cy + 22 * u, { size: 7 * u, colour: P.yellow, align: 'center' });
    } else if (g.state === 'stageClear' && g.stateTime > 0.5) {
      this.dim();
      this.text('BLOCK CLEARED!', cx, cy - 24 * u, { size: 22 * u, colour: P.yellow, align: 'center', shadow: P.red });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text(`${v.hints.start} play again  ·  ${v.hints.quit} arcade`, cx, cy + 22 * u, { size: 7 * u, colour: P.paper, align: 'center' });
    }
  }

  drawTitle(v) {
    const u = this.u;
    const c = this.ctx;
    const cx = this.gx + this.gw / 2;
    const y0 = this.gy;
    c.save();
    c.translate(cx, y0 + 44 * u);
    c.rotate(-0.04);
    this.text('BOROUGH BRAWL', 0, 0, { size: 34 * u, colour: P.yellow, align: 'center', shadow: P.red });
    c.restore();
    this.text('Take back the block.', cx, y0 + 70 * u, { size: 8 * u, colour: P.paper, align: 'center' });
    if (v.hints.pad) this.text(v.hints.pad, cx, y0 + 82 * u, { size: 5.5 * u, colour: P.green, align: 'center' });
    if (Math.floor(v.time * 2) % 2 === 0) this.text(`PRESS ${v.hints.start}`, cx, y0 + 96 * u, { size: 12 * u, colour: P.paper, align: 'center', shadow: P.red });
    if (v.best > 0) this.text(`BEST ${v.best}`, cx, y0 + 112 * u, { size: 6 * u, colour: P.dim, align: 'center' });

    const lines = v.hints.lines;
    this.panel(this.gx + 30 * u, y0 + this.gh - 26 * u, this.gw - 60 * u, 21 * u);
    lines.forEach((l, i) => this.text(l, cx, y0 + this.gh - (19 - i * 8) * u, { size: 4.6 * u, colour: P.paper, align: 'center' }));
  }
}
