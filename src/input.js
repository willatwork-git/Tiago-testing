import { DIRS } from './maze.js';

const DIR_KEYS = {
  ArrowUp: DIRS.up, KeyW: DIRS.up,
  ArrowDown: DIRS.down, KeyS: DIRS.down,
  ArrowLeft: DIRS.left, KeyA: DIRS.left,
  ArrowRight: DIRS.right, KeyD: DIRS.right,
};

// Keys the game would otherwise lose to page scrolling.
const SWALLOW = new Set(['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

// Focused form controls keep their own keyboard behaviour (Space toggles,
// arrows move between radios, Enter clicks). The game ignores those keys.
const CONTROLS = 'button, input, select, textarea, label, a[href], summary, details';

export function createInput(target = window) {
  let dir = null;
  const pressed = new Set();

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (DIR_KEYS[e.code]) dir = DIR_KEYS[e.code];
    if (SWALLOW.has(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code === 'NumpadEnter' ? 'Enter' : e.code);
  });

  return {
    /** Last direction pressed, or null. */
    get dir() { return dir; },
    clearDir() { dir = null; },
    /** True once per key press. */
    take(code) {
      const had = pressed.has(code);
      pressed.delete(code);
      return had;
    },
    /** Drop presses nobody consumed this step, so they can't fire later. */
    flush() { pressed.clear(); },
  };
}
