// Game controllers via the browser Gamepad API.
//
// Chrome reports both a PS5 DualSense (Mac, Bluetooth or USB) and an Xbox controller (PC) in the
// W3C "standard" layout, so one mapping by *position* works for both:
//
//   south  ✕ / A      east  ○ / B      west  □ / X      north  △ / Y
//   l1 r1  L1/R1 · LB/RB    l2 r2  L2/R2 · LT/RT    select  Create / View    start  Options / Menu
//   up down left right: the d-pad.  Left stick: axes 0 and 1.
//
// Only the labels differ, so prompts can show the right symbols for the controller in hand.
// Call poll() once per game step; pressed() is true for one poll after a button goes down.
// Note: browsers only expose controllers on secure pages (https or localhost), and only after
// the first button press.

export const BUTTONS = {
  south: 0, east: 1, west: 2, north: 3, l1: 4, r1: 5, l2: 6, r2: 7,
  select: 8, start: 9, l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15, home: 16,
};

const LABELS = {
  playstation: { south: '✕', east: '○', west: '□', north: '△', l1: 'L1', r1: 'R1', l2: 'L2', r2: 'R2', select: 'CREATE', start: 'OPTIONS' },
  xbox: { south: 'A', east: 'B', west: 'X', north: 'Y', l1: 'LB', r1: 'RB', l2: 'LT', r2: 'RT', select: 'VIEW', start: 'MENU' },
};

export function padKind(id = '') {
  const s = id.toLowerCase();
  if (s.includes('dualsense') || s.includes('dualshock') || s.includes('054c') || s.includes('playstation') || s.includes('wireless controller')) return 'playstation';
  return 'xbox'; // Xbox, and the layout most other controllers copy
}

const STICK = 0.6; // how far the stick must go to count as a d-pad press (menus, Chomp)

export function createGamepad({ deadzone = 0.3 } = {}) {
  let pad = null;
  let kind = null;
  let held = new Set();
  let prev = new Set();
  let pressed = new Set();
  let stick = { x: 0, y: 0 };

  function poll() {
    let pads = [];
    try {
      pads = navigator.getGamepads ? [...navigator.getGamepads()].filter((p) => p && p.connected) : [];
    } catch {
      pads = []; // not allowed here (insecure page): play on with the keyboard
    }
    pad = pads[0] ?? null; // player one
    const now = new Set();
    stick = { x: 0, y: 0 };
    if (pad) {
      kind = padKind(pad.id);
      for (const [name, i] of Object.entries(BUTTONS)) {
        const b = pad.buttons[i];
        if (b && (b.pressed || b.value > 0.5)) now.add(name);
      }
      let x = pad.axes[0] ?? 0;
      let y = pad.axes[1] ?? 0;
      if (Math.hypot(x, y) < deadzone) x = y = 0;
      // The d-pad wins over the stick.
      if (now.has('left')) x = -1;
      if (now.has('right')) x = 1;
      if (now.has('up')) y = -1;
      if (now.has('down')) y = 1;
      stick = { x, y };
      // A firm push on the stick also counts as a d-pad direction (for menus and maze turns).
      if (x < -STICK) now.add('stickLeft');
      if (x > STICK) now.add('stickRight');
      if (y < -STICK) now.add('stickUp');
      if (y > STICK) now.add('stickDown');
    } else {
      kind = null;
    }
    pressed = new Set([...now].filter((n) => !prev.has(n)));
    prev = now;
    held = now;
  }

  return {
    poll,
    get connected() { return !!pad; },
    get kind() { return kind; },
    get id() { return pad?.id ?? ''; },
    /** Left stick (or d-pad) as -1..1 on each axis, deadzone applied. */
    stick: () => stick,
    held: (name) => held.has(name),
    pressed: (name) => pressed.has(name),
    /** Any of these buttons pressed this poll. */
    anyPressed: (names) => names.some((n) => pressed.has(n)),
    anyHeld: (names) => names.some((n) => held.has(n)),
    /** A d-pad or firm stick direction pressed this poll, as { x, y } with one of them ±1, or null. */
    dirPressed() {
      if (pressed.has('left') || pressed.has('stickLeft')) return { x: -1, y: 0 };
      if (pressed.has('right') || pressed.has('stickRight')) return { x: 1, y: 0 };
      if (pressed.has('up') || pressed.has('stickUp')) return { x: 0, y: -1 };
      if (pressed.has('down') || pressed.has('stickDown')) return { x: 0, y: 1 };
      return null;
    },
    /** The on-screen name of a button for the controller in hand: ✕ on PlayStation, A on Xbox. */
    label: (name) => (LABELS[kind] ?? LABELS.xbox)[name] ?? name.toUpperCase(),
    /** Rumble, where the browser and controller support it. Silently does nothing otherwise. */
    rumble(strong = 0.5, weak = 0.5, ms = 120) {
      const act = pad?.vibrationActuator;
      if (!act?.playEffect) return;
      act.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {});
    },
  };
}
