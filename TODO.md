# TODO

## Now — v1 (playable, polished, one maze)

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

## Later — cool future ideas

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
- **Deploy to GitHub Pages**
