// Neon Chomp end-to-end checks in real (headless) Chrome: keyboard, menu, states, collisions.
//
//   python3 -m http.server 8765          # in the project root, in another terminal
//   node tests/e2e.mjs [screenshot-dir]
//
// Env: CHROME (path to Chrome), URL (default http://localhost:8765/chomp/).
import { openBrowser, sleep } from './cdp.mjs';

const URL = process.env.URL ?? 'http://localhost:8765/chomp/';
const b = await openBrowser({ out: process.argv[2], name: 'chomp' });
const { send, ev, key, viewport, shot, check, waitFor } = b;
const load = (q = '?debug') => b.load(URL + q);

await viewport(900, 900);
await load(); await ev('localStorage.clear()'); await load();

// ---- 1. Menu keyboard
check(await ev('document.activeElement.id') === 'play', 'Play has focus on entry');
await key('Tab');
check(await ev('document.activeElement.name') === 'difficulty', 'Tab reaches difficulty radios');
await key('ArrowRight');
check(await ev('document.querySelector("input[name=difficulty][value=hard]").checked'), 'ArrowRight selects Hard');
check(await ev('game.difficulty') === 'hard', 'game difficulty switched to hard');
await key('ArrowLeft');
check(await ev('game.difficulty') === 'normal', 'ArrowLeft back to Normal');
await ev('document.getElementById("customise").open = true');
await ev('document.querySelector("input[name=body][value=\'#fff04f\']").focus()');
await key('Enter');
check(await ev('game.state') === 'title', 'Enter on a swatch stays in the menu');
await key('Space');
check(await ev('game.colours.body') === '#fff04f', 'Space on Lemon swatch selects it');
check(await ev('game.state') === 'title', 'Space on a swatch does not start the game');
await ev('document.getElementById("glow-match").focus()');
await key('Space');
check(await ev('game.colours.matchGlow') === false, 'Space toggles "match body"');
await key('Space');
check(await ev('[...document.querySelectorAll("#glow-swatches input")].every(i => i.disabled)'), 'glow inputs disabled (out of tab order) when matched');
await shot('menu-open');

// ---- compact viewport
await viewport(844, 390); await load(); await sleep(200);
const r = await ev('(() => { const b = document.getElementById("play").getBoundingClientRect(); const m = document.getElementById("menu").getBoundingClientRect(); const h = document.querySelector(".menu > .hint").getBoundingClientRect(); return { b: b.bottom, m: m.bottom, h: h.bottom, vh: innerHeight }; })()');
check(r.b <= r.m && r.h <= r.m && r.m <= r.vh, `844×390: Play + hint visible (play ${r.b}, hint ${r.h}, menu ${r.m}, vh ${r.vh})`);
await shot('compact');
await viewport(900, 900);

// ---- 2. Start on first input; blur in READY
await load(); await key('Enter');
check(await ev('game.state') === 'ready', 'Enter on Play starts → READY');
await sleep(2500);
check(await ev('game.state') === 'ready' && await ev('game.score') === 0 && await ev('game.player.tx') === 10, 'no input for 2.5 s: still READY, score 0, player unmoved');
await shot('ready-prompt');
await ev('window.dispatchEvent(new Event("blur"))');
check(await ev('game.state') === 'paused', 'blur during READY pauses');
await key('KeyP');
check(await ev('game.state') === 'ready', 'P resumes back to READY (not into play)');
await sleep(900);
await key('ArrowUp'); // wall above spawn: not a valid start
check(await ev('game.state') === 'ready', 'a blocked direction does not start the life');
await key('ArrowRight');
check(await ev('game.state') === 'playing', 'first valid direction starts play');
check(await ev('game.player.dir.x') === 1, '...moving in the requested direction');

