// Enemy AI. Each archetype has distinct behavior; several have palette-swap
// variants across worlds (all art is original, see sprites.js).
import { TILE } from './const.js';
import { aabb, rand, clamp, sign, dist2 } from './util.js';
import { Entity, Projectile, Petal } from './entities.js';
import { getSprite, getTinted } from './sprites.js';
import { tileSolid, tileLiquid } from './tiles.js';
import { sfx } from './sfx.js';

export class Enemy extends Entity {
  constructor(g, x, y, w, h) {
    super(g, x, y, w, h);
    this.dir = -1;
    this.t = rand(0, 10);
    this.animT = 0;
    this.hp = 1;
    this.stompable = true;
    this.frozen = 0;         // seconds remaining as ice block
    this.flashT = 0;
    this.squashT = 0;        // squash death animation
    this.gravity = true;
    this.turnAtEdge = true;
    this.contactDamage = true;
    this.speed = 30;
    this.aiNote = '';        // for AI debug overlay
  }

  get isFrozen() { return this.frozen > 0; }

  freeze(dur = 5) {
    if (!this.stompable && this.hp > 3) return; // big enemies resist
    this.frozen = dur;
    sfx.freeze();
  }

  // damage from player attacks (fireball, roll, dash, pound shockwave)
  damage(n = 1, fx = null) {
    if (this.squashT > 0) return;
    this.hp -= n;
    this.flashT = 0.12;
    if (this.hp <= 0) this.kill(fx);
    else sfx.bossHit();
  }

