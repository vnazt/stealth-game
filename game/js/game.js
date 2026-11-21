// game.js — Hushwork's boot, fixed-step loop, screens and the rules that tie the systems together.
import { VIEW, STEP, PLAYER, MAX_STRIKES } from './config.js';
import { LEVELS } from './levels.js';
import { tileCenter, tileOf, moveActor } from './vision.js';
import { lightAt } from './lighting.js';
import { emitNoise, updateNoises } from './hearing.js';
import { createGuard, createCamera, updateGuard, updateCamera } from './guards.js';
import { throwCoin, dropSmoke, updateGadgets } from './gadgets.js';
import { drawWorld } from './render.js';
import { drawHUD, drawResults, fmtTime } from './hud.js';
import { input, bindInput, moveVector, endFrame } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const status = document.getElementById('status');

function toWorld(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return { x: ((cx - r.left) / r.width) * VIEW.width, y: ((cy - r.top) / r.height) * VIEW.height };
}
bindInput(canvas, toWorld);

export function countTiles(level, ch) {
  let n = 0;
  for (const row of level.map) for (const c of row) if (c === ch) n += 1;
  return n;
}

function findTile(level, ch) {
  for (let ty = 0; ty < level.map.length; ty += 1) {
    const tx = level.map[ty].indexOf(ch);
    if (tx !== -1) return { tx, ty };
  }
  return { tx: 1, ty: 1 };
}

export function setTile(state, tx, ty, ch) {
  const row = state.level.map[ty];
  state.level.map[ty] = row.substring(0, tx) + ch + row.substring(tx + 1);
}

export function loadLevel(state, index) {
  const def = LEVELS[index];
  state.levelIndex = index;
  state.level = { ...def, map: def.map.slice() };
  const start = findTile(state.level, 'P');
  const sc = tileCenter(start.tx, start.ty);
  state.player = { x: sc.x, y: sc.y, radius: PLAYER.radius, sneak: false, face: 0, moving: false };
  state.guards = def.guards.map(createGuard);
  state.cameras = def.cameras.map(createCamera);
  state.coinsLeft = def.coins;
  state.smokesLeft = def.smokes;
  state.lootTotal = countTiles(state.level, 'v');
  state.lootTaken = 0;
  state.hasObjective = false;
  state.strikes = 0;
  state.levelSpotted = 0;
  state.levelTime0 = state.time;
  state.noises = [];
  state.smokes = [];
  state.projectiles = [];
  state.tags = [];
  state.events = [];
  state.callouts = def.callouts.slice();
  state.route = [{ x: sc.x, y: sc.y }];
  state.routeTimer = 0;
  state.stepTimer = 0;
  state.banner = null;
  state.playerVis = 0.5;
  state.playerNoiseR = 0;
}

export function newState() {
  const state = {
    screen: 'title', paused: false, time: 0, closeCalls: 0, coinsThrown: 0,
    totals: { loot: 0, lootTotal: 0, spotted: 0, time: 0, masterworks: 0 },
    result: null,
  };
  loadLevel(state, 0);
  return state;
}

const state = newState();

function gradeFor(spotted, loot, lootTotal) {
  if (spotted === 0 && loot >= lootTotal) return 'GHOST';
  if (spotted === 0) return 'SILENT';
  if (spotted === 1) return 'SHADE';
  return 'RUMBLED';
}

function levelResult(state, title, subtitle) {
  const loot = state.lootTaken, total = state.lootTotal;
  const treasuresTonight = LEVELS.slice(0, state.levelIndex + 1)
    .reduce((n, def) => n + def.map.join('').split('').filter((c) => c === 'v').length, 0);
  return {
    title, subtitle,
    grade: gradeFor(state.levelSpotted, loot, total),
    level: state.level, route: state.route.slice(),
    lines: [
      ['Masterwork', state.hasObjective ? state.level.objectiveName : 'left behind'],
      ['Treasures lifted', `${loot} / ${total}`],
      ['Times spotted', String(state.levelSpotted)],
      ['Close calls', String(state.closeCalls)],
      ['Coins thrown', String(state.coinsThrown)],
      ['Time in the hall', fmtTime(state.time - state.levelTime0)],
    ],
    campaign: [
      ['Masterworks tonight', `${state.totals.masterworks} / ${LEVELS.length}`],
      ['Treasures tonight', `${state.totals.loot} / ${treasuresTonight}`],
      ['Alarms tonight', String(state.totals.spotted)],
    ],
    verdict: state.levelSpotted === 0
      ? 'No warden can say the hall was entered. The masterwork simply is not there any more.'
      : 'You were seen, and you still walked out. The hall will talk about this night.',
    next: state.levelIndex + 1 < LEVELS.length
      ? `ENTER — NEXT: ${LEVELS[state.levelIndex + 1].name.toUpperCase()}`
      : 'ENTER — THE NIGHT’S LEDGER',
  };
}

