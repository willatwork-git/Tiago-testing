// Input for Borough Brawl: keyboard and a game controller, used side by side.
// Keyboard: two bindings per action (arrows + ZXC, or WASD + JKL).
// Controller (PS5 or Xbox, same positions): see PAD below.
// Run: double-tap left or right and keep holding (or hold Shift / R2 / RT).

export const BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  run: ['ShiftLeft', 'ShiftRight'],
  attack: ['KeyJ', 'KeyZ'],
  jump: ['KeyK', 'KeyX'],
  special: ['KeyL', 'KeyC'],
  tag: ['Space', 'KeyI'],
  pause: ['KeyP', 'Escape'],
  quit: ['KeyQ'],
  start: ['Enter', 'NumpadEnter'],
  mute: ['KeyM'],
};

// Controller buttons by position (see src/shared/gamepad.js): south = ✕/A, west = □/X, etc.
export const PAD = {
  attack: ['west'], // □ / X
  jump: ['south'], // ✕ / A
  special: ['north'], // △ / Y
  tag: ['r1', 'east'], // R1 / RB, or ○ / B
  run: ['r2', 'l2'], // hold R2 / RT (or L2 / LT)
  pause: ['start'], // Options / Menu
  quit: ['select'], // Create / View
  start: ['south', 'start'],
  mute: [],
};

const DOUBLE_TAP = 280; // ms between taps that counts as a double-tap

const SWALLOW = new Set(['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const CONTROLS = 'button, input, select, textarea, label, a[href], summary, details';

export function createInput(target = window, pad = null) {
  const held = new Set();
  const pressed = new Set();
  let lastTap = { dir: 0, time: -Infinity };
  let runDir = 0; // -1 / 1 while a double-tapped direction is held

  const any = (set, action) => BINDINGS[action].some((code) => set.has(code));
  const axis = (neg, pos) => (any(held, pos) ? 1 : 0) - (any(held, neg) ? 1 : 0);
  const dirOf = (code) => (BINDINGS.left.includes(code) ? -1 : BINDINGS.right.includes(code) ? 1 : 0);

  const tap = (dir) => {
    const now = performance.now();
    runDir = lastTap.dir === dir && now - lastTap.time < DOUBLE_TAP ? dir : 0;
    lastTap = { dir, time: now };
  };
  const padPressed = (action) => !!pad && pad.anyPressed(PAD[action]);

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (SWALLOW.has(e.code)) e.preventDefault();
    held.add(e.code);
    if (e.repeat) return;
    pressed.add(e.code);
    const dir = dirOf(e.code);
    if (dir) tap(dir);
  });
  target.addEventListener('keyup', (e) => {
    held.delete(e.code);
    if (runDir && axis('left', 'right') !== runDir) runDir = 0;
  });
  target.addEventListener('blur', () => {
    held.clear();
    runDir = 0;
  });

  return {
    /** Read the controller. Call once at the start of each game step. */
    poll() {
      if (!pad) return;
      pad.poll();
      if (pad.pressed('left') || pad.pressed('stickLeft')) tap(-1);
      if (pad.pressed('right') || pad.pressed('stickRight')) tap(1);
    },
    /** Controls for one game step, in the shape game.update() expects. */
    controls() {
      const stick = pad?.stick() ?? { x: 0, y: 0 };
      const x = axis('left', 'right') || stick.x; // analogue stick walks slower when pushed gently
      const z = axis('up', 'down') || stick.y;
      if (runDir && Math.sign(x) !== runDir) runDir = 0;
      return {
        x,
        z,
        run: x !== 0 && (Math.sign(x) === runDir || any(held, 'run') || (!!pad && pad.anyHeld(PAD.run))),
        attack: any(pressed, 'attack') || padPressed('attack'),
        jump: any(pressed, 'jump') || padPressed('jump'),
        special: any(pressed, 'special') || padPressed('special'),
        tag: any(pressed, 'tag') || padPressed('tag'),
      };
    },
    pressed: (action) => any(pressed, action) || padPressed(action),
    /** Drop this step's presses so they can't fire twice. */
    flush() { pressed.clear(); },
    clear() {
      held.clear();
      pressed.clear();
      runDir = 0;
    },
  };
}
