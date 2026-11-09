// Stage layouts. A stage is a strip of floor with wave zones.
// Walking past a zone's `trigger` locks the camera at `camX` and spawns its waves one after
// another. Each wave is a list of [enemy type, side it enters from].

export const STAGES = [
  {
    name: 'STAGE 1 — NEON BOULEVARD',
    length: 1500,
    zones: [
      {
        trigger: 0, camX: 0,
        waves: [
          [['voidling', 'right'], ['voidling', 'right'], ['voidling', 'left']],
        ],
      },
      {
        trigger: 640, camX: 460,
        waves: [
          [['voidling', 'right'], ['voidling', 'right'], ['voidling', 'left'], ['voidling', 'left']],
          [['brute', 'right'], ['voidling', 'left'], ['voidling', 'right']],
        ],
      },
      {
        trigger: 1150, camX: 1020,
        waves: [
          [['brute', 'right'], ['voidling', 'left'], ['voidling', 'right']],
          [['brute', 'left'], ['brute', 'right'], ['voidling', 'right'], ['voidling', 'left']],
        ],
      },
    ],
  },
];
