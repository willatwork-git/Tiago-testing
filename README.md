# Neon Arcade

A small browser arcade of original games, each with its own look. No installs, no libraries, no
build step: just HTML, CSS and JavaScript. All art is drawn in code and all sound is synthesised.

| Game | What it is |
|---|---|
| **Neon Chomp** | Maze chase. Clear the maze of light, dodge four Glitches, grab a power cell to Overcharge and bite back. Pick your colours and difficulty. |
| **Borough Brawl** | Side-scrolling tag-team street brawler in detailed pixel-art New York. A sword-swinging shark and a lightning-fast partner, one button to swap mid-fight, a street gang to clear off the block. *(Prototype: one stage.)* |

## Getting started

You need two things: a copy of this folder, and a tiny local web server. The games use JavaScript
modules, which browsers won't load from a file, so double-clicking `index.html` shows a blank
page. Serving the folder fixes that, and it only takes one command.

### 1. Get the code

Either:

- **With git:**
  ```sh
  git clone https://github.com/willatwork-git/Tiago-testing.git
  cd Tiago-testing
  ```
- **Without git:** on the GitHub page, click **Code → Download ZIP**, unzip it, and open a terminal
  in the unzipped folder.

### 2. Start a local server

Run **one** of these from inside the folder (the one containing `index.html`):

| Your computer | Command | Notes |
|---|---|---|
| **macOS / Linux** | `python3 -m http.server 8000` | Python 3 is usually already installed |
| **Windows** | `py -m http.server 8000` | If `py` isn't found, install Python from [python.org](https://www.python.org/downloads/) (tick "Add to PATH"), or use the Node option |
| **Any, with Node.js** | `npx serve -l 8000 .` | Downloads a small server the first time |
| **VS Code** | Install the **Live Server** extension, right-click `index.html` → **Open with Live Server** | No terminal needed |

You'll see something like `Serving HTTP on :: port 8000`. Leave that terminal open while you play.

### 3. Play

Open **http://localhost:8000** in Chrome, Edge, Firefox or Safari, and pick a game with the arrow
keys and Enter. Each game has a **← Arcade** link back to the home screen.

To stop the server, go back to the terminal and press **Ctrl + C**.

### If something goes wrong

| Problem | Fix |
|---|---|
| Blank page | You opened the file directly (`file://…`). Use the server and the `http://localhost:8000` address |
| "Address already in use" | Something else has port 8000. Use another port, e.g. `python3 -m http.server 8080`, then open `http://localhost:8080` |
| No sound | Browsers start audio only after your first key press or click. Also check M (mute) |
| Keys do nothing | Click the game once so the page has keyboard focus |

### Play online (optional)

The arcade is a plain static site, so **GitHub Pages** can host it with no changes: on GitHub, open
**Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and
save. After a minute it's live at **https://willatwork-git.github.io/Tiago-testing/**, and anyone
can play from that link with nothing to install.

## Using a controller

Both games and the home screen work with a **PS5 DualSense** or an **Xbox controller** in
**Chrome** (also Edge). Keyboard and controller work side by side, and the on-screen prompts
switch to ✕ / □ / △ or A / X / Y to match what you're holding.

1. **Connect it:**
   - **PS5 on a Mac:** System Settings → Bluetooth, then hold **PS + Create** on the controller
     until the light flashes, and click **Connect**. Or plug in a USB-C cable.
   - **Xbox on a PC:** plug it in, or pair it in Settings → Bluetooth & devices. It just works on
     Windows.
2. Open the game in Chrome and **press any button**. Browsers only reveal a controller after a
   press. The title screen then says *CONTROLLER CONNECTED*.

| | PS5 | Xbox | Borough Brawl | Neon Chomp |
|---|---|---|---|---|
| Move | Left stick / d-pad | Left stick / d-pad | Move | Move |
| | ✕ | A | Jump · start / retry | Dash · play / retry |
| | □ | X | Attack | Dash |
| | △ | Y | Special | |
| | R1 or ○ | RB or B | Tag partner | |
| | hold R2 | hold RT | Run | |
| | Options | Menu | Pause | Pause |
| | Create | View | Back to arcade (when paused) | Quit to menu (when paused) |

On the home screen, use the d-pad or stick to choose and ✕ / A to play. On the Neon Chomp menu,
d-pad left/right switches difficulty. Borough Brawl rumbles on big hits (where Chrome supports it
for your controller).

**Not detected?** Use `http://localhost:…` or the GitHub Pages link. Browsers hide controllers on
plain `http://` addresses from other machines. Check the controller at
[hardwaretester.com/gamepad](https://hardwaretester.com/gamepad).

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

No dependencies, just [Node.js](https://nodejs.org/) 22 or newer (and Google Chrome for the e2e
tests):

```sh
node tests/sim.mjs              # Neon Chomp logic, headless
node tests/brawler-sim.mjs      # Borough Brawl: a bot plays the stage, headless
# the e2e tests need a server on port 8765 in another terminal:
#   python3 -m http.server 8765
node tests/e2e.mjs              # Neon Chomp in real Chrome
node tests/brawler-e2e.mjs      # arcade home + Borough Brawl in real Chrome
node tests/gamepad-e2e.mjs      # PS5 + Xbox controllers (virtual) in real Chrome
```

The e2e tests look for Chrome in its macOS location. Elsewhere, point them at it with the `CHROME`
environment variable, e.g. `CHROME=/usr/bin/google-chrome node tests/e2e.mjs`.

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
  shared/               sound synth, saved-settings helper, controllers (gamepad.js)
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