  kill(fx = null) {
    if (this.squashT > 0) return;
    this.squashT = 0.001; // start death
    this.deathFly = fx !== 'stomp';
    if (this.deathFly) {
      this.vy = -160;
      this.vx = rand(-40, 40);
    }
    this.g.onEnemyKilled(this);
    sfx.stomp();
    this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 8, { color: ['#fff6ec', '#c8ceda'], maxSpeed: 80 });
    if (Math.random() < 0.18) this.g.entities.push(new Petal(this.g, this.x, this.y, { pop: true }));
  }

  stomped() {
    this.kill('stomp');
  }

  // standard patrol physics
  patrol(dt) {
    const spd = this.speed * this.g.enemySpeedScale;
    this.vx = this.dir * spd;
    this.x += this.vx * dt;
    // wall turn
    const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
    const midY = this.y + this.h / 2;
    if (tileSolid(this.g.tileAt(Math.floor(aheadX / TILE), Math.floor(midY / TILE)))) {
      this.dir *= -1;
      this.x += this.dir * 2;
    }
    if (this.x < 0 || this.x + this.w > this.g.levelW * TILE) { this.dir *= -1; this.x = clamp(this.x, 0, this.g.levelW * TILE - this.w); }
    if (this.gravity) this.applyGravity(dt);
    // edge turn (after gravity so grounded is fresh)
    if (this.turnAtEdge && this.grounded) {
      const footX = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      const below = this.g.tileAt(Math.floor(footX / TILE), Math.floor((this.y + this.h + 2) / TILE));
      if (!tileSolid(below)) this.dir *= -1;
    }
  }

  applyGravity(dt) {
    this.vy = Math.min(this.vy + 830 * dt, 300);
    this.y += this.vy * dt;
    this.grounded = false;
    const tx0 = Math.floor((this.x + 1) / TILE), tx1 = Math.floor((this.x + this.w - 1) / TILE);
    if (this.vy >= 0) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tileSolid(this.g.tileAt(tx, ty))) {
          this.y = ty * TILE - this.h - 0.01;
          this.vy = 0;
          this.grounded = true;
          break;
        }
      }
    }
  }

  // shared interaction: player stomp / contact damage
  interactPlayer() {
    const p = this.g.player;
    if (p.dead || this.squashT > 0) return;
    if (!this.overlapsPlayer()) return;

    if (this.isFrozen) return; // frozen enemies are platforms, handled in game

    // rolling/dashing hits
    if ((p.state === 'roll' || p.state === 'dash') && this.stompable !== 'never') {
      if (p.boltDash || p.state === 'roll' || this.stompable) { this.damage(2, 'dash'); return; }
    }

    const stomping = p.vy > 40 && (p.y + p.h) < this.y + this.h * 0.6;
    const pounding = p.state === 'pound' && p.poundPhase === 1;
    if ((stomping || pounding) && this.stompable) {
      this.stomped();
      p.stompChain = Math.min(p.stompChain + 1, 7);
      const bonus = [10, 20, 40, 80, 100, 200, 400, 1000][p.stompChain - 1] || 10;
      this.g.particles.text(this.x + this.w / 2, this.y - 4, String(bonus), '#ffd042');
      if (p.stompChain >= 7) this.g.addLife(1);
      p.bounce(pounding ? -240 : (this.g.input.down('jump') ? -250 : -170));
      return;
    }
    if (pounding && !this.stompable) { this.damage(2, 'pound'); p.bounce(-200); return; }

    if (this.contactDamage) p.hurt(this.x + this.w / 2);
  }

  baseUpdate(dt) {
    this.t += dt;
    this.animT += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.squashT > 0) {
      this.squashT += dt;
      if (this.deathFly) {
        this.vy += 620 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.squashT > 1.2) this.dead = true;
      } else if (this.squashT > 0.4) this.dead = true;
      return false;
    }
    if (this.frozen > 0) {
      this.frozen -= dt;
      if (this.gravity) this.applyGravity(dt);
      // player can stand on frozen enemies
      const p = this.g.player;
      if (!p.dead && p.vy >= 0) {
        const was = p.y + p.h - p.vy * dt;
        if (p.x + p.w > this.x && p.x < this.x + this.w && was <= this.y + 3 && p.y + p.h >= this.y && p.y + p.h < this.y + this.h) {
          p.y = this.y - p.h; p.vy = 0; p.grounded = true; p.jumping = false;
        }
      }
      if (this.frozen <= 0) this.flashT = 0.15;
      return false;
    }
    if (this.g.cheats.freeze) { this.interactPlayer(); return false; }
    return true;
  }

  drawSprite(ctx, cx, cy, name, flipOverride = null) {
    const flip = flipOverride !== null ? flipOverride : this.dir > 0;
    const opts = { flip, pal: this.pal || null, palId: this.palId || '' };
    let img;
    if (this.isFrozen) img = getTinted(name, opts, '#7ae0f0', 0.55);
    else if (this.flashT > 0) img = getTinted(name, opts, '#ffffff', 0.8);
    else img = getSprite(name, opts);
    if (!img) return;
    const dx = Math.round(this.x - cx - (img.width - this.w) / 2);
    let dy = Math.round(this.y - cy - (img.height - this.h));
    if (this.squashT > 0 && !this.deathFly) {
      // squash flat
      const k = Math.max(0.2, 1 - this.squashT * 2.5);
      ctx.save();
      ctx.translate(dx + img.width / 2, this.y + this.h - cy);
      ctx.scale(1, k);
      ctx.drawImage(img, -img.width / 2, -img.height);
      ctx.restore();
      return;
    }
    if (this.squashT > 0 && this.deathFly) {
      ctx.save();
      ctx.translate(dx + img.width / 2, dy + img.height / 2);
      ctx.scale(1, -1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      return;
    }
    ctx.drawImage(img, dx, dy);
    if (this.isFrozen) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#a8dff0';
      ctx.fillRect(dx - 1, dy - 1, img.width + 2, img.height + 2 + (this.y + this.h - (dy + img.height - cy)));
      ctx.globalAlpha = 1;
    }
  }
}

// --- Walker: Burrik & kin -------------------------------------------------------
export class Walker extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 6, 12, 10);
    this.speed = variant.speed || 26;
    this.sprite = variant.sprite || 'burrik';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'patrol';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.patrol(dt);
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.16) % 2 + 1));
  }
}

// --- Hopper: Springpaw ------------------------------------------------------------
export class Hopper extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 5, 12, 11);
    this.hopT = rand(0.4, 1.2);
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'hop toward player';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.applyGravity(dt);
    if (this.grounded) {
      this.vx = 0;
      this.hopT -= dt;
      if (this.hopT <= 0) {
        const p = this.g.player;
        this.dir = p.x > this.x ? 1 : -1;
        this.vy = -220;
        this.vx = this.dir * 70 * this.g.enemySpeedScale;
        this.hopT = rand(0.7, 1.4);
      }
    }
    this.x += this.vx * dt;
    if (this.x < 0 || this.x + this.w > this.g.levelW * TILE) { this.vx *= -1; this.dir *= -1; }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.grounded ? 'springpaw1' : 'springpaw2');
  }
}

