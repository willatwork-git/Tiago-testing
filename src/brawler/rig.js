// Code-drawn fighters: one rig (head, torso, two-segment limbs) posed per action, drawn as
// solid cel-shaded body parts with a dark outline. The renderer hardens the edges so the
// 480 × 270 frame scales up as pixel art.
//
// Angles are radians. 0 points straight down; positive swings towards the way the fighter faces;
// π/2 is straight ahead, π is straight up. Each limb is [upper, lower]: the upper angle is absolute,
// the lower is relative to the upper.

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
  shark: {
    // From the concept art: massive arms and chest, short legs, a big head.
    upper: [5.4, 4.6], fore: [4.6, 3.8], fist: 3.9, thigh: [5.0, 4.2], shin: [4.2, 3.6], boot: 3.6,
    torso: { shoulder: 10.5, chest: 10.5, waist: 7.6, hip: 8.2 }, neck: 4.8, head: 6.6, legScale: 0.85,
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

const OUTLINE = '#141019';
const LIGHT = (() => {
  const v = [-0.5, -0.85];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l];
})();

// ---- colour helpers (cached): f < 1 darkens towards a cool purple shadow, f > 1 lightens.
const toneCache = new Map();
function tone(hex, f) {
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
function capsulePath(c, a, b, r1, r2) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  c.beginPath();
  c.arc(a[0], a[1], Math.max(0.1, r1), ang + Math.PI / 2, ang - Math.PI / 2);
  c.arc(b[0], b[1], Math.max(0.1, r2), ang - Math.PI / 2, ang + Math.PI / 2);
  c.closePath();
}

const off = (p, r, f) => [p[0] + LIGHT[0] * r * f, p[1] + LIGHT[1] * r * f];

