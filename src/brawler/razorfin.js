// Razorfin's own renderer: an enormous, laid-back elven shark knight.
// Reference: the kids' concept art (temp-concepts/shark-warrior.png) for the character;
// modern comic-book pixel art (Marvel Cosmic Invasion) for the treatment.
//
// Presentation only. def.scale still drives combat reach and collision; every proportion here
// (short legs, barrel chest, huge arms) lives in the drawing code.
//
// He is drawn in THREE-QUARTER view, like brawler sprites and the concept art: the chest turns
// towards the camera, so the shoulders sit at the edges of a V-shaped torso and both arms hang
// outside it (near arm in front of the body, far arm behind). Pure profile turns his bulk into a blob.
//
// Silhouette rules, in priority order:
//   1. Barrel chest, sharp taper at the waist.
//   2. Bare upper arms as big as his head; heavy forearms and big hands.
//   3. Short legs on little pointed boots, both feet planted on the road.
//   4. Free arm hangs near his boots with a visible gap from the body.
//   5. Heavy brow, broad white jaw, a few readable triangular teeth.
// Armour is a few big shapes: overlapping silver leaf plates, dark seams, thin gold edges,
// one deep-green cloth panel, a pointed bracer. Fine engraving and chainmail only appear in the
// larger title treatment (opts.detail).

import { OUTLINE, tone, capsulePath, shadedCapsule, polyPath, shadedShape, limb } from './paint.js';

const TAU = Math.PI * 2;
const VISUAL = 1.12; // drawn a little larger than his hitbox scale: he should loom
const HEAD = 0.76; // head about the size of one upper arm

// Skeleton in units (× scale × VISUAL).
const SK = {
  thigh: 7.5, shin: 7, torso: 20, armU: 11, armL: 12, sword: 36,
  thighR: [6.2, 4.6], shinR: [4.6, 3.4],
  upperR: [6.8, 5.6], // bare upper arm: about the size of his head
  foreR: [5.0, 6.1], // forearm thickens towards the wrist
  fist: 5.6,
  torsoW: { hip: 7, waist: 5.0, belly: 9.5, chest: 13.4, top: 11.2 }, // barrel chest, sharp waist
};

// ---------------------------------------------------------------- poses
// Same angle convention as rig.js. Extra fields:
//   head: extra head tilt (+ = chin down) · shrug: shoulder height offset (− = dropped)
//   sword: absolute blade angle (overrides "follow the forearm") · plant: sword planted on the road
//   lead: the armoured shoulder leads (Shark Rush) · bob: body dip in units