// --- Flyer: sine wave -----------------------------------------------------------
export class Flyer extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 8);
    this.oy = this.y;
    this.gravity = false;
    this.speed = variant.speed || 36;
    this.amp = variant.amp || 22;
    this.sprite = variant.sprite || 'buzzwing';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'sine flight';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    this.x += this.dir * this.speed * this.g.enemySpeedScale * dt;
    this.y = this.oy + Math.sin(this.t * 3) * this.amp;
    const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
    if (tileSolid(this.g.tileAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h / 2) / TILE))) ||
      this.x < 0 || this.x + this.w > this.g.levelW * TILE) this.dir *= -1;
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.1) % 2 + 1));
  }
}

// --- Diver: hangs, then dives at player (Glimmerbat) --------------------------------
export class Diver extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 2, 12, 9);
    this.oy = this.y;
    this.gravity = false;
    this.mode = 'wait';
    this.sprite = variant.sprite || 'glimmerbat';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'dive when near';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    if (this.mode === 'wait') {
      this.aiNote = 'waiting';
      if (Math.abs(p.x - this.x) < 70 && p.y > this.y) {
        this.mode = 'dive';
        this.vx = sign(p.x - this.x) * 90;
        this.vy = 140;
      }
    } else if (this.mode === 'dive') {
      this.aiNote = 'dive!';
      this.x += this.vx * this.g.enemySpeedScale * dt;
      this.y += this.vy * this.g.enemySpeedScale * dt;
      if (this.y > p.y + 20 || tileSolid(this.g.tileAt(Math.floor((this.x + this.w / 2) / TILE), Math.floor((this.y + this.h) / TILE)))) {
        this.mode = 'return';
      }
    } else {
      this.aiNote = 'return';
      this.y -= 60 * dt;
      this.x += Math.sin(this.t * 6) * 12 * dt;
      if (this.y <= this.oy) { this.y = this.oy; this.mode = 'wait'; }
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    const f = this.mode === 'wait' ? 'glimmerbat1' : (Math.floor(this.animT / 0.09) % 2 ? 'glimmerbat1' : 'glimmerbat2');
    this.drawSprite(ctx, cx, cy, f);
  }
}

// --- Armored: Thornshell (stomp bounces off; must roll/dash/fire) ---------------------
export class Armored extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 7, 12, 9);
    this.stompable = false;
    this.hp = 2;
    this.speed = variant.speed || 22;
    this.sprite = variant.sprite || 'thornshell';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'armored patrol';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.patrol(dt);
    // spiky top: stomping hurts the player instead
    const p = this.g.player;
    if (!p.dead && this.overlapsPlayer() && !this.isFrozen) {
      if (p.state === 'roll' || p.state === 'dash' || (p.state === 'pound' && p.poundPhase === 1)) {
        this.damage(1, 'dash');
        if (p.state === 'pound') p.bounce(-200);
      } else {
        p.hurt(this.x + this.w / 2);
      }
    }
  }
  interactPlayer() { /* handled in update */ }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.2) % 2 + 1));
  }
}

// --- Lunger: Vinesnap (rises and snaps when player is close) ---------------------------
export class Lunger extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 6, 12, 10);
    this.baseY = y + 6;
    this.gravity = false;
    this.mode = 'hide';
    this.hideY = this.baseY + 12;
    this.y = this.hideY;
    this.stompable = false;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'ambush lunge';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    const near = Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) < 46;
    if (this.mode === 'hide') {
      this.y = Math.min(this.y + 40 * dt, this.hideY);
      this.contactDamage = false;
      if (near && this.t > 1) { this.mode = 'rise'; this.t = 0; }
    } else if (this.mode === 'rise') {
      this.contactDamage = true;
      this.y -= 90 * dt;
      if (this.y <= this.baseY - 14) { this.mode = 'hold'; this.t = 0; }
    } else if (this.mode === 'hold') {
      if (this.t > 0.9) { this.mode = 'hide'; this.t = 0; }
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, Math.floor(this.animT / 0.14) % 2 ? 'vinesnap1' : 'vinesnap2', this.g.player.x > this.x);
  }
}

