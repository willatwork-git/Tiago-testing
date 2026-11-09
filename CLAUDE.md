# Neon Chomp — working context

An original maze-chase game for the browser (working title). It's a build project: read source
properly, run it, and test changes in the browser.

## Read first

- `DESIGN.md` — what we're building and why. It's the source of truth for scope.
- `TODO.md` — current milestone. Work top-down; tick items off as they land.
- `MEMORY.md` — decisions already made. Don't re-litigate them.

## Run

```
python3 -m http.server 8000
```
Then open http://localhost:8000. A server is needed because the code uses ES modules.
Add `?play` to the URL to skip the title screen, `?debug` to expose the game state as `window.game`.

## Test

```
node tests/sim.mjs     # game logic, headless: maze, AI, 20 simulated runs
node tests/e2e.mjs     # real Chrome via DevTools Protocol; needs the server on port 8765
```
Run both after any change to movement, AI, input, menu or states. No dependencies (Node 22+).

Tunable numbers (speeds, timers, scores) are all in `src/config.js`.

## Rules

1. **No dependencies, no build step.** Vanilla JS, Canvas 2D, Web Audio. If something seems to
   need a library, raise it first.
2. **Feel first.** Movement and collision quality outrank visuals. Get it right with grey boxes,
   then add glow.
3. **Original, not a clone.** Our own name, characters, mazes, art and sound. Genre mechanics are
   fine; Pac-Man's look, ghost names and level layouts are not.
4. **No external assets.** Graphics are drawn in code; sound is synthesised.
5. **Keep files small and single-purpose** (see the layout in `DESIGN.md`).
6. Australian English in docs and UI text (colour, behaviour).

## Housekeeping — every session

- Append a dated entry to `ACTIVITY.md`: what changed, and what's next.
- Tick off `TODO.md`; add anything new under the right heading.
- Record any real decision (and why) in `MEMORY.md`.
- Update `DESIGN.md` if scope changes.
