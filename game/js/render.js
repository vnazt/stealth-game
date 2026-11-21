// render.js — drawing the guildhall: floors, cover, cones, wardens, the lifter, and in-scene callouts.
import { TILE, FIELD, PALETTE } from './config.js';
import { tileAt } from './levels.js';
import { tileCenter, conePolygon } from './vision.js';
import { GUARD, CAMERA } from './config.js';

function tileXY(tx, ty) {
  return { x: FIELD.x + tx * TILE, y: FIELD.y + ty * TILE };
}

/** Deterministic per-tile hash, so grass blades and floor wear never flicker. */
function hash(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function drawTile(ctx, level, tx, ty) {
  const ch = tileAt(level, tx, ty);
  const { x, y } = tileXY(tx, ty);
  ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
  if (ch === ',') ctx.fillStyle = PALETTE.darkFloor;
  if (ch === '*') ctx.fillStyle = PALETTE.lampFloor;
  if (ch === 'G') ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(x, y, TILE, TILE);
  if (ch === '*') {
    const g = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 30);
    g.addColorStop(0, PALETTE.lampGlow + '0.55)');
    g.addColorStop(1, PALETTE.lampGlow + '0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, y - 14, TILE + 28, TILE + 28);
    ctx.fillStyle = '#ffca6a';
    ctx.beginPath(); ctx.arc(x + 16, y + 16, 3.4, 0, 7); ctx.fill();
  }
  if (ch === 'G') {
    ctx.strokeStyle = PALETTE.grassBlade;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i += 1) {
      const bx = x + 5 + hash(tx * 7 + i, ty) * 22;
      const by = y + TILE - 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + (hash(tx, ty * 3 + i) - 0.5) * 6, by - 9, bx + (hash(tx + i, ty + 9) - 0.5) * 9, by - 13 - hash(tx, ty + i) * 6);
      ctx.stroke();
    }
  }
  if (ch === '#') {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(x, y, TILE, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + TILE - 5, TILE, 5);
  }
  if (ch === 'C') {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + TILE - 3, y + TILE - 3);
    ctx.moveTo(x + TILE - 3, y + 3); ctx.lineTo(x + 3, y + TILE - 3);
    ctx.stroke();
  }
  if (ch === 'L') {
    ctx.fillStyle = PALETTE.lowCover;
    ctx.fillRect(x + 2, y + 9, TILE - 4, TILE - 13);
    ctx.fillStyle = PALETTE.lowCoverEdge;
    ctx.fillRect(x + 2, y + 9, TILE - 4, 5);
  }
  if (ch === 'g') {
    ctx.fillStyle = '#2a2f3d';
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#7d879c';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(x + 8 + i * 8, y + 3); ctx.lineTo(x + 8 + i * 8, y + TILE - 3); ctx.stroke();
    }
    ctx.fillStyle = '#ffb03a';
    ctx.fillRect(x + 12, y + 13, 8, 7);
  }
  if (ch === 'E') {
    ctx.fillStyle = '#123324';
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = PALETTE.exit;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = PALETTE.exit;
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 10); ctx.lineTo(x + 22, y + 16); ctx.lineTo(x + 11, y + 22); ctx.closePath(); ctx.fill();
  }
  if (ch === 'O') {
    const c = tileCenter(tx, ty);
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(x + 6, y + 20, TILE - 12, 7);
    ctx.strokeStyle = PALETTE.objective;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(c.x, c.y - 3, 8.5, 0, 7); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 4 + 0.4;
      ctx.moveTo(c.x, c.y - 3);
      ctx.lineTo(c.x + Math.cos(a) * 8, c.y - 3 + Math.sin(a) * 8);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(c.x, c.y - 3, 2.4, 0, 7); ctx.fill();
  }
  if (ch === 'v') {
    const c = tileCenter(tx, ty);
    ctx.fillStyle = PALETTE.valuable;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x + 5.5, c.y); ctx.lineTo(c.x, c.y + 7); ctx.lineTo(c.x - 5.5, c.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(c.x - 1.5, c.y - 2, 1.6, 0, 7); ctx.fill();
  }
}

function drawCone(ctx, points, fill, edge) {
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function pill(ctx, x, y, text, fg = PALETTE.ink, bg = 'rgba(10,12,18,0.82)', size = 12.5) {
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 11, w, 21, 6); ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  return w;
}

