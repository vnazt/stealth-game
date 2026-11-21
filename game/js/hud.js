// hud.js — the chrome around the guildhall: detection state, meters, warden roster, legend, results.
import { VIEW, FIELD, TILE, RAIL, PALETTE, CONTROLS_LINE, MAX_STRIKES } from './config.js';
import { roomState } from './guards.js';
import { lightWord } from './lighting.js';
import { tileAt } from './levels.js';

export function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ADVICE = {
  HIDDEN: 'Tucked out of sight. Move when the cones turn away.',
  UNSEEN: 'No eyes on you — but lamplight carries across a room.',
  SUSPICIOUS: 'Something caught an eye. Freeze, or break the line of sight.',
  SPOTTED: 'Run. Break their line of sight. Hide.',
};
const STATE_COLOR = { HIDDEN: PALETTE.good, UNSEEN: '#bfe3ff', SUSPICIOUS: PALETTE.warn, SPOTTED: PALETTE.bad };

function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = PALETTE.panel;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + 12, y + 17);
}

function meter(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.roundRect(x, y, w, 9, 4); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, Math.max(4, w * Math.min(1, frac)), 9, 4); ctx.fill();
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) { ctx.fillText(line, x, yy); line = ''; yy += lh; }
    line += w + ' ';
  }
  ctx.fillText(line, x, yy);
  return yy;
}

