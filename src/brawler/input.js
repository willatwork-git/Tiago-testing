// Keyboard for Nebula Knockout: held keys for movement, presses for actions.
// Two bindings per action so it works on any keyboard layout habit (arrows + ZXC, or WASD + JKL).

export const BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  attack: ['KeyJ', 'KeyZ'],
  jump: ['KeyK', 'KeyX'],
  special: ['KeyL', 'KeyC'],
  tag: ['Space', 'KeyI'],
  pause: ['KeyP', 'Escape'],
  quit: ['KeyQ'],
  start: ['Enter', 'NumpadEnter'],
  mute: ['KeyM'],
};

const SWALLOW = new Set(['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const CONTROLS = 'button, input, select, textarea, label, a[href], summary, details';

export function createInput(target = window) {
  const held = new Set();
  const pressed = new Set();

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (SWALLOW.has(e.code)) e.preventDefault();
    held.add(e.code);
    if (!e.repeat) pressed.add(e.code);
  });
  target.addEventListener('keyup', (e) => held.delete(e.code));
  target.addEventListener('blur', () => held.clear());

  const any = (set, action) => BINDINGS[action].some((code) => set.has(code));
  const axis = (neg, pos) => (any(held, pos) ? 1 : 0) - (any(held, neg) ? 1 : 0);

  return {
    /** Controls for one game step, in the shape game.update() expects. */
    controls() {
      return {
        x: axis('left', 'right'),
        z: axis('up', 'down'),
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
    },
  };
}
