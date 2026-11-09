// Hero and enemy definitions, plus the fighter factory. Pure data + one constructor.
//
// A move's timing is three phases: startup (wind-up, no hit), active (can hit), recovery.
//   reach: [from, to] in pixels in front of the fighter (negative = behind)
//   kb: knockback speed · down: knocks the target down · heavy: longer hitstop + shake
//   pose / windPose: rig poses for the active+recovery and startup phases
//   step / lunge: forward speed during the move · blade: draws a sword smear
//
// Each hero has: combo (tap attack), air (attack while jumping), run (attack while running →→),
// special (ground: a thrown projectile) and airSpecial (special while jumping: a dive).
//
// Style colours drive the rig: torso, arm/armBack, leg/legBack, head, accent, plus extras per kind.
// hud is the hero's colour in the HUD.

export const HEROES = {
  shark: {
    id: 'shark',
    name: 'RAZORFIN', // placeholder: the kids' name for him goes here
    title: 'The Deep-Sea Blade',
    scale: 1.2,
    hp: 130,
    speed: { x: 88, z: 58 },
    jump: 285,
    style: {
      kind: 'shark', hud: '#5fb3d9',
      torso: '#b9bec4', arm: '#5b6b7d', armBack: '#3c4856', leg: '#3c4856', legBack: '#2c3642',
      head: '#5b6b7d', belly: '#e6e4da', accent: '#d4a531', cloth: '#2f6b3f',
    },
    combo: [
      { pose: 'slash', windPose: 'slashWind', startup: 0.09, active: 0.08, recovery: 0.15, reach: [6, 44], dmg: 9, kb: 60, step: 20, blade: true },
      { pose: 'backslash', windPose: 'backslashWind', startup: 0.08, active: 0.08, recovery: 0.17, reach: [6, 44], dmg: 10, kb: 70, step: 20, blade: true },
      { pose: 'cleave', windPose: 'cleaveWind', startup: 0.14, active: 0.09, recovery: 0.28, reach: [6, 48], dmg: 16, kb: 210, down: true, heavy: true, step: 30, blade: true },
    ],
    air: { pose: 'airSlash', reach: [-4, 38], dmg: 12, kb: 150, down: true, blade: true },
    run: {
      name: 'SHARK RUSH', pose: 'rush', startup: 0.05, active: 0.24, recovery: 0.22,
      reach: [-4, 30], dmg: 14, kb: 230, down: true, heavy: true, lunge: 300,
    },
    special: {
      name: 'FIN BLADE', pose: 'throw', windPose: 'throwWind', startup: 0.12, active: 0.05, recovery: 0.25, cooldown: 2.5,
      projectile: { kind: 'blade', speed: 290, dmg: 14, kb: 190, down: true, heavy: true, life: 1.4, half: 10, pierce: true },
    },
    airSpecial: {
      name: 'DEPTH CHARGE', pose: 'dive', reach: [-6, 24], dmg: 12, kb: 160, down: true, heavy: true, cooldown: 2.5,
      dive: { vx: 90, vh: -520 },
      // On landing: a shockwave on both sides.
      quake: { pose: 'quake', startup: 0, active: 0.1, recovery: 0.3, reach: [-48, 48], dmg: 14, kb: 220, down: true, heavy: true },
    },
  },
  nova: {
    id: 'nova',
    name: 'NOVA',
    title: 'The Spark',
    scale: 1,
    hp: 100,
    speed: { x: 112, z: 72 },
    jump: 310,
    style: {
      kind: 'nova', hud: '#e8508c',
      torso: '#e8508c', arm: '#e8508c', armBack: '#a83466', leg: '#3a2a4a', legBack: '#241a30',
      head: '#e8508c', accent: '#ffd23f', visor: '#ffffff',
    },
    combo: [
      { pose: 'jab', startup: 0.05, active: 0.06, recovery: 0.12, reach: [4, 30], dmg: 6, kb: 40, step: 25 },
      { pose: 'cross', startup: 0.05, active: 0.06, recovery: 0.14, reach: [4, 32], dmg: 7, kb: 50, step: 25 },
      { pose: 'highKick', startup: 0.09, active: 0.08, recovery: 0.26, reach: [6, 38], dmg: 12, kb: 170, down: true, heavy: true, step: 40 },
    ],
    air: { pose: 'flyKick', reach: [2, 30], dmg: 10, kb: 140, down: true },
    run: {
      name: 'STAR DASH', pose: 'dash', startup: 0.05, active: 0.22, recovery: 0.2,
      reach: [-6, 26], dmg: 12, kb: 210, down: true, heavy: true, lunge: 380,
    },
    special: {
      name: 'STAR THROW', pose: 'throw', windPose: 'throwWind', startup: 0.06, active: 0.04, recovery: 0.16, cooldown: 1.2,
      projectile: { kind: 'star', speed: 400, dmg: 8, kb: 100, life: 1.0, half: 7 },
    },
    airSpecial: {
      name: 'COMET DIVE', pose: 'diveKick', reach: [0, 30], dmg: 14, kb: 200, down: true, heavy: true, cooldown: 1.8,
      dive: { vx: 260, vh: -420 },
    },
  },
};

