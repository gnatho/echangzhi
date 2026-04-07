import { CONTROLLER_CONFIG } from './controllers.js';

export const CONFIG = {
  TILE_SIZE: 48,
  GRID_WIDTH: 15,
  GRID_HEIGHT: 13,
  BASE_SPEED: 180,
  BOMB_DELAY_MS: 3000,
  BOMB_LIMIT: 1,
  EXPLOSION_DURATION_MS: 500,
  PLAYER_RADIUS: 14,
  CENTER_THRESHOLD_RATIO: 0.35,
  FIXED_TIMESTEP: 1 / 60,
  MAX_FRAME_TIME: 0.25,
  POWERUP_SPAWN_CHANCE: 0.08,
  POWERUP_DROP_CHANCE: 0.3,
  BLOCK_SPAWN_CHANCE: 0.7,
  SAFE_ZONE_SIZE: 3,
  INDESTRUCTIBLE_PILLAR_SPACING: 2,
  PLAYER_TOKENS: [
    { id: 'p1_red',    emoji: '\uD83D\uDD34', color: '#e74c3c', name: 'Red' },
    { id: 'p2_blue',   emoji: '\uD83D\uDD35', color: '#3498db', name: 'Blue' },
    { id: 'p3_purple', emoji: '\uD83D\uDFE3', color: '#9b59b6', name: 'Purple' },
    { id: 'p4_green',  emoji: '\uD83D\uDFE2', color: '#2ecc71', name: 'Green' }
  ],
  POWERUPS: {
    FIRE:  { emoji: '\uD83D\uDD25', color: '#e74c3c' },
    BOMB:  { emoji: '\uD83D\uDCA3', color: '#3498db' },
    SPEED: { emoji: '\u26A1', color: '#f1c40f' }
  },
  get CONTROLS() {
    return CONTROLLER_CONFIG.controllers;
  },
  START_POSITIONS: [
    { x: 1, y: 1 },
    { x: 12, y: 11 },
    { x: 1, y: 11 },
    { x: 12, y: 1 }
  ]
};
