// Code-drawn fighters: one "rig" (head, torso, two-segment limbs) posed per action.
// An outline pass then a colour pass; the renderer then hardens edges so the 480 × 270 frame
// scales up as real pixel art.
//
// Angles are radians. 0 points straight down; positive swings towards the way the fighter faces;
// π/2 is straight ahead, π is straight up. Each limb is [upper, lower]: the upper angle is absolute,
// the lower is relative to the upper.

const TAU = Math.PI * 2;
const OUTLINE = '#120d16';

export const POSES = {
  idle: { lean: 0.05, armF: [0.6, 1.5], armB: [0.3, 1.4], legF: [0.18, -0.12], legB: [-0.18, -0.06] },
  // Nova
  jab: { lean: 0.12, armF: [1.57, 0.05], armB: [0.4, 1.6], legF: [0.4, -0.1], legB: [-0.35, 0] },
  cross: { lean: 0.22, armF: [0.5, 1.6], armB: [1.55, 0.05], legF: [0.4, -0.1], legB: [-0.4, 0] },
  highKick: { lean: -0.3, armF: [0.9, 1.2], armB: [-0.5, 1.2], legF: [2.0, 0], legB: [-0.1, -0.1] },
  flyKick: { lean: -0.2, armF: [1.2, 1.0], armB: [-0.8, 1.0], legF: [1.6, 0], legB: [-0.6, -1.4] },
  dash: { lean: 0.6, armF: [1.7, 0], armB: [-1.0, 0.3], legF: [0.9, -0.6], legB: [-1.0, -0.4] },
  diveKick: { lean: 0.3, armF: [2.2, 0.5], armB: [-0.8, 0.8], legF: [0.9, 0], legB: [-0.5, -1.4] },
  // Razorfin (sword follows the front forearm)
  slashWind: { lean: -0.1, armF: [-0.4, 1.9], armB: [0.2, 1.3], legF: [0.35, -0.15], legB: [-0.4, 0] },
  slash: { lean: 0.18, armF: [1.6, 0.1], armB: [0.3, 1.3], legF: [0.45, -0.15], legB: [-0.45, 0] },
  backslashWind: { lean: 0.1, armF: [2.4, 0.3], armB: [0.3, 1.3], legF: [0.4, -0.15], legB: [-0.4, 0] },
  backslash: { lean: 0.15, armF: [1.9, -0.8], armB: [0.3, 1.3], legF: [0.45, -0.15], legB: [-0.45, 0] },
  cleaveWind: { lean: -0.2, armF: [2.9, 0.3], armB: [2.6, 0.4], legF: [0.35, -0.2], legB: [-0.4, 0] },
  cleave: { lean: 0.4, armF: [1.4, -0.2], armB: [1.2, 0.3], legF: [0.6, -0.3], legB: [-0.5, 0] },
  airSlash: { lean: 0.2, armF: [1.3, 0.4], armB: [-0.4, 1.0], legF: [0.8, -1.4], legB: [0.2, -1.2] },
  rush: { lean: 0.7, armF: [0.9, 1.6], armB: [-0.6, 0.8], legF: [1.0, -0.8], legB: [-1.0, -0.3] },
  dive: { lean: 0.5, armF: [0.4, 0.2], armB: [2.5, 0.4], legF: [0.9, -1.4], legB: [0.3, -1.2] },
  quake: { lean: 0.6, armF: [0.5, 0.1], armB: [1.0, 0.5], legF: [0.9, -1.0], legB: [-0.7, -0.6] },
  // Shared
  throwWind: { lean: -0.2, armF: [-1.2, 1.2], armB: [0.6, 1.0], legF: [0.4, -0.15], legB: [-0.4, 0] },
  throw: { lean: 0.2, armF: [1.7, 0], armB: [-0.4, 1.0], legF: [0.45, -0.15], legB: [-0.45, 0] },
  tagIn: { lean: 0, armF: [1.57, 0], armB: [-1.57, 0], legF: [0.5, -0.1], legB: [-0.5, 0] },
  jump: { lean: 0, armF: [2.4, 0.4], armB: [2.0, 0.6], legF: [0.8, -1.6], legB: [0.2, -1.4] },
  hurt: { lean: -0.4, armF: [-0.5, 0.8], armB: [-0.8, 0.6], legF: [0.25, -0.1], legB: [-0.3, 0] },
  down: { lean: 0, armF: [2.8, 0], armB: [2.4, 0.3], legF: [0.2, 0], legB: [-0.1, 0] },
  getup: { lean: 0.5, armF: [0.8, 0.5], armB: [0.3, 0.6], legF: [1.2, -2.0], legB: [0.6, -1.8] },
  // Gang
  swipeWindup: { lean: -0.2, armF: [-1.0, 1.6], armB: [0.4, 1.2], legF: [0.35, -0.2], legB: [-0.35, 0] },
  swipe: { lean: 0.3, armF: [1.9, -0.3], armB: [0.2, 1.0], legF: [0.4, -0.1], legB: [-0.4, 0] },
  smashWindup: { lean: -0.35, armF: [3.0, 0.4], armB: [2.8, 0.5], legF: [0.4, -0.2], legB: [-0.4, 0] },
  smash: { lean: 0.5, armF: [1.4, 0.4], armB: [1.2, 0.5], legF: [0.5, -0.2], legB: [-0.5, 0] },
};

