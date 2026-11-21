// levels.js — the five guildhall heists: tile maps, warden patrols, cameras, loot and callouts.
// Map legend: # wall · C crate (blocks sight) · B barrel (blocks sight) · K bookcase (blocks
// sight) · L low cover (crouch to hide) · G shadow fronds (hidden while still) · * lamplit
// floor (seen from afar) · , dark floor · g chained gate (bolt cutters) · E exit · P start
// · O the masterwork · v treasure.
export const TILE_CHARS = {
  wall: '#', crate: 'C', barrel: 'B', shelf: 'K', low: 'L', grass: 'G', lamp: '*', dark: ',',
  gate: 'g', exit: 'E', start: 'P', objective: 'O', valuable: 'v', floor: '.',
};

export const LEVELS = [
  {
    name: 'Heist 1 · The Apprentice Loft',
    objectiveName: 'the Brass Orrery',
    objectiveLine: 'STEAL THE BRASS ORRERY, THEN SLIP OUT THE HATCH',
    coins: 3, smokes: 1, cutters: false,
    map: [
      '#############################',
      '#P..*....K...#....v...*...B.#',
      '#..CC....K...#..LL..........#',
      '#..CC..G.....#......CC..G...#',
      '#......G..B..#..B...CC......#',
      '#..v...G.....#....G....KK...#',
      '#......G..*..#......CC......#',
      '#..LL........#..B...........#',
      '#....*...B...#...*...LL...*.#',
      '#...........................#',
      '#....v...B...#.....#....O...#',
      '#.......B...#.....#....KK...#',
      '#..GG...B...#.....#.B..LL...#',
      '#..GG.......#.....#.........#',
      '#......LL...#.....#.B..*....#',
      '#..B.*......#.....#....K....#',
      '#..*...............B...CC...#',
      '#..LL....KK...........CC..B.#',
      '#....G....B.......*.........#',
      '#..*......,,,....B...*...E..#',
      '#############################',
    ],
    guards: [
      { name: 'CORVIN', path: [[4, 9], [24, 9]], speed: 1.0 },
      { name: 'BEX', path: [[22, 3], [22, 16]], speed: 0.9 },
    ],
    cameras: [],
    callouts: [
      { tx: 20, ty: 5, text: 'HIS CONE BREAKS ON THE CRATES — CROUCH HERE' },
      { tx: 6, ty: 12, text: 'FRONDS: HOLD STILL, VANISH' },
      { tx: 24, ty: 19, text: 'EXIT HATCH' },
    ],
  },
  {
    name: 'Heist 2 · The Gear Store',
    objectiveName: 'the Moonphase Dial',
    objectiveLine: 'STEAL THE MOONPHASE DIAL, THEN SLIP OUT THE HATCH',
    coins: 3, smokes: 1, cutters: false,
    map: [
      '#############################',
      '#P......#....*....K....#..B.#',
      '#..CC..B#..........B...#..v.#',
      '#..CC...#..B...LL..K...#....#',
      '#..B....#......G.......#.K..#',
      '#..*..B.####.#####..B..#....#',
      '#..G.................B.#..K.#',
      '#....G....B....CC.K.v..#....#',
      '#....G...*...v....LL...#....#',
      '#....G....*....B..LL...#..*.#',
      '####.###################....#',
      '#..G.....................*..#',
      '#..LL..B..CC..K..CC..B..LL..#',
      '#....B..........*......B....#',
      '#....v..B.CC..K..CC.....*...#',
      '#..K......G..........G......#',
      '#..*..B..####.####.....K....#',
      '#......LL..........B........#',
      '#....G....K.....v..B..O..*..#',
      '#....G....,,,....B....*..E..#',
      '#############################',
    ],
    guards: [
      { name: 'ALDO', path: [[3, 11], [25, 11]], speed: 1.0 },
      { name: 'MIRA', path: [[14, 2], [14, 4]], speed: 1.1 },
      { name: 'TOMAS', path: [[25, 13], [25, 18]], speed: 0.9 },
      { name: 'PIA', path: [[4, 6], [20, 6]], speed: 0.95 },
    ],
    cameras: [],
    callouts: [
      { tx: 14, ty: 6, text: 'HE TURNS AT THE GAP — COUNT HIS TURN, THEN GO' },
      { tx: 5, ty: 18, text: 'DARK BOARDS: EYES SLIDE OFF YOU' },
      { tx: 24, ty: 19, text: 'EXIT HATCH' },
    ],
  },
  {
    name: 'Heist 3 · The Escapement Vault',
    objectiveName: "the Guildmaster's Key",
    objectiveLine: "STEAL THE GUILDMASTER'S KEY — CUTTERS WORK ON CHAINED GATES",
    coins: 4, smokes: 2, cutters: true,
    map: [
      '#############################',
      '#P..*....B..#....v......#.*.#',
      '#.....K.....#..K....B...#...#',
      '#..CC...B...#....CC..K..#.*.#',
      '#..CC.......#....CC.....#.B.#',
      '#..B...G....#....G......#...#',
      '#..v...G....#####g#######...#',
      '#....B..........*.......B...#',
      '#..G.........*...........LL.#',
      '#....*....K.........B.......#',
      '#......####.####......####..#',
      '#..B......*........K........#',
      '#..GG.......CC....v...CC..B.#',
      '#..GG...B...v......K....*...#',
      '#....*......CC..B.......*..B#',
      '#......G........*....G......#',
      '#..LL...v..B...####....K....#',
      '#..B.................g..O..K#',
      '#....v....,,,....B.....g....#',
      '#....G..........B....*...E..#',
      '#############################',
    ],
    guards: [
      { name: 'CORVIN', path: [[4, 8], [24, 8]], speed: 1.05 },
      { name: 'SABLE', path: [[6, 12], [6, 18]], speed: 0.95 },
      { name: 'ORIN', path: [[20, 12], [25, 17]], speed: 1.0 },
      { name: 'JUNO', path: [[8, 15], [24, 15]], speed: 0.9 },
    ],
    cameras: [
      { tx: 14, ty: 1, base: Math.PI / 2, sweep: 0.9 },
    ],
    callouts: [
      { tx: 17, ty: 6, text: 'CHAINED SHUT. CUTTERS (E) MAKE A DOOR' },
      { tx: 14, ty: 3, text: 'THE BRASS EYE SWEEPS — CROSS IN ITS BLIND SWING' },
      { tx: 24, ty: 19, text: 'EXIT HATCH' },
    ],
  },
  {
    name: 'Heist 4 · The Bell Tower Stores',
    objectiveName: 'the Singing Gear',
    objectiveLine: 'STEAL THE SINGING GEAR, THEN SLIP OUT THE HATCH',
    coins: 4, smokes: 2, cutters: true,
    map: [
      '#############################',
      '#P...*....#....v...B...#..*.#',
      '#..K......#......B....#...*.#',
      '#..CC..B..#....LL...K..#....#',
      '#..CC.....#..G......B..#....#',
      '#.....G...#####g########....#',
      '#.....G.........B...........#',
      '#..v....B...v....K...CC..B..#',
      '#..B...*...K..*......CC..v..#',
      '#....G..........*.......G...#',
      '####.##########.##########.##',
      '#......*....................#',
      '#..LL..B..CC..K...CC..B.LL..#',
      '#..................B....*...#',
      '#....v..B.CC..O...CC....*...#',
      '#..K......G..........B......#',
      '#..*..B...####.####.....K...#',
      '#....B..........*.......B...#',
      '#..B.G.........v...v..CC..*.#',
      '#....G....,,,....*..B...E...#',
      '#############################',
    ],
    guards: [
      { name: 'MIRA', path: [[3, 11], [25, 11]], speed: 1.1 },
      { name: 'BEX', path: [[13, 2], [13, 4]], speed: 1.0 },
      { name: 'TOMAS', path: [[25, 6], [25, 9]], speed: 0.95 },
      { name: 'WREN-KEEPER', path: [[6, 18], [20, 18]], speed: 1.05 },
      { name: 'FERRO', path: [[4, 13], [11, 13]], speed: 0.9 },
    ],
    cameras: [
      { tx: 20, ty: 1, base: Math.PI / 2, sweep: 1.1 },
    ],
    callouts: [
      { tx: 15, ty: 5, text: 'A SHORTCUT BEHIND CHAIN — LOUD, BUT SHORT' },
      { tx: 20, ty: 3, text: 'THE BRASS EYE KEEPS THIS CORNER' },
      { tx: 23, ty: 19, text: 'EXIT HATCH' },
    ],
  },
  {
    name: "Heist 5 · The Master's Hall",
    objectiveName: 'the First Clock',
    objectiveLine: 'STEAL THE FIRST CLOCK — THE HEART OF THE GUILDHALL',
    coins: 5, smokes: 2, cutters: true,
    map: [
      '#############################',
      '#P..*....B..#....*......#.*.#',
      '#..K........#...........#.B.#',
      '#..CC....v..#....CC..K..#.*.#',
      '#..CC...B...#....CC.....#.B.#',
      '#..B...G....#..B...G....#...#',
      '#..v...G....#####g#######...#',
      '#....B..........*.......B...#',
      '#....LL..B...*....B..LL..*..#',
      '#............*..............#',
      '#......####.####......####..#',
      '#..B......*........K........#',
      '#..GG...v...CC....v...CC..B.#',
      '#..GG...B......K.....*......#',
      '#....*......CC..B..O....*..B#',
      '#......G........*....G......#',
      '#..LL...v..B...####....K....#',
      '#..B.................g......#',
      '#....v....,,,....v...g..BE..#',
      '#...*.....B.....K......*....#',
      '#############################',
    ],
    guards: [
      { name: 'CORVIN', path: [[4, 9], [24, 9]], speed: 1.15 },
      { name: 'SABLE', path: [[6, 12], [6, 18]], speed: 1.0 },
      { name: 'ORIN', path: [[20, 12], [25, 17]], speed: 1.05 },
      { name: 'THE MASTER', path: [[18, 2], [22, 2]], speed: 0.9 },
    ],
    cameras: [
      { tx: 14, ty: 1, base: Math.PI / 2, sweep: 0.9 },
      { tx: 8, ty: 19, base: -Math.PI / 2, sweep: 1.2 },
    ],
    callouts: [
      { tx: 17, ty: 6, text: 'LAST GATE OF THE NIGHT. CUT IT SOFTLY.' },
      { tx: 20, ty: 14, text: 'THE FIRST CLOCK — WHERE IT ALL BEGAN' },
      { tx: 24, ty: 19, text: 'EXIT HATCH' },
    ],
  },
];

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || ty >= level.map.length || tx >= level.map[0].length) return '#';
  return level.map[ty][tx];
}

/** Tiles that block movement: walls, crates, barrels, bookcases, low cover, uncut gates. */
export function blocksMove(ch) {
  return ch === '#' || ch === 'C' || ch === 'B' || ch === 'K' || ch === 'L' || ch === 'g';
}

/** Tiles that block sight fully: walls, crates, barrels and bookcases. */
export function blocksSight(ch) {
  return ch === '#' || ch === 'C' || ch === 'B' || ch === 'K';
}
