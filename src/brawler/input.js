// Keyboard for Borough Brawl: held keys for movement, presses for actions.
// Two bindings per action so it works on any keyboard layout habit (arrows + ZXC, or WASD + JKL).
// Run: double-tap left or right and keep holding (or hold Shift).

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

const DOUBLE_TAP = 280; // ms between taps that counts as a double-tap

const SWALLOW = new Set(['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const CONTROLS = 'button, input, select, textarea, label, a[href], summary, details';

export function createInput(target = window) {
  const held = new Set();
  const pressed = new Set();
  let lastTap = { dir: 0, time: -Infinity };
  let runDir = 0; // -1 / 1 while a double-tapped direction is held

  const any = (set, action) => BINDINGS[action].some((code) => set.has(code));
  const axis = (neg, pos) => (any(held, pos) ? 1 : 0) - (any(held, neg) ? 1 : 0);
  const dirOf = (code) => (BINDINGS.left.includes(code) ? -1 : BINDINGS.right.includes(code) ? 1 : 0);

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (SWALLOW.has(e.code)) e.preventDefault();
    held.add(e.code);
    if (e.repeat) return;
    pressed.add(e.code);
    const dir = dirOf(e.code);
    if (dir) {
      const now = performance.now();
      runDir = lastTap.dir === dir && now - lastTap.time < DOUBLE_TAP ? dir : 0;
      lastTap = { dir, time: now };
    }
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
    /** Controls for one game step, in the shape game.update() expects. */
    controls() {
      const x = axis('left', 'right');
      return {
        x,
        z: axis('up', 'down'),
        run: x !== 0 && (x === runDir || any(held, 'run')),
        attack: any(pressed, 'attack'),
        jump: any(pressed, 'jump'),
        special: any(pressed, 'special'),
        tag: any(pressed, 'tag'),
      };
    },
    pressed: (action) => any(pressed, action),
    /** Drop this step's presses so they can't fire twice. */
    flush() { pressed.clear(); },
    clear() {
      held.clear();
      pressed.clear();
      runDir = 0;
    },
  };
}
