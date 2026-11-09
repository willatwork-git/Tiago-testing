# Neon Arcade

A small browser arcade of original neon games. No installs, no libraries, no build step: just
HTML, CSS and JavaScript. All art is drawn in code and all sound is synthesised.

| Game | What it is |
|---|---|
| **Neon Chomp** | Maze chase. Clear the maze of light, dodge four Glitches, grab a power cell to Overcharge and bite back. Pick your colours and difficulty. |
| **Borough Brawl** | Side-scrolling tag-team street brawler in detailed pixel-art New York. A sword-swinging shark and a lightning-fast partner, one button to swap mid-fight, a street gang to clear off the block. *(Prototype: one stage.)* |

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

## Borough Brawl

| Key | Action |
|---|---|
| Arrows / WASD | Move (up/down walks into or out of the screen) |
| Tap → → and hold (or Shift) | Run |
| J or Z | Attack: tap again to combo. While running: running attack |
| K or X | Jump: attack in the air for a jump attack |
| L or C | Special: a throw on the ground, a dive in the air |
| Space | Tag your partner in |
| P or Esc | Pause · M sound · Q back to the arcade (paused or at the end) |

- **Razorfin** (the shark, designed by the kids) swings a sword. Running attack **Shark Rush**,
  thrown **Fin Blade** (cuts through a whole line), air dive **Depth Charge** (shockwave on landing).
- **Nova** is fast: running **Star Dash**, **Star Throw**, and a diving **Comet Dive** kick.
- **Tag** whenever you like (short cooldown). The incoming hero arrives with a strike, and the
  benched hero slowly heals. If one goes down, the other jumps in. If both go down, it's game over.
- The **Gutter Kings** (Punks and Bruisers) flash and show a **!** before they attack. Move, or
  jump over it.
- Clear each wave, follow **GO ▶**, and clear the block.

## Status

- **Neon Chomp:** playable v1 (dash, sound, effects, colours, difficulty). Next: playtest and tuning.
- **Borough Brawl:** playable prototype, one stage, all special moves. Next: playtest with the
  kids, then pickups, a boss, more enemies and stages. See [TODO.md](TODO.md).
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
node tests/brawler-sim.mjs      # Borough Brawl: a bot plays the stage, headless
# with a server on port 8765:
node tests/e2e.mjs              # Neon Chomp in real Chrome
node tests/brawler-e2e.mjs      # arcade home + Borough Brawl in real Chrome
```

## Project docs

| File | What's in it |
|---|---|
| [DESIGN.md](DESIGN.md) | The arcade: shared goals, structure, how code is shared |
| [DESIGN-CHOMP.md](DESIGN-CHOMP.md) | Neon Chomp design |
| [DESIGN-BRAWLER.md](DESIGN-BRAWLER.md) | Borough Brawl design, what it borrows from which games, and how the shark concept became a sprite |
| [TODO.md](TODO.md) | Roadmap per game, plus ideas |
| [ACTIVITY.md](ACTIVITY.md) | Dev log |
| [MEMORY.md](MEMORY.md) | Decisions made, and why |
| [CLAUDE.md](CLAUDE.md) | Working notes for the AI pair-programmer (Claude Code) this was built with |

## Code layout

```
index.html              arcade home
style.css               shared styles
chomp/index.html        Neon Chomp page        brawler/index.html   Borough Brawl page
src/
  home.js               home screen: previews, best scores
  shared/               sound synth, saved-settings helper
  chomp/                Neon Chomp: main, config, maze, entity, player, glitches,
                        render, fx, audio, ui, input, storage
  brawler/              Borough Brawl:
    main.js             loop, screens, wiring
    game.js             all fight logic (no DOM, so tests can run it)
    fighters.js         heroes, enemies, moves
    stage.js            wave zones
    rig.js              code-drawn characters and poses (incl. Razorfin)
    render.js           New York street, pixel layer, HUD
    fx.js, sounds.js, input.js, storage.js, config.js
tests/                  sim + e2e for each game; cdp.mjs is the Chrome driver
```
