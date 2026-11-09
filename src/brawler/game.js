// Borough Brawl game logic. No DOM: this runs headless in tests.
//
//   const g = createGame();
//   update(g, dt, controls);   // controls: { x, z: -1..1, run: held, attack, jump, special, tag: pressed this step }
//   g.events                   // what happened, for sound/effects; the caller drains it
//
// States: intro → playing → stageClear | gameOver

import { W, FLOOR, CONFIG } from './config.js';
import { HEROES, ENEMIES, TAG_STRIKE, LAND_RECOVER, createFighter } from './fighters.js';
import { STAGES } from './stage.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const INTRO_TIME = 1.4;

export const NO_INPUT = { x: 0, z: 0, run: false, attack: false, jump: false, special: false, tag: false };
const RUN_SPEED = 1.9; // × walk speed

export function createGame(stageIndex = 0) {
  const zMid = (FLOOR.top + FLOOR.bottom) / 2;
  return {
    state: 'intro',
    stateTime: 0,
    time: 0,
    stage: STAGES[stageIndex],
    heroes: [createFighter(HEROES.shark, 'hero', 90, zMid), createFighter(HEROES.nova, 'hero', 90, zMid)],
    active: 0,
    tagCooldown: 0,
    enemies: [],
    projectiles: [],
    camX: 0,
    lock: null, // camera x while a wave zone is active
    zoneIndex: 0,
    waveIndex: 0,
    waveTimer: 0,
    score: 0,
    hitstop: 0,
    chain: 0, // hits in a row without a long gap (the ×N counter)
    chainTime: 0,
    chainPop: 0, // > 0 just after the counter goes up, for a little bounce
    go: 0, // > 0 while the GO → prompt shows
    events: [],
  };
}

export const activeHero = (g) => g.heroes[g.active];
export const partnerHero = (g) => g.heroes[1 - g.active];

function emit(g, type, data = {}) {
  g.events.push({ type, ...data });
}

function setState(f, state) {
  f.state = state;
  f.t = 0;
}

/** Which phase of its move a fighter is in: startup, active, recovery or done. */
export function phaseOf(f) {
  const m = f.move;
  if (!m) return null;
  if (f.t < m.startup) return 'startup';
  if (f.t < m.startup + m.active) return 'active';
  if (f.t < m.startup + m.active + m.recovery) return 'recovery';
  return 'done';
}

function startMove(g, f, move) {
  f.move = move;
  f.hits.clear();
  f.queued = false;
  f.fired = false;
  setState(f, 'attack');
  emit(g, 'swing', { heavy: !!move.heavy, side: f.side });
}

// ---------------------------------------------------------------- update

