// shots.js — deterministic staged scenes behind ?shot=cover|suspicion|alarm|getaway.
// Each scene loads a real level and places the actors exactly, so a screenshot is the game's
// own rendering of a moment that can genuinely happen in play.
import { tileCenter } from './vision.js';
import { loadLevel, setTile } from './game.js';

function place(state, name, tx, ty, dir, suspicion = 0, gstate = 'patrol') {
  const g = state.guards.find((w) => w.name === name);
  if (!g) return;
  const c = tileCenter(tx, ty);
  g.x = c.x; g.y = c.y; g.dir = dir; g.suspicion = suspicion; g.state = gstate;
  if (gstate === 'investigate') g.target = { x: c.x + Math.cos(dir) * 90, y: c.y + Math.sin(dir) * 90 };
}

function speak(state, name, text) {
  const g = state.guards.find((w) => w.name === name);
  if (g) g.say = { text, until: 9999 };
}

function stepRing(state, tx, ty, age) {
  const c = tileCenter(tx, ty);
  state.noises.push({ x: c.x, y: c.y, r: 17, age, life: 0.6, kind: 'step', tag: '' });
}

function putPlayer(state, tx, ty, sneak, vis, face = 0.6) {
  const c = tileCenter(tx, ty);
  state.player.x = c.x; state.player.y = c.y;
  state.player.sneak = sneak; state.player.face = face;
  state.playerVis = vis;
  state.playerNoiseR = sneak ? 0 : 3.2;
}

export function stageShot(state, name) {
  state.screen = 'play';
  if (name === 'suspicion') {
    loadLevel(state, 1); // The Gear Store — a coin has just landed.
    state.time = 143;
    setTile(state, 5, 14, '.'); // one treasure already lifted on the way in
    state.lootTaken = 1;
    place(state, 'ALDO', 12, 11, 0, 0.62, 'investigate');
    speak(state, 'ALDO', 'What was that?');
    stepRing(state, 11, 11, 0.22);
    stepRing(state, 10, 11, 0.48);
    place(state, 'MIRA', 12, 4, Math.PI / 2, 0);
    place(state, 'TOMAS', 25, 15, -Math.PI / 2, 0.1);
    place(state, 'PIA', 18, 6, Math.PI, 0);
    stepRing(state, 19, 6, 0.3);
    const coin = tileCenter(15, 11);
    state.noises.push({ x: coin.x, y: coin.y, r: 4.2 * 34, age: 0.4, life: 0.9, tag: '' });
    putPlayer(state, 5, 8, true, 0.18, 0.2);
    state.tags.push({ x: coin.x, y: coin.y - 34, text: 'HEARD THE COIN', until: 9999 });
    state.tags.push({ x: state.player.x, y: state.player.y - 60, text: 'NEAR MISS · 62%', until: 9999 });
    return;
  }
  if (name === 'alarm') {
    loadLevel(state, 3); // The Bell Tower Stores — spotted, mid-chase, smoke buying the escape.
    state.time = 201;
    state.strikes = 1;
    state.levelSpotted = 1;
    setTile(state, 15, 1, '.'); setTile(state, 3, 7, '.'); setTile(state, 12, 7, '.');
    state.lootTaken = 3;
    place(state, 'MIRA', 12, 11, 0, 1, 'alert');
    speak(state, 'MIRA', 'Thief! There!');
    stepRing(state, 11, 11, 0.3);
    place(state, 'BEX', 13, 8, Math.PI / 2, 0.3);
    place(state, 'TOMAS', 25, 9, Math.PI, 0.85, 'suspicious');
    speak(state, 'TOMAS', 'Hey— who goes there?');
    place(state, 'WREN-KEEPER', 10, 18, 0, 0);
    place(state, 'FERRO', 7, 13, 0, 0);
    state.cameras[0].dir = Math.PI / 2 + 0.3;
    const puff = tileCenter(21, 9);
    state.smokes.push({ x: puff.x, y: puff.y, r: 56, until: 9999 });
    putPlayer(state, 16, 11, false, 0.92, 0);
    stepRing(state, 15, 11, 0.15);
    stepRing(state, 14, 11, 0.42);
    state.tags.push({ x: puff.x, y: puff.y - 78, text: 'SMOKE — HIS CONE DIES IN IT', until: 9999 });
    state.banner = { text: 'SPOTTED BY WARDEN MIRA — BREAK LINE OF SIGHT AND HIDE', until: 9999, bad: true };
    return;
  }
  if (name === 'getaway') {
    loadLevel(state, 0); // The Apprentice Loft, completed — the hall as it was left.
    state.time = 164;
    state.hasObjective = true;
    setTile(state, 18, 1, '.'); setTile(state, 3, 5, '.'); setTile(state, 4, 10, '.'); // treasures lifted
    setTile(state, 24, 10, '.'); // the masterwork's pedestal stands empty
    state.lootTaken = 3;
    place(state, 'CORVIN', 14, 9, 0, 0);
    place(state, 'BEX', 22, 10, Math.PI / 2, 0);
    putPlayer(state, 25, 19, false, 0.5, 0);
    state.callouts = [];
    const tiles = [[1, 1], [8, 1], [12, 3], [12, 7], [16, 9], [20, 9], [23, 10], [24, 13], [22, 16], [25, 19]];
    state.route = tiles.map(([tx, ty]) => tileCenter(tx, ty));
    state.result = {
      title: 'CLEAN GETAWAY', subtitle: 'Heist 1 · The Apprentice Loft — the Brass Orrery lifted',
      grade: 'GHOST', level: state.level, route: state.route,
      lines: [
        ['Masterwork', 'the Brass Orrery'],
        ['Treasures lifted', '3 / 3'],
        ['Times spotted', '0'],
        ['Close calls', '1'],
        ['Coins thrown', '1'],
        ['Time in the hall', '02:44'],
      ],
      campaign: [
        ['Masterworks tonight', '1 / 5'],
        ['Treasures tonight', '3 / 28'],
        ['Alarms tonight', '0'],
        ['Halls still sleeping', '4'],
      ],
      verdict: 'No warden can say the hall was entered. The masterwork simply is not there any more.',
      next: 'ENTER — NEXT: HEIST 2 · THE GEAR STORE',
    };
    state.screen = 'complete';
    return;
  }
  // cover (default): The Escapement Vault, a quiet sneak going right — four wardens and the eye.
  loadLevel(state, 2);
  state.time = 97;
  setTile(state, 3, 6, '.'); setTile(state, 5, 18, '.'); // two treasures already in the bag
  state.lootTaken = 2;
  place(state, 'CORVIN', 10, 8, 0, 0);
  place(state, 'SABLE', 6, 15, -Math.PI / 2, 0);
  speak(state, 'SABLE', 'All quiet. Just the clocks.');
  place(state, 'ORIN', 23, 13, Math.PI, 0.12);
  place(state, 'JUNO', 16, 15, Math.PI, 0);
  state.cameras[0].dir = Math.PI / 2 + 0.35;
  putPlayer(state, 17, 2, true, 0.2, 2.6);
  state.callouts.push({ tx: 19, ty: 1, text: 'YOU — IN THE BLIND WEDGE, BEHIND THE CRATES' });
}
