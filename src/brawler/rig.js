// Code-drawn fighters: one "rig" (head, torso, two-segment limbs) posed per action.
// A dark outline pass, then a colour pass, gives the chunky pixel-art look once the
// 480 × 270 frame is scaled up.
//
// Angles are radians. 0 points straight down; positive swings towards the way the fighter faces.
// Each limb is [upper, lower]: the upper angle is absolute, the lower is relative to the upper.

const T = Math.PI;

export const POSES = {
  idle: { lean: 0.05, armF: [0.6, 1.5], armB: [0.3, 1.4], legF: [0.18, -0.12], legB: [-0.18, -0.06] },
  jab: { lean: 0.12, armF: [1.57, 0.05], armB: [0.4, 1.6], legF: [0.4, -0.1], legB: [-0.35, 0] },
  cross: { lean: 0.22, armF: [0.5, 1.6], armB: [1.55, 0.05], legF: [0.4, -0.1], legB: [-0.4, 0] },
  highKick: { lean: -0.3, armF: [0.9, 1.2], armB: [-0.5, 1.2], legF: [2.0, 0], legB: [-0.1, -0.1] },
  heavy: { lean: 0.25, armF: [1.5, 0.1], armB: [0.2, 1.5], legF: [0.5, -0.2], legB: [-0.45, 0] },
  hammer: { lean: 0.35, armF: [1.2, 0.3], armB: [1.1, 0.5], legF: [0.55, -0.25], legB: [-0.5, 0] },
  flyKick: { lean: -0.2, armF: [1.2, 1.0], armB: [-0.8, 1.0], legF: [1.6, 0], legB: [-0.6, -1.4] },
  elbow: { lean: 0.6, armF: [1.2, 2.2], armB: [0.2, 1.4], legF: [0.8, -1.2], legB: [-0.2, -1.0] },
  jump: { lean: 0, armF: [2.4, 0.4], armB: [2.0, 0.6], legF: [0.8, -1.6], legB: [0.2, -1.4] },
  hurt: { lean: -0.4, armF: [-0.5, 0.8], armB: [-0.8, 0.6], legF: [0.25, -0.1], legB: [-0.3, 0] },
  down: { lean: 0, armF: [2.8, 0], armB: [2.4, 0.3], legF: [0.2, 0], legB: [-0.1, 0] },
  getup: { lean: 0.5, armF: [0.8, 0.5], armB: [0.3, 0.6], legF: [1.2, -2.0], legB: [0.6, -1.8] },
  dash: { lean: 0.6, armF: [1.7, 0], armB: [-1.0, 0.3], legF: [0.9, -0.6], legB: [-1.0, -0.4] },
  beam: { lean: 0.1, armF: [1.57, 0], armB: [1.45, 0.1], legF: [0.45, -0.15], legB: [-0.45, 0] },
  tagIn: { lean: 0, armF: [1.57, 0], armB: [-1.57, 0], legF: [0.5, -0.1], legB: [-0.5, 0] },
  swipe: { lean: 0.3, armF: [1.9, -0.3], armB: [0.2, 1.0], legF: [0.4, -0.1], legB: [-0.4, 0] },
  swipeWindup: { lean: -0.2, armF: [-1.0, 1.6], armB: [0.4, 1.2], legF: [0.35, -0.2], legB: [-0.35, 0] },
  smash: { lean: 0.5, armF: [1.4, 0.4], armB: [1.2, 0.5], legF: [0.5, -0.2], legB: [-0.5, 0] },
  smashWindup: { lean: -0.35, armF: [3.0, 0.4], armB: [2.8, 0.5], legF: [0.4, -0.2], legB: [-0.4, 0] },
  victory: { lean: -0.05, armF: [3.0, 0.1], armB: [0.4, 1.4], legF: [0.2, -0.1], legB: [-0.2, -0.05] },
};

/** The walk cycle, generated from a phase so it loops smoothly. */
export function walkPose(phase) {
  const s = Math.sin(phase);
  return {
    lean: 0.08,
    armF: [0.6 - 0.45 * s, 1.3],
    armB: [0.3 + 0.45 * s, 1.2],
    legF: [0.5 * s, -0.15 - 0.35 * Math.max(0, -s)],
    legB: [-0.5 * s, -0.15 - 0.35 * Math.max(0, s)],
  };
}

// Body proportions at scale 1 (about 54 px tall: a fifth of the 270 px screen).
const BODY = { legU: 12, legL: 12, torso: 18, armU: 9, armL: 9, head: 6.5, neck: 2.4 };
const OUTLINE = '#0b0614';

function limb(x, y, facing, a, len) {
  return [x + Math.sin(a) * len * facing, y + Math.cos(a) * len];
}

/**
 * Draw a fighter with its feet at (x, y).
 * opts: { flash: draw all white, alpha, rotate: radians around the feet (knockdowns), t: time for idle motion }
 */