export const RAZORFIN_POSES = {
  // Laid-back: shoulders dropped, slight hunch, chin down. The near arm hangs free past the
  // narrow waist (the gap shows his bulk); the sword rides low in the far hand, tip towards the road.
  idle: { lean: 0.1, head: 0.16, shrug: -1.8, armF: [0.18, 0.62], sword: 1.05, armB: [-0.1, -0.04], legF: [0.1, -0.04], legB: [-0.08, 0.02] },
  // Title: three-quarter, upright, near hand resting on the planted sword, far arm hanging free.
  title: { lean: 0.0, head: 0.06, shrug: -0.8, armF: [1.0, -1.05], plant: true, armB: [-0.12, -0.05], legF: [0.24, -0.04], legB: [-0.22, 0.03], threeQuarter: true },
  // The cleave in three distinct beats.
  cleaveWind: { lean: -0.2, head: -0.05, armF: [3.0, 0.12], armB: [2.7, 0.5], legF: [0.35, -0.15], legB: [-0.42, 0] },
  cleave: { lean: 0.5, head: 0.1, armF: [1.72, -0.06], armB: [1.45, 0.25], legF: [0.68, -0.35], legB: [-0.62, 0.05] },
  cleaveFollow: { lean: 0.66, head: 0.22, armF: [0.72, -0.34], armB: [0.95, 0.45], legF: [0.82, -0.95], legB: [-0.62, -0.28], bob: 2 },
  slashWind: { lean: -0.05, head: 0.05, armF: [-0.55, 1.65], armB: [0.2, 1.2], legF: [0.35, -0.15], legB: [-0.4, 0] },
  slash: { lean: 0.26, head: 0.1, armF: [1.55, 0.05], armB: [0.1, 0.9], legF: [0.5, -0.2], legB: [-0.45, 0] },
  backslashWind: { lean: 0.1, head: 0.05, armF: [2.55, 0.25], armB: [0.2, 1.2], legF: [0.4, -0.15], legB: [-0.4, 0] },
  backslash: { lean: 0.2, head: 0.12, armF: [1.95, -0.95], armB: [0.2, 1.0], legF: [0.5, -0.2], legB: [-0.45, 0] },
  airSlash: { lean: 0.22, head: 0.1, armF: [1.35, 0.35], armB: [-0.5, 1.0], legF: [0.9, -1.5], legB: [0.3, -1.3] },
  // Shark Rush: armoured shoulder first, head tucked, sword trailing.
  rush: { lean: 0.86, head: 0.3, lead: true, armF: [-0.45, -1.25], armB: [0.55, 1.9], legF: [1.0, -0.9], legB: [-1.1, -0.2] },
  // He throws the Fin Blade with his free hand; the sword stays low.
  throwWind: { lean: -0.15, head: 0, armB: [-1.3, 1.3], armF: [0.25, 0.7], sword: 1.3, legF: [0.4, -0.15], legB: [-0.45, 0] },
  throw: { lean: 0.3, head: 0.1, armB: [1.75, 0], armF: [0.2, 0.6], sword: 1.35, legF: [0.5, -0.2], legB: [-0.5, 0] },
  dive: { lean: 0.45, head: 0.2, armF: [0.3, 0.05], sword: 0.08, armB: [2.4, 0.4], legF: [0.9, -1.5], legB: [0.35, -1.3] },
  quake: { lean: 0.62, head: 0.25, armF: [0.55, 0.15], sword: 0.15, armB: [1.0, 0.5], legF: [0.95, -1.1], legB: [-0.75, -0.6], bob: 2.5 },
  tagIn: { lean: 0.05, head: 0, armF: [1.57, 0], armB: [-1.57, 0], legF: [0.5, -0.1], legB: [-0.5, 0] },
  jump: { lean: 0.05, head: 0, armF: [1.9, 0.5], armB: [2.1, 0.6], legF: [0.9, -1.7], legB: [0.3, -1.5] },
  hurt: { lean: -0.38, head: -0.3, armF: [0.2, 0.5], sword: 0.9, armB: [-0.75, 0.3], legF: [0.25, -0.1], legB: [-0.3, 0] },
  down: { lean: 0, head: 0, armF: [2.8, 0], armB: [2.4, 0.3], legF: [0.2, 0], legB: [-0.1, 0] },
  getup: { lean: 0.55, head: 0.2, armF: [0.8, 0.5], sword: 0.3, armB: [0.3, 0.6], legF: [1.2, -2.0], legB: [0.6, -1.8], bob: 3 },
};

/** Short, heavy steps: small stride, a dip on each footfall, a little shoulder roll. */
export function razorfinWalk(phase, run = false) {
  const s = Math.sin(phase);
  const dip = Math.abs(Math.cos(phase));
  if (run) {
    return {
      lean: 0.42, head: 0.18, armF: [-0.3, 0.9], sword: -1.9, armB: [0.4 + 0.5 * s, 1.5],
      legF: [0.65 * s, -0.2 - 0.9 * Math.max(0, -s)], legB: [-0.65 * s, -0.2 - 0.9 * Math.max(0, s)], bob: 1.5 * (1 - dip),
    };
  }
  return {
    lean: 0.14 + 0.03 * s, head: 0.16, shrug: -1.6,
    armF: [0.2 + 0.05 * s, 0.62], sword: 1.05 + 0.05 * s, armB: [-0.1 - 0.16 * s, -0.04], // free arm swings, sword stays low
    legF: [0.32 * s, -0.08 - 0.45 * Math.max(0, -s)], legB: [-0.32 * s, -0.08 - 0.45 * Math.max(0, s)],
    bob: 1.6 * (1 - dip), // the whole body drops as each foot lands
  };
}