// --- Swooper: Owlet --------------------------------------------------------------------
export class Swooper extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 9);
    this.oy = this.y;
    this.ox = this.x;
    this.gravity = false;
    this.mode = 'perch';
    this.sprite = variant.sprite || 'owlet';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'swoop arc';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    if (this.mode === 'perch') {
      if (Math.abs(p.x - this.x) < 90 && this.t > 0.6) {
        this.mode = 'swoop'; this.t = 0;
        this.swoopDir = sign(p.x - this.x) || 1;
        this.dir = this.swoopDir;
      }
    } else if (this.mode === 'swoop') {
      // parabolic arc down then up
      const T = 1.4;
      const k = this.t / T;
      this.x += this.swoopDir * 95 * this.g.enemySpeedScale * dt;
      this.y = this.oy + Math.sin(Math.min(k, 1) * Math.PI) * 64;
      if (k >= 1) { this.mode = 'perch'; this.t = 0; this.oy = this.y; this.ox = this.x; }
    }
    if (this.x < 0 || this.x + this.w > this.g.levelW * TILE) this.swoopDir = (this.swoopDir || 1) * -1;
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    const f = this.mode === 'perch' ? this.sprite + '1' : this.sprite + (Math.floor(this.animT / 0.12) % 2 + 1);
    this.drawSprite(ctx, cx, cy, f);
  }
}

// --- Golem: heavy, front-shielded ---------------------------------------------------------
export class Golem extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 1, y + 2, 14, 14);
    this.hp = 3;
    this.stompable = false;
    this.speed = 14;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'slow tank';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.patrol(dt);
    const p = this.g.player;
    if (!p.dead && this.overlapsPlayer() && !this.isFrozen) {
      if (p.state === 'pound' && p.poundPhase === 1) { this.damage(p.power === 'bear' ? 3 : 1, 'pound'); p.bounce(-220); }
      else if (p.state === 'dash' && p.boltDash) this.damage(2, 'dash');
      else p.hurt(this.x + this.w / 2);
    }
  }
  interactPlayer() { /* in update */ }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, 'golem' + (Math.floor(this.animT / 0.3) % 2 + 1));
  }
}

// --- Dropper: ceiling slime --------------------------------------------------------------
export class Dropper extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y, 12, 9);
    this.oy = y;
    this.gravity = false;
    this.mode = 'ceil';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'drops from ceiling';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) { this.applyGravity(dt); return; }
    const p = this.g.player;
    if (this.mode === 'ceil') {
      if (Math.abs((p.x + p.w / 2) - (this.x + this.w / 2)) < 14 && p.y > this.y) {
        this.mode = 'fall';
      }
    } else if (this.mode === 'fall') {
      this.applyGravity(dt);
      if (this.grounded) { this.mode = 'floor'; this.t = 0; }
    } else {
      // crawl on floor
      this.patrol(dt);
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    if (this.mode === 'floor') {
      this.drawSprite(ctx, cx, cy, 'drippy' + (Math.floor(this.animT / 0.2) % 2 + 1), false);
    } else {
      // hanging upside down
      const img = getSprite('drippy1', { pal: this.pal, palId: this.palId || '' });
      ctx.drawImage(img, Math.round(this.x - cx), Math.round(this.y - cy));
    }
  }
}

