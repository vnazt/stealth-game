// scenery.js — the guildhall's surfaces: per-room floor textures, trimmed walls, props, lamp light.
import { TILE, FIELD, PALETTE } from './config.js';
import { tileAt } from './levels.js';

export function tileXY(tx, ty) {
  return { x: FIELD.x + tx * TILE, y: FIELD.y + ty * TILE };
}

/** Deterministic per-tile hash, so grass blades and floor wear never flicker. */
export function hash(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

// Rooms: flood-filled regions split by walls and chained gates. Each room gets its own
// floor texture, so the hall reads as places, not as one checkerboard.
const roomCache = new WeakMap();

function roomMap(level) {
  let cached = roomCache.get(level);
  if (cached) return cached;
  const grid = new Int16Array(FIELD.cols * FIELD.rows).fill(-1);
  let next = 0;
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) {
      const ch = tileAt(level, tx, ty);
      if (ch === '#' || ch === 'g' || grid[ty * FIELD.cols + tx] !== -1) continue;
      const stack = [[tx, ty]];
      grid[ty * FIELD.cols + tx] = next;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= FIELD.cols || ny >= FIELD.rows) continue;
          const nch = tileAt(level, nx, ny);
          if (nch === '#' || nch === 'g' || grid[ny * FIELD.cols + nx] !== -1) continue;
          grid[ny * FIELD.cols + nx] = next;
          stack.push([nx, ny]);
        }
      }
      next += 1;
    }
  }
  roomCache.set(level, grid);
  return grid;
}

/** Floor texture variant 0..3 for a tile: 0 tile, 1 brick, 2 planks, 3 carpet. */
export function roomVariant(level, tx, ty) {
  const grid = roomMap(level);
  const id = grid[ty * FIELD.cols + tx];
  return id < 0 ? 0 : id % 4;
}

function drawFloorBase(ctx, level, tx, ty, x, y) {
  const variant = roomVariant(level, tx, ty);
  const parity = (tx + ty) % 2 === 0;
  if (variant === 1) {
    // Brick: staggered seams, slightly varied courses.
    ctx.fillStyle = parity ? '#272c39' : '#252a37';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(10,12,18,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + TILE / 2); ctx.lineTo(x + TILE, y + TILE / 2);
    const seam = (ty % 2 === 0 ? 0.5 : 0.25) * TILE;
    ctx.moveTo(x + seam, y); ctx.lineTo(x + seam, y + TILE / 2);
    ctx.moveTo(x + TILE - seam, y + TILE / 2); ctx.lineTo(x + TILE - seam, y + TILE);
    ctx.stroke();
  } else if (variant === 2) {
    // Planks: warm boards running across the room, grain from the tile hash.
    const warm = 0.92 + hash(tx * 3, ty * 5) * 0.16;
    ctx.fillStyle = `rgb(${Math.round(46 * warm)},${Math.round(40 * warm)},${Math.round(31 * warm)})`;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(12,8,4,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + TILE / 2); ctx.lineTo(x + TILE, y + TILE / 2);
    ctx.moveTo(x + ((tx * 7) % 3) * 11, y); ctx.lineTo(x + ((tx * 7) % 3) * 11, y + TILE / 2);
    ctx.moveTo(x + ((tx * 5 + 1) % 3) * 11, y + TILE / 2); ctx.lineTo(x + ((tx * 5 + 1) % 3) * 11, y + TILE);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,178,128,0.10)';
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 8 + hash(tx, ty) * 16);
    ctx.lineTo(x + TILE - 4, y + 7 + hash(tx + 9, ty) * 16);
    ctx.stroke();
  } else if (variant === 3) {
    // Carpet: deep plum with a worn diamond motif.
    ctx.fillStyle = parity ? '#332631' : '#31242e';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = 'rgba(216,164,94,0.20)';
    const cx = x + TILE / 2, cy = y + TILE / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx - 5, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, TILE, 1);
  } else {
    // Tile: the original cool checker, with grout.
    ctx.fillStyle = parity ? PALETTE.floor : PALETTE.floorAlt;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(8,10,16,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }
}

