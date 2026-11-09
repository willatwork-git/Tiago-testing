# TODO

## Arcade

### A1 Home screen + restructure
- [x] Move Neon Chomp into `chomp/` + `src/chomp/`; arcade home at `index.html`
- [x] Shared sound synth in `src/shared/audio.js`; each game keeps its own sound list
- [x] "← Arcade" link in each game's menu; Q from pause/game over goes back
- [x] Home shows each game's best score
- [x] Tests follow the move; add home + brawler tests

## Neon Chomp — v1 (playable, polished, one maze)

### M1 Skeleton
- [x] `index.html`, `style.css`, canvas scaled to window (crisp at any DPI)
- [x] Fixed-timestep game loop + render pass
- [x] State machine: title / playing / paused / levelClear / dying / gameOver

### M2 Maze
- [x] Design our own maze as an ASCII layout
- [x] Parser → tile grid; wall/pellet/power-cell queries
- [x] Neon wall rendering (glowing outlines), pellets, pulsing power cells

### M3 Player
- [x] Tile movement with smooth interpolation
- [x] Input buffering
- [ ] Forgiving corners (pre-turn when a turn is pressed just after a junction) — decide after playtest
- [x] Wrap-around tunnels
- [x] Eat pellets, score, level clear when the maze is empty

### M4 Glitches
- [x] Shared movement (choose direction at junctions, no reversing)
- [x] Hunter / Sneak / Drift / Skittish targeting
- [x] Chase ↔ scatter timer
- [x] Overcharge: frightened mode, eat for points (200/400/800/1600), eyes return home
- [x] Collision → lose a life → reset positions

### M5 Colour picker
- [x] Title screen with animated player preview
- [x] 8 presets + custom colour input, body + glow slots, "match body" toggle
- [x] Persist to `localStorage`
- [x] Soft warning when a colour clashes with a Glitch or frightened blue

### M5b Review fixes *(from `feedback/README.md`, 2026-11-09 — do before M6)*
Bugs (all confirmed by reading the code):
- [x] **Menu keyboard is broken.** `input.js` calls `preventDefault` on Space, Enter and arrows
  everywhere, so focused menu controls can't be used. Enter on a swatch starts the game with the
  *old* colour. Fix: ignore keys whose target is inside the menu; use native radios for
  difficulty and swatches; make glow controls `disabled` (not just greyed) when they match body
- [x] **Tunnel-seam collision misses.** It compares raw x, so actors either side of the wrap
  don't touch. Fix: shortest wrapped distance; draw an actor straddling the edge on both sides
- [x] **Window blur during READY doesn't pause.** Only `playing` pauses. Fix: pause from `ready`
  too, and resume back to whichever state was paused
- [x] **Best score can be lost.** It's only written on clear, quit or game over, so refreshing
  mid-run loses it. Fix: also save on `pagehide` / `visibilitychange`

Design changes:
- [x] **Start on first input.** The player auto-runs left and can take a power cell untouched.
  Hold after READY with an "Arrows / WASD to move" prompt; the clock starts on the first
  direction. Same after each lost life
- [x] **Menu: Play first.** Play + difficulty at the top; colours under a collapsible
  "Customise", with a small stationary preview. Must fit at 844 × 390
