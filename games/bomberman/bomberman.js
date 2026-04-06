import { CONFIG } from './config.js';
import { GameMap } from './map.js';
import { Player } from './player.js';
import { BombSystem } from './bombs.js';
import { CollisionSystem } from './collision.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';

class BombermanGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.map = null;
    this.players = [];
    this.bombSystem = null;
    this.collision = null;
    this.input = null;
    this.renderer = null;
    this.particles = null;
    this.powerups = [];

    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimestep = CONFIG.FIXED_TIMESTEP;
    this.maxFrameTime = CONFIG.MAX_FRAME_TIME;

    this.gamepadMap = new Map();

    this._boundLoop = this._gameLoop.bind(this);
  }

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);

    const canvasWidth = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
    const canvasHeight = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;
    this.renderer.resize(canvasWidth, canvasHeight);

    this.input = new InputHandler();
    this.particles = new ParticleSystem();

    document.getElementById('num-players').addEventListener('change', () => this._updatePlayerSelectors());
    document.getElementById('start-btn').addEventListener('click', () => this._startGame());
    document.getElementById('play-again-btn').addEventListener('click', () => this._resetGame());
    document.getElementById('fullscreen-btn').addEventListener('click', () => this._toggleFullscreen());

    this._updatePlayerSelectors();
  }

  _updatePlayerSelectors() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const container = document.getElementById('player-selectors');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const selector = document.createElement('div');
      selector.className = 'player-selector active';
      selector.innerHTML = `
        <span class="player-num">Player ${i + 1}</span>
        <div class="token-options">
          ${CONFIG.PLAYER_TOKENS.map((t, idx) => `
            <div class="token-option ${idx === i ? 'selected' : ''}"
                 data-token-id="${t.id}" data-player="${i}">
              ${t.emoji}
            </div>
          `).join('')}
        </div>
      `;

      selector.querySelectorAll('.token-option').forEach(opt => {
        opt.addEventListener('click', function() {
          this.parentElement.querySelectorAll('.token-option')
            .forEach(t => t.classList.remove('selected'));
          this.classList.add('selected');
        });
      });

      container.appendChild(selector);
    }
  }

  _startGame() {
    const numPlayers = parseInt(document.getElementById('num-players').value);

    this.map = new GameMap();
    this.map.generate();

    this.players = [];
    this.powerups = [];
    this.particles.clear();

    const selectors = document.querySelectorAll('.player-selector');
    for (let i = 0; i < numPlayers; i++) {
      const selector = selectors[i];
      const selectedToken = selector.querySelector('.token-option.selected');
      const tokenId = selectedToken ? selectedToken.dataset.tokenId : CONFIG.PLAYER_TOKENS[i].id;
      const token = CONFIG.PLAYER_TOKENS.find(t => t.id === tokenId) || CONFIG.PLAYER_TOKENS[i];

      const startPos = CONFIG.START_POSITIONS[i];
      const center = this.map.gridToPixelCenter(startPos.x, startPos.y);

      const player = new Player(
        i,
        token,
        CONFIG.CONTROLS[i],
        center.x,
        center.y
      );

      this.players.push(player);
    }

    this.bombSystem = new BombSystem(this.map);
    this.bombSystem.setPlayerRef(this.players);
    this.collision = new CollisionSystem(this.map, this.bombSystem);

    this._spawnPowerups();
    this._renderPlayersHUD();

    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame(this._boundLoop);
  }

  _spawnPowerups() {
    const emptyCells = [];
    const ts = CONFIG.TILE_SIZE;

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        if (this.map.grid[y][x] === null) {
          let hasPlayer = false;
          for (const p of this.players) {
            if (Math.floor(p.x / ts) === x && Math.floor(p.y / ts) === y) {
              hasPlayer = true;
              break;
            }
          }
          if (!hasPlayer) emptyCells.push({ x, y });
        }
      }
    }

    const numPowerups = Math.floor(emptyCells.length * CONFIG.POWERUP_SPAWN_CHANCE);
    const powerupTypes = Object.keys(CONFIG.POWERUPS);

    for (let i = 0; i < numPowerups && emptyCells.length > 0; i++) {
      const idx = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(idx, 1)[0];
      const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

      this.powerups.push({
        x: cell.x,
        y: cell.y,
        type: type,
        ...CONFIG.POWERUPS[type]
      });
    }
  }

  _gameLoop(timestamp) {
    if (!this.running) return;

    let frameTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedTimestep) {
      this._fixedUpdate(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
    }

    this._render();
    requestAnimationFrame(this._boundLoop);
  }

  _fixedUpdate(dt) {
    this.input.pollGamepads();

    for (const player of this.players) {
      if (!player.alive) continue;

      if (!player.isMoving) {
        this._processMovementInput(player);
      } else {
        const arrived = player.update(dt);
        if (arrived) {
          this._processMovementInput(player);
        }
      }

      if (this.input.isBombPressed(player.id, player.controls)) {
        this._handleBombInput(player);
      }

      this._checkPowerupPickup(player);
    }

    this.bombSystem.update(
      dt,
      (cells) => this._onExplosion(cells),
      (gx, gy) => this._onBlockDestroyed(gx, gy)
    );

    this.particles.update(dt);

    this._checkExplosionDamage();
    this._checkWinCondition();
  }

  _processMovementInput(player) {
    let dir = this.input.getDirection(player.controls);

    if (!dir) {
      const gpIndex = this.gamepadMap.get(player.id);
      if (gpIndex !== undefined) {
        dir = this.input.getGamepadDirection(gpIndex);
      }
    }

    if (!dir) {
      player.clearQueue();
      return;
    }

    player.queueDirection(dir);

    const dirMap = {
      up:    { dx: 0, dy: -1 },
      down:  { dx: 0, dy: 1  },
      left:  { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0  }
    };

    const d = dirMap[dir];
    const targetGX = player.currentTileX + d.dx;
    const targetGY = player.currentTileY + d.dy;

    if (this.collision.canEnterTile(targetGX, targetGY)) {
      player.startMoving(targetGX, targetGY, dir);
    }
  }

  _handleBombInput(player) {
    this.bombSystem.placeBomb(player, (bomb) => {
      this.particles.emit(bomb.x, bomb.y, 8, {
        speed: 3,
        color: '#666',
        maxSize: 4,
        minSize: 2,
        life: 20
      });
    });
  }

  _checkPowerupPickup(player) {
    const gridPos = this.map.pixelToGrid(player.x, player.y);

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (p.x === gridPos.x && p.y === gridPos.y) {
        this._applyPowerup(player, p.type);
        this.powerups.splice(i, 1);
        this.particles.emit(player.x, player.y, 10, {
          speed: 4,
          color: CONFIG.POWERUPS[p.type].color,
          maxSize: 5,
          minSize: 2,
          life: 25
        });
      }
    }
  }

  _applyPowerup(player, type) {
    switch (type) {
      case 'FIRE':
        player.bombRange = Math.min(player.bombRange + 1, 8);
        break;
      case 'BOMB':
        player.maxBombs = Math.min(player.maxBombs + 1, 8);
        break;
      case 'SPEED':
        player.speed = Math.min(player.speed + 30, 360);
        break;
    }
    this._renderPlayersHUD();
  }

  _toggleFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
      btn.textContent = '⛶';
      btn.title = 'Exit Fullscreen';
    } else {
      document.exitFullscreen();
      btn.textContent = '⛶';
      btn.title = 'Toggle Fullscreen';
    }
  }
}

document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('fullscreen-btn');
  if (btn) {
    btn.textContent = document.fullscreenElement ? '⛶' : '⛶';
    btn.title = document.fullscreenElement ? 'Exit Fullscreen' : 'Toggle Fullscreen';
  }
});

const game = new BombermanGame();
document.addEventListener('DOMContentLoaded', () => game.init());
