// ============================================================
//  ARCADE BUMPERS — game.js
// ============================================================

// --- Polyfill for roundRect ---
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
}

// --- Canvas ---
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resize(); if (gameRunning) positionArena(); });
resize();

// --- Arena ---
const ARENA_PAD = 55;
let arena = { x: 0, y: 0, w: 0, h: 0 };

function positionArena() {
    arena.x = ARENA_PAD;
    arena.y = ARENA_PAD;
    arena.w = canvas.width  - ARENA_PAD * 2;
    arena.h = canvas.height - ARENA_PAD * 2;
}

// --- Input ---
const pressedKeys = new Set();
window.addEventListener("keydown", e => { pressedKeys.add(e.key.toLowerCase()); e.preventDefault(); });
window.addEventListener("keyup",   e => pressedKeys.delete(e.key.toLowerCase()));

// --- Audio ---
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playTone(freq, type = 'sine', duration = 0.12, vol = 0.25) {
    try {
        const ac   = getAudio();
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        gain.gain.setValueAtTime(vol, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + duration);
    } catch (_) {}
}
function sfxCollide()  { playTone(90, 'sawtooth', 0.18, 0.35); }
function sfxPickup()   { playTone(550,'sine', 0.08, 0.3); setTimeout(() => playTone(880,'sine',0.1,0.3), 80); }
function sfxPowerup()  { [400,600,900].forEach((f,i) => setTimeout(() => playTone(f,'square',0.1,0.3), i*60)); }
function sfxCountdown(final) { playTone(final ? 880 : 440, 'square', 0.2, 0.4); }
function sfxWin()      { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.35,0.4), i*130)); }

// --- Helpers ---
function rand(min, max)  { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

// --- Screen Shake ---
const shake = { x: 0, y: 0, intensity: 0 };
function addShake(amt) { shake.intensity = Math.min(14, shake.intensity + amt); }

// --- Floating Texts ---
const floatingTexts = [];
function floatText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1, vy: -1.6 });
}