- [x] **Overcharge readout.** A slim labelled bar in the HUD plus an outline on the player.
  The warning flash covers the last 25%, not a fixed 2 s (at Hard L6 that's the whole window)
- [x] **Score pop-ups for Glitch catches** (pulled forward from M6) so the 200→1600 chain reads
- [x] **Retry on game over.** Enter = retry with the same settings, Q = menu
- [x] **"LEVEL n CLEARED"** text during the level-clear flash

### M6 Modern twists + juice
*Order changed after review: dash before combo. A combo rewards unbroken pellet runs, which may
fight the evasive play dash is for, so see if dash is fun on its own first.*
- [x] Dash (Space, cooldown ring). Rules: pure speed ×2.2 for 0.25 s (~4 tiles), no invulnerability,
  turns and stops like normal movement, eats pellets, only while moving, 4 s cooldown
- [x] Web Audio blips: pellet, power-up, Overcharge ending, eat Glitch, death, level clear, dash, dash ready — **plus mute** (M key, menu toggle, saved)
- [x] Particles, screen shake, dash afterimages *(score pop-ups done in M5b)*. OS "reduce motion" turns shake off and thins particles
- [ ] Combo multiplier + HUD readout — **parked until dash has been playtested** (does dash feel good on its own? would a combo push players to stop dodging?)

### M7 Progression + wrap-up
- [x] Lives (3), level speed-up curve, shorter Overcharge per level *(first pass; tune in playtest)*
- [x] High score in `localStorage`
- [x] Pause screen, game-over screen
- [x] Quit to menu (Q while paused or on game over)
- [x] Difficulty: Normal / Hard, separate high score each *(Hard values need playtest)*
- [ ] Playtest pass: tune speeds and timers. Watch for, from the review:
  - just-late turns that miss a junction (→ forgiving corners, M3)
  - the last ~10 pellets: endless final chase once cells are gone; Hard Glitches match you at L2
    and beat you at L3
  - wall glow drawing the eye ahead of the actors on a full board
  - single remaining pellets that are hard to spot

## Nebula Knockout — brawler

### B1 Prototype
- [x] 480 × 270 world, whole-step pixel scaling, full-resolution HUD
- [x] Stage: parallax starfield + planet, station silhouettes, neon grid floor
- [x] Code-drawn rig with poses: idle, walk, jab, kick, heavy, jump, jump attack, hurt, knockdown, special
- [x] Heroes Nova + Titan; tag on Space with tag-in strike; benched hero regenerates; auto-swap on KO
- [x] Combo (buffered), jump + jump attack, specials (Star Dash, Comet Beam)
- [x] Hitstop, knockback, knockdown, hit sparks, smears, screen shake
- [x] Enemies Voidling + Brute: telegraphed wind-ups, max 2 attacking at once (tokens)
- [x] Stage 1: three wave zones, camera lock, GO →, stage clear
- [x] HUD: both heroes' health, tag cooldown, score; title, pause, game over, retry
- [x] Sounds (shared synth)
- [x] Tests: a headless bot clears the stage; e2e covers controls and states

### B2 Next *(now)*
- [ ] **Playtest B1 with the kids**: what's fun, what's confusing, too easy or too hard? (The test
  bot clears stage 1 every run, so it's probably gentle.)
- [ ] Health pickups + breakable crates
- [ ] Boss at the end of stage 1
- [ ] Ranged enemy (forces movement)
- [ ] Grab + throw
- [ ] Hero select (pick your two from a roster of 3–4)
- [ ] Hero colour picker (shared idea with Neon Chomp)
- [ ] Two-player co-op (each player one hero, or tag pairs)
- [ ] Gamepad support (both games)
- [ ] More stages

## Later

### Windows app — *paused 2026-11-09*
Resume once both games are solid. Preferred wrapper: **Tauri** (small installer, uses Windows'
WebView2). Use Electron only if Steam becomes the target. A PWA is the zero-effort interim.
- Decisions needed: audience (friends / Microsoft Store / Steam), code signing, final names +
  icons + licence, auto-updates, controller support
- Prep: gamepad, fullscreen toggle, Quit button, version number, hide dev aids, GitHub Actions
  Windows build

### Neon Chomp ideas
- **Touch controls** — swipe, plus an on-screen dash button; playable on phone
- **Gamepad support** (Gamepad API)
- **Procedural mazes** — a new layout every level, generated symmetrically
- **More power-ups** — Magnet (pulls pellets in), Phase (walk through one wall), Freeze (Glitches
  stop), Decoy
- **Boss level** every 5 levels — a big Glitch that splits when hit
- **Daily challenge** — a seeded maze, the same for everyone that day
- **Cosmetic unlocks** — trails (sparkle, rainbow, pixel), shapes, hats, earned by score milestones
- **Two-player co-op** on one keyboard (WASD + arrows)
- **Level editor** — draw a maze in the browser, share it as a URL
- **Music** — synthwave loop, intensity rises as pellets run out
- **Accessibility** — colour-blind mode, reduced motion (no shake/flash), adjustable game speed
- **PWA** — installable, works offline
- **Online leaderboard**


### Arcade ideas
- **Deploy to GitHub Pages** so friends can play from a link
- **Shared player profile**: one name and colour scheme across all games
- **Third game**: TBD
