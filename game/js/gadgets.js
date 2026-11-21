// gadgets.js — the lifter's three tools: thrown coins (noise), smoke puffs (blind cones), bolt cutters (gates).
import { THROW_RANGE, SMOKE_SECONDS } from './config.js';
import { emitNoise } from './hearing.js';

/** Throw a coin toward (tx, ty), clamped to range; it lands with a ring of noise. */
export function throwCoin(state, tx, ty) {
  if (state.coinsLeft <= 0) return false;
  const p = state.player;
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  const scale = d > THROW_RANGE ? THROW_RANGE / d : 1;
  state.projectiles.push({
    kind: 'coin', x: p.x, y: p.y, sx: p.x, sy: p.y,
    tx: p.x + dx * scale, ty: p.y + dy * scale, t: 0, dur: 0.42,
  });
  state.coinsLeft -= 1;
  state.coinsThrown += 1;
  return true;
}

/** Drop a smoke puff at the player's feet: for a few seconds, sight lines die inside it. */
export function dropSmoke(state) {
  if (state.smokesLeft <= 0) return false;
  state.smokes.push({ x: state.player.x, y: state.player.y, r: 52, until: state.time + SMOKE_SECONDS });
  state.smokesLeft -= 1;
  return true;
}

/** Fly the projectiles; a landed coin pings and pulls wardens toward it. */
export function updateGadgets(state, dt) {
  for (const pr of state.projectiles) {
    pr.t += dt;
    const k = Math.min(1, pr.t / pr.dur);
    pr.x = pr.sx + (pr.tx - pr.sx) * k;
    pr.y = pr.sy + (pr.ty - pr.sy) * k - Math.sin(k * Math.PI) * 26;
    if (k >= 1 && !pr.landed) {
      pr.landed = true;
      emitNoise(state, pr.tx, pr.ty, 4.2, 'HEARD THE COIN');
    }
  }
  state.projectiles = state.projectiles.filter((pr) => !pr.landed);
  state.smokes = state.smokes.filter((s) => state.time < s.until + 0.6);
}
