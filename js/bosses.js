// World bosses: multi-phase cinematic fights. All original characters.
import { TILE, VIEW_W, VIEW_H } from './const.js';
import { clamp, rand, sign } from './util.js';
import { Enemy, ENEMY_FACTORY } from './enemies.js';
import { Projectile } from './entities.js';
import { buildSprite, getSprite, SPRITES, getTinted } from './sprites.js';
import { tileSolid } from './tiles.js';
import { sfx } from './sfx.js';
import { t } from './i18n.js';

// --- Boss art (registered into the shared sprite atlas) -----------------------
SPRITES.boss_ram = [
  '..kkk................kkk',
  '.kgggk..............kgggk',
  '.kgggkk............kkgggk',
  '..kggggkkkkkkkkkkkkggggk',
  '...kkbbbbbbbbbbbbbbbbkk.',
  '..kbbBbbbbbbbbbbbbBbbbk.',
  '.kbbbbbbkbbbbbbkbbbbbbbk',
  '.kbbbbbkkbbbbbbkkbbbbbbk',
  'kbbwbbbbbbbbbbbbbbbwbbbk',
  'kbbbbbbbrrbbbbrrbbbbbbbk',
  'kbbbbbbbbbbbbbbbbbbbbbk.',
  '.kbbbbbbbbbbbbbbbbbbbk..',
  '..kbbkkbbbkkkkbbbkkbbk..',
  '..kBBk.kBBk..kBBk.kBBk..',
  '..kBBk.kBBk..kBBk.kBBk..'
];
SPRITES.boss_root = [
  '......kkkkkkkkkk......',
  '....kkbbbbbbbbbbkk....',
  '...kbbBbbBbbBbbBbbk...',
  '..kbbbbbbbbbbbbbbbbk..',
  '.kbbkkkbbbbbbbbkkkbbk.',
  '.kbkwwkbbbbbbbkwwkbbk.',
  'kbbkwkkbbbbbbbkkwkbbbk',
  'kbbbkkbbbkkkkbbkkbbbbk',
  'kbbbbbbbkbbbbkbbbbbbbk',
  'kbbbbbbbkbbbbkbbbbbbbk',
  'kbbbbbbbbkkkkbbbbbbbbk',
  '.kbbEebbbbbbbbbbeEbbk.',
  '.kbeeebbbbbbbbbbeeebk.',
  '..kkeekkkkkkkkkkeekk..',
  '....kkk........kkk....'
];
SPRITES.boss_root_eye = [
  '......kkkkkkkkkk......',
  '....kkbbbbbbbbbbkk....',
  '...kbbBbbBbbBbbBbbk...',
  '..kbbbbbbbbbbbbbbbbk..',
  '.kbbkkkbbbbbbbbkkkbbk.',
  '.kbkwwkbkkkkbbkwwkbbk.',
  'kbbkwkkbkwwkbbkkwkbbbk',
  'kbbbkkbbkwkkbbbkkbbbbk',
  'kbbbbbbbkkkkbbbbbbbbbk',
  'kbbbbbbbbbbbbbbbbbbbbk',
  'kbbbbbbbbkkkkbbbbbbbbk',
  '.kbbEebbbbbbbbbbeEbbk.',
  '.kbeeebbbbbbbbbbeeebk.',
  '..kkeekkkkkkkkkkeekk..',
  '....kkk........kkk....'
];
SPRITES.boss_glimmer = [
  '.......kck.......',
  '......kcwck......',
  '.....kccccck.....',
  '....kmcccccmk....',
  '...kmmkccckmmk...',
  '...kmmmkckmmmk...',
  '..kmkmmmmmmmkmk..',
  '..kmmkwmmmwkmmk..',
  '..kmmmmmmmmmmmk..',
  '...kmmmkkkmmmk...',
  '..kcmmmmmmmmmck..',
  '.kccmmmmmmmmmcck.',
  'kcccmmmmmmmmmccck',
  'kccmmmmmmmmmmmcck',
  '.kkmmmmmmmmmmmkk.',
  '...kkkkkkkkkkk...'
];
SPRITES.boss_serpent = [
  '......kkkkkk......',
  '....kkttttttkk....',
  '...kttttttttttk...',
  '..kttkttttkttttk..',
  '..kttkttttkttttk..',
  '.kttttttttttttttk.',
  '.ktwtttwtttwtttwk.',
  'kttkttttkttttkttk.',
  'kttttttttttttttttk',
  'ktkwkwkwkwkwkwkttk',
  'kttttttttttttttttk',
  '.kttttttttttttttk.',
  '..kkttttttttttkk..',
  '....kkttttttkk....',
  '......kkkkkk......'
];
SPRITES.boss_yeti = [
  '.....kkkkkkkk.....',
  '...kkwwwwwwwwkk...',
  '..kwwwwwwwwwwwwk..',
  '..kwwkkwwwwkkwwk..',
  '.kwwwkkwwwwkkwwwk.',
  '.kwwwwwwkkwwwwwwk.',
  '.kwwwxxxxxxxxwwwk.',
  'kwwwwxkxxxxkxwwwwk',
  'kwwwwxxxxxxxxwwwwk',
  'kwkwwwxxkkxxwwwkwk',
  'kwkwwwwwwwwwwwwkwk',
  'kwwwwwwwwwwwwwwwwk',
  '.kwwwkwwwwwwkwwwk.',
  '..kwwkwwwwwwkwwk..',
  '..kkkwwkkkkwwkkk..',
  '....kkk....kkk....'
];
SPRITES.boss_harpy = [
  'kk..............kk',
  'kuuk...........kuu',
  'kuuuk..kkkk..kuuuk',
  '.kuuukkuuuukkuuuk.',
  '.kuuuuuwuuwuuuuuk.',
  '..kuuuukuukuuuuk..',
  '..kuuuuuuuuuuuuk..',
  '.kuukuuummuuukuuk.',
  'kuuk.kuummuuk.kuuk',
  'kuk..kuuuuuuk..kuk',
  'kk...kuuuuuuk...kk',
  '.....kukukuuk.....',
  '.....kuk..kuk.....',
  '....kuk....kuk....',
  '....kk......kk....'
];
SPRITES.boss_countess = [
  '......kkkkkk......',
  '....kkxxxxxxkk....',
  '...kxxxxxxxxxxk...',
  '..kxxpkxxxxkpxxk..',
  '..kxxxxxxxxxxxxk..',
  '..kxxAxxxxxxAxxk..',
  '.kxxxxxkkkkxxxxxk.',
  '.kxpxxxxxxxxxxpxk.',
  'kxxxpxxxxxxxxpxxxk',
  'kxxxxxxxxxxxxxxxxk',
  'kxxxxxpxxxxpxxxxxk',
  '.kxxxxxxxxxxxxxk..',
  '..kxx.xxxxxx.xxk..',
  '..kx...kxxk...xk..',
  '...k....kk.....k..'
];
SPRITES.boss_cogg = [
  '..k..kk..kk..k....',
  '.kAkkAAkkAAkkAk...',
  '.kAAAAAAAAAAAAk...',
  'kAAxxAAAAAAxxAAk..',
  'kAAxxAAAAAAxxAAk..',
  'kAAAAAkkkkAAAAAk..',
  'kAAAAkooookAAAAk..',
  'kAAAAkokkokAAAAk..',
  'kAAAAkooookAAAAk..',
  'kAAAAAkkkkAAAAAk..',
  '.kAAvvvvvvvvAAk...',
  '.kAvvkvvvvkvvAk...',
  'kAAvvvvvvvvvvAAk..',
  'kkAAkkkkkkkkAAkk..',
  '.kkk..kkkk...kkk..'
];
SPRITES.boss_ivan = [
  '.........kkkk...................',
  '.......kkrrrrkk.......kkkk......',
  '......krrRRrrrrk....kkrrrrkk....',
  '.....krrrrrrrrrrk..krrRRrrrrk...',
  '....krrgggrrrrrrkkkrrrrrrrrk....',
  '....krgkkgrrrrrrrrrrrrrrrrk.....',
  '...kkrgggrrrrrrrrrrrrrrrkk......',
  '..krrrrrrrrrrrrrrrrrrrrk........',
  '.krrwkrrrrrrrrrrrrrrrrrk........',
  'krrwkkrrrrrrrrrrrrrrrrrrk.......',
  'krrrkrrrrryyrrrrrrrrrrrrk.......',
  '.krrrrrryyyyyyrrrrrrrrrrrk......',
  '..kkkrryyggyyyyrrrrrrrrrrk......',
  '..kgkgryyyyyyyyrrrrrrrrrrk......',
  '.kggggyyyyggyyyyrrrrrrrrk.......',
  '.kgkgkyyyyyyyyyyrrrrrrrk........',
  'kgggggyyyyyyggyyrrrrrrrk........',
  'kgkgkgyyyyyyyyyykrrrrrk.........',
  'kkkkkkkyyyyyyyykkrrrrrk.........',
  '......kkkkkkkkk..krrrrk.........',
  '....kRRk....kRRk.krrrrk.........',
  '...kRRRk....kRRRkkrrrrk.........',
  '...kRRk......kRRk.krrk..........',
  '..kkkk......kkkk..kkk...........'
];