/** Walk and run cycles, generated from a phase so they loop smoothly. */
export function walkPose(phase, run = false) {
  const s = Math.sin(phase);
  const swing = run ? 0.9 : 0.5;
  return {
    lean: run ? 0.35 : 0.08,
    armF: [0.6 - (run ? 0.9 : 0.45) * s, run ? 1.7 : 1.3],
    armB: [0.3 + (run ? 0.9 : 0.45) * s, run ? 1.6 : 1.2],
    legF: [swing * s, -0.15 - (run ? 0.8 : 0.35) * Math.max(0, -s)],
    legB: [-swing * s, -0.15 - (run ? 0.8 : 0.35) * Math.max(0, s)],
  };
}

// Proportions at scale 1: about 54 px tall, a fifth of the 270 px screen.
const BODY = { legU: 12, legL: 12, torso: 18, armU: 9, armL: 9, head: 6.5, neck: 2.4 };

const BUILD = {
  nova: { limb: 5, torso: 9 },
  shark: { limb: 9, torso: 17, legScale: 0.8, head: 1.25 }, // massive arms, short legs, big head (as in the concept art)
  punk: { limb: 5, torso: 9 },
  bruiser: { limb: 7, torso: 14 },
};

function limb(x, y, facing, a, len) {
  return [x + Math.sin(a) * len * facing, y + Math.cos(a) * len];
}

/**
 * Draw a fighter with its feet at (x, y).
 * opts: { flash: all white, alpha, rotate: radians around the feet (knockdowns), t: time, bob: px }
 */
export function drawRig(c, x, y, facing, pose, style, scale = 1, opts = {}) {
  const k = scale;
  const b = BODY;
  const build = BUILD[style.kind] ?? BUILD.nova;
  const legK = build.legScale ?? 1;
  const limbW = build.limb * k;
  const torsoW = build.torso * k;
  const white = !!opts.flash;
  const col = (name) => (white ? '#ffffff' : name);

  c.save();
  c.globalAlpha = opts.alpha ?? 1;
  c.translate(Math.round(x), Math.round(y));
  if (opts.rotate) c.rotate(opts.rotate);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Skeleton.
  const hip = [0, -(b.legU + b.legL) * legK * 0.95 * k + (opts.bob ?? 0)];
  const lean = pose.lean;
  const shoulder = [hip[0] + Math.sin(lean) * b.torso * k * facing, hip[1] - Math.cos(lean) * b.torso * k];
  const head = [shoulder[0] + Math.sin(lean) * (b.neck + b.head) * k * facing, shoulder[1] - Math.cos(lean) * (b.neck + b.head) * k];
  const arm = ([u, l]) => {
    const e = limb(shoulder[0], shoulder[1], facing, u + lean * 0.5, b.armU * k);
    return [shoulder, e, limb(e[0], e[1], facing, u + l + lean * 0.5, b.armL * k)];
  };
  const leg = ([u, l]) => {
    const kn = limb(hip[0], hip[1], facing, u, b.legU * legK * k);
    return [hip, kn, limb(kn[0], kn[1], facing, u + l, b.legL * legK * k)];
  };
  const armB = arm(pose.armB);
  const armF = arm(pose.armF);
  const legB = leg(pose.legB);
  const legF = leg(pose.legF);
  const swordAngle = pose.armF[0] + pose.armF[1] + lean * 0.5;

  const stroke = (pts, w, colour) => {
    c.strokeStyle = colour;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(...pts[0]);
    for (const p of pts.slice(1)) c.lineTo(...p);
    c.stroke();
  };

  // Two passes: outline (slightly fatter, dark), then colour.
  for (const pass of [0, 1]) {
    const o = pass === 0 ? 2.4 * k : 0;
    const pick = (name) => (pass === 0 ? OUTLINE : col(name));
    stroke(armB, limbW + o, pick(style.armBack));
    stroke(legB, limbW + o, pick(style.legBack));
    stroke(legF, limbW + o, pick(style.leg));
    if (style.kind === 'shark') drawSkirt(c, hip, facing, k, pick(style.cloth), o);
    stroke([hip, shoulder], torsoW + o, pick(style.torso));
    if (style.kind === 'shark') drawSharkHead(c, head, facing, k * build.head, style, pick, o, pass);
    else {
      c.fillStyle = pick(style.head);
      c.beginPath();
      c.arc(head[0], head[1], b.head * k + o / 2, 0, TAU);
      c.fill();
    }
    stroke(armF, limbW + o, pick(style.arm));
    if (style.kind === 'shark') {
      drawPauldron(c, shoulder, k, pick(style.torso), o);
      drawSword(c, armF[2], facing, swordAngle, k, pick, o, white);
    }
  }
  if (!white) drawDetails(c, style, { head, shoulder, hip, armF, armB, legF, legB }, facing, k, opts.t ?? 0, lean);
  c.restore();
}

