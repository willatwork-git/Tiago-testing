// Every tunable number lives here, so playtesting means editing one file.
// Speeds are in tiles per second; times are in seconds.

export const CONFIG = {
  lives: 3,
  readyTime: 0.8, // minimum pause before a life starts; then it waits for a direction key
  deathTime: 1.6,
  clearTime: 2,

  playerSpeed: (level) => 7.5 + Math.min(level - 1, 6) * 0.2,
  glitchSpeed: (level) => 6.6 + Math.min(level - 1, 8) * 0.3,
  frightMult: 0.55, // Glitch speed while frightened
  tunnelMult: 0.55, // Glitch speed in the side tunnel
  leavingMult: 0.6, // Glitch speed while leaving the house
  eyesSpeed: 14, // eaten Glitch heading home

  frightTime: (level) => Math.max(1.5, 6 - (level - 1) * 0.6),
  frightWarn: 0.25, // frightened Glitches flash for this last fraction of Overcharge

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
  popupTime: 0.9, // score pop-ups float this long

  score: { pellet: 10, power: 50, glitch: 200 },

  // Dash: a short burst of speed. Pure speed, no invulnerability; it still turns
  // at junctions, stops at walls and eats pellets on the way.
  dash: { mult: 2.2, time: 0.25, cooldown: 4 },
};

// Difficulty modifiers, applied on top of the level curve above.
export const DIFFICULTY = {
  normal: {
    label: 'Normal',
    hint: 'Steady pace. You have room to breathe.',
    lives: 3,
    glitchSpeedBonus: 0, // tiles/sec added to Glitch speed
    frightScale: 1, // × Overcharge length
    releaseScale: 1, // × time before Glitches leave the house
    scatterScale: 1, // × length of scatter (breather) phases
  },
  hard: {
    label: 'Hard',
    hint: 'Glitches nearly match your speed, leave the house sooner, rest less. Shorter Overcharge.',
    lives: 3,
    glitchSpeedBonus: 0.8,
    frightScale: 0.6,
    releaseScale: 0.4,
    scatterScale: 0.5,
  },
};
