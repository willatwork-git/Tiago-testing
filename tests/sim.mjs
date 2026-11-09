// Headless logic checks: maze reachability, no dead ends, and 20 × 90 s simulated runs
// (random player, both difficulties) to confirm Glitches leave and return home and
// nobody ever ends up inside a wall.   node tests/sim.mjs
import { Maze, DIR_LIST } from '../src/chomp/maze.js';
import { Player } from '../src/chomp/player.js';
import { createGlitches } from '../src/chomp/glitches.js';
import { CONFIG, DIFFICULTY } from '../src/chomp/config.js';
let fails = 0; const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL', msg); } };

const m = new Maze();
// 1. every pellet reachable by the player
const f = m.distanceField(m.spawn.player, false);
let unreachable = 0;
m.tiles.forEach((r,y)=>r.forEach((t,x)=>{ if ((t==='.'||t==='o') && f[y][x]===Infinity) unreachable++; }));
check(unreachable===0, `${unreachable} unreachable pellets`);
// 2. no dead ends on player-walkable floor (outside the house)
m.tiles.forEach((r,y)=>r.forEach((t,x)=>{
  if (f[y][x]===Infinity) return;
  const n = DIR_LIST.filter(d=>m.passable(x+d.x,y+d.y)).length;
  check(n>=2, `dead end at ${x},${y}`);
}));
check(m.homeField[m.spawn.door.y][m.spawn.door.x] === 2, 'door is 2 steps from house centre');
console.log('pellets', m.pellets, 'tunnel tiles', m.tunnel.size);

// 3. simulate: random-walking player, glitches, frighten + eat cycles
for (let run = 0; run < 20; run++) {
  const diff = DIFFICULTY[run % 2 ? 'hard' : 'normal']; const game = { diff, maze: new Maze(), level: 1 + (run % 5), mode: 'scatter', lifeTime: 0, frightTime: 0 };
  game.player = new Player(game.maze.spawn.player);
  game.glitches = createGlitches(game.maze, game.level, game.diff);
  const dt = 1/60; let activeSeen = new Set(), returned = 0;
  for (let i = 0; i < 60*90; i++) {
    game.lifeTime += dt;
    if (i % 30 === 0) game.player.want = DIR_LIST[Math.floor(Math.random()*4)];
    if (i % 600 === 0) game.mode = game.mode === 'scatter' ? 'chase' : 'scatter';
    if (i % 900 === 450) { game.frightTime = 5; game.glitches.forEach(g=>g.frighten(game.maze)); }
    if (game.frightTime > 0) { game.frightTime -= dt; if (game.frightTime <= 0) game.glitches.forEach(g=>g.frightened=false); }
    game.player.update(dt, game.maze, CONFIG.playerSpeed(game.level), (x,y)=>game.maze.eat(x,y));
    for (const g of game.glitches) {
      const before = g.state;
      g.update(dt, game);
      if (before==='eaten' && g.state==='leaving') returned++;
      if (g.state==='active') activeSeen.add(g.index);
      // occasionally "eat" a frightened active glitch
      if (g.frightened && g.state==='active' && Math.random()<0.002) { g.frightened=false; g.state='eaten'; }
      const gate = g.state==='eaten'||g.state==='leaving'||g.state==='house';
      check(game.maze.passable(g.tx,g.ty,gate), `glitch ${g.def.name} in wall at ${g.tx},${g.ty} state ${g.state}`);
      check(g.ty>=0 && g.ty<game.maze.rows, 'glitch off board');
    }
    const p = game.player;
    check(game.maze.passable(p.tx,p.ty), `player in wall ${p.tx},${p.ty}`);
    if (fails > 5) break;
  }
  check(activeSeen.size===4, `run ${run}: only ${[...activeSeen]} became active`);
  if (run<3) console.log(`run ${run}: active ${activeSeen.size}/4, eaten→home ${returned}, pellets left ${game.maze.pellets}, states ${game.glitches.map(g=>g.state)}`);
}
console.log(fails ? `${fails} failures` : 'ALL OK');
process.exitCode = fails ? 1 : 0;