// --- Burrower: Sandmaw — erupts under the player -------------------------------------------
export class Burrower extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 4, 12, 12);
    this.gravity = false;
    this.mode = 'lurk';
    this.groundY = y + 16;
    this.stompable = false;
    this.sprite = variant.sprite || 'sandmaw';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'erupts beneath you';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    if (this.mode === 'lurk') {
      this.contactDamage = false;
      // shadow follows player along the ground within range
      if (Math.abs(p.x - this.x) < 120) {
        this.x += clamp(p.x - this.x, -1, 1) * 40 * dt;
      }
      this.y = this.groundY;
      if (Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) < 10 && this.t > 1.2 && p.grounded) {
        this.mode = 'erupt'; this.t = 0;
        this.g.particles.burst(this.x + this.w / 2, this.groundY, 8, { color: ['#d8b078', '#a07840'], maxSpeed: 60 });
      }
    } else if (this.mode === 'erupt') {
      this.contactDamage = true;
      this.y -= 130 * dt;
      if (this.y < this.groundY - 34) { this.mode = 'sink'; }
    } else {
      this.y += 60 * dt;
      if (this.y >= this.groundY) { this.y = this.groundY; this.mode = 'lurk'; this.t = 0; }
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    if (this.mode === 'lurk') {
      // just a moving mound
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(Math.round(this.x - cx), Math.round(this.groundY - cy - 2), 12, 2);
      return;
    }
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.1) % 2 + 1), false);
  }
}

// --- Spiky pacer: Cactling (never stompable) ------------------------------------------------
export class Spiky extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 7, 12, 9);
    this.stompable = false;
    this.speed = variant.speed || 20;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'spiky - no stomp';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.patrol(dt);
    const p = this.g.player;
    if (!p.dead && this.overlapsPlayer() && !this.isFrozen) {
      if (p.state === 'dash' && p.boltDash) this.damage(2, 'dash');
      else p.hurt(this.x + this.w / 2);
    }
  }
  interactPlayer() { /* in update */ }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, 'cactling' + (Math.floor(this.animT / 0.2) % 2 + 1));
  }
}

// --- Charger: Icehorn / Steamroller ----------------------------------------------------------
export class Charger extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 1, y + 2, 14, 14);
    this.mode = 'idle';
    this.hp = 2;
    this.sprite = variant.sprite || 'icehorn';
    this.stompable = variant.sprite !== 'steam';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'charges on sight';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    const p = this.g.player;
    if (this.mode === 'idle') {
      this.patrolSpeed = 12;
      this.speed = 12;
      this.patrol(dt);
      const sameLevel = Math.abs((p.y + p.h) - (this.y + this.h)) < 24;
      const facingPlayer = sign(p.x - this.x) === this.dir;
      if (sameLevel && facingPlayer && Math.abs(p.x - this.x) < 130 && this.t > 0.8) {
        this.mode = 'windup'; this.t = 0;
      }
    } else if (this.mode === 'windup') {
      this.aiNote = 'windup!';
      if (this.t > 0.35) { this.mode = 'charge'; this.t = 0; sfx.dash(); }
      this.applyGravity(dt);
    } else if (this.mode === 'charge') {
      this.aiNote = 'CHARGING';
      this.speed = 150;
      this.vx = this.dir * this.speed * this.g.enemySpeedScale;
      this.x += this.vx * dt;
      this.applyGravity(dt);
      const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      if (tileSolid(this.g.tileAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h / 2) / TILE)))) {
        this.mode = 'stun'; this.t = 0;
        this.g.camera.shake(3, 0.15);
        sfx.bump();
        this.dir *= -1;
      }
      if (this.t > 1.6) { this.mode = 'idle'; this.t = 0; }
    } else if (this.mode === 'stun') {
      this.aiNote = 'stunned';
      this.applyGravity(dt);
      if (this.t > 1.1) { this.mode = 'idle'; this.t = 0; }
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    const shake = this.mode === 'windup' ? Math.sin(this.t * 40) * 1 : 0;
    const fr = this.mode === 'charge' ? 0.08 : 0.25;
    this.drawSprite(ctx, cx + shake, cy, this.sprite + (Math.floor(this.animT / fr) % 2 + 1));
  }
}

