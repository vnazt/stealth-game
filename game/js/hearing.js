// hearing.js — noise: footsteps, thrown coins and cut chains make rings that wardens investigate.
import { TILE } from './config.js';
import { say } from './guards.js';

export function emitNoise(state, x, y, radiusTiles, tag = '') {
  state.noises.push({ x, y, r: radiusTiles * TILE, age: 0, life: 0.9, tag });
  for (const g of state.guards) {
    if (g.state === 'alert') continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d <= radiusTiles * TILE + 20) {
      g.suspicion = Math.max(g.suspicion, 0.52);
      g.state = 'investigate';
      g.target = { x, y };
      g.lookTimer = 0;
      say(state, g, 'What was that?');
      if (tag) state.tags.push({ x, y: y - 26, text: tag, until: state.time + 2.4 });
    }
  }
}

/** Age and expire the visible noise rings. */
export function updateNoises(state, dt) {
  for (const n of state.noises) n.age += dt;
  state.noises = state.noises.filter((n) => n.age < n.life);
}
