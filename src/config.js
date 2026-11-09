// Every tunable number lives here, so playtesting means editing one file.
// Speeds are in tiles per second; times are in seconds.

export const CONFIG = {
  lives: 3,
  readyTime: 2,
  deathTime: 1.6,
  clearTime: 2,

  playerSpeed: (level) => 7.5 + Math.min(level - 1, 6) * 0.2,
  glitchSpeed: (level) => 6.6 + Math.min(level - 1, 8) * 0.3,
  frightMult: 0.55, // Glitch speed while frightened
  tunnelMult: 0.55, // Glitch speed in the side tunnel
  leavingMult: 0.6, // Glitch speed while leaving the house
  eyesSpeed: 14, // eaten Glitch heading home

  frightTime: (level) => Math.max(1.5, 6 - (level - 1) * 0.6),
  frightWarn: 2, // frightened Glitches flash for the last N seconds

  // Glitches alternate between heading for their corner and hunting.
  modes: [
    ['scatter', 7], ['chase', 20],
    ['scatter', 7], ['chase', 20],
    ['scatter', 5], ['chase', Infinity],
  ],

  // Seconds after a life starts before each Glitch leaves the house.
  release: [0, 1, 4, 8],
  releaseShrink: 1, // each level releases them this much sooner

  collideDist: 0.55, // in tiles

  score: { pellet: 10, power: 50, glitch: 200 },
};
