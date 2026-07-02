// Non-enemy entities: collectibles, power-ups, projectiles, springs, platforms,
// checkpoints, and the level goal gate.
import { TILE, POWER } from './const.js';
import { aabb, rand } from './util.js';
import { getSprite } from './sprites.js';
import { sfx } from './sfx.js';
import { tileSolid } from './tiles.js';

let nextId = 1;

export class Entity {
  constructor(g, x, y, w, h) {
    this.g = g; this.id = nextId++;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.dead = false;
    this.solidGround = true;
  }
  get hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  overlapsPlayer() { return !this.g.player.dead && aabb(this.hitbox, this.g.player.hitbox); }
  update(dt) { /* override */ }
  draw(ctx, cx, cy) { /* override */ }

  // Simple gravity + ground stop used by drops/pickups.
  fall(dt, bounce = 0) {
    this.vy = Math.min(this.vy + 830 * dt, 280);
    this.y += this.vy * dt;
    const tx0 = Math.floor(this.x / TILE), tx1 = Math.floor((this.x + this.w - 0.01) / TILE);
    const ty = Math.floor((this.y + this.h) / TILE);
    for (let tx = tx0; tx <= tx1; tx++) {
      if (tileSolid(this.g.tileAt(tx, ty))) {
        this.y = ty * TILE - this.h - 0.01;
        this.vy = bounce ? -this.vy * bounce : 0;
        return true;
      }
    }
    return false;
  }
}

// --- Petal: the currency -----------------------------------------------------
export class Petal extends Entity {
  constructor(g, x, y, { pop = false } = {}) {
    super(g, x + 5, y + 5, 6, 6);
    this.t = rand(0, 2);
    this.pop = pop;
    if (pop) { this.vy = -190; this.vx = rand(-30, 30); this.life = 0.8; }
  }
  update(dt) {
    this.t += dt;
    if (this.pop) {
      this.life -= dt;
      this.vy += 620 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.life <= 0) { this.collect(); return; }
    }
    if (this.overlapsPlayer()) this.collect();
  }
  collect() {
    this.dead = true;
    this.g.addCoins(1);
    sfx.coin();
    this.g.particles.burst(this.x + 3, this.y + 3, 4, { color: ['#ff9ac0', '#fff6ec'], maxSpeed: 50, g: 60 });
  }
  draw(ctx, cx, cy) {
    const f = Math.floor(this.t / 0.12) % 4;
    const name = ['petal1', 'petal2', 'petal3', 'petal2'][f];
    const img = getSprite(name);
    const bob = this.pop ? 0 : Math.sin(this.t * 3) * 1.5;
    ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy + bob));
  }
}

// --- Ancient Gem: one hidden per level ----------------------------------------
export class Gem extends Entity {
  constructor(g, x, y) { super(g, x + 3, y + 3, 10, 10); this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.overlapsPlayer()) {
      this.dead = true;
      this.g.collectGem();
    }
  }
  draw(ctx, cx, cy) {
    const img = getSprite('gem');
    const bob = Math.sin(this.t * 2.4) * 2;
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.t * 4);
    ctx.fillStyle = '#7ae0f0';
    ctx.beginPath();
    ctx.arc(this.x + 5 - cx, this.y + 5 - cy + bob, 9, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy + bob));
  }
}

// --- Heart ------------------------------------------------------------------
export class Heart extends Entity {
  constructor(g, x, y) { super(g, x + 4, y + 5, 8, 7); this.t = rand(0, 2); }
  update(dt) {
    this.t += dt;
    if (this.overlapsPlayer()) {
      this.dead = true;
      this.g.player.heal(1);
      sfx.powerup();
      this.g.particles.burst(this.x + 4, this.y + 3, 6, { color: ['#e04050', '#ff9ac0'], maxSpeed: 60 });
    }
  }
  draw(ctx, cx, cy) {
    ctx.drawImage(getSprite('heart'), Math.round(this.x - cx), Math.round(this.y - cy + Math.sin(this.t * 3) * 1.5));
  }
}

// --- Matryoshka: 1-up ---------------------------------------------------------
export class Matryoshka extends Entity {
  constructor(g, x, y, { walking = false } = {}) {
    super(g, x + 3, y + 5, 10, 11);
    this.walking = walking;
    this.dir = 1;
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.walking) {
      this.x += this.dir * 40 * dt;
      const ahead = this.g.tileAt(Math.floor((this.x + (this.dir > 0 ? this.w : 0)) / TILE), Math.floor((this.y + this.h / 2) / TILE));
      if (tileSolid(ahead)) this.dir *= -1;
      this.fall(dt);
    }
    if (this.overlapsPlayer()) {
      this.dead = true;
      this.g.addLife(1);
    }
  }
  draw(ctx, cx, cy) {
    const bob = this.walking ? Math.sin(this.t * 10) : 0;
    ctx.drawImage(getSprite('matryoshka'), Math.round(this.x - cx), Math.round(this.y - cy + bob));
  }
}