// --- Base boss -----------------------------------------------------------------
export class Boss extends Enemy {
  constructor(g, x, y, w, h, hp) {
    super(g, x, y, w, h);
    this.maxHp = hp;
    this.hp = hp;
    this.stompable = false;
    this.vulnerable = false;
    this.introT = 0;
    this.introDone = false;
    this.phase = 1;
    this.hitCd = 0;
    this.dying = 0;
    this.gravity = false;
    this.drawScale = 1.5;  // bosses loom larger than their (forgiving) hitbox
    sfx.bossRoar();
  }

  get phaseFrac() { return this.hp / this.maxHp; }

  bossHit(n = 1) {
    if (this.hitCd > 0 || this.dying) return false;
    this.hp -= this.g.cheats.onehit ? this.maxHp : n;
    this.hitCd = 0.9;
    this.flashT = 0.25;
    sfx.bossHit();
    this.g.camera.shake(3, 0.2);
    this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 12, { color: ['#fff6ec', '#ffd042'], maxSpeed: 110 });
    if (this.hp <= 0) this.startDeath();
    else if (this.phaseFrac <= 0.5 && this.phase === 1) {
      this.phase = 2;
      sfx.bossRoar();
      this.g.camera.shake(4, 0.4);
      if (this.g.level.world === 9) this.g.banner('boss9_mid', '#ff8830');
    }
    return true;
  }

  startDeath() {
    this.dying = 0.001;
    this.contactDamage = false;
    this.g.onBossDefeated();
  }

  // player interactions: stomp when vulnerable, projectiles ping otherwise
  bossInteract() {
    const p = this.g.player;
    if (p.dead || this.dying) return;
    if (!this.overlapsPlayer()) return;
    const stomping = p.vy > 40 && (p.y + p.h) < this.y + this.h * 0.5;
    const pounding = p.state === 'pound' && p.poundPhase === 1;
    if ((stomping || pounding) && this.vulnerable) {
      if (this.bossHit(pounding ? 2 : 1)) { p.bounce(-230); return; }
    }
    if ((p.state === 'dash' && p.boltDash) && this.vulnerable) {
      if (this.bossHit(1)) return;
    }
    if (stomping && !this.vulnerable) { p.bounce(-200); sfx.bump(); return; }
    if (this.contactDamage && this.hitCd <= 0.55) p.hurt(this.x + this.w / 2);
  }

  checkProjectiles() {
    if (this.dying) return;
    for (const e of this.g.entities) {
      if (e instanceof Projectile && e.fromPlayer && !e.dead) {
        if (e.x < this.x + this.w && e.x + e.w > this.x && e.y < this.y + this.h && e.y + e.h > this.y) {
          e.explode();
          if (this.vulnerable) this.bossHit(1);
        }
      }
    }
  }

  updateDeath(dt) {
    this.dying += dt;
    this.y += Math.sin(this.dying * 20) * 0.6;
    if (Math.random() < 0.3) {
      this.g.particles.burst(this.x + rand(0, this.w), this.y + rand(0, this.h), 4,
        { color: ['#ff8830', '#ffd042', '#fff6ec'], maxSpeed: 80 });
    }
    if (this.dying > 2.2) this.dead = true;
  }

  baseBossUpdate(dt) {
    this.t += dt;
    this.animT += dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.hitCd > 0) this.hitCd -= dt;
    if (!this.introDone) {
      this.introT += dt;
      if (this.introT > 1.6) this.introDone = true;
      return false;
    }
    if (this.dying) { this.updateDeath(dt); return false; }
    return true;
  }

  drawBoss(ctx, cx, cy, name, flip) {
    let img;
    const opts = { flip, palId: '' };
    if (this.flashT > 0) img = getTinted(name, opts, '#ffffff', 0.75);
    else if (this.vulnerable && Math.floor(this.t * 6) % 2) img = getTinted(name, opts, '#ffd042', 0.25);
    else img = getSprite(name, opts);
    if (!img) return;
    if (this.dying && Math.floor(this.dying * 10) % 2) ctx.globalAlpha = 0.5;
    const s = this.drawScale;
    const dw = Math.round(img.width * s), dh = Math.round(img.height * s);
    // anchored at hitbox bottom-center
    ctx.drawImage(img, Math.round(this.x + this.w / 2 - cx - dw / 2), Math.round(this.y + this.h - cy - dh), dw, dh);
    ctx.globalAlpha = 1;
  }

  groundY(px) {
    // find floor below a point
    let ty = Math.floor(this.y / TILE);
    const tx = Math.floor(px / TILE);
    while (ty < this.g.levelH && !tileSolid(this.g.tileAt(tx, ty))) ty++;
    return ty * TILE;
  }
}

