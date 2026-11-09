# Neon Chomp design and playability review

The board already looks like a cohesive neon arcade game. The violet tubes give the maze a clear outline, the four Glitch silhouettes are recognisable in motion, and removing a line of pellets as you pass through it gives a satisfying sense of progress. Buffered turns and immediate reversals are good foundations for a maze chase.

The biggest improvement would be to make the first run easier to understand and the next run faster to start. The title screen gives body and glow colours most of its space. Once the game starts, the important decisions are harder to read. You can spend a power cell before touching a movement key, you have to infer how long it will last, and a lost run sends you back through the menu. I'd fix that flow and the tunnel collision before taking on dash and combo.

## Fix first

### 1. Put Play first and let keyboard controls behave like controls

**Reproduced in the browser.** Space did nothing on a focused Hard option or on the “match body” checkbox. Right Arrow on Normal didn't select Hard. Enter on a focused Lemon swatch launched the game with the previous colour. The nine glow inputs were still in the tab order while “match body” was checked. At 844 × 390, the Hard menu had 392 px of content in a 224 px scroll area. The Play button was about 49 px below the visible panel.

**Change.** Put **Play** and **Normal / Hard** together in the first view. Keep the colour options under **Customise**, with a stationary preview beside the swatches so a player can compare body and glow even when the title parade has left the screen. When glow matches the body, collapse or disable its controls. Use native radio groups for the exclusive choices. Scope the gameplay shortcuts to the game so Space, Enter and arrows work on focused menu controls.

