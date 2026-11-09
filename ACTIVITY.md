# Activity log

Newest at the top.

## 2026-11-09 — Razorfin character-art pass

- **Own renderer:** new `src/brawler/razorfin.js`, with the shared cel-shading helpers moved to
  `src/brawler/paint.js`. `rig.js` hands the shark off to it, and `getPose()` prefers his own
  poses.
- **Three-quarter view:** the first attempt in profile still read as a blob, and the near shoulder
  plate hid his face. Fixed by giving him the chest-to-camera three-quarter view of brawler
  sprites, and drawing his head last.
- **Silhouette:**
  - barrel chest and sharp waist
  - head-sized bare upper arms, heavy forearms and clawed hands
  - short legs on pointed gold boots, feet solved onto the road
  - the free arm hanging clear of the body
  - heavy brow, broad white jaw, four triangular teeth
- **Armour:** overlapping silver leaf plates with seams and gold edges, near and far pauldrons, a
  pointed bracer, a deep-green panel, belt and buckle. Engraving and chainmail appear on the
  title only.
- **Poses:**
  - title: focal, three-quarter, hand on the planted sword
  - laid-back idle with the sword low
  - heavy walk with a footfall dip
  - three-beat cleave: raise, swing, follow-through (new `followPose`)
  - shoulder-first Shark Rush
  - the cleave and slash smears follow the real blade; no slash arc on lunges
- **Checked:**
  - before and after shots of the title, idle beside a punk, the three cleave beats and the rush,
    in both facings, plus two walk frames
  - the brawler sim, brawler e2e (clean profile, twice), gamepad e2e, and Chomp e2e and sim all pass
  - one run reported `TAU is not defined`: a cached browser profile from before the paint.js
    fix; fresh profiles pass
- **Not changed:** `def.scale`, reach, collision, timings.
- **Open:**
  - at gameplay size the pauldrons cover most of the bare upper arm
  - the title's planted sword is shorter than in the concept, because his long arms rest low

## 2026-11-09 — Controllers: PS5 on Mac, Xbox on PC

- **New `src/shared/gamepad.js`:** reads the Gamepad API and maps buttons by position (Chrome uses
  the same standard layout for DualSense and Xbox). It detects PlayStation vs Xbox from the
  controller id for the labels, gives edge-detected presses and stick/d-pad direction, and
  rumbles where the controller supports it.
- **Borough Brawl:**
  - □ attack, ✕ jump, △ special, R1/○ tag, hold R2 (or double-tap) to run
  - Options pauses; Create goes back to the arcade
  - analogue walking
  - every prompt (title, HUD tag, pause, end screens) shows the right buttons
  - rumble on hits taken, finishers, the shockwave and a KO
- **Neon Chomp:** stick/d-pad steer, ✕/□ dash, Options pause, Create quit; on the menu, d-pad
  switches difficulty and ✕ plays; prompts and the menu hint follow the controller.
- **Home:** d-pad or stick to choose, ✕/A to play.
- **Tests:** new `tests/gamepad-e2e.mjs` (28 checks) injects a virtual DualSense and a virtual
  Xbox controller. All five suites pass. `cdp.mjs` no longer clears an earlier failure when a
  second browser finishes.
- **Not verified:** a physical controller. Needs a real try with the PS5 on the MacBook.

## 2026-11-09 — Public repo docs

- **README:** rewrote the setup section as "Getting started":
  - get the code (git clone or ZIP)
  - a local server on macOS/Linux (`python3`), Windows (`py`), Node (`npx serve`) or the VS Code
    Live Server extension
  - open http://localhost:8000; stop with Ctrl + C
  - a troubleshooting table: blank page, port in use, no sound, keys not working
  - optional GitHub Pages steps
  - the e2e tests' `CHROME` setting
- **Intro:** no longer says "neon games", since the two games have different looks now.
- **CLAUDE.md:** Windows server command, the public repo URL, and a note to keep the README in
  step with it.
- **TODO:** the "turn on GitHub Pages" item points to the README steps.

## 2026-11-09 — Borough Brawl art pass: towards the reference look

- **Characters rebuilt:**
  - solid tapered body parts with three-tone cel shading (one light, upper left, lavender
    shadows) and outlines
  - about a third of the screen tall
  - outfit detail per character, and gang colour variants
  - the shark gets a counter-shaded head with gills, a bigger pauldron, a detailed sword and a
    tabard over chainmail