// ============================================================
//  PARTICLE
// ============================================================
class Particle {
    constructor(x, y, color, speed, life = 1) {
        this.x = x; this.y = y; this.color = color;
        const a = Math.random() * Math.PI * 2;
        const v = Math.random() * speed;
        this.vx = Math.cos(a) * v;
        this.vy = Math.sin(a) * v;
        this.life = life + Math.random() * 0.3;
        this.decay = rand(0.02, 0.045);
        this.size  = rand(1.5, 5);
        this.gravity = 0.08;
    }
    update() {
        this.x  += this.vx; this.y += this.vy;
        this.vx *= 0.94;    this.vy *= 0.94;
        this.vy += this.gravity;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle   = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function explode(x, y, color, n = 20, spd = 8) {
    for (let i = 0; i < n; i++) particles.push(new Particle(x, y, color, spd));
}

// ============================================================
//  POWER-UP
// ============================================================
const PUP_TYPES = [
    { type: 'speed',     color: '#ffff00', symbol: '⚡', label: 'SPEED BOOST!',      duration: 4500 },
    { type: 'shield',    color: '#44aaff', symbol: '⬡',  label: 'SHIELD!',           duration: 5000 },
    { type: 'confusion', color: '#ff6600', symbol: '~',  label: 'CONFUSION!',        duration: 3500 },
    { type: 'bomb',      color: '#ff2244', symbol: '✦',  label: 'BOMB!',             duration: 0    },
];

class PowerUp {
    constructor(x, y) {
        const t = PUP_TYPES[randInt(0, PUP_TYPES.length - 1)];
        Object.assign(this, t);
        this.x = x; this.y = y;
        this.radius = 14;
        this.pulse  = Math.random() * Math.PI * 2;
        this.active = true;
        this.age    = 0;
        this.maxAge = 600; // ~10s lifespan
    }
    update() {
        this.pulse += 0.07;
        this.age++;
        if (this.age > this.maxAge) this.active = false;
    }
    draw(ctx) {
        if (!this.active) return;
        const s = 1 + Math.sin(this.pulse) * 0.18;
        const fade = this.age > this.maxAge * 0.75
            ? 1 - (this.age - this.maxAge * 0.75) / (this.maxAge * 0.25)
            : 1;
        ctx.globalAlpha = fade;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(s, s);
        ctx.shadowBlur = 18; ctx.shadowColor = this.color;
        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '22';
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Symbol
        ctx.shadowBlur = 0;
        ctx.font = `bold ${this.radius}px 'Share Tech Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.fillText(this.symbol, 0, 1);
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// ============================================================
//  OBSTACLE  (static bumper)
// ============================================================
class Obstacle {
    constructor(x, y, radius) {
        this.x = x; this.y = y; this.radius = radius;
        this.pulse = Math.random() * Math.PI * 2;
    }
    update() { this.pulse += 0.025; }
    draw(ctx) {
        const glow = 4 + Math.sin(this.pulse) * 2;
        ctx.save();
        ctx.shadowBlur = glow; ctx.shadowColor = '#1a2255';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, '#141428');
        g.addColorStop(1, '#0c0c1e');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = '#2a3060';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Inner ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = '#1e2245';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}

// ============================================================
//  ORB  (the scoring collectible)
// ============================================================
class Orb {
    constructor() {
        this.active = true;
        this.pulse  = Math.random() * Math.PI * 2;
        this.respawn();
    }
    respawn() {
        const m = 70;
        let attempts = 0;
        do {
            this.x = arena.x + m + Math.random() * (arena.w - m * 2);
            this.y = arena.y + m + Math.random() * (arena.h - m * 2);
            attempts++;
        } while (attempts < 20 && obstacles.some(o =>
            Math.hypot(this.x - o.x, this.y - o.y) < o.radius + 50
        ));
        this.size = 14;
    }
    update() { this.pulse += 0.1; }
    draw(ctx) {
        const s = 1 + Math.sin(this.pulse) * 0.22;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(s, s);
        ctx.rotate(this.pulse * 0.4);
        ctx.shadowBlur = 22; ctx.shadowColor = '#ffea00';
        // Star shape
        const spikes = 5, R = this.size, r = this.size * 0.45;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const rad = i % 2 === 0 ? R : r;
            const a   = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            i === 0 ? ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad)
                    : ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(0, -R*0.3, 0, 0, 0, R);
        g.addColorStop(0, '#fff7aa');
        g.addColorStop(0.5, '#ffea00');
        g.addColorStop(1, '#ff8800');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================
//  CAR
// ============================================================
class Car {
    constructor(x, y, playerNum) {
        const cfg = PLAYER_CONTROLS[playerNum];
        this.playerNum = playerNum;
        this.x = x; this.y = y;
        this.color = cfg.color;
        this.keys = {
            gas:   cfg.gas.toLowerCase(),
            rev:   cfg.rev.toLowerCase(),
            left:  cfg.left.toLowerCase(),
            right: cfg.right.toLowerCase()
        };
        this.vx = 0; this.vy = 0;
        this.angle = -Math.PI / 2;
        this.w = 22; this.len = 38;
        this.score = 0;
        this.accel     = 0.52;
        this.friction  = 0.975;
        this.grip      = 0.80;
        this.turnSpeed = 0.07;
        this.radius    = 20;
        this.maxSpeed  = 11;

        // Power-up timers (timestamps)
        this.shieldEnd    = 0;
        this.speedEnd     = 0;
        this.confusedEnd  = 0;

        // Visual state
        this.trail     = [];
        this.hitFlash  = 0;
        this.exhaustAmt= 0;
        this.skidMarks = [];
        this.shieldHits= 0;
    }

    get hasShield()   { return Date.now() < this.shieldEnd; }
    get hasSpeed()    { return Date.now() < this.speedEnd; }
    get isConfused()  { return Date.now() < this.confusedEnd; }

    applyPowerUp(pup) {
        sfxPowerup();
        if (pup.type === 'speed') {
            this.speedEnd = Date.now() + pup.duration;
            floatText(this.x, this.y - 35, '⚡ SPEED!', this.color);
        } else if (pup.type === 'shield') {
            this.shieldEnd = Date.now() + pup.duration;
            floatText(this.x, this.y - 35, '⬡ SHIELD!', '#44aaff');
        } else if (pup.type === 'confusion') {
            players.forEach(p => {
                if (p !== this) {
                    p.confusedEnd = Date.now() + pup.duration;
                    floatText(p.x, p.y - 35, '~ CONFUSED!', '#ff6600');
                }
            });
            floatText(this.x, this.y - 35, '~ CHAOS!', this.color);
        } else if (pup.type === 'bomb') {
            // Push all others away from this car
            explode(this.x, this.y, '#ff2244', 50, 14);
            addShake(12);
            players.forEach(p => {
                if (p === this) return;
                if (p.hasShield) return;
                const dx = p.x - this.x, dy = p.y - this.y;
                const dist = Math.hypot(dx, dy) || 1;
                const force = 18;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
                p.hitFlash = 12;
                floatText(p.x, p.y - 35, 'BOOM!', '#ff2244');
            });
        }
    }

    update() {
        const boosted   = this.hasSpeed;
        const confused  = this.isConfused;
        const shielded  = this.hasShield;

        // Boost trail
        if (boosted) {
            this.trail.push({ x: this.x, y: this.y, a: this.angle, life: 1 });
            if (this.trail.length > 18) this.trail.shift();
        } else {
            this.trail.length = 0;
        }

        // Steering
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > 0.3) {
            const dir = (this.vx * Math.cos(this.angle) + this.vy * Math.sin(this.angle)) > 0 ? 1 : -1;
            const lk  = confused ? this.keys.right : this.keys.left;
            const rk  = confused ? this.keys.left  : this.keys.right;
            if (pressedKeys.has(lk)) this.angle -= this.turnSpeed * dir * (speed / 4);
            if (pressedKeys.has(rk)) this.angle += this.turnSpeed * dir * (speed / 4);
        }

        const accel  = boosted ? this.accel * 1.9 : this.accel;
        const maxSpd = boosted ? this.maxSpeed * 1.7 : this.maxSpeed;

        if (pressedKeys.has(this.keys.gas)) {
            this.vx += Math.cos(this.angle) * accel;
            this.vy += Math.sin(this.angle) * accel;
            this.exhaustAmt = 10;
        }
        if (pressedKeys.has(this.keys.rev)) {
            this.vx -= Math.cos(this.angle) * accel * 0.6;
            this.vy -= Math.sin(this.angle) * accel * 0.6;
        }

        // Grip / lateral friction
        const fx = Math.cos(this.angle), fy = Math.sin(this.angle);
        const rx = Math.cos(this.angle + Math.PI/2), ry = Math.sin(this.angle + Math.PI/2);
        let fv = this.vx * fx + this.vy * fy;
        let rv = this.vx * rx + this.vy * ry;
        rv *= this.grip;
        this.vx = fx * fv + rx * rv;
        this.vy = fy * fv + ry * rv;

        // Speed cap
        const spd = Math.hypot(this.vx, this.vy);
        if (spd > maxSpd) { this.vx = this.vx/spd*maxSpd; this.vy = this.vy/spd*maxSpd; }

        this.vx *= this.friction; this.vy *= this.friction;
        this.x  += this.vx;      this.y  += this.vy;

        // Arena boundary bounce
        const pad = this.radius;
        if (this.x < arena.x + pad)          { this.x = arena.x + pad;               this.vx =  Math.abs(this.vx) * 0.65; addShake(1); }
        if (this.x > arena.x + arena.w - pad){ this.x = arena.x + arena.w - pad;     this.vx = -Math.abs(this.vx) * 0.65; addShake(1); }
        if (this.y < arena.y + pad)           { this.y = arena.y + pad;               this.vy =  Math.abs(this.vy) * 0.65; addShake(1); }
        if (this.y > arena.y + arena.h - pad) { this.y = arena.y + arena.h - pad;    this.vy = -Math.abs(this.vy) * 0.65; addShake(1); }

        // Obstacle collision
        obstacles.forEach(obs => {
            const dx = this.x - obs.x, dy = this.y - obs.y;
            const d  = Math.hypot(dx, dy);
            const m  = this.radius + obs.radius;
            if (d < m && d > 0) {
                const nx = dx/d, ny = dy/d;
                this.x = obs.x + nx * m;
                this.y = obs.y + ny * m;
                const dot = this.vx*nx + this.vy*ny;
                this.vx -= 2*dot*nx*0.75;
                this.vy -= 2*dot*ny*0.75;
                explode(this.x, this.y, '#334466', 6, 3);
                addShake(2);
            }
        });

        if (this.hitFlash  > 0) this.hitFlash--;
        if (this.exhaustAmt > 0) this.exhaustAmt--;
    }

    draw(ctx) {
        const now      = Date.now();
        const boosted  = this.hasSpeed;
        const shielded = this.hasShield;
        const confused = this.isConfused;

        // Boost trail
        this.trail.forEach((t, i) => {
            t.life -= 0.07;
            if (t.life <= 0) return;
            ctx.globalAlpha = t.life * 0.4;
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.a);
            ctx.fillStyle = this.color;
            const s = (i / this.trail.length) * 10;
            ctx.fillRect(-s/2, -s/2, s, s);
            ctx.restore();
        });
        ctx.globalAlpha = 1;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shield ring
        if (shielded) {
            const p = Math.sin(now * 0.007) * 5;
            ctx.shadowBlur = 20 + p; ctx.shadowColor = '#44aaff';
            ctx.strokeStyle = `rgba(68,170,255,${0.6 + Math.sin(now*0.005)*0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 9 + p*0.4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Car body
        const bodyColor = this.hitFlash > 0 ? '#ffffff' : this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = boosted ? 25 : (shielded ? 12 : 8);
        ctx.fillStyle   = bodyColor;
        ctx.roundRect(-this.len/2, -this.w/2, this.len, this.w, 5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Windshield
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(1, -this.w/2 + 3, 11, this.w - 6);

        // Headlights
        ctx.fillStyle = '#ffffe0';
        ctx.shadowColor = '#ffff88'; ctx.shadowBlur = 6;
        ctx.fillRect(this.len/2 - 5, -this.w/2 + 3, 5, 5);
        ctx.fillRect(this.len/2 - 5, this.w/2 - 8, 5, 5);
        ctx.shadowBlur = 0;

        // Exhaust puff
        if (this.exhaustAmt > 0) {
            const alpha = (this.exhaustAmt / 10) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-this.len/2 - 5, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Confused indicator above car
        if (confused) {
            ctx.save();
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff6600';
            ctx.fillText('~ CONFUSED ~', this.x, this.y - this.radius - 16);
            ctx.restore();
        }

        // Player label
        ctx.save();
        ctx.font = `bold 10px 'Orbitron', monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; ctx.shadowBlur = 6;
        ctx.fillText('P' + this.playerNum, this.x, this.y - this.radius - 4);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ============================================================
//  GAME STATE
// ============================================================
let players    = [];
let particles  = [];
let orbs       = [];
let powerUps   = [];
let obstacles  = [];
let gameRunning   = false;
let selectedPlayers = 3;
let winScore    = 10;
let pupTimer    = 0;

// ============================================================
//  COLLISIONS
// ============================================================
function collideCarCar(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d  = Math.hypot(dx, dy);
    const m  = a.radius + b.radius;
    if (d >= m || d < 0.01) return;

    const nx = dx/d, ny = dy/d;
    const overlap = m - d;
    const aFixed = a.hasShield, bFixed = b.hasShield;

    if (!aFixed) { a.x -= nx*overlap*0.5; a.y -= ny*overlap*0.5; }
    if (!bFixed) { b.x += nx*overlap*0.5; b.y += ny*overlap*0.5; }

    const relVx = a.vx - b.vx, relVy = a.vy - b.vy;
    const imp = (relVx*nx + relVy*ny);
    if (imp < 0) return; // already separating

    if (!aFixed) { a.vx -= imp*nx; a.vy -= imp*ny; }
    if (!bFixed) { b.vx += imp*nx; b.vy += imp*ny; }

    const strength = Math.abs(imp);
    addShake(strength * 0.6);
    explode(a.x + dx*0.5, a.y + dy*0.5, '#ffffff', Math.min(25, 8 + strength|0), 6 + strength);
    a.hitFlash = 6; b.hitFlash = 6;
    sfxCollide();
}

function collideCarOrbs() {
    players.forEach(car => {
        orbs.forEach(orb => {
            if (!orb.active) return;
            if (Math.hypot(orb.x - car.x, orb.y - car.y) < car.radius + orb.size * 0.8) {
                orb.active = false;
                car.score++;
                explode(orb.x, orb.y, '#ffea00', 35, 10);
                explode(orb.x, orb.y, '#ffffff', 10, 5);
                floatText(orb.x, orb.y - 24, '+1', car.color);
                addShake(3);
                sfxPickup();
                updateHUD();
                checkWin(car);
            }
        });
    });
    orbs = orbs.filter(o => o.active);
    while (orbs.length < 2) orbs.push(new Orb());
}

function collideCarPups() {
    players.forEach(car => {
        powerUps.forEach(pup => {
            if (!pup.active) return;
            if (Math.hypot(pup.x - car.x, pup.y - car.y) < car.radius + pup.radius) {
                car.applyPowerUp(pup);
                pup.active = false;
                explode(pup.x, pup.y, pup.color, 22, 7);
            }
        });
    });
    powerUps = powerUps.filter(p => p.active && p.age < p.maxAge);
}

// ============================================================
//  HUD + WIN
// ============================================================
function updateHUD() {
    players.forEach((p, i) => {
        document.getElementById('p'+(i+1)+'-score').textContent = p.score;
    });
}

function checkWin(car) {
    if (car.score >= winScore) {
        gameRunning = false;
        setTimeout(() => showWin(car), 400);
    }
}

function showWin(winner) {
    sfxWin();
    // Confetti burst
    const cols = ['#ff0044','#00ff88','#ff00ff','#ffea00','#00aaff','#ffaa00'];
    for (let i = 0; i < 120; i++) {
        particles.push(new Particle(
            rand(0, canvas.width), rand(-50, canvas.height * 0.3),
            cols[randInt(0, cols.length - 1)], rand(5, 14), 1.5
        ));
    }
    document.getElementById('win-player').textContent  = PLAYER_CONTROLS[winner.playerNum].name;
    document.getElementById('win-player').style.color  = winner.color;
    document.getElementById('win-player').style.textShadow = `0 0 30px ${winner.color}`;
    document.getElementById('win-score').textContent   = winner.score + ' POINTS';
    document.getElementById('win-overlay').classList.remove('hidden');
}

// ============================================================
//  OBSTACLES
// ============================================================
function createObstacles() {
    obstacles = [];
    const cx = arena.x + arena.w / 2, cy = arena.y + arena.h / 2;
    obstacles.push(new Obstacle(cx, cy, 32));
    const ox = arena.w * 0.24, oy = arena.h * 0.25;
    [[cx-ox, cy-oy], [cx+ox, cy-oy], [cx-ox, cy+oy], [cx+ox, cy+oy]]
        .forEach(([x,y]) => obstacles.push(new Obstacle(x, y, 20)));
}

// ============================================================
//  POWER-UP SPAWNING
// ============================================================
function maybeSpawnPup() {
    pupTimer++;
    const interval = 240 + randInt(0, 60); // ~4-5s
    if (pupTimer > interval && powerUps.length < 3) {
        pupTimer = 0;
        const m = 80;
        powerUps.push(new PowerUp(
            arena.x + m + Math.random() * (arena.w - m*2),
            arena.y + m + Math.random() * (arena.h - m*2)
        ));
    }
}

// ============================================================
//  START + COUNTDOWN
// ============================================================
function startGame() {
    positionArena();
    createObstacles();

    players   = [];
    particles = [];
    orbs      = [];
    powerUps  = [];
    pupTimer  = 0;
    floatingTexts.length = 0;
    pressedKeys.clear();

    const pos = {
        2: [
            { x: arena.x + arena.w*0.25, y: arena.y + arena.h*0.5 },
            { x: arena.x + arena.w*0.75, y: arena.y + arena.h*0.5 }
        ],
        3: [
            { x: arena.x + arena.w*0.2,  y: arena.y + arena.h*0.5 },
            { x: arena.x + arena.w*0.75, y: arena.y + arena.h*0.3 },
            { x: arena.x + arena.w*0.75, y: arena.y + arena.h*0.7 }
        ],
        4: [
            { x: arena.x + arena.w*0.25, y: arena.y + arena.h*0.28 },
            { x: arena.x + arena.w*0.75, y: arena.y + arena.h*0.28 },
            { x: arena.x + arena.w*0.25, y: arena.y + arena.h*0.72 },
            { x: arena.x + arena.w*0.75, y: arena.y + arena.h*0.72 }
        ]
    }[selectedPlayers];

    for (let i = 1; i <= selectedPlayers; i++) {
        const car = new Car(pos[i-1].x, pos[i-1].y, i);
        car.angle = -Math.PI / 2;
        players.push(car);
        const card = document.getElementById('p'+i+'-card');
        card.classList.remove('hidden');
        document.getElementById('p'+i+'-name').textContent  = PLAYER_CONTROLS[i].name;
        document.getElementById('p'+i+'-score').textContent = '0';
        document.getElementById('p'+i+'-hint').textContent  =
            'GAS:'+PLAYER_CONTROLS[i].gas.toUpperCase()+
            ' LEFT:'+PLAYER_CONTROLS[i].left.toUpperCase()+
            ' RIGHT:'+PLAYER_CONTROLS[i].right.toUpperCase()+
            ' REV:'+PLAYER_CONTROLS[i].rev.toUpperCase();
    }
    for (let i = selectedPlayers + 1; i <= 4; i++) {
        document.getElementById('p'+i+'-card').classList.add('hidden');
    }

    orbs.push(new Orb(), new Orb());
    doCountdown(3);
}

function doCountdown(n) {
    gameRunning = false;
    const el = document.getElementById('countdown');
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth; // reflow to re-trigger animation
    el.style.animation = '';

    if (n > 0) {
        el.textContent  = n;
        el.style.color  = n === 1 ? '#ff4444' : n === 2 ? '#ffaa00' : '#ffffff';
        sfxCountdown(false);
        setTimeout(() => doCountdown(n - 1), 950);
    } else {
        el.textContent = 'GO!';
        el.style.color = '#00ff88';
        sfxCountdown(true);
        gameRunning = true;
        setTimeout(() => el.classList.add('hidden'), 750);
    }
}

// ============================================================
//  GAME LOOP
// ============================================================
function update() {
    if (!gameRunning) {
        // Still update particles even when paused (confetti on win)
        particles.forEach(p => p.update());
        particles = particles.filter(p => p.life > 0);
        return;
    }

    players.forEach(p => p.update());

    for (let i = 0; i < players.length; i++)
        for (let j = i+1; j < players.length; j++)
            collideCarCar(players[i], players[j]);

    collideCarOrbs();
    collideCarPups();

    orbs.forEach(o => o.update());
    powerUps.forEach(p => p.update());
    obstacles.forEach(o => o.update());

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(t => { t.y += t.vy; t.life -= 0.022; });
    floatingTexts.splice(0, floatingTexts.length, ...floatingTexts.filter(t => t.life > 0));

    shake.intensity *= 0.78;
    shake.x = (Math.random()-0.5) * shake.intensity;
    shake.y = (Math.random()-0.5) * shake.intensity;

    maybeSpawnPup();
}

function draw() {
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Background
    ctx.fillStyle = '#06060e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Arena floor
    ctx.fillStyle = '#0b0b18';
    ctx.fillRect(arena.x, arena.y, arena.w, arena.h);

    // Grid lines
    ctx.strokeStyle = '#10101f';
    ctx.lineWidth = 1;
    const gs = 55;
    for (let x = arena.x; x <= arena.x + arena.w; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, arena.y); ctx.lineTo(x, arena.y + arena.h); ctx.stroke();
    }
    for (let y = arena.y; y <= arena.y + arena.h; y += gs) {
        ctx.beginPath(); ctx.moveTo(arena.x, y); ctx.lineTo(arena.x + arena.w, y); ctx.stroke();
    }

    // Center cross
    ctx.strokeStyle = '#14142a';
    ctx.lineWidth = 1.5;
    const cx = arena.x + arena.w/2, cy = arena.y + arena.h/2;
    ctx.beginPath(); ctx.moveTo(cx, arena.y+20); ctx.lineTo(cx, arena.y+arena.h-20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arena.x+20, cy); ctx.lineTo(arena.x+arena.w-20, cy); ctx.stroke();
    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI*2);
    ctx.strokeStyle = '#14142a'; ctx.stroke();

    // Arena border glow
    ctx.shadowBlur = 20; ctx.shadowColor = '#2233aa';
    ctx.strokeStyle = '#2a3060';
    ctx.lineWidth = 3;
    ctx.strokeRect(arena.x, arena.y, arena.w, arena.h);
    ctx.shadowBlur = 0;

    // Corner squares
    const cs = 14;
    ctx.fillStyle = '#2a3060';
    [[arena.x, arena.y],[arena.x+arena.w, arena.y],[arena.x, arena.y+arena.h],[arena.x+arena.w, arena.y+arena.h]]
        .forEach(([x,y]) => ctx.fillRect(x-cs/2, y-cs/2, cs, cs));

    // Progress bars (below arena)
    if (gameRunning && players.length > 0) {
        const bw = 80, bh = 5, gap = 10;
        const totalW = players.length * (bw + gap) - gap;
        let bx = arena.x + arena.w/2 - totalW/2;
        const by = arena.y + arena.h + 14;
        players.forEach(p => {
            const fill = Math.min(1, p.score / winScore);
            ctx.fillStyle = '#1a1a28';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = fill > 0 ? 6 : 0;
            ctx.fillRect(bx, by, bw * fill, bh);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = p.color + '44';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);
            bx += bw + gap;
        });
    }

    // Game objects
    obstacles.forEach(o => o.draw(ctx));
    orbs.forEach(o => o.draw(ctx));
    powerUps.forEach(p => p.draw(ctx));
    players.forEach(p => p.draw(ctx));
    particles.forEach(p => p.draw(ctx));

    // Floating texts
    floatingTexts.forEach(t => {
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.font = `bold 16px 'Orbitron', monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color; ctx.shadowBlur = 8;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

// ============================================================
//  MENU + UI LOGIC
// ============================================================
document.querySelectorAll('.player-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPlayers = parseInt(btn.dataset.players);
        updateControlsPreview();
    });
});

document.querySelectorAll('.score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.score-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        winScore = parseInt(btn.dataset.score);
    });
});

function updateControlsPreview() {
    const list = document.getElementById('controls-list');
    list.innerHTML = '';
    for (let i = 1; i <= selectedPlayers; i++) {
        const p = PLAYER_CONTROLS[i];
        const row = document.createElement('div');
        row.className = 'player-control-row';
        row.innerHTML = `
            <span class="p-name" style="color:${p.color}">${p.name}</span>
            <span class="key-hints">
                GAS:${p.gas.toUpperCase()} &nbsp;
                LEFT:${p.left.toUpperCase()} &nbsp;
                RIGHT:${p.right.toUpperCase()} &nbsp;
                REV:${p.rev.toUpperCase()}
            </span>`;
        list.appendChild(row);
    }
}
updateControlsPreview();

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('menu-overlay').classList.add('hidden');
    positionArena();
    startGame();
});

// Restart / menu buttons on win screen
document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('win-overlay').classList.add('hidden');
    particles.length = 0;
    startGame();
});
document.getElementById('btn-menu').addEventListener('click', () => {
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
    players = []; particles = []; orbs = []; powerUps = [];
    gameRunning = false;
    updateControlsPreview();
});

// Fullscreen
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
});
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreen-btn');
    if (btn) btn.textContent = document.fullscreenElement ? '✕' : '⛶';
});
