import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = CONFIG.TILE_SIZE;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderGrid(map) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.grid[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile === null) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#636e72' : '#586266';
          ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
        } else if (tile.type === 'wall') {
          this._drawWall(px, py);
        } else if (tile.type === 'block') {
          this._drawBlock(px, py);
        }
      }
    }
  }

  _drawWall(px, py) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.fillStyle = '#2d3436';
    ctx.fillRect(px, py, ts, ts);

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(px + 3, py + 3, ts - 6, ts - 6);

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(px + 6, py + 6, ts - 12, ts - 12);
  }

  _drawBlock(px, py) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    ctx.fillStyle = '#a0522d';
    ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 6 + i * 12, py + 4);
      ctx.lineTo(px + 6 + i * 12, py + ts - 4);
      ctx.stroke();
    }
  }

  renderPowerups(powerups) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    for (const p of powerups) {
      const px = p.x * ts + ts / 2;
      const py = p.y * ts + ts / 2;

      ctx.beginPath();
      ctx.arc(px, py, ts * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();

      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, px, py);
    }
  }

  renderBombs(bombs) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    for (const bomb of bombs) {
      const pulse = Math.sin(bomb.pulsePhase) * 3;

      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, ts * 0.35 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#2c3e50';
      ctx.fill();

      const gradient = ctx.createRadialGradient(
        bomb.x - 5, bomb.y - 5, 0,
        bomb.x, bomb.y, ts * 0.35
      );
      gradient.addColorStop(0, '#5d6d7e');
      gradient.addColorStop(1, '#2c3e50');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bomb.x, bomb.y - ts * 0.35);
      ctx.quadraticCurveTo(bomb.x + 8, bomb.y - ts * 0.5, bomb.x + 10, bomb.y - ts * 0.55);
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bomb.x + 6, bomb.y - ts * 0.45, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }
  }

  renderExplosions(explosions) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    for (const explosion of explosions) {
      const alpha = explosion.timer / explosion.maxTimer;

      for (const cell of explosion.cells) {
        const px = cell.x * ts;
        const py = cell.y * ts;

        const gradient = ctx.createRadialGradient(
          px + ts / 2, py + ts / 2, 0,
          px + ts / 2, py + ts / 2, ts
        );
        gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 107, 107, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(231, 76, 60, ${alpha * 0.5})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, ts, ts);

        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fillRect(px + 5, py + 5, ts - 10, ts - 10);
      }
    }
  }

  renderPlayers(players) {
    const ctx = this.ctx;
    const ts = this.tileSize;

    for (const player of players) {
      if (!player.alive) continue;

      const px = player.x;
      const py = player.y;

      ctx.beginPath();
      ctx.arc(px, py, ts * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      const gradient = ctx.createRadialGradient(px - 5, py - 5, 0, px, py, ts * 0.35);
      gradient.addColorStop(0, this._lightenColor(player.token.color, 30));
      gradient.addColorStop(1, player.token.color);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.token.emoji, px, py);
    }
  }

  renderParticles(particleSystem) {
    particleSystem.render(this.ctx);
  }

  _lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}