export function drawWorld(ctx, state) {
  const level = state.level;
  ctx.fillStyle = '#141824';
  ctx.fillRect(FIELD.x - 4, FIELD.y - 4, FIELD.cols * TILE + 8, FIELD.rows * TILE + 8);
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) drawTile(ctx, level, tx, ty);
  }

  // Patrol loops: dashed, so a route can be learned at a glance.
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.strokeStyle = 'rgba(240,244,255,0.30)';
  ctx.lineWidth = 1.6;
  for (const g of state.guards) {
    ctx.beginPath();
    g.path.forEach((wp, i) => (i === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
    ctx.closePath(); ctx.stroke();
    for (const wp of g.path) {
      ctx.fillStyle = 'rgba(240,244,255,0.4)';
      ctx.beginPath(); ctx.arc(wp.x, wp.y, 2.4, 0, 7); ctx.fill();
    }
  }
  ctx.restore();

  // Noise rings: footsteps and landed coins.
  for (const n of state.noises) {
    const k = n.age / n.life;
    ctx.strokeStyle = `rgba(160,220,255,${0.75 * (1 - k)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.25 + 0.75 * k), 0, 7); ctx.stroke();
  }

  // Vision cones, clipped by walls and crates.
  const smoke = state.smokes.filter((s) => state.time < s.until);
  for (const cam of state.cameras) {
    const fill = cam.suspicion >= 0.5 ? PALETTE.coneSus : PALETTE.coneCam;
    const edge = cam.suspicion >= 0.5 ? PALETTE.coneSusEdge : PALETTE.coneCamEdge;
    drawCone(ctx, conePolygon(level, cam.x, cam.y, cam.dir, CAMERA.viewRange, CAMERA.viewHalfAngle, smoke), fill, edge);
  }
  for (const g of state.guards) {
    const fill = g.state === 'alert' ? PALETTE.coneAlert : g.suspicion >= 0.38 ? PALETTE.coneSus : PALETTE.coneCalm;
    const edge = g.state === 'alert' ? PALETTE.coneAlertEdge : g.suspicion >= 0.38 ? PALETTE.coneSusEdge : PALETTE.coneCalmEdge;
    drawCone(ctx, conePolygon(level, g.x, g.y, g.dir, GUARD.viewRange, GUARD.viewHalfAngle, smoke), fill, edge);
  }

  // Smoke puffs blind whatever is behind them.
  for (const s of state.smokes) {
    const left = s.until - state.time;
    if (left < -0.6) continue;
    const a = Math.max(0, Math.min(0.55, left / 1.2)) + 0.18;
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    g.addColorStop(0, `rgba(190,198,214,${a})`);
    g.addColorStop(1, 'rgba(190,198,214,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
  }

  // Cameras: a brass eye on the wall.
  for (const cam of state.cameras) {
    ctx.fillStyle = '#31405a';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.camera;
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.dir) * 3, cam.y + Math.sin(cam.dir) * 3, 4.4, 0, 7); ctx.fill();
    pill(ctx, cam.x, cam.y - 20, 'BRASS EYE', PALETTE.camera, 'rgba(10,14,20,0.7)', 10.5);
  }

  // Coin in flight.
  for (const pr of state.projectiles) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(pr.tx, pr.ty, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 4.4, 0, 7); ctx.fill();
  }

  // Wardens: pale coats, red trim — they must pop against the floor.
  for (const g of state.guards) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(g.x, g.y + 3, g.radius, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, 7); ctx.fill();
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.radius - 1.5, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#20242e';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * (g.radius + 5), g.y + Math.sin(g.dir) * (g.radius + 5));
    ctx.stroke();
    pill(ctx, g.x, g.y - 24, g.name, '#f3e9d8', 'rgba(10,12,18,0.66)', 10.5);
    if (g.suspicion > 0.05 && g.state !== 'alert') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(g.x - 14, g.y + 16, 28, 4.6);
      ctx.fillStyle = g.suspicion >= 0.38 ? '#ff7a1a' : '#ffb03a';
      ctx.fillRect(g.x - 14, g.y + 16, 28 * Math.min(1, g.suspicion), 4.6);
    }
    if (g.state === 'alert') pill(ctx, g.x, g.y - 42, '!', '#ffffff', 'rgba(214,32,24,0.92)', 15);
    else if (g.suspicion >= 0.38) pill(ctx, g.x, g.y - 42, '?', '#1c1408', 'rgba(255,176,58,0.95)', 15);
  }

  // The lifter. A soft ring shows the noise your pace is making.
  const p = state.player;
  if (state.playerNoiseR > 0.4) {
    ctx.strokeStyle = 'rgba(160,220,255,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(p.x, p.y, state.playerNoiseR * TILE, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(p.x, p.y + 3, p.radius, 0, 7); ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, 7); ctx.fill();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radius - 1.5, 0, 7); ctx.stroke();
  ctx.fillStyle = '#20242e';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.face) * 4, p.y + Math.sin(p.face) * 4, 3.4, 0, 7); ctx.fill();
  pill(ctx, p.x, p.y - 24, p.sneak ? 'YOU · SNEAKING' : 'YOU', '#dceaff', 'rgba(10,12,18,0.66)', 10.5);

  // Objective + exit labels, always readable.
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) {
      const ch = tileAt(level, tx, ty);
      const c = tileCenter(tx, ty);
      if (ch === 'O') pill(ctx, c.x, c.y - 26, level.objectiveName.toUpperCase(), '#ffe98a', 'rgba(10,12,18,0.78)', 11);
      if (ch === 'E') pill(ctx, c.x, c.y - 26, 'EXIT', '#a9f5c6', 'rgba(10,12,18,0.78)', 11);
    }
  }

  // Staged and live callouts, then floating tags.
  for (const c of state.callouts) {
    const pos = tileCenter(c.tx, c.ty);
    pill(ctx, pos.x, pos.y, c.text, '#ffe9b8', 'rgba(24,18,6,0.85)', 12);
  }
  for (const t of state.tags) {
    if (state.time < t.until) pill(ctx, t.x, t.y, t.text, '#bfe3ff', 'rgba(8,16,26,0.88)', 12.5);
  }
}
