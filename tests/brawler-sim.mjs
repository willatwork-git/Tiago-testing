// Headless checks for Nebula Knockout: a simple bot plays stage 1.
//   node tests/brawler-sim.mjs
//
// 1. Progression: with heroes kept at full health ("god mode"), the bot must always clear the
//    stage. This proves waves spawn, camera locks/unlocks, and the stage can end.
// 2. Honest runs: the bot plays for real. We report its clear rate (a rough difficulty signal),
//    and every run must keep the invariants.
// Invariants checked every step: no NaN, fighters on the floor band, hero inside the camera,
// at most CONFIG.attackTokens enemies holding attack tokens.

import { createGame, update, activeHero, partnerHero } from '../src/brawler/game.js';
import { CONFIG, FLOOR, W } from '../src/brawler/config.js';

const DT = 1 / 60;
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL', msg); } return ok; };

function bot(g, step) {
  const h = activeHero(g);
  const ctl = { x: 0, z: 0, attack: false, jump: false, special: false, tag: false };
  const foes = g.enemies.filter((e) => e.state !== 'ko');
  if (!foes.length) { ctl.x = 1; return ctl; } // walk on to the next zone

  const near = foes.reduce((a, b) => (Math.hypot(a.x - h.x, (a.z - h.z) * 2) < Math.hypot(b.x - h.x, (b.z - h.z) * 2) ? a : b));
  const dx = near.x - h.x;
  const dz = near.z - h.z;
  if (Math.abs(dx) > 26) ctl.x = Math.sign(dx);
  else if (Math.abs(dx) < 10) ctl.x = -Math.sign(dx || 1);
  if (Math.abs(dz) > 4) ctl.z = Math.sign(dz);

  const threatened = foes.some((e) => e.state === 'windup' && Math.abs(e.x - h.x) < 50 && Math.abs(e.z - h.z) < 14 && e.t > e.def.attack.windup * 0.5);
  if (threatened && step % 2 === 0) ctl.jump = true;
  if (Math.abs(dx) <= 32 && Math.abs(dz) <= 8 && step % 4 === 0) {
    ctl.x = Math.sign(dx || 1);
    ctl.attack = true;
    if (foes.filter((e) => Math.abs(e.x - h.x) < 60).length >= 2) ctl.special = true;
  }
  if (h.hp < h.maxHp * 0.35 && partnerHero(g).hp > partnerHero(g).maxHp * 0.6) ctl.tag = true;
  return ctl;
}

function invariants(g, label) {
  for (const f of [...g.heroes, ...g.enemies]) {
    for (const k of ['x', 'z', 'h', 'vx', 'vz', 'vh', 'hp']) {
      if (!check(Number.isFinite(f[k]), `${label}: ${f.def.id}.${k} = ${f[k]}`)) return false;
    }
    if (!check(f.z >= FLOOR.top - 0.01 && f.z <= FLOOR.bottom + 0.01, `${label}: ${f.def.id} off the floor z=${f.z}`)) return false;
  }
  const h = activeHero(g);
  if (!check(h.x >= g.camX + 13.9 && h.x <= g.camX + W - 13.9, `${label}: hero outside camera`)) return false;
  return check(g.enemies.filter((e) => e.token).length <= CONFIG.attackTokens, `${label}: too many attackers`);
}

function run({ god, maxTime = 300 }, label) {
  const g = createGame();
  const seen = { zones: new Set(), hits: 0, heroHits: 0, tags: 0, beams: 0, kos: 0 };
  for (let step = 0; step < maxTime / DT; step++) {
    update(g, DT, bot(g, step));
    if (god) for (const h of g.heroes) h.hp = h.maxHp;
    for (const ev of g.events) {
      if (ev.type === 'hit') ev.toHero ? seen.heroHits++ : seen.hits++;
      if (ev.type === 'tag') seen.tags++;
      if (ev.type === 'beam') seen.beams++;
      if (ev.type === 'ko' && ev.side === 'enemy') seen.kos++;
    }
    g.events = [];
    if (g.lock !== null) seen.zones.add(g.zoneIndex);
    if (!invariants(g, label)) break;
    if (g.state === 'stageClear' || g.state === 'gameOver') break;
  }
  return { g, seen };
}

// 1. Progression (god mode)
const totalEnemies = createGame().stage.zones.flatMap((z) => z.waves.flat()).length;
for (let i = 0; i < 3; i++) {
  const { g, seen } = run({ god: true }, `god ${i}`);
  check(g.state === 'stageClear', `god ${i}: stage not cleared (state ${g.state}, zone ${g.zoneIndex}, t=${g.time.toFixed(0)}s)`);
  check(seen.zones.size === g.stage.zones.length, `god ${i}: visited zones ${[...seen.zones]}`);
  check(seen.kos === totalEnemies, `god ${i}: ${seen.kos}/${totalEnemies} enemies KO'd`);
  if (i === 0) console.log(`god run: cleared in ${g.time.toFixed(1)} s, ${seen.hits} hits dealt, ${seen.heroHits} taken, ${seen.beams} beams, score ${g.score}`);
}

// 2. Honest runs
let clears = 0;
const RUNS = 8;
for (let i = 0; i < RUNS; i++) {
  const { g, seen } = run({ god: false }, `honest ${i}`);
  check(g.state === 'stageClear' || g.state === 'gameOver', `honest ${i}: run neither cleared nor ended (stuck?) zone ${g.zoneIndex}`);
  if (g.state === 'stageClear') clears++;
  if (i < 2) console.log(`honest run ${i}: ${g.state} at ${g.time.toFixed(1)} s, zone ${g.zoneIndex + 1}, ${seen.kos} KOs, ${seen.tags} tags, score ${g.score}`);
}
console.log(`bot clear rate: ${clears}/${RUNS} (a dumb bot — a rough difficulty signal, not a target)`);

console.log(fails ? `${fails} failures` : 'ALL OK');
process.exitCode = fails ? 1 : 0;
