# Activity log

Newest at the top.

## 2026-11-09 — Ready for a public repo

- Added `.gitignore`: macOS files, iCloud conflict copies (`* 2.*`), editor folders, local Claude
  settings, and future tooling.
- Rewrote `README.md` for someone seeing the project for the first time: how to run it, how to
  play, the Glitches, status, how to tweak it, and the code layout.
- Checked the files for personal info (paths, emails, keys): none found.

## 2026-11-09 — M5 colour picker, difficulty, quit to menu

- Title screen is now a menu (HTML panel over the canvas): difficulty, body colour, glow colour
  (with "match body"), and a Play button. The title parade uses your colours, so it's the live
  preview. Choices are saved.
- 8 preset colours, checked against every enemy colour, plus a custom colour picker. A soft
  warning appears for colours that are too dark or too close to an enemy.
- Difficulty Normal / Hard, with a separate high score for each. Hard is shown in the HUD.
- Q quits to the menu from the pause screen or the game-over screen.
- **Verified:** the simulation passes on both difficulties; a headless screenshot of the menu
  looks right.
- **Not yet verified by hand:** the menu's clicks and keyboard use, and the in-game feel of Hard.
- **Next:** M6 (dash, combo, particles, sound).

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
