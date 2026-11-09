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

// Controller buttons (PS5 or Xbox, by position; see src/shared/gamepad.js) standing in for keys.
const PAD = {
  Enter: ['south', 'start'], // ✕ / A or Options / Menu: play, retry
  Space: ['south', 'west'], // ✕ / A or □ / X: dash
  KeyP: ['start'], // Options / Menu: pause
  Escape: [],
  KeyQ: ['select'], // Create / View: quit to menu
  KeyM: [],
};

export function createInput(target = window, pad = null) {
  let dir = null;
  const pressed = new Set();

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.closest(CONTROLS)) return;
    if (DIR_KEYS[e.code]) dir = DIR_KEYS[e.code];
    if (SWALLOW.has(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code === 'NumpadEnter' ? 'Enter' : e.code);
  });

  return {
    /** Read the controller. Call once at the start of each game step. */
    poll() {
      if (!pad) return;
      pad.poll();
      // Holding the stick or d-pad keeps steering, like a held key.
      const { x, y } = pad.stick();
      if (Math.max(Math.abs(x), Math.abs(y)) > 0.5) {
        if (Math.abs(x) >= Math.abs(y)) dir = x < 0 ? DIRS.left : DIRS.right;
        else dir = y < 0 ? DIRS.up : DIRS.down;
      }
    },
    /** Last direction pressed, or null. */
    get dir() { return dir; },
    clearDir() { dir = null; },
    /** A fresh d-pad / stick push this step (for menus), or null. */
    padDir: () => pad?.dirPressed() ?? null,
    /** True once per key (or matching controller button) press. */
    take(code) {
      const had = pressed.has(code) || (!!pad && pad.anyPressed(PAD[code] ?? []));
      pressed.delete(code);
      return had;
    },
    /** Drop presses nobody consumed this step, so they can't fire later. */
    flush() { pressed.clear(); },
  };
}