// --- FloatShooter: Frostpuff / Cloudkin / Emberling ---------------------------------------------
export class FloatShooter extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 10);
    this.oy = this.y;
    this.gravity = false;
    this.proj = variant.proj || 'snow';
    this.sprite = variant.sprite || 'frostpuff';
    this.shootT = rand(1, 2.4);
    this.drops = variant.drops || false; // cloudkin drops bolts straight down
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'floats + shoots';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) { this.applyGravity(dt); return; }
    this.y = this.oy + Math.sin(this.t * 1.8) * 8;
    const p = this.g.player;
    if (this.drops) {
      // drift horizontally above the player
      this.x += clamp(p.x - this.x, -1, 1) * 26 * this.g.enemySpeedScale * dt;
    }
    this.shootT -= dt;
    if (this.shootT <= 0 && Math.abs(p.x - this.x) < 150 && !p.dead) {
      this.shootT = rand(1.6, 2.6) / this.g.enemySpeedScale;
      if (this.drops) {
        this.g.entities.push(new Projectile(this.g, this.proj, this.x + this.w / 2, this.y + this.h + 2, 0, 60, false));
      } else {
        const dx = p.x - this.x, dy = (p.y - 6) - this.y;
        const d = Math.max(20, Math.hypot(dx, dy));
        const sp = this.proj === 'ember' ? 80 : 110;
        this.g.entities.push(new Projectile(this.g, this.proj, this.x + this.w / 2, this.y + this.h / 2, dx / d * sp, this.proj === 'ember' ? -110 : dy / d * sp, false));
      }
      sfx.shoot();
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.2) % 2 + 1), this.g.player.x < this.x);
  }
}

// --- Wisp: only moves when you're not looking ---------------------------------------------------
export class Wisp extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 10);
    this.gravity = false;
    this.stompable = false;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'moves when unseen';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    const facingMe = sign((this.x + this.w / 2) - (p.x + p.w / 2)) === p.facing;
    if (!facingMe && !p.dead) {
      this.aiNote = 'chasing!';
      const dx = (p.x + p.w / 2) - (this.x + this.w / 2);
      const dy = (p.y + p.h / 2) - (this.y + this.h / 2);
      const d = Math.max(10, Math.hypot(dx, dy));
      const sp = 54 * this.g.enemySpeedScale;
      this.x += dx / d * sp * dt;
      this.y += dy / d * sp * dt;
    } else {
      this.aiNote = 'shy...';
    }
    const dodge = p.state === 'dash' && p.boltDash;
    if (!p.dead && this.overlapsPlayer()) {
      if (dodge || (p.power === 'fire' && p.state === 'roll')) this.damage(2, 'dash');
      else if (this.contactDamage) p.hurt(this.x + this.w / 2);
    }
  }
  interactPlayer() { /* custom above */ }
  draw(ctx, cx, cy) {
    const p = this.g.player;
    const facingMe = sign((this.x + this.w / 2) - (p.x + p.w / 2)) === p.facing;
    ctx.globalAlpha = facingMe ? 0.9 : 0.55;
    this.drawSprite(ctx, cx, cy, 'wisp' + (Math.floor(this.animT / 0.25) % 2 + 1), p.x > this.x);
    ctx.globalAlpha = 1;
  }
}

// --- Rattlebones: skeleton lobbing bones ----------------------------------------------------------
export class Thrower extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 1, 12, 15);
    this.throwT = rand(1, 2);
    this.proj = variant.proj || 'bone';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'lobs bones';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.applyGravity(dt);
    const p = this.g.player;
    this.dir = p.x > this.x ? 1 : -1;
    this.throwT -= dt;
    this.throwing = this.throwT > -0.3 && this.throwT < 0.15;
    if (this.throwT <= 0 && Math.abs(p.x - this.x) < 170 && !p.dead) {
      this.throwT = rand(1.6, 2.8) / this.g.enemySpeedScale;
      const dx = p.x - this.x;
      this.g.entities.push(new Projectile(this.g, this.proj, this.x + this.w / 2, this.y + 3, sign(dx) * (60 + Math.min(120, Math.abs(dx)) * 0.6), -170, false));
      sfx.shoot();
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.throwing ? 'rattle2' : 'rattle1', this.dir > 0);
  }
}

