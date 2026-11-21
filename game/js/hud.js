// hud.js — the chrome around the guildhall: detection state, meters, warden roster, legend, results.
import { VIEW, FIELD, TILE, RAIL, PALETTE, CONTROLS_LINE, MAX_STRIKES } from './config.js';
import { roomState } from './guards.js';
import { lightWord } from './lighting.js';
import { drawWorld } from './render.js';

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
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + 12, y + 18);
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
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`HUSHWORK — ${state.level.name.toUpperCase()}`, FIELD.x + 2, 27);
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText(state.hasObjective ? 'MASTERWORK TAKEN — REACH THE EXIT HATCH' : state.level.objectiveLine, FIELD.x + 2, 47);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${fmtTime(state.time)}    LOOT ${state.lootTaken}/${state.lootTotal}    STRIKES ${'●'.repeat(state.strikes)}${'○'.repeat(MAX_STRIKES - state.strikes)}`, FIELD.x + FIELD.cols * TILE, 27);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText(state.hasObjective ? 'the masterwork is in your bag' : `objective: ${state.level.objectiveName}`, FIELD.x + FIELD.cols * TILE, 47);
  ctx.textAlign = 'left';

  const x = RAIL.x + 6, w = RAIL.width - 12;
  let y = FIELD.y - 2;
  // Detection.
  panel(ctx, x, y, w, 90, 'DETECTION');
  ctx.fillStyle = STATE_COLOR[rs];
  ctx.font = '800 31px system-ui, sans-serif';
  ctx.fillText(rs, x + 12, y + 50);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '13px system-ui, sans-serif';
  wrap(ctx, ADVICE[rs], x + 12, y + 70, w - 24, 15);
  y += 98;
  // Visibility + noise.
  panel(ctx, x, y, w, 100, 'VISIBILITY · NOISE');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 14.5px system-ui, sans-serif';
  ctx.fillText(lightWord(state.level, state.player.x, state.player.y), x + 12, y + 40);
  meter(ctx, x + 146, y + 32, w - 158, state.playerVis, state.playerVis > 0.7 ? PALETTE.bad : state.playerVis > 0.4 ? PALETTE.warn : PALETTE.good);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(state.playerNoiseR < 0.4 ? 'SILENT' : state.player.sneak ? 'SOFT STEPS' : 'FOOTSTEPS CARRY', x + 12, y + 68);
  meter(ctx, x + 146, y + 60, w - 158, state.playerNoiseR / 3.2, state.playerNoiseR > 2 ? PALETTE.warn : PALETTE.good);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '11.5px system-ui, sans-serif';
  ctx.fillText('sneak (SHIFT) to shrink both', x + 12, y + 90);
  y += 106;
  // Wardens + cameras roster.
  const rows = state.guards.length + state.cameras.length;
  panel(ctx, x, y, w, 38 + rows * 23, 'WARDENS ON PATROL');
  let ry = y + 36;
  for (const g of state.guards) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(g.name, x + 12, ry);
    ctx.fillStyle = g.state === 'alert' ? PALETTE.bad : g.suspicion >= 0.38 ? PALETTE.warn : PALETTE.inkDim;
    ctx.font = '600 11.5px system-ui, sans-serif';
    ctx.fillText(g.state.toUpperCase(), x + 116, ry);
    meter(ctx, x + 188, ry - 8, w - 200, g.suspicion, g.state === 'alert' ? PALETTE.bad : PALETTE.warn);
    ry += 23;
  }
  for (const c of state.cameras) {
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText('BRASS EYE', x + 12, ry);
    ctx.fillStyle = c.suspicion >= 0.5 ? PALETTE.warn : PALETTE.inkDim;
    ctx.font = '600 11.5px system-ui, sans-serif';
    ctx.fillText(c.suspicion >= 0.5 ? 'SUSPICIOUS' : 'SWEEPING', x + 116, ry);
    meter(ctx, x + 188, ry - 8, w - 200, c.suspicion, PALETTE.warn);
    ry += 23;
  }
  y += 46 + rows * 23;
  // Gadgets.
  panel(ctx, x, y, w, 68, 'GADGETS');
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText(`◉ COINS ×${state.coinsLeft}      ▓ SMOKE ×${state.smokesLeft}`, x + 12, y + 38);
  ctx.fillStyle = state.level.cutters ? PALETTE.ink : PALETTE.inkDim;
  ctx.fillText(state.level.cutters ? '✂ BOLT CUTTERS — E cuts gates' : '✂ bolt cutters: not on this heist', x + 12, y + 59);
  y += 76;
  // Heist progress.
  panel(ctx, x, y, w, 60, 'THE FIVE HEISTS');
  ctx.font = '700 12.5px system-ui, sans-serif';
  for (let i = 0; i < 5; i += 1) {
    const cx = x + 18 + i * 48;
    ctx.fillStyle = i < state.levelIndex ? PALETTE.good : i === state.levelIndex ? PALETTE.warn : 'rgba(255,255,255,0.13)';
    ctx.beginPath(); ctx.arc(cx, y + 38, 10.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#0d1017';
    ctx.fillText(String(i + 1), cx - 3.5, y + 42);
  }
  y += 68;
  // Field notes / legend — short rows that survive being shrunk into the sheet.
  panel(ctx, x, y, w, VIEW.height - y - 34, 'FIELD NOTES · LEGEND');
  const notes = [
    ['amber cone', 'warden vision'],
    ['red cone', 'has your scent'],
    ['blue cone', 'camera sweep'],
    ['crates & kin', 'sight stops dead'],
    ['low cover', 'sneak to vanish'],
    ['fronds', 'still = unseen'],
    ['lamplight', 'seen from afar'],
    ['dashed loop', 'patrol, timed'],
    ['ring', 'noise travels'],
  ];
  let ny = y + 40;
  for (const [a, b] of notes) {
    ctx.fillStyle = '#ffd98f';
    ctx.font = '700 12.5px system-ui, sans-serif';
    ctx.fillText(a, x + 12, ny);
    ctx.fillStyle = PALETTE.inkDim;
    ctx.font = '12.5px system-ui, sans-serif';
    ctx.fillText(b, x + 100, ny);
    ny += 18;
  }

  // Alarm banner.
  if (state.banner && state.time < state.banner.until) {
    ctx.font = '800 19px system-ui, sans-serif';
    const bw = ctx.measureText(state.banner.text).width + 38;
    ctx.fillStyle = state.banner.bad ? 'rgba(160,20,14,0.92)' : 'rgba(120,74,8,0.92)';
    ctx.beginPath(); ctx.roundRect(FIELD.x + (FIELD.cols * TILE - bw) / 2, FIELD.y + 10, bw, 40, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.banner.text, FIELD.x + (FIELD.cols * TILE) / 2, FIELD.y + 31);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // Controls footer, in every view.
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(CONTROLS_LINE, VIEW.width / 2, VIEW.height - 9);
  ctx.textAlign = 'left';
}

const GRADE_COLOR = { GHOST: PALETTE.good, SILENT: PALETTE.good, SHADE: PALETTE.warn, RUMBLED: PALETTE.bad, CAUGHT: PALETTE.bad };

/** The results screen: the finished hall itself, route traced over it, grade and the night's numbers. */
export function drawResults(ctx, state, result) {
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText(result.title, 36, 56);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(result.subtitle, 36, 84);

  // The actual finished level — walls, cones and wardens frozen as the heist ended —
  // rendered by the game's own world renderer, with the night's route traced over it.
  const s = 0.76, ox = 36, oy = 108;
  ctx.save();
  ctx.translate(ox - FIELD.x * s, oy - FIELD.y * s);
  ctx.scale(s, s);
  drawWorld(ctx, state);
  ctx.strokeStyle = '#7ce7ff';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  result.route.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  if (result.route.length) {
    const st = result.route[0], en = result.route[result.route.length - 1];
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(st.x, st.y, 6, 0, 7); ctx.fill();
    ctx.fillStyle = PALETTE.good;
    ctx.beginPath(); ctx.arc(en.x, en.y, 7, 0, 7); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText('THE HALL AS YOU LEFT IT — your route traced from the night watch log', ox, oy + FIELD.rows * TILE * s + 24);

  // Grade + stats panel.
  const px = 812, pw = 432, py = 108, ph = 543;
  ctx.fillStyle = PALETTE.panel;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 10); ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GRADE_COLOR[result.grade] ?? PALETTE.good;
  ctx.font = '800 56px system-ui, sans-serif';
  ctx.fillText(result.grade, px + 22, py + 72);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText('THE GUILDHALL GRADE', px + 22, py + 96);
  let yy = py + 140;
  const statRow = (k, v) => {
    ctx.fillStyle = PALETTE.inkDim;
    ctx.font = '600 14.5px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(k, px + 22, yy);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '700 15.5px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v, px + pw - 22, yy);
    ctx.textAlign = 'left';
    yy += 30;
  };
  for (const [k, v] of result.lines) statRow(k, v);
  if (result.campaign && result.campaign.length) {
    yy += 8;
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.beginPath(); ctx.moveTo(px + 22, yy - 14); ctx.lineTo(px + pw - 22, yy - 14); ctx.stroke();
    ctx.fillStyle = PALETTE.inkDim;
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('THE NIGHT SO FAR', px + 22, yy + 8);
    yy += 34;
    for (const [k, v] of result.campaign) statRow(k, v);
  }
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '700 15.5px system-ui, sans-serif';
  wrap(ctx, result.verdict, px + 22, yy + 18, pw - 44, 21);
  ctx.fillStyle = PALETTE.good;
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.fillText(result.next, px, py + ph + 46);
  ctx.fillStyle = PALETTE.inkDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(CONTROLS_LINE, 36, VIEW.height - 9);
}
