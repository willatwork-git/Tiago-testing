# Activity log

Newest at the top.

## 2026-11-09 — M1–M4: playable core

- Built the skeleton: canvas sized for high-DPI screens, a fixed 60 Hz update loop, and the
  state machine (title, ready, playing, paused, dying, level clear, game over).
- Built our own 21×21 maze: a central house with a gate, a wrap-around tunnel, and no dead ends.
  Walls are pre-drawn once to an offscreen canvas as glowing tubes.
- Player: grid movement, buffered turns, instant reversal mid-tile, eating, scoring, level clear.
- Glitches: Hunter, Sneak, Drift and Skittish targeting; scatter/chase timer; Overcharge
  (frightened, flashing near the end, chain scoring 200→1600). Eaten Glitches return home along
  a shortest path to the house.
- Lives, level speed-up, high score in `localStorage`, pause (also on losing window focus).
- Added `src/config.js` (all tunables) and `src/entity.js` (shared movement).
- **Verified:** a headless simulation (20 runs × 90 s, random player) confirmed:
  - every pellet is reachable
  - no dead ends
  - all four Glitches leave the house
  - eaten Glitches get home
  - nothing ever ends up inside a wall

  Headless Chrome screenshots of the title and gameplay screens look right.
- **Not yet verified by hand:** how it feels to play with a keyboard.
- **Next:** playtest and tune `config.js`, then M5 (colour picker).

## 2026-11-09 — Kickoff

- Set up the project folder: `README.md`, `CLAUDE.md`, `DESIGN.md`, `TODO.md`, `MEMORY.md`,
  `ACTIVITY.md`.
- Wrote design v0.1: neon maze-chase, four Glitch enemies, dash, combo, colour picker.
- Laid out v1 as milestones M1–M7, plus a "Later" list.
- **Next:** M1 skeleton (canvas, loop, state machine), then M2 maze.