export function drawRig(c, x, y, facing, pose, style, scale = 1, opts = {}) {
  const k = scale;
  const b = BODY;
  const wide = style.kind === 'brute' || style.kind === 'titan';
  const limbW = (wide ? 6.5 : 5.5) * k;
  const torsoW = (style.kind === 'brute' ? 13 : wide ? 11 : 9) * k;
  const bob = opts.bob ?? 0;

  c.save();
  c.globalAlpha = opts.alpha ?? 1;
  c.translate(Math.round(x), Math.round(y));
  if (opts.rotate) c.rotate(opts.rotate);

  // Skeleton.
  const hip = [0, -(b.legU + b.legL) * 0.95 * k + bob];
  const lean = pose.lean;
  const shoulder = [hip[0] + Math.sin(lean) * b.torso * k * facing, hip[1] - Math.cos(lean) * b.torso * k];
  const head = [shoulder[0] + Math.sin(lean) * (b.neck + b.head) * k * facing, shoulder[1] - Math.cos(lean) * (b.neck + b.head) * k];
  const arm = ([u, l]) => {
    const e = limb(shoulder[0], shoulder[1], facing, u + lean * 0.5, b.armU * k);
    return [shoulder, e, limb(e[0], e[1], facing, u + l + lean * 0.5, b.armL * k)];
  };
  const leg = ([u, l]) => {
    const kn = limb(hip[0], hip[1], facing, u, b.legU * k);
    return [hip, kn, limb(kn[0], kn[1], facing, u + l, b.legL * k)];
  };
  const parts = { armB: arm(pose.armB), legB: leg(pose.legB), legF: leg(pose.legF), armF: arm(pose.armF) };

  const white = opts.flash;
  const col = (cname) => (white ? '#ffffff' : cname);
  const stroke = (pts, w, colour) => {
    c.strokeStyle = colour;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(...pts[0]);
    for (const p of pts.slice(1)) c.lineTo(...p);
    c.stroke();
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Pass 1: outline. Pass 2: colour. Back limbs darker for depth.
  for (const pass of [0, 1]) {
    const o = pass === 0 ? 2.5 * k : 0;
    const pick = (cname) => (pass === 0 ? OUTLINE : col(cname));
    stroke(parts.armB, limbW + o, pick(style.dark));
    stroke(parts.legB, limbW + o, pick(style.dark));
    if (style.kind === 'nova' && pass === 1 && !white) drawScarf(c, shoulder, facing, k, opts.t ?? 0, style.accent);
    stroke([hip, shoulder], torsoW + o, pick(style.body));
    stroke(parts.legF, limbW + o, pick(style.body));
    c.fillStyle = pick(style.body);
    c.beginPath();
    c.arc(head[0], head[1], b.head * k + o / 2, 0, T * 2);
    c.fill();
    stroke(parts.armF, limbW + o, pick(style.body));
    if (style.kind === 'titan' || style.kind === 'brute') {
      c.fillStyle = pick(style.kind === 'titan' ? style.accent : style.dark);
      c.beginPath();
      c.arc(shoulder[0], shoulder[1], 3.6 * k + o / 2, 0, T * 2);
      c.fill();
    }
  }
  if (!white) drawDetails(c, style, head, shoulder, hip, facing, k, opts.t ?? 0);
  c.restore();
}

function drawScarf(c, shoulder, facing, k, t, colour) {
  const wave = Math.sin(t * 12) * 2 * k;
  c.strokeStyle = colour;
  c.lineWidth = 2.5 * k;
  c.beginPath();
  c.moveTo(shoulder[0], shoulder[1] - 1 * k);
  c.lineTo(shoulder[0] - 7 * k * facing, shoulder[1] + 1 * k + wave);
  c.lineTo(shoulder[0] - 13 * k * facing, shoulder[1] + 3 * k - wave);
  c.stroke();
}

function drawDetails(c, style, head, shoulder, hip, facing, k, t) {
  const [hx, hy] = head;
  switch (style.kind) {
    case 'nova':
    case 'titan':
      // Visor across the front of the helmet, plus a glowing chest emblem.
      c.fillStyle = style.visor;
      c.fillRect(Math.round(hx + (facing > 0 ? 0 : -5 * k)), Math.round(hy - 1.5 * k), Math.round(5 * k), Math.max(1, Math.round(2 * k)));
      c.fillStyle = style.accent;
      c.fillRect(Math.round((shoulder[0] + hip[0]) / 2 - 1.5 * k), Math.round(shoulder[1] + 4 * k), Math.max(2, Math.round(3 * k)), Math.max(2, Math.round(3 * k)));
      break;
    case 'voidling': {
      // One big glowing eye and a twitching antenna.
      c.fillStyle = style.visor;
      c.beginPath();
      c.arc(hx + 2 * k * facing, hy - 0.5 * k, 2.2 * k, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = style.dark;
      c.lineWidth = 1.5 * k;
      const tw = Math.sin(t * 9) * 1.5 * k;
      c.beginPath();
      c.moveTo(hx - 1 * k * facing, hy - 5 * k);
      c.lineTo(hx - 3 * k * facing + tw, hy - 10 * k);
      c.stroke();
      c.fillStyle = style.accent;
      c.fillRect(Math.round(hx - 3 * k * facing + tw - 1), Math.round(hy - 11 * k), 2, 2);
      break;
    }
    case 'brute':
      // Horns and two angry eyes.
      c.fillStyle = style.accent;
      c.fillRect(Math.round(hx + 0.5 * k * facing - 1), Math.round(hy - 1.5 * k), 2, 2);
      c.fillRect(Math.round(hx + 3 * k * facing - 1), Math.round(hy - 1.5 * k), 2, 2);
      c.strokeStyle = '#f3e8ff';
      c.lineWidth = 2 * k;
      c.beginPath();
      c.moveTo(hx - 3 * k, hy - 4 * k);
      c.lineTo(hx - 6 * k, hy - 9 * k);
      c.moveTo(hx + 3 * k, hy - 4 * k);
      c.lineTo(hx + 6 * k, hy - 9 * k);
      c.stroke();
      break;
    default:
      break;
  }
}
