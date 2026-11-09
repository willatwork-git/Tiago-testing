# Neon Arcade

A small browser arcade of original neon games. No installs, no libraries, no build step: just
HTML, CSS and JavaScript. All art is drawn in code and all sound is synthesised.

| Game | What it is |
|---|---|
| **Neon Chomp** | Maze chase. Clear the maze of light, dodge four Glitches, grab a power cell to Overcharge and bite back. Pick your colours and difficulty. |
| **Nebula Knockout** | Side-scrolling tag-team brawler. Two heroes, one button to swap mid-fight, waves of cosmic invaders. Retro pixels, modern feel. *(Prototype: one stage.)* |

## Play it

The games use JavaScript modules, so they have to be served rather than opened as files. From
this folder, run either of these:

```sh
python3 -m http.server 8000     # macOS / Linux: Python is usually already there
npx serve .                     # if you have Node.js
```

Then open **http://localhost:8000** and pick a game.

## Neon Chomp

| Key | Action |
|---|---|
| Arrows / WASD | Move. Press a turn early and it'll take it at the next junction |
| Space | Dash: a quick burst of speed. Recharges in 4 s (the ring around you) |
| M | Sound on/off |
| P or Esc | Pause / resume |
| Q | Quit to the menu (while paused, or on game over) |
| Enter | Play. On game over: retry |

- Nothing moves until you press a direction, so take your time.
- Eat every pellet to clear the level. Each level is faster.
- **Power cells** (the big pulsing dots) **Overcharge** you: the Glitches turn blue and you can
  eat them, 200 → 400 → 800 → 1600 in a row. Watch the OVERCHARGE bar; when it flashes, back off.
- **Normal** or **Hard**: on Hard the Glitches nearly match your speed and rest less.

| Looks like | Glitch | How it hunts |
|---|---|---|
| red triangle | Hunter | Comes straight for you |
| pink diamond | Sneak | Aims a few tiles ahead of you, to cut you off |
| cyan square | Drift | Wanders. Unpredictable |
| orange hexagon | Skittish | Chases from a distance, panics up close |

## Nebula Knockout

| Key | Action |
|---|---|
| Arrows / WASD | Move (up/down walks into or out of the screen) |
| J or Z | Attack: tap again to combo |
| K or X | Jump: attack in the air for a jump kick |
| L or C | Special |
| Space | Tag your partner in |
| P or Esc | Pause · M sound · Q back to the arcade (paused or at the end) |

- **Nova** is fast: a 3-hit combo, and **Star Dash** lunges through everything in front of her.
- **Titan** hits hard: a 2-hit combo, and **Comet Beam** blasts across the screen.
- **Tag** whenever you like (short cooldown). The incoming hero arrives with a strike, and the
  benched hero slowly heals. If one goes down, the other jumps in. If both go down, it's game over.
- Enemies flash and show a **!** before they attack. Move, or jump over it.
- Clear each wave, follow **GO →**, and beat the final arena to clear the stage.

## Status

- **Neon Chomp:** playable v1 (dash, sound, effects, colours, difficulty). Next: playtest and tuning.
- **Nebula Knockout:** playable prototype, one stage. Next: playtest with the kids, then
  pickups, a boss, more enemies and stages. See [TODO.md](TODO.md).
- **Windows app:** paused until both games are solid.

## Tweaking it

Every speed, timer and score lives in each game's config: [`src/chomp/config.js`](src/chomp/config.js)
and [`src/brawler/config.js`](src/brawler/config.js). Moves and enemies are in
[`src/brawler/fighters.js`](src/brawler/fighters.js); waves are in [`src/brawler/stage.js`](src/brawler/stage.js).
The Chomp maze is ASCII art in [`src/chomp/maze.js`](src/chomp/maze.js).

Add `?play` to a game's URL to skip its title screen.

### Tests

No dependencies, just Node 22+:

```sh
node tests/sim.mjs              # Neon Chomp logic, headless
node tests/brawler-sim.mjs      # Nebula Knockout: a bot plays the stage, headless
# with a server on port 8765:
node tests/e2e.mjs              # Neon Chomp in real Chrome
node tests/brawler-e2e.mjs      # arcade home + Nebula Knockout in real Chrome
```

## Project docs

| File | What's in it |
|---|---|
| [DESIGN.md](DESIGN.md) | The arcade: shared goals, structure, how code is shared |
| [DESIGN-CHOMP.md](DESIGN-CHOMP.md) | Neon Chomp design |
| [DESIGN-BRAWLER.md](DESIGN-BRAWLER.md) | Nebula Knockout design, and what it borrows from which games |
| [TODO.md](TODO.md) | Roadmap per game, plus ideas |
| [ACTIVITY.md](ACTIVITY.md) | Dev log |
| [MEMORY.md](MEMORY.md) | Decisions made, and why |
| [CLAUDE.md](CLAUDE.md) | Working notes for the AI pair-programmer (Claude Code) this was built with |

## Code layout

```
index.html              arcade home
style.css               shared styles
chomp/index.html        Neon Chomp page        brawler/index.html   Nebula Knockout page
src/
  home.js               home screen: previews, best scores
  shared/               sound synth, saved-settings helper
  chomp/                Neon Chomp: main, config, maze, entity, player, glitches,
                        render, fx, audio, ui, input, storage
  brawler/              Nebula Knockout:
    main.js             loop, screens, wiring
    game.js             all fight logic (no DOM, so tests can run it)
    fighters.js         heroes, enemies, moves
    stage.js            wave zones
    rig.js              code-drawn characters and poses
    render.js           backdrop, world, HUD
    fx.js, sounds.js, input.js, storage.js, config.js
tests/                  sim + e2e for each game; cdp.mjs is the Chrome driver
```
