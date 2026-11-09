# Neon Arcade — Design

*Working title. A small browser arcade of original neon games that share one look and one
toolkit. v0.1, 2026-11-09.*

## Games

| Game | Genre | Status | Design doc |
|---|---|---|---|
| **Neon Chomp** | Maze-chase | v1 built; needs playtest + tuning | [DESIGN-CHOMP.md](DESIGN-CHOMP.md) |
| **Nebula Knockout** | Side-scrolling tag-team beat 'em up | Prototype (B1) | [DESIGN-BRAWLER.md](DESIGN-BRAWLER.md) |

Both names are working titles.

## Shared goals

1. **Feel first.** Controls must be responsive and every hit or catch must read clearly before
   anything gets prettier.
2. **Retro look, modern feel.** Chunky pixels and neon on top. Underneath: input buffering,
   hitstop, particles, enemies that signal their attacks, quick restarts.
3. **Original.** Genres and mechanics are borrowed openly. Characters, names, art, levels and
   music are always our own. No Pac-Man, Marvel or TMNT characters or looks.
4. **No dependencies, no assets.** Vanilla JS, Canvas 2D, Web Audio. Art is drawn in code;
   sound is synthesised.
5. **Small and finished** beats big and half-built.

## Structure

```
index.html            arcade home screen: pick a game
style.css             shared styles (home, menus)
chomp/index.html      Neon Chomp page
brawler/index.html    Nebula Knockout page
src/
  shared/             code used by more than one game (sound synth)
  chomp/              Neon Chomp modules
  brawler/            Nebula Knockout modules
tests/
  sim.mjs             Neon Chomp logic, headless
  e2e.mjs             Neon Chomp in real Chrome
  brawler-sim.mjs     Nebula Knockout logic, headless (a bot plays the stage)
  brawler-e2e.mjs     Nebula Knockout + home screen in real Chrome
```

Each game is its own page. Moving between games is a normal link, so each game starts clean,
keeps its own state, and a bug in one can't break the other.

**Rule of two:** code moves into `src/shared/` only when both games actually use it. Today that's
the sound synth (tones, noise, arpeggios). Each game keeps its own sound list, input, effects and
rendering, because they work in different units (tiles vs pixels) and have different needs.

## Platform

Browser first; it must run from any static server or GitHub Pages. The **Windows app is
paused** (2026-11-09). When it resumes, Tauri is the preferred wrapper. The options and the
decisions it needs are in `TODO.md → Later`.