/** A cel-shaded capsule: shadow, base towards the light, highlight. */
function shadedCapsule(c, a, b, r1, r2, colour, pass, o, flat) {
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

function polyPath(c, pts) {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
  c.closePath();
}

/** Cel-shade any closed shape given a path function and a rough centre + size. */
function shadedShape(c, path, centre, size, colour, pass, o, flat) {
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

function limb(x, y, facing, a, len) {
  return [x + Math.sin(a) * len * facing, y + Math.cos(a) * len];
}

/**
 * Draw a fighter with its feet at (x, y).
 * opts: { flash: all white, alpha, rotate: radians around the feet (knockdowns), t: time, bob: px }
 */
export function drawRig(c, x, y, facing, pose, style, scale = 1, opts = {}) {
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
    if (S.kind === 'shark') drawTabard(c, P, k, f, S, pass, o, flat);
    drawTorso(pass);
    drawNeck(pass);
    drawHead(c, P, k, f, S, build, pass, o, flat, opts.t ?? 0);
    drawArm(armF, false, pass);
    if (S.kind === 'shark') {
      drawPauldron(c, P, k, S, pass, o, flat);
      drawSword(c, armF[2], f, pose.armF[0] + pose.armF[1] + lean * 0.5, k, pass, o, flat);
    }
    if (pass === 1 && !flat) drawOutfit(c, P, k, f, S, build, opts.t ?? 0);
  }
  c.restore();
}

// ---------------------------------------------------------------- heads

function drawHead(c, P, k, f, S, build, pass, o, flat, t) {
  const [hx, hy] = P.head;
  const r = build.head * k;
  if (S.kind === 'shark') return drawSharkHead(c, P, k * 1.3, f, S, pass, o, flat);

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

function drawSharkHead(c, P, k, f, S, pass, o, flat) {
  const [hx, hy] = P.head;
  const Q = (dx, dy) => [hx + dx * k * f, hy + dy * k];
  const outline = (pts) => {
    polyPath(c, pts);
    c.lineJoin = 'round';
    c.lineWidth = o * 2;
    c.strokeStyle = OUTLINE;
    c.stroke();
    c.fill();
  };
  const fin = [Q(-4, -3), Q(-10, -14), Q(-7.5, -14.5), Q(0, -5)];
  const skull = [Q(-6, -4.5), Q(1, -6.5), Q(7, -4.5), Q(12.5, -0.5), Q(11, 2), Q(6, 5.5), Q(-1, 6.5), Q(-6, 5)];
  if (pass === 0) {
    c.fillStyle = OUTLINE;
    outline(fin);
    outline(skull);
    return;
  }
  if (flat) {
    c.fillStyle = flat;
    polyPath(c, fin);
    c.fill();
    polyPath(c, skull);
    c.fill();
    return;
  }
  // Fin: two tones.
  c.fillStyle = tone(S.head, 0.7);
  polyPath(c, fin);
  c.fill();
  c.fillStyle = S.head;
  polyPath(c, [Q(-4, -3), Q(-9, -13), Q(-2, -5)]);
  c.fill();
  // Head: dark back, mid flank, pale belly-jaw; counter-shaded like a real shark.
  c.save();
  polyPath(c, skull);
  c.clip();
  c.fillStyle = tone(S.head, 0.72);
  c.fillRect(hx - 20 * k, hy - 10 * k, 40 * k, 20 * k);
  c.fillStyle = S.head;
  polyPath(c, [Q(-6, -2), Q(2, -5.5), Q(12, 0), Q(-6, 1)]);
  c.fill();
  c.fillStyle = tone(S.head, 1.25);
  polyPath(c, [Q(-2, -4.2), Q(5, -4), Q(2, -3.2)]);
  c.fill();
  c.fillStyle = S.belly;
  polyPath(c, [Q(-6, 1.5), Q(12.5, -0.2), Q(11, 2), Q(6, 5.5), Q(-1, 6.5), Q(-6, 5)]);
  c.fill();
  c.fillStyle = tone(S.belly, 0.75);
  polyPath(c, [Q(-6, 4), Q(5, 5), Q(-1, 6.5)]);
  c.fill();
  c.restore();
  // The grin: dark gum line, a row of teeth.
  c.strokeStyle = '#5a1f2a';
  c.lineWidth = Math.max(1, k * 0.9);
  c.beginPath();
  c.moveTo(...Q(-1, 2.2));
  c.lineTo(...Q(10.5, 0.6));
  c.stroke();
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    const [tx, ty] = Q(0 + i * 1.8, 2.1 - i * 0.25);
    c.fillRect(Math.round(tx), Math.round(ty), 1, 2);
  }
  // Eye with a glint; gill slits on the neck.
  const [ex, ey] = Q(5, -2.2);
  c.fillStyle = OUTLINE;
  c.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
  c.fillStyle = '#ffffff';
  c.fillRect(Math.round(ex), Math.round(ey) - 1, 1, 1);
  c.fillStyle = tone(S.head, 0.55);
  for (let i = 0; i < 3; i++) {
    const [gx, gy] = Q(-4 + i * 1.6, 1);
    c.fillRect(Math.round(gx), Math.round(gy), 1, Math.round(3 * k));
  }
}

// ---------------------------------------------------------------- outfits and gear

function drawTabard(c, P, k, f, S, pass, o, flat) {
  // Green tabard over chainmail, hanging from the waist, with gold trim.
  const [hx, hy] = P.hip;
  const path = (g) => polyPath(c, [
    [hx - 8 * k - g, hy - 3 * k - g], [hx + 8 * k + g, hy - 3 * k - g],
    [hx + 7 * k + g, hy + 11 * k + g], [hx + 2 * k * f, hy + 13 * k + g], [hx - 7 * k - g, hy + 11 * k + g],
  ]);
  shadedShape(c, path, [hx, hy + 4 * k], 8 * k, S.cloth, pass, o, flat);
  if (pass === 1 && !flat) {
    c.fillStyle = S.accent;
    c.fillRect(Math.round(hx - 7 * k), Math.round(hy + 10 * k), Math.round(14 * k), Math.max(1, Math.round(k)));
    c.fillStyle = '#9aa1a9'; // chainmail glimpse
    for (let i = -2; i <= 2; i++) c.fillRect(Math.round(hx + i * 2.5 * k), Math.round(hy + 12 * k), 1, 1);
  }
}

function drawPauldron(c, P, k, S, pass, o, flat) {
  const [ex, ey] = P.armF[0];
  const path = (g) => {
    c.beginPath();
    c.ellipse(ex, ey + 1 * k, 7.5 * k + g, 5.5 * k + g, 0, 0, TAU);
  };
  shadedShape(c, path, [ex, ey], 6 * k, S.torso, pass, o, flat);
  if (pass === 1 && !flat) {
    c.strokeStyle = S.accent;
    c.lineWidth = Math.max(1, k);
    c.beginPath();
    c.ellipse(ex, ey + 1 * k, 6.5 * k, 4.5 * k, 0, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();
  }
}

function drawSword(c, [hx, hy], f, angle, k, pass, o, flat) {
  const dx = Math.sin(angle) * f;
  const dy = Math.cos(angle);
  const nx = -dy;
  const ny = dx;
  const len = 30 * k;
  const w = 1.8 * k;
  const blade = (g) => polyPath(c, [
    [hx + nx * (w + g), hy + ny * (w + g)],
    [hx + dx * len * 0.9 + nx * (w * 0.8 + g), hy + dy * len * 0.9 + ny * (w * 0.8 + g)],
    [hx + dx * (len + g), hy + dy * (len + g)],
    [hx + dx * len * 0.9 - nx * (w * 0.8 + g), hy + dy * len * 0.9 - ny * (w * 0.8 + g)],
    [hx - nx * (w + g), hy - ny * (w + g)],
  ]);
  const guard = (g) => capsulePath(c, [hx + dx * 2 * k - nx * 6 * k, hy + dy * 2 * k - ny * 6 * k], [hx + dx * 2 * k + nx * 6 * k, hy + dy * 2 * k + ny * 6 * k], 1.2 * k + g, 1.2 * k + g);
  const grip = (g) => capsulePath(c, [hx - dx * 5 * k, hy - dy * 5 * k], [hx, hy], 1.3 * k + g, 1.3 * k + g);
  if (pass === 0) {
    for (const p of [blade, guard, grip]) {
      p(o);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    return;
  }
  grip(0);
  c.fillStyle = flat || '#4a2f1e';
  c.fill();
  blade(0);
  c.fillStyle = flat || '#aeb6c0';
  c.fill();
  if (!flat) {
    // Bright edge and fuller groove down the blade.
    c.strokeStyle = '#f4f8fc';
    c.lineWidth = Math.max(1, k * 0.8);
    c.beginPath();
    c.moveTo(hx + dx * 4 * k + nx * w * 0.5, hy + dy * 4 * k + ny * w * 0.5);
    c.lineTo(hx + dx * len * 0.92 + nx * w * 0.4, hy + dy * len * 0.92 + ny * w * 0.4);
    c.stroke();
    c.strokeStyle = '#7d8691';
    c.beginPath();
    c.moveTo(hx + dx * 5 * k - nx * w * 0.3, hy + dy * 5 * k - ny * w * 0.3);
    c.lineTo(hx + dx * len * 0.7 - nx * w * 0.3, hy + dy * len * 0.7 - ny * w * 0.3);
    c.stroke();
  }
  guard(0);
  c.fillStyle = flat || '#d4a531';
  c.fill();
  if (!flat) {
    c.fillStyle = '#3fae6a'; // green gem in the guard
    c.fillRect(Math.round(hx + dx * 2 * k) - 1, Math.round(hy + dy * 2 * k) - 1, 2, 2);
  }
}

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
    case 'shark': {
      // Breastplate: gold leaf V, centre gem; gold bracer and boot cuffs; claws.
      line(at(0.95, -7), at(0.5, 0), S.accent, 1.4);
      line(at(0.95, 7), at(0.5, 0), S.accent, 1.4);
      line(at(0.75, -5), at(0.35, 0), tone(S.accent, 0.7), 1);
      line(at(0.75, 5), at(0.35, 0), tone(S.accent, 0.7), 1);
      const [gx, gy] = at(0.5, 0);
      c.fillStyle = '#3fae6a';
      c.fillRect(R(gx) - 1, R(gy) - 1, 3, 3);
      line(at(0.08, -8), at(0.08, 8), S.accent, 1.6); // belt
      const [e, h] = [P.armF[1], P.armF[2]];
      c.save();
      capsulePath(c, [e[0] + (h[0] - e[0]) * 0.45, e[1] + (h[1] - e[1]) * 0.45], [e[0] + (h[0] - e[0]) * 0.68, e[1] + (h[1] - e[1]) * 0.68], build.fore[0] * k * 0.85, build.fore[1] * k * 0.85);
      c.fillStyle = S.accent;
      c.fill();
      c.restore();
      c.fillStyle = OUTLINE;
      c.fillRect(R(h[0] + f * 3 * k), R(h[1] + 1 * k), 1, 2);
      break;
    }
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
