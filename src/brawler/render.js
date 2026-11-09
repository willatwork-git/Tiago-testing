// Borough Brawl drawing: a dusk New York street in pixel art.
//
// The world is drawn at 480 × 270 and scaled up without smoothing. Fighters, projectiles and
// sparks go on their own layer whose edges are hardened (alpha snapped to on/off), so they read
// as hand-placed pixels instead of soft vector shapes. The HUD and overlays are drawn at full
// resolution on top, in a chunky arcade style.

import { W, H, FLOOR } from './config.js';
import { HEROES, ENEMIES } from './fighters.js';
import { STAGES } from './stage.js';
import { drawRig, POSES, walkPose } from './rig.js';
import { activeHero, partnerHero, phaseOf } from './game.js';

const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const P = {
  bg: '#0d0a10', ink: '#120d16', paper: '#f2ede4', dim: '#9a8f9c',
  yellow: '#ffd23f', red: '#d6402b', blue: '#5fb3d9', green: '#39d353',
  sidewalk: '#8d8a87', joint: '#75726f', curb: '#bdb8b0', asphalt: '#3b3a40',
};
const SIDEWALK_TOP = FLOOR.top - 20;
const SIGNS = ['DELI', 'PIZZA', 'BODEGA', 'LAUNDRY', '24 HR', 'SUBS', 'CAFE', 'TATTOO', 'ARCADE', 'NOODLES'];
const TAG_COLOURS = ['#ff4d6d', '#4dd2ff', '#ffd23f', '#7cff4f', '#c77dff', '#ff9f1c'];

