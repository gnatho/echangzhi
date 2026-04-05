import { CONFIG } from './config.js';

export class GameMap {
  constructor() {
    this.grid = [];
    this.width = CONFIG.GRID_WIDTH;
    this.height = CONFIG.GRID_HEIGHT;
    this.tileSize = CONFIG.TILE_SIZE;
  }

  generate() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        if (this.isBorder(x, y)) {
          this.grid[y][x] = { type: 'wall', destructible: false };
        } else if (this.isPillar(x, y)) {
          this.grid[y][x] = { type: 'wall', destructible: false };
        } else if (this.isSafeZone(x, y)) {
          this.grid[y][x] = null;
        } else if (Math.random() < CONFIG.BLOCK_SPAWN_CHANCE) {
          this.grid[y][x] = { type: 'block', destructible: true };
        } else {
          this.grid[y][x] = null;
        }
      }
    }
    return this;
  }

  isBorder(x, y) {
    return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
  }

  isPillar(x, y) {
    return x % CONFIG.INDESTRUCTIBLE_PILLAR_SPACING === 0 &&
           y % CONFIG.INDESTRUCTIBLE_PILLAR_SPACING === 0;
  }

  isSafeZone(x, y) {
    const s = CONFIG.SAFE_ZONE_SIZE;
    return (x < s && y < s) ||
           (x >= this.width - s && y >= this.height - s) ||
           (x < s && y >= this.height - s) ||
           (x >= this.width - s && y < s);
  }

  getTile(gx, gy) {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return null;
    return this.grid[gy][gx];
  }

  isWalkable(gx, gy) {
    const tile = this.getTile(gx, gy);
    return tile === null;
  }

  destroyBlock(gx, gy) {
    if (gx >= 0 && gx < this.width && gy >= 0 && gy < this.height) {
      const tile = this.grid[gy][gx];
      if (tile && tile.destructible) {
        this.grid[gy][gx] = null;
        return true;
      }
    }
    return false;
  }

  pixelToGrid(px, py) {
    return {
      x: Math.floor(px / this.tileSize),
      y: Math.floor(py / this.tileSize)
    };
  }

  gridToPixelCenter(gx, gy) {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  getCanvasWidth() {
    return this.width * this.tileSize;
  }

  getCanvasHeight() {
    return this.height * this.tileSize;
  }
}
