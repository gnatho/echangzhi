import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, options) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * (options.speed || 4),
        vy: (Math.random() - 0.5) * (options.speed || 4),
        color: options.colors ? options.colors[Math.floor(Math.random() * options.colors.length)] : options.color,
        size: Math.random() * (options.maxSize || 6) + (options.minSize || 2),
        life: options.life || 30,
        maxLife: options.life || 30
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 120 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
  }
}
