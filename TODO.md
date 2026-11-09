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
- [ ] Title screen with animated player preview
- [ ] 8 presets + custom colour input, body + glow slots, "match body" toggle
- [ ] Persist to `localStorage`
- [ ] Soft warning when a colour clashes with a Glitch or frightened blue

### M6 Modern twists + juice
- [ ] Dash (Space, cooldown ring)
- [ ] Combo multiplier + HUD readout
- [ ] Particles, screen shake, floating score popups
- [ ] Web Audio blips: chomp, power-up, eat Glitch, death, level clear

### M7 Progression + wrap-up
- [x] Lives (3), level speed-up curve, shorter Overcharge per level *(first pass; tune in playtest)*
- [x] High score in `localStorage`
- [x] Pause screen, game-over screen
- [ ] Playtest pass: tune speeds and timers

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
