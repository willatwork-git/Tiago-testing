# Activity log

Newest at the top.

## 2026-11-09 — M6: dash, sound, effects

- Committed M5/M5b as `3fd49fe`.
- **Dash** (Space): ×2.2 speed for 0.25 s, 4 s cooldown ring, afterimage trail, a blip when
  ready. Only fires while moving; no invulnerability.
- **Sound** (`src/audio.js`): synthesised Web Audio for pellet, power cell, Overcharge ending,
  Glitch caught, death, level clear, dash and dash ready. **Mute** with M or the menu toggle;
  saved. A "SOUND ON/OFF" notice shows in game; the pause screen shows the M key.
- **Effects** (`src/fx.js`): particle bursts and screen shake on power, catch and death.
  "Reduce motion" is respected. Effects and pop-ups freeze while paused.
- **Wiring:** game logic `emit()`s events; audio and fx react.
- **Combo:** parked until dash is playtested.
- **Tests:** e2e now covers dash distance, cooldown, particles, mute and saving, and fails on
  any uncaught page error. A seam check was flaky (a fixed 50 ms sleep vs. headless frame
  timing); it now polls. 34 checks pass, three runs in a row; the simulation passes.
- **Not verified:** what the sounds actually sound like (the tests can't hear), and how dash feels.

## 2026-11-09 — M5b review fixes

- **Menu keyboard:** game input now ignores keys aimed at focused form controls. Difficulty and
  swatches are native radios, so arrows, Space and Tab work. Glow controls are truly `disabled`
  when matched. Play has focus on entry and on return to the menu.
- **Menu layout:** Play and the controls hint come first, then difficulty. Colours sit under a
  collapsible "Customise colours" with a fixed 72 px preview. Short screens get a compact
  layout; at 844 × 390 everything fits.
- **Start on first input:** a 0.8 s READY, then a prompt under the player. The life starts on the
  first direction you can actually move in.
- **Pause:** works from READY as well as play, and resumes to whichever was paused. Blur and
  hiding the tab both pause.
- **Tunnel seam:** collision measures the wrapped distance; actors crossing the edge are drawn
  on both sides.
- **Overcharge:** a HUD bar plus a white outline on the player. The warning flash is the last
  25% of the time, on both the bar and the Glitches.
- **Score pop-ups** when you eat a Glitch. **Retry** on game over (Enter); Q goes to the menu.
  "LEVEL n CLEARED" during the clear flash. The player is hidden on the game-over screen.
- **Best score** is saved on `pagehide` and when the tab is hidden.
- **Bug found by the new e2e test and fixed:** changing difficulty called `menu.show()`, which
  pulled focus back to Play, so a second arrow key did nothing.
- **Added `tests/`:** `sim.mjs` (logic) and `e2e.mjs` (26 browser checks covering every review
  item). Both pass.
- **Not yet verified by hand:** how it feels to play.

## 2026-11-09 — Triage of ChatGPT review

- Checked each claim in `feedback/README.md` against the code. Confirmed four bugs:
  - the menu keyboard is swallowed by game input
  - the tunnel seam misses collisions
  - window blur during READY doesn't pause
  - the best score isn't saved if you refresh mid-run
- Kept six design changes, as milestone M5b in `TODO.md`. Declined four (reasons in `MEMORY.md`).
  Moved the review's playtest questions under M7.
- Reordered M6: dash, sound (with mute), particles, combo last.

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
