// lighting.js — how bright each tile is: lamp pools expose you, dark floor and fronds hide you.
import { TILE } from './config.js';
import { tileAt } from './levels.js';
import { tileOf } from './vision.js';

const BASE_LIGHT = { '*': 1.0, '.': 0.55, ',': 0.22, G: 0.18, E: 0.6, O: 0.7, v: 0.55, P: 0.55, g: 0.5 };

/** Light level 0..1 at a world position, including the spill from nearby lamp tiles. */
export function lightAt(level, x, y) {
  const { tx, ty } = tileOf(x, y);
  let light = BASE_LIGHT[tileAt(level, tx, ty)] ?? 0.5;
  for (let oy = -2; oy <= 2; oy += 1) {
    for (let ox = -2; ox <= 2; ox += 1) {
      if (tileAt(level, tx + ox, ty + oy) === '*') {
        const d = Math.hypot(ox, oy);
        light = Math.max(light, 1.0 - d * 0.22);
      }
    }
  }
  return Math.min(1, light);
}

/** A short word for the light a position sits in — the HUD's visibility label. */
export function lightWord(level, x, y) {
  const { tx, ty } = tileOf(x, y);
  const ch = tileAt(level, tx, ty);
  if (ch === 'G') return 'IN THE FRONDS';
  const l = lightAt(level, x, y);
  if (l > 0.8) return 'IN LAMPLIGHT';
  if (l > 0.42) return 'ON OPEN FLOOR';
  return 'IN SHADOW';
}