export function update(g, dt, ctl = NO_INPUT) {
  if (g.state !== 'playing') {
    g.stateTime += dt;
    if (g.state === 'intro' && g.stateTime >= INTRO_TIME) {
      g.state = 'playing';
      g.stateTime = 0;
    }
    return;
  }

  // Hitstop: the whole fight freezes for a few frames so hits land with weight.
  if (g.hitstop > 0) {
    g.hitstop -= dt;
    return;
  }

  g.time += dt;
  g.stateTime += dt;
  g.tagCooldown = Math.max(0, g.tagCooldown - dt);
  g.go = Math.max(0, g.go - dt);
  g.chainPop = Math.max(0, g.chainPop - dt * 4);
  g.chainTime -= dt;
  if (g.chainTime <= 0) g.chain = 0;

  controlHero(g, ctl);
  const hero = activeHero(g);
  const partner = partnerHero(g);
  if (partner.hp > 0) partner.hp = Math.min(partner.maxHp, partner.hp + CONFIG.benchRegen * dt);

  for (const e of g.enemies) think(g, e);
  for (const f of [hero, ...g.enemies]) physics(g, f, dt);
  updateProjectiles(g, dt);
  resolveHits(g);
  updateCamera(g, dt);
  updateWaves(g, dt);

  for (const f of [hero, partner, ...g.enemies]) {
    f.flash = Math.max(0, f.flash - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.specialCooldown = Math.max(0, f.specialCooldown - dt);
    f.attackCooldown = Math.max(0, f.attackCooldown - dt);
  }
  g.enemies = g.enemies.filter((e) => !(e.state === 'ko' && e.t > 0.9));

  checkHeroDown(g);
}

// ---------------------------------------------------------------- heroes

function controlHero(g, ctl) {
  if (ctl.tag) tryTag(g);
  const f = activeHero(g);
  const sp = f.def.speed;

  switch (f.state) {
    case 'idle':
    case 'walk': {
      f.running = !!ctl.run && ctl.x !== 0;
      if (ctl.special && f.specialCooldown <= 0) {
        if (ctl.x) f.facing = Math.sign(ctl.x);
        f.specialCooldown = f.def.special.cooldown;
        f.running = false;
        startMove(g, f, f.def.special);
        emit(g, 'special', { hero: f.def.id, kind: 'throw' });
        return;
      }
      if (ctl.attack) {
        if (ctl.x) f.facing = Math.sign(ctl.x);
        if (f.running) {
          // Running attack: →→ then attack.
          f.running = false;
          startMove(g, f, f.def.run);
          emit(g, 'special', { hero: f.def.id, kind: 'run' });
          return;
        }
        f.combo = 0;
        startMove(g, f, f.def.combo[0]);
        return;
      }
      if (ctl.jump) {
        setState(f, 'jump');
        f.vh = f.def.jump;
        f.airAttack = false;
        f.vx = ctl.x * sp.x * (f.running ? 1.4 : 1);
        f.vz = ctl.z * sp.z * 0.6;
        f.running = false;
        emit(g, 'jump');
        return;
      }
      f.vx = ctl.x * sp.x * (f.running ? RUN_SPEED : 1);
      f.vz = ctl.z * sp.z * (f.running ? 0.6 : 1);
      if (ctl.x) f.facing = Math.sign(ctl.x);
      const moving = ctl.x !== 0 || ctl.z !== 0;
      if (moving && f.state !== 'walk') setState(f, 'walk');
      if (!moving && f.state !== 'idle') setState(f, 'idle');
      return;
    }

    case 'jump':
      if (f.diving) return; // committed to the dive
      f.vx = ctl.x * sp.x * 0.9; // air control
      if (ctl.x && !f.airAttack) f.facing = Math.sign(ctl.x);
      if (ctl.special && !f.airAttack && f.specialCooldown <= 0) {
        // Air special: a dive attack, straight down and forward.
        const m = f.def.airSpecial;
        f.airAttack = true;
        f.diving = true;
        f.move = m;
        f.hits.clear();
        f.vh = m.dive.vh;
        f.vx = f.facing * m.dive.vx;
        f.vz = 0;
        f.specialCooldown = m.cooldown;
        emit(g, 'special', { hero: f.def.id, kind: 'air' });
        return;
      }
      if (ctl.attack && !f.airAttack) {
        f.airAttack = true;
        f.move = f.def.air;
        f.hits.clear();
        emit(g, 'swing', { heavy: false, side: 'hero' });
      }
      return;

    case 'attack': {
      const m = f.move;
      const chainable = f.def.combo.includes(m) && f.combo < f.def.combo.length - 1;
      if (ctl.attack && chainable) f.queued = true;
      const ph = phaseOf(f);

      // Movement during a move: specials lunge, combo hits step forward a little.
      if (m.lunge) f.vx = ph === 'active' ? f.facing * m.lunge : 0;
      else if (m.step) f.vx = ph === 'startup' || ph === 'active' ? f.facing * m.step : 0;
      else f.vx = 0;
      f.vz = 0;

      if (m.projectile && ph === 'active' && !f.fired) {
        f.fired = true;
        fire(g, f, m.projectile);
      }

      // A buffered press chains as soon as recovery starts: snappy, not mashy.
      if ((ph === 'recovery' || ph === 'done') && f.queued) {
        if (ctl.x) f.facing = Math.sign(ctl.x);
        f.combo++;
        startMove(g, f, f.def.combo[f.combo]);
      } else if (ph === 'done') {
        f.move = null;
        setState(f, 'idle');
      }
      return;
    }

    default:
      return; // hurt, down, getup, ko: no control
  }
}

function tryTag(g) {
  const out = activeHero(g);
  const inn = partnerHero(g);
  if (g.tagCooldown > 0 || inn.hp <= 0) return;
  if (!['idle', 'walk', 'attack'].includes(out.state) || out.h > 0) return;
  swapIn(g, out, inn);
}

function swapIn(g, out, inn) {
  Object.assign(inn, {
    x: out.x, z: out.z, h: 0, vx: 0, vz: 0, vh: 0,
    facing: out.facing, invuln: CONFIG.tagInvuln, combo: 0, lying: false, airAttack: false,
    diving: false, running: false,
  });
  out.move = null;
  out.vx = out.vz = 0;
  if (out.hp > 0) setState(out, 'idle');
  g.active = g.heroes.indexOf(inn);
  g.tagCooldown = CONFIG.tagCooldown;
  startMove(g, inn, TAG_STRIKE);
  emit(g, 'tag', { hero: inn.def.id });
}

function checkHeroDown(g) {
  const hero = activeHero(g);
  if (hero.state !== 'ko' || hero.t < 0.5) return;
  const partner = partnerHero(g);
  if (partner.hp > 0) {
    swapIn(g, hero, partner);
  } else {
    g.state = 'gameOver';
    g.stateTime = 0;
    emit(g, 'gameOver');
  }
}

function fire(g, f, p) {
  const s = f.def.scale;
  g.projectiles.push({
    x: f.x + f.facing * 20 * s, z: f.z, h: 29 * s,
    vx: f.facing * p.speed, facing: f.facing, side: 'hero', kind: p.kind, spin: 0,
    move: p, life: p.life, hits: new Set(), def: { scale: 1 },
  });
  emit(g, 'throw', { kind: p.kind });
}

function updateProjectiles(g, dt) {
  for (const p of g.projectiles) {
    p.x += p.vx * dt;
    p.spin += dt;
    p.life -= dt;
    for (const e of g.enemies) {
      if (p.hits.has(e.id) || !hittable(e)) continue;
      if (Math.abs(e.z - p.z) > CONFIG.depthReach + 4) continue;
      if (Math.abs(e.x - p.x) > p.move.half + CONFIG.bodyHalf * e.def.scale) continue;
      applyHit(g, p, e, p.move);
      if (!p.move.pierce) {
        p.life = 0; // stars stop at the first enemy; the fin blade cuts through
        break;
      }
    }
  }
  g.projectiles = g.projectiles.filter((p) => p.life > 0 && p.x > g.camX - 40 && p.x < g.camX + W + 40);
}

// ---------------------------------------------------------------- enemies

function release(e) {
  if (!e.token) return;
  e.token = false;
  e.attackCooldown = rand(...CONFIG.enemyAttackCooldown);
}

function think(g, e) {
  const hero = activeHero(g);
  const atk = e.def.attack;

  switch (e.state) {
    case 'idle':
    case 'walk': {
      const side = e.x < hero.x ? -1 : 1; // stay on the side we're on
      const onScreen = e.x > g.camX + 8 && e.x < g.camX + W - 8;
      const used = g.enemies.filter((o) => o.token).length;
      if (!e.token && e.attackCooldown <= 0 && onScreen && used < CONFIG.attackTokens && hero.hp > 0) e.token = true;

      // With a token: close in to striking range. Without: hover at a distance, waiting a turn.
      let tx;
      let tz;
      if (e.token) {
        tx = hero.x + side * atk.reach[1] * e.def.scale * 0.7;
        tz = hero.z;
      } else {
        // Wait on screen: a waiting spot past the edge would leave them unreachable forever.
        tx = clamp(hero.x + side * (115 + e.jitter), g.camX + 30, g.camX + W - 30);
        tz = e.homeZ;
      }
      const dx = tx - e.x;
      const dz = tz - e.z;
      e.vx = Math.abs(dx) > 3 ? Math.sign(dx) * e.def.speed.x : 0;
      e.vz = Math.abs(dz) > 2 ? Math.sign(dz) * e.def.speed.z : 0;

      // Light separation so a crowd doesn't stack into one sprite.
      for (const o of g.enemies) {
        if (o === e || o.state === 'ko') continue;
        if (Math.abs(o.x - e.x) < 22 && Math.abs(o.z - e.z) < 10) e.vx += (e.x <= o.x ? -1 : 1) * 30;
      }

      e.facing = hero.x >= e.x ? 1 : -1;
      const moving = e.vx !== 0 || e.vz !== 0;
      if (moving && e.state !== 'walk') setState(e, 'walk');
      if (!moving && e.state !== 'idle') setState(e, 'idle');

      if (e.token && inRange(e, hero)) {
        e.vx = e.vz = 0;
        setState(e, 'windup');
        emit(g, 'windup', { kind: e.def.id });
      }
      return;
    }

    case 'windup':
      e.vx = e.vz = 0;
      if (e.t >= atk.windup) startMove(g, e, atk);
      return;

    case 'attack':
      e.vx = e.vz = 0;
      if (phaseOf(e) === 'done') {
        e.move = null;
        setState(e, 'idle');
        release(e);
      }
      return;

    default:
      release(e); // hurt, down, getup, ko
  }
}

function inRange(e, hero) {
  const r = e.def.attack.reach;
  const dx = (hero.x - e.x) * e.facing;
  return dx >= r[0] && dx <= r[1] * e.def.scale * 0.85 + CONFIG.bodyHalf && Math.abs(hero.z - e.z) <= CONFIG.depthReach - 3;
}

// ---------------------------------------------------------------- physics + states

function physics(g, f, dt) {
  f.t += dt;
  if (f.h > 0 || f.vh > 0) {
    f.vh -= CONFIG.gravity * dt;
    f.h += f.vh * dt;
    if (f.h <= 0) {
      f.h = 0;
      f.vh = 0;
      land(g, f);
    }
  }
  const grounded = f.h === 0;
  if (grounded && ['hurt', 'down', 'getup', 'ko'].includes(f.state)) {
    const decel = 700 * dt; // skid to a stop
    f.vx = Math.abs(f.vx) <= decel ? 0 : f.vx - Math.sign(f.vx) * decel;
  }
  f.x += f.vx * dt;
  f.z = clamp(f.z + f.vz * dt, FLOOR.top, FLOOR.bottom);
  if (f.side === 'hero') f.x = clamp(f.x, g.camX + 20, g.camX + W - 20);
  else f.x = clamp(f.x, -80, g.stage.length + 80);

  if (f.state === 'hurt' && f.t >= CONFIG.hurtTime * (f.def.hurtScale ?? 1)) setState(f, 'idle');
  if (f.state === 'down' && f.lying && f.t >= CONFIG.lieTime) {
    if (f.hp <= 0) {
      setState(f, 'ko');
      emit(g, 'ko', { x: f.x, y: f.z - 6, side: f.side, colour: f.style.torso });
    } else {
      setState(f, 'getup');
      f.lying = false;
    }
  }
  if (f.state === 'getup' && f.t >= CONFIG.getupTime) {
    setState(f, 'idle');
    f.invuln = CONFIG.getupInvuln;
  }
}

function land(g, f) {
  if (f.state === 'down') {
    f.lying = true;
    f.t = 0;
    f.vx *= 0.4;
    emit(g, 'thud', { x: f.x, y: f.z });
  } else if (f.state === 'jump') {
    const dive = f.diving ? f.move : null;
    f.airAttack = false;
    f.diving = false;
    f.move = null;
    f.vx = f.vz = 0;
    if (dive?.quake) {
      startMove(g, f, dive.quake);
      emit(g, 'quake', { x: f.x, y: f.z });
    } else if (dive) {
      startMove(g, f, LAND_RECOVER);
    } else {
      setState(f, 'idle');
    }
  }
}

// ---------------------------------------------------------------- hits

function hittable(f) {
  return f.invuln <= 0 && f.hp > 0 && f.state !== 'ko' && f.state !== 'getup' && !(f.state === 'down' && f.lying);
}

/** The move a fighter can hit with right now, if any. */
function liveMove(f) {
  if (f.state === 'attack' && phaseOf(f) === 'active' && f.move.reach) return f.move;
  if (f.state === 'jump' && f.airAttack) return f.move;
  return null;
}

function connects(att, move, target) {
  if (att.hits.has(target.id) || !hittable(target)) return false;
  if (Math.abs(target.z - att.z) > CONFIG.depthReach) return false;
  if (att.h < 10 && target.h > CONFIG.jumpDodge) return false; // jumped over a ground attack
  if (att.h > 55) return false; // too high for a jump attack to reach
  const s = att.def.scale;
  const a = att.x + att.facing * move.reach[0] * s;
  const b = att.x + att.facing * move.reach[1] * s;
  const half = CONFIG.bodyHalf * target.def.scale;
  return target.x + half >= Math.min(a, b) && target.x - half <= Math.max(a, b);
}

function resolveHits(g) {
  const hero = activeHero(g);
  const heroMove = liveMove(hero);
  if (heroMove) {
    for (const e of g.enemies) if (connects(hero, heroMove, e)) applyHit(g, hero, e, heroMove);
  }
  for (const e of g.enemies) {
    const m = liveMove(e);
    if (m && connects(e, m, hero)) applyHit(g, e, hero, m);
  }
}

function applyHit(g, att, target, move) {
  att.hits.add(target.id);
  target.hp = Math.max(0, target.hp - move.dmg);
  target.flash = 0.1;
  const dir = Math.sign(target.x - att.x) || att.facing;
  target.facing = -dir;
  target.move = null;
  target.queued = false;
  target.airAttack = false;
  target.diving = false;
  target.running = false;
  target.vz = 0;

  if (move.down || target.hp <= 0 || target.h > 0) {
    setState(target, 'down');
    target.lying = false;
    target.vh = 170;
    target.vx = dir * move.kb;
  } else {
    setState(target, 'hurt');
    target.vx = dir * move.kb;
  }
  release(target);

  g.hitstop = move.heavy ? CONFIG.hitstopHeavy : CONFIG.hitstop;
  if (att.side === 'hero') {
    g.chain++;
    g.chainTime = 1.6;
    g.chainPop = 1;
    g.score += CONFIG.score.hit;
    if (target.hp <= 0) g.score += target.def.score;
  }
  emit(g, 'hit', {
    x: (att.x + target.x) / 2,
    y: target.z - target.h - 29 * target.def.scale,
    heavy: !!move.heavy,
    dmg: move.dmg,
    toHero: target.side === 'hero',
    finish: target.hp <= 0,
  });
}

// ---------------------------------------------------------------- camera + waves

function updateCamera(g, dt) {
  const maxCam = g.stage.length - W;
  if (g.lock !== null) {
    g.camX = g.camX < g.lock ? Math.min(g.lock, g.camX + 260 * dt) : g.lock;
    return;
  }
  // Follow the hero forwards; never scroll back (classic brawler rule).
  const target = clamp(activeHero(g).x - W * 0.4, 0, maxCam);
  if (target > g.camX) g.camX = Math.min(target, g.camX + 320 * dt);
}

function spawnWave(g, wave) {
  wave.forEach(([type, side], i) => {
    const def = ENEMIES[type];
    const x = side === 'right' ? g.lock + W + 30 + i * 26 : g.lock - 30 - i * 26;
    const e = createFighter(def, 'enemy', x, rand(FLOOR.top + 6, FLOOR.bottom - 6));
    e.facing = side === 'right' ? -1 : 1;
    e.attackCooldown = rand(0.4, 1.2) + i * 0.25;
    g.enemies.push(e);
  });
  emit(g, 'wave');
}

function updateWaves(g, dt) {
  const zones = g.stage.zones;
  if (g.lock === null) {
    const zone = zones[g.zoneIndex];
    if (zone && activeHero(g).x >= zone.trigger) {
      g.lock = zone.camX;
      g.waveIndex = 0;
      g.waveTimer = 0;
      g.go = 0;
      spawnWave(g, zone.waves[0]);
    }
    return;
  }

  if (g.enemies.some((e) => e.state !== 'ko')) {
    g.waveTimer = 0;
    return;
  }
  g.waveTimer += dt;
  if (g.waveTimer < CONFIG.waveDelay) return;

  const zone = zones[g.zoneIndex];
  if (g.waveIndex < zone.waves.length - 1) {
    g.waveIndex++;
    g.waveTimer = 0;
    spawnWave(g, zone.waves[g.waveIndex]);
    return;
  }

  // Zone cleared.
  g.lock = null;
  g.zoneIndex++;
  if (g.zoneIndex >= zones.length) {
    g.state = 'stageClear';
    g.stateTime = 0;
    g.score += CONFIG.score.stageClear;
    emit(g, 'stageClear');
  } else {
    g.go = 4;
    emit(g, 'go');
  }
}
