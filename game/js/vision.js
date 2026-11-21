// vision.js — line of sight and vision-cone geometry: what a warden or camera can actually see.
import { TILE, FIELD } from './config.js';
import { tileAt, blocksSight, blocksMove } from './levels.js';

export function tileCenter(tx, ty) {
  return { x: FIELD.x + (tx + 0.5) * TILE, y: FIELD.y + (ty + 0.5) * TILE };
}
export function tileOf(x, y) {
  return { tx: Math.floor((x - FIELD.x) / TILE), ty: Math.floor((y - FIELD.y) / TILE) };
}

/** March a segment in small steps; true when no sight-blocking tile (or smoke disc) stops it. */
export function losClear(level, x0, y0, x1, y1, crouched = false, smoke = []) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 5));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x0 + dx * t, y = y0 + dy * t;
    const { tx, ty } = tileOf(x, y);
    const ch = tileAt(level, tx, ty);
    if (blocksSight(ch)) return false;
    if (crouched && ch === 'L') return false; // ducked behind low cover
    for (const s of smoke) {
      if (Math.hypot(x - s.x, y - s.y) < s.r) return false;
    }
  }
  return true;
}

/** The visible cone as a polygon: rays fanned across the field of view, each clipped by walls and smoke. */
export function conePolygon(level, x, y, dir, range, halfAngle, smoke = []) {
  const rays = 30;
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = dir - halfAngle + (2 * halfAngle * i) / rays;
    let d = range;
    const steps = Math.ceil(range / 6);
    for (let s = 1; s <= steps; s += 1) {
      const px = x + Math.cos(a) * ((s / steps) * range);
      const py = y + Math.sin(a) * ((s / steps) * range);
      const { tx, ty } = tileOf(px, py);
      if (blocksSight(tileAt(level, tx, ty))) { d = ((s - 0.5) / steps) * range; break; }
      let inSmoke = false;
      for (const puff of smoke) {
        if (Math.hypot(px - puff.x, py - puff.y) < puff.r * 0.92) { inSmoke = true; break; }
      }
      if (inSmoke) { d = ((s - 0.5) / steps) * range; break; }
    }
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

/** Angle difference wrapped to [-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Move a circle actor by (dx, dy), sliding along tiles that block movement. */
export function moveActor(level, actor, dx, dy) {
  const r = actor.radius;
  const tryAxis = (nx, ny) => {
    const corners = [[nx - r, ny - r], [nx + r, ny - r], [nx - r, ny + r], [nx + r, ny + r]];
    for (const [cx, cy] of corners) {
      const { tx, ty } = tileOf(cx, cy);
      if (blocksMove(tileAt(level, tx, ty))) return false;
    }
    return true;
  };
  if (tryAxis(actor.x + dx, actor.y)) actor.x += dx;
  if (tryAxis(actor.x, actor.y + dy)) actor.y += dy;
}