// --- Power-up pickup ----------------------------------------------------------
const PW_SPRITE = {
  [POWER.FIRE]: 'pw_fire', [POWER.ICE]: 'pw_ice', [POWER.WIND]: 'pw_wind',
  [POWER.BEAR]: 'pw_bear', [POWER.BOLT]: 'pw_bolt', [POWER.CRYSTAL]: 'pw_crystal',
  [POWER.SHADOW]: 'pw_shadow', [POWER.PHOENIX]: 'pw_phoenix'
};
export class PowerUp extends Entity {
  constructor(g, x, y, power, { rise = false } = {}) {
    super(g, x + 3, y + 5, 10, 10);
    this.power = power;
    this.t = 0;
    this.rise = rise ? 16 : 0; // rising out of a block
    this.dir = Math.random() < 0.5 ? -1 : 1;
  }
  update(dt) {
    this.t += dt;
    if (this.rise > 0) { this.rise -= 22 * dt; this.y -= 22 * dt; return; }
    // wander like a living blessing: walks off blocks so it's always reachable
    this.x += this.dir * 26 * dt;
    const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
    if (tileSolid(this.g.tileAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h / 2) / TILE))) ||
      this.x < 2 || this.x + this.w > this.g.levelW * TILE - 2) {
      this.dir *= -1;
    }
    const grounded = this.fall(dt);
    if (grounded) {
      // drop off ledges, but turn back at deep pits so it never falls out of the level
      const ftx = Math.floor((this.dir > 0 ? this.x + this.w + 2 : this.x - 2) / TILE);
      const fty = Math.floor((this.y + this.h) / TILE);
      let support = false;
      for (let d = 0; d < 6; d++) if (tileSolid(this.g.tileAt(ftx, fty + d))) { support = true; break; }
      if (!support) this.dir *= -1;
    }
    if (this.overlapsPlayer()) {
      this.dead = true;
      this.g.player.applyPower(this.power);
      this.g.showPowerBanner(this.power);
    }
  }
  draw(ctx, cx, cy) {
    const img = getSprite(PW_SPRITE[this.power] || 'pw_fire');
    // sparkle aura
    ctx.globalAlpha = 0.3 + 0.15 * Math.sin(this.t * 6);
    ctx.fillStyle = '#ffd042';
    ctx.beginPath();
    ctx.arc(this.x + 5 - cx, this.y + 4 - cy, 8, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy - 1));
  }
}

// --- Spring -------------------------------------------------------------------
export class Spring extends Entity {
  constructor(g, x, y) { super(g, x + 4, y + 11, 8, 5); this.animT = 0; }
  update(dt) {
    if (this.animT > 0) this.animT -= dt;
    const p = this.g.player;
    if (!p.dead && p.vy >= 0 && aabb({ x: this.x - 1, y: this.y - 4, w: this.w + 2, h: this.h + 4 }, p.hitbox)) {
      p.bounce(-450);
      p.springT = 0.3;
      this.animT = 0.25;
      sfx.jump();
      this.g.particles.burst(this.x + 4, this.y, 5, { color: '#c8ceda', maxSpeed: 60 });
    }
  }
  draw(ctx, cx, cy) {
    const img = getSprite(this.animT > 0 ? 'spring2' : 'spring1');
    ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy + (this.animT > 0 ? 0 : -0)));
  }
}

// --- Checkpoint ----------------------------------------------------------------
export class Checkpoint extends Entity {
  constructor(g, x, y) { super(g, x + 2, y - 8, 12, 24); this.active = false; }
  update(dt) {
    if (!this.active && this.overlapsPlayer()) {
      this.active = true;
      this.g.setCheckpoint(this.x + 2, this.y + this.h - 14);
      sfx.checkpoint();
      this.g.particles.burst(this.x + 4, this.y + 4, 10, { color: ['#e04050', '#ffd042'], maxSpeed: 70 });
      this.g.banner('checkpoint', '#7ae0f0');
    }
  }
  draw(ctx, cx, cy) {
    ctx.drawImage(getSprite(this.active ? 'checkpoint_on' : 'checkpoint_off'), Math.round(this.x - cx), Math.round(this.y - cy + 8));
  }
}