// --- W1: Bramblehoof — charging ram ---------------------------------------------
class Bramblehoof extends Boss {
  constructor(g, x, y) {
    super(g, x - 6, y - 8, 24, 15, 5);
    this.mode = 'pace';
    this.dir = -1;
    this.gravity = true;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    this.applyGravity(dt);
    const p = this.g.player;
    const spd = this.phase === 2 ? 1.35 : 1;
    if (this.mode === 'pace') {
      this.vulnerable = false;
      this.x += this.dir * 26 * spd * dt;
      if (this.t > 1.4) { this.mode = 'windup'; this.t = 0; this.dir = sign(p.x - this.x) || 1; }
    } else if (this.mode === 'windup') {
      this.aiNote = 'windup';
      if (this.t > 0.5) { this.mode = 'charge'; this.t = 0; sfx.dash(); }
    } else if (this.mode === 'charge') {
      this.x += this.dir * 170 * spd * this.g.enemySpeedScale * dt;
      const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      if (tileSolid(this.g.tileAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h / 2) / TILE)))) {
        this.mode = 'stun'; this.t = 0;
        this.g.camera.shake(5, 0.3);
        sfx.pound();
        this.g.particles.burst(aheadX, this.y + this.h / 2, 14, { color: ['#b8901c', '#8ade6a'], maxSpeed: 100 });
        // phase 2: dislodge thorn seeds from ceiling
        if (this.phase === 2) {
          for (let i = 0; i < 3; i++) {
            this.g.entities.push(new Projectile(this.g, 'seed', this.x + rand(-60, 60), this.y - 70, rand(-20, 20), 30, false));
          }
        }
      }
    } else if (this.mode === 'stun') {
      this.vulnerable = true;
      if (this.t > 2.2) { this.mode = 'pace'; this.t = 0; this.dir *= -1; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    const shake = this.mode === 'windup' ? Math.sin(this.t * 40) : 0;
    this.drawBoss(ctx, cx + shake, cy, 'boss_ram', this.dir > 0);
  }
}

