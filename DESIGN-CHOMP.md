# Neon Chomp — Design

*Working title. Original maze-chase game for the browser. v0.1, 2026-11-09.*

## Pitch

A fast, glowing maze-chase. You're a neon muncher clearing a grid of light, chased by four
"Glitches" that each hunt differently. Eat a power cell to overcharge and turn the tables. Short
levels (~90 s), one more go.

**Originality:** the genre and core mechanics are fair game. The name, characters, maze layouts,
art and sound are all ours — no recreation of Pac-Man's look, ghosts, names or levels.

## Design pillars

1. **Feel first.** Movement has to be crisp: input buffering, forgiving corners, no stuck frames.
   If it doesn't feel good with a grey box, art won't save it.
2. **Readable at a glance.** Dark background, bright actors, every enemy distinguishable by
   colour *and* shape.
3. **Small, finished, polished** beats big and half-built. Every feature in v1 is cheap to build.

## Core loop

Clear all pellets → next level (faster enemies, shorter overcharge) → lose all lives → game over
→ beat your high score.

## v1 features

| Feature | What it is | Why it's cheap |
|---|---|---|
| Grid movement | Tile-based, smooth interpolation, buffered turns, wrap-around tunnels | Classic, well-understood |
| Pellets + power cells | Power cell = **Overcharge**: Glitches turn vulnerable for a few seconds | One state flag |
| **Dash** *(modern twist)* | Space = 3-tile burst, 4 s cooldown, shown as a ring around the player | A speed multiplier + timer |
| **Combo** *(modern twist)* | Pellets eaten in quick succession raise a multiplier (x1→x5); stalling resets it | A counter + timer |
| Neon look | Canvas `shadowBlur` glow, walls drawn as glowing outlines | No image assets |
| Juice | Particle bursts, screen shake on overcharge/death, floating score popups | ~100 lines total |
| **Colour picker** | Choose the player's body and glow/trail colour on the title screen | See below |
| Sound | Synthesised Web Audio blips — no audio files | Few lines per sound |
| Lives, levels, high score | 3 lives, increasing speed, high score saved in `localStorage` | Standard |

## The Glitches (enemies)

Four behaviours, one simple rule each:

| Name | Colour / shape | Behaviour |
|---|---|---|
| **Hunter** | red triangle | Targets the player's current tile |
| **Sneak** | pink diamond | Targets 4 tiles ahead of the player |
| **Drift** | cyan square | Wanders randomly at junctions |
| **Skittish** | orange hexagon | Chases when far, retreats when close |

Modes alternate between *chase* and *scatter* (each heads for its home corner) on a timer.
During Overcharge they're *frightened* (blue, slow, flee). Once eaten, they become eyes that run
home and respawn.

## Character colour picker

- On the title menu (an HTML panel over the canvas). The title parade doubles as the live preview.
- **8 preset swatches** (lime, chartreuse, jade, mint, lemon, lavender, peach, silver), each
  checked to stay clear of every enemy colour, plus a custom `<input type="color">`.
- Two slots: **body** and **glow/trail**, with a "match body" toggle that's on by default.
- Saved to `localStorage`, so it's restored next visit.
- Guard: warn (don't block) if the body colour is close to a Glitch, frightened blue, the walls or
  the white flash, or is too dark to see.

## Dash

Space gives a burst of ×2.2 speed for 0.25 s, about 4 tiles at level 1. It's an escape or a
route commitment, not a shield:

- **No invulnerability.** Dashing into a Glitch kills you.
- It follows normal movement rules: it takes buffered turns, stops at walls and eats pellets on
  the way.
- It only fires while you're moving, so a dash into a wall can't waste the cooldown.
- The 4 s cooldown is drawn as a ring around the player that fills clockwise. There's a blip and
  a sparkle when it's ready.

Tunables: `CONFIG.dash`.

## Sound and effects

- **Sound:** synthesised Web Audio, no files. Each sound marks an event: pellet, power cell,
  Overcharge ending, Glitch caught, death, level clear, dash, dash ready. M toggles mute
  (also in the menu); the setting is saved.
- **Effects:** particle bursts and screen shake, plus dash afterimages. If the OS "reduce motion"
  setting is on, there's no shake and fewer particles.
- **How it's wired:** game logic emits events (`emit()` in `main.js`); `audio.js` and `fx.js`
  react to them. Game rules never call audio or drawing directly.

## Difficulty

Chosen on the title menu. It's remembered between visits, and each difficulty keeps its own high score.

| | Normal | Hard |
|---|---|---|
| Glitch speed | level curve | +0.8 tiles/s (level 1 is almost your speed) |
| Overcharge length | full | ×0.6 |
| Time before Glitches leave the house | full | ×0.4 |
| Scatter (breather) phases | full | ×0.5 |

All values are in `DIFFICULTY` in `src/chomp/config.js`.

## Controls

| Input | Action |
|---|---|
| Arrows / WASD | Move |
| Space | Dash (while moving; 4 s cooldown shown as a ring) |
| M | Sound on/off |
| P / Esc | Pause / resume |
| Q | Quit to menu (while paused, or on game over) |
| Enter | Play; on game over, retry with the same settings |

Each life starts when you press a direction you can actually move in. Nothing moves before that,
so the opening is always the player's choice. Losing window focus pauses the game, READY included.

Controller (PS5 / Xbox): stick or d-pad move · ✕/A or □/X dash · Options/Menu pause ·
Create/View quit to menu (paused) · on the menu, d-pad left/right switches difficulty and ✕/A plays.
Touch comes later.

## Tech

- **Vanilla JavaScript + HTML5 Canvas 2D.** No dependencies, no build step.
- ES modules, so it needs a local server: `python3 -m http.server 8000`, then open
  `http://localhost:8000`.
- Fixed-timestep update (60 Hz) with a separate render pass, so behaviour is frame-rate independent.
- Mazes are ASCII string arrays (`#` wall, `.` pellet, `o` power cell, `-` Glitch gate, ` `
  empty), which makes them easy to edit by hand.
- Game state machine: `title → playing → paused → levelClear → dying → gameOver`.

### File layout

```
chomp/index.html     page + title menu markup
src/chomp/
  main.js            boot, loop, state machine
  config.js          every tunable number (speeds, timers, scores)
  entity.js          shared tile-to-tile movement (Mover)
  input.js           keyboard + buffering
  maze.js            layouts, parsing, tile queries
  player.js
  glitches.js        enemy AI + modes
  render.js          drawing, glow, HUD, overlays
  fx.js              particles, screen shake
  audio.js           Neon Chomp's sound set (on the shared synth)
  ui.js              title menu, colour picker
  storage.js         localStorage (colours, difficulty, high scores, mute)
```

## Out of scope for v1

Mobile and touch, multiple maze designs, online anything, music, a level editor.
All of these are in `TODO.md → Later`.

## Open questions

- Final name?
- One maze for v1, or two that alternate?
- Is the dash a free move, or does it cost something (e.g. it resets the combo)?