// ---------------------------------------------------------------- the shark (Razorfin)

function drawSharkHead(c, [hx, hy], facing, k, style, pick, o, pass) {
  const f = facing;
  const P = (dx, dy) => [hx + dx * k * f, hy + dy * k];
  const poly = (pts) => {
    c.beginPath();
    c.moveTo(...pts[0]);
    for (const p of pts.slice(1)) c.lineTo(...p);
    c.closePath();
  };
  // Dorsal fin, behind the head.
  poly([P(-5, -3), P(-10, -14), P(-1, -5)]);
  c.fillStyle = pick(style.head);
  c.fill();
  if (o) { c.lineWidth = o; c.strokeStyle = OUTLINE; c.stroke(); }
  // Head: long snout pointing the way he faces.
  poly([P(-6, -5), P(4, -6), P(12, -1), P(10, 2), P(5, 6), P(-5, 6)]);
  c.fillStyle = pick(style.head);
  c.fill();
  if (o) { c.lineWidth = o; c.strokeStyle = OUTLINE; c.stroke(); }
  if (pass === 1) {
    // Pale jaw and the grin.
    poly([P(-4, 2), P(10, 1.5), P(5, 6), P(-4, 6)]);
    c.fillStyle = pick(style.belly);
    c.fill();
    c.strokeStyle = pick(OUTLINE);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(...P(-2, 2));
    c.lineTo(...P(10, 1.5));
    c.stroke();
  }
}

function drawPauldron(c, [sx, sy], k, colour, o) {
  // The big silver shoulder plate from the concept art.
  c.fillStyle = colour;
  c.beginPath();
  c.ellipse(sx, sy + 1 * k, 7 * k + o / 2, 5 * k + o / 2, 0, 0, TAU);
  c.fill();
}

function drawSkirt(c, [hx, hy], facing, k, colour, o) {
  // Green tabard over the hips.
  c.fillStyle = colour;
  c.beginPath();
  c.moveTo(hx - 6 * k - o / 2, hy - 2 * k);
  c.lineTo(hx + 6 * k + o / 2, hy - 2 * k);
  c.lineTo(hx + 8 * k + o / 2, hy + 9 * k + o / 2);
  c.lineTo(hx - 8 * k - o / 2, hy + 9 * k + o / 2);
  c.closePath();
  c.fill();
}

function drawSword(c, [hx, hy], facing, angle, k, pick, o, white) {
  const dx = Math.sin(angle) * facing;
  const dy = Math.cos(angle);
  const blade = 26 * k;
  const tip = [hx + dx * blade, hy + dy * blade];
  const pommel = [hx - dx * 4 * k, hy - dy * 4 * k];
  c.lineCap = 'butt';
  // Blade
  c.strokeStyle = pick('#dfe4ea');
  c.lineWidth = 2.6 * k + o;
  c.beginPath();
  c.moveTo(hx, hy);
  c.lineTo(...tip);
  c.stroke();
  // Grip
  c.strokeStyle = pick('#4a2f1e');
  c.lineWidth = 2 * k + o;
  c.beginPath();
  c.moveTo(...pommel);
  c.lineTo(hx, hy);
  c.stroke();
  // Crossguard, perpendicular to the blade
  const gx = -dy * 5 * k;
  const gy = dx * 5 * k;
  c.strokeStyle = pick('#d4a531');
  c.lineWidth = 2 * k + o;
  c.beginPath();
  c.moveTo(hx + dx * 2 * k - gx, hy + dy * 2 * k - gy);
  c.lineTo(hx + dx * 2 * k + gx, hy + dy * 2 * k + gy);
  c.stroke();
  if (!o && !white) {
    // A bright edge down the blade.
    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.9 * k;
    c.beginPath();
    c.moveTo(hx + dx * 4 * k, hy + dy * 4 * k);
    c.lineTo(tip[0] - dx * 2 * k, tip[1] - dy * 2 * k);
    c.stroke();
  }
  c.lineCap = 'round';
}

