# Game candidates

Every game we could add to the Neon Arcade, drawn from the repos in `REFERENCES.md`. 2026-11-18.

Names are working titles: each is an original take on a genre, not a copy of the classic it
started from. "Code" says whether a licensed repo can be reused (✅ Apache-2.0, ⚠️ MIT stated in
README only) or is study-only (📖).

**Effort:** S = a session or two · M = a few sessions · L = a big build like Borough Brawl.
**Kids:** how strongly we expect it to land with young players (a guess until they've tried it).

## Chosen line-up (2026-11-18)

Will picked nine classics to build. They're built as **our own versions**: same genre and
mechanics, with our name, characters and look. A home-screen card can say "a falling-block
puzzle", but not "Tetris".

| # | Classic | Our working title | Fast-start source (see `REFERENCES.md`) | Effort | Build order |
|---|---|---|---|---|---|
| 1 | Pong | **Rally** | Fresh (tiny); ✅ vruntime-labs/ping-pong if wanted | S | 1st: smallest; proves the new-game template |
| 2 | Snake | **Noodle** | ✅ Softwarebydefault `retro-snake.html` | S | 2nd |
| 3 | Breakout | **Brickstorm** | ✅ Softwarebydefault `retro-ricochet.html` | S | 3rd |
| 4 | Space Invaders | **Sky Patrol** | ✅ Softwarebydefault · ⚠️ ShawTim | S–M | 4th |
| 5 | Galaxian | **Sky Patrol: Swarm** (or its own game) | ✅ gregfrazier/gakaga (dive paths) | M | 5th, built on Sky Patrol's engine |
| 6 | Asteroids | **Drift Belt** | ✅ dmcinnes/HTML5-Asteroids (`game.js` only) | M | 6th |
| 7 | Bubble Shooter | **Pop Reef** | ⚠️ ShawTim `bubble-shooter/` | M | 7th |
| 8 | Gun Fight | **Snowball Showdown** | None licensed; build fresh | S–M | 8th, after two-pad support |
| 9 | Tetris | **Block Drop** (genuinely different design) | ⚠️ ShawTim (rotation logic only) | M | 9th, design must clear the legal check first |

Every one of the nine has either a usable licensed source or is small enough to write fresh.
**Rally** and **Snowball Showdown** need two-controller support. **Block Drop** is last on
purpose (see the Tetris caution below).

## Earlier shortlist (before the line-up was chosen)

| # | Working title | Genre (started from) | Our twist and look | Code | Effort | Kids |
|---|---|---|---|---|---|---|
| 1 | **Brickstorm** | Brick breaker (*Breakout*) | Paddle and ball through a crumbling construction site; power-ups (multi-ball, laser, sticky), a boss wall every 5 levels. Chunky toy-block look | ✅ Ricochet (Softwarebydefault) · 📖 juliensimon | S | High |
| 2 | **Pop Reef** | Bubble shooter (*Puzzle Bobble*-style) | Pop bubbles in an underwater reef, a nod to Razorfin's world; trapped fish freed by clears. Soft watercolour look. Aims nicely with a stick | ⚠️ ShawTim | M | High |
| 3 | **Snowball Showdown** | Two-player duel (*Gun Fight*) | Two kids, two controllers, a snow fort in between, snowballs instead of guns. Wintry storybook look | 📖 juliensimon | S–M | High (versus) |

Why these three: quick to build, very different looks from our current two games, and good with a
controller. Snowball Showdown is the first true two-player game, which needs the controller module
to handle **two pads** (it only reads player one today). That's a small, reusable change.

## Everything else we could include

| Working title | Genre (started from) | Our twist and look | Code | Effort | Kids | Notes |
|---|---|---|---|---|---|---|
| **Rally** | Bat-and-ball versus (*Pong*) | Two-player on one screen or vs CPU; spin, power shots, a court that changes each round | 📖 juliensimon | S | Medium | Also needs two pads; a natural pair with Snowball Showdown |
| **Noodle** | Snake | A growing noodle in a takeaway kitchen; two-player mode where noodles can't cross | ✅ Snake (Softwarebydefault) | S | Medium–High | Simplest possible build |
| **Cloud Ace** | Vertical shooter (*1942*-style) | A paper-plane squadron over a cardboard city; formation power-ups | ✅ Fighter Pilot (Softwarebydefault) | M | High | Great with a controller |
| **Sky Patrol** | Fixed shooter (*Space Invaders*, *Galaxian*) | Rooftop defence against a flock of mechanical pigeons that later break formation and dive | ✅ Space Invaders (Softwarebydefault) · ⚠️ ShawTim · 📖 juliensimon | S–M | Medium | Avoid the classic marching-crab look |
| **Drift Belt** | Inertia shooter (*Asteroids*) | Tiny salvage ship in a junk field; rocks split, magnet pickups | 📖 juliensimon | M | Medium | Floaty physics; great on a stick |
| **Touchdown** | Lander (*Lunar Lander*) | Land a delivery drone on rooftops in wind; triggers for thrust | 📖 juliensimon | S | Medium | Calm game; good for younger kids |
| **Skyshield** | Defend-the-cities (*Missile Command*) | Fireworks intercept falling meteors over a seaside town | 📖 juliensimon | M | Medium | Needs a cursor; works with a stick |
| **Garden Run** | Segmented-enemy shooter (*Centipede*) | A caterpillar winding through a vegetable patch; slugs and beetles | 📖 juliensimon | M | Medium | |
| **Block Drop** | Falling blocks (*Tetris*) | Must be clearly different: e.g. odd-shaped pentomino pieces that clear by colour groups, on a wider board | ⚠️ ShawTim (rotation logic only) | M | High | ⚠️ **Highest legal risk.** Tetris's look is legally protected; only do a genuinely different design |
| **Card Flip** | Memory match | Pairs of cards with our own characters (Razorfin, Nova, Glitches…) | (none usable) | S | High for little ones | Our own art; the JS-Arcade version uses Mario, so not that |
| **Scrambler** | Side-scrolling defender (*Defender*) | Rescue kittens from saucers over a scrolling city | 📖 juliensimon | L | Medium | Complex; later, if at all |

## Not including

| Game | Why not |
|---|---|
| *Pac-Man* (juliensimon) | We already have our own maze-chase: Neon Chomp |
| *Computer Space* (juliensimon) | Historically interesting, not much fun to play |
| *Spin and Win* (JS-Arcade) | A prize wheel, not a game |
| *Mario Matching* (JS-Arcade) | Nintendo characters; the idea lives on as Card Flip with our own cast |

## Before starting any of these

1. Pick the look (it must differ from neon Chomp and pixel-art Borough Brawl) and a working name.
2. Check `REFERENCES.md` for the licence, and add `THIRD_PARTY_NOTICES.md` if any code is copied.
3. Write a short `DESIGN-<GAME>.md` and a TODO milestone, as for the first two games.
4. Build on the shared modules (controllers, saves, sound), add a home-screen card, and write sim +
   e2e tests.
