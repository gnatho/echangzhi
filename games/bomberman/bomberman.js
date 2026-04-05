import { CONFIG } from './config.js';
import { GameMap } from './map.js';
import { Player } from './player.js';
import { BombSystem } from './bombs.js';
import { CollisionSystem } from './collision.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
import { OnScreenControls } from './onscreen-controls.js';

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
    this.onscreenControls = [];

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
    this._createBombButtons();
    this._createOnScreenControls();
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

  _createBombButtons() {
    const container = document.getElementById('bomb-buttons');
    container.innerHTML = '';

    this.players.forEach((player, idx) => {
      const btn = document.createElement('button');
      btn.className = `bomb-btn player${idx + 1}`;
      btn.innerHTML = `
        <span>${player.token.emoji} Drop Bomb</span>
        <span class="key-hint">${this._getKeyLabel(player.controls.bomb)}</span>
      `;
      btn.addEventListener('click', () => this._handleBombInput(player));
      container.appendChild(btn);
    });
  }

  _createOnScreenControls() {
    const container = document.getElementById('onscreen-controls');
    container.innerHTML = '';
    this.onscreenControls = [];

    for (const player of this.players) {
      const osc = new OnScreenControls(container, player.id, player.controls);
      osc.onBomb(() => this._handleBombInput(player));
      this.onscreenControls.push(osc);
    }

    container.classList.add('active');
  }

  _getKeyLabel(code) {
    const labels = {
      'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
      'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
      'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
      'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
      'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y', 'KeyZ': 'Z',
      'Space': 'Space', 'Numpad0': 'Num0', 'Numpad4': 'Num4',
      'Numpad5': 'Num5', 'Numpad6': 'Num6', 'Numpad8': 'Num8'
    };
    return labels[code] || code;
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
      const osc = this.onscreenControls.find(c => c.playerId === player.id);
      if (osc) {
        dir = osc.getDirection();
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

  _onExplosion(cells) {
    for (const cell of cells) {
      const center = this.map.gridToPixelCenter(cell.x, cell.y);
      this.particles.emit(center.x, center.y, 15, {
        speed: 8,
        colors: ['#ff6b6b', '#f39c12'],
        maxSize: 6,
        minSize: 3,
        life: 30
      });
    }
  }

  _onBlockDestroyed(gx, gy) {
    const center = this.map.gridToPixelCenter(gx, gy);
    this.particles.emit(center.x, center.y, 15, {
      speed: 8,
      colors: ['#ff6b6b', '#f39c12'],
      maxSize: 6,
      minSize: 3,
      life: 30
    });

    if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
      const types = Object.keys(CONFIG.POWERUPS);
      const type = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({
        x: gx,
        y: gy,
        type: type,
        ...CONFIG.POWERUPS[type]
      });
    }
  }

  _checkExplosionDamage() {
    for (const player of this.players) {
      if (!player.alive) continue;
      if (this.bombSystem.isPlayerInExplosion(player)) {
        this._killPlayer(player);
      }
    }
  }

  _killPlayer(player) {
    player.alive = false;
    this.particles.emit(player.x, player.y, 20, {
      speed: 6,
      color: player.token.color,
      maxSize: 8,
      minSize: 4,
      life: 40
    });
    this._renderPlayersHUD();
  }

  _checkWinCondition() {
    const alivePlayers = this.players.filter(p => p.alive);

    if (alivePlayers.length <= 1 && this.players.length > 1) {
      this.running = false;

      let winner;
      if (alivePlayers.length === 1) {
        winner = alivePlayers[0];
      } else {
        winner = this.players[0];
      }

      setTimeout(() => this._showGameOver(winner), 500);
    }
  }

  _showGameOver(winner) {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('active');

    document.getElementById('winner-text').textContent =
      `${winner.token.emoji} ${winner.token.name} Wins!`;

    document.getElementById('winner-details').innerHTML = `
      <p>Player ${winner.id + 1} dominated the arena!</p>
    `;
  }

  _resetGame() {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');

    this.running = false;
    this.players = [];
    this.powerups = [];
    this.particles.clear();
    for (const osc of this.onscreenControls) {
      osc.destroy();
    }
    this.onscreenControls = [];
    document.getElementById('onscreen-controls').classList.remove('active');
  }

  _render() {
    this.renderer.clear();
    this.renderer.renderGrid(this.map);
    this.renderer.renderPowerups(this.powerups);
    this.renderer.renderBombs(this.bombSystem.bombs);
    this.renderer.renderExplosions(this.bombSystem.explosions);
    this.renderer.renderPlayers(this.players);
    this.renderer.renderParticles(this.particles);
  }

  _renderPlayersHUD() {
    const container = document.getElementById('players-hud');
    container.innerHTML = '';

    this.players.forEach((player) => {
      const card = document.createElement('div');
      card.className = 'player-card' +
        (!player.alive ? ' eliminated' : '');

      card.innerHTML = `
        <div class="player-icon">${player.token.emoji}</div>
        <div class="player-info">
          <div class="player-name" style="color: ${player.token.color}">${player.token.name}</div>
          <div class="player-stats">
            <div class="stat-item">
              <span class="stat-icon">\uD83D\uDCA3</span>
              <span>${player.maxBombs}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">\uD83D\uDD25</span>
              <span>${player.bombRange}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">\u26A1</span>
              <span>${(player.speed / CONFIG.BASE_SPEED).toFixed(1)}x</span>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }
}

const game = new BombermanGame();
document.addEventListener('DOMContentLoaded', () => game.init());