- **Scenery** (new `scenery.js`):
  - late-afternoon sky and clouds, a hazy skyline
  - stone, brick and brownstone fronts with brick-level detail, recessed windows with
    reflections and AC units, fire escapes, water towers
  - shopfronts, shutters, posters
  - trees, planters, benches, news boxes, hydrants, lamps
  - a cracked sidewalk, and a textured road with patches, potholes and steam
- **Feedback:** comic impact bursts, floating damage numbers, a ×N HITS combo counter, speed
  lines on lunges and dives.
- **Gameplay numbers** rescaled to the bigger bodies: speeds, jumps, depth reach, jump dodge,
  enemy spacing.
- **Tests:** sim and e2e pass (the Comet Dive check now also accepts its landing; it's faster
  now).

## 2026-11-09 — Borough Brawl: specials, New York streets, Razorfin

- **Special moves:**
  - running attack: double-tap →→ or Shift, then attack. Shark Rush / Star Dash
  - ground special = a throw: Fin Blade, which cuts through a line / Star Throw
  - air special = a dive: Depth Charge, with a shockwave on landing / Comet Dive
- **New York:** the brawler's look moved from neon space to pixel-art Manhattan at dusk:
  - a skyline, then brick and brownstone fronts with fire escapes, water towers, shop signs,
    awnings and graffiti
  - a sidewalk with lamps, hydrants and trash cans
  - the road as the walk plane: lane lines, crosswalks, manhole steam
  - enemies are a street gang (Punks, Bruisers)
  - fighters sit on a hardened pixel layer; the HUD is arcade style
  - renamed **Borough Brawl**
- **Razorfin:** the kids' shark-warrior concept is the lead hero, translated into the rig:
  - shark head with teeth and fin, the biggest build, short legs
  - silver armour with gold trim, a pauldron, the green tabard, gold boots, a sword
  Nova is his partner; Titan is retired until hero select.
- **Tests:** the bot now uses every move type. The e2e covers run, throw, dive and shockwave,
  Nova's star and dive. Sim and e2e both pass (twice).
- **Test lessons:** one buffered press per swing means mashing has to follow the sword's slower
  tempo. A dive from jump height is over in about 0.08 s.
- **Not verified by hand:** feel, and whether the kids think Razorfin looks right.

## 2026-11-09 — Neon Arcade: home screen + Nebula Knockout prototype

- **Docs first:**
  - the project is now the **Neon Arcade**; `DESIGN.md` covers the arcade
  - Neon Chomp's design moved to `DESIGN-CHOMP.md`
  - new `DESIGN-BRAWLER.md`, with what we take from Marvel Cosmic Invasion, Shredder's Revenge,
    Streets of Rage 4 and Final Fight (mechanics only)
  - TODO restructured per game; Windows app paused under Later
  - CLAUDE.md rewritten for two games
- **Restructure:** Neon Chomp moved to `chomp/` + `src/chomp/` (git history kept). The sound synth
  and the saved-settings wrapper moved to `src/shared/`. Chomp's menu has a "← Arcade" link.
- **Home screen** (`index.html`, `src/home.js`): two cards with animated previews and best scores;
  arrow keys move between them.
- **Nebula Knockout B1** (`brawler/`, `src/brawler/`):
  - heroes Nova and Titan, with tag swaps
  - combos, jump attacks, Star Dash and Comet Beam
  - Voidlings and Brutes, with visible wind-ups and at most 2 attacking at once
  - three wave zones with camera locks and GO →
  - hitstop, sparks and shake; the HUD, title, pause, game over, stage clear and sound
  - drawn at 480 × 270 and scaled up as crisp pixels
- **Tests:**
  - `tests/brawler-sim.mjs`: a bot plays stage 1. God mode must clear it; honest runs report a
    clear rate (8/8, so it's gentle).
  - `tests/brawler-e2e.mjs`: 33 checks across the home screen, controls, tag, beam, pause,
    mute, game over, retry, stage clear and back to the arcade.
  - The Chrome driver was extracted to `tests/cdp.mjs`, and `e2e.mjs` now uses it.
  - All four suites pass.
- **Bug found by the bot test and fixed:** waiting enemies hovered off-screen at the stage's left
  edge, so they could never be reached and the stage never ended.
- **Not verified by hand:** how the fighting *feels*. That's the kids' playtest (B2).

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
