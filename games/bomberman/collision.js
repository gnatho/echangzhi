import { CONFIG } from './config.js';

export class CollisionSystem {
  constructor(gameMap, bombSystem) {
    this.map = gameMap;
    this.bombs = bombSystem;
    this.radius = CONFIG.PLAYER_RADIUS;
  }

  canMoveTo(x, y) {
    const r = this.radius * 0.7;
    const corners = [
      { x: x - r, y: y - r },
      { x: x + r, y: y - r },
      { x: x - r, y: y + r },
      { x: x + r, y: y + r }
    ];

    for (const p of corners) {
      const gx = Math.floor(p.x / CONFIG.TILE_SIZE);
      const gy = Math.floor(p.y / CONFIG.TILE_SIZE);

      if (gx < 0 || gx >= this.map.width || gy < 0 || gy >= this.map.height) {
        return false;
      }

      if (!this.map.isWalkable(gx, gy)) {
        return false;
      }

      if (this.bombs.isTileOccupiedByBomb(gx, gy)) {
        return false;
      }
    }

    return true;
  }

  canEnterTile(gx, gy, excludeBombId) {
    if (gx < 0 || gx >= this.map.width || gy < 0 || gy >= this.map.height) {
      return false;
    }
    if (!this.map.isWalkable(gx, gy)) {
      return false;
    }
    for (const bomb of this.bombs.bombs) {
      if (excludeBombId && bomb.id === excludeBombId) continue;
      if (bomb.gridX === gx && bomb.gridY === gy) {
        return false;
      }
    }
    return true;
  }
}