/** Small seeded random, so the street is identical every visit. */
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

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

    const stage = STAGES[0];
    this.skyline = this.buildSkyline(stage);
    [this.street, this.manholes] = this.buildStreet(stage);
    this.road = this.buildRoad(stage, this.manholes);

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

  // ------------------------------------------------------------ prerendered backdrop

  /** Distant Manhattan-style skyline against the dusk sky (slow parallax). */
  buildSkyline(stage) {
    const [cv, g] = canvas((stage.length - W) * 0.25 + W + 40, SIDEWALK_TOP);
    const r = seeded(3);
    for (let x = -10; x < cv.width;) {
      const w = 12 + r() * 26;
      const h = 40 + r() * 70;
      const top = SIDEWALK_TOP - h;
      g.fillStyle = '#3a2741';
      g.fillRect(Math.round(x), Math.round(top), Math.round(w), Math.round(h));
      if (r() < 0.15) {
        // An art-deco spire.
        g.fillRect(Math.round(x + w / 2 - 3), Math.round(top - 16), 6, 16);
        g.fillRect(Math.round(x + w / 2 - 1), Math.round(top - 30), 2, 14);
      }
      g.fillStyle = 'rgba(255, 207, 112, 0.35)';
      for (let wy = top + 4; wy < SIDEWALK_TOP - 4; wy += 5) {
        for (let wx = x + 2; wx < x + w - 2; wx += 4) if (r() < 0.12) g.fillRect(Math.round(wx), Math.round(wy), 1, 2);
      }
      x += w + r() * 3;
    }
    return cv;
  }

  /** The block: brick and brownstone fronts, shops, fire escapes, graffiti, sidewalk, lamps. */
  buildStreet(stage) {
    const [cv, g] = canvas(stage.length + W + 40, FLOOR.top);
    const r = seeded(21);
    const pick = (list) => list[Math.floor(r() * list.length)];
    const R = Math.round;

    for (let x = -20; x < cv.width;) {
      const w = R(90 + r() * 80);
      const top = R(18 + r() * 70);
      const kind = pick(['brick', 'brick', 'brownstone', 'shop']);
      const base = kind === 'brownstone' ? '#6b4a3a' : pick(['#7a3b2e', '#8a4433', '#6e3a30']);
      const mortar = kind === 'brownstone' ? '#5a3d30' : '#5a2a22';

      g.fillStyle = base;
      g.fillRect(x, top, w, SIDEWALK_TOP - top);
      if (kind !== 'brownstone') {
        // Brick courses.
        g.fillStyle = mortar;
        for (let by = top + 3; by < SIDEWALK_TOP; by += 4) {
          g.fillRect(x, by, w, 1);
          for (let bx = x + ((by / 4) % 2 ? 0 : 4); bx < x + w; bx += 8) g.fillRect(bx, by - 3, 1, 3);
        }
      }
      // Cornice.
      g.fillStyle = '#2e2128';
      g.fillRect(x - 2, top - 3, w + 4, 4);
      g.fillStyle = '#b8a48f';
      g.fillRect(x - 2, top - 3, w + 4, 1);

      // Windows, warm and lit or dark.
      const groundTop = SIDEWALK_TOP - 34;
      for (let wy = top + 10; wy < groundTop - 12; wy += 20) {
        for (let wx = x + 7; wx < x + w - 12; wx += 16) {
          g.fillStyle = '#d8cfc0';
          g.fillRect(wx - 1, wy - 1, 10, 14);
          g.fillStyle = r() < 0.4 ? '#ffcf70' : '#2b2633';
          g.fillRect(wx, wy, 8, 12);
          g.fillStyle = '#d8cfc0';
          g.fillRect(wx, wy + 5, 8, 1);
        }
      }

      // Fire escape on the brick buildings.
      if (kind === 'brick' && r() < 0.75) {
        const fx = x + R(w * 0.45);
        g.fillStyle = '#1a1719';
        for (let fy = top + 30; fy < groundTop - 4; fy += 20) {
          g.fillRect(fx, fy, 34, 2);
          g.fillRect(fx, fy - 7, 34, 1);
          for (let px = fx; px <= fx + 34; px += 6) g.fillRect(px, fy - 7, 1, 7);
          for (let s = 0; s < 18; s += 2) g.fillRect(fx + 4 + s, fy + 2 + s, 2, 1); // stairs down
        }
      }

      // Ground floor: a shop with a sign and awning, or a door and stoop.
      if (kind === 'shop' || r() < 0.3) {
        g.fillStyle = '#1d1a22';
        g.fillRect(x + 4, groundTop - 10, w - 8, 9);
        g.fillStyle = pick([P.yellow, '#ff6b6b', '#7ce0ff', '#ffffff']);
        g.font = 'bold 8px monospace';
        g.textBaseline = 'middle';
        g.textAlign = 'center';
        g.fillText(pick(SIGNS), x + w / 2, groundTop - 5);
        const stripe = pick([['#c0392b', '#f2ede4'], ['#2f6b3f', '#f2ede4'], ['#2a4c8c', '#f2ede4']]);
        for (let ax = x + 4; ax < x + w - 4; ax += 6) {
          g.fillStyle = stripe[(ax / 6) % 2 | 0];
          g.fillRect(ax, groundTop, 6, 7);
        }
        g.fillStyle = '#3a3348';
        g.fillRect(x + 8, groundTop + 9, w - 30, SIDEWALK_TOP - groundTop - 11);
        g.fillStyle = 'rgba(255, 207, 112, 0.35)';
        g.fillRect(x + 10, groundTop + 11, w - 34, 10);
        g.fillStyle = '#231d29';
        g.fillRect(x + w - 18, groundTop + 9, 12, SIDEWALK_TOP - groundTop - 9);
      } else {
        g.fillStyle = '#2b1f22';
        g.fillRect(x + 10, groundTop + 6, 14, SIDEWALK_TOP - groundTop - 6);
        g.fillStyle = '#9a8a7a';
        for (let s = 0; s < 3; s++) g.fillRect(x + 6 - s * 2, SIDEWALK_TOP - 3 - s * 3, 22 + s * 4, 3);
        if (r() < 0.8) this.graffiti(g, x + 32, groundTop + 6, Math.min(w - 40, 60), r);
      }

      // Water tower on the roof.
      if (top < 70 && r() < 0.45) {
        const tx = x + R(w * 0.25);
        g.fillStyle = '#2a2025';
        g.fillRect(tx + 2, top - 12, 1, 10);
        g.fillRect(tx + 12, top - 12, 1, 10);
        g.fillStyle = '#7a5236';
        g.fillRect(tx, top - 26, 15, 15);
        g.fillStyle = '#5a3a26';
        g.fillRect(tx, top - 22, 15, 1);
        g.fillRect(tx, top - 16, 15, 1);
        g.beginPath();
        g.moveTo(tx - 1, top - 26);
        g.lineTo(tx + 7.5, top - 33);
        g.lineTo(tx + 16, top - 26);
        g.fill();
      }

      const alley = r() < 0.2 ? 8 : 0;
      if (alley) {
        g.fillStyle = '#1f1820';
        g.fillRect(x + w, top + 20, alley, SIDEWALK_TOP - top - 20);
      }
      x += w + alley;
    }

    // Sidewalk, curb.
    g.fillStyle = '#4a4548';
    g.fillRect(0, SIDEWALK_TOP - 1, cv.width, 1);
    g.fillStyle = P.sidewalk;
    g.fillRect(0, SIDEWALK_TOP, cv.width, FLOOR.top - SIDEWALK_TOP - 3);
    g.fillStyle = P.joint;
    for (let jx = 0; jx < cv.width; jx += 22) g.fillRect(jx, SIDEWALK_TOP, 1, FLOOR.top - SIDEWALK_TOP - 3);
    g.fillRect(0, SIDEWALK_TOP + 8, cv.width, 1);
    g.fillStyle = P.curb;
    g.fillRect(0, FLOOR.top - 3, cv.width, 2);
    g.fillStyle = '#5e5b58';
    g.fillRect(0, FLOOR.top - 1, cv.width, 1);

    // Street furniture: lamps, hydrants, trash cans.
    for (let lx = 120; lx < cv.width; lx += 230) {
      const glow = g.createRadialGradient(lx, SIDEWALK_TOP - 48, 2, lx, SIDEWALK_TOP - 48, 40);
      glow.addColorStop(0, 'rgba(255, 214, 140, 0.45)');
      glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
      g.fillStyle = glow;
      g.fillRect(lx - 40, SIDEWALK_TOP - 88, 80, 80);
      g.fillStyle = '#26262c';
      g.fillRect(lx - 1, SIDEWALK_TOP - 50, 3, 62);
      g.fillRect(lx - 1, SIDEWALK_TOP - 52, 10, 2);
      g.fillStyle = '#ffe2a8';
      g.fillRect(lx + 6, SIDEWALK_TOP - 50, 4, 2);
    }
    for (let hx = 60 + r() * 100; hx < cv.width; hx += 140 + r() * 160) {
      const ix = R(hx);
      if (r() < 0.5) {
        g.fillStyle = P.red; // hydrant
        g.fillRect(ix, SIDEWALK_TOP + 4, 5, 9);
        g.fillRect(ix - 1, SIDEWALK_TOP + 3, 7, 2);
        g.fillRect(ix - 2, SIDEWALK_TOP + 7, 9, 2);
      } else {
        g.fillStyle = '#5c6066'; // trash can
        g.fillRect(ix, SIDEWALK_TOP + 1, 8, 12);
        g.fillStyle = '#7b8088';
        g.fillRect(ix - 1, SIDEWALK_TOP, 10, 2);
      }
    }

    // Manholes for the road (steam rises from these).
    const manholes = [];
    for (let mx = 180 + r() * 120; mx < cv.width; mx += 260 + r() * 200) manholes.push({ x: R(mx), z: R(FLOOR.top + 18 + r() * 50) });
    return [cv, manholes];
  }

  graffiti(g, x, y, w, r) {
    // A loose tag: a few fat colour strokes with a dark outline.
    const colour = TAG_COLOURS[Math.floor(r() * TAG_COLOURS.length)];
    const pts = Array.from({ length: 5 }, (_, i) => [x + (i / 4) * w, y + 4 + r() * 16]);
    for (const [lw, c] of [[6, '#120d16'], [3, colour]]) {
      g.strokeStyle = c;
      g.lineWidth = lw;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(...pts[0]);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1];
        g.quadraticCurveTo(px + 4, py - 10 + r() * 20, pts[i][0], pts[i][1]);
      }
      g.stroke();
    }
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(x + w * 0.3), Math.round(y + 6), 2, 2);
  }

  /** The road you fight on: asphalt, lane lines, crosswalks at each wave zone, manholes. */
  buildRoad(stage, manholes) {
    const [cv, g] = canvas(stage.length + W + 40, H - FLOOR.top);
    const r = seeded(5);
    const h = cv.height;
    g.fillStyle = P.asphalt;
    g.fillRect(0, 0, cv.width, h);
    for (let i = 0; i < cv.width * 2; i++) {
      g.fillStyle = r() < 0.5 ? '#333238' : '#45444a';
      g.fillRect(Math.floor(r() * cv.width), Math.floor(r() * h), 1, 1);
    }
    // Gutter shadow under the curb.
    g.fillStyle = '#2a292e';
    g.fillRect(0, 0, cv.width, 3);
    // Double yellow centre line.
    const mid = Math.round(h * 0.48);
    g.fillStyle = '#d9b23a';
    g.fillRect(0, mid, cv.width, 1);
    g.fillRect(0, mid + 3, cv.width, 1);
    // White lane dashes.
    g.fillStyle = '#cfcac0';
    for (let lx = 0; lx < cv.width; lx += 40) g.fillRect(lx, Math.round(h * 0.8), 20, 1);
    // Crosswalks where the wave zones are.
    for (const zone of stage.zones) {
      if (!zone.trigger) continue;
      g.fillStyle = '#d8d3c8';
      for (let sy = 5; sy < h - 4; sy += 8) g.fillRect(zone.trigger + 60, sy, 36, 4);
    }
    // Cracks and oil stains.
    for (let i = 0; i < cv.width / 60; i++) {
      const cx = r() * cv.width;
      const cy = 6 + r() * (h - 12);
      g.fillStyle = 'rgba(20, 18, 24, 0.45)';
      g.beginPath();
      g.ellipse(cx, cy, 6 + r() * 8, 2 + r() * 2, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (const m of manholes) {
      const my = m.z - FLOOR.top;
      g.fillStyle = '#26252a';
      g.beginPath();
      g.ellipse(m.x, my, 9, 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#4b4a50';
      g.fillRect(m.x - 6, my - 1, 12, 1);
      g.fillRect(m.x - 5, my + 1, 10, 1);
    }
    return cv;
  }

  // ------------------------------------------------------------ per-frame backdrop

  drawBackground(camX, t) {
    const lc = this.lc;
    const sky = lc.createLinearGradient(0, 0, 0, SIDEWALK_TOP);
    sky.addColorStop(0, '#231a3a');
    sky.addColorStop(0.55, '#6b2f4a');
    sky.addColorStop(1, '#e0784a');
    lc.fillStyle = sky;
    lc.fillRect(0, 0, W, SIDEWALK_TOP);
    lc.drawImage(this.skyline, -Math.round(camX * 0.25), 0);
    lc.drawImage(this.street, -Math.round(camX), 0);
    lc.drawImage(this.road, -Math.round(camX), FLOOR.top);

    // Steam drifting up from the manholes.
    lc.save();
    for (const m of this.manholes) {
      const sx = m.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.6 + i / 4) % 1;
        lc.globalAlpha = 0.28 * (1 - k);
        lc.fillStyle = '#e4e0ea';
        lc.beginPath();
        lc.arc(Math.round(sx + Math.sin(t * 2 + i) * 4 * k), Math.round(m.z - 4 - k * 34), 4 + k * 7, 0, Math.PI * 2);
        lc.fill();
      }
    }
    lc.restore();
  }

  // ------------------------------------------------------------ fighters and effects

  drawShadow(x, z, h, scale) {
    const lc = this.lc;
    const k = 1 - Math.min(h, 90) / 180;
    lc.fillStyle = 'rgba(10, 6, 14, 0.5)';
    lc.beginPath();
    lc.ellipse(Math.round(x), Math.round(z), 13 * scale * k, 3.5 * k, 0, 0, Math.PI * 2);
    lc.fill();
  }

  poseFor(f) {
    switch (f.state) {
      case 'walk': return walkPose(f.t * (f.running ? 16 : f.side === 'hero' ? 11 : 8), f.running);
      case 'jump': return f.airAttack ? POSES[f.move.pose] : POSES.jump;
      case 'attack':
        return POSES[(phaseOf(f) === 'startup' && f.move.windPose) || f.move.pose];
      case 'windup': return POSES[`${f.def.attack.pose}Windup`];
      case 'hurt': return POSES.hurt;
      case 'down':
      case 'ko': return POSES.down;
      case 'getup': return POSES.getup;
      default: return POSES.idle;
    }
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
    drawRig(ac, x, y, f.facing, this.poseFor(f), f.def.style, f.def.scale, { flash, alpha, rotate, t, bob });

    // Telegraph: a "!" over an enemy about to strike.
    if (f.state === 'windup') {
      const top = Math.round(y - 72 * f.def.scale);
      ac.fillStyle = P.ink;
      ac.fillRect(Math.round(x) - 2, top - 1, 5, 15);
      ac.fillStyle = P.yellow;
      ac.fillRect(Math.round(x) - 1, top, 3, 8);
      ac.fillRect(Math.round(x) - 1, top + 10, 3, 3);
    }

    // Smear: a motion arc on a hero's active frames.
    if (f.side === 'hero' && f.state === 'attack' && phaseOf(f) === 'active' && f.move.reach && f.move.pose !== 'tagIn') {
      const s = f.def.scale;
      const r = f.move.reach[1] * s * 0.8;
      const cy = y - (f.move.pose === 'highKick' ? 36 : 31) * s;
      const a0 = f.facing > 0 ? -0.9 : Math.PI - 0.5;
      ac.save();
      ac.lineWidth = f.move.blade ? 4 : 3;
      ac.strokeStyle = f.move.blade ? '#e6f0ff' : f.def.style.accent;
      ac.beginPath();
      ac.arc(Math.round(x), Math.round(cy), r, a0, a0 + 1.4);
      ac.stroke();
      ac.restore();
    }
    if (f.side === 'hero' && f.state === 'attack' && ['tagIn', 'quake'].includes(f.move.pose) && phaseOf(f) !== 'recovery') {
      ac.save();
      ac.strokeStyle = f.def.style.accent;
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
      if (s.kind === 'ring') {
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
    const cast = [
      { def: HEROES.shark, x: 150, z: 236, facing: 1 },
      { def: HEROES.nova, x: 104, z: 210, facing: 1 },
      { def: ENEMIES.bruiser, x: 350, z: 214, facing: -1 },
      { def: ENEMIES.punk, x: 318, z: 244, facing: -1 },
    ];
    for (const c of cast) this.drawShadow(c.x, c.z, 0, c.def.scale);
    this.drawActors(cast.map((c, i) => ({
      z: c.z,
      draw: () => drawRig(this.ac, c.x, c.z, c.facing, POSES.idle, c.def.style, c.def.scale, { t, bob: Math.sin(t * 4 + i) * 0.6 }),
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
      tag = can ? 'TAG: SPACE' : 'TAG …';
      tagColour = can ? P.yellow : P.dim;
    }
    this.text(tag, x0 + 120 * u, y0 + 32 * u, { size: 4.5 * u, colour: tagColour });

    this.text(`${g.score}`.padStart(6, '0'), x0 + this.gw - 10 * u, y0 + 13 * u, { size: 10 * u, align: 'right', colour: P.paper });
    if (v.muted) this.text('SOUND OFF', x0 + this.gw - 10 * u, y0 + 25 * u, { size: 4.5 * u, colour: P.dim, align: 'right' });

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
      this.text(`P resume  ·  Q arcade  ·  M sound ${v.muted ? 'on' : 'off'}`, cx, cy + 14 * u, { size: 7 * u, colour: P.dim, align: 'center' });
    } else if (g.state === 'gameOver' && g.stateTime > 0.8) {
      this.dim();
      this.text('GAME OVER', cx, cy - 24 * u, { size: 24 * u, colour: P.red, align: 'center' });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text('ENTER retry  ·  Q arcade', cx, cy + 22 * u, { size: 7 * u, colour: P.yellow, align: 'center' });
    } else if (g.state === 'stageClear' && g.stateTime > 0.5) {
      this.dim();
      this.text('BLOCK CLEARED!', cx, cy - 24 * u, { size: 22 * u, colour: P.yellow, align: 'center', shadow: P.red });
      this.text(`SCORE ${g.score}   ·   BEST ${v.best}`, cx, cy + 2 * u, { size: 8 * u, align: 'center' });
      if (g.stateTime > 1.5) this.text('ENTER play again  ·  Q arcade', cx, cy + 22 * u, { size: 7 * u, colour: P.paper, align: 'center' });
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
    if (Math.floor(v.time * 2) % 2 === 0) this.text('PRESS ENTER', cx, y0 + 96 * u, { size: 12 * u, colour: P.paper, align: 'center', shadow: P.red });
    if (v.best > 0) this.text(`BEST ${v.best}`, cx, y0 + 112 * u, { size: 6 * u, colour: P.dim, align: 'center' });

    const lines = [
      'MOVE  arrows/WASD     RUN  tap → →     ATTACK  J/Z     JUMP  K/X',
      'SPECIAL  L/C  (throw · in the air: dive)     TAG PARTNER  Space',
    ];
    this.panel(this.gx + 30 * u, y0 + this.gh - 26 * u, this.gw - 60 * u, 21 * u);
    lines.forEach((l, i) => this.text(l, cx, y0 + this.gh - (19 - i * 8) * u, { size: 4.6 * u, colour: P.paper, align: 'center' }));
  }
}
