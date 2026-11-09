// Visual effects state: particles and screen shake. Updated on the fixed step,
// drawn by the renderer. Positions are in tile units, like everything else.
//
// "Reduce motion" (OS setting) turns shake off and thins the particles.

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function createFx() {
  const fx = {
    particles: [], // { x, y, vx, vy, life, max, colour, size, kind: 'spark' | 'ghost' }
    shake: 0, // current amplitude, in tiles
    reduce: reduceMotion(),

    burst(x, y, colour, count, speed, life = 0.5, size = 0.08) {
      const n = fx.reduce ? Math.ceil(count / 3) : count;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.6);
        fx.particles.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life, max: life, colour, size: size * (0.6 + Math.random() * 0.8), kind: 'spark',
        });
      }
    },

    kick(amount) {
      if (!fx.reduce) fx.shake = Math.max(fx.shake, amount);
    },

    /** React to a game event. */
    handle(ev, game) {
      const body = game.colours.body;
      switch (ev.type) {
        case 'pellet': fx.burst(ev.x, ev.y, '#f3e8ff', 3, 2, 0.25, 0.05); break;
        case 'power': fx.burst(ev.x, ev.y, '#ffffff', 18, 6, 0.6); fx.kick(0.12); break;
        case 'eatGlitch': fx.burst(ev.x, ev.y, ev.colour, 22, 7, 0.6, 0.1); fx.kick(0.15); break;
        case 'death': fx.burst(ev.x, ev.y, body, 36, 6, 1.1, 0.1); fx.kick(0.35); break;
        case 'dash': fx.burst(ev.x, ev.y, game.colours.glow, 8, 3, 0.3, 0.06); break;
        case 'dashReady': fx.burst(ev.x, ev.y, game.colours.glow, 10, 4, 0.35, 0.05); break;
        default: break;
      }
    },

    update(dt, game) {
      // Dash afterimages: a fading copy of the player each step while dashing.
      const p = game.player;
      if (game.state === 'playing' && p?.dashTime > 0) {
        fx.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.18, max: 0.18, colour: game.colours.glow, size: 0.4, kind: 'ghost' });
      }
      for (const q of fx.particles) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 0.92;
        q.vy *= 0.92;
        q.life -= dt;
      }
      fx.particles = fx.particles.filter((q) => q.life > 0);
      fx.shake = Math.max(0, fx.shake - dt * 1.2);
    },

    clear() {
      fx.particles = [];
      fx.shake = 0;
    },
  };
  return fx;
}