function drawTile(ctx, level, tx, ty) {
  const ch = tileAt(level, tx, ty);
  const { x, y } = tileXY(tx, ty);
  drawFloorBase(ctx, level, tx, ty, x, y);
  if (ch === ',') { ctx.fillStyle = PALETTE.darkFloor; ctx.fillRect(x, y, TILE, TILE); }
  if (ch === '*') { ctx.fillStyle = PALETTE.lampFloor; ctx.fillRect(x, y, TILE, TILE); }
  if (ch === 'G') {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = PALETTE.grassBlade;
    ctx.lineWidth = 1.7;
    for (let i = 0; i < 6; i += 1) {
      const bx = x + 5 + hash(tx * 7 + i, ty) * 24;
      const by = y + TILE - 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + (hash(tx, ty * 3 + i) - 0.5) * 7, by - 10, bx + (hash(tx + i, ty + 9) - 0.5) * 10, by - 15 - hash(tx, ty + i) * 7);
      ctx.stroke();
    }
  }
  if (ch === '#') {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(x, y, TILE, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(x, y, TILE, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x + TILE - 4, y, 4, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  }
  if (ch === 'C') {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + TILE - 3, y + TILE - 3);
    ctx.moveTo(x + TILE - 3, y + 3); ctx.lineTo(x + 3, y + TILE - 3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + 2, y + TILE - 6, TILE - 4, 4);
  }
  if (ch === 'B') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2 + 3, 13, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.barrel;
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 13, 0, 7); ctx.fill();
    ctx.strokeStyle = PALETTE.barrelEdge;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 9.5, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 4.5, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,226,170,0.25)';
    ctx.beginPath(); ctx.arc(x + TILE / 2 - 4, y + TILE / 2 - 5, 3, 0, 7); ctx.fill();
  }
  if (ch === 'K') {
    ctx.fillStyle = PALETTE.shelf;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = PALETTE.shelfEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    const spine = ['#7a4a3a', '#4a5d7a', '#5d7a4a', '#7a6a3a', '#5d4a7a'];
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = spine[Math.floor(hash(tx * 11 + i, ty * 7) * spine.length)];
      ctx.fillRect(x + 6 + i * 6.4, y + 8, 4.6, TILE - 16);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 2, y + TILE - 6, TILE - 4, 4);
  }
  if (ch === 'L') {
    ctx.fillStyle = PALETTE.lowCover;
    ctx.fillRect(x + 2, y + 10, TILE - 4, TILE - 14);
    ctx.fillStyle = PALETTE.lowCoverEdge;
    ctx.fillRect(x + 2, y + 10, TILE - 4, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 2, y + TILE - 5, TILE - 4, 3);
  }
  if (ch === 'g') {
    ctx.fillStyle = '#2a2f3d';
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#8b96ac';
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(x + 9 + i * 8, y + 3); ctx.lineTo(x + 9 + i * 8, y + TILE - 3); ctx.stroke();
    }
    ctx.fillStyle = '#ffb03a';
    ctx.fillRect(x + 13, y + 14, 9, 8);
  }
  if (ch === 'E') {
    ctx.fillStyle = '#14382a';
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = PALETTE.exit;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = PALETTE.exit;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 11); ctx.lineTo(x + 24, y + 17); ctx.lineTo(x + 12, y + 23); ctx.closePath(); ctx.fill();
  }
  if (ch === 'O') {
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(x + 6, y + 22, TILE - 12, 8);
    ctx.strokeStyle = PALETTE.objective;
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2 - 3, 9.5, 0, 7); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 4 + 0.4;
      ctx.moveTo(x + TILE / 2, y + TILE / 2 - 3);
      ctx.lineTo(x + TILE / 2 + Math.cos(a) * 9, y + TILE / 2 - 3 + Math.sin(a) * 9);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2 - 3, 2.6, 0, 7); ctx.fill();
  }
  if (ch === 'v') {
    ctx.fillStyle = PALETTE.valuable;
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2, y + TILE / 2 - 8); ctx.lineTo(x + TILE / 2 + 6, y + TILE / 2);
    ctx.lineTo(x + TILE / 2, y + TILE / 2 + 8); ctx.lineTo(x + TILE / 2 - 6, y + TILE / 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(x + TILE / 2 - 1.5, y + TILE / 2 - 2, 1.7, 0, 7); ctx.fill();
  }
}

/** Draw every tile of the field: floors, walls and props. */
export function drawScenery(ctx, level) {
  ctx.fillStyle = '#141824';
  ctx.fillRect(FIELD.x - 4, FIELD.y - 4, FIELD.cols * TILE + 8, FIELD.rows * TILE + 8);
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) drawTile(ctx, level, tx, ty);
  }
}

/** Large soft pools of lamplight over the floor: warm where a lamp burns, cool elsewhere. */
export function drawLampPools(ctx, level) {
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) {
      if (tileAt(level, tx, ty) !== '*') continue;
      const { x, y } = tileXY(tx, ty);
      const cx = x + TILE / 2, cy = y + TILE / 2;
      const r = TILE * 2.35;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      g.addColorStop(0, PALETTE.lampGlow + '0.42)');
      g.addColorStop(0.5, PALETTE.lampGlow + '0.17)');
      g.addColorStop(1, PALETTE.lampGlow + '0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,200,0.9)';
      ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, 7); ctx.fill();
    }
  }
}
