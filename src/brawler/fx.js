// Visual effects for Nebula Knockout: hit sparks, impact rings, dust, screen shake.
// World pixel units. Driven by game events; respects the OS "reduce motion" setting.

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function createFx() {
  const fx = {
    sparks: [], // { x, y, vx, vy, life, max, colour, kind: 'spark' | 'dust' | 'ring' }
    shake: 0,
    reduce: reduceMotion(),

    burst(x, y, colour, n, speed, life, kind = 'spark') {
      const count = fx.reduce ? Math.ceil(n / 3) : n;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.65);
        fx.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'dust' ? 20 : 0), life, max: life, colour, kind });
      }
    },

    ring(x, y, colour, life = 0.25) {
      fx.sparks.push({ x, y, vx: 0, vy: 0, life, max: life, colour, kind: 'ring' });
    },

    kick(px) {
      if (!fx.reduce) fx.shake = Math.max(fx.shake, px);
    },

    handle(ev, game) {
      switch (ev.type) {
        case 'hit': {
          const colour = ev.toHero ? '#ff3b5c' : '#ffe14f';
          fx.burst(ev.x, ev.y, '#ffffff', ev.heavy ? 10 : 5, ev.heavy ? 160 : 110, 0.22);
          fx.burst(ev.x, ev.y, colour, ev.heavy ? 8 : 4, ev.heavy ? 120 : 80, 0.3);
          if (ev.heavy) fx.ring(ev.x, ev.y, colour);
          fx.kick(ev.heavy ? 3 : 1);
          break;
        }
        case 'thud': fx.burst(ev.x, ev.y, '#8f84b8', 6, 50, 0.4, 'dust'); break;
        case 'ko': fx.burst(ev.x, ev.y - 10, ev.colour, 14, 90, 0.6); break;
        case 'tag': {
          const h = game.heroes[game.active];
          fx.ring(h.x, h.z - 26, h.def.style.body, 0.35);
          fx.burst(h.x, h.z - 26, h.def.style.accent, 12, 120, 0.4);
          break;
        }
        default: break;
      }
    },

    update(dt) {
      for (const s of fx.sparks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.9;
        s.vy *= 0.9;
        if (s.kind === 'dust') s.vy += 30 * dt;
        s.life -= dt;
      }
      fx.sparks = fx.sparks.filter((s) => s.life > 0);
      fx.shake = Math.max(0, fx.shake - dt * 18);
    },

    clear() {
      fx.sparks = [];
      fx.shake = 0;
    },
  };
  return fx;
}
