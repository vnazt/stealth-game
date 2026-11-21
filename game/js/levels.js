// levels.js — the five guildhall heists: tile maps, warden patrols, cameras, loot and callouts.
// Map legend: # wall · C crate (blocks sight) · L low cover (crouch to hide) · G shadow fronds
// (hidden while still) · * lamplit floor (seen from afar) · , dark floor · g chained gate
// (bolt cutters) · E exit · P start · O the masterwork · v treasure.
export const TILE_CHARS = {
  wall: '#', crate: 'C', low: 'L', grass: 'G', lamp: '*', dark: ',', gate: 'g',
  exit: 'E', start: 'P', objective: 'O', valuable: 'v', floor: '.',
};

export const LEVELS = [
  {
    name: 'Heist 1 · The Apprentice Loft',
    objectiveName: 'the Brass Orrery',
    objectiveLine: 'STEAL THE BRASS ORRERY, THEN SLIP OUT THE HATCH',
    coins: 3, smokes: 1, cutters: false,
    map: [
      '#############################',
      '#P....*......#.......v...*..#',
      '#............#..............#',
      '#..CC........#....LLL....G..#',
      '#..CC....G...#..........G...#',
      '#......G.....#......CC......#',
      '#..v...G.....#......CC......#',
      '#............#..............#',
      '#....LL......*.......LL..*..#',
      '#...........................#',
      '#....v......#.....#....O....#',
      '#...........#.....#.........#',
      '#..GG.......#.....#....LL...#',
      '#..GG.......#.....#.........#',
      '#...........#.....#....*....#',
      '#....*......#.....#.........#',
      '#......................CC...#',
      '#..LL.................CC....#',
      '#...........................#',
      '#....*.....,,,......*....E..#',
      '#############################',
    ],
    guards: [
      { name: 'CORVIN', path: [[4, 9], [24, 9]], speed: 1.0 },
      { name: 'BEX', path: [[22, 3], [22, 16]], speed: 0.9 },
    ],
    cameras: [],
    callouts: [
      { tx: 20, ty: 5, text: 'YOU: hidden where the cone stops at the crates' },
      { tx: 3, ty: 12, text: 'SHADOW FRONDS: hidden while you stay still' },
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
      '#P......#.......*......#....#',
      '#..CC...#..............#..v.#',
      '#..CC...#....LL........#....#',
      '#.......#..............#....#',
      '#..*....####.#####.....#....#',
      '#......................#....#',
      '#....G.......CC.....v..#....#',
      '#....G.......v.........#....#',
      '#....G....*.......LL...#....#',
      '####.###################....#',
      '#...........................#',
      '#..LL.....CC.....CC.....LL..#',
      '#...........................#',
      '#....v....CC.....CC.....*...#',
      '#...........................#',
      '#..*.....####.####..........#',
      '#...........................#',
      '#....G..........v.....O.....#',
      '#....G....,,,.........*...E.#',
      '#############################',
    ],
    guards: [
      { name: 'ALDO', path: [[3, 11], [25, 11]], speed: 1.0 },
      { name: 'MIRA', path: [[14, 2], [14, 8]], speed: 1.1 },
      { name: 'TOMAS', path: [[25, 13], [25, 18]], speed: 0.9 },
    ],
    cameras: [],
    callouts: [
      { tx: 14, ty: 6, text: 'A WARDEN TURNS AT THE GAP — TIME YOUR CROSSING' },
      { tx: 5, ty: 18, text: 'DARK FLOOR: SLOWER TO BE SEEN' },
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
      '#P....*.....#......v....#...#',
      '#...........#...........#.*.#',
      '#..CC.......#....CC.....#...#',
      '#..CC.......#....CC.....#...#',
      '#......G....#...........#...#',
      '#..v...G....#####g#######...#',
      '#...........................#',
      '#....LL......*.......LL.....#',
      '#...........................#',
      '#......####.####......####..#',
      '#...........................#',
      '#..GG.......CC....v...CC....#',
      '#..GG.......v...............#',
      '#....*......CC..........*...#',
      '#...........................#',
      '#..LL...v......####.........#',
      '#....................g..O...#',
      '#....v....,,,..........g....#',
      '#....................*....E.#',
      '#############################',
    ],
    guards: [
      { name: 'CORVIN', path: [[4, 8], [24, 8]], speed: 1.05 },
      { name: 'SABLE', path: [[6, 12], [6, 18]], speed: 0.95 },
      { name: 'ORIN', path: [[20, 12], [25, 17]], speed: 1.0 },
    ],
    cameras: [
      { tx: 14, ty: 1, base: Math.PI / 2, sweep: 0.9 },
    ],
    callouts: [
      { tx: 17, ty: 6, text: 'CHAINED GATE: PRESS E WITH THE CUTTERS' },
      { tx: 14, ty: 3, text: 'BRASS EYE CAMERA: ITS CONE SWEEPS — CROSS BEHIND IT' },
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
      '#P...*....#......v.....#....#',
      '#.........#............#..*.#',
      '#..CC.....#....LL......#....#',
      '#..CC.....#............#....#',
      '#.....G...#####g########....#',
      '#.....G.....................#',
      '#..v........v........CC.....#',
      '#......*......*......CC..v..#',
      '#...........................#',
      '####.##########.##########.##',
      '#...........................#',
      '#..LL.....CC......CC....LL..#',
      '#...........................#',
      '#....v....CC..O...CC....*...#',
      '#...........................#',
      '#..*......####.####.........#',
      '#...........................#',
      '#....G.........v...v..CC....#',
      '#....G....,,,....*......E...#',
      '#############################',
    ],
    guards: [
      { name: 'MIRA', path: [[3, 11], [25, 11]], speed: 1.1 },
      { name: 'BEX', path: [[13, 2], [13, 8]], speed: 1.0 },
      { name: 'TOMAS', path: [[25, 6], [25, 13]], speed: 0.95 },
      { name: 'WREN-KEEPER', path: [[6, 18], [20, 18]], speed: 1.05 },
    ],
    cameras: [
      { tx: 20, ty: 1, base: Math.PI / 2, sweep: 1.1 },
    ],
    callouts: [
      { tx: 15, ty: 5, text: 'CHAINED GATE: A SHORTCUT, IF YOU DARE THE NOISE' },
      { tx: 20, ty: 3, text: 'BRASS EYE CAMERA' },
      { tx: 24, ty: 19, text: 'EXIT HATCH' },
    ],
  },
  {
    name: "Heist 5 · The Master's Hall",
    objectiveName: 'the First Clock',
    objectiveLine: 'STEAL THE FIRST CLOCK — THE HEART OF THE GUILDHALL',
    coins: 5, smokes: 2, cutters: true,
    map: [
      '#############################',
      '#P....*.....#......*....#...#',
      '#...........#...........#.*.#',
      '#..CC....v..#....CC.....#...#',
      '#..CC.......#....CC.....#...#',
      '#......G....#......G....#...#',
      '#..v...G....#####g#######...#',
      '#...........................#',
      '#....LL......*.......LL..*..#',
      '#...........................#',
      '#......####.####......####..#',
      '#...........................#',
      '#..GG...v...CC....v...CC....#',
      '#..GG.......................#',
      '#....*......CC.....O....*...#',
      '#...........................#',
      '#..LL...v......####.........#',
      '#....................g......#',
      '#....v....,,,....v...g...E..#',
      '#...........................#',
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
      { tx: 17, ty: 6, text: 'THE LAST GATE. CUT IT QUIETLY.' },
      { tx: 20, ty: 14, text: 'THE FIRST CLOCK' },
      { tx: 25, ty: 19, text: 'EXIT HATCH' },
    ],
  },
];

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || ty >= level.map.length || tx >= level.map[0].length) return '#';
  return level.map[ty][tx];
}

/** Tiles that block movement: walls, crates, low cover, uncut gates. */
export function blocksMove(ch) {
  return ch === '#' || ch === 'C' || ch === 'L' || ch === 'g';
}

/** Tiles that block sight fully: walls and crates. */
export function blocksSight(ch) {
  return ch === '#' || ch === 'C';
}