function finalResult(state) {
  const t = state.totals;
  return {
    title: 'THE NIGHT’S LEDGER', subtitle: 'All five masterworks, one quiet lifter',
    grade: gradeFor(t.spotted, t.loot, t.lootTotal),
    level: state.level, route: state.route.slice(),
    campaign: [],
    lines: [
      ['Masterworks stolen', '5 / 5'],
      ['Treasures lifted', `${t.loot} / ${t.lootTotal}`],
      ['Times spotted, all night', String(t.spotted)],
      ['Close calls', String(state.closeCalls)],
      ['Coins thrown', String(state.coinsThrown)],
      ['Total time', fmtTime(t.time)],
    ],
    verdict: t.spotted === 0
      ? 'Five halls, five empty pedestals, not one alarm bell rung. A ghost with a bag.'
      : 'The guildhall wakes to five empty pedestals. It will lock its doors earlier now.',
    next: 'ENTER — PLAY THE NIGHT AGAIN',
  };
}

function completeLevel(state) {
  state.totals.loot += state.lootTaken;
  state.totals.lootTotal += state.lootTotal;
  state.totals.spotted += state.levelSpotted;
  state.totals.time = state.time;
  if (state.hasObjective) state.totals.masterworks += 1;
  // Freeze the hall exactly as it was left: no live rings, tags or callouts on the results screen.
  state.noises = [];
  state.tags = [];
  state.callouts = [];
  state.banner = null;
  state.result = levelResult(state, 'CLEAN GETAWAY', `${state.level.name} — ${state.level.objectiveName} lifted`);
  state.screen = 'complete';
}

function updatePlayer(state, dt) {
  const p = state.player;
  const mv = moveVector();
  p.sneak = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  p.moving = mv.active;
  if (mv.active) {
    const speed = p.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    moveActor(state.level, p, mv.x * speed * dt, mv.y * speed * dt);
    p.face = Math.atan2(mv.y, mv.x);
    state.stepTimer -= dt;
    if (state.stepTimer <= 0) {
      state.stepTimer = p.sneak ? 0.5 : 0.36;
      emitNoise(state, p.x, p.y, p.sneak ? PLAYER.sneakNoise : PLAYER.walkNoise);
    }
  }
  const light = lightAt(state.level, p.x, p.y);
  let vis = light * (p.moving ? (p.sneak ? 0.62 : 1.0) : 0.78);
  const { tx, ty } = tileOf(p.x, p.y);
  if (state.level.map[ty][tx] === 'G' && (p.sneak || !p.moving)) vis *= 0.3;
  state.playerVis = Math.max(0, Math.min(1, vis));
  state.playerNoiseR = p.moving ? (p.sneak ? PLAYER.sneakNoise : PLAYER.walkNoise) : 0;

  // Pickups and the exit.
  const here = state.level.map[ty][tx];
  if (here === 'v') { setTile(state, tx, ty, '.'); state.lootTaken += 1; }
  if (here === 'O') {
    setTile(state, tx, ty, '.');
    state.hasObjective = true;
    state.tags.push({ x: p.x, y: p.y - 34, text: 'MASTERWORK TAKEN', until: state.time + 2.4 });
  }
  if (here === 'E') {
    if (state.hasObjective) completeLevel(state);
    else if (!state.exitWarned || state.time - state.exitWarned > 3) {
      state.exitWarned = state.time;
      state.tags.push({ x: p.x, y: p.y - 34, text: 'THE MASTERWORK FIRST', until: state.time + 2 });
    }
  }

  // Gadgets and interaction. Each one-shot input is consumed as it fires, so a frame that
  // runs several fixed steps cannot throw two coins for one click.
  if (input.mouse.clicked) { input.mouse.clicked = false; throwCoin(state, input.mouse.x, input.mouse.y); }
  if (input.pressed.delete('KeyQ')) dropSmoke(state);
  if (input.pressed.delete('KeyE')) {
    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        if (state.level.map[ty + oy]?.[tx + ox] === 'g') {
          if (state.level.cutters) {
            setTile(state, tx + ox, ty + oy, '.');
            emitNoise(state, p.x, p.y, 1.7, 'CHAIN CUT');
          } else {
            state.tags.push({ x: p.x, y: p.y - 34, text: 'CHAINED — NEED BOLT CUTTERS', until: state.time + 2 });
          }
        }
      }
    }
  }
}