// ---------------------------------------------------------------- skeleton

function skeleton(pose, facing, K) {
  const f = facing;
  // Legs first, from a hip at the origin, so we can stand the feet exactly on the road.
  const leg = ([u, l], side) => {
    const hip = [side * f * 3.8 * K, 0]; // three-quarter: feet set apart
    const knee = limb(hip[0], hip[1], f, u, SK.thigh * K);
    const ankle = limb(knee[0], knee[1], f, u + l, SK.shin * K);
    const dir = [Math.cos(u + l) * f, -Math.sin(u + l)];
    return { hip, knee, ankle, dir };
  };
  const legF = leg(pose.legF, 1);
  const legB = leg(pose.legB, -1);
  const lowest = Math.max(legF.ankle[1], legB.ankle[1]) + 2.4 * K; // boot sole
  const dy = -lowest + (pose.bob ?? 0) * K;
  for (const l of [legF, legB]) for (const k of ['hip', 'knee', 'ankle']) l[k] = [l[k][0], l[k][1] + dy];

  const hip = [0, dy];
  const lean = pose.lean;
  const up = [Math.sin(lean) * f, -Math.cos(lean)];
  const across = [-up[1], up[0]];
  const at = (frac) => [hip[0] + up[0] * SK.torso * K * frac, hip[1] + up[1] * SK.torso * K * frac];
  const shoulderY = 0.86 + (pose.shrug ?? 0) / SK.torso;
  const sJoint = (side) => {
    const p = at(shoulderY);
    // Three-quarter: shoulders at the edges of the barrel chest, near one towards the facing.
    const w = SK.torsoW.top * 0.9 * K * (pose.threeQuarter ? 1.08 : 1) + (pose.lead && side > 0 ? 2 * K : 0);
    return [p[0] + side * w * Math.cos(lean) * f, p[1] + side * w * Math.sin(lean)];
  };
  const arm = ([u, l], side) => {
    const s = sJoint(side);
    const e = limb(s[0], s[1], f, u + lean * 0.5, SK.armU * K);
    return [s, e, limb(e[0], e[1], f, u + l + lean * 0.5, SK.armL * K)];
  };
  const armF = arm(pose.armF, 1);
  const armB = arm(pose.armB, -1);
  // The head sits forward and low on the hunched shoulders: no neck to speak of.
  const neck = at(1.0);
  const headAt = [neck[0] + f * 3.5 * K * Math.cos(lean) + up[0] * 4 * K, neck[1] + up[1] * 4 * K];
  const back = pose.swordHand === 'B';
  const swordArm = back ? armB : armF;
  const gripPose = back ? pose.armB : pose.armF;
  const swordAngle = pose.plant ? 0 : pose.sword ?? gripPose[0] + gripPose[1] + lean * 0.5;
  return { f, K, hip, up, across, at, legF, legB, armF, armB, swordArm, swordBack: back, headAt, headTilt: lean * 0.55 + (pose.head ?? 0), swordAngle };
}

/** Where the blade is for a pose (relative to the feet): for aligning slash smears. */
export function razorfinSword(pose, facing, scale) {
  const sk = skeleton(pose, facing, scale * VISUAL);
  const [hx, hy] = sk.swordArm[2];
  const len = SK.sword * sk.K;
  const tip = [hx + Math.sin(sk.swordAngle) * facing * len, hy + Math.cos(sk.swordAngle) * len];
  return { shoulder: sk.swordArm[0], hand: [hx, hy], tip };
}

// ---------------------------------------------------------------- drawing