// ---- M6: dash, cooldown, effects, mute
const x0 = await ev('game.player.x');
await key('Space');
check(await ev('game.player.dashTime') > 0 && await ev('game.player.dashCooldown') > 3.5, 'Space starts a dash and its cooldown');
await shot('dash');
await sleep(300);
const moved = (await ev('game.player.x')) - x0;
check(moved > 3.2, `dash covers ground: ${moved.toFixed(2)} tiles in ~0.3 s (plain speed ≈ 2.3)`);
check(await ev('game.fx.particles.length') > 0, 'dash leaves particles / afterimages');
const cd = await ev('game.player.dashCooldown');
await key('Space');
check(await ev('game.player.dashTime') === 0 && await ev('game.player.dashCooldown') <= cd, 'Space during cooldown does nothing');
await key('KeyM');
check(await ev('game.muted') === true && await ev('localStorage.getItem("neonChomp.muted")') === 'true', 'M mutes and saves it');
check(await ev('game.toast && game.toast.text') === 'SOUND OFF', 'mute shows a SOUND OFF notice');
await key('KeyM');
check(await ev('game.muted') === false, 'M again unmutes');

// ---- 3. Tunnel seam collision (both directions, normal + frightened)
async function seam(px, pdir, gx, gdir, frightened) {
  return ev(`(() => {
    game.state = 'playing'; game.lives = 3;
    const p = game.player, g = game.glitches[0];
    for (const o of game.glitches) { o.state = 'house'; o.releaseAt = 1e9; }
    Object.assign(p, { tx: ${px[0]}, ty: 9, prog: ${px[1]}, dir: ${pdir}, want: ${pdir} });
    Object.assign(g, { tx: ${gx[0]}, ty: 9, prog: ${gx[1]}, dir: ${gdir}, state: 'active', releaseAt: 0, frightened: ${frightened} });
    game.frightTime = ${frightened ? 5 : 0}; game.frightTotal = 5;
    return [p.x, g.x];
  })()`);
}
const R = '{x:1,y:0}', L = '{x:-1,y:0}';
let pos = await seam([20, 0.85], R, [0, 0.1], R, false);
check(await waitFor('game.state === "dying"', 300), `seam hit, player right edge (${pos.map(v => v.toFixed(2))}) → dying`);
await ev('game.state = "playing"');
await key('ArrowLeft'); // the held direction is what the game reads each step
pos = await seam([0, 0.3], L, [20, 0.4], R, true);
check(await waitFor('game.glitches[0].state === "eaten" && game.popups.length >= 1', 300), `seam catch, player left edge (${pos.map(v => v.toFixed(2))}) → Glitch eaten + popup`);
await shot('seam');

// ---- 4. Overcharge bar visible in a screenshot
await ev('game.state = "playing"; game.frightTime = 4; game.frightTotal = 5; for (const g of game.glitches) { g.state = "active"; g.frightened = true; g.tx = 10; g.ty = 7 + 0; } game.player.tx = 10; game.player.ty = 15;');
await sleep(100); await shot('overcharge'); await key('KeyP');
const ft1 = await ev('game.frightTime'); await sleep(500);
check(await ev('game.frightTime') === ft1, 'pausing freezes the Overcharge meter');
await key('KeyP');

// ---- best score persists on pagehide
await ev('game.score = 0; game.high = 0; game.popups = []; game.score += 1230; game.high = 1230; window.dispatchEvent(new Event("pagehide"))');
check(await ev('localStorage.getItem("neonChomp.high.normal")') === '1230', 'best score saved on pagehide');
await load();
check(await ev('game.high') === 1230, 'best score survives a reload');

// ---- game over → retry
await key('Enter'); await sleep(900); await key('ArrowLeft');
await ev('game.lives = 1; const g = game.glitches[0]; Object.assign(g, {tx: game.player.tx, ty: game.player.ty, prog: 0, state: "active", frightened: false});');
await sleep(3200);
check(await ev('game.state') === 'gameOver', 'last life lost → game over');
await shot('gameover');
await key('Enter');
check(await ev('game.state') === 'ready' && await ev('game.lives') === 3, 'Enter on game over → retry (READY, lives reset)');
// Q from pause → menu with Play focused
await ev('window.dispatchEvent(new Event("blur"))'); await key('KeyQ');
check(await ev('game.state') === 'title' && await ev('document.activeElement.id') === 'play', 'Q from pause → menu, Play focused');

b.finish();
