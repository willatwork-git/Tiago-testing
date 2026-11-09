# Borough Brawl — Design

*Working title (was "Nebula Knockout" until the setting moved to New York). Side-scrolling
tag-team beat 'em up. v0.3, 2026-11-09.*

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

**Goal:** an enormous, laid-back elven shark knight who looks intimidating just standing around,
and who is recognisable from his silhouette alone. References:
- the kids' concept art (`temp-concepts/shark-warrior.png`) for the character
- Marvel Cosmic Invasion for the comic-book pixel treatment

He has his own renderer, `src/brawler/razorfin.js`. It is **presentation only**: `def.scale` still
drives reach and collision, and every exaggerated proportion lives in the drawing code (drawn ~12%
larger than his hitbox).

**Three-quarter view.** Like brawler sprites and the concept, he is drawn with his chest turned
towards the camera:
- the shoulders sit at the edges of a V-shaped torso
- the near arm hangs in front of the body and the far arm behind it, both clear of the narrow waist
- the head is in profile on top

Pure profile (the shared rig) turned his bulk into a blob.

| Concept art | In game |
|---|---|
| Huge, laid-back, intimidating | Barrel chest tapering sharply to the waist; shoulders dropped, slight hunch, chin down; slow breathing |
| Massive bare arms, heavy hands | Upper arms about the size of his head; forearms that thicken to the wrist; big clawed hands. The free arm hangs to his boots with a gap from the body |
| Short legs, little pointed boots | Legs at ~60% of a normal stride; small curled gold elven boots; both feet solved onto the road every frame |
| Shark head, toothy grin, dorsal fin | Heavy brow shading the eye, broad white jaw into the throat, four big triangular teeth, gill slits, two-tone fin |
| Silver leaf armour, gold filigree | Built from big shapes: two overlapping silver leaf plates meeting in a V, a near and a far pauldron, dark seams, thin gold edges, small bright highlights; a pointed silver bracer |
| Green tabard over chainmail | One deep-green cloth panel with a gold edge, a belt with a gold buckle, the pale belly showing between plate and belt |
| Long ornate sword | Tapered blade with a bright edge and fuller, gold crossguard with a green gem |

**Detail by size.** Fine engraving on the plates and chainmail under the tabard appear only in the
larger title treatment (`detail`), where players can see them. At gameplay size they'd be noise.

**His own poses** (`RAZORFIN_POSES`, `razorfinWalk`):
- **Title:** centre stage, ~30% larger, three-quarter, near hand resting on his planted sword,
  far arm hanging.
- **Idle:** dropped shoulders, free arm hanging, sword carried low so his face and chest stay
  visible.
- **Walk:** short, heavy steps. The whole body dips on each footfall and the free arm swings.
- **Cleave:** three distinct beats. Blade raised (startup), full-body swing (active), and a low
  follow-through into the road (recovery, via the move's `followPose`).
- **Shark Rush:** the armoured shoulder leads (a bigger pauldron, pushed forward), head tucked,
  sword trailing. Speed lines instead of a slash arc.
- **Slash smears** follow his real blade: the arc runs from the sword tip in the wind-up pose to
  the tip in the swing pose, around his shoulder (`razorfinSword()`).

If the kids want to go further, they could draw him as a pixel sprite sheet (see TODO B2).

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

## Art direction: detailed pixel-art New York, late afternoon

**Reference:** the look of modern pixel-art brawlers (Marvel Cosmic Invasion, Shredder's Revenge):
- big, muscular, cel-shaded characters with dark outlines
- detailed, weathered city backdrops
- punchy comic-book hit effects

Our own characters, buildings and signs throughout. Deliberately unlike Neon Chomp: no neon
glow, no vector look.

**Characters:**
- About **a third of the screen tall** (scale ~1.5; Bruisers ~1.75).
- Every body part is a **solid tapered shape**:
  - a shaped torso (shoulders, chest, waist, hips)
  - upper arms, forearms and fists
  - thighs, shins and boots
  - a neck and a head with a profile face
- **Three-tone cel shading** from one light at the upper left: a lavender-leaning shadow, the
  base colour, and a highlight.
- A dark **outline** under everything.
- **Outfit detail per character:** armour trim, jacket zips and studs, tank-top straps, chains,
  belts, visors, scarves.
- **Gang variants** (jacket, hair and skin colours), so a wave isn't a row of clones.

**Backdrop:**
- **Sky:** a late-afternoon gradient with pixel clouds, and a hazy distant skyline.
- **The block** (stone, brick and brownstone fronts):
  - per-brick colour, cornices with dentils, weather streaks
  - recessed windows with reflections, curtains and AC units
  - fire escapes casting shadows, roof water towers
- **Ground floors:** shop signs, striped awnings, glass shopfronts with shelves and
  reflections, roll-down shutters with graffiti, doors, posters.
- **Sidewalk:** slabs in perspective with cracks; trees, planters, benches, news boxes,
  hydrants, trash cans and lamps.
- **The road** (where you fight): aggregate texture, patches and tar seams, a faded double
  yellow, cracks, potholes with rubble, crosswalks, steaming manholes.

**Feedback:**
- comic **impact bursts** on hits
- floating **damage numbers**
- a **×N HITS** combo counter
- **speed lines** behind running attacks and dives

**Pixel edges:** fighters and effects go on their own layer, and its edges are snapped fully on
or off. Combined with whole-step scaling and no smoothing, they read as pixel art.

**HUD:** chunky arcade style. Bold type with a hard drop shadow, boxed panels and segmented bars.

**Honest limit:** the reference games are hand-drawn by professional pixel artists. Ours are drawn
in code, which gets the size, shading and detail close but not hand-painted. The next step up is
hand-drawn sprite sheets (see TODO B2).

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

**Controller (PS5 / Xbox):** stick or d-pad move · hold R2/RT run (or double-tap) · □/X attack ·
✕/A jump · △/Y special · R1/RB or ○/B tag · Options/Menu pause · Create/View back to arcade
(paused). Rumble on hits taken, finishers, the Depth Charge shockwave and a hero KO.

## Tech

- Same rules as the arcade: vanilla JS, Canvas 2D, Web Audio, no asset files.
- Game logic (`src/brawler/game.js` and the data it uses) has no DOM access, so a headless bot can
  play it in tests. `main.js` wires up the DOM, the loop, input and rendering.
- Units are pixels in the 480 × 270 world: `x` along the street, `z` depth on the road, `h` height.
  Screen y = `z − h`. Draw order is sorted by `z`.
- The street, road and skyline are pre-drawn once from a seeded random generator, so the block
  looks the same every visit.
