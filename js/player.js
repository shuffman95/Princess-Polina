// Princess Polina — movement, abilities, power-ups, tile collision.
import { TILE, PHYS, POWER } from './const.js';
import { clamp, sign } from './util.js';
import { T, tileSolid, tileSemisolid, tileDeadly, tileClimbable, tileLiquid, BREAKABLE } from './tiles.js';
import { getSprite, getTinted } from './sprites.js';
import { sfx } from './sfx.js';

const POWER_PAL = {
  [POWER.FIRE]: { r: '#ff6a30', R: '#c03c10', g: '#ffd042' },
  [POWER.ICE]: { r: '#7ad0f0', R: '#3a90c0', g: '#ffffff' },
  [POWER.WIND]: { r: '#b8e0c8', R: '#6aa886', g: '#ffffff' },
  [POWER.BEAR]: { r: '#8a5c30', R: '#5c3a1a', g: '#d8b078' },
  [POWER.BOLT]: { r: '#ffe98a', R: '#c8a020', g: '#ffffff' },
  [POWER.CRYSTAL]: { r: '#c8ecf8', R: '#7ab8d8', g: '#ffffff' },
  [POWER.SHADOW]: { r: '#5c2a80', R: '#38184e', g: '#9a4ad0' },
  [POWER.PHOENIX]: { r: '#ff8830', R: '#c05510', g: '#ffe98a' }
};

export class Player {
  constructor(game) {
    this.g = game;
    this.w = 10; this.h = 14;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.grounded = false;
    this.coyote = 0; this.jumpBuf = 0;
    this.jumping = false;
    this.jumpsUsed = 0;
    this.wallDir = 0;          // -1 wall on left, 1 wall on right (sliding)
    this.state = 'normal';     // normal | roll | dash | pound | climb
    this.stateT = 0;
    this.poundPhase = 0;
    this.anim = 'idle'; this.animT = 0;
    this.power = POWER.NONE;
    this.shieldHits = 0;       // crystal armor
    this.hearts = 3; this.maxHearts = 3;
    this.invulnT = 0;
    this.phaseT = 0;           // shadow cape phase
    this.phaseCd = 0;
    this.attackCd = 0;
    this.inWater = false;
    this.onIce = false;
    this.conveyor = 0;
    this.dead = false;
    this.deathT = 0;
    this.runHeld = false;
    this.stompChain = 0;
    this.trail = [];
    this.springT = 0;
  }

  spawnAt(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.dead = false; this.state = 'normal';
    this.invulnT = 1.2;
    this.jumpsUsed = 0;
    this.anim = 'idle';
  }

  setDifficultyHearts(diff) {
    this.maxHearts = diff === 'relaxed' ? 5 : diff === 'fierce' ? 2 : 3;
    this.hearts = this.maxHearts;
  }

  has(ability) { return this.g.hasAbility(ability); }