**Check.** At 844 × 390, Play and the movement hint are visible on entry. Using Tab, arrows and Space, a player can select a difficulty, change a colour and start. Enter on a swatch leaves the player in the menu. Returning to the menu restores focus to Play. [Title markup](../index.html#L12) · [Menu layout](../style.css#L27) · [Keyboard handling](../src/input.js#L10) · [Menu controls](../src/ui.js#L51)

### 2. Give players control over the start and respawn

**Reproduced in a fixed-step check.** With zero directional input, the player starts left after READY, collects eight pellets and the bottom-left power cell, and stops at the wall with 130 points. On the Normal run’s opening power cell pickup, only two Glitches had left the house or were on their way out. The opening cell is a good teaching opportunity, but the automatic route can spend it before the player makes a decision. A separate check showed that a blur during READY still allows the countdown to advance into play.

**Change.** Place the first prompt near the player with “Arrow keys or WASD to move”. Start the chase and the release timers on the first valid direction. Use the same deliberate start after a lost life, when the player needs a moment to find their position. Freeze countdowns and play when the window loses focus, and require an explicit resume.

**Check.** With no movement input, the opening board and score stay put. Switching away during READY or a life transition keeps the run safe. The first valid direction starts movement in the requested direction. [Spawn and layout](../src/maze.js#L41) · [Initial player direction](../src/player.js#L4) · [READY, death and blur](../src/main.js#L174)

### 3. Make the wrap tunnel behave like one continuous corridor

**Reproduced with a targeted collision check.** On the tunnel row, put the player at x = 20.85 and an active Glitch at x = 0.10. Through the wrap they are 0.25 tiles apart, inside the 0.55-tile hit radius. The collision misses because it measures the direct difference between the two x positions. The same spacing on a continuous stretch registers a hit.

**Change.** Measure the shortest horizontal separation across the seam when both actors are in the wrap corridor. Give the two exits matching visual markers. Draw the crossing silhouette at both edges when it straddles the seam so players can see the contact they're about to make.

**Check.** In both directions, a normal Glitch can hit the player at the seam, and an edible Glitch awards points there. Reversing during a crossing keeps the visual position and the collision in sync. [Tunnel layout](../src/maze.js#L17) · [Position and reversal](../src/entity.js#L19) · [Collision](../src/main.js#L142)

### 4. Give Overcharge a clear start, duration and end

**Observed in the browser.** Taking a power cell changed the Glitches' colour and faces, but the player and HUD gave no time or status cue. The frightened faces are a useful second signal, although they're small when you're reading the next junction. From the configuration, Hard level 1 gives 3.6 seconds of Overcharge and uses the final 2 seconds for flashing. By Hard level 6, the full window is only 1.8 seconds, so the warning starts as soon as the cell is picked up.

**Change.** Add a slim, labelled **OVERCHARGE** bar and a crisp outline around the player while it's active. Keep the Glitch shapes and frightened faces. Use a short proportional warning at the end, such as the final quarter of the bar, with a steady outline or icon for reduced effects. Introduce the rule in one line on the first run or in How to play. “Big cells let you eat Glitches.” Give each catch a brief score pop-up so the 200 → 400 → 800 → 1,600 chain is learnable.

**Check.** A player can tell whether Overcharge is active or nearly spent at a glance, on both difficulties and with animation reduced. Pausing freezes the meter. [Power timings](../src/config.js#L10) · [Power and chain scoring](../src/main.js#L109) · [Frightened rendering](../src/render.js#L241)

## Make the run easier to read and replay

| Area | What I found | Recommended change |
| --- | --- | --- |
| **Visual hierarchy** | The purple outline is distinctive. Its continuous white core and glow can draw the eye before the small moving actors, especially on a full board. | Bring down the wall core and bloom a step. Keep hard edges on the player and Glitches, and give the player a consistent outline across custom colours. Compare a busy board at the compact viewport and in greyscale. Keep the neon title treatment. |
| **Progress and lives** | Score, best and level are visible. The HUD shows spare lives as icons, so a new three-life run opens with two icons. Near the end of a level, a lone pellet can be hard to spot against the maze. | Use a labelled lives count that includes the current life. Show remaining pellets when the board gets sparse and give the final few a restrained outline. Replace the level-clear flash with a clear “Level 1 cleared” acknowledgement and a short next-level cue. |
| **Pause and retry** | P and Esc worked for pause. The overlay is canvas text. Game Over puts the result in the top HUD and “Enter for menu” below the maze. The faded player reappears at the collision point when Game Over draws. | Use the same real HTML panel pattern as the title. Put **Resume** first when paused and **Retry** first at Game Over. Show score, best and level in the results panel, with **Menu** as the secondary action. Preserve difficulty and colours on retry, and carry the death pose or fade through to the results. |
| **Best-score persistence** | A fixed-step check reached a displayed best of 130 with no saved value. Pause then Q wrote 130. A refresh before an end-of-run, clear or quit save can lose a record the HUD has already shown. | Persist new records during the run with a coalesced write. Test refreshing mid-run after setting a best, then switching difficulties to confirm the records stay separate. |

[Palette and wall drawing](../src/render.js#L8) · [HUD and overlays](../src/render.js#L320) · [Score updates and save points](../src/main.js#L73)

## Playtest before tuning the roadmap

- **Check junction timing first.** The buffer took an early turn in the browser. Code allows a perpendicular turn at tile centres, so a just-late press can carry to a later junction. Have a first-time player repeat one specific turn and ask where they expected to go. If just-late turns account for repeated misses, try a small timing grace window and compare the same corner before and after.
- **Watch the last 10 pellets on both difficulties.** Hard's base Glitch speed equals the player's at level 2 and exceeds it at level 3. The final chase phase also runs indefinitely, starting after 49.5 seconds on Hard and 59 on Normal on the chase/scatter clock, which stops during Overcharge. This could turn cleanup into an extended chase once cells are spent. Watch completion time and the locations of the last deaths before changing speed. If cleanup repeatedly stalls, test a brief breather and see whether that resolves it.
- **Give dash a job.** Once the tunnel and turn timing are dependable, prototype dash as a deliberate escape or route commitment with a readable cooldown. Make its wall, pellet and Glitch interactions clear before adding speed. Test whether players choose a moment to dash. Add combo after that choice is interesting, since rewarding uninterrupted pellet chains could push players away from deliberate evasive turns.
- **Use sound to explain events.** Start with distinct, short sounds for a cell pickup, Overcharge expiring, a Glitch catch and life loss. Pair those sounds with visual cues and give players a mute control. Add decorative effects after the events read clearly with sound off.

[Player movement](../src/player.js#L10) · [Difficulty and chase timers](../src/config.js#L10) · [Planned features](../TODO.md#L35)

## Review scope

I used a localhost copy of the current build in a desktop browser, with a compact viewport check. I tried mouse and keyboard menu controls, settings persistence, both difficulties, directional buffering, Overcharge, pause, life loss and Game Over. Targeted simulation checks covered the idle opening, focus loss during READY, the tunnel seam, score saving and the last-pellet transition. The current maze had 191 reachable pickups, including the four power cells. Manual play covered the opening and a run to Game Over. Level-clear verification used an isolated last-pellet check. The difficulty and roadmap suggestions need broader playtesting. The review follows the current desktop scope.
