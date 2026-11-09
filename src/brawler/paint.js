// Shared painting helpers for the brawler's code-drawn characters: one light, three-tone cel
// shading, outlines. Used by rig.js (everyone) and razorfin.js (the shark's own renderer).

const TAU = Math.PI * 2;

export const OUTLINE = '#141019';
export const LIGHT = (() => {
  const v = [-0.5, -0.85];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l];
})();

// ---- colour helpers (cached): f < 1 darkens towards a cool purple shadow, f > 1 lightens.
const toneCache = new Map();
export function tone(hex, f) {
  const key = hex + f;
  if (toneCache.has(key)) return toneCache.get(key);
  const n = parseInt(hex.slice(1), 16);
  let rgb = [n >> 16, (n >> 8) & 255, n & 255];
  if (f < 1) {
    const shadow = [40, 28, 60]; // shadows lean lavender, as in the reference art
    rgb = rgb.map((v, i) => v * f + shadow[i] * (1 - f) * 0.6);
  } else {
    rgb = rgb.map((v) => v + (255 - v) * (f - 1));
  }
  const out = `rgb(${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;
  toneCache.set(key, out);
  return out;
}

// ---- shapes
export function capsulePath(c, a, b, r1, r2) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  c.beginPath();
  c.arc(a[0], a[1], Math.max(0.1, r1), ang + Math.PI / 2, ang - Math.PI / 2);
  c.arc(b[0], b[1], Math.max(0.1, r2), ang - Math.PI / 2, ang + Math.PI / 2);
  c.closePath();
}

export const off = (p, r, f) => [p[0] + LIGHT[0] * r * f, p[1] + LIGHT[1] * r * f];

/** A cel-shaded capsule: shadow, base towards the light, highlight. */
export function shadedCapsule(c, a, b, r1, r2, colour, pass, o, flat) {
  if (pass === 0) {
    capsulePath(c, a, b, r1 + o, r2 + o);
    c.fillStyle = OUTLINE;
    c.fill();
    return;
  }
  if (flat) {
    capsulePath(c, a, b, r1, r2);
    c.fillStyle = flat;
    c.fill();
    return;
  }
  c.save();
  capsulePath(c, a, b, r1, r2);
  c.fillStyle = tone(colour, 0.62);
  c.fill();
  c.clip();
  capsulePath(c, off(a, r1, 0.45), off(b, r2, 0.45), r1 * 0.85, r2 * 0.85);
  c.fillStyle = colour;
  c.fill();
  capsulePath(c, off(a, r1, 0.62), off(b, r2, 0.62), r1 * 0.28, r2 * 0.28);
  c.fillStyle = tone(colour, 1.3);
  c.fill();
  c.restore();
}

export function polyPath(c, pts) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
  c.closePath();
}

/** Cel-shade any closed shape given a path function and a rough centre + size. */
export function shadedShape(c, path, centre, size, colour, pass, o, flat) {
  if (pass === 0) {
    path(o);
    c.fillStyle = OUTLINE;
    c.fill();
    return;
  }
  path(0);
  c.fillStyle = flat || tone(colour, 0.62);
  c.fill();
  if (flat) return;
  c.save();
  path(0);
  c.clip();
  c.fillStyle = colour;
  c.beginPath();
  c.arc(...off(centre, size, 0.55), size * 1.05, 0, TAU);
  c.fill();
  c.fillStyle = tone(colour, 1.3);
  c.beginPath();
  c.arc(...off(centre, size, 0.95), size * 0.3, 0, TAU);
  c.fill();
  c.restore();
}

export function limb(x, y, facing, a, len) {
  return [x + Math.sin(a) * len * facing, y + Math.cos(a) * len];
}
