import { CONFIG } from './config.js';

export class Player {
  constructor(id, token, controls, startX, startY) {
    this.id = id;
    this.token = token;
    this.controls = controls;
    this.x = startX;
    this.y = startY;
    this.speed = CONFIG.BASE_SPEED;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.maxBombs = CONFIG.BOMB_LIMIT;
    this.bombRange = 2;
    this.alive = true;
    this.activeBombs = 0;

    this.currentTileX = Math.floor(startX / CONFIG.TILE_SIZE);
    this.currentTileY = Math.floor(startY / CONFIG.TILE_SIZE);
    this.targetTileX = this.currentTileX;
    this.targetTileY = this.currentTileY;
    this.isMoving = false;
    this.moveProgress = 0;
    this.queuedDirection = null;
    this.currentDirection = null;

    this.animFrame = 0;
    this.animTimer = 0;
  }

  getTileCenter() {
    return {
      x: this.currentTileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: this.currentTileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
  }

  getTargetCenter() {
    return {
      x: this.targetTileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: this.targetTileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
  }

  isAtTileCenter() {
    const center = this.getTileCenter();
    const threshold = CONFIG.TILE_SIZE * CONFIG.CENTER_THRESHOLD_RATIO;
    return Math.abs(this.x - center.x) < threshold &&
           Math.abs(this.y - center.y) < threshold;
  }

  isAtTargetCenter() {
    const target = this.getTargetCenter();
    const threshold = 1;
    return Math.abs(this.x - target.x) < threshold &&
           Math.abs(this.y - target.y) < threshold;
  }

  snapToTileCenter() {
    const center = this.getTileCenter();
    this.x = center.x;
    this.y = center.y;
  }

  snapToTargetCenter() {
    const target = this.getTargetCenter();
    this.x = target.x;
    this.y = target.y;
  }

  queueDirection(dir) {
    this.queuedDirection = dir;
  }

  clearQueue() {
    this.queuedDirection = null;
  }

  startMoving(targetTileX, targetTileY, direction) {
    this.targetTileX = targetTileX;
    this.targetTileY = targetTileY;
    this.currentDirection = direction;
    this.isMoving = true;
    this.moveProgress = 0;
  }

  update(dt) {
    if (!this.alive) return;

    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    if (!this.isMoving) return;

    const distance = CONFIG.TILE_SIZE;
    const moveAmount = this.speed * dt;
    this.moveProgress += moveAmount;

    if (this.moveProgress >= distance) {
      this.moveProgress = distance;
      this.snapToTargetCenter();
      this.currentTileX = this.targetTileX;
      this.currentTileY = this.targetTileY;
      this.isMoving = false;
      this.currentDirection = null;
      return true;
    }

    const t = this.moveProgress / distance;
    const startCenter = this.getTileCenter();
    const targetCenter = this.getTargetCenter();
    this.x = startCenter.x + (targetCenter.x - startCenter.x) * t;
    this.y = startCenter.y + (targetCenter.y - startCenter.y) * t;

    return false;
  }
}
