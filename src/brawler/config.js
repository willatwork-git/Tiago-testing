// Every tunable number for Borough Brawl. Units: pixels in the 480 × 270 world,
// seconds, pixels per second.

export const W = 480;
export const H = 270;

// The walkable road, as depth (z) values. Screen y = z − h. The sidewalk sits just above it.
export const FLOOR = { top: 176, bottom: 264 };

export const CONFIG = {
  gravity: 900,
  hitstop: 0.05, // freeze on a normal hit
  hitstopHeavy: 0.11, // freeze on a finisher
  depthReach: 16, // attacks connect within this depth distance
  jumpDodge: 30, // a hero this high off the floor is above ground attacks
  bodyHalf: 9, // half-width of a body at scale 1, for hit tests

  hurtTime: 0.28,
  lieTime: 0.7, // knocked down: time on the floor
  getupTime: 0.35,
  getupInvuln: 0.6,

  tagCooldown: 1.5,
  tagInvuln: 0.7,
  benchRegen: 6, // hp per second for the benched hero

  attackTokens: 2, // max enemies attacking at once
  enemyAttackCooldown: [0.7, 1.4], // random range, after each enemy attack
  waveDelay: 0.8, // pause before the next wave in a zone spawns

  score: { hit: 10, stageClear: 1000 },
};