// --- Shade: teleports near the player -----------------------------------------------------------
export class Shade extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 12);
    this.gravity = false;
    this.teleT = 2;
    this.visible = true;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'teleports';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    this.teleT -= dt;
    if (this.teleT <= 0.5) this.visible = false;
    if (this.teleT <= 0 && !p.dead) {
      // teleport to a spot near the player
      const side = Math.random() < 0.5 ? -1 : 1;
      this.x = clamp(p.x + side * rand(40, 70), 8, this.g.levelW * TILE - 20);
      this.y = clamp(p.y - rand(10, 40), 8, this.g.levelH * TILE - 40);
      this.teleT = rand(1.8, 2.8) / this.g.enemySpeedScale;
      this.visible = true;
      this.g.particles.burst(this.x + 6, this.y + 6, 8, { color: ['#9a4ad0', '#5c2a80'], maxSpeed: 60 });
    }
    if (this.visible) {
      // slow drift toward player
      this.x += clamp(p.x - this.x, -1, 1) * 18 * dt;
      this.y += clamp(p.y - this.y, -1, 1) * 12 * dt;
      this.contactDamage = true;
    } else this.contactDamage = false;
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    if (!this.visible) return;
    const fade = Math.min(1, this.teleT - 0.5 > 0 ? 1 : (this.teleT) * 2);
    ctx.globalAlpha = clamp(fade, 0, 1);
    this.drawSprite(ctx, cx, cy, 'shade' + (Math.floor(this.animT / 0.2) % 2 + 1), this.g.player.x > this.x);
    ctx.globalAlpha = 1;
  }
}

// --- Turret: Coggun ------------------------------------------------------------------------------
export class Turret extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 6, 12, 10);
    this.gravity = false;
    this.stompable = false;
    this.hp = 2;
    this.shootT = rand(1, 2);
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'fixed turret';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    if (this.isFrozen) return;
    const p = this.g.player;
    this.shootT -= dt;
    if (this.shootT <= 0 && Math.abs(p.x - this.x) < 180 && Math.abs(p.y - this.y) < 90 && !p.dead) {
      this.shootT = 2.2 / this.g.enemySpeedScale;
      const dir = sign(p.x - this.x) || 1;
      this.g.entities.push(new Projectile(this.g, 'gear', this.x + this.w / 2 + dir * 8, this.y + this.h / 2, dir * 120, 0, false));
      sfx.shoot();
    }
    const pl = this.g.player;
    if (!pl.dead && this.overlapsPlayer()) {
      if (pl.state === 'pound' && pl.poundPhase === 1) { this.damage(2, 'pound'); pl.bounce(-200); }
      else if (pl.state === 'dash' || pl.state === 'roll') this.damage(1, 'dash');
      else pl.hurt(this.x + this.w / 2);
    }
  }
  interactPlayer() { /* custom */ }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, 'coggun' + (Math.floor(this.animT / 0.3) % 2 + 1), false);
  }
}

// --- Dragonewt: patrols, slashes when close --------------------------------------------------------
export class Dragonewt extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 1, y + 1, 13, 15);
    this.hp = 2;
    this.speed = 24;
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'sword patrol';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    const p = this.g.player;
    const near = Math.abs(p.x - this.x) < 30 && Math.abs(p.y - this.y) < 20;
    if (near && !p.dead) {
      this.dir = sign(p.x - this.x) || this.dir;
      this.slashing = true;
      this.vx = this.dir * 60 * this.g.enemySpeedScale;
      this.x += this.vx * dt;
      this.applyGravity(dt);
    } else {
      this.slashing = false;
      this.patrol(dt);
    }
    this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    this.drawSprite(ctx, cx, cy, this.slashing ? 'dnewt2' : 'dnewt1');
  }
}

// --- Leaper: Magmaworm — jumps out of lava/pits ------------------------------------------------------
export class Leaper extends Enemy {
  constructor(g, x, y, variant = {}) {
    super(g, x + 2, y + 3, 12, 12);
    this.homeY = y + 20;
    this.y = this.homeY;
    this.gravity = false;
    this.stompable = false;
    this.jumpT = rand(0.5, 2);
    this.vy = 0;
    this.sprite = variant.sprite || 'magma';
    this.pal = variant.pal; this.palId = variant.palId;
    this.aiNote = 'leaps from below';
  }
  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.jumpT -= dt;
    if (this.jumpT <= 0 && this.y >= this.homeY) {
      this.vy = -300;
      this.jumpT = rand(2.2, 3.4) / this.g.enemySpeedScale;
      this.g.particles.burst(this.x + this.w / 2, this.homeY, 6, { color: ['#ff8830', '#ffd042'], maxSpeed: 60 });
    }
    if (this.y < this.homeY || this.vy < 0) {
      this.vy += 520 * dt;
      this.y += this.vy * dt;
      if (this.y > this.homeY) { this.y = this.homeY; this.vy = 0; }
    }
    this.contactDamage = this.y < this.homeY - 4;
    if (this.contactDamage) this.interactPlayer();
  }
  draw(ctx, cx, cy) {
    if (this.y >= this.homeY - 2) return;
    this.drawSprite(ctx, cx, cy, this.sprite + (Math.floor(this.animT / 0.12) % 2 + 1), false);
  }
}

