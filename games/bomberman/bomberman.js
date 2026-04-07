import { CONFIG } from './config.js';
import { CONTROLLER_CONFIG, getKeyDisplayName } from './controllers.js';
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
    document.getElementById('controls-btn').addEventListener('click', () => this._showControlsModal());
    document.getElementById('close-controls').addEventListener('click', () => this._hideControlsModal());
    document.getElementById('reset-controls').addEventListener('click', () => this._resetControls());
    document.getElementById('save-controls').addEventListener('click', () => this._saveControls());

    this._updatePlayerSelectors();
    this._setupResizeHandler();
  }

  _showControlsModal() {
    const container = document.getElementById('controls-config');
    container.innerHTML = '';

    const controls = CONTROLLER_CONFIG.getAllControls();

    controls.forEach((control, playerIndex) => {
      const playerConfig = CONFIG.PLAYER_TOKENS[playerIndex];
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player-control-config';
      playerDiv.innerHTML = `
        <h3><span class="player-icon">${playerConfig.emoji}</span> ${playerConfig.name}</h3>
        <div class="control-row">
          <span class="control-label">Up</span>
          <button class="control-key-btn" data-player="${playerIndex}" data-action="up">${getKeyDisplayName(control.up)}</button>
        </div>
        <div class="control-row">
          <span class="control-label">Down</span>
          <button class="control-key-btn" data-player="${playerIndex}" data-action="down">${getKeyDisplayName(control.down)}</button>
        </div>
        <div class="control-row">
          <span class="control-label">Left</span>
          <button class="control-key-btn" data-player="${playerIndex}" data-action="left">${getKeyDisplayName(control.left)}</button>
        </div>
        <div class="control-row">
          <span class="control-label">Right</span>
          <button class="control-key-btn" data-player="${playerIndex}" data-action="right">${getKeyDisplayName(control.right)}</button>
        </div>
        <div class="control-row">
          <span class="control-label">Bomb</span>
          <button class="control-key-btn" data-player="${playerIndex}" data-action="bomb">${getKeyDisplayName(control.bomb)}</button>
        </div>
      `;
      container.appendChild(playerDiv);
    });

    container.querySelectorAll('.control-key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this._startKeyRecording(e.target));
    });

    document.getElementById('controls-modal').classList.add('active');
  }

  _hideControlsModal() {
    document.getElementById('controls-modal').classList.remove('active');
  }

  _startKeyRecording(btn) {
    btn.classList.add('recording');
    btn.textContent = 'Press key...';

    const playerIndex = parseInt(btn.dataset.player);
    const action = btn.dataset.action;

    const handleKey = (e) => {
      e.preventDefault();
      const key = e.code;

      CONTROLLER_CONFIG.setControl(playerIndex, action, key);
      btn.classList.remove('recording');
      btn.textContent = getKeyDisplayName(key);

      window.removeEventListener('keydown', handleKey);
    };

    window.addEventListener('keydown', handleKey, { once: true });
  }

  _resetControls() {
    CONTROLLER_CONFIG.resetToDefaults();
    this._showControlsModal();
  }

  _saveControls() {
    this._hideControlsModal();
  }

  _setupResizeHandler() {
    const container = document.getElementById('game-canvas-container');
    
    const resizeCanvas = () => {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      const baseWidth = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
      const baseHeight = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;
      
      const scaleX = containerWidth / baseWidth;
      const scaleY = containerHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY, 2);
      
      const newWidth = Math.floor(baseWidth * scale);
      const newHeight = Math.floor(baseHeight * scale);
      
      this.canvas.style.width = newWidth + 'px';
      this.canvas.style.height = newHeight + 'px';
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
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