/** Draw a closed shape: pass 0 paints a fat outline, pass 1 the shaded fill. */
function blob(c, path, centre, size, colour, pass, o, flat) {
  if (pass === 0) {
    path();
    c.fillStyle = OUTLINE;
    c.fill();
    c.lineWidth = o * 2;
    c.lineJoin = 'round';
    c.strokeStyle = OUTLINE;
    c.stroke();
    return;
  }
  shadedShape(c, () => path(), centre, size, colour, 1, 0, flat);
}

/** An almond "leaf" plate from base to tip with a given width. */
function leafPts(base, tip, width) {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const len = Math.hypot(dx, dy) || 1;
  const n = [-dy / len, dx / len];
  const pt = (t, w) => [base[0] + dx * t + n[0] * w, base[1] + dy * t + n[1] * w];
  return [base, pt(0.2, width * 0.42), pt(0.5, width * 0.5), pt(0.8, width * 0.3), tip, pt(0.8, -width * 0.3), pt(0.5, -width * 0.5), pt(0.2, -width * 0.42)];
}

/** A silver leaf plate: shaded metal, dark seam, thin gold edge, bright specks. */
function plate(c, base, tip, width, S, pass, o, flat, detail) {
  const pts = leafPts(base, tip, width);
  const centre = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2];
  if (pass === 0) return blob(c, () => polyPath(c, pts), centre, width, S.torso, 0, o, flat);
  // seam first, so the plate overlaps the one behind it with a dark line
  polyPath(c, pts);
  c.lineWidth = Math.max(1, o * 0.9);
  c.strokeStyle = OUTLINE;
  c.stroke();
  if (flat) {
    c.fillStyle = flat;
    c.fill();
    return;
  }
  shadedShape(c, () => polyPath(c, pts), centre, width * 0.75, S.torso, 1, 0, null);
  // Gold edge along the outer rim.
  c.strokeStyle = S.accent;
  c.lineWidth = Math.max(1, o * 0.45);
  c.beginPath();
  c.moveTo(...pts[1]);
  c.lineTo(...pts[2]);
  c.lineTo(...pts[3]);
  c.lineTo(...pts[4]);
  c.stroke();
  // Two small bright metal highlights near the lit edge.
  c.fillStyle = '#ffffff';
  const hl = (t, w) => [base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t + w];
  const [h1x, h1y] = hl(0.3, -width * 0.12);
  c.fillRect(Math.round(h1x), Math.round(h1y), 2, 1);
  c.fillRect(Math.round(h1x) + 1, Math.round(h1y) + 2, 1, 1);
  if (detail) {
    // Title treatment only: a curling vine engraving down the plate.
    c.strokeStyle = tone(S.accent, 0.8);
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i <= 8; i++) {
      const t = 0.15 + i * 0.08;
      const [px, py] = [base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t];
      const w = Math.sin(i * 1.4) * width * 0.15;
      i ? c.lineTo(px + w, py) : c.moveTo(px + w, py);
    }
    c.stroke();
  }
}

function drawArm(c, a, S, K, pass, o, flat, back, f) {
  const col = (n) => (back ? tone(S[n], 0.78) : S[n]);
  shadedCapsule(c, a[0], a[1], SK.upperR[0] * K, SK.upperR[1] * K, col('upperArm'), pass, o, flat);
  shadedCapsule(c, a[1], a[2], SK.foreR[0] * K, SK.foreR[1] * K, col('forearm'), pass, o, flat);
  // Pointed elven bracer: from the wrist, tapering to a point past the elbow.
  const [e, h] = [a[1], a[2]];
  const d = [h[0] - e[0], h[1] - e[1]];
  const len = Math.hypot(...d) || 1;
  const n = [-d[1] / len, d[0] / len];
  const at = (t, w) => [e[0] + d[0] * t + n[0] * w * K, e[1] + d[1] * t + n[1] * w * K];
  const bracer = [at(-0.12, 0), at(0.25, 5.4), at(0.85, 6.6), at(0.85, -6.6), at(0.25, -5.4)];
  blob(c, () => polyPath(c, bracer), at(0.5, 0), 5 * K, back ? tone(S.torso, 0.8) : S.torso, pass, o * 0.8, flat);
  if (pass === 1 && !flat) {
    c.strokeStyle = S.accent;
    c.lineWidth = Math.max(1, K * 0.6);
    c.beginPath();
    c.moveTo(...bracer[1]);
    c.lineTo(...bracer[0]);
    c.lineTo(...bracer[4]);
    c.stroke();
  }
  // Big hand with dark claws.
  shadedCapsule(c, a[2], a[2], SK.fist * K, SK.fist * K, col('hand'), pass, o, flat);
  if (pass === 1 && !flat) {
    c.fillStyle = OUTLINE;
    for (let i = -1; i <= 1; i++) c.fillRect(Math.round(h[0] + f * 3.5 * K + i), Math.round(h[1] + 3 * K + Math.abs(i)), 1, 2);
  }
}