// ---------------------------------------------------------------------------
// Enemy registry: level chars → constructors (per world, with palette variants)
// ---------------------------------------------------------------------------
export const ENEMY_FACTORY = {
  walker: (g, x, y, w) => new Walker(g, x, y,
    w >= 8 ? { pal: { e: '#8e94a6', E: '#555b6e', l: '#c8ceda' }, palId: 'gray' } :
    w >= 4 ? { pal: { e: '#d8a850', E: '#a3742f', l: '#ffe98a' }, palId: 'sand' } : {}),
  hopper: (g, x, y, w) => new Hopper(g, x, y,
    w >= 5 ? { pal: { m: '#a8c8e8', M: '#6a88b0', w: '#ffffff' }, palId: 'snowpaw' } : {}),
  flyer: (g, x, y, w) => new Flyer(g, x, y,
    w >= 6 ? { sprite: 'galewing', speed: 44 } :
    w >= 3 ? { sprite: 'buzzwing', pal: { p: '#7ae0f0', P: '#2a90c0' }, palId: 'cavefly' } : {}),
  diver: (g, x, y, w) => new Diver(g, x, y, {}),
  armored: (g, x, y, w) => new Armored(g, x, y,
    w >= 8 ? { pal: { e: '#787886', E: '#4a4a58', l: '#b0b0bc' }, palId: 'mech' } : {}),
  lunger: (g, x, y, w) => new Lunger(g, x, y,
    w >= 9 ? { pal: { E: '#8a2a10', e: '#c05510' }, palId: 'lava' } : {}),
  swooper: (g, x, y, w) => new Swooper(g, x, y, {}),
  golem: (g, x, y, w) => new Golem(g, x, y,
    w >= 8 ? { pal: { a: '#8a7a5c', A: '#5c5040', x: '#c8b890' }, palId: 'rustgolem' } : {}),
  dropper: (g, x, y, w) => new Dropper(g, x, y,
    w >= 5 ? { pal: { u: '#a8dff0', U: '#5aa8cc' }, palId: 'iceslime' } :
    w >= 7 ? { pal: { u: '#9a4ad0', U: '#5c2a80' }, palId: 'ghostslime' } : {}),
  burrower: (g, x, y, w) => new Burrower(g, x, y,
    w >= 9 ? { pal: { t: '#c05510', T: '#8a2a10', w: '#ffd042' }, palId: 'magmamaw' } : {}),
  spiky: (g, x, y, w) => new Spiky(g, x, y,
    w >= 5 ? { pal: { e: '#a8dff0', E: '#5aa8cc', l: '#ffffff' }, palId: 'icespike' } : {}),
  charger: (g, x, y, w) => new Charger(g, x, y,
    w >= 8 ? { sprite: 'steam' } : {}),
  floatshooter: (g, x, y, w) => new FloatShooter(g, x, y,
    w >= 9 ? { sprite: 'ember', proj: 'ember' } :
    w >= 6 ? { sprite: 'cloudkin', proj: 'bolt', drops: true } :
    { sprite: 'frostpuff', proj: 'snow' }),
  wisp: (g, x, y, w) => new Wisp(g, x, y, {}),
  thrower: (g, x, y, w) => new Thrower(g, x, y, {}),
  shade: (g, x, y, w) => new Shade(g, x, y, {}),
  turret: (g, x, y, w) => new Turret(g, x, y, {}),
  dragonewt: (g, x, y, w) => new Dragonewt(g, x, y, {}),
  leaper: (g, x, y, w) => new Leaper(g, x, y, {})
};