// The incoming hero's tag-in strike: a short burst on both sides.
export const TAG_STRIKE = { pose: 'tagIn', startup: 0.04, active: 0.12, recovery: 0.16, reach: [-30, 30], dmg: 6, kb: 160 };

// A short stumble after landing a dive that has no shockwave.
export const LAND_RECOVER = { pose: 'getup', startup: 0, active: 0, recovery: 0.16 };

// The Gutter Kings: the street gang running this block.
export const ENEMIES = {
  punk: {
    id: 'punk',
    name: 'PUNK',
    hp: 28,
    scale: 1,
    speed: { x: 58, z: 40 },
    score: 100,
    style: {
      kind: 'punk',
      torso: '#2d2a35', arm: '#2d2a35', armBack: '#1b1922', leg: '#3b5b8c', legBack: '#2a4166',
      head: '#d9a066', accent: '#39d353', bandana: '#c0392b',
    },
    attack: { pose: 'swipe', startup: 0, active: 0.08, recovery: 0.45, windup: 0.45, reach: [4, 26], dmg: 7, kb: 90 },
  },
  bruiser: {
    id: 'bruiser',
    name: 'BRUISER',
    hp: 90,
    scale: 1.3,
    speed: { x: 34, z: 26 },
    score: 300,
    hurtScale: 0.5, // shrugs off light hits quicker
    style: {
      kind: 'bruiser',
      torso: '#e3dfd2', arm: '#a8653f', armBack: '#7d4a2e', leg: '#4a4f5c', legBack: '#33363f',
      head: '#a8653f', accent: '#e5b839', shades: '#111111',
    },
    attack: { pose: 'smash', startup: 0, active: 0.1, recovery: 0.7, windup: 0.75, reach: [4, 40], dmg: 16, kb: 230, down: true, heavy: true },
  },
};

let nextId = 1;

export function createFighter(def, side, x, z) {
  return {
    id: nextId++,
    side, // 'hero' | 'enemy'
    def,
    x, z, h: 0,
    vx: 0, vz: 0, vh: 0,
    facing: 1,
    state: 'idle',
    t: 0, // time in current state
    hp: def.hp,
    maxHp: def.hp,
    move: null, // current attack definition
    combo: 0, // index into the combo
    queued: false, // next combo hit buffered
    airAttack: false,
    diving: false,
    running: false,
    hits: new Set(), // targets already hit by the current move
    flash: 0, // white hit-flash timer
    invuln: 0,
    lying: false,
    specialCooldown: 0,
    // enemy AI
    token: false,
    attackCooldown: 0,
    homeZ: z,
    jitter: Math.random() * 40 - 20,
  };
}
