// Code-drawn fighters: one rig (head, torso, two-segment limbs) posed per action, drawn as
// solid cel-shaded body parts with a dark outline. The renderer hardens the edges so the
// 480 × 270 frame scales up as pixel art.
//
// Angles are radians. 0 points straight down; positive swings towards the way the fighter faces;
// π/2 is straight ahead, π is straight up. Each limb is [upper, lower]: the upper angle is absolute,
// the lower is relative to the upper.

import { OUTLINE, tone, capsulePath, shadedCapsule, polyPath, shadedShape, limb } from './paint.js';
import { drawRazorfin, RAZORFIN_POSES, razorfinWalk } from './razorfin.js';

const TAU = Math.PI * 2;

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

/**
 * The pose to draw for a character. Razorfin has his own set (heavier, laid-back); everyone
 * else uses POSES. `walk` / `run` are generated from a phase.
 */
export function getPose(kind, name, { phase = 0 } = {}) {
  if (kind === 'shark') {
    if (name === 'walk' || name === 'run') return razorfinWalk(phase, name === 'run');
    return RAZORFIN_POSES[name] ?? POSES[name] ?? RAZORFIN_POSES.idle;
  }
  if (name === 'walk' || name === 'run') return walkPose(phase, name === 'run');
  return POSES[name] ?? POSES.idle;
}

// ---------------------------------------------------------------- bodies
//
// Each body part is a solid, tapered shape (a "capsule"), cel-shaded in three tones: a shadow
// fill, the base colour offset towards the light, and a small highlight. One light for the whole
// scene, from the upper left of the screen. A dark outline pass goes underneath everything.

// Skeleton lengths at scale 1. Heroes are drawn at scale ~1.5, so about 85 px tall: a third of
// the 270 px screen, like modern pixel-art brawlers.
const BODY = { legU: 12, legL: 12, torso: 18, armU: 9, armL: 9.5, neck: 2.4 };

// Body shape per character: radii [start, end] of each segment, torso widths, head radius.
const BUILD = {
  nova: {
    upper: [3.1, 2.6], fore: [2.6, 2.1], fist: 2.5, thigh: [3.9, 2.9], shin: [2.9, 2.2], boot: 2.6,
    torso: { shoulder: 6.4, chest: 6.2, waist: 4.4, hip: 5.4 }, neck: 2.1, head: 5.8,
  },
  punk: {
    upper: [3.0, 2.5], fore: [2.5, 2.0], fist: 2.4, thigh: [3.6, 2.8], shin: [2.8, 2.2], boot: 2.6,
    torso: { shoulder: 6.2, chest: 5.8, waist: 4.6, hip: 5.0 }, neck: 2.1, head: 5.6,
  },
  bruiser: {
    upper: [5.2, 4.4], fore: [4.4, 3.5], fist: 3.9, thigh: [5.0, 4.0], shin: [4.0, 3.4], boot: 3.5,
    torso: { shoulder: 10.8, chest: 11.2, waist: 9.2, hip: 8.6 }, neck: 4.2, head: 6.2,
  },
};

/**
 * Draw a fighter with its feet at (x, y).
 * opts: { flash: all white, alpha, rotate: radians around the feet (knockdowns), t: time, bob: px }
 */
