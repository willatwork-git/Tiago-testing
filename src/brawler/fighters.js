// Hero and enemy definitions, plus the fighter factory. Pure data + one constructor.
//
// A move's timing is three phases: startup (wind-up, no hit), active (can hit), recovery.
// reach: [from, to] in pixels in front of the fighter (negative = behind).
// kb: knockback speed. down: knocks the target down. heavy: longer hitstop + shake.

export const HEROES = {
  nova: {
    id: 'nova',
    name: 'NOVA',
    title: 'The Spark',
    scale: 1,
    hp: 100,
    speed: { x: 112, z: 72 },
    jump: 310,
    style: { kind: 'nova', body: '#ff5fd2', dark: '#7a1e63', accent: '#ffe14f', visor: '#ffffff' },
    combo: [
      { pose: 'jab', startup: 0.05, active: 0.06, recovery: 0.12, reach: [4, 30], dmg: 6, kb: 40, step: 25 },
      { pose: 'cross', startup: 0.05, active: 0.06, recovery: 0.14, reach: [4, 32], dmg: 7, kb: 50, step: 25 },
      { pose: 'highKick', startup: 0.09, active: 0.08, recovery: 0.26, reach: [6, 38], dmg: 12, kb: 170, down: true, heavy: true, step: 40 },
    ],
    air: { pose: 'flyKick', reach: [2, 30], dmg: 10, kb: 140, down: true },
    special: {
      name: 'STAR DASH', pose: 'dash', startup: 0.06, active: 0.22, recovery: 0.2,
      reach: [-6, 26], dmg: 14, kb: 210, down: true, heavy: true, lunge: 380, cooldown: 2.5,
    },
  },
  titan: {
    id: 'titan',
    name: 'TITAN',
    title: 'The Wall',
    scale: 1.15,
    hp: 130,
    speed: { x: 82, z: 56 },
    jump: 265,
    style: { kind: 'titan', body: '#4fb8ff', dark: '#1d4f80', accent: '#ffa53f', visor: '#ffe14f' },
    combo: [
      { pose: 'heavy', startup: 0.11, active: 0.08, recovery: 0.2, reach: [4, 36], dmg: 12, kb: 80, step: 20 },
      { pose: 'hammer', startup: 0.15, active: 0.1, recovery: 0.32, reach: [4, 40], dmg: 20, kb: 210, down: true, heavy: true, step: 20 },
    ],
    air: { pose: 'elbow', reach: [-6, 26], dmg: 14, kb: 160, down: true },
    special: {
      name: 'COMET BEAM', pose: 'beam', startup: 0.18, active: 0.06, recovery: 0.35, cooldown: 3,
      projectile: { speed: 330, dmg: 18, kb: 220, down: true, heavy: true, life: 1.6, half: 10 },
    },
  },
};

// The incoming hero's tag-in strike: a short burst on both sides.
export const TAG_STRIKE = { pose: 'tagIn', startup: 0.04, active: 0.12, recovery: 0.16, reach: [-30, 30], dmg: 6, kb: 160 };

export const ENEMIES = {
  voidling: {
    id: 'voidling',
    hp: 28,
    scale: 0.9,
    speed: { x: 58, z: 40 },
    score: 100,
    style: { kind: 'voidling', body: '#7b3cff', dark: '#2a1259', accent: '#3ff0ff', visor: '#3ff0ff' },
    attack: { pose: 'swipe', windup: 0.45, startup: 0, active: 0.08, recovery: 0.45, reach: [4, 26], dmg: 7, kb: 90 },
  },
  brute: {
    id: 'brute',
    hp: 90,
    scale: 1.35,
    speed: { x: 34, z: 26 },
    score: 300,
    hurtScale: 0.5, // shrugs off light hits quicker
    style: { kind: 'brute', body: '#ff3b5c', dark: '#5c1020', accent: '#ffe14f', visor: '#ffe14f' },
    attack: { pose: 'smash', windup: 0.75, startup: 0, active: 0.1, recovery: 0.7, reach: [4, 40], dmg: 16, kb: 230, down: true, heavy: true },
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
