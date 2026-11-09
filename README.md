# Neon Chomp

A fast, glowing maze-chase game for the browser. Clear the maze of light, dodge the four
Glitches, grab a power cell to overcharge and bite back. Pick your own colours and difficulty.

No installs, no libraries, no build step — just HTML, CSS and JavaScript.

## Play it

The game uses JavaScript modules, so it has to be served rather than opened as a file.
From this folder, run any one of these:

```sh
python3 -m http.server 8000     # macOS / Linux: Python is usually already there
npx serve .                     # if you have Node.js
```

Then open **http://localhost:8000** (or the address `npx serve` prints).

## How to play

| Key | Action |
|---|---|
| Arrows / WASD | Move. Press a turn early and it'll take it at the next junction |
| P or Esc | Pause / resume |
| Q | Quit to menu (while paused, or on game over) |
| Enter | Play. On game over: retry |

- Nothing moves until you press a direction: take your time.
- Eat every pellet to clear the level. Each level is faster.
- **Power cells** (the big pulsing dots) **Overcharge** you: the Glitches turn blue and you can eat
  them, 200 → 400 → 800 → 1600 in a row. Watch the OVERCHARGE bar; when it flashes, back off.
- **Normal** or **Hard**: on Hard the Glitches nearly match your speed and rest less.
  Each difficulty has its own high score.

### Meet the Glitches

| Looks like | Name | How it hunts |
|---|---|---|
| red triangle | Hunter | Comes straight for you |
| pink diamond | Sneak | Aims a few tiles ahead of you, to cut you off |
| cyan square | Drift | Wanders. Unpredictable |
| orange hexagon | Skittish | Chases from a distance, panics up close |

Every so often they all break off and head for their corners. That's your moment.

## Status

Playable. Done: maze, player, all four Glitches, power-ups with an Overcharge meter, lives, levels,
high scores, retry, and a keyboard-friendly title menu with colour picker and difficulty.

Coming next: **dash** (Space), **combo multiplier**, particles, screen shake and sound. See
[TODO.md](TODO.md) for the roadmap and the ideas list.

## Tweaking it

Every speed, timer and score is in [`src/config.js`](src/config.js). Change a number and refresh.
The maze is ASCII art in [`src/maze.js`](src/maze.js): `#` wall, `.` pellet, `o` power cell.
Draw your own, as long as every row is the same width.

Add `?play` to the URL to skip the title menu.

### Tests

No dependencies, just Node 22+:

```sh
node tests/sim.mjs     # game logic, headless
node tests/e2e.mjs     # drives real Chrome; start the server on port 8765 first
```

## Project docs

| File | What's in it |
|---|---|
| [DESIGN.md](DESIGN.md) | Game design: goals, mechanics, enemies, tech choices |
| [TODO.md](TODO.md) | Roadmap: current milestones and future ideas |
| [ACTIVITY.md](ACTIVITY.md) | Dev log |
| [MEMORY.md](MEMORY.md) | Decisions made, and why |
| [CLAUDE.md](CLAUDE.md) | Working notes for the AI pair-programmer (Claude Code) this was built with |

## Code layout

```
index.html      page + title menu markup
style.css       menu styling
src/
  main.js       game loop and state machine
  config.js     all tunable numbers
  maze.js       maze layout and tile queries
  entity.js     shared grid movement
  player.js     the player
  glitches.js   enemy behaviour
  render.js     all canvas drawing
  ui.js         title menu, colour picker
  input.js      keyboard
  storage.js    saved settings and high scores
tests/
  sim.mjs       headless logic simulation
  e2e.mjs       browser checks (keyboard, menu, states)
```
