# Borough Brawl — Design

*Working title (was "Nebula Knockout" until the setting moved to New York). Side-scrolling
tag-team beat 'em up. v0.2, 2026-11-09.*

## Pitch

A New York block has been taken over by a street gang, the **Gutter Kings**. You control a
**pair of heroes** and **tag between them mid-fight**:
- **Razorfin**, a sword-swinging shark warrior designed by the kids
- **Nova**, a lightning-fast striker

The benched partner recovers health. Punch, slash, throw and dive through the gang, wave by
wave, block by block.

## Inspirations: what we take, and what we don't

| Game | We take | We don't take |
|---|---|---|
| **Marvel Cosmic Invasion** (Tribute Games, 2025) | Pick-two **tag team** with mid-fight swaps; heroes with clearly different styles | Any Marvel character, name, power set, costume or story |
| **TMNT: Shredder's Revenge** (Tribute Games, 2022) | **Retro look, modern feel**: chunky pixel art, snappy forgiving controls; **New York streets** as a setting | Turtles, Shredder, Foot Clan, any TMNT art or locations |
| **Streets of Rage 4** | Enemies **signal attacks**; weighty hits; **→→ running attacks** | Characters, art, music |
| **Final Fight** | **Street gangs**, waves that lock the screen then **GO ▶** | Characters, stages |

Our heroes, gang, setting and names are original. Razorfin comes from the kids' own concept art
(`temp-concepts/shark-warrior.png`).

## Heroes

| | Razorfin (lead) | Nova (partner) |
|---|---|---|
| Style | Heavy sword fighter | Fast striker |
| Speed | Slower, tougher (130 hp) | Quick (100 hp) |
| Combo (tap attack) | Slash, backslash, overhead cleave (the cleave knocks down) | Jab, cross, high kick (the kick knocks down) |
| Jump attack | Air slash | Flying kick |
| **Running attack (→→ + attack)** | **Shark Rush**: shoulder charge | **Star Dash**: lunging strike |
| **Special on the ground (throw)** | **Fin Blade**: a spinning steel crescent that cuts through every enemy in a line | **Star Throw**: a fast star that stops at the first enemy; short cooldown |
| **Special in the air (dive)** | **Depth Charge**: plunges sword-first; the landing sends a shockwave both ways | **Comet Dive**: a steep diving kick |

**Specials** share one cooldown per hero, shown in the HUD as SPECIAL READY.

**Tag (Space):** swap heroes. The incoming hero enters with a short strike on both sides and is
briefly invulnerable. The benched hero regenerates health. If the active hero is knocked out, the
partner swaps in automatically; if both are down, it's game over.

**Titan** (the blue heavy from the prototype) is retired for now. Razorfin took his role. He
can return when there's a hero select screen.

### Razorfin: from concept art to sprite

The concept is a detailed painting. It can't be dropped into the game as-is: an animated fighter
needs a pose for every action, and the painting has its own background and lighting. So the
design is translated into the code-drawn rig, keeping what makes him recognisable at 60 px tall:

| Concept art | In game |
|---|---|
| Shark head, long snout, toothy grin, dorsal fin | Custom head shape with snout, white jaw, a row of teeth, eye, fin |
| Massive grey arms, short legs | The widest build in the game; legs at 80% length |
| Silver leaf armour with gold trim | Silver breastplate with a gold V, silver pauldron with gold rim |
| Gold bracers and boots | Gold forearm band, gold boots |
| Green tabard over chainmail | Green tabard over the hips |
| Long ornate sword | A sword with a gold crossguard, held in the front hand and following the forearm, so every swing reads |

If the kids want to go further, they could draw him as a small pixel sprite sheet (see TODO B2).

## The Gutter Kings (enemies)

| | Punk | Bruiser |
|---|---|---|
| Look | Green mohawk, red bandana, leather jacket, jeans | Huge, shades, white tank top, gold chain |
| Role | Swarm grunt | Tank |
| Health / speed | Low / medium | High / slow |
| Attack | Quick swipe after a short wind-up | Overhead smash after a long wind-up; knocks you down |

- **Wind-ups are visible:** the attacker flashes and a **!** appears.
- **Attack tokens:** at most 2 enemies attack at once; the rest wait their turn on screen.

## Combat rules

- **Combo:** press attack during an attack to chain the next hit. One press is buffered per swing.
- **Run:** double-tap left or right and hold (or hold Shift). Attacking while running gives the
  running attack.
- **Hitstop, hit-stun, knockback, knockdown:** finishers knock down. A downed enemy can't be hit
  until it gets up.
- **Depth:** up and down move along the road towards or away from the camera. Attacks only connect
  within a small depth band. Being high in a jump dodges ground attacks.

## Stage and camera

- **Stage 1, Downtown:** about three screens of one city block. Each **wave zone** locks the camera
  until the wave is cleared, then **GO ▶** flashes. Crosswalks on the road mark the zones.
- Clearing the last zone is **BLOCK CLEARED!**

## Art direction: pixel-art New York at dusk

Deliberately unlike Neon Chomp: no neon glow and no vector look.

- **Palette:**
  - a dusk sky, purple to orange
  - brick reds and brownstone browns
  - warm lit windows and grey concrete
  - dark asphalt with a double yellow line
- **Layers:**
  - a distant skyline with art-deco spires (slow parallax)
  - the block itself, scrolling with the road:
    - brick and brownstone fronts with fire escapes and roof water towers
    - shops with signs and striped awnings (bodega, deli, laundry, pizza…)
    - stoops and graffiti
  - the sidewalk, with streetlamps, hydrants and trash cans
  - the **road**, which is the floor you fight on: lane lines, crosswalks, cracks, manholes
    with rising steam
- **Pixel edges:** fighters, projectiles and sparks are drawn to their own layer, and its edges are
  snapped to fully on or off. Combined with whole-step scaling and no smoothing, that reads as
  real pixel art.
- **HUD:** chunky arcade style. Bold type with a hard drop shadow, boxed panels and segmented
  health bars.

## Controls

| Input | Action |
|---|---|
| Arrows / WASD | Move (up/down = depth) |
| Tap → → (hold) or Shift | Run |
| J or Z | Attack (tap again to combo; while running: running attack) |
| K or X | Jump (attack in the air: jump attack) |
| L or C | Special: throw on the ground, dive in the air |
| Space | Tag partner |
| P / Esc | Pause |
| Q | Back to the arcade (paused, or at the end) |
| M | Sound on/off |
| Enter | Start / retry |

## Tech

- Same rules as the arcade: vanilla JS, Canvas 2D, Web Audio, no asset files.
- Game logic (`src/brawler/game.js` and the data it uses) has no DOM access, so a headless bot can
  play it in tests. `main.js` wires up the DOM, the loop, input and rendering.
- Units are pixels in the 480 × 270 world: `x` along the street, `z` depth on the road, `h` height.
  Screen y = `z − h`. Draw order is sorted by `z`.
- The street, road and skyline are pre-drawn once from a seeded random generator, so the block
  looks the same every visit.
