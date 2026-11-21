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
    loadLevel(state, 1); // The Gear Store
    state.time = 143;
    setTile(state, 25, 2, '.');
    state.lootTaken = 1;
    place(state, 'ALDO', 12, 11, 0, 0.62, 'investigate');
    place(state, 'MIRA', 14, 5, Math.PI / 2, 0);
    place(state, 'TOMAS', 25, 15, -Math.PI / 2, 0.1);
    const coin = tileCenter(15, 11);
    state.noises.push({ x: coin.x, y: coin.y, r: 4.2 * 32, age: 0.4, life: 0.9, tag: '' });
    putPlayer(state, 5, 8, true, 0.18, 0.2);
    state.tags.push({ x: coin.x, y: coin.y - 30, text: 'HEARD THE COIN', until: 9999 });
    state.tags.push({ x: state.player.x, y: state.player.y - 56, text: 'NEAR MISS · 62%', until: 9999 });
    return;
  }
  if (name === 'alarm') {
    loadLevel(state, 3); // The Bell Tower Stores
    state.time = 201;
    state.strikes = 1;
    state.levelSpotted = 1;
    setTile(state, 18, 1, '.'); setTile(state, 22, 8, '.'); setTile(state, 4, 7, '.');
    state.lootTaken = 3;
    place(state, 'MIRA', 12, 11, 0, 1, 'alert');
    place(state, 'BEX', 13, 5, Math.PI / 2, 0.3);
    place(state, 'TOMAS', 25, 9, Math.PI, 0.85, 'suspicious');
    place(state, 'WREN-KEEPER', 10, 18, 0, 0);
    putPlayer(state, 17, 11, false, 0.92, 0);
    state.banner = { text: 'SPOTTED BY WARDEN MIRA — BREAK LINE OF SIGHT AND HIDE', until: 9999, bad: true };
    return;
  }
  if (name === 'getaway') {
    loadLevel(state, 0); // The Apprentice Loft, completed
    state.time = 164;
    state.hasObjective = true;
    state.lootTaken = 3;
    const tiles = [[1, 1], [8, 1], [12, 3], [12, 7], [16, 9], [20, 9], [23, 10], [24, 13], [24, 16], [25, 19]];
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
      verdict: 'No warden can say the hall was entered. The masterwork simply is not there any more.',
      next: 'ENTER — NEXT: HEIST 2 · THE GEAR STORE',
    };
    state.screen = 'complete';
    return;
  }
  // cover (default): The Escapement Vault, a quiet sneak going right.
  loadLevel(state, 2);
  state.time = 97;
  setTile(state, 19, 1, '.'); setTile(state, 4, 6, '.');
  state.lootTaken = 2;
  place(state, 'CORVIN', 10, 8, 0, 0);
  place(state, 'SABLE', 6, 15, -Math.PI / 2, 0);
  place(state, 'ORIN', 23, 13, Math.PI, 0.12);
  state.cameras[0].dir = Math.PI / 2 + 0.35;
  putPlayer(state, 17, 3, true, 0.2, 2.6);
  state.callouts = state.callouts.filter((c) => !c.text.startsWith('BRASS EYE'));
  state.callouts.push({ tx: 12, ty: 1, text: 'YOU: hidden where the cone stops at the crates' });
}
