// render.js — drawing the guildhall in play: cones, wardens, the lifter, callouts and speech.
import { TILE, FIELD, PALETTE, GUARD, CAMERA } from './config.js';
import { tileAt } from './levels.js';
import { tileCenter, conePolygon } from './vision.js';
import { drawScenery, drawLampPools } from './scenery.js';

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

function pill(ctx, x, y, text, fg = PALETTE.ink, bg = 'rgba(10,12,18,0.82)', size = 13) {
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - size * 0.85, w, size * 1.7, 6); ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  return w;
}

/** A warden's spoken line: pale bubble, dark words, a tail down to the speaker. */
function bubble(ctx, x, y, text) {
  ctx.font = '700 13.5px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 20;
  const bx = Math.max(FIELD.x + w / 2 + 2, Math.min(FIELD.x + FIELD.cols * TILE - w / 2 - 2, x));
  ctx.fillStyle = '#f5efdd';
  ctx.beginPath(); ctx.roundRect(bx - w / 2, y - 26, w, 25, 8); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 2); ctx.lineTo(x + 5, y - 2); ctx.lineTo(x, y + 5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#262019';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx, y - 13);
}

/** Seconds a warden needs to walk one patrol leg, printed on the dashed loop itself. */
function legLabel(ctx, x, y, text) {
  ctx.font = '700 11px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = 'rgba(8,10,16,0.62)';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 8, w, 16, 4); ctx.fill();
  ctx.fillStyle = '#e6ecf8';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function drawWorld(ctx, state) {
  const level = state.level;
  drawScenery(ctx, level);
  drawLampPools(ctx, level);

  // Patrol loops: dashed, timed, so a route can be learned at a glance.
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.strokeStyle = 'rgba(240,244,255,0.34)';
  ctx.lineWidth = 1.6;
  for (const g of state.guards) {
    ctx.beginPath();
    g.path.forEach((wp, i) => (i === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
    ctx.closePath(); ctx.stroke();
    for (const wp of g.path) {
      ctx.fillStyle = 'rgba(240,244,255,0.45)';
      ctx.beginPath(); ctx.arc(wp.x, wp.y, 2.6, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
  for (const g of state.guards) {
    const n = g.path.length;
    const speed = GUARD.patrolSpeed * (g.speedScale ?? 1);
    for (let i = 0; i < n; i += 1) {
      if (n === 2 && i === 1) continue; // the return leg lies on the outbound one
      const a = g.path[i], b = g.path[(i + 1) % n];
      const secs = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / speed));
      legLabel(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2 - (n === 2 ? 11 : 0), `${secs}s`);
    }
  }

  // Noise: big blue rings are sound travelling; small amber rings are footsteps.
  for (const n of state.noises) {
    const k = n.age / n.life;
    if (n.kind === 'step') {
      ctx.strokeStyle = `rgba(255,196,120,${0.65 * (1 - k)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.5 + 0.7 * k), 0, 7); ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(160,220,255,${0.75 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.25 + 0.75 * k), 0, 7); ctx.stroke();
    }
  }

  // Vision cones, clipped by walls, crates — and by smoke.
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
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9.5, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.camera;
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.dir) * 3, cam.y + Math.sin(cam.dir) * 3, 4.6, 0, 7); ctx.fill();
    pill(ctx, cam.x, cam.y - 22, 'BRASS EYE', PALETTE.camera, 'rgba(10,14,20,0.7)', 12);
  }

  // Coin in flight.
  for (const pr of state.projectiles) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(pr.tx, pr.ty, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 4.6, 0, 7); ctx.fill();
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
    pill(ctx, g.x, g.y - 26, g.name, '#f3e9d8', 'rgba(10,12,18,0.66)', 12);
    if (g.suspicion > 0.05 && g.state !== 'alert') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(g.x - 15, g.y + 17, 30, 5);
      ctx.fillStyle = g.suspicion >= 0.38 ? '#ff7a1a' : '#ffb03a';
      ctx.fillRect(g.x - 15, g.y + 17, 30 * Math.min(1, g.suspicion), 5);
    }
    if (g.state === 'alert') pill(ctx, g.x, g.y - 48, '!', '#ffffff', 'rgba(214,32,24,0.92)', 19);
    else if (g.suspicion >= 0.38) pill(ctx, g.x, g.y - 48, '?', '#1c1408', 'rgba(255,176,58,0.95)', 19);
    if (g.say && state.time < g.say.until) bubble(ctx, g.x, g.y - 58, g.say.text);
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
  pill(ctx, p.x, p.y - 26, p.sneak ? 'YOU · SNEAKING' : 'YOU', '#dceaff', 'rgba(10,12,18,0.66)', 12);

  // Objective + exit labels, always readable.
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) {
      const ch = tileAt(level, tx, ty);
      const c = tileCenter(tx, ty);
      if (ch === 'O') pill(ctx, c.x, c.y - 28, level.objectiveName.toUpperCase(), '#ffe98a', 'rgba(10,12,18,0.78)', 13.5);
      if (ch === 'E') pill(ctx, c.x, c.y - 28, 'EXIT', '#a9f5c6', 'rgba(10,12,18,0.78)', 13.5);
    }
  }

  // Staged and live callouts, then floating tags.
  for (const c of state.callouts) {
    const pos = tileCenter(c.tx, c.ty);
    pill(ctx, pos.x, pos.y, c.text, '#ffe9b8', 'rgba(24,18,6,0.85)', 15);
  }
  for (const t of state.tags) {
    if (state.time < t.until) pill(ctx, t.x, t.y, t.text, '#bfe3ff', 'rgba(8,16,26,0.88)', 15);
  }
}
