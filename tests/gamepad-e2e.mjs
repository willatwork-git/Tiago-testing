// Controller checks in real (headless) Chrome, using a virtual controller injected into the page.
// It mimics what Chrome reports for a PS5 DualSense on a Mac and an Xbox controller on Windows
// (both use the "standard" button layout), so the mapping and on-screen prompts can be tested
// without a physical pad.
//
//   python3 -m http.server 8765          # in the project root, in another terminal
//   node tests/gamepad-e2e.mjs [screenshot-dir]
import { openBrowser, sleep } from './cdp.mjs';

const BASE = process.env.URL ?? 'http://localhost:8765/';
const b = await openBrowser({ out: process.argv[2], name: 'gamepad', port: 9335 });
const { ev, shot, check, waitFor } = b;

const IDS = {
  ps5: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',
  xbox: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
};
const BTN = { south: 0, east: 1, west: 2, north: 3, l1: 4, r1: 5, l2: 6, r2: 7, select: 8, start: 9, up: 12, down: 13, left: 14, right: 15 };

/** Install a fake controller on every page load from now on. */
async function plugIn(kind) {
  await b.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__rumbles = 0;
      window.__pad = { id: ${JSON.stringify(IDS[kind])}, index: 0, connected: true, mapping: 'standard', timestamp: 0,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0],
        vibrationActuator: { playEffect() { window.__rumbles++; return Promise.resolve('complete'); } } };
      Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
    `,
  });
}
const setBtn = (name, down) => ev(`(() => { const b = __pad.buttons[${BTN[name]}]; b.pressed = ${down}; b.value = ${down ? 1 : 0}; })()`);
async function press(name) {
  await setBtn(name, true);
  await sleep(90);
  await setBtn(name, false);
  await sleep(70);
}
const setStick = (x, y) => ev(`__pad.axes[0] = ${x}; __pad.axes[1] = ${y};`);
async function stick(x, y, ms) {
  await setStick(x, y);
  await sleep(ms);
  await setStick(0, 0);
}
const hero = 'game.heroes[game.active]';

await b.viewport(960, 600);

// ---------------------------------------------------------------- PS5 on a Mac
await plugIn('ps5');
await b.load(BASE);
await ev('localStorage.clear()');
await b.load(`${BASE}?debug`);
await press('south'); // the first press "wakes" the controller, as on real hardware… and plays card 1
await b.load(`${BASE}?debug`);
await sleep(200);
check(await waitFor('document.querySelector(".arcade .hint").textContent.includes("✕")', 1000), 'home: PS5 prompt shows ✕');
await press('right');
check(await ev('document.activeElement.id') === 'card-brawler', 'home: d-pad right picks Borough Brawl');
await press('south');
check(await waitFor('location.pathname.endsWith("/brawler/")', 3000), 'home: ✕ opens the game');

await b.load(`${BASE}brawler/?debug`);
check(await waitFor('pad.connected && pad.kind === "playstation"', 1000), 'brawler: DualSense recognised as PlayStation');
check(await ev('pad.label("south")') === '✕' && await ev('pad.label("r1")') === 'R1', 'brawler: prompts use ✕ / R1');
await sleep(300);
await shot('brawler-title-ps5');
await press('south');
check(await ev('app.mode') === 'play', 'brawler: ✕ starts');
check(await waitFor('game.state === "playing"', 3000), 'brawler: into the fight');

let x0 = await ev(`${hero}.x`);
await stick(1, 0, 400);
check((await ev(`${hero}.x`)) > x0 + 20, 'brawler: left stick walks');
await press('west');
check(await waitFor(`${hero}.state === "attack"`, 300), 'brawler: □ attacks');
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);
await press('south');
check(await waitFor(`${hero}.h > 5`, 400), 'brawler: ✕ jumps');
await waitFor(`${hero}.h === 0 && ${hero}.state !== "jump"`, 1500);
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);
await press('north');
check(await waitFor(`${hero}.specialCooldown > 0`, 500), 'brawler: △ special (Fin Blade)');
await waitFor(`${hero}.state === "idle" || ${hero}.state === "walk"`, 1500);

await setBtn('r2', true);
await setStick(1, 0);
check(await waitFor(`${hero}.running`, 500), 'brawler: hold R2 + stick runs');
await setStick(0, 0);
await setBtn('r2', false);

await press('r1');
check(await waitFor('game.active === 1', 600), 'brawler: R1 tags the partner');

await ev('game.events.push({ type: "quake", x: 100, y: 200 })');
check(await waitFor('__rumbles > 0', 500), 'brawler: big impacts rumble the controller');

await press('start');
check(await ev('app.paused') === true, 'brawler: Options pauses');
await shot('brawler-paused-ps5');
await press('start');
check(await ev('app.paused') === false, 'brawler: Options resumes');
await press('start');
await press('select');
check(await waitFor('location.pathname === "/"', 3000), 'brawler: Create (while paused) goes back to the arcade');

// ---------------------------------------------------------------- Xbox on a PC
const x = await openBrowser({ out: process.argv[2] && `${process.argv[2]}/xbox`, name: 'gamepad-xbox', port: 9336 });
// (a fresh browser so the PS5 injection doesn't apply)
b.finish();
const { ev: ev2, check: check2, waitFor: waitFor2, shot: shot2 } = x;
await x.viewport(960, 600);
await x.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__rumbles = 0;
    window.__pad = { id: ${JSON.stringify(IDS.xbox)}, index: 0, connected: true, mapping: 'standard', timestamp: 0,
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
    Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
  `,
});
const set2 = (name, down) => ev2(`(() => { const b = __pad.buttons[${BTN[name]}]; b.pressed = ${down}; b.value = ${down ? 1 : 0}; })()`);
async function press2(name) {
  await set2(name, true);
  await sleep(90);
  await set2(name, false);
  await sleep(70);
}

await x.load(`${BASE}chomp/?debug`);
await ev2('localStorage.clear()');
await x.load(`${BASE}chomp/?debug`);
check2(await waitFor2('pad.connected && pad.kind === "xbox"', 1000), 'chomp: Xbox controller recognised');
check2(await waitFor2('document.getElementById("controls-hint").textContent.includes("A dash")', 1000), 'chomp: menu hint shows Xbox buttons');
await press2('right');
check2(await ev2('game.difficulty') === 'hard', 'chomp: d-pad right switches to Hard');
await press2('left');
check2(await ev2('game.difficulty') === 'normal', 'chomp: d-pad left back to Normal');
await shot2('chomp-menu-xbox');
await press2('south');
check2(await ev2('game.state') === 'ready', 'chomp: A plays');
await sleep(900);
await ev2('__pad.axes[0] = -1');
check2(await waitFor2('game.state === "playing"', 800), 'chomp: stick left starts the life');
check2(await ev2('game.player.dir.x') === -1, 'chomp: …moving left');
await ev2('__pad.axes[0] = 0');
await press2('south');
check2(await waitFor2('game.player.dashCooldown > 0', 400), 'chomp: A dashes');
await press2('start');
check2(await ev2('game.state') === 'paused', 'chomp: Menu pauses');
await press2('select');
check2(await waitFor2('game.state === "title"', 500), 'chomp: View (while paused) quits to the menu');

x.finish();