export function drawHUD(ctx, state) {
  const rs = roomState(state);
  // Top bar over the field.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`HUSHWORK — ${state.level.name.toUpperCase()}`, FIELD.x + 2, 26);
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText(state.hasObjective ? 'MASTERWORK TAKEN — REACH THE EXIT HATCH' : state.level.objectiveLine, FIELD.x + 2, 45);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${fmtTime(state.time)}    LOOT ${state.lootTaken}/${state.lootTotal}    STRIKES ${'●'.repeat(state.strikes)}${'○'.repeat(MAX_STRIKES - state.strikes)}`, FIELD.x + FIELD.cols * TILE, 26);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 11.5px system-ui, sans-serif';
  ctx.fillText(state.hasObjective ? 'the masterwork is in your bag' : `objective: ${state.level.objectiveName}`, FIELD.x + FIELD.cols * TILE, 45);
  ctx.textAlign = 'left';

  const x = RAIL.x + 6, w = RAIL.width - 12;
  let y = FIELD.y - 2;
  // Detection.
  panel(ctx, x, y, w, 84, 'DETECTION');
  ctx.fillStyle = STATE_COLOR[rs];
  ctx.font = '800 25px system-ui, sans-serif';
  ctx.fillText(rs, x + 12, y + 46);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '12px system-ui, sans-serif';
  wrap(ctx, ADVICE[rs], x + 12, y + 64, w - 24, 14);
  y += 92;
  // Visibility + noise.
  panel(ctx, x, y, w, 96, 'VISIBILITY · NOISE');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 13.5px system-ui, sans-serif';
  ctx.fillText(lightWord(state.level, state.player.x, state.player.y), x + 12, y + 38);
  meter(ctx, x + 150, y + 30, w - 162, state.playerVis, state.playerVis > 0.7 ? PALETTE.bad : state.playerVis > 0.4 ? PALETTE.warn : PALETTE.good);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(state.playerNoiseR < 0.4 ? 'SILENT' : state.player.sneak ? 'SOFT STEPS' : 'FOOTSTEPS CARRY', x + 12, y + 66);
  meter(ctx, x + 150, y + 58, w - 162, state.playerNoiseR / 3.2, state.playerNoiseR > 2 ? PALETTE.warn : PALETTE.good);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('sneak (SHIFT) to shrink both', x + 12, y + 86);
  y += 104;
  // Wardens + cameras roster.
  const rows = state.guards.length + state.cameras.length;
  panel(ctx, x, y, w, 40 + rows * 24, 'WARDENS ON PATROL');
  let ry = y + 38;
  for (const g of state.guards) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 12.5px system-ui, sans-serif';
    ctx.fillText(g.name, x + 12, ry);
    ctx.fillStyle = g.state === 'alert' ? PALETTE.bad : g.suspicion >= 0.38 ? PALETTE.warn : PALETTE.inkDim;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(g.state.toUpperCase(), x + 118, ry);
    meter(ctx, x + 196, ry - 8, w - 208, g.suspicion, g.state === 'alert' ? PALETTE.bad : PALETTE.warn);
    ry += 24;
  }
  for (const c of state.cameras) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 12.5px system-ui, sans-serif';
    ctx.fillText('BRASS EYE', x + 12, ry);
    ctx.fillStyle = c.suspicion >= 0.5 ? PALETTE.warn : PALETTE.inkDim;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(c.suspicion >= 0.5 ? 'SUSPICIOUS' : 'SWEEPING', x + 118, ry);
    meter(ctx, x + 196, ry - 8, w - 208, c.suspicion, PALETTE.warn);
    ry += 24;
  }
  y += 48 + rows * 24;
  // Gadgets.
  panel(ctx, x, y, w, 66, 'GADGETS');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText(`◉ COINS ×${state.coinsLeft}      ▓ SMOKE ×${state.smokesLeft}`, x + 12, y + 36);
  ctx.fillStyle = state.level.cutters ? PALETTE.ink : PALETTE.inkDim;
  ctx.fillText(state.level.cutters ? '✂ BOLT CUTTERS — E at a chained gate' : '✂ bolt cutters: not on this heist', x + 12, y + 56);
  y += 74;
  // Heist progress.
  panel(ctx, x, y, w, 58, 'THE FIVE HEISTS');
  ctx.font = '700 12px system-ui, sans-serif';
  for (let i = 0; i < 5; i += 1) {
    const cx = x + 16 + i * 58;
    ctx.fillStyle = i < state.levelIndex ? PALETTE.good : i === state.levelIndex ? PALETTE.warn : 'rgba(255,255,255,0.13)';
    ctx.beginPath(); ctx.arc(cx, y + 36, 10, 0, 7); ctx.fill();
    ctx.fillStyle = '#0d1017';
    ctx.fillText(String(i + 1), cx - 3.5, y + 40);
  }
  y += 66;
  // Field notes / legend — fills the rest of the rail.
  panel(ctx, x, y, w, VIEW.height - y - 34, 'FIELD NOTES · LEGEND');
  const notes = [
    ['amber cone', 'vision — stopped by walls & crates'],
    ['red cone', 'a warden who has your scent'],
    ['blue cone', 'brass eye camera — sweeps, blind behind'],
    ['crates', 'full cover: sight cannot pass'],
    ['low cover', 'sneak (crouch) to vanish behind it'],
    ['fronds', 'hidden while still or sneaking'],
    ['lamplight', 'seen from across the room'],
    ['dark floor', 'slower to be seen'],
    ['dashed loop', 'patrol route — learn it, time it'],
    ['ring', 'noise: footsteps, coins, cut chains'],
  ];
  ctx.font = '11.5px system-ui, sans-serif';
  let ny = y + 36;
  for (const [a, b] of notes) {
    ctx.fillStyle = '#ffd98f';
    ctx.font = '700 11.5px system-ui, sans-serif';
    ctx.fillText(a, x + 12, ny);
    ctx.fillStyle = PALETTE.inkDim;
    ctx.font = '11.5px system-ui, sans-serif';
    ctx.fillText(b, x + 92, ny);
    ny += 16.5;
  }

  // Alarm banner.
  if (state.banner && state.time < state.banner.until) {
    ctx.font = '800 16px system-ui, sans-serif';
    const bw = ctx.measureText(state.banner.text).width + 34;
    ctx.fillStyle = state.banner.bad ? 'rgba(160,20,14,0.92)' : 'rgba(120,74,8,0.92)';
    ctx.beginPath(); ctx.roundRect(FIELD.x + (FIELD.cols * TILE - bw) / 2, FIELD.y + 10, bw, 34, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.banner.text, FIELD.x + (FIELD.cols * TILE) / 2, FIELD.y + 28);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // Controls footer, in every view.
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(CONTROLS_LINE, VIEW.width / 2, VIEW.height - 9);
  ctx.textAlign = 'left';
}

/** The results screen: route traced over the level map, grade, and the night's numbers. */
export function drawResults(ctx, state, result) {
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText(result.title, 44, 62);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(result.subtitle, 44, 88);

  // Mini map with the route traced over it.
  const mw = 660, mh = 456, mx = 44, my = 116;
  const sx = mw / (FIELD.cols * TILE), sy = mh / (FIELD.rows * TILE);
  ctx.fillStyle = '#141824';
  ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
  const colors = { '#': '#3d4356', C: '#8a6a42', L: '#5d7350', G: '#2e4a38', '*': '#4a3d28', ',': '#171b26', g: '#7d879c', E: '#1d5c38', O: '#8a6d1f' };
  for (let ty = 0; ty < FIELD.rows; ty += 1) {
    for (let tx = 0; tx < FIELD.cols; tx += 1) {
      const ch = tileAt(result.level, tx, ty);
      ctx.fillStyle = colors[ch] ?? ((tx + ty) % 2 ? '#262b38' : '#232733');
      ctx.fillRect(mx + tx * TILE * sx, my + ty * TILE * sy, TILE * sx + 0.5, TILE * sy + 0.5);
    }
  }
  ctx.strokeStyle = '#7ce7ff';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  result.route.forEach((p, i) => {
    const px = mx + (p.x - FIELD.x) * sx, py = my + (p.y - FIELD.y) * sy;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  if (result.route.length) {
    const s = result.route[0], e = result.route[result.route.length - 1];
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mx + (s.x - FIELD.x) * sx, my + (s.y - FIELD.y) * sy, 4, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.good;
    ctx.beginPath(); ctx.arc(mx + (e.x - FIELD.x) * sx, my + (e.y - FIELD.y) * sy, 4.6, 0, 7); ctx.fill();
  }
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('YOUR ROUTE THROUGH THE HALL — traced from the night watch log', mx, my + mh + 24);

  // Grade + stats.
  const gx = 760;
  ctx.fillStyle = PALETTE.good;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillText(result.grade, gx, 168);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText('THE GUILDHALL GRADE', gx, 190);
  let yy = 238;
  for (const [k, v] of result.lines) {
    ctx.fillStyle = PALETTE.inkDim;
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(k, gx, yy);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v, 1236, yy);
    ctx.textAlign = 'left';
    yy += 30;
  }
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '700 15px system-ui, sans-serif';
  wrap(ctx, result.verdict, gx, yy + 16, 470, 20);
  ctx.fillStyle = PALETTE.good;
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.fillText(result.next, gx, 716);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(CONTROLS_LINE, 44, VIEW.height - 9);
}