function update(state, dt) {
  if (state.screen !== 'play' || state.paused) return;
  state.time += dt;
  updatePlayer(state, dt);
  if (state.screen !== 'play') return; // the exit may have completed the level mid-step
  updateGadgets(state, dt);
  for (const g of state.guards) updateGuard(state, g, dt);
  for (const c of state.cameras) updateCamera(state, c, dt);
  updateNoises(state, dt);
  state.routeTimer -= dt;
  if (state.routeTimer <= 0) {
    state.routeTimer = 0.25;
    state.route.push({ x: state.player.x, y: state.player.y });
  }
  for (const ev of state.events) {
    if (ev.type === 'spotted') {
      state.strikes += 1;
      state.levelSpotted += 1;
      state.banner = { text: `SPOTTED BY ${ev.who} — BREAK LINE OF SIGHT AND HIDE`, until: state.time + 3.4, bad: true };
      if (state.strikes >= MAX_STRIKES) {
        state.result = levelResult(state, 'CAUGHT IN THE HALL', `${state.level.name} — the wardens close in`);
        state.result.grade = 'CAUGHT';
        state.result.next = 'R — TRY THE HEIST AGAIN';
        state.screen = 'caught';
      }
    } else if (ev.type === 'recovered') {
      state.banner = { text: 'YOU SHOOK THEM OFF — THE HALL SETTLES', until: state.time + 2.6, bad: false };
    }
  }
  state.events = [];
}

function drawTitle(state) {
  drawWorld(ctx, state);
  ctx.fillStyle = 'rgba(6,8,12,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2f5ff';
  ctx.font = '800 74px system-ui, sans-serif';
  ctx.fillText('HUSHWORK', VIEW.width / 2, 268);
  ctx.fillStyle = '#ffe9b8';
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.fillText('Steal the clockmakers’ masterworks by night: 5 heists, 19 wardens, 28 treasures, 3 gadgets', VIEW.width / 2, 306);
  ctx.fillStyle = '#9aa5ba';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Wardens patrol by lamplight. Their cones stop at crates and walls. Stay dark, stay slow, stay unseen.', VIEW.width / 2, 342);
  ctx.fillText('Take the masterwork in each hall, lift what treasure you dare, and slip out the hatch.', VIEW.width / 2, 366);
  ctx.fillStyle = '#3fd97c';
  ctx.font = '800 21px system-ui, sans-serif';
  ctx.fillText('ENTER — BEGIN THE FIRST HEIST', VIEW.width / 2, 428);
  ctx.fillStyle = '#9aa5ba';
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText('WASD / ARROWS move · SHIFT sneak · CLICK throw coin · Q smoke · E take / cut gate · R retry · ESC pause', VIEW.width / 2, VIEW.height - 12);
  ctx.textAlign = 'left';
}

function draw(state) {
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (state.screen === 'title') { drawTitle(state); return; }
  if (state.screen === 'complete' || state.screen === 'caught' || state.screen === 'results') {
    drawResults(ctx, state, state.result);
    return;
  }
  drawWorld(ctx, state);
  drawHUD(ctx, state);
  if (state.paused) {
    ctx.fillStyle = 'rgba(6,8,12,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff';
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — ESC TO RESUME', VIEW.width / 2, VIEW.height / 2);
    ctx.textAlign = 'left';
  }
  status.textContent = `Hushwork, ${state.level.name}`;
}

// Screenshot staging: ?shot=<name>&seed=N builds one exact scene and holds it.
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
let acc = 0, last = performance.now();

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (shotName) {
    draw(state);
    requestAnimationFrame(frame);
    return;
  }
  acc += elapsed;
  while (acc >= STEP) { update(state, STEP); acc -= STEP; }
  if (input.pressed.has('Enter')) {
    if (state.screen === 'title') state.screen = 'play';
    else if (state.screen === 'complete') {
      if (state.levelIndex + 1 < LEVELS.length) { loadLevel(state, state.levelIndex + 1); state.screen = 'play'; }
      else { state.result = finalResult(state); state.screen = 'results'; }
    } else if (state.screen === 'results') {
      const fresh = newState();
      Object.assign(state, fresh);
      state.screen = 'play';
    }
  }
  if (input.pressed.has('KeyR') && state.screen !== 'title') {
    loadLevel(state, state.levelIndex);
    state.screen = 'play';
  }
  if (input.pressed.has('Escape') && state.screen === 'play') state.paused = !state.paused;
  draw(state);
  endFrame();
  requestAnimationFrame(frame);
}

if (shotName) {
  stageShot(state, shotName);
  draw(state);
  window.__shotReady = true;
}
requestAnimationFrame(frame);
