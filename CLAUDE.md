# Neon Arcade — working context

A small browser arcade of original neon games (working title):
- **Neon Chomp**, a maze-chase
- **Nebula Knockout**, a side-scrolling tag-team beat 'em up

This is a build project: read source properly, run it, and test changes in the browser.

## Read first

- `DESIGN.md` — the arcade: shared goals, structure, the rule of two for shared code.
- `DESIGN-CHOMP.md`, `DESIGN-BRAWLER.md` — each game's design. They're the source of truth for scope.
- `TODO.md` — current milestones per game. Work top-down; tick items off as they land.
- `MEMORY.md` — decisions already made. Don't re-litigate them.

## Run

```
python3 -m http.server 8000
```
Open http://localhost:8000 for the arcade home, `/chomp/` or `/brawler/` for a game. A server is
needed because the code uses ES modules.
Dev aids in either game: `?play` skips the title screen; `?debug` exposes the game state as
`window.game`.

## Test

```
node tests/sim.mjs            # Neon Chomp logic, headless
node tests/brawler-sim.mjs    # Nebula Knockout logic, headless (a bot plays the stage)
# start a server on port 8765 first for these two:
node tests/e2e.mjs            # Neon Chomp in real Chrome
node tests/brawler-e2e.mjs    # home screen + Nebula Knockout in real Chrome
```
Run the relevant pair after any change to movement, AI, combat, input, menus or states. No
dependencies (Node 22+).

Tunable numbers live in each game's `config.js` (`src/chomp/`, `src/brawler/`).

## Rules

1. **No dependencies, no build step.** Vanilla JS, Canvas 2D, Web Audio. If something seems to
   need a library, raise it first.
2. **Feel first.** Controls and hit/collision quality outrank visuals.
3. **Original, not a clone.** Genre mechanics and ideas are fine. Other games' characters, names,
   art, levels and music are not: no Pac-Man ghosts, Marvel heroes, TMNT, etc. Inspirations and
   what we take from each are listed in the design docs.
4. **No external assets.** Graphics are drawn in code; sound is synthesised.
5. **Rule of two.** Code moves to `src/shared/` only when both games use it.
6. **Brawler logic has no DOM access** (`src/brawler/game.js` and below), so the headless bot
   test can run it. DOM, loop and rendering stay in `main.js` and `render.js`.
7. **Keep files small and single-purpose.**
8. Australian English in docs and UI text (colour, behaviour).

## Housekeeping — every session

- Append a dated entry to `ACTIVITY.md`: what changed, and what's next.
- Tick off `TODO.md`; add anything new under the right heading.
- Record any real decision (and why) in `MEMORY.md`.
- Update the design docs if scope changes.