// --- W2: Old Rootjaw — ancient stump ---------------------------------------------
class Rootjaw extends Boss {
  constructor(g, x, y) {
    super(g, x - 3, y - 6, 22, 15, 5);
    this.mode = 'closed';
    this.gravity = true;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    this.applyGravity(dt);
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.65 : 1;
    if (this.mode === 'closed') {
      this.vulnerable = false;
      if (this.t > 2.2 * speedup) {
        this.mode = 'spit'; this.t = 0;
      }
    } else if (this.mode === 'spit') {
      if (!this.spat) {
        this.spat = true;
        const n = this.phase === 2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const dx = (p.x - this.x) + rand(-30, 30);
          this.g.entities.push(new Projectile(this.g, 'seed', this.x + this.w / 2, this.y + 2, clamp(dx, -120, 120), -190, false));
        }
        sfx.shoot();
      }
      if (this.t > 1.0) { this.mode = 'eye'; this.t = 0; this.spat = false; }
    } else if (this.mode === 'eye') {
      this.vulnerable = true;
      this.aiNote = 'eye open!';
      if (this.t > 2.0) { this.mode = 'closed'; this.t = 0; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    this.drawBoss(ctx, cx, cy, this.mode === 'eye' ? 'boss_root_eye' : 'boss_root', false);
  }
}

// --- W3: Queen Glimmer — teleporting crystal queen ----------------------------------
class Glimmer extends Boss {
  constructor(g, x, y) {
    super(g, x, y - 10, 17, 16, 5);
    this.mode = 'float';
    this.homeY = this.y;
    this.mirage = null; // {x, y}
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.7 : 1;
    if (this.mode === 'float') {
      this.vulnerable = true;
      this.y = this.homeY + Math.sin(this.t * 2) * 10;
      this.x += clamp(p.x - this.x, -1, 1) * 16 * dt;
      if (this.t > 2.4 * speedup) { this.mode = 'shatter'; this.t = 0; }
    } else if (this.mode === 'shatter') {
      // vanish + reappear with a mirage
      this.vulnerable = false;
      if (!this.tele) {
        this.tele = true;
        this.g.particles.burst(this.x + 8, this.y + 8, 14, { color: ['#7ae0f0', '#ff7ab0'], maxSpeed: 100 });
        const ax = clamp(p.x + rand(-90, 90), 24, this.g.levelW * TILE - 40);
        const bx = clamp(p.x + rand(-90, 90), 24, this.g.levelW * TILE - 40);
        this.x = ax;
        this.mirage = { x: bx, y: this.homeY };
        this.y = this.homeY - 20;
      }
      if (this.t > 0.9) { this.mode = 'volley'; this.t = 0; this.tele = false; }
    } else if (this.mode === 'volley') {
      this.y = this.homeY + Math.sin(this.t * 2) * 8;
      if (this.mirage) this.mirage.y = this.homeY + Math.sin(this.t * 2 + 1.5) * 8;
      if (!this.shot && this.t > 0.4) {
        this.shot = true;
        const n = this.phase === 2 ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const a = Math.PI * (0.25 + 0.5 * i / (n - 1));
          this.g.entities.push(new Projectile(this.g, 'ice', this.x + 8, this.y + 10, Math.cos(a) * 90, Math.sin(a) * 90, false));
        }
        sfx.iceShot();
      }
      if (this.t > 1.6) { this.mode = 'float'; this.t = 0; this.shot = false; this.mirage = null; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    if (this.mirage) {
      ctx.globalAlpha = 0.6;
      const img = getSprite('boss_glimmer', {});
      ctx.drawImage(img, Math.round(this.mirage.x - cx), Math.round(this.mirage.y - cy - (img.height - this.h)));
      ctx.globalAlpha = 1;
    }
    this.drawBoss(ctx, cx, cy, 'boss_glimmer', false);
  }
}

// --- W4: Sultan Scorch — sand serpent ------------------------------------------------
class Scorch extends Boss {
  constructor(g, x, y) {
    super(g, x, y, 18, 15, 6);
    this.mode = 'under';
    this.floorY = y + 16;
    this.contactDamage = true;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.7 : 1;
    if (this.mode === 'under') {
      this.vulnerable = false;
      this.contactDamage = false;
      this.y = this.floorY + 20;
      if (this.t > 1.3 * speedup) {
        this.mode = 'rise'; this.t = 0;
        this.x = clamp(p.x + rand(-40, 40), 24, this.g.levelW * TILE - 44);
        this.riseY = this.groundY(this.x + this.w / 2);
        this.g.particles.burst(this.x + this.w / 2, this.riseY, 10, { color: ['#d8b078', '#a07840'], maxSpeed: 70 });
      }
    } else if (this.mode === 'rise') {
      this.contactDamage = true;
      this.y = Math.max(this.riseY - 42, this.y - 120 * dt);
      if (this.y <= this.riseY - 42) { this.mode = 'up'; this.t = 0; }
    } else if (this.mode === 'up') {
      this.vulnerable = true;
      if (!this.shot && this.t > 0.5) {
        this.shot = true;
        const n = this.phase === 2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          this.g.entities.push(new Projectile(this.g, 'ember', this.x + this.w / 2, this.y + 4, rand(-80, 80), -160, false));
        }
        sfx.fireball();
      }
      if (this.t > 1.8) { this.mode = 'sink'; this.t = 0; this.shot = false; }
    } else if (this.mode === 'sink') {
      this.vulnerable = false;
      this.y += 90 * dt;
      if (this.y > this.floorY + 18) { this.mode = 'under'; this.t = 0; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    if (this.mode === 'under') return;
    this.drawBoss(ctx, cx, cy, 'boss_serpent', false);
  }
}

// --- W5: General Frostbeard — yeti commander -------------------------------------------
class Frostbeard extends Boss {
  constructor(g, x, y) {
    super(g, x - 3, y - 8, 20, 16, 6);
    this.mode = 'walk';
    this.dir = -1;
    this.gravity = true;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    this.applyGravity(dt);
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.7 : 1;
    if (this.mode === 'walk') {
      this.vulnerable = false;
      this.dir = sign(p.x - this.x) || 1;
      this.x += this.dir * 22 * dt;
      if (this.t > 1.6 * speedup) {
        this.mode = Math.random() < 0.55 ? 'throw' : 'slam';
        this.t = 0;
      }
    } else if (this.mode === 'throw') {
      if (!this.shot && this.t > 0.4) {
        this.shot = true;
        const n = this.phase === 2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const dx = p.x - this.x;
          this.g.entities.push(new Projectile(this.g, 'snow', this.x + this.w / 2, this.y + 2, clamp(dx * 1.2, -140, 140) + i * 24 - 12, -180, false));
        }
        sfx.shoot();
      }
      if (this.t > 1.1) { this.mode = 'walk'; this.t = 0; this.shot = false; }
    } else if (this.mode === 'slam') {
      if (!this.slammed && this.t > 0.5) {
        this.slammed = true;
        this.g.camera.shake(5, 0.35);
        sfx.pound();
        // icicles fall from above
        const n = this.phase === 2 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          this.g.entities.push(new Projectile(this.g, 'ice', p.x + rand(-50, 50), this.g.camera.y - 6, 0, 120, false));
        }
        if (p.grounded && !p.dead) p.hurt(this.x + this.w / 2);
      }
      if (this.t > 1.4) { this.mode = 'tired'; this.t = 0; this.slammed = false; }
    } else if (this.mode === 'tired') {
      this.vulnerable = true;
      this.aiNote = 'tired!';
      if (this.t > 2.2) { this.mode = 'walk'; this.t = 0; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    const bob = this.mode === 'walk' ? Math.sin(this.animT * 8) : 0;
    this.drawBoss(ctx, cx, cy + bob, 'boss_yeti', this.dir > 0);
  }
}

// --- W6: Zephyra — storm harpy ---------------------------------------------------------
class Zephyra extends Boss {
  constructor(g, x, y) {
    super(g, x, y - 20, 18, 15, 6);
    this.cx = x; this.cy = y - 30;
    this.mode = 'circle';
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const speedup = this.phase === 2 ? 1.3 : 1;
    if (this.mode === 'circle') {
      this.vulnerable = false;
      this.x = this.cx + Math.sin(this.t * 1.6 * speedup) * 70;
      this.y = this.cy + Math.sin(this.t * 3.2 * speedup) * 18;
      // gust push
      if (!p.dead && !p.grounded) p.vx += sign(Math.sin(this.t * 0.8)) * 24 * dt;
      if (this.t > 3.0) { this.mode = 'dive'; this.t = 0; this.diveX = p.x; this.diveY = p.y; sfx.dash(); }
    } else if (this.mode === 'dive') {
      const dx = this.diveX - this.x, dy = (this.diveY - 2) - this.y;
      const d = Math.max(8, Math.hypot(dx, dy));
      this.x += dx / d * 190 * speedup * dt;
      this.y += dy / d * 190 * speedup * dt;
      if (d < 12 || this.t > 1.2) { this.mode = 'recover'; this.t = 0; }
    } else if (this.mode === 'recover') {
      this.vulnerable = true;
      this.aiNote = 'grounded!';
      if (this.phase === 2 && !this.spawned && this.t > 0.3) {
        this.spawned = true;
        this.g.entities.push(new Projectile(this.g, 'bolt', this.x + 8, this.y - 4, rand(-60, 60), -120, false));
      }
      if (this.t > 1.8) {
        this.mode = 'circle'; this.t = 0; this.spawned = false;
        this.cx = clamp(p.x, 90, this.g.levelW * TILE - 90);
      }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    this.drawBoss(ctx, cx, cy, 'boss_harpy', this.g.player.x > this.x);
  }
}

// --- W7: The Pale Countess — phasing ghost ----------------------------------------------
class Countess extends Boss {
  constructor(g, x, y) {
    super(g, x, y - 14, 18, 15, 6);
    this.mode = 'gone';
    this.alpha = 0;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.7 : 1;
    if (this.mode === 'gone') {
      this.vulnerable = false;
      this.contactDamage = false;
      this.alpha = Math.max(0, this.alpha - dt * 2);
      if (this.t > 1.4 * speedup) {
        this.mode = 'appear'; this.t = 0;
        this.x = clamp(p.x + (Math.random() < 0.5 ? -60 : 60), 24, this.g.levelW * TILE - 44);
        this.y = clamp(p.y - 30, 40, this.g.levelH * TILE - 80);
      }
    } else if (this.mode === 'appear') {
      this.alpha = Math.min(1, this.alpha + dt * 2);
      if (this.t > 0.7) { this.mode = 'ring'; this.t = 0; }
    } else if (this.mode === 'ring') {
      this.contactDamage = true;
      this.vulnerable = true;
      if (!this.shot && this.t > 0.35) {
        this.shot = true;
        const n = this.phase === 2 ? 8 : 5;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n + this.t;
          this.g.entities.push(new Projectile(this.g, 'bolt', this.x + 9, this.y + 8, Math.cos(a) * 70, Math.sin(a) * 70, false));
        }
        sfx.shoot();
      }
      // slow chase
      this.x += clamp(p.x - this.x, -1, 1) * 22 * dt;
      this.y += clamp(p.y - 20 - this.y, -1, 1) * 16 * dt;
      if (this.t > 2.4) { this.mode = 'gone'; this.t = 0; this.shot = false; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    ctx.globalAlpha = this.alpha * (this.dying ? 0.7 : 1);
    this.drawBoss(ctx, cx, cy, 'boss_countess', this.g.player.x > this.x);
    ctx.globalAlpha = 1;
  }
}

// --- W8: Foreman Cogg — machine master ---------------------------------------------------
class Cogg extends Boss {
  constructor(g, x, y) {
    super(g, x - 1, y - 8, 18, 15, 7);
    this.mode = 'hover';
    this.homeY = this.y - 30;
    this.y = this.homeY;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const speedup = this.phase === 2 ? 0.7 : 1;
    if (this.mode === 'hover') {
      this.vulnerable = false;
      this.x += clamp(p.x - this.x, -1, 1) * 34 * dt;
      this.y = this.homeY + Math.sin(this.t * 2) * 8;
      if (this.t > 1.8 * speedup) {
        this.mode = Math.random() < 0.5 ? 'gears' : 'slam';
        this.t = 0;
      }
    } else if (this.mode === 'gears') {
      if (!this.shot && this.t > 0.3) {
        this.shot = true;
        const n = this.phase === 2 ? 4 : 2;
        for (let i = 0; i < n; i++) {
          const dir = i % 2 ? 1 : -1;
          this.g.entities.push(new Projectile(this.g, 'gear', this.x + 9, this.y + 10, dir * (70 + i * 20), -40, false));
        }
        sfx.shoot();
      }
      if (this.t > 1.2) { this.mode = 'vent'; this.t = 0; this.shot = false; }
    } else if (this.mode === 'slam') {
      // drops to the ground with a crash
      const gy = this.groundY(this.x + this.w / 2);
      this.y = Math.min(gy - this.h, this.y + 260 * dt);
      if (this.y >= gy - this.h) {
        if (!this.crashed) {
          this.crashed = true;
          this.g.camera.shake(5, 0.3);
          sfx.pound();
          if (p.grounded && !p.dead && Math.abs(p.x - this.x) < 90) p.hurt(this.x + this.w / 2);
        }
        if (this.t > 1.2) { this.mode = 'vent'; this.t = 0; this.crashed = false; }
      }
    } else if (this.mode === 'vent') {
      // overheated: hatch open, vulnerable
      this.vulnerable = true;
      this.aiNote = 'venting!';
      if (Math.random() < 0.2) this.g.particles.spawn(this.x + rand(0, 18), this.y - 2, { color: '#c8ceda', vy: -40, g: 0, life: 0.5 });
      if (this.t > 2.0) { this.mode = 'rise'; this.t = 0; }
    } else if (this.mode === 'rise') {
      this.vulnerable = false;
      this.y = Math.max(this.homeY, this.y - 120 * dt);
      if (this.y <= this.homeY + 1) { this.mode = 'hover'; this.t = 0; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    this.drawBoss(ctx, cx, cy, 'boss_cogg', false);
    // thruster flames when hovering
    if (this.mode === 'hover' || this.mode === 'rise') {
      ctx.fillStyle = Math.floor(this.t * 12) % 2 ? '#ff8830' : '#ffd042';
      ctx.fillRect(Math.round(this.x + 3 - cx), Math.round(this.y + this.h - cy), 3, 4);
      ctx.fillRect(Math.round(this.x + 12 - cx), Math.round(this.y + this.h - cy), 3, 4);
    }
  }
}

// --- W9: IVAN THE ETERNAL — final boss, 3 phases ------------------------------------------
class Ivan extends Boss {
  constructor(g, x, y) {
    super(g, x - 14, y - 20, 38, 27, 10);
    this.mode = 'stalk';
    this.dir = -1;
    this.gravity = true;
    this.fireT = 0;
    this.drawScale = 2.2; // an enormous ancient dragon
  }
  bossHit(n) {
    const r = super.bossHit(n);
    if (r && this.phaseFrac <= 0.25 && this.phase === 2) {
      this.phase = 3;
      sfx.bossRoar();
      this.g.camera.shake(6, 0.6);
    }
    return r;
  }
  update(dt) {
    if (!this.baseBossUpdate(dt)) return;
    const p = this.g.player;
    const spd = this.phase === 3 ? 1.5 : this.phase === 2 ? 1.2 : 1;
    if (this.mode === 'stalk') {
      this.applyGravity(dt);
      this.vulnerable = false;
      this.dir = sign(p.x - this.x) || 1;
      this.x += this.dir * 24 * spd * dt;
      if (this.t > 1.8 / spd) {
        const roll = Math.random();
        this.mode = roll < 0.45 ? 'breath' : roll < 0.75 ? 'leap' : 'summon';
        if (this.phase === 1 && this.mode === 'summon') this.mode = 'breath';
        this.t = 0;
      }
    } else if (this.mode === 'breath') {
      this.applyGravity(dt);
      this.aiNote = 'fire breath';
      this.fireT -= dt;
      if (this.t > 0.5 && this.t < 1.9 && this.fireT <= 0) {
        this.fireT = 0.22 / spd;
        const fx = this.x + (this.dir > 0 ? this.w + 2 : -2);
        this.g.entities.push(new Projectile(this.g, 'ember', fx, this.y + 6, this.dir * (120 + rand(0, 60)), rand(-40, 10), false));
        sfx.fireball();
      }
      if (this.t > 2.3) { this.mode = 'winded'; this.t = 0; }
    } else if (this.mode === 'leap') {
      if (!this.leapt) {
        this.leapt = true;
        this.vy = -280;
        this.leapVx = sign(p.x - this.x) * 110 * spd;
      }
      this.vy += 620 * dt;
      this.x += this.leapVx * dt;
      this.y += this.vy * dt;
      const gy = this.groundY(this.x + this.w / 2);
      if (this.vy > 0 && this.y + this.h >= gy) {
        this.y = gy - this.h;
        this.mode = 'landed'; this.t = 0; this.leapt = false;
        this.g.camera.shake(6, 0.4);
        sfx.pound();
        if (p.grounded && !p.dead) p.hurt(this.x + this.w / 2);
        // shockwave embers
        for (const dir of [-1, 1]) {
          this.g.entities.push(new Projectile(this.g, 'ember', this.x + this.w / 2 + dir * 18, gy - 6, dir * 90, -60, false));
        }
      }
    } else if (this.mode === 'landed') {
      this.vulnerable = true;
      this.aiNote = 'head low!';
      if (this.t > 1.7) { this.mode = 'stalk'; this.t = 0; }
    } else if (this.mode === 'summon') {
      this.applyGravity(dt);
      if (!this.summoned && this.t > 0.6) {
        this.summoned = true;
        sfx.bossRoar();
        const f = ENEMY_FACTORY[this.phase === 3 ? 'leaper' : 'walker'];
        this.g.entities.push(f(this.g, clamp(p.x + 60, 32, this.g.levelW * TILE - 48), this.y - 20, 9));
      }
      if (this.t > 1.4) { this.mode = 'winded'; this.t = 0; this.summoned = false; }
    } else if (this.mode === 'winded') {
      this.applyGravity(dt);
      this.vulnerable = true;
      this.aiNote = 'catching breath';
      if (this.t > (this.phase === 3 ? 1.1 : 1.6)) { this.mode = 'stalk'; this.t = 0; }
    }
    this.bossInteract();
    this.checkProjectiles();
  }
  draw(ctx, cx, cy) {
    // phase-3 rage aura
    if (this.phase === 3 && !this.dying) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.t * 10);
      ctx.fillStyle = '#ff5020';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2 - cx, this.y + this.h / 2 - cy, 26, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const bob = this.mode === 'stalk' ? Math.sin(this.animT * 6) : 0;
    this.drawBoss(ctx, cx, cy + bob, 'boss_ivan', this.dir > 0);
    // breath glow
    if (this.mode === 'breath' && this.t > 0.2 && this.t < 2.0) {
      ctx.fillStyle = Math.floor(this.t * 14) % 2 ? '#ffd042' : '#ff8830';
      const fx = this.dir > 0 ? this.x + this.w - 2 : this.x - 4;
      ctx.fillRect(Math.round(fx - cx), Math.round(this.y + 4 - cy), 6, 4);
    }
  }
}

const BOSSES = { 1: Bramblehoof, 2: Rootjaw, 3: Glimmer, 4: Scorch, 5: Frostbeard, 6: Zephyra, 7: Countess, 8: Cogg, 9: Ivan };

export function makeBoss(game, world, x, y) {
  const C = BOSSES[world];
  return C ? new C(game, x, y) : null;
}
