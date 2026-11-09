# Nebula Knockout — Design

*Working title. Side-scrolling tag-team beat 'em up. v0.1, 2026-11-09.*

## Pitch

Cosmic invaders have landed on a neon space-station boulevard. You control a **pair of heroes**
and **tag between them mid-fight**. One is fast, one hits hard, and the benched partner recovers
health. Punch, jump and use specials through waves of Voidlings, stage by stage.

## Inspirations: what we take, and what we don't

| Game | We take | We don't take |
|---|---|---|
| **Marvel Cosmic Invasion** (Tribute Games, 2025) | Pick-two **tag team** with mid-fight swaps; a **cosmic invader** setting; heroes with clearly different styles (melee vs ranged) | Any Marvel character, name, power set, costume or story |
| **TMNT: Shredder's Revenge** (Tribute Games, 2022) | **Retro look, modern feel**: chunky pixel art, snappy and forgiving controls, quick-reading hits | Turtles, Shredder, Foot Clan, any TMNT art or locations |
| **Streets of Rage 4** | Enemies **signal attacks before they land**; hits that feel weighty (hitstop, knockback) | Characters, art, music |
| **Final Fight** | Waves that lock the screen, then **GO →**; health pickups later | Characters, stages |

Our heroes, enemies, setting and names are original.

## Heroes (prototype pair)

| | Nova | Titan |
|---|---|---|
| Style | Fast striker | Heavy hitter |
| Colour | Pink | Blue |
| Speed | Quick | Slower |
| Combo | Jab, jab, high kick (3 hits; the kick knocks down) | Heavy punch, hammer blow (2 hits; the second knocks down) |
| Jump attack | Flying kick | Diving elbow |
| Special | **Star Dash**: lunges forward, hitting everything in the path | **Comet Beam**: an energy blast that flies across the screen |

**Tag (Space):** swap heroes. The incoming hero enters with a **tag-in strike**, a short burst
around them, and is briefly invulnerable. The benched hero regenerates health. If the active hero
is knocked out, the partner swaps in automatically. If both are down, it's game over. Tagging has
a short cooldown, so it can't be spammed.

## Enemies

| | Voidling | Brute |
|---|---|---|
| Role | Swarm grunt | Tank |
| Health | Low | High |
| Speed | Medium | Slow |
| Attack | Quick swipe after a short wind-up | Overhead smash after a long wind-up; knocks you down |

- **Wind-ups are visible:** the attacker flashes and pulls back first. Every hit you take should
  feel avoidable.
- **Attack tokens:** at most 2 enemies attack at once. The rest circle at a distance. This is the
  genre's oldest fairness trick, and it keeps crowds readable.

## Combat rules

- **Combo:** press attack during an attack to chain the next hit (buffered). Each attack hits each
  target once.
- **Hitstop:** the game freezes for a few frames on every hit; finishers freeze longer. This is
  most of the "weight".
- **Hit-stun, knockback, knockdown:** finishers knock down. A downed enemy can't be hit until it
  gets up, so no infinite juggles in the prototype.
- **Depth:** the floor has depth (up/down moves you towards or away from the camera). Attacks only
  connect within a small depth band, as in classic brawlers.
- **Damage feedback:** a white flash on the target, hit sparks, screen shake on finishers.

## Stage and camera

- Stage 1 is ~3 screens long. Each **wave zone** locks the camera until the wave is cleared, then
  **GO →** flashes and the camera follows you again.
- Enemies enter from the screen edges. The last zone is the final arena; clearing it is
  **STAGE CLEAR**.
- Setting: a neon space-station boulevard. Starfield and ringed planet in parallax, station
  silhouettes with lit windows, and a perspective grid floor.

## Presentation

- **Retro:** the game renders at **480 × 270** and scales up in whole steps with no smoothing, so
  pixels stay chunky and crisp.
- **Modern:**
  - the HUD (health bars, score, prompts) is drawn at full screen resolution, so it's sharp
  - motion-smear arcs on attacks
  - particles
  - smooth, high-frame-rate animation
- **Characters** are a code-drawn "rig": head, torso and two-segment limbs, posed per action
  (idle, walk, punch, kick, jump, hurt, knockdown). A dark outline gives the pixel-art look. One
  rig serves heroes and enemies, scaled and styled differently. Heroes stand about 54 px, a fifth
  of the screen height.

## Controls

| Input | Action |
|---|---|
| Arrows / WASD | Move (up/down = depth) |
| J or Z | Attack (tap again to combo) |
| K or X | Jump (attack in the air for a jump attack) |
| L or C | Special |
| Space | Tag partner |
| P / Esc | Pause |
| Q | Quit to the arcade (while paused, or on game over) |
| M | Sound on/off |
| Enter | Start / retry |

## Prototype scope (B1)

In: two heroes with tag, combo, jump, specials, two enemy types, one stage with three wave
zones, HUD, pause, game over, retry, stage clear, sound, tests.

Out (see `TODO.md → B2`): pickups and breakables, a boss, a ranged enemy, grabs and throws,
more stages, co-op, a hero colour picker, gamepad, a hero select screen.

## Tech

- Same rules as the rest of the arcade: vanilla JS, Canvas 2D, Web Audio, no assets.
- Game logic (`src/brawler/game.js` and the modules it uses) has no DOM access, so a headless
  bot can play it in tests. `main.js` wires up the DOM, the loop, input and rendering.
- Units are pixels in the 480 × 270 world: `x` along the stage, `z` floor depth, `h` height above
  the floor. Screen y = `z − h`. Draw order is sorted by `z`.
