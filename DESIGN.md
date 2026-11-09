# Neon Arcade — Design

*Working title. A small browser arcade of original games that share one toolkit, each with
its own look. v0.2, 2026-11-09.*

## Games

| Game | Genre | Status | Design doc |
|---|---|---|---|
| **Neon Chomp** | Maze-chase | v1 built; needs playtest + tuning | [DESIGN-CHOMP.md](DESIGN-CHOMP.md) |
| **Borough Brawl** | Side-scrolling tag-team street brawler (New York) | Prototype (B1 + B1.5) | [DESIGN-BRAWLER.md](DESIGN-BRAWLER.md) |

Both names are working titles.

## Shared goals

1. **Feel first.** Controls must be responsive and every hit or catch must read clearly before
   anything gets prettier.
2. **Retro look, modern feel.** Arcade-era visuals on top. Underneath: input buffering,
   hitstop, particles, enemies that signal their attacks, quick restarts.
3. **Original.** Genres and mechanics are borrowed openly. Characters, names, art, levels and
   music are always our own. No Pac-Man, Marvel or TMNT characters or looks.
4. **Each game has its own look.** Neon Chomp is glowing neon vectors; Borough Brawl is pixel-art
   New York at dusk. They share code, not a style.
5. **No dependencies, no assets.** Vanilla JS, Canvas 2D, Web Audio. Art is drawn in code;
   sound is synthesised.
6. **Small and finished** beats big and half-built.

## Structure

```
index.html            arcade home screen: pick a game
style.css             shared styles (home, menus)
chomp/index.html      Neon Chomp page
brawler/index.html    Borough Brawl page
src/
  shared/             code used by more than one game (sound synth, saved settings, controllers)
  chomp/              Neon Chomp modules
  brawler/            Borough Brawl modules
tests/
  sim.mjs             Neon Chomp logic, headless
  e2e.mjs             Neon Chomp in real Chrome
  brawler-sim.mjs     Borough Brawl logic, headless (a bot plays the stage)
  brawler-e2e.mjs     Borough Brawl + home screen in real Chrome
  gamepad-e2e.mjs     PS5 + Xbox controllers, via a virtual pad
  cdp.mjs             tiny Chrome DevTools driver used by the e2e files
```

Each game is its own page. Moving between games is a normal link, so each game starts clean,
keeps its own state, and a bug in one can't break the other.

**Rule of two:** code moves into `src/shared/` only when both games actually use it. Today that's
the sound synth (tones, noise, arpeggios) and the saved-settings wrapper. Each game keeps its own sound list, input, effects and
rendering, because they work in different units (tiles vs pixels) and have different needs.

## Controllers

`src/shared/gamepad.js` reads the browser Gamepad API. Chrome reports a PS5 DualSense (Mac) and an
Xbox controller (PC) in the same "standard" layout, so buttons are mapped by **position** (south,
west, north, east, R1, R2, Options/Menu, Create/View) and only the **labels** change: ✕□△○ for
PlayStation, AXYB for Xbox. Keyboard and controller work at the same time. Each game maps
positions to actions in its own input module.

## Platform

Browser first; it must run from any static server or GitHub Pages. The **Windows app is
paused** (2026-11-09). When it resumes, Tauri is the preferred wrapper. The options and the
decisions it needs are in `TODO.md → Later`.
