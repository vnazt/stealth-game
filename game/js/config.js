// config.js — every tuning number and the palette for Hushwork, in one place.
export const VIEW = { width: 1280, height: 800 };
export const TILE = 34;
export const FIELD = { x: 8, y: 56, cols: 29, rows: 21 };
export const RAIL = { x: 1002, width: 270 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 11,
  walkSpeed: 148, // px/s — brisk, loud, easy to see
  sneakSpeed: 74, // px/s — slow, quiet, hard to see
  walkNoise: 3.2, // tiles of footstep noise while walking
  sneakNoise: 0.9, // tiles while sneaking
  reach: 46, // coin throw range, px * TILE below
};
export const THROW_RANGE = 7.5 * TILE;

export const GUARD = {
  radius: 12,
  patrolSpeed: 52,
  chaseSpeed: 118,
  investigateSpeed: 84,
  viewRange: 6.4 * TILE,
  viewHalfAngle: 0.62, // radians, ~71° cone
  seeGain: 1.5, // suspicion per second at point blank in full light
  decay: 0.22, // suspicion lost per second while unseen
  hearDecay: 0.1,
  suspectAt: 0.38, // "?" — turns to look / investigates
  spotAt: 1.0, // "!" — alarm
  loseAfter: 3.2, // seconds hidden before an alarm cools back down
};

export const CAMERA = {
  viewRange: 5.2 * TILE,
  viewHalfAngle: 0.5,
  sweepSpeed: 0.45, // radians per second of sway
  seeGain: 1.1,
};

export const SMOKE_SECONDS = 4.5;
export const MAX_STRIKES = 3;

export const PALETTE = {
  bg: '#0a0c12',
  floor: '#262b38',
  floorAlt: '#2a3040',
  darkFloor: '#171b26',
  wall: '#46516a',
  wallTop: '#5d6b8a',
  crate: '#966f3d',
  crateEdge: '#bb9050',
  barrel: '#6e5136',
  barrelEdge: '#96754c',
  shelf: '#54432e',
  shelfEdge: '#7a5f3d',
  lowCover: '#648052',
  lowCoverEdge: '#84a56f',
  grass: '#2e4a38',
  grassBlade: '#4d8262',
  lampGlow: 'rgba(255,190,92,',
  lampFloor: '#4a3d28',
  exit: '#3fd97c',
  objective: '#ffd94a',
  valuable: '#7ce7ff',
  player: '#f2f5ff',
  playerTrim: '#5aa2ff',
  guard: '#e8e4da',
  guardTrim: '#c8402e',
  camera: '#bfe9ff',
  coneCalm: 'rgba(255,176,66,0.20)',
  coneCalmEdge: 'rgba(255,176,66,0.45)',
  coneSus: 'rgba(255,122,26,0.30)',
  coneSusEdge: 'rgba(255,122,26,0.65)',
  coneAlert: 'rgba(255,54,44,0.34)',
  coneAlertEdge: 'rgba(255,54,44,0.75)',
  coneCam: 'rgba(140,220,255,0.16)',
  coneCamEdge: 'rgba(140,220,255,0.4)',
  panel: '#12151d',
  panelEdge: '#2c3345',
  ink: '#e8ecf4',
  inkDim: '#9aa5ba',
  good: '#3fd97c',
  warn: '#ffb03a',
  bad: '#ff5147',
};

export const CONTROLS_LINE =
  'WASD / ARROWS move · SHIFT sneak · CLICK throw coin · Q smoke · E take / cut gate · R retry · ESC pause';
