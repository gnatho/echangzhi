import { CONFIG } from './config.js';

const DIRECTIONS = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy: 1  },
  left:  { dx: -1, dy: 0  },
  right: { dx: 1,  dy: 0  }
};

export class BombSystem {
  constructor(gameMap) {
    this.map = gameMap;
    this.bombs = [];
    this.explosions = [];
    this.bombTimers = new Map();
  }

  canPlaceBomb(player) {
    if (!player.alive) return false;
    if (player.activeBombs >= player.maxBombs) return false;

    const gridPos = this.map.pixelToGrid(player.x, player.y);
    for (const bomb of this.bombs) {
      if (bomb.gridX === gridPos.x && bomb.gridY === gridPos.y) {
        return false;
      }
    }
    return true;
  }

  placeBomb(player, onBombPlaced) {
    if (!this.canPlaceBomb(player)) return;

    const gridPos = this.map.pixelToGrid(player.x, player.y);
    const center = this.map.gridToPixelCenter(gridPos.x, gridPos.y);

    const bomb = {
      id: Date.now() + Math.random(),
      gridX: gridPos.x,
      gridY: gridPos.y,
      x: center.x,
      y: center.y,
      owner: player.id,
      range: player.bombRange,
      timer: CONFIG.BOMB_DELAY_MS / 1000,
      pulsePhase: Math.random() * Math.PI * 2
    };

    this.bombs.push(bomb);
    player.activeBombs++;

    if (onBombPlaced) {
      onBombPlaced(bomb);
    }
  }

  update(dt, onExplosion, onBlockDestroyed) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.timer -= dt;
      bomb.pulsePhase += dt * 5;

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb, onExplosion, onBlockDestroyed);
        this.bombs.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer -= dt;
      if (this.explosions[i].timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  explodeBomb(bomb, onExplosion, onBlockDestroyed) {
    const player = this._findPlayerById(bomb.owner);
    if (player) {
      player.activeBombs = Math.max(0, player.activeBombs - 1);
    }

    const cells = [];
    cells.push({ x: bomb.gridX, y: bomb.gridY });

    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    for (const dir of dirs) {
      for (let i = 1; i <= bomb.range; i++) {
        const tx = bomb.gridX + dir.dx * i;
        const ty = bomb.gridY + dir.dy * i;

        if (tx < 0 || tx >= this.map.width || ty < 0 || ty >= this.map.height) break;

        const tile = this.map.getTile(tx, ty);

        if (tile && !tile.destructible) break;

        cells.push({ x: tx, y: ty });

        if (tile && tile.destructible) {
          this.map.destroyBlock(tx, ty);
          if (onBlockDestroyed) {
            onBlockDestroyed(tx, ty);
          }
          break;
        }

        for (const otherBomb of this.bombs) {
          if (otherBomb.id !== bomb.id && otherBomb.gridX === tx && otherBomb.gridY === ty) {
            otherBomb.timer = 0;
          }
        }
      }
    }

    this.explosions.push({
      cells: cells,
      timer: CONFIG.EXPLOSION_DURATION_MS / 1000,
      maxTimer: CONFIG.EXPLOSION_DURATION_MS / 1000
    });

    if (onExplosion) {
      onExplosion(cells);
    }
  }

  isTileOccupiedByBomb(gx, gy) {
    for (const bomb of this.bombs) {
      if (bomb.gridX === gx && bomb.gridY === gy) {
        return true;
      }
    }
    return false;
  }

  isPlayerInExplosion(player) {
    const gridPos = this.map.pixelToGrid(player.x, player.y);

    for (const explosion of this.explosions) {
      for (const cell of explosion.cells) {
        if (cell.x === gridPos.x && cell.y === gridPos.y) {
          return true;
        }
      }
    }
    return false;
  }

  _findPlayerById(id) {
    if (this._players) {
      return this._players.find(p => p.id === id);
    }
    return null;
  }

  setPlayerRef(players) {
    this._players = players;
  }
}
