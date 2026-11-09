// Stage layouts. A stage is a strip of floor with wave zones.
// Walking past a zone's `trigger` locks the camera at `camX` and spawns its waves one after
// another. Each wave is a list of [enemy type, side it enters from].

export const STAGES = [
  {
    name: 'STAGE 1 — DOWNTOWN',
    length: 1500,
    zones: [
      {
        trigger: 0, camX: 0,
        waves: [
          [['punk', 'right'], ['punk', 'right'], ['punk', 'left']],
        ],
      },
      {
        trigger: 640, camX: 460,
        waves: [
          [['punk', 'right'], ['punk', 'right'], ['punk', 'left'], ['punk', 'left']],
          [['bruiser', 'right'], ['punk', 'left'], ['punk', 'right']],
        ],
      },
      {
        trigger: 1150, camX: 1020,
        waves: [
          [['bruiser', 'right'], ['punk', 'left'], ['punk', 'right']],
          [['bruiser', 'left'], ['bruiser', 'right'], ['punk', 'right'], ['punk', 'left']],
        ],
      },
    ],
  },
];
