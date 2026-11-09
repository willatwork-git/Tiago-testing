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
| 2026-11-09 | Took ChatGPT's review (`feedback/README.md`) as milestone M5b, before M6 | Four real bugs plus first-run clarity; ahead of new features |
| 2026-11-09 | Declined from that review: HTML pause/game-over panels, "lives incl. current" count, matching tunnel-exit markers, pellets-left counter | Canvas overlays + key shortcuts are enough; spare-life icons are the genre convention; the rest are playtest questions |
| 2026-11-09 | Dash before combo in M6 | Combo may punish the evasive moves dash is for |
| 2026-11-09 | Each life waits for the first *passable* direction after a 0.8 s READY | The opening is the player's choice; a held key after death can't fire them into danger |
| 2026-11-09 | The Overcharge warning is a fraction (last 25%), not seconds | A fixed 2 s covered the whole window at Hard L6 |
| 2026-11-09 | Game input ignores keys aimed at focused form controls (`input.js` CONTROLS) | Menu radios, checkboxes and buttons keep their native keyboard behaviour |
| 2026-11-09 | Tests live in `tests/` (`sim.mjs`, `e2e.mjs`): Node only, no packages; e2e drives Chrome over CDP | Keeps the no-dependency rule while still testing real keyboard and layout |
| 2026-11-09 | `?debug` exposes `window.game` | The e2e tests need to see and set state |
