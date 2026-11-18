# External references

Other people's game code we've looked at to speed up new games. **Checked 2026-11-18** against
GitHub (repo contents and licence files). Re-check a repo's licence before copying anything from
it: licences can be added or changed.

This repo is **public**, so the licence decides what we may do. Code with no licence is "all rights
reserved" by default, even if it's on GitHub.

## Register

| Repo | What's actually in it | Licence | How we may use it |
|---|---|---|---|
| [Softwarebydefault/retro-browser-games](https://github.com/Softwarebydefault/retro-browser-games) | 4 single-file HTML games in `src/`: Space Invaders, Snake, Ricochet (brick breaker), Fighter Pilot (shooter). Zero dependencies; touch controls | **Apache-2.0** (LICENSE file) | ✅ **Reuse allowed.** Keep their copyright and licence, mark our changes, list it in `THIRD_PARTY_NOTICES.md` |
| [ShawTim/arcade-games](https://github.com/ShawTim/arcade-games) | Tetris (SRS rotation, wall kicks), Bubble Shooter, Space Invaders; a shared neon/CRT lobby; one folder per game | **MIT, but only stated in the README.** No LICENSE file, no copyright line | ⚠️ **Probably reusable** with the MIT text and an "© ShawTim" credit. Safer: ask the author to add a LICENSE file first |
| [juliensimon/browser-games](https://github.com/juliensimon/browser-games) | 12 recreations: Computer Space, Pong, Gun Fight, Breakout, Space Invaders, Galaxian, Asteroids, Lunar Lander, Pac-Man, Centipede, Missile Command, Defender. Vanilla JS, CRT effects, synthesised audio | **None.** README: "Fan recreations for educational purposes" | ❌ **Reference only.** Play it and read it to understand mechanics; don't copy code or assets |
| [dmcinnes/HTML5-Asteroids](https://github.com/dmcinnes/HTML5-Asteroids) *(added 2026-11-18)* | Well-known pure-JS Asteroids (★350+): ship inertia, wrapping, splitting rocks, saucer, in `game.js` | **MIT** (LICENSE file) | ✅ **Logic reusable** with attribution. Don't take its jQuery, `.wav` sounds or bundled font (no external assets) |
| [gregfrazier/gakaga](https://github.com/gregfrazier/gakaga) *(added 2026-11-18)* | Small Galaga-style shooter in one `gakaga.js` (diving enemy paths) | **MIT** (LICENSE file) | ✅ **Logic reusable** with attribution. Skip its `Content/` images |
| [vruntime-labs/ping-pong](https://github.com/vruntime-labs/ping-pong) *(added 2026-11-18)* | Small vanilla-canvas Pong (`game.js`) | **MIT** (LICENSE file) | ✅ Reusable, but Pong is small enough that we'd write it fresh |
| [Sd-Jerry/JS-Arcade](https://github.com/Sd-Jerry/JS-Arcade) | Two pages: a Mario matching game and a "Spin and Win" wheel. Plain HTML/JS/CSS in the folders we checked (the README mentions React) | **None** | ❌ **Not useful.** No licence, Nintendo characters, and little to learn |

**Gun Fight:** no permissively licensed version was found on GitHub (2026-11-18 search). The ones
that exist have no licence. Build it from scratch; it's a small game.

Where the original suggestion list and the repos disagree, the table above reflects the repos:
juliensimon has 12 games, not 7, and JS-Arcade is not a multi-game hub.

## Rules for using any of this

1. **Licence first.** Only Apache-2.0 and MIT code may be copied, with attribution. Unlicensed
   repos are for learning only.
2. **Our originality rule still applies** (CLAUDE.md rule 3). Even licensed code recreates games
   whose names and looks belong to others: Tetris, Space Invaders, Pac-Man. We keep the
   mechanics and change the name, characters and look. Take extra care with falling-block games:
   Tetris's look and feel has been successfully defended in court, so a 10-wide well of
   four-square pieces is out.
3. **Each game gets its own look** (CLAUDE.md rule 8). None of these come in a neon/CRT style that
   would clash with Neon Chomp.
4. **Bring it up to arcade standard.** Any game added, whether borrowed or written fresh, uses our
   shared controller, save and sound modules. It gets a home-screen card, a `?debug` hook, and
   sim + e2e tests.
5. **Attribution file.** The first time code is copied, create `THIRD_PARTY_NOTICES.md`. It should
   list the source repo, commit, licence text and which of our files contain it.

**Practical note:** these games are small (a few hundred lines each). Converting one to our
conventions often takes about as long as writing it fresh with theirs open for reference. The
biggest speed-up is our own foundation: the shared modules, test harness and home screen.