export function drawRig(c, x, y, facing, pose, style, scale = 1, opts = {}) {
  if (style.kind === 'shark') return drawRazorfin(c, x, y, facing, pose, style, scale, opts);
  const k = scale;
  const B = BODY;
  const build = BUILD[style.kind] ?? BUILD.nova;
  const legK = build.legScale ?? 1;
  const flat = opts.flash ? '#ffffff' : null;
  const f = facing;

  c.save();
  c.globalAlpha = opts.alpha ?? 1;
  c.translate(Math.round(x), Math.round(y));
  if (opts.rotate) c.rotate(opts.rotate);

  // ---- skeleton
  const hip = [0, -(B.legU + B.legL) * legK * 0.95 * k + (opts.bob ?? 0)];
  const lean = pose.lean;
  const up = [Math.sin(lean) * f, -Math.cos(lean)];
  const shoulder = [hip[0] + up[0] * B.torso * k, hip[1] + up[1] * B.torso * k];
  const neckTop = [shoulder[0] + up[0] * B.neck * k, shoulder[1] + up[1] * B.neck * k];
  const head = [neckTop[0] + up[0] * build.head * k * 0.85, neckTop[1] + up[1] * build.head * k * 0.85];
  // Shoulder joints sit a little in from the torso edge, front one nearer the camera.
  const across = [-up[1], up[0]];
  const sJoint = (side) => [shoulder[0] + across[0] * side * build.torso.shoulder * k * 0.25 - up[0] * 2 * k,
    shoulder[1] + across[1] * side * build.torso.shoulder * k * 0.25 - up[1] * 2 * k];
  const arm = ([u, l], side) => {
    const s = sJoint(side);
    const e = limb(s[0], s[1], f, u + lean * 0.5, B.armU * k);
    return [s, e, limb(e[0], e[1], f, u + l + lean * 0.5, B.armL * k)];
  };
  const leg = ([u, l], side) => {
    const h = [hip[0] + side * f * 1.5 * k, hip[1]];
    const kn = limb(h[0], h[1], f, u, B.legU * legK * k);
    const an = limb(kn[0], kn[1], f, u + l, B.legL * legK * k);
    const toeDir = [Math.cos(u + l) * f, -Math.sin(u + l)];
    return { hip: h, knee: kn, ankle: an, toe: [an[0] + toeDir[0] * build.boot * 2.2 * k, an[1] + toeDir[1] * build.boot * 2.2 * k] };
  };
  const armB = arm(pose.armB, -1);
  const armF = arm(pose.armF, 1);
  const legB = leg(pose.legB, -1);
  const legF = leg(pose.legF, 1);
  const P = { hip, shoulder, head, neckTop, up, across, armB, armF, legB, legF };

  // ---- parts, back to front
  const S = style;
  const o = 1.4 * k; // outline thickness
  const R = (v) => v * k;
  const drawArm = (a, back, pass) => {
    const sh = back ? 0.78 : 1;
    const col = (name) => (back ? tone(S[name], sh) : S[name]);
    shadedCapsule(c, a[0], a[1], R(build.upper[0]), R(build.upper[1]), col('upperArm'), pass, o, flat);
    shadedCapsule(c, a[1], a[2], R(build.fore[0]), R(build.fore[1]), col('forearm'), pass, o, flat);
    shadedCapsule(c, a[2], a[2], R(build.fist), R(build.fist), col('hand'), pass, o, flat);
  };
  const drawLeg = (l, back, pass) => {
    const col = (name) => (back ? tone(S[name], 0.78) : S[name]);
    shadedCapsule(c, l.hip, l.knee, R(build.thigh[0]), R(build.thigh[1]), col('thigh'), pass, o, flat);
    shadedCapsule(c, l.knee, l.ankle, R(build.shin[0]), R(build.shin[1]), col('shin'), pass, o, flat);
    shadedCapsule(c, l.ankle, l.toe, R(build.boot), R(build.boot * 0.8), col('boot'), pass, o, flat);
  };
  const t = build.torso;
  const torsoPts = (grow) => {
    const at = (frac, w) => {
      const cx = hip[0] + (shoulder[0] - hip[0]) * frac;
      const cy = hip[1] + (shoulder[1] - hip[1]) * frac;
      return [[cx + across[0] * (w * k + grow), cy + across[1] * (w * k + grow)], [cx - across[0] * (w * k + grow), cy - across[1] * (w * k + grow)]];
    };
    const rows = [at(-0.05, t.hip), at(0.35, t.waist), at(0.75, t.chest), at(1.02, t.shoulder)];
    return [...rows.map((r) => r[0]), ...rows.reverse().map((r) => r[1])];
  };
  const torsoCentre = [(hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2];
  const drawTorso = (pass) => shadedShape(c, (g) => polyPath(c, torsoPts(g)), torsoCentre, R(t.chest), S.torso, pass, o, flat);
  const drawNeck = (pass) => shadedCapsule(c, shoulder, neckTop, R(build.neck), R(build.neck * 0.9), S.neck, pass, o, flat);

  for (const pass of [0, 1]) {
    drawArm(armB, true, pass);
    drawLeg(legB, true, pass);
    drawLeg(legF, false, pass);
    drawTorso(pass);
    drawNeck(pass);
    drawHead(c, P, k, f, S, build, pass, o, flat, opts.t ?? 0);
    drawArm(armF, false, pass);
    if (pass === 1 && !flat) drawOutfit(c, P, k, f, S, build, opts.t ?? 0);
  }
  c.restore();
}

// ---------------------------------------------------------------- heads

function drawHead(c, P, k, f, S, build, pass, o, flat, t) {
  const [hx, hy] = P.head;
  const r = build.head * k;

  // Skull + jaw: a slightly long oval leaning with the body.
  const path = (g) => {
    c.beginPath();
    c.ellipse(hx + f * r * 0.08, hy, r * 0.92 + g, r + g, 0, 0, TAU);
  };
  shadedShape(c, path, P.head, r, S.head, pass, o, flat);
  if (pass === 0 || flat) return;

  const px = (v) => Math.round(v);
  if (S.kind === 'nova') {
    // Helmet visor: a glowing band with a hot highlight.
    c.fillStyle = OUTLINE;
    c.fillRect(px(hx - r * 0.2 + (f > 0 ? 0 : -r * 0.8)), px(hy - r * 0.35), px(r * 1.25), px(r * 0.6));
    c.fillStyle = S.visor;
    c.fillRect(px(hx - r * 0.1 + (f > 0 ? 0 : -r * 0.8)), px(hy - r * 0.25), px(r * 1.05), px(r * 0.4));
    c.fillStyle = '#ffffff';
    c.fillRect(px(hx + (f > 0 ? r * 0.2 : -r * 0.5)), px(hy - r * 0.25), px(r * 0.35), 1);
    return;
  }
  // Human face, profile: eye, brow, nose, ear, mouth.
  c.fillStyle = OUTLINE;
  c.fillRect(px(hx + f * r * 0.45), px(hy - r * 0.15), 2, 2); // eye
  c.fillRect(px(hx + f * r * 0.3 - 1), px(hy - r * 0.38), px(r * 0.6), 1); // brow (scowl)
  c.fillStyle = tone(S.head, 0.62);
  c.fillRect(px(hx + f * r * 0.92), px(hy + r * 0.05), 2, px(r * 0.3)); // nose
  c.fillRect(px(hx - f * r * 0.15), px(hy - r * 0.05), px(r * 0.3), px(r * 0.4)); // ear
  c.fillRect(px(hx + f * r * 0.45), px(hy + r * 0.55), px(r * 0.4), 1); // mouth

  if (S.kind === 'punk') {
    // Shaved sides + a tall spiked mohawk.
    c.fillStyle = tone(S.head, 0.7);
    c.beginPath();
    c.ellipse(hx - f * r * 0.1, hy - r * 0.45, r * 0.75, r * 0.45, 0, Math.PI, TAU);
    c.fill();
    for (let i = 0; i < 5; i++) {
      const ax = hx + f * (-r * 0.7 + i * r * 0.32);
      const tall = r * (0.9 + (i % 2) * 0.35);
      for (const [g, col] of [[1.2, OUTLINE], [0, S.hair], [-1.2, tone(S.hair, 1.3)]]) {
        if (g < 0 && i % 2) continue;
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(ax - r * 0.22 - g, hy - r * 0.7);
        c.lineTo(ax - f * r * 0.25, hy - r * 0.7 - tall - g);
        c.lineTo(ax + r * 0.22 + g, hy - r * 0.7);
        c.closePath();
        c.fill();
      }
    }
  } else if (S.kind === 'bruiser') {
    // Bald shine, dark shades with a glint, stubble.
    c.fillStyle = tone(S.head, 1.35);
    c.fillRect(px(hx - r * 0.3), px(hy - r * 0.8), px(r * 0.5), 2);
    c.fillStyle = S.shades;
    c.fillRect(px(hx + (f > 0 ? r * 0.05 : -r * 0.95)), px(hy - r * 0.32), px(r * 0.9), px(r * 0.38));
    c.fillStyle = '#9fd8ff';
    c.fillRect(px(hx + (f > 0 ? r * 0.55 : -r * 0.55)), px(hy - r * 0.28), 2, 1);
    c.fillStyle = tone(S.head, 0.75);
    c.beginPath();
    c.ellipse(hx + f * r * 0.35, hy + r * 0.55, r * 0.55, r * 0.35, 0, 0, Math.PI);
    c.fill();
  }
}


// ---------------------------------------------------------------- outfits and gear




/** Surface details drawn over the shaded body: armour trim, zips, chains, belts. */
function drawOutfit(c, P, k, f, S, build, t) {
  const R = Math.round;
  const at = (frac, side) => {
    const cx = P.hip[0] + (P.shoulder[0] - P.hip[0]) * frac;
    const cy = P.hip[1] + (P.shoulder[1] - P.hip[1]) * frac;
    return [cx + P.across[0] * side * k, cy + P.across[1] * side * k];
  };
  const line = (a, b, colour, w = 1) => {
    c.strokeStyle = colour;
    c.lineWidth = Math.max(1, w * k * 0.8);
    c.beginPath();
    c.moveTo(...a);
    c.lineTo(...b);
    c.stroke();
  };
  switch (S.kind) {
    case 'nova': {
      line(at(0.05, -5.5), at(0.05, 5.5), S.accent, 1.5); // belt
      const [sx, sy] = at(0.7, 0);
      c.fillStyle = S.accent; // chest star
      c.fillRect(R(sx) - 2, R(sy) - 1, 5, 3);
      c.fillRect(R(sx) - 1, R(sy) - 2, 3, 5);
      // Scarf streaming behind.
      const w = Math.sin(t * 12) * 2 * k;
      const [nx, ny] = P.shoulder;
      c.strokeStyle = OUTLINE;
      c.lineWidth = 3.5 * k;
      for (const col of [OUTLINE, S.accent]) {
        c.strokeStyle = col;
        c.lineWidth = col === OUTLINE ? 3.6 * k : 2.2 * k;
        c.beginPath();
        c.moveTo(nx, ny - 1 * k);
        c.lineTo(nx - 9 * k * f, ny + 1 * k + w);
        c.lineTo(nx - 17 * k * f, ny + 3 * k - w);
        c.stroke();
      }
      break;
    }
    case 'punk': {
      // Open jacket: shirt strip down the middle, zip, studs on the shoulders.
      c.save();
      polyPath(c, [at(0.98, -2), at(0.98, 2), at(0.05, 1.5), at(0.05, -1.5)]);
      c.fillStyle = S.shirt;
      c.fill();
      c.restore();
      line(at(0.95, 2.4), at(0.1, 2), tone(S.torso, 1.5), 0.8);
      c.fillStyle = '#e8e4da';
      for (const side of [-4.5, -2.5, 2.5, 4.5]) {
        const [px, py] = at(1.0, side);
        c.fillRect(R(px), R(py), 1, 1);
      }
      line(at(0.02, -5), at(0.02, 5), '#2a1e14', 1.4); // belt
      break;
    }
    case 'bruiser': {
      // Tank top over bare shoulders: shoulder area in skin, straps; gold chain; belt.
      c.save();
      polyPath(c, [at(1.03, -10.8), at(1.03, -5), at(0.7, -3), at(0.7, 3), at(1.03, 5), at(1.03, 10.8), at(0.8, 11.2), at(0.8, -11.2)]);
      c.fillStyle = S.neck;
      c.fill();
      c.restore();
      line(at(0.98, -4.5), at(0.7, -3), tone(S.torso, 0.8), 1.5);
      line(at(0.98, 4.5), at(0.7, 3), tone(S.torso, 0.8), 1.5);
      c.strokeStyle = S.accent;
      c.lineWidth = Math.max(1, k);
      const [cx, cy] = at(0.88, 0);
      c.beginPath();
      c.arc(cx, cy, 4 * k, 0.1, Math.PI - 0.1);
      c.stroke();
      line(at(0.02, -8.6), at(0.02, 8.6), '#2a1e14', 1.6); // belt
      break;
    }
    default:
      break;
  }
}