  get hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  // --- Tile helpers --------------------------------------------------------
  tileAt(px, py) { return this.g.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)); }

  collideRect(nx, ny, w, h, dir) {
    // Returns first blocking tile coordinate or null. dir: 'x' | 'y+' | 'y-'
    const x0 = Math.floor(nx / TILE), x1 = Math.floor((nx + w - 0.01) / TILE);
    const y0 = Math.floor(ny / TILE), y1 = Math.floor((ny + h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.g.tileAt(tx, ty);
        if (tileSolid(t)) return { tx, ty, t };
        if (dir === 'y+' && tileSemisolid(t)) {
          const top = ty * TILE;
          if (this.y + this.h <= top + 4 && this.vy >= 0) return { tx, ty, t };
        }
      }
    }
    return null;
  }

  // --- Damage --------------------------------------------------------------
  hurt(fromX = null) {
    if (this.dead || this.invulnT > 0 || this.phaseT > 0) return false;
    if (this.g.cheats.god || this.g.cheats.infhp) { this.invulnT = 0.4; return false; }
    if (this.shieldHits > 0) {
      this.shieldHits--;
      sfx.powerdown();
      this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 10, { color: ['#c8ecf8', '#7ab8d8'] });
      if (this.shieldHits === 0 && this.power === POWER.CRYSTAL) this.power = POWER.NONE;
      this.invulnT = 1.4;
      return true;
    }
    this.hearts--;
    this.g.camera.shake(3, 0.2);
    if (this.hearts <= 0) { this.die(); return true; }
    sfx.hurt();
    this.invulnT = 1.6;
    // knockback
    const dir = fromX === null ? -this.facing : (this.x + this.w / 2 < fromX ? -1 : 1);
    this.vx = dir * 90;
    this.vy = -120;
    this.state = 'normal';
    return true;
  }

  heal(n = 1) { this.hearts = clamp(this.hearts + n, 0, this.maxHearts); }

  die(silent = false) {
    if (this.dead) return;
    if (this.g.cheats.god) return;
    if (this.power === POWER.PHOENIX) {
      // Phoenix feather: blaze back to life
      this.power = POWER.NONE;
      this.hearts = this.maxHearts;
      this.invulnT = 2.5;
      this.vy = -220;
      sfx.powerup();
      this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 26, { color: ['#ff8830', '#ffd042', '#ff5020'], maxSpeed: 150 });
      this.g.onPhoenixRevive();
      return;
    }
    this.dead = true;
    this.deathT = 0;
    this.vy = -230;
    this.vx = 0;
    if (!silent) sfx.die();
    this.g.onPlayerDeath();
  }

  applyPower(id) {
    if (id === this.power) { this.g.addCoins(5); return; }
    this.power = id;
    if (id === POWER.CRYSTAL) this.shieldHits = 2;
    sfx.powerup();
    this.g.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 16, { color: ['#ffd042', '#fff6ec'], maxSpeed: 120 });
  }

  bounce(v = -180) {
    this.vy = v;
    this.jumping = true;
    this.jumpsUsed = Math.min(this.jumpsUsed, this.has('doublejump') ? 1 : 0);
  }

  // --- Attacks -------------------------------------------------------------
  tryAttack() {
    if (this.attackCd > 0) return;
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2 - 1;
    if (this.power === POWER.FIRE) {
      if (this.g.countProjectiles('fire') >= 2 && !this.g.cheats.infpower) return;
      this.g.spawnProjectile('fire', cx + this.facing * 6, cy, this.facing * 190, -60);
      sfx.fireball();
      this.attackCd = 0.28;
    } else if (this.power === POWER.ICE) {
      if (this.g.countProjectiles('ice') >= 2 && !this.g.cheats.infpower) return;
      this.g.spawnProjectile('ice', cx + this.facing * 6, cy, this.facing * 210, -20);
      sfx.iceShot();
      this.attackCd = 0.32;
    } else if (this.power === POWER.BOLT) {
      // lightning burst: brief lethal aura dash
      this.state = 'dash'; this.stateT = PHYS.dashTime * 1.2;
      this.vx = this.facing * PHYS.dashSpeed * 1.15;
      this.vy = 0;
      this.boltDash = true;
      sfx.dash();
      this.attackCd = 0.55;
      this.g.particles.burst(cx, cy, 8, { color: ['#ffe98a', '#fff6ec'] });
    }
  }

  tryRollDash(inp) {
    if (this.state === 'roll' || this.state === 'dash') return;
    if (this.power === POWER.SHADOW && !this.grounded && this.phaseCd <= 0 && !this.has('dash')) {
      this.phaseT = 0.5; this.phaseCd = 1.6;
      sfx.dash();
      return;
    }
    if (this.grounded && this.has('roll')) {
      this.state = 'roll'; this.stateT = PHYS.rollTime;
      this.vx = this.facing * PHYS.rollSpeed;
      sfx.roll();
      this.g.particles.burst(this.x + this.w / 2, this.y + this.h, 4, { color: '#c8ceda', maxSpeed: 40 });
    } else if (!this.grounded && this.has('dash') && !this.dashUsed) {
      this.state = 'dash'; this.stateT = PHYS.dashTime;
      const dir = inp.left ? -1 : inp.right ? 1 : this.facing;
      this.facing = dir;
      this.vx = dir * PHYS.dashSpeed * (this.power === POWER.BOLT ? 1.25 : 1);
      this.vy = 0;
      this.dashUsed = true;
      this.boltDash = this.power === POWER.BOLT;
      sfx.dash();
      if (this.power === POWER.SHADOW) { this.phaseT = 0.35; }
    }
  }

  // --- Update --------------------------------------------------------------
  update(dt) {
    const g = this.g;
    if (this.dead) {
      this.deathT += dt;
      this.vy += PHYS.fallGravity * dt;
      this.y += this.vy * dt;
      return;
    }

    const inp = {
      left: g.input.down('left'), right: g.input.down('right'),
      up: g.input.down('up'), down: g.input.down('down'),
      jump: g.input.down('jump'), jumpP: g.input.pressed('jump'),
      attack: g.input.down('attack'), attackP: g.input.pressed('attack'),
      rollP: g.input.pressed('roll')
    };

    // timers
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.phaseT > 0) this.phaseT -= dt;
    if (this.phaseCd > 0) this.phaseCd -= dt;
    if (this.springT > 0) this.springT -= dt;
    this.coyote -= dt; this.jumpBuf -= dt;
    if (inp.jumpP) this.jumpBuf = PHYS.jumpBuffer;

    // environment probes
    const cx = this.x + this.w / 2;
    const midT = this.tileAt(cx, this.y + this.h * 0.5);
    const feetT = this.tileAt(cx, this.y + this.h - 1);
    const wasInWater = this.inWater;
    this.inWater = tileLiquid(midT) || tileLiquid(feetT);
    if (this.inWater && !wasInWater && this.vy > 60) {
      sfx.splash();
      g.particles.burst(cx, this.y + this.h, 8, { color: ['#8ab8ff', '#cfe8ff'], vy: -60, maxSpeed: 60 });
    }
    const climbHere = tileClimbable(midT) || tileClimbable(this.tileAt(cx, this.y + 2));

    // cheat: fly mode
    if (g.cheats.fly) {
      const spd = 160;
      this.vx = (inp.right - inp.left) * spd;
      this.vy = (inp.down - inp.up) * spd;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.x = clamp(this.x, 0, g.levelW * TILE - this.w);
      this.y = clamp(this.y, -40, g.levelH * TILE);
      if (inp.left) this.facing = -1; if (inp.right) this.facing = 1;
      this.anim = 'glide'; this.animT += dt;
      return;
    }

    const gravScale = g.cheats.moon ? 0.4 : 1;
    const runHeld = inp.attack && this.has('run');
    this.runHeld = runHeld;

    // --- state machine -----------------------------------------------------
    if (this.state === 'climb') {
      if (!climbHere || this.jumpBuf > 0) {
        this.state = 'normal';
        if (this.jumpBuf > 0) { this.jumpBuf = 0; this.vy = PHYS.jumpVel * 0.85; this.jumping = true; sfx.jump(); g.stats.jumps++; }
      } else {
        this.vx = (inp.right - inp.left) * PHYS.climbSpeed * 0.7;
        this.vy = (inp.down - inp.up) * PHYS.climbSpeed;
        this.moveAndCollide(dt);
        this.anim = (Math.abs(this.vx) + Math.abs(this.vy) > 4) ? 'climb' : 'climbIdle';
        this.animT += dt;
        return;
      }
    }

    if (this.state === 'roll') {
      this.stateT -= dt;
      this.vx = this.facing * PHYS.rollSpeed;
      if (!this.grounded) this.vy += PHYS.gravity * gravScale * dt;
      if (this.stateT <= 0 && this.canStand()) this.state = 'normal';
      else if (this.stateT <= -0.6) this.forceUnstuck();
    } else if (this.state === 'dash') {
      this.stateT -= dt;
      this.vy = 0;
      if (this.power === POWER.BOLT && this.boltDash) {
        if (Math.random() < 0.5) g.particles.spawn(cx, this.y + this.h / 2, { color: '#ffe98a', g: 0, life: 0.2 });
      }
      if (this.stateT <= 0) { this.state = 'normal'; this.vx = this.facing * PHYS.runSpeed * 0.7; this.boltDash = false; }
    } else if (this.state === 'pound') {
      if (this.poundPhase === 0) {
        this.stateT -= dt;
        this.vx = 0; this.vy = -30;
        if (this.stateT <= 0) { this.poundPhase = 1; this.vy = PHYS.poundSpeed; }
      } else {
        this.vy = PHYS.poundSpeed;
      }
    } else {
      // --- normal movement ---------------------------------------------
      const maxSpd = this.inWater ? PHYS.swimMax
        : (runHeld ? PHYS.runSpeed * (this.power === POWER.BOLT ? 1.18 : 1) : PHYS.walkSpeed);
      const wish = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (wish !== 0) this.facing = wish;

      let accel = this.grounded ? (runHeld ? PHYS.runAccel : PHYS.accel) : PHYS.airAccel;
      let decel = this.grounded ? PHYS.decel : PHYS.airDecel;
      if (this.onIce && this.grounded) { accel *= 0.35; decel *= 0.12; }
      if (this.inWater) { accel = PHYS.swimAccel; decel = PHYS.swimAccel * 0.5; }

      if (wish !== 0) {
        // skid when reversing at speed
        if (this.grounded && sign(this.vx) === -wish && Math.abs(this.vx) > 60) {
          this.vx += wish * PHYS.skidDecel * dt * (this.onIce ? 0.25 : 1);
          this.anim = 'skid';
          if (Math.random() < 0.3) g.particles.spawn(cx, this.y + this.h, { color: '#c8ceda', vx: -wish * 30, vy: -20, life: 0.25 });
        } else {
          this.vx += wish * accel * dt;
        }
        this.vx = clamp(this.vx, -maxSpd, maxSpd);
      } else {
        const d = decel * dt;
        if (Math.abs(this.vx) <= d) this.vx = 0;
        else this.vx -= sign(this.vx) * d;
      }
      this.vx += this.conveyor * 30 * dt;

      // gravity
      if (this.inWater) {
        this.vy += PHYS.swimGravity * gravScale * dt;
        this.vy = Math.min(this.vy, PHYS.swimMax);
        if (inp.jumpP || (this.jumpBuf > 0 && this.has('swim'))) {
          this.jumpBuf = 0;
          this.vy = PHYS.swimJump * (this.has('swim') ? 1.25 : 1);
          sfx.swim();
          this.anim = 'swimStroke'; this.animT = 0;
        }
      } else {
        const rising = this.vy < 0;
        let grav = rising && this.jumping && inp.jump ? PHYS.gravity : PHYS.fallGravity;
        grav *= gravScale;
        if (this.power === POWER.WIND && this.vy > 0 && inp.jump) grav *= 0.4;
        this.vy += grav * dt;

        // glide
        const gliding = this.vy > 0 && inp.jump && (this.has('glide') || this.power === POWER.WIND) && !this.jumping;
        if (gliding) this.vy = Math.min(this.vy, this.power === POWER.WIND ? PHYS.glideFall * 0.8 : PHYS.glideFall);

        // wall slide
        this.wallDir = 0;
        if (this.has('walljump') && !this.grounded && this.vy > 0) {
          const pushL = inp.left && this.touchingWall(-1);
          const pushR = inp.right && this.touchingWall(1);
          if (pushL || pushR) {
            this.wallDir = pushL ? -1 : 1;
            this.vy = Math.min(this.vy, PHYS.wallSlideMax);
            if (Math.random() < 0.25) g.particles.spawn(this.x + (this.wallDir > 0 ? this.w : 0), this.y + this.h * 0.6, { color: '#c8ceda', vx: -this.wallDir * 20, vy: 20, g: 100, life: 0.3 });
          }
        }
        this.vy = Math.min(this.vy, PHYS.maxFall);
      }

      // jumping
      if (this.jumpBuf > 0 && !this.inWater) {
        if (this.grounded || this.coyote > 0) {
          this.jumpBuf = 0;
          const runBonus = Math.abs(this.vx) > PHYS.walkSpeed + 10 ? PHYS.runJumpBonus : 0;
          const windBonus = this.power === POWER.WIND ? -40 : 0;
          this.vy = PHYS.jumpVel + runBonus + windBonus;
          this.jumping = true;
          this.grounded = false;
          this.coyote = 0;
          sfx.jump(); g.stats.jumps++;
          g.particles.burst(cx, this.y + this.h, 3, { color: '#fff6ec', maxSpeed: 30 });
        } else if (this.wallDir !== 0) {
          this.jumpBuf = 0;
          this.vy = PHYS.wallJumpVY;
          this.vx = -this.wallDir * PHYS.wallJumpVX;
          this.facing = -this.wallDir;
          this.jumping = true;
          sfx.wallJump(); g.stats.jumps++;
          g.particles.burst(this.x + (this.wallDir > 0 ? this.w : 0), this.y + this.h / 2, 5, { color: '#fff6ec', maxSpeed: 50 });
        } else if (this.has('doublejump') && this.jumpsUsed < 1) {
          this.jumpBuf = 0;
          this.jumpsUsed++;
          this.vy = PHYS.jumpVel * 0.92;
          this.jumping = true;
          sfx.doubleJump(); g.stats.jumps++;
          g.particles.burst(cx, this.y + this.h, 7, { color: ['#fff6ec', '#ffd9f0'], maxSpeed: 60 });
        }
      }
      if (!inp.jump && this.vy < 0 && this.jumping) {
        this.vy *= PHYS.jumpCutFactor;
        this.jumping = false;
      }

      // start climb
      if ((inp.up || (climbHere && inp.down && !this.grounded)) && climbHere && this.has('climb')) {
        this.state = 'climb';
        this.vx = 0; this.vy = 0;
        // snap to vine center
        const tx = Math.floor(cx / TILE);
        this.x = tx * TILE + (TILE - this.w) / 2;
      }

      // start pound
      if (inp.down && !this.grounded && !this.inWater && this.has('pound') && this.vy > -60) {
        this.state = 'pound'; this.poundPhase = 0; this.stateT = 0.12;
        g.particles.burst(cx, this.y + this.h / 2, 4, { color: '#fff6ec', maxSpeed: 40 });
      }

      // attack & roll
      if (inp.attackP) this.tryAttack();
      if (inp.rollP) this.tryRollDash(inp);
    }

    // integrate + collide
    this.moveAndCollide(dt);

    // stomp chain resets on landing
    if (this.grounded) { this.jumpsUsed = 0; this.dashUsed = false; this.stompChain = 0; }

    // animation select
    this.animT += dt;
    if (this.state === 'roll') this.anim = 'roll';
    else if (this.state === 'dash') this.anim = 'dash';
    else if (this.state === 'pound') this.anim = 'pound';
    else if (this.state === 'climb') { /* set above */ }
    else if (this.inWater) { if (this.anim !== 'swimStroke' || this.animT > 0.25) this.anim = 'swim'; }
    else if (!this.grounded) {
      if (this.wallDir !== 0) this.anim = 'wallslide';
      else if (this.vy > 40 && this.g.input.down('jump') && (this.has('glide') || this.power === POWER.WIND) && !this.jumping) this.anim = 'glide';
      else this.anim = this.vy < 0 ? 'jump' : 'fall';
    } else if (this.anim !== 'skid' || Math.abs(this.vx) < 30) {
      this.anim = Math.abs(this.vx) > 6 ? 'walk' : (this.g.input.down('down') ? 'crouch' : 'idle');
    }

    // dash trail
    if (this.state === 'dash' || this.state === 'roll' || this.invulnT > 1.6) {
      this.trail.push({ x: this.x, y: this.y, t: 0.18, anim: this.anim, facing: this.facing });
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].t -= dt;
      if (this.trail[i].t <= 0) this.trail.splice(i, 1);
    }
  }

  canStand() {
    // room to stand up from roll?
    return !this.collideRect(this.x, this.y - 6, this.w, 6, 'x');
  }

  forceUnstuck() { this.state = 'normal'; }

  touchingWall(dir) {
    const nx = this.x + dir * 1.5;
    return !!this.collideRect(nx, this.y + 1, this.w, this.h - 2, 'x');
  }

  moveAndCollide(dt) {
    const g = this.g;
    this.onIce = false;
    this.conveyor = 0;

    // X axis
    let nx = this.x + this.vx * dt;
    nx = clamp(nx, 0, g.levelW * TILE - this.w);
    let hit = this.collideRect(nx, this.y, this.w, this.h, 'x');
    if (hit) {
      if (this.state === 'dash' || this.state === 'roll' || this.power === POWER.BEAR) {
        // breaking through bricks while dashing/rolling/bear
        if (BREAKABLE.has(hit.t) && (this.power === POWER.BEAR || hit.t === T.BRICK)) {
          g.breakBlock(hit.tx, hit.ty);
          hit = this.collideRect(nx, this.y, this.w, this.h, 'x');
        }
      }
      if (hit) {
        if (this.vx > 0) nx = hit.tx * TILE - this.w - 0.01;
        else nx = (hit.tx + 1) * TILE + 0.01;
        if (this.state === 'dash') { this.state = 'normal'; this.stateT = 0; }
        this.vx = 0;
      }
    }
    this.x = nx;

    // Y axis
    let ny = this.y + this.vy * dt;
    const wasGrounded = this.grounded;
    this.grounded = false;
    if (this.vy >= 0) {
      const hitD = this.collideRect(this.x, ny, this.w, this.h, 'y+');
      if (hitD) {
        // pound breaks blocks beneath
        if (this.state === 'pound' && this.poundPhase === 1 && BREAKABLE.has(hitD.t)) {
          g.breakBlock(hitD.tx, hitD.ty);
          if (this.power === POWER.BEAR) {
            const t2 = g.tileAt(hitD.tx + 1, hitD.ty), t3 = g.tileAt(hitD.tx - 1, hitD.ty);
            if (BREAKABLE.has(t2)) g.breakBlock(hitD.tx + 1, hitD.ty);
            if (BREAKABLE.has(t3)) g.breakBlock(hitD.tx - 1, hitD.ty);
          }
        } else {
          ny = hitD.ty * TILE - this.h - 0.001;
          if (!wasGrounded && this.vy > 150) sfx.land();
          if (this.state === 'pound' && this.poundPhase === 1) {
            sfx.pound();
            g.camera.shake(this.power === POWER.BEAR ? 5 : 3, 0.22);
            g.onPound(this.x + this.w / 2, ny + this.h, this.power === POWER.BEAR);
            this.state = 'normal';
            this.vy = -90;
            g.particles.burst(this.x + this.w / 2, ny + this.h, 10, { color: ['#c8ceda', '#fff6ec'], maxSpeed: 90 });
          } else {
            this.vy = 0;
          }
          this.grounded = true;
          this.coyote = PHYS.coyoteTime;
          this.jumping = false;
          const under = g.tileAt(hitD.tx, hitD.ty);
          if (under === T.ICE) this.onIce = true;
          if (under === T.CONVL) this.conveyor = -1;
          if (under === T.CONVR) this.conveyor = 1;
          if (under === T.CRUMBLE) g.crumbleAt(hitD.tx, hitD.ty);
          // notify standing row (multiple tiles under feet)
          const fx0 = Math.floor(this.x / TILE), fx1 = Math.floor((this.x + this.w - 0.01) / TILE);
          for (let tx = fx0; tx <= fx1; tx++) {
            const tt = g.tileAt(tx, hitD.ty);
            if (tt === T.CRUMBLE) g.crumbleAt(tx, hitD.ty);
            if (tt === T.CONVL) this.conveyor = -1;
            if (tt === T.CONVR) this.conveyor = 1;
          }
        }
      }
    } else {
      const hitU = this.collideRect(this.x, ny, this.w, this.h, 'y-');
      if (hitU) {
        ny = (hitU.ty + 1) * TILE + 0.001;
        this.vy = 0;
        this.jumping = false;
        // head bump interactions
        const bx = Math.floor((this.x + this.w / 2) / TILE);
        const bumpT = g.tileAt(bx, hitU.ty);
        if (bumpT === T.QUESTION || bumpT === T.HIDDEN) g.bumpBlock(bx, hitU.ty);
        else if (bumpT === T.BRICK) {
          if (this.power === POWER.BEAR || this.runHeld) g.breakBlock(bx, hitU.ty);
          else { sfx.bump(); g.nudgeBlock(bx, hitU.ty); }
        } else sfx.bump();
      }
    }
    this.y = ny;

    if (this.grounded) this.coyote = PHYS.coyoteTime;

    // deadly tiles
    if (this.phaseT <= 0 && !g.cheats.god) {
      const pts = [
        [this.x + 2, this.y + 2], [this.x + this.w - 2, this.y + 2],
        [this.x + 2, this.y + this.h - 2], [this.x + this.w - 2, this.y + this.h - 2],
        [this.x + this.w / 2, this.y + this.h - 1]
      ];
      for (const [px, py] of pts) {
        const t = this.tileAt(px, py);
        if (tileDeadly(t)) {
          if (t === T.LAVA || t === T.LAVATOP) { this.die(); return; }
          this.hurt();
          if (!this.dead && this.grounded) this.vy = -160;
          break;
        }
      }
    }

    // fell out of the world
    if (this.y > g.levelH * TILE + 40) this.die(true);
  }

  spriteName() {
    switch (this.anim) {
      case 'walk': {
        const spd = Math.abs(this.vx) > PHYS.walkSpeed + 8 ? 0.09 : 0.14;
        const f = Math.floor(this.animT / spd) % 4;
        return ['polina_walk1', 'polina_walk2', 'polina_walk3', 'polina_walk2'][f];
      }
      case 'jump': return 'polina_jump';
      case 'fall': return 'polina_fall';
      case 'skid': return 'polina_skid';
      case 'crouch': return 'polina_crouch';
      case 'roll': return Math.floor(this.animT / 0.08) % 2 ? 'polina_roll2' : 'polina_roll1';
      case 'dash': return 'polina_dash';
      case 'pound': return 'polina_pound';
      case 'climb': case 'climbIdle': {
        if (this.anim === 'climbIdle') return 'polina_climb1';
        return 'polina_climb1'; // frame flip handled via facing swap below
      }
      case 'swim': return Math.floor(this.animT / 0.3) % 2 ? 'polina_swim1' : 'polina_swim2';
      case 'swimStroke': return 'polina_swim2';
      case 'glide': return 'polina_glide';
      case 'wallslide': return 'polina_jump';
      case 'hurt': return 'polina_hurt';
      case 'victory': return 'polina_victory';
      default: return 'polina_idle';
    }
  }

  draw(ctx, camX, camY) {
    if (this.dead && this.deathT > 2.2) return;
    const pal = POWER_PAL[this.power] || null;
    const palId = this.power;
    let flip = this.facing < 0;
    if (this.anim === 'climb') flip = Math.floor(this.animT / 0.18) % 2 === 0;
    if (this.anim === 'wallslide') flip = this.wallDir > 0;

    // ghost trail
    for (const tr of this.trail) {
      ctx.globalAlpha = tr.t * 1.2;
      const s = getSprite(this.spriteName(), { flip: tr.facing < 0, pal, palId });
      if (s) ctx.drawImage(s, Math.round(tr.x - camX - 1), Math.round(tr.y - camY - (s.height - this.h)));
    }
    ctx.globalAlpha = 1;

    // invulnerability flicker
    if (this.invulnT > 0 && !this.dead && Math.floor(this.invulnT * 12) % 2 === 0) return;

    let img;
    if (this.phaseT > 0) {
      img = getTinted(this.spriteName(), { flip, pal, palId }, '#5c2a80', 0.6);
      ctx.globalAlpha = 0.6;
    } else {
      img = getSprite(this.spriteName(), { flip, pal, palId });
    }
    if (img) {
      const dx = Math.round(this.x - camX - (img.width - this.w) / 2);
      const dy = Math.round(this.y - camY - (img.height - this.h));
      if (this.dead) {
        ctx.save();
        ctx.translate(dx + img.width / 2, dy + img.height / 2);
        ctx.rotate(this.deathT * 6);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        ctx.drawImage(img, dx, dy);
      }
    }
    ctx.globalAlpha = 1;
  }
}
