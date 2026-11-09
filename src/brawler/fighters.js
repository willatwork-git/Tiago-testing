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
// Style colours drive the rig, one per body region: torso, upperArm, forearm, hand, thigh, shin,
// boot, neck, head, plus extras per kind. Shadows and highlights are derived automatically.
// hud is the hero's colour in the HUD. Enemies can list `variants` (partial styles) so a gang
// isn't a row of clones.
//
// Scale: 1.0 ≈ 56 px tall. Heroes and gang are ~1.5 (≈ 85 px, a third of the screen).

export const HEROES = {
  shark: {
    id: 'shark',
    name: 'RAZORFIN', // placeholder: the kids' name for him goes here
    title: 'The Deep-Sea Blade',
    scale: 1.6,
    hp: 130,
    speed: { x: 108, z: 68 },
    jump: 340,
    style: {
      kind: 'shark', hud: '#5fb3d9',
      torso: '#c2c8cf', upperArm: '#5d6f84', forearm: '#5d6f84', hand: '#5d6f84',
      thigh: '#3f4a58', shin: '#3f4a58', boot: '#d4a531', neck: '#5d6f84',
      head: '#5d6f84', belly: '#ece9de', accent: '#d4a531', cloth: '#1f5a34',
    },
    combo: [
      { pose: 'slash', windPose: 'slashWind', startup: 0.09, active: 0.08, recovery: 0.15, reach: [6, 44], dmg: 9, kb: 60, step: 20, blade: true },
      { pose: 'backslash', windPose: 'backslashWind', startup: 0.08, active: 0.08, recovery: 0.17, reach: [6, 44], dmg: 10, kb: 70, step: 20, blade: true },
      { pose: 'cleave', windPose: 'cleaveWind', followPose: 'cleaveFollow', startup: 0.14, active: 0.09, recovery: 0.28, reach: [6, 48], dmg: 16, kb: 210, down: true, heavy: true, step: 30, blade: true },
    ],
    air: { pose: 'airSlash', reach: [-4, 38], dmg: 12, kb: 150, down: true, blade: true },
    run: {
      name: 'SHARK RUSH', pose: 'rush', startup: 0.05, active: 0.24, recovery: 0.22,
      reach: [-4, 30], dmg: 14, kb: 260, down: true, heavy: true, lunge: 380,
    },
    special: {
      name: 'FIN BLADE', pose: 'throw', windPose: 'throwWind', startup: 0.12, active: 0.05, recovery: 0.25, cooldown: 2.5,
      projectile: { kind: 'blade', speed: 290, dmg: 14, kb: 190, down: true, heavy: true, life: 1.4, half: 10, pierce: true },
    },
    airSpecial: {
      name: 'DEPTH CHARGE', pose: 'dive', reach: [-6, 24], dmg: 12, kb: 160, down: true, heavy: true, cooldown: 2.5,
      dive: { vx: 110, vh: -600 },
      // On landing: a shockwave on both sides.
      quake: { pose: 'quake', startup: 0, active: 0.1, recovery: 0.3, reach: [-48, 48], dmg: 14, kb: 220, down: true, heavy: true },
    },
  },
  nova: {
    id: 'nova',
    name: 'NOVA',
    title: 'The Spark',
    scale: 1.45,
    hp: 100,
    speed: { x: 140, z: 86 },
    jump: 380,
    style: {
      kind: 'nova', hud: '#e8508c',
      torso: '#e8508c', upperArm: '#e8508c', forearm: '#e8508c', hand: '#f5f3f7',
      thigh: '#3a2a4a', shin: '#3a2a4a', boot: '#f5f3f7', neck: '#3a2a4a',
      head: '#e8508c', accent: '#ffd23f', visor: '#7ee8ff',
    },
    combo: [
      { pose: 'jab', startup: 0.05, active: 0.06, recovery: 0.12, reach: [4, 30], dmg: 6, kb: 40, step: 25 },
      { pose: 'cross', startup: 0.05, active: 0.06, recovery: 0.14, reach: [4, 32], dmg: 7, kb: 50, step: 25 },
      { pose: 'highKick', startup: 0.09, active: 0.08, recovery: 0.26, reach: [6, 38], dmg: 12, kb: 170, down: true, heavy: true, step: 40 },
    ],
    air: { pose: 'flyKick', reach: [2, 30], dmg: 10, kb: 140, down: true },
    run: {
      name: 'STAR DASH', pose: 'dash', startup: 0.05, active: 0.22, recovery: 0.2,
      reach: [-6, 26], dmg: 12, kb: 240, down: true, heavy: true, lunge: 470,
    },
    special: {
      name: 'STAR THROW', pose: 'throw', windPose: 'throwWind', startup: 0.06, active: 0.04, recovery: 0.16, cooldown: 1.2,
      projectile: { kind: 'star', speed: 400, dmg: 8, kb: 100, life: 1.0, half: 7 },
    },
    airSpecial: {
      name: 'COMET DIVE', pose: 'diveKick', reach: [0, 30], dmg: 14, kb: 200, down: true, heavy: true, cooldown: 1.8,
      dive: { vx: 320, vh: -500 },
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
    scale: 1.45,
    speed: { x: 72, z: 48 },
    score: 100,
    style: {
      kind: 'punk',
      torso: '#2b2830', upperArm: '#2b2830', forearm: '#2b2830', hand: '#d9a066',
      thigh: '#3b5b8c', shin: '#3b5b8c', boot: '#e8e4da', neck: '#d9a066',
      head: '#d9a066', hair: '#39d353', shirt: '#c0392b',
    },
    variants: [
      {},
      { torso: '#5a2130', upperArm: '#5a2130', forearm: '#5a2130', hair: '#ff4fd8', shirt: '#e8e4da', head: '#a8653f', hand: '#a8653f', neck: '#a8653f' },
      { torso: '#2f4a6b', upperArm: '#2f4a6b', forearm: '#2f4a6b', hair: '#ffd23f', thigh: '#2a2630', shin: '#2a2630', head: '#e8c4a0', hand: '#e8c4a0', neck: '#e8c4a0' },
    ],
    attack: { pose: 'swipe', startup: 0, active: 0.08, recovery: 0.45, windup: 0.45, reach: [4, 26], dmg: 7, kb: 90 },
  },
  bruiser: {
    id: 'bruiser',
    name: 'BRUISER',
    hp: 90,
    scale: 1.75,
    speed: { x: 44, z: 32 },
    score: 300,
    hurtScale: 0.5, // shrugs off light hits quicker
    style: {
      kind: 'bruiser',
      torso: '#e8e4d8', upperArm: '#a8653f', forearm: '#a8653f', hand: '#a8653f',
      thigh: '#4a4f5c', shin: '#4a4f5c', boot: '#2a2420', neck: '#a8653f',
      head: '#a8653f', accent: '#e5b839', shades: '#111111',
    },
    variants: [
      {},
      { upperArm: '#6e4026', forearm: '#6e4026', hand: '#6e4026', neck: '#6e4026', head: '#6e4026', torso: '#c94b3a' },
      { upperArm: '#e0b48a', forearm: '#e0b48a', hand: '#e0b48a', neck: '#e0b48a', head: '#e0b48a', torso: '#3a3f4a', thigh: '#6b5a44', shin: '#6b5a44' },
    ],
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
    // Look: a random variant for enemies, so the gang isn't a row of clones.
    style: def.variants ? { ...def.style, ...def.variants[Math.floor(Math.random() * def.variants.length)] } : def.style,
  };
}
