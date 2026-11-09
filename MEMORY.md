# Memory — decisions and facts

Durable decisions, with the reason. Newest at the bottom.

| Date | Decision | Why |
|---|---|---|
| 2026-11-09 | Vanilla JS + Canvas 2D, no deps, no build | Fast to build, runs anywhere, trivial to deploy |
| 2026-11-09 | ES modules served via `python3 -m http.server` | Clean file split; the server costs nothing |
| 2026-11-09 | Original maze-chase, not a Pac-Man recreation | Own identity; avoids copying protected look and characters |
| 2026-11-09 | Modern twists for v1 = dash + combo + neon juice | Biggest fun per line of code |
| 2026-11-09 | Colour picker is a v1 feature (body + glow, presets + custom, saved) | Requested at kickoff |
| 2026-11-09 | Mazes stored as ASCII arrays | Hand-editable; makes procedural generation and an editor easy later |
| 2026-11-09 | Working title "Neon Chomp" | Placeholder until a name is chosen |
| 2026-11-09 | All tunable numbers live in `src/config.js` | Playtesting means editing one file |
| 2026-11-09 | Movement is tile-based: `Mover` with `tx, ty, dir, prog`; decisions only at tile centres | Keeps everyone on the grid; makes collision and AI simple |
| 2026-11-09 | Glitches entering/leaving the house follow precomputed shortest paths, not greedy targeting | Greedy targeting can loop; shortest paths can't |
| 2026-11-09 | `?play` in the URL skips the title screen | Dev aid for quick testing and headless screenshots |
| 2026-11-09 | Default player colour is lime `#7cff4f` | Distinct from all four Glitches, frightened blue and the violet walls |
| 2026-11-09 | Title menu is DOM (`src/ui.js`), not canvas | Native colour picker and keyboard focus for free |
| 2026-11-09 | Difficulty = Normal / Hard via modifiers in `DIFFICULTY` (config.js); separate high score per difficulty | Requested; a Hard score shouldn't compete with Normal ones |
| 2026-11-09 | Quit to menu = Q while paused or on game over (not mid-play) | Stops an accidental keypress from ending a run |
| 2026-11-09 | Space no longer starts the game | Reserved for dash (M6) |
