// The New York block, pre-drawn once from a seeded random generator (same street every visit).
//
// Late-afternoon light from the left: warm highlights on left edges, cool lavender shadows.
// Layers, back to front:
//   sky + clouds (0.08 parallax) → hazy skyline (0.25) → the block's facades and sidewalk props (1.0)
//   → the road you fight on (1.0). Steam from manholes is animated per frame.

import { W, H, FLOOR } from './config.js';

export const SIDEWALK_TOP = FLOOR.top - 22;
const SIGNS = ['DELI', 'PIZZA', 'BODEGA', 'LAUNDRY', 'HARDWARE', 'SUBS', 'CAFE', 'TAILOR', 'ARCADE', 'NOODLES', 'BAKERY', 'RECORDS'];
const POSTERS = [['BLOCK', 'PARTY'], ['LOST', 'CAT'], ['GUTTER', 'KINGS?'], ['LIVE', 'MUSIC'], ['FOR', 'RENT']];
const TAG_COLOURS = ['#ff4d6d', '#4dd2ff', '#ffd23f', '#7cff4f', '#c77dff', '#ff9f1c'];

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  return [cv, cv.getContext('2d')];
}

/** Shift a hex colour lighter (f > 1) or darker (f < 1). Shadows lean lavender. */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => (f < 1 ? v * f + [40, 30, 62][i] * (1 - f) * 0.5 : v + (255 - v) * (f - 1)));
  return `rgb(${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;
}

export class Scenery {
  constructor(stage) {
    this.r = seeded(21);
    this.sky = this.buildSky(stage);
    this.skyline = this.buildSkyline(stage);
    this.manholes = [];
    this.block = this.buildBlock(stage);
    this.road = this.buildRoad(stage);
  }

  pick(list) {
    return list[Math.floor(this.r() * list.length)];
  }

  // ------------------------------------------------------------ sky and skyline

  buildSky(stage) {
    const [cv, g] = canvas((stage.length - W) * 0.08 + W + 40, SIDEWALK_TOP);
    const grad = g.createLinearGradient(0, 0, 0, cv.height);
    grad.addColorStop(0, '#5d6ea6');
    grad.addColorStop(0.55, '#b49ac0');
    grad.addColorStop(1, '#f0b98e');
    g.fillStyle = grad;
    g.fillRect(0, 0, cv.width, cv.height);
    const r = seeded(9);
    for (let i = 0; i < cv.width / 90; i++) {
      // Pixel clouds: three stacked tones of puffs, lit from the left.
      const cx = r() * cv.width;
      const cy = 12 + r() * 50;
      const n = 3 + Math.floor(r() * 4);
      for (const [dy, col, sc] of [[2, '#a98fb0', 1], [0, '#d9b3c4', 0.9], [-1, '#f6dccb', 0.55]]) {
        g.fillStyle = col;
        for (let j = 0; j < n; j++) {
          g.beginPath();
          g.ellipse(Math.round(cx + j * 9 - (dy < 0 ? 3 : 0)), Math.round(cy + dy - (j % 2) * 3), 9 * sc, 5 * sc, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    return cv;
  }

  buildSkyline(stage) {
    const [cv, g] = canvas((stage.length - W) * 0.25 + W + 40, SIDEWALK_TOP);
    const r = seeded(3);
    for (let x = -10; x < cv.width;) {
      const w = Math.round(14 + r() * 28);
      const h = Math.round(50 + r() * 75);
      const top = SIDEWALK_TOP - h;
      const base = r() < 0.5 ? '#8d84b0' : '#7f7aa3'; // hazy with distance
      g.fillStyle = base;
      g.fillRect(Math.round(x), top, w, h);
      g.fillStyle = shade(base, 1.12); // sunlit left edge
      g.fillRect(Math.round(x), top, 2, h);
      if (r() < 0.18) {
        g.fillStyle = base;
        g.fillRect(Math.round(x + w / 2 - 3), top - 14, 6, 14);
        g.fillRect(Math.round(x + w / 2 - 1), top - 28, 2, 14);
      }
      g.fillStyle = shade(base, 0.85);
      for (let wy = top + 4; wy < SIDEWALK_TOP - 3; wy += 4) {
        for (let wx = x + 3; wx < x + w - 2; wx += 4) if (r() < 0.5) g.fillRect(Math.round(wx), wy, 2, 2);
      }
      x += w + r() * 3;
    }
    return cv;
  }

  // ------------------------------------------------------------ the block

  buildBlock(stage) {
    const [cv, g] = canvas(stage.length + W + 60, FLOOR.top);
    const r = this.r;
    for (let x = -20; x < cv.width;) {
      const w = Math.round(110 + r() * 90);
      const top = Math.round(14 + r() * 60);
      this.building(g, x, top, w);
      x += w;
    }
    this.sidewalk(g, cv.width);
    this.props(g, cv.width);
    return cv;
  }

  building(g, x, top, w) {
    const r = this.r;
    const kind = this.pick(['brick', 'brick', 'stone', 'brownstone']);
    const groundTop = SIDEWALK_TOP - 40;
    const base = { brick: this.pick(['#8a4433', '#7a3b2e', '#93503a']), stone: '#a79fae', brownstone: '#7b5442' }[kind];

    // Wall.
    g.fillStyle = base;
    g.fillRect(x, top, w, groundTop - top);
    if (kind === 'brick') {
      // Individual bricks with tone jitter, lighter mortar.
      g.fillStyle = shade(base, 1.25);
      for (let by = top; by < groundTop; by += 4) g.fillRect(x, by, w, 1);
      for (let by = top + 1; by < groundTop; by += 4) {
        for (let bx = x + ((by / 4) % 2 ? 0 : 4); bx < x + w; bx += 8) {
          g.fillStyle = shade(base, 1.25);
          g.fillRect(bx, by, 1, 3);
          const roll = r();
          if (roll < 0.35) {
            g.fillStyle = shade(base, roll < 0.17 ? 0.85 : 1.08);
            g.fillRect(bx + 1, by, 7, 3);
          }
        }
      }
    } else if (kind === 'stone') {
      // Dressed stone blocks with joints and the odd crack.
      g.fillStyle = shade(base, 0.82);
      for (let by = top + 9; by < groundTop; by += 10) g.fillRect(x, by, w, 1);
      for (let by = top; by < groundTop; by += 10) {
        for (let bx = x + ((by / 10) % 2 ? 6 : 18); bx < x + w; bx += 24) g.fillRect(bx, by, 1, 10);
      }
      for (let i = 0; i < w / 40; i++) {
        let cx = x + r() * w;
        let cy = top + r() * (groundTop - top);
        g.fillStyle = shade(base, 0.7);
        for (let s = 0; s < 8; s++) {
          g.fillRect(Math.round(cx), Math.round(cy), 1, 1);
          cx += r() < 0.5 ? 1 : 0;
          cy += 1;
        }
      }
    } else {
      g.fillStyle = shade(base, 0.9);
      for (let by = top + 5; by < groundTop; by += 6) g.fillRect(x, by, w, 1);
    }
    // Weather streaks.
    g.fillStyle = 'rgba(40, 30, 62, 0.12)';
    for (let i = 0; i < w / 18; i++) g.fillRect(Math.round(x + r() * w), top + 4, 1, Math.round(10 + r() * 50));
    // Sunlit left edge, shadowed right edge (light from the left).
    g.fillStyle = 'rgba(255, 228, 190, 0.25)';
    g.fillRect(x, top, 3, groundTop - top);
    g.fillStyle = 'rgba(40, 30, 62, 0.35)';
    g.fillRect(x + w - 4, top, 4, groundTop - top);

    // Cornice: a projecting ledge with a lit top and a shadow under it.
    g.fillStyle = kind === 'stone' ? '#8a8294' : '#5a4650';
    g.fillRect(x - 3, top - 6, w + 6, 6);
    g.fillStyle = '#e6d6c4';
    g.fillRect(x - 3, top - 6, w + 6, 1);
    g.fillStyle = 'rgba(40, 30, 62, 0.45)';
    g.fillRect(x, top, w, 3);
    for (let dx = x; dx < x + w; dx += 6) {
      g.fillStyle = '#6f6075';
      g.fillRect(dx, top - 1, 3, 2); // dentils
    }

    // Windows.
    const cols = Math.max(2, Math.floor((w - 14) / 22));
    const gap = (w - cols * 12) / (cols + 1);
    for (let wy = top + 12; wy < groundTop - 22; wy += 26) {
      for (let i = 0; i < cols; i++) this.window(g, Math.round(x + gap + i * (12 + gap)), wy, kind);
    }
    if (kind === 'brick' && r() < 0.7) this.fireEscape(g, Math.round(x + gap * 0.5 + (cols > 3 ? 12 + gap : 0)), top, groundTop, Math.min(56, w * 0.45));
    if (top < 60 && r() < 0.5) this.waterTower(g, Math.round(x + w * (0.2 + r() * 0.5)), top - 6);

    // Ground floor.
    this.storefront(g, x, groundTop, w, kind);
  }

  window(g, x, y, kind) {
    const r = this.r;
    // Lintel, recess shadow, glass with a diagonal reflection, sill with shadow.
    g.fillStyle = kind === 'stone' ? '#ccc3cf' : '#d9cbb8';
    g.fillRect(x - 2, y - 3, 16, 3);
    g.fillStyle = '#3a3048';
    g.fillRect(x - 1, y, 14, 18);
    const lit = r() < 0.22;
    const glass = lit ? '#f4c579' : this.pick(['#5d6a8c', '#6b7ba0', '#4f5a7a']);
    g.fillStyle = glass;
    g.fillRect(x + 1, y + 1, 11, 16);
    g.fillStyle = lit ? '#ffe1a6' : 'rgba(220, 230, 255, 0.35)';
    for (let i = 0; i < 6; i++) g.fillRect(x + 2 + i, y + 9 - i, 2, 1);
    for (let i = 0; i < 3; i++) g.fillRect(x + 7 + i, y + 15 - i, 2, 1);
    if (lit && r() < 0.5) {
      g.fillStyle = '#b55a4a'; // curtain
      g.fillRect(x + 1, y + 1, 3, 16);
    }
    g.fillStyle = '#2a2236';
    g.fillRect(x + 6, y + 1, 1, 16); // mullion
    g.fillRect(x + 1, y + 8, 11, 1);
    g.fillStyle = '#e6d6c4';
    g.fillRect(x - 2, y + 18, 16, 2);
    g.fillStyle = 'rgba(40, 30, 62, 0.4)';
    g.fillRect(x - 1, y + 20, 15, 2);
    if (!lit && r() < 0.12) {
      g.fillStyle = '#b8b6bc'; // window AC unit
      g.fillRect(x + 1, y + 11, 10, 6);
      g.fillStyle = '#8a8890';
      for (let i = 0; i < 4; i++) g.fillRect(x + 2 + i * 2, y + 12, 1, 4);
    }
  }

  fireEscape(g, x, top, bottom, w) {
    const ink = '#1d1820';
    const lit = '#5a4f60';
    for (let fy = top + 34; fy < bottom - 6; fy += 26) {
      g.fillStyle = 'rgba(40, 30, 62, 0.35)';
      g.fillRect(x + 2, fy + 2, w, 3); // shadow on the wall
      g.fillStyle = ink;
      g.fillRect(x, fy, w, 2);
      g.fillRect(x, fy - 8, w, 1);
      g.fillStyle = lit;
      g.fillRect(x, fy, w, 1);
      g.fillStyle = ink;
      for (let px = x; px <= x + w; px += 5) g.fillRect(px, fy - 8, 1, 8);
      for (let s = 0; s < 22; s += 2) {
        g.fillRect(x + 6 + s, fy + 2 + s, 3, 1);
        g.fillRect(x + 6 + s, fy + 1 + s, 1, 1);
      }
    }
  }

  waterTower(g, x, y) {
    g.fillStyle = '#2e2530';
    for (const lx of [x + 2, x + 9, x + 16]) g.fillRect(lx, y - 10, 1, 10);
    g.fillRect(x, y - 6, 19, 1);
    g.fillStyle = '#7a5236';
    g.fillRect(x, y - 28, 19, 18);
    g.fillStyle = '#9a6c48';
    g.fillRect(x, y - 28, 5, 18); // sunlit side
    g.fillStyle = '#4a3226';
    g.fillRect(x, y - 23, 19, 1);
    g.fillRect(x, y - 16, 19, 1);
    g.fillStyle = '#5a3a2a';
    g.beginPath();
    g.moveTo(x - 1, y - 28);
    g.lineTo(x + 9.5, y - 37);
    g.lineTo(x + 20, y - 28);
    g.fill();
    g.fillStyle = '#7a5236';
    g.beginPath();
    g.moveTo(x - 1, y - 28);
    g.lineTo(x + 9.5, y - 37);
    g.lineTo(x + 6, y - 28);
    g.fill();
  }

  storefront(g, x, y, w, kind) {
    const r = this.r;
    const bottom = SIDEWALK_TOP;
    // Stone base course and pilasters.
    g.fillStyle = '#9b94a3';
    g.fillRect(x, y, w, bottom - y);
    g.fillStyle = '#b5aebd';
    g.fillRect(x, y, w, 2);
    const shuttered = r() < 0.25;
    // Sign band.
    g.fillStyle = '#2a2230';
    g.fillRect(x + 6, y + 2, w - 12, 10);
    g.fillStyle = this.pick(['#ffd23f', '#ff6b6b', '#7ce0ff', '#f2ede4']);
    g.font = 'bold 8px monospace';
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.fillText(this.pick(SIGNS), x + w / 2, y + 7);

    const winX = x + 10;
    const winW = w - 42;
    const winY = y + 20;
    const winH = bottom - winY - 4;
    if (shuttered) {
      g.fillStyle = '#8e8a94'; // roll-down shutter, ribbed, tagged
      g.fillRect(winX, y + 14, winW, bottom - y - 16);
      g.fillStyle = '#6e6a74';
      for (let sy = y + 15; sy < bottom - 2; sy += 2) g.fillRect(winX, sy, winW, 1);
      this.graffiti(g, winX + 4, y + 18, winW - 8);
    } else {
      // Awning: stripes, scalloped hem, shadow underneath.
      const stripe = this.pick([['#b33a2b', '#f2ede4'], ['#2f6b3f', '#f2ede4'], ['#2a4c8c', '#f2ede4'], ['#7a2a52', '#f2d9b0']]);
      for (let ax = winX - 4; ax < winX + winW + 4; ax += 5) {
        g.fillStyle = stripe[Math.floor((ax - winX) / 5) & 1];
        g.fillRect(ax, y + 13, 5, 6);
        g.fillRect(ax + 1, y + 19, 3, 2);
      }
      g.fillStyle = 'rgba(255, 255, 255, 0.25)';
      g.fillRect(winX - 4, y + 13, winW + 8, 1);
      // Glass with interior shapes and diagonal reflections.
      const glass = g.createLinearGradient(0, winY, 0, winY + winH);
      glass.addColorStop(0, '#3a3a58');
      glass.addColorStop(1, '#6b789a');
      g.fillStyle = glass;
      g.fillRect(winX, winY, winW, winH);
      g.fillStyle = 'rgba(40, 30, 62, 0.5)';
      g.fillRect(winX, winY, winW, 3); // awning shadow
      g.fillStyle = '#2c2a40';
      for (let sx = winX + 4; sx < winX + winW - 8; sx += 14) g.fillRect(sx, winY + 8, 9, winH - 10); // shelves
      g.fillStyle = 'rgba(244, 197, 121, 0.55)';
      for (let sx = winX + 5; sx < winX + winW - 8; sx += 14) for (let sy = winY + 9; sy < winY + winH - 3; sy += 4) if (r() < 0.6) g.fillRect(sx + Math.floor(r() * 6), sy, 2, 2);
      g.fillStyle = 'rgba(230, 236, 255, 0.28)';
      for (let i = 0; i < winW; i += 22) {
        for (let k = 0; k < winH; k++) g.fillRect(winX + i + k * 0.6, winY + winH - k, 4, 1);
      }
      g.fillStyle = '#d0c8d6';
      g.fillRect(winX, winY + winH, winW, 2);
    }
    // Door.
    const dx = x + w - 28;
    g.fillStyle = '#3a2a2a';
    g.fillRect(dx, y + 16, 16, bottom - y - 16);
    g.fillStyle = '#5c6a8a';
    g.fillRect(dx + 3, y + 19, 10, 12);
    g.fillStyle = '#d4a531';
    g.fillRect(dx + 12, y + 34, 2, 2);
    // A poster on the pilaster.
    if (r() < 0.6) {
      const [a, b] = this.pick(POSTERS);
      const px = x + 1;
      g.fillStyle = this.pick(['#f2ede4', '#ffd23f', '#9fd8ff']);
      g.fillRect(px, y + 16, 8, 14);
      g.fillStyle = '#2a2230';
      g.font = 'bold 3px monospace';
      g.fillText(a, px + 4, y + 20);
      g.fillText(b, px + 4, y + 24);
    }
  }

  graffiti(g, x, y, w) {
    const r = this.r;
    const colour = this.pick(TAG_COLOURS);
    const pts = Array.from({ length: 5 }, (_, i) => [x + (i / 4) * w, y + 4 + r() * 14]);
    for (const [lw, c] of [[6, '#120d16'], [3.5, colour], [1, shade(colour, 1.4)]]) {
      g.strokeStyle = c;
      g.lineWidth = lw;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(...pts[0]);
      for (let i = 1; i < pts.length; i++) g.quadraticCurveTo(pts[i - 1][0] + 4, pts[i - 1][1] - 8 + r() * 16, pts[i][0], pts[i][1]);
      g.stroke();
    }
  }

  sidewalk(g, width) {
    const r = this.r;
    const h = FLOOR.top - SIDEWALK_TOP - 4;
    g.fillStyle = '#4a4458';
    g.fillRect(0, SIDEWALK_TOP - 1, width, 2);
    const slab = g.createLinearGradient(0, SIDEWALK_TOP, 0, SIDEWALK_TOP + h);
    slab.addColorStop(0, '#9c96a6');
    slab.addColorStop(1, '#b8b2bf');
    g.fillStyle = slab;
    g.fillRect(0, SIDEWALK_TOP + 1, width, h);
    g.fillStyle = 'rgba(40, 30, 62, 0.25)';
    g.fillRect(0, SIDEWALK_TOP + 1, width, 3); // shadow of the buildings
    // Slab joints drawn in perspective, plus cracks and gum spots.
    g.fillStyle = '#857f90';
    for (let jx = 0; jx < width; jx += 26) {
      for (let k = 0; k < h; k++) g.fillRect(Math.round(jx + k * 0.5), SIDEWALK_TOP + 1 + k, 1, 1);
    }
    g.fillRect(0, SIDEWALK_TOP + 9, width, 1);
    for (let i = 0; i < width / 30; i++) {
      let cx = r() * width;
      let cy = SIDEWALK_TOP + 3 + r() * (h - 4);
      for (let s = 0; s < 6; s++) {
        g.fillRect(Math.round(cx), Math.round(cy), 1, 1);
        cx += 1;
        cy += r() < 0.5 ? 1 : -1;
      }
    }
    // Curb: lit top, face, gutter.
    g.fillStyle = '#d8d2dc';
    g.fillRect(0, FLOOR.top - 4, width, 2);
    g.fillStyle = '#857f90';
    g.fillRect(0, FLOOR.top - 2, width, 2);
  }

  props(g, width) {
    const r = this.r;
    const base = SIDEWALK_TOP + 14; // where props stand
    for (let x = 60; x < width;) {
      const kind = this.pick(['tree', 'tree', 'lamp', 'bench', 'news', 'hydrant', 'planter', 'trash']);
      this[kind](g, Math.round(x), base);
      x += { tree: 120, lamp: 70, bench: 90, news: 50, hydrant: 50, planter: 70, trash: 50 }[kind] + r() * 80;
    }
  }

  tree(g, x, y) {
    const r = this.r;
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.beginPath();
    g.ellipse(x + 8, y + 1, 18, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#5a4a44';
    g.fillRect(x - 6, y - 1, 14, 3); // tree pit
    g.fillStyle = '#4a3428';
    g.fillRect(x, y - 44, 4, 44);
    g.fillStyle = '#6e4e3a';
    g.fillRect(x, y - 44, 1, 44);
    // Foliage: clusters in four greens, lit from the upper left.
    const clusters = Array.from({ length: 9 }, () => [x + 2 + (r() - 0.5) * 40, y - 58 + (r() - 0.5) * 28, 8 + r() * 6]);
    for (const [col, dx, dy, s] of [['#1f3a2a', 2, 2, 1], ['#2f5a3a', 0, 0, 0.95], ['#4a7a44', -2, -2, 0.7], ['#7aa858', -4, -4, 0.35]]) {
      g.fillStyle = col;
      for (const [cx, cy, cr] of clusters) {
        g.beginPath();
        g.arc(Math.round(cx + dx), Math.round(cy + dy), cr * s, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  lamp(g, x, y) {
    const glow = g.createRadialGradient(x + 7, y - 66, 2, x + 7, y - 66, 26);
    glow.addColorStop(0, 'rgba(255, 226, 168, 0.4)');
    glow.addColorStop(1, 'rgba(255, 226, 168, 0)');
    g.fillStyle = glow;
    g.fillRect(x - 20, y - 92, 54, 54);
    g.fillStyle = '#2a2a34';
    g.fillRect(x, y - 68, 3, 68);
    g.fillRect(x - 2, y - 3, 7, 3);
    g.fillRect(x, y - 70, 12, 2);
    g.fillStyle = '#5a5a68';
    g.fillRect(x, y - 68, 1, 68);
    g.fillStyle = '#ffe2a8';
    g.fillRect(x + 8, y - 68, 5, 2);
  }

  bench(g, x, y) {
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.fillRect(x - 1, y - 1, 34, 3);
    g.fillStyle = '#1d1820';
    g.fillRect(x + 2, y - 10, 2, 10);
    g.fillRect(x + 28, y - 10, 2, 10);
    g.fillStyle = '#8a3a44';
    g.fillRect(x, y - 12, 32, 3);
    g.fillRect(x, y - 20, 32, 3);
    g.fillRect(x, y - 16, 32, 2);
    g.fillStyle = '#b5555e';
    g.fillRect(x, y - 12, 32, 1);
    g.fillRect(x, y - 20, 32, 1);
    g.fillStyle = '#f2ede4';
    g.fillRect(x + 18, y - 13, 7, 2); // a newspaper left behind
  }

  news(g, x, y) {
    const col = this.pick(['#c0392b', '#2a5aa8', '#e5b839']);
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.fillRect(x - 1, y - 1, 13, 3);
    g.fillStyle = shade(col, 0.7);
    g.fillRect(x, y - 22, 12, 22);
    g.fillStyle = col;
    g.fillRect(x, y - 22, 9, 22);
    g.fillStyle = '#d8d2dc';
    g.fillRect(x + 2, y - 18, 6, 6);
    g.fillStyle = '#2a2230';
    g.fillRect(x + 3, y - 16, 4, 1);
    g.fillRect(x + 3, y - 14, 3, 1);
  }

  hydrant(g, x, y) {
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.fillRect(x - 2, y - 1, 11, 3);
    g.fillStyle = '#8f2a22';
    g.fillRect(x, y - 12, 7, 12);
    g.fillStyle = '#d6402b';
    g.fillRect(x, y - 12, 4, 12);
    g.fillRect(x - 2, y - 8, 11, 3);
    g.fillRect(x + 1, y - 15, 5, 3);
    g.fillStyle = '#ff8a6a';
    g.fillRect(x + 1, y - 11, 1, 8);
  }

  planter(g, x, y) {
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.fillRect(x - 1, y - 1, 20, 3);
    g.fillStyle = '#8a8496';
    g.fillRect(x, y - 12, 18, 12);
    g.fillStyle = '#aaa4b6';
    g.fillRect(x, y - 12, 18, 2);
    g.fillRect(x, y - 12, 3, 12);
    for (const [col, dy, s] of [['#2f5a3a', 0, 1], ['#4a7a44', -2, 0.7], ['#7aa858', -3, 0.35]]) {
      g.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(x + 3 + i * 4, y - 15 + dy - (i % 2) * 2, 5 * s, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  trash(g, x, y) {
    g.fillStyle = 'rgba(40, 30, 62, 0.3)';
    g.fillRect(x - 1, y - 1, 12, 3);
    g.fillStyle = '#4a5a4e';
    g.fillRect(x, y - 15, 10, 15);
    g.fillStyle = '#6a7a6e';
    g.fillRect(x, y - 15, 3, 15);
    g.fillStyle = '#3a4a3e';
    for (let i = 2; i < 15; i += 3) g.fillRect(x, y - i, 10, 1);
    g.fillStyle = '#2a2230';
    g.fillRect(x - 1, y - 16, 12, 2);
  }

  // ------------------------------------------------------------ the road

  buildRoad(stage) {
    const [cv, g] = canvas(stage.length + W + 60, H - FLOOR.top);
    const r = seeded(5);
    const h = cv.height;
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#46434f');
    grad.addColorStop(1, '#5a5664');
    g.fillStyle = grad;
    g.fillRect(0, 0, cv.width, h);
    // Aggregate texture.
    for (let i = 0; i < cv.width * 3; i++) {
      const roll = r();
      g.fillStyle = roll < 0.4 ? '#3c3946' : roll < 0.8 ? '#64606e' : '#7a7684';
      g.fillRect(Math.floor(r() * cv.width), Math.floor(r() * h), 1, 1);
    }
    // Patches of newer, darker asphalt with tar seams.
    for (let i = 0; i < cv.width / 160; i++) {
      const px = Math.round(r() * cv.width);
      const py = Math.round(6 + r() * (h - 26));
      const pw = Math.round(30 + r() * 50);
      const ph = Math.round(10 + r() * 14);
      g.fillStyle = '#3a3742';
      g.fillRect(px, py, pw, ph);
      g.fillStyle = '#2a2830';
      g.strokeStyle = '#2a2830';
      g.strokeRect(px + 0.5, py + 0.5, pw, ph);
    }
    // Gutter shade under the curb.
    g.fillStyle = 'rgba(30, 22, 44, 0.45)';
    g.fillRect(0, 0, cv.width, 4);
    // Faded double yellow and white lane dashes.
    const mid = Math.round(h * 0.46);
    g.fillStyle = '#c9a744';
    for (let x = 0; x < cv.width; x++) {
      if (r() < 0.9) g.fillRect(x, mid, 1, 1);
      if (r() < 0.9) g.fillRect(x, mid + 3, 1, 1);
    }
    g.fillStyle = '#c9c4ba';
    for (let lx = 0; lx < cv.width; lx += 44) {
      for (let x = lx; x < lx + 22; x++) if (r() < 0.85) g.fillRect(x, Math.round(h * 0.82), 1, 1);
    }
    // Crosswalks where the wave zones start.
    for (const zone of stage.zones) {
      if (!zone.trigger) continue;
      for (let sy = 6; sy < h - 4; sy += 9) {
        g.fillStyle = '#d8d3c8';
        g.fillRect(zone.trigger + 60, sy, 38, 5);
        g.fillStyle = 'rgba(70, 67, 79, 0.6)';
        for (let i = 0; i < 12; i++) g.fillRect(zone.trigger + 60 + Math.floor(r() * 38), sy + Math.floor(r() * 5), 2, 1);
      }
    }
    // Cracks.
    g.fillStyle = '#2e2b36';
    for (let i = 0; i < cv.width / 40; i++) {
      let cx = r() * cv.width;
      let cy = 6 + r() * (h - 10);
      for (let s = 0; s < 14; s++) {
        g.fillRect(Math.round(cx), Math.round(cy), 1, 1);
        cx += 1;
        cy += r() < 0.5 ? (r() < 0.5 ? -1 : 1) : 0;
      }
    }
    // Potholes with rubble (lit rims on the far edge).
    for (let i = 0; i < cv.width / 420; i++) {
      const px = Math.round(200 + r() * (cv.width - 300));
      const py = Math.round(14 + r() * (h - 30));
      g.fillStyle = '#7a7684';
      g.beginPath();
      g.ellipse(px, py, 15, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2a2632';
      g.beginPath();
      g.ellipse(px, py + 1, 13, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5a4e48';
      g.beginPath();
      g.ellipse(px + 1, py + 2, 9, 2, 0, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 6; k++) {
        g.fillStyle = r() < 0.5 ? '#8e8a98' : '#a8a4b2';
        g.fillRect(px - 18 + Math.floor(r() * 36), py - 4 + Math.floor(r() * 10), 2, 2);
      }
    }
    // Manholes (steam rises from these).
    for (let mx = 180 + r() * 120; mx < cv.width; mx += 280 + r() * 200) {
      const my = Math.round(20 + r() * (h - 36));
      this.manholes.push({ x: Math.round(mx), z: FLOOR.top + my });
      g.fillStyle = '#34313c';
      g.beginPath();
      g.ellipse(mx, my, 11, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#6a6674';
      g.beginPath();
      g.ellipse(mx, my - 1, 10, 3, 0, Math.PI, Math.PI * 2);
      g.fill();
      g.fillStyle = '#4a4654';
      for (let i = -6; i <= 6; i += 3) g.fillRect(Math.round(mx + i), my - 1, 1, 2);
    }
    return cv;
  }

  // ------------------------------------------------------------ per frame

  draw(lc, camX, t) {
    lc.drawImage(this.sky, -Math.round(camX * 0.08), 0);
    lc.drawImage(this.skyline, -Math.round(camX * 0.25), 0);
    lc.drawImage(this.block, -Math.round(camX), 0);
    lc.drawImage(this.road, -Math.round(camX), FLOOR.top);
    // Steam drifting up from the manholes.
    lc.save();
    for (const m of this.manholes) {
      const sx = m.x - camX;
      if (sx < -30 || sx > W + 30) continue;
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.5 + i / 5) % 1;
        lc.globalAlpha = 0.3 * (1 - k);
        lc.fillStyle = '#ece8f0';
        lc.beginPath();
        lc.arc(Math.round(sx + Math.sin(t * 2 + i) * 5 * k), Math.round(m.z - 4 - k * 40), 4 + k * 9, 0, Math.PI * 2);
        lc.fill();
      }
    }
    lc.restore();
  }
}