// ---------------------------------------------------------------- per-character details

function drawDetails(c, style, p, facing, k, t, lean) {
  const [hx, hy] = p.head;
  const px = (v) => Math.round(v);
  switch (style.kind) {
    case 'shark': {
      // Eye, teeth, gold armour trim, gold bracer and boots.
      const hk = k * 1.25; // head scale
      c.fillStyle = '#111111';
      c.fillRect(px(hx + 4 * hk * facing), px(hy - 2 * hk), 2, 2);
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) c.fillRect(px(hx + (1 + i * 2.2) * hk * facing), px(hy + 2 * hk), 1, 2);
      c.strokeStyle = style.accent;
      c.lineWidth = 1.6 * k;
      const [sx, sy] = p.shoulder;
      const [ix, iy] = p.hip;
      const mx = (sx + ix) / 2;
      const my = (sy + iy) / 2;
      c.beginPath();
      c.moveTo(sx - 5 * k, sy + 2 * k);
      c.lineTo(mx, my + 3 * k); // the V of the breastplate
      c.lineTo(sx + 5 * k, sy + 2 * k);
      c.stroke();
      c.strokeStyle = style.accent;
      c.lineWidth = 1.4 * k;
      c.beginPath();
      c.ellipse(sx, sy + 1 * k, 7 * k, 5 * k, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
      c.lineWidth = 9.5 * k;
      c.lineCap = 'butt';
      const [e, h] = [p.armF[1], p.armF[2]];
      c.beginPath();
      c.moveTo(e[0] + (h[0] - e[0]) * 0.35, e[1] + (h[1] - e[1]) * 0.35);
      c.lineTo(e[0] + (h[0] - e[0]) * 0.7, e[1] + (h[1] - e[1]) * 0.7);
      c.stroke();
      c.fillStyle = style.accent;
      for (const lg of [p.legF, p.legB]) c.fillRect(px(lg[2][0] - 3 * k), px(lg[2][1] - 3 * k), px(7 * k), px(4 * k));
      c.lineCap = 'round';
      break;
    }
    case 'nova':
      // Visor and a chest star; a scarf streaming behind.
      c.fillStyle = style.visor;
      c.fillRect(px(hx + (facing > 0 ? 0 : -6 * k)), px(hy - 2 * k), px(6 * k), Math.max(1, px(2.2 * k)));
      c.fillStyle = style.accent;
      c.fillRect(px((p.shoulder[0] + p.hip[0]) / 2 - 1.5 * k), px(p.shoulder[1] + 5 * k), px(3.5 * k), px(3.5 * k));
      c.strokeStyle = style.accent;
      c.lineWidth = 2.5 * k;
      {
        const w = Math.sin(t * 12) * 2 * k;
        const [sx, sy] = p.shoulder;
        c.beginPath();
        c.moveTo(sx, sy - 1 * k);
        c.lineTo(sx - 8 * k * facing, sy + 1 * k + w);
        c.lineTo(sx - 15 * k * facing, sy + 3 * k - w);
        c.stroke();
      }
      break;
    case 'punk': {
      // Green mohawk spikes, a red bandana, an eye.
      c.fillStyle = style.accent;
      for (let i = 0; i < 4; i++) {
        const ax = hx + (-3 + i * 2) * k * facing;
        c.beginPath();
        c.moveTo(ax - 1.2 * k, hy - 5 * k);
        c.lineTo(ax - 0.5 * k * facing, hy - (10 + (i % 2)) * k);
        c.lineTo(ax + 1.2 * k, hy - 5 * k);
        c.closePath();
        c.fill();
      }
      c.fillStyle = style.bandana;
      c.fillRect(px(hx - 6 * k), px(hy - 2.5 * k), px(12 * k), px(2.4 * k));
      c.fillStyle = '#111111';
      c.fillRect(px(hx + 3 * k * facing), px(hy + 0.5 * k), 2, 2);
      break;
    }
    case 'bruiser': {
      // Dark shades and a gold chain.
      c.fillStyle = style.shades;
      c.fillRect(px(hx + (facing > 0 ? -1 : -6) * k), px(hy - 2 * k), px(7 * k), px(2.4 * k));
      c.strokeStyle = style.accent;
      c.lineWidth = 1.5 * k;
      const [sx, sy] = p.shoulder;
      c.beginPath();
      c.arc(sx, sy + 2 * k, 4 * k, 0.2, Math.PI - 0.2);
      c.stroke();
      break;
    }
    default:
      break;
  }
}