// --- Radiant Gate: level goal ----------------------------------------------------
export class Gate extends Entity {
  // hitbox extends well above the arch so higher jumps can't sail over it
  constructor(g, x, y) { super(g, x, y - 48, 16, 64); this.t = 0; this.triggered = false; }
  update(dt) {
    this.t += dt;
    if (!this.triggered && this.overlapsPlayer()) {
      this.triggered = true;
      this.g.completeLevel();
    }
  }
  draw(ctx, cx, cy) {
    const img = getSprite('gate');
    const baseY = this.y + this.h - 16; // arch sits at the bottom of the tall hitbox
    // glow
    ctx.globalAlpha = 0.25 + 0.12 * Math.sin(this.t * 3);
    ctx.fillStyle = '#ffd042';
    ctx.beginPath();
    ctx.arc(this.x + 8 - cx, baseY + 8 - cy, 16, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(img, Math.round(this.x - cx), Math.round(baseY - cy));
  }
}

// --- Moving platform ---------------------------------------------------------------
export class MovingPlatform extends Entity {
  constructor(g, x, y, { dx = 0, dy = 0, dist = 48, speed = 30 } = {}) {
    super(g, x, y, 32, 6);
    this.ox = x; this.oy = y;
    this.dx = dx; this.dy = dy;
    this.dist = dist; this.speed = speed;
    this.t = 0;
    this.solidGround = false;
  }
  update(dt) {
    this.t += dt;
    const s = Math.sin(this.t * this.speed / this.dist * 2) * this.dist;
    const nx = this.ox + this.dx * s, ny = this.oy + this.dy * s;
    const mvx = nx - this.x, mvy = ny - this.y;
    // carry the player
    const p = this.g.player;
    const standing = !p.dead && p.vy >= 0 &&
      p.x + p.w > this.x && p.x < this.x + this.w &&
      Math.abs((p.y + p.h) - this.y) < 4;
    this.x = nx; this.y = ny;
    if (standing) {
      p.x += mvx;
      p.y = this.y - p.h;
      p.grounded = true;
      p.coyote = 0.09;
      if (p.vy > 0) p.vy = 0;
    } else if (!p.dead && p.vy > 0) {
      // landing check
      const was = p.y + p.h - p.vy * dt;
      if (p.x + p.w > this.x && p.x < this.x + this.w && was <= this.y + 2 && p.y + p.h >= this.y) {
        p.y = this.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.jumping = false;
      }
    }
  }
  draw(ctx, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    ctx.fillStyle = '#b07840'; ctx.fillRect(x, y, this.w, this.h);
    ctx.fillStyle = '#d8a86a'; ctx.fillRect(x, y, this.w, 2);
    ctx.fillStyle = '#7a4c20'; ctx.fillRect(x, y + this.h - 2, this.w, 2);
    ctx.fillStyle = '#5c3a16'; ctx.fillRect(x + 3, y + 2, 2, 2); ctx.fillRect(x + this.w - 5, y + 2, 2, 2);
  }
}

// --- Projectiles --------------------------------------------------------------------
export class Projectile extends Entity {
  constructor(g, kind, x, y, vx, vy, fromPlayer) {
    const dims = { fire: [6, 6], ice: [6, 6], bone: [6, 6], bolt: [6, 6], snow: [5, 5], gear: [6, 6], seed: [4, 4], ember: [6, 6] };
    const [w, h] = dims[kind] || [6, 6];
    super(g, x - w / 2, y - h / 2, w, h);
    this.kind = kind;
    this.vx = vx; this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.t = 0;
    this.life = fromPlayer ? 1.6 : 4;
  }
  update(dt) {
    this.t += dt;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    // physics per kind
    if (this.kind === 'fire') {
      this.vy += 620 * dt;
    } else if (this.kind === 'bone' || this.kind === 'snow' || this.kind === 'seed') {
      this.vy += 420 * dt;
    } else if (this.kind === 'ember') {
      this.vy += 300 * dt;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // tile collision
    const t = this.g.tileAt(Math.floor((this.x + this.w / 2) / TILE), Math.floor((this.y + this.h / 2) / TILE));
    if (tileSolid(t)) {
      if (this.kind === 'fire') {
        // bounce off floors
        const below = this.g.tileAt(Math.floor((this.x + this.w / 2) / TILE), Math.floor((this.y + this.h) / TILE));
        if (this.vy > 0 && tileSolid(below)) { this.vy = -190; this.y -= 2; }
        else { this.explode(); return; }
      } else { this.explode(); return; }
    }

    if (this.fromPlayer) {
      // enemy hits handled in game.js (needs enemy list)
    } else if (this.overlapsPlayer()) {
      if (this.g.player.hurt(this.x)) { this.dead = true; }
    }
  }
  explode() {
    this.dead = true;
    const colors = { fire: ['#ff8830', '#ffd042'], ice: ['#7ae0f0', '#fff6ec'], bone: ['#fff6ec'], bolt: ['#ffe98a'], snow: ['#ffffff'], gear: ['#8e94a6'], seed: ['#3fae4a'], ember: ['#ff5020', '#ff8830'] };
    this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 6, { color: colors[this.kind] || ['#fff'], maxSpeed: 70 });
  }
  draw(ctx, cx, cy) {
    let name;
    if (this.kind === 'fire') name = Math.floor(this.t / 0.08) % 2 ? 'proj_fire1' : 'proj_fire2';
    else if (this.kind === 'ember') name = Math.floor(this.t / 0.1) % 2 ? 'proj_fire2' : 'proj_fire1';
    else name = 'proj_' + this.kind;
    const img = getSprite(name);
    if (!img) return;
    if (this.kind === 'bone' || this.kind === 'gear') {
      ctx.save();
      ctx.translate(Math.round(this.x + this.w / 2 - cx), Math.round(this.y + this.h / 2 - cy));
      ctx.rotate(this.t * 8);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    } else {
      ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy));
    }
  }
}
