// guards.js — the wardens: waypoint patrols, suspicion, investigation, alarm — and the brass-eye cameras.
import { GUARD, CAMERA } from './config.js';
import { tileCenter, losClear, angleDiff, moveActor } from './vision.js';

export function createGuard(def) {
  const start = tileCenter(def.path[0][0], def.path[0][1]);
  const next = tileCenter(def.path[1 % def.path.length][0], def.path[1 % def.path.length][1]);
  return {
    name: def.name, radius: GUARD.radius, x: start.x, y: start.y,
    dir: Math.atan2(next.y - start.y, next.x - start.x),
    path: def.path.map(([tx, ty]) => tileCenter(tx, ty)),
    wp: 1 % def.path.length, speedScale: def.speed ?? 1,
    suspicion: 0, state: 'patrol', target: null, faceDir: 0,
    lookTimer: 0, pauseTimer: 0, unseenTimer: 0, lastSeen: null, nearMissed: false,
  };
}

export function createCamera(def) {
  const pos = tileCenter(def.tx, def.ty);
  return {
    name: 'BRASS EYE', x: pos.x, y: pos.y, base: def.base, sweep: def.sweep,
    dir: def.base, suspicion: 0, unseenTimer: 0, lastSeen: null, cooldown: 0,
  };
}

function moveToward(state, g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const want = Math.atan2(dy, dx);
  g.dir += Math.max(-3.4 * dt, Math.min(3.4 * dt, angleDiff(want, g.dir)));
  moveActor(state.level, g, Math.cos(g.dir) * speed * dt, Math.sin(g.dir) * speed * dt);
  return d < 10;
}

/** Shared eyes: raise or decay one watcher's suspicion from what it can see of the player. */
function perceive(state, eye, dt, range, halfAngle, gainRate) {
  const p = state.player;
  const dx = p.x - eye.x, dy = p.y - eye.y;
  const dist = Math.hypot(dx, dy);
  let seen = false;
  if (dist < range && state.playerVis > 0.04) {
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, eye.dir)) < halfAngle) {
      const smoke = state.smokes.filter((s) => state.time < s.until);
      if (losClear(state.level, eye.x, eye.y, p.x, p.y, p.sneak, smoke)) seen = true;
    }
  }
  if (seen) {
    const closeness = Math.max(0.15, 1.15 - dist / range);
    eye.suspicion = Math.min(1, eye.suspicion + gainRate * state.playerVis * closeness * dt);
    eye.lastSeen = { x: p.x, y: p.y };
    eye.unseenTimer = 0;
    if (eye.suspicion > 0.72 && !eye.nearMissed && eye.suspicion < 1) {
      eye.nearMissed = true;
      state.tags.push({ x: p.x, y: p.y - 30, text: `NEAR MISS · ${Math.round(eye.suspicion * 100)}%`, until: state.time + 2.2 });
      state.closeCalls += 1;
    }
  } else {
    eye.unseenTimer += dt;
    eye.suspicion = Math.max(0, eye.suspicion - GUARD.decay * dt);
    if (eye.suspicion < 0.3) eye.nearMissed = false;
  }
  return seen;
}

export function updateGuard(state, g, dt) {
  const seen = perceive(state, g, dt, GUARD.viewRange, GUARD.viewHalfAngle, GUARD.seeGain);

  if (g.suspicion >= GUARD.spotAt && g.state !== 'alert') {
    g.state = 'alert';
    state.events.push({ type: 'spotted', who: `WARDEN ${g.name}` });
  } else if (g.state === 'patrol' && g.suspicion >= GUARD.suspectAt) {
    g.state = 'suspicious';
    g.lookTimer = 0.9;
    g.faceDir = g.lastSeen ? Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x) : g.dir;
  } else if (g.state === 'suspicious' && g.suspicion >= 0.62) {
    g.state = 'investigate';
    g.target = g.lastSeen;
    g.lookTimer = 0;
  }

  switch (g.state) {
    case 'patrol': {
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
        g.dir += Math.sin(state.time * 1.4 + g.x) * 0.35 * dt; // scanning the room
        break;
      }
      const wp = g.path[g.wp];
      if (moveToward(state, g, wp.x, wp.y, GUARD.patrolSpeed * g.speedScale, dt)) {
        g.wp = (g.wp + 1) % g.path.length;
        g.pauseTimer = 0.7;
      }
      break;
    }
    case 'suspicious': {
      g.dir += Math.max(-4 * dt, Math.min(4 * dt, angleDiff(g.faceDir, g.dir)));
      g.lookTimer -= dt;
      if (g.lookTimer <= 0) {
        if (g.suspicion >= 0.5 && g.lastSeen) { g.state = 'investigate'; g.target = g.lastSeen; g.lookTimer = 0; }
        else g.state = 'return';
      }
      break;
    }
    case 'investigate': {
      if (!g.target) { g.state = 'return'; break; }
      if (moveToward(state, g, g.target.x, g.target.y, GUARD.investigateSpeed * g.speedScale, dt)) {
        g.lookTimer += dt;
        g.dir += Math.sin(state.time * 2.1 + g.y) * 0.8 * dt;
        if (g.lookTimer > 1.6) { g.state = 'return'; g.target = null; }
      }
      break;
    }
    case 'alert': {
      const dest = g.lastSeen ?? { x: g.x, y: g.y };
      moveToward(state, g, dest.x, dest.y, GUARD.chaseSpeed * g.speedScale, dt);
      if (g.unseenTimer > GUARD.loseAfter) {
        g.suspicion = 0.55;
        g.state = 'investigate';
        g.target = g.lastSeen;
        g.lookTimer = 0;
        state.events.push({ type: 'recovered' });
      }
      break;
    }
    case 'return': {
      let best = null, bestD = Infinity;
      g.path.forEach((wp, i) => {
        const d = Math.hypot(wp.x - g.x, wp.y - g.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const wp = g.path[best];
      if (moveToward(state, g, wp.x, wp.y, GUARD.investigateSpeed * g.speedScale, dt)) {
        g.wp = (best + 1) % g.path.length;
        g.state = 'patrol';
        g.pauseTimer = 0.4;
      }
      break;
    }
    default: break;
  }
  return seen;
}

export function updateCamera(state, cam, dt) {
  cam.dir = cam.base + Math.sin(state.time * CAMERA.sweepSpeed) * cam.sweep;
  if (cam.cooldown > 0) { cam.cooldown -= dt; cam.suspicion = Math.max(0, cam.suspicion - dt); return false; }
  const seen = perceive(state, cam, dt, CAMERA.viewRange, CAMERA.viewHalfAngle, CAMERA.seeGain);
  if (cam.suspicion >= 1) {
    cam.suspicion = 0.55;
    cam.cooldown = 5;
    state.events.push({ type: 'spotted', who: 'THE BRASS EYE CAMERA' });
  }
  return seen;
}

/** The one-word state of the whole room, for the HUD. */
export function roomState(state) {
  if (state.guards.some((g) => g.state === 'alert')) return 'SPOTTED';
  if (state.guards.some((g) => g.suspicion >= GUARD.suspectAt) || state.cameras.some((c) => c.suspicion >= 0.5)) return 'SUSPICIOUS';
  return state.playerVis < 0.34 ? 'HIDDEN' : 'UNSEEN';
}
