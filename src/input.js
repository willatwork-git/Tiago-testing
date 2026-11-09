import { DIRS } from './maze.js';

const DIR_KEYS = {
  ArrowUp: DIRS.up, KeyW: DIRS.up,
  ArrowDown: DIRS.down, KeyS: DIRS.down,
  ArrowLeft: DIRS.left, KeyA: DIRS.left,
  ArrowRight: DIRS.right, KeyD: DIRS.right,
};

const SWALLOW = new Set(['Space', 'Enter']); // stop the page scrolling

export function createInput(target = window) {
  let dir = null;
  const pressed = new Set();

  target.addEventListener('keydown', (e) => {
    if (DIR_KEYS[e.code]) {
      dir = DIR_KEYS[e.code];
      e.preventDefault();
    }
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
