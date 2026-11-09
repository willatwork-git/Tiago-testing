// Arcade home + Nebula Knockout end-to-end checks in real (headless) Chrome.
//
//   python3 -m http.server 8765          # in the project root, in another terminal
//   node tests/brawler-e2e.mjs [screenshot-dir]
//
// Env: CHROME (path to Chrome), URL (default http://localhost:8765/ — the arcade root).
import { openBrowser, sleep } from './cdp.mjs';

const BASE = process.env.URL ?? 'http://localhost:8765/';
const b = await openBrowser({ out: process.argv[2], name: 'brawler', port: 9334 });
const { ev, key, hold, shot, check, waitFor } = b;
const hero = 'game.heroes[game.active]';

await b.viewport(960, 600);

// ---- Arcade home
await b.load(BASE);
await ev('localStorage.clear()');
await b.load(BASE);
check(await ev('document.querySelectorAll(".card").length') === 2, 'home lists two games');
check(await ev('document.activeElement.id') === 'card-chomp', 'first card has focus');
await key('ArrowRight');
check(await ev('document.activeElement.id') === 'card-brawler', 'ArrowRight moves to Nebula Knockout');
await sleep(300);
await shot('home');
await key('Enter');
check(await waitFor('location.pathname.endsWith("/brawler/")', 3000), 'Enter on the card opens the brawler');

// ---- Title
await b.load(`${BASE}brawler/?debug`);
check(await ev('app.mode') === 'title', 'brawler opens on its title screen');
check(await ev('!document.getElementById("back").hidden'), '"← Arcade" link shown on the title');
await shot('title');
await key('Enter');
check(await ev('app.mode') === 'play' && await ev('game.state') === 'intro', 'Enter starts: stage intro');
check(await ev('document.getElementById("back").hidden'), 'arcade link hidden during the fight');
check(await waitFor('game.state === "playing"', 3000), 'intro hands over to play');
check(await waitFor('game.enemies.length === 3', 500), 'zone 1 spawns its first wave (3 Voidlings)');

// ---- Controls
let x0 = await ev(`${hero}.x`);
await hold('KeyD', 400);
check((await ev(`${hero}.x`)) > x0 + 20, 'holding D walks right');
x0 = await ev(`${hero}.z`);
await hold('ArrowDown', 300);
check((await ev(`${hero}.z`)) > x0 + 8, 'holding ↓ moves towards the camera (depth)');

await key('KeyJ');
check(await waitFor(`${hero}.state === "attack"`, 300), 'J attacks');
await key('KeyJ');
await key('KeyJ');
check(await waitFor(`${hero}.combo === 2`, 1200), 'tapping J chains Nova\'s 3-hit combo');
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);

await key('KeyK');
check(await waitFor(`${hero}.h > 5`, 400), 'K jumps');
await waitFor(`${hero}.h === 0`, 1500);

// A guaranteed hit: put a Voidling right in front and attack.
await ev(`(() => { const h = ${hero}; game.enemies.forEach(e => { e.attackCooldown = 99; e.token = false; });
  const e = game.enemies[0]; Object.assign(e, { x: h.x + 18 * h.facing, z: h.z, h: 0, state: 'idle', vx: 0, vz: 0 }); window.__target = e; })()`);
await key('KeyJ');
check(await waitFor('__target.hp < __target.maxHp', 800), 'a jab in range damages the enemy');
await sleep(400);
await shot('fight');

await key('KeyL');
check(await waitFor(`${hero}.specialCooldown > 0`, 400), 'L fires Nova\'s special (Star Dash)');
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);

await key('Space');
check(await waitFor('game.active === 1', 500), 'Space tags in Titan');
check(await ev(`${hero}.move && ${hero}.move.pose`) === 'tagIn', 'Titan enters with the tag-in strike');
check(await ev('game.tagCooldown') > 0, 'tag goes on cooldown');
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);
await key('KeyL');
check(await waitFor('game.projectiles.length > 0', 800), 'L fires Titan\'s Comet Beam');
await sleep(120);
await shot('beam');

// ---- Pause, mute
await key('KeyP');
check(await ev('app.paused') === true && await ev('!document.getElementById("back").hidden'), 'P pauses and shows the arcade link');
const t0 = await ev('game.time');
await sleep(300);
check(await ev('game.time') === t0, 'the fight is frozen while paused');
await shot('paused');
await key('KeyP');
check(await ev('app.paused') === false, 'P resumes');
await key('KeyM');
check(await ev('localStorage.getItem("nebulaKnockout.muted")') === 'true', 'M mutes and saves it');
await key('KeyM');

// ---- Game over → retry
await ev(`(() => { game.heroes.forEach(h => { h.hp = 0; }); const h = ${hero}; h.state = 'ko'; h.t = 1; })()`);
check(await waitFor('game.state === "gameOver"', 1000), 'both heroes down → game over');
await sleep(1700);
await shot('gameover');
check(await ev('!document.getElementById("back").hidden'), 'arcade link shown on game over');
await key('Enter');
check(await waitFor('game.state === "intro" && game.heroes.every(h => h.hp === h.maxHp)', 1000), 'Enter retries with fresh heroes');

// ---- Stage clear → best score → back to arcade
await waitFor('game.state === "playing"', 3000);
await ev(`(() => { const z = game.stage.zones; game.zoneIndex = z.length - 1; game.lock = game.camX;
  game.waveIndex = z[z.length - 1].waves.length - 1; game.enemies = []; game.score = 1234; })()`);
check(await waitFor('game.state === "stageClear"', 3000), 'clearing the last wave clears the stage');
check(await waitFor('Number(localStorage.getItem("nebulaKnockout.best")) >= 1234', 1000), 'best score saved on stage clear');
await sleep(1700);
await shot('clear');
await key('KeyQ');
check(await waitFor('location.pathname === "/"', 3000), 'Q goes back to the arcade home');
check(await waitFor('document.getElementById("best-brawler").textContent.includes("2234")', 1500), 'home shows the brawler best score');

b.finish();
