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
| 2026-11-09 | Dash = pure speed (×2.2, 0.25 s, 4 s cooldown), no invulnerability, only while moving | An escape tool that still demands judgement; it can't be wasted into a wall |
| 2026-11-09 | Game logic emits events; audio and fx subscribe | Rules stay testable headless; sound and effects can change freely |
| 2026-11-09 | Combo parked until dash is playtested | The review's concern: a combo could punish evasive play |
| 2026-11-09 | Respect OS "reduce motion": no shake, fewer particles | Cheap accessibility win |
| 2026-11-09 | Project becomes **Neon Arcade**: a home screen plus games as separate pages (`chomp/`, `brawler/`) | Each game starts clean; a bug in one can't break the other; no need to refactor Chomp's single-module loop |
| 2026-11-09 | Second game: **Nebula Knockout**, a tag-team beat 'em up. Mechanics drawn from Marvel Cosmic Invasion (tag team, cosmic invaders) and Shredder's Revenge (retro look, modern feel) | The kids like Cosmic Invasion. Mechanics only; characters, names and art are original |
| 2026-11-09 | Brawler renders at 480×270 with whole-step pixel scaling; the HUD is drawn at full resolution | Retro pixels, modern crisp UI |
| 2026-11-09 | Characters are a code-drawn rig (two-segment limbs + poses), not sprites | Keeps the no-assets rule; one rig serves every fighter |
| 2026-11-09 | Brawler game logic has no DOM access | A headless bot can play the stage in tests |
| 2026-11-09 | Rule of two for shared code; only the sound synth is shared so far | Avoid guessing an "engine" before two games need it |
| 2026-11-09 | Windows app paused; Tauri preferred when it resumes | Get both games solid first |
| 2026-11-09 | Brawler setting moved to pixel-art New York at dusk with a street gang; renamed **Borough Brawl** (working) | Will's direction: not the same look as Neon Chomp; a road to fight on |
| 2026-11-09 | Razorfin (the kids' shark concept) is the lead hero, translated into the code rig, not imported as an image | A painting can't animate; the rig keeps the no-assets rule. Option to import a hand-drawn sprite sheet later |
| 2026-11-09 | Titan retired for now; returns with hero select | Razorfin took the heavy role |
| 2026-11-09 | Specials: ground = throw, air = dive, →→ + attack = running attack; one shared cooldown per hero | Covers all three requested specials with one extra button |
| 2026-11-09 | Fighters drawn on a separate layer with alpha snapped on/off | Real pixel-art edges instead of soft vector shapes |