function drawLeg(c, l, S, K, pass, o, flat, back) {
  const col = (n) => (back ? tone(S[n], 0.75) : S[n]);
  shadedCapsule(c, l.hip, l.knee, SK.thighR[0] * K, SK.thighR[1] * K, col('thigh'), pass, o, flat);
  shadedCapsule(c, l.knee, l.ankle, SK.shinR[0] * K, SK.shinR[1] * K, col('shin'), pass, o, flat);
  // Little pointed elven boot, toe curling up.
  const [ax, ay] = l.ankle;
  const [dx, dy] = l.dir;
  const upv = [dy, -dx * 0]; // boots stay level on the road
  const P = (fwd, rise) => [ax + dx * fwd * K, ay - rise * K + dy * fwd * K + upv[1]];
  const boot = [P(-2.6, 3.4), P(2.5, 3.6), P(6.5, 1.6), P(9.5, 2.6), P(8, 0.4), P(-2.8, 0)];
  blob(c, () => polyPath(c, boot), P(2, 1.5), 3 * K, back ? tone(S.boot, 0.75) : S.boot, pass, o, flat);
}

function drawHead(c, sk, S, pass, o, flat) {
  const { f, K } = sk;
  const [hx, hy] = sk.headAt;
  const a = sk.headTilt * f;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const Q = (dx, dy) => {
    const x = dx * K * HEAD * f;
    const y = dy * K * HEAD;
    return [hx + x * ca - y * sa, hy + x * sa + y * ca];
  };
  const fin = [Q(-6, -5), Q(-13, -18.5), Q(-9.5, -19), Q(-1, -7)];
  const skull = [Q(-8, 3), Q(-7, -3), Q(-2, -8), Q(5, -8.5), Q(10, -6.5), Q(15, -3.5), Q(19.5, 0), Q(16.5, 2.6), Q(13.5, 6.5), Q(6, 10.5), Q(-3, 9.5)];
  if (pass === 0) {
    for (const pts of [fin, skull]) blob(c, () => polyPath(c, pts), Q(4, 0), 8 * K, S.head, 0, o, flat);
    return;
  }
  if (flat) {
    c.fillStyle = flat;
    for (const pts of [fin, skull]) {
      polyPath(c, pts);
      c.fill();
    }
    return;
  }
  // Fin: shaded back face, lit front face.
  c.fillStyle = tone(S.head, 0.7);
  polyPath(c, fin);
  c.fill();
  c.fillStyle = S.head;
  polyPath(c, [Q(-6, -5), Q(-12.5, -18), Q(-3, -7)]);
  c.fill();
  // Head: counter-shaded (dark back, lit flank), broad pale jaw.
  c.save();
  polyPath(c, skull);
  c.clip();
  c.fillStyle = tone(S.head, 0.68);
  c.fillRect(hx - 30 * K, hy - 30 * K, 60 * K, 60 * K);
  c.fillStyle = S.head;
  polyPath(c, [Q(-8, -1), Q(-2, -6.5), Q(9, -5.5), Q(19, 0), Q(-8, 2)]);
  c.fill();
  c.fillStyle = tone(S.head, 1.28);
  polyPath(c, [Q(-1, -6.8), Q(7, -6.6), Q(3, -5.6)]);
  c.fill();
  c.fillStyle = S.belly;
  polyPath(c, [Q(-8, 3.5), Q(1, 3.2), Q(17.5, 1.4), Q(16.5, 2.6), Q(13.5, 6.5), Q(6, 10.5), Q(-3, 9.5)]);
  c.fill();
  c.fillStyle = tone(S.belly, 0.72);
  polyPath(c, [Q(-3, 9.5), Q(6, 10.5), Q(8, 8), Q(-2, 7)]);
  c.fill();
  c.restore();
  // Heavy brow: a dark overhang shading the eye.
  c.fillStyle = tone(S.head, 0.45);
  polyPath(c, [Q(2.5, -6), Q(11.5, -5.2), Q(10, -3.4), Q(3.5, -4)]);
  c.fill();
  const [ex, ey] = Q(8, -2.6);
  c.fillStyle = OUTLINE;
  c.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 2);
  c.fillStyle = '#ffffff';
  c.fillRect(Math.round(ex), Math.round(ey) - 1, 1, 1);
  // The grin and four big triangular teeth.
  c.strokeStyle = '#4a1822';
  c.lineWidth = Math.max(1, K * 0.9);
  c.beginPath();
  c.moveTo(...Q(1, 3.6));
  c.quadraticCurveTo(...Q(9, 4.4), ...Q(16.5, 2.2));
  c.stroke();
  for (let i = 0; i < 4; i++) {
    const x0 = 4.2 + i * 3;
    const tooth = [Q(x0, 3.3 - i * 0.15), Q(x0 + 2.4, 3.1 - i * 0.2), Q(x0 + 1.2, 6.2 - i * 0.25)];
    polyPath(c, tooth);
    c.fillStyle = '#ffffff';
    c.fill();
    c.lineWidth = 0.6;
    c.strokeStyle = OUTLINE;
    c.stroke();
  }
  // Gill slits.
  c.strokeStyle = tone(S.head, 0.5);
  c.lineWidth = Math.max(1, K * 0.6);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(...Q(-5 + i * 2, 0.5));
    c.lineTo(...Q(-6 + i * 2, 5.5));
    c.stroke();
  }
}

function drawSword(c, sk, S, pass, o, flat, groundY) {
  const { f, K } = sk;
  const [hx, hy] = sk.swordArm[2];
  const ang = sk.swordAngle;
  const dx = Math.sin(ang) * f;
  const dy = Math.cos(ang);
  const nx = -dy;
  const ny = dx;
  // Planted: the blade reaches exactly to the road, the hand rests on the pommel.
  const gripLen = 5 * K;
  const start = sk.plant ? [hx, hy + gripLen] : [hx, hy];
  const len = sk.plant ? groundY - start[1] : SK.sword * K;
  const w = (sk.plant ? 3.2 : 2.6) * K;
  const P = (t, side) => [start[0] + dx * len * t + nx * side, start[1] + dy * len * t + ny * side];
  const blade = [P(0, w), P(0.88, w * 0.8), P(1, 0), P(0.88, -w * 0.8), P(0, -w)];
  const guard = [[start[0] - nx * 7 * K, start[1] - ny * 7 * K], [start[0] + nx * 7 * K, start[1] + ny * 7 * K]];
  const grip = sk.plant ? [[hx, hy - 1 * K], start] : [[hx - dx * gripLen, hy - dy * gripLen], [hx, hy]];
  if (pass === 0) {
    blob(c, () => polyPath(c, blade), P(0.5, 0), w, '#aeb6c0', 0, o, flat);
    capsulePath(c, ...guard, 1.4 * K + o, 1.4 * K + o);
    c.fillStyle = OUTLINE;
    c.fill();
    capsulePath(c, ...grip, 1.5 * K + o, 1.5 * K + o);
    c.fill();
    return;
  }
  capsulePath(c, ...grip, 1.5 * K, 1.5 * K);
  c.fillStyle = flat || '#4a2f1e';
  c.fill();
  polyPath(c, blade);
  c.fillStyle = flat || '#aeb6c0';
  c.fill();
  if (!flat) {
    c.strokeStyle = '#f4f8fc'; // bright edge
    c.lineWidth = Math.max(1, K * 0.8);
    c.beginPath();
    c.moveTo(...P(0.05, w * 0.55));
    c.lineTo(...P(0.9, w * 0.45));
    c.stroke();
    c.strokeStyle = '#7d8691'; // fuller groove
    c.beginPath();
    c.moveTo(...P(0.06, -w * 0.25));
    c.lineTo(...P(0.65, -w * 0.25));
    c.stroke();
  }
  capsulePath(c, ...guard, 1.4 * K, 1.4 * K);
  c.fillStyle = flat || S.accent;
  c.fill();
  if (!flat) {
    c.fillStyle = '#3fae6a'; // green gem
    c.fillRect(Math.round(start[0]) - 1, Math.round(start[1]) - 1, 3, 3);
    const pom = sk.plant ? [hx, hy - 2 * K] : grip[0];
    c.fillStyle = S.accent;
    c.fillRect(Math.round(pom[0]) - 1, Math.round(pom[1]) - 1, 3, 3);
  }
}

/**
 * Draw Razorfin with his feet at (x, y). Same signature as drawRig.
 * opts: flash, alpha, rotate, t, bob, detail (title-size engraving + chainmail)
 */
export function drawRazorfin(c, x, y, facing, pose, S, scale = 1, opts = {}) {
  const K = scale * VISUAL;
  const sk = skeleton(pose, facing, K);
  sk.plant = !!pose.plant;
  const f = facing;
  const flat = opts.flash ? '#ffffff' : null;
  const o = 1.5 * K;
  const breathe = pose === RAZORFIN_POSES.idle || pose === RAZORFIN_POSES.title ? Math.sin((opts.t ?? 0) * 1.6) * 0.5 * K : 0;
  const detail = !!opts.detail;
  const wide = pose.threeQuarter ? 1.12 : 1; // three-quarter view shows more of the chest

  c.save();
  c.globalAlpha = opts.alpha ?? 1;
  c.translate(Math.round(x), Math.round(y));
  if (opts.rotate) c.rotate(opts.rotate);
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Torso outline points: barrel chest, sharp waist.
  const W = SK.torsoW;
  const row = (frac, w) => {
    const p = sk.at(frac);
    const ww = w * K * wide + (frac > 0.4 ? breathe : 0);
    return [[p[0] + sk.across[0] * ww, p[1] + sk.across[1] * ww], [p[0] - sk.across[0] * ww, p[1] - sk.across[1] * ww]];
  };
  const rows = [row(-0.04, W.hip), row(0.2, W.waist), row(0.45, W.belly), row(0.72, W.chest), row(0.93, W.top), row(1.04, W.top * 0.55)];
  const torso = [...rows.map((r) => r[0]), ...rows.slice().reverse().map((r) => r[1])];
  const torsoCentre = sk.at(0.6);

  for (const pass of [0, 1]) {
    drawArm(c, sk.armB, S, K, pass, o, flat, true, f);
    if (sk.swordBack) drawSword(c, sk, S, pass, o, flat, 0); // carried in the far hand: behind the body
    drawLeg(c, sk.legB, S, K, pass, o, flat, true);
    drawLeg(c, sk.legF, S, K, pass, o, flat, false);
    if (detail && pass === 1 && !flat) {
      // Chainmail glimpsed between tabard and thighs (title only).
      const [cx, cy] = sk.at(-0.15);
      c.fillStyle = '#7d848c';
      c.fillRect(Math.round(cx - 7 * K), Math.round(cy), Math.round(14 * K), Math.round(4 * K));
      c.fillStyle = '#b8bec6';
      for (let i = 0; i < 14 * K; i += 2) for (let j = 0; j < 4 * K; j += 2) c.fillRect(Math.round(cx - 7 * K + i + (j % 4 ? 1 : 0)), Math.round(cy + j), 1, 1);
    }
    // Body under the armour (shark skin shows at the waist and shoulders).
    blob(c, () => polyPath(c, torso), torsoCentre, W.chest * K, S.upperArm, pass, o, flat);
    // Deep-green cloth panel hanging from the belt.
    const [bx, by] = sk.at(0.02);
    const panel = [[bx - 4 * K, by - 1 * K], [bx + 4 * K, by - 1 * K], [bx + 3.6 * K, by + 10 * K], [bx, by + 12 * K], [bx - 3.6 * K, by + 10 * K]];
    blob(c, () => polyPath(c, panel), [bx, by + 4 * K], 5 * K, S.cloth, pass, o, flat);
    if (pass === 1 && !flat) {
      c.strokeStyle = S.accent;
      c.lineWidth = Math.max(1, K * 0.5);
      c.beginPath();
      c.moveTo(...panel[2]);
      c.lineTo(...panel[3]);
      c.lineTo(...panel[4]);
      c.stroke();
      // Leather belt with a gold buckle.
      const l = sk.at(0.06);
      c.strokeStyle = '#3a2618';
      c.lineWidth = 2.4 * K;
      c.beginPath();
      c.moveTo(l[0] - sk.across[0] * W.waist * K * 1.1, l[1] - sk.across[1] * W.waist * K * 1.1);
      c.lineTo(l[0] + sk.across[0] * W.waist * K * 1.1, l[1] + sk.across[1] * W.waist * K * 1.1);
      c.stroke();
      c.fillStyle = S.accent;
      c.fillRect(Math.round(l[0] + f * 2 * K) - 2, Math.round(l[1]) - 2, 4, 4);
    }
    // Pale shark belly between the breastplate and the belt, as in the concept art.
    const side = (frac, d) => {
      const p = sk.at(frac);
      return [p[0] + sk.across[0] * d * K * f, p[1] + sk.across[1] * d * K];
    };
    if (pass === 1) {
      const belly = [side(0.12, -3), side(0.12, 3.4), side(0.5, 6.5), side(0.5, -5)];
      c.fillStyle = flat || S.belly;
      polyPath(c, belly);
      c.fill();
    }
    // Far shoulder's pauldron (in shadow), then the breastplate: two overlapping silver leaves
    // meeting in a V over the barrel chest, the near one on top.
    const sb = sk.armB[0];
    plate(c, [sb[0] + f * 2 * K, sb[1] - 4 * K], [sb[0] - f * 2 * K, sb[1] + 8 * K], 9 * K, { ...S, torso: tone(S.torso, 0.8) }, pass, o, flat, detail);
    plate(c, side(1.0, -9), side(0.34, 1.5), 11 * K * wide, { ...S, torso: tone(S.torso, 0.88) }, pass, o, flat, detail);
    plate(c, side(1.0, 9), side(0.3, 0), 12 * K * wide, S, pass, o, flat, detail);

    drawArm(c, sk.armF, S, K, pass, o, flat, false, f);
    // Pauldron leaf over the front shoulder (bigger and further forward when it leads a charge).
    const sh = sk.armF[0];
    const lead = pose.lead ? 1.45 : 1;
    plate(c, [sh[0] - f * 2 * K, sh[1] - 4.5 * K * lead], [sh[0] + f * 2.5 * K * lead, sh[1] + 8.5 * K * lead], 10 * K * lead, S, pass, o, flat, detail);
    // Head last of the body: the hunched shoulders frame it but never hide the brow, jaw or teeth.
    drawHead(c, sk, S, pass, o, flat);
    if (!sk.swordBack) drawSword(c, sk, S, pass, o, flat, 0);
  }
  c.restore();
}
