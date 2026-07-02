// The play state: owns the loaded level, all entities, camera, HUD and rules.
import { TILE, VIEW_W, VIEW_H, POWER } from './const.js';
import { clamp, rand } from './util.js';
import { T, tileSolid, SOLID, getTile } from './tiles.js';
import { drawBackground } from './backgrounds.js';
import { Player } from './player.js';
import { Petal, Gem, Heart, Matryoshka, PowerUp, Spring, Checkpoint, Gate, MovingPlatform, Projectile, Entity } from './entities.js';
import { ENEMY_FACTORY, Enemy } from './enemies.js';
import { makeBoss } from './bosses.js';
import { Camera } from './camera.js';
import { Particles } from './particles.js';
import { drawText, textWidth } from './font.js';
import { t } from './i18n.js';
import { sfx } from './sfx.js';
import { playMusic, stopMusic, sequencer } from './audio.js';
import { MUSIC, WORLD_MUSIC } from './music.js';
import { aabb } from './util.js';
import { getSprite } from './sprites.js';

const WORLD_POWER = { 1: POWER.FIRE, 2: POWER.WIND, 3: POWER.CRYSTAL, 4: POWER.BEAR, 5: POWER.ICE, 6: POWER.WIND, 7: POWER.SHADOW, 8: POWER.BOLT, 9: POWER.PHOENIX };

export class Game {
  constructor(app) {
    this.app = app;
    this.input = app.input;
    this.camera = new Camera();
    this.particles = new Particles();
    this.banners = [];
    this.state = 'play'; // play | dying | clear | bossclear | gameover
  }

  get cheats() { return this.app.cheats; }
  get save() { return this.app.save; }
  get stats() { return this.app.save.stats; }
  get enemySpeedScale() {
    const d = this.app.settings.difficulty;
    return d === 'relaxed' ? 0.85 : d === 'fierce' ? 1.2 : 1;
  }

  hasAbility(ab) { return this.cheats.allAbilities || !!this.save.abilities[ab]; }

  loadLevel(level, { fromCheckpoint = false } = {}) {
    this.level = level;
    this.levelW = level.width;
    this.levelH = level.height;
    this.tiles = level.tiles.slice(); // fresh copy so blocks reset
    this.entities = [];
    this.boss = null;
    this.bumps = [];        // block bump animations
    this.crumbles = new Map();
    this.time = 0;
    this.timeLeft = level.timeLimit;
    this.state = 'play';
    this.stateT = 0;
    this.clearStats = null;
    this.petalCount = 0;
    this.enemiesTotal = 0;

    this.player = new Player(this);
    this.player.setDifficultyHearts(this.app.settings.difficulty);
    this.player.power = this.save.power && this.save.power !== 'none' ? this.save.power : POWER.NONE;
    if (this.player.power === POWER.CRYSTAL) this.player.shieldHits = 2;

    for (const s of level.spawns) {
      switch (s.type) {
        case 'gate':
          if (level.boss) this.spawnBoss(s.x, s.y);
          else this.entities.push(new Gate(this, s.x, s.y));
          break;
        case 'checkpoint': this.entities.push(new Checkpoint(this, s.x, s.y)); break;
        case 'spring': this.entities.push(new Spring(this, s.x, s.y)); break;
        case 'petal': this.entities.push(new Petal(this, s.x, s.y)); this.petalCount++; break;
        case 'gem':
          if (!this.save.gems[level.id]) this.entities.push(new Gem(this, s.x, s.y));
          break;
        case 'heart': this.entities.push(new Heart(this, s.x, s.y)); break;
        case 'matryoshka': this.entities.push(new Matryoshka(this, s.x, s.y)); break;
        case 'platform_h': this.entities.push(new MovingPlatform(this, s.x, s.y, { dx: 1, dist: 40, speed: 34 })); break;
        case 'platform_v': this.entities.push(new MovingPlatform(this, s.x, s.y, { dy: 1, dist: 44, speed: 30 })); break;
        case 'enemy': {
          const f = ENEMY_FACTORY[s.enemy];
          if (f) { this.entities.push(f(this, s.x, s.y, level.world)); this.enemiesTotal++; }
          break;
        }
      }
    }

    const cp = fromCheckpoint && this.checkpoint;
    const sp = cp ? this.checkpoint : level.playerSpawn;
    if (!fromCheckpoint) this.checkpoint = null;
    this.player.spawnAt(sp.x, sp.y);
    this.camera.shakeEnabled = this.app.settings.screenShake;
    this.camera.reset(this.player.x, this.player.y, this.levelW, this.levelH);

    const musicId = level.boss ? (level.world === 9 ? 'final' : 'boss') : (level.music || WORLD_MUSIC[level.world]);
    playMusic(MUSIC[musicId], musicId);
    this.hurry = false;
  }

  spawnBoss(x, y) {
    this.boss = makeBoss(this, this.level.world, x, y);
    if (this.boss) this.entities.push(this.boss);
  }

  // --- tile access -----------------------------------------------------------
  tileAt(tx, ty) {
    if (tx < 0 || tx >= this.levelW) return T.STONE;   // level edges are walls
    if (ty < 0) return T.EMPTY;
    if (ty >= this.levelH) return T.EMPTY;
    return this.tiles[ty * this.levelW + tx];
  }

  setTile(tx, ty, v) {
    if (tx < 0 || tx >= this.levelW || ty < 0 || ty >= this.levelH) return;
    this.tiles[ty * this.levelW + tx] = v;
  }

  bumpBlock(tx, ty) {
    const tt = this.tileAt(tx, ty);
    this.bumps.push({ tx, ty, t: 0 });
    const px = tx * TILE, py = ty * TILE;
    if (tt === T.QUESTION || tt === T.HIDDEN) {
      this.setTile(tx, ty, T.USED);
      const key = ty * this.levelW + tx;
      if (this.level.powerBlocks.has(key)) {
        const power = this.level.power || WORLD_POWER[this.level.world] || POWER.FIRE;
        this.entities.push(new PowerUp(this, px, py - 14, power, { rise: true }));
        sfx.powerup();
      } else if ((tx * 7 + ty * 13) % 11 === 3) {
        this.entities.push(new Heart(this, px, py - 16));
        sfx.coin();
      } else {
        this.entities.push(new Petal(this, px, py - 16, { pop: true }));
      }
      // bump kills enemies standing on the block
      for (const e of this.entities) {
        if (e instanceof Enemy && !e.dead && Math.abs((e.y + e.h) - py) < 4 && e.x + e.w > px && e.x < px + TILE) e.kill();
      }
    }
  }

  nudgeBlock(tx, ty) {
    this.bumps.push({ tx, ty, t: 0 });
    const px = tx * TILE, py = ty * TILE;
    for (const e of this.entities) {
      if (e instanceof Enemy && !e.dead && Math.abs((e.y + e.h) - py) < 4 && e.x + e.w > px && e.x < px + TILE) e.kill();
    }
  }

  breakBlock(tx, ty) {
    const tt = this.tileAt(tx, ty);
    if (!SOLID.has(tt)) return;
    this.setTile(tx, ty, T.EMPTY);
    sfx.breakBlock();
    const px = tx * TILE + 8, py = ty * TILE + 8;
    this.particles.burst(px, py, 10, { color: ['#b07840', '#8a5c30', '#d8a86a'], maxSpeed: 120, size: 3 });
    this.camera.shake(1.5, 0.1);
  }

  crumbleAt(tx, ty) {
    const key = ty * this.levelW + tx;
    if (!this.crumbles.has(key)) this.crumbles.set(key, { tx, ty, t: 0, fallen: false });
  }

  onPound(px, py, big) {
    // shockwave: stun/kill grounded enemies nearby
    for (const e of this.entities) {
      if (e instanceof Enemy && !e.dead && e.squashT === 0 && e.grounded !== false) {
        const d = Math.abs(e.x + e.w / 2 - px);
        if (d < (big ? 60 : 40) && Math.abs(e.y + e.h - py) < 20) {
          if (e.stompable) e.kill();
          else e.flashT = 0.2;
        }
      }
    }
  }

  // --- economy / progress ------------------------------------------------------
  addCoins(n) {
    if (this.cheats.infcoins) return;
    this.save.coins += n;
    this.stats.coins += n;
    while (this.save.coins >= 100) {
      this.save.coins -= 100;
      this.addLife(1);
    }
  }

  addLife(n) {
    this.save.lives = clamp(this.save.lives + n, 0, 99);
    if (n > 0) {
      sfx.oneUp();
      this.banner('life_up', '#8ade6a');
    }
  }

  collectGem() {
    this.save.gems[this.level.id] = true;
    this.stats.gems++;
    sfx.gem();
    this.banner('gem_get', '#7ae0f0');
    this.particles.burst(this.player.x, this.player.y, 20, { color: ['#7ae0f0', '#fff6ec', '#2a90c0'], maxSpeed: 130 });
    this.app.autoSave();
  }

  onEnemyKilled(e) {
    this.stats.enemies++;
    if (this.boss === e) this.boss = null;
  }

  setCheckpoint(x, y) { this.checkpoint = { x, y }; }

  banner(key, color = '#ffd042') {
    this.banners.push({ text: t(key), color, t: 0, life: 1.6 });
  }

  showPowerBanner(power) {
    this.banners.push({ text: t('pw_' + power), color: '#ffd042', t: 0, life: 1.8, sub: t('pw_' + power + '_d') });
  }

  countProjectiles(kind) {
    let n = 0;
    for (const e of this.entities) if (e instanceof Projectile && e.fromPlayer && e.kind === kind && !e.dead) n++;
    return n;
  }

  spawnProjectile(kind, x, y, vx, vy) {
    this.entities.push(new Projectile(this, kind, x, y, vx, vy, true));
  }

  onPhoenixRevive() { this.banner('phoenix_revive', '#ff8830'); }

  onPlayerDeath() {
    if (this.state !== 'play') return;
    this.state = 'dying';
    this.stateT = 0;
    this.stats.deaths++;
    stopMusic(0.4);
  }

  completeLevel() {
    if (this.state !== 'play') return;
    this.state = 'clear';
    this.stateT = 0;
    this.player.anim = 'victory';
    this.player.vx = 0;
    stopMusic(0.2);
    sfx.levelClear();
    const timeBonus = Math.max(0, Math.floor(this.timeLeft)) ;
    this.clearStats = { time: this.time, timeBonus };
    this.addCoins(Math.floor(timeBonus / 20));
    this.stats.levels++;
    this.save.power = this.player.power;
    this.app.markLevelCleared(this.level.id);
  }

  onBossDefeated() {
    if (this.state !== 'play') return;
    this.state = 'bossclear';
    this.stateT = 0;
    stopMusic(0.3);
    sfx.bossDie();
    this.camera.shake(6, 0.6);
  }

  // --- update -------------------------------------------------------------------
  update(dt) {
    const speedMul = this.cheats.slowmo ? 0.4 : this.cheats.fastfwd ? 1.8 : 1;
    dt *= speedMul;
    this.time += dt;
    this.stats.time += dt;

    // banners always tick
    for (let i = this.banners.length - 1; i >= 0; i--) {
      this.banners[i].t += dt;
      if (this.banners[i].t > this.banners[i].life) this.banners.splice(i, 1);
    }

    if (this.state === 'dying') {
      this.stateT += dt;
      this.player.update(dt);
      this.particles.update(dt);
      if (this.stateT > 2.0) {
        if (this.cheats.inflives) { this.app.retryLevel(true); return; }
        this.save.lives--;
        if (this.save.lives <= 0) {
          this.state = 'gameover';
          this.stateT = 0;
          sfx.gameOver();
        } else {
          this.app.retryLevel(!!this.checkpoint);
        }
        this.app.autoSave();
      }
      return;
    }

    if (this.state === 'gameover') {
      this.stateT += dt;
      if (this.stateT > 1.2 && (this.input.pressed('jump') || this.input.pressed('pause') || this.input.taps.length)) {
        this.save.lives = 4;
        this.app.autoSave();
        this.app.exitToMap();
      }
      return;
    }

    if (this.state === 'clear') {
      this.stateT += dt;
      this.particles.update(dt);
      if (Math.random() < 0.3) {
        this.particles.spawn(rand(0, VIEW_W) + this.camera.x, this.camera.y - 4, {
          color: ['#ff9ac0', '#ffd9f0', '#fff6ec'][Math.floor(rand(0, 3))], vy: rand(30, 70), vx: rand(-20, 20), g: 0, life: 3
        });
      }
      if (this.stateT > 2.6) this.app.onLevelComplete();
      return;
    }

    if (this.state === 'bossclear') {
      this.stateT += dt;
      this.particles.update(dt);
      this.camera.update(dt, this.player);
      if (this.stateT > 3.0) this.app.onBossComplete();
      return;
    }

    // timer
    if (this.app.settings.difficulty !== 'relaxed' && !this.level.boss) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 60 && !this.hurry) {
        this.hurry = true;
        sequencer.setSpeed(1.15);
      }
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.player.die(); }
    }

    // wind (Sky Isles mechanic)
    if (this.level.wind && !this.player.dead && !this.player.grounded && !this.cheats.fly) {
      this.player.vx += this.level.wind * 46 * dt;
    }

    this.player.update(dt);

    // entities
    for (const e of this.entities) if (!e.dead) e.update(dt);

    // player projectiles vs enemies
    for (const e of this.entities) {
      if (!(e instanceof Projectile) || !e.fromPlayer || e.dead) continue;
      for (const en of this.entities) {
        if (!(en instanceof Enemy) || en.dead || en.squashT > 0) continue;
        if (aabb(e.hitbox, en.hitbox)) {
          if (e.kind === 'fire') { en.damage(this.cheats.onehit ? 99 : 1, 'fire'); }
          else if (e.kind === 'ice') { en.freeze(5); }
          e.explode();
          break;
        }
      }
    }

    // one-hit cheat applies to normal kills too (stomp handles via damage)
    if (this.cheats.onehit) {
      for (const en of this.entities) {
        if (en instanceof Enemy && en.flashT > 0 && en.hp > 0) en.hp = Math.min(en.hp, 1);
      }
    }

    // cull dead
    this.entities = this.entities.filter((e) => !e.dead);

    // crumble tiles
    for (const [key, c] of this.crumbles) {
      c.t += dt;
      if (!c.fallen && c.t > 0.4) {
        c.fallen = true;
        this.setTile(c.tx, c.ty, T.EMPTY);
        this.particles.burst(c.tx * TILE + 8, c.ty * TILE + 8, 6, { color: ['#b07840', '#8a5c30'], maxSpeed: 60 });
        sfx.breakBlock();
      }
      if (c.fallen && c.t > 4.5) {
        // restore if nothing occupies the space
        const p = this.player;
        const rect = { x: c.tx * TILE, y: c.ty * TILE, w: TILE, h: TILE };
        if (!aabb(rect, p.hitbox)) {
          this.setTile(c.tx, c.ty, T.CRUMBLE);
          this.crumbles.delete(key);
        }
      }
    }

    // bump animations
    for (let i = this.bumps.length - 1; i >= 0; i--) {
      this.bumps[i].t += dt * 6;
      if (this.bumps[i].t >= 1) this.bumps.splice(i, 1);
    }

    this.particles.update(dt);
    this.camera.update(dt, this.player);
  }

  // --- draw ------------------------------------------------------------------------
  draw(ctx) {
    const cam = this.camera.renderOffset();
    drawBackground(ctx, this.level.world, cam.x, cam.y, this.time);

    // tiles
    const waterFrame = Math.floor(this.time * 2.2) % 2;
    const x0 = Math.max(0, Math.floor(cam.x / TILE)), x1 = Math.min(this.levelW - 1, Math.floor((cam.x + VIEW_W) / TILE));
    const y0 = Math.max(0, Math.floor(cam.y / TILE)), y1 = Math.min(this.levelH - 1, Math.floor((cam.y + VIEW_H) / TILE));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const tt = this.tiles[ty * this.levelW + tx];
        if (tt === T.EMPTY) continue;
        if (tt === T.HIDDEN && !this.cheats.reveal) continue;
        let oy = 0;
        for (const b of this.bumps) {
          if (b.tx === tx && b.ty === ty) oy = -Math.sin(b.t * Math.PI) * 5;
        }
        const img = getTile(this.level.world, tt, (tt === T.WATERTOP || tt === T.LAVATOP || tt === T.CONVL || tt === T.CONVR) ? waterFrame : 0);
        if (tt === T.HIDDEN && this.cheats.reveal) {
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#ffd042';
          ctx.fillRect(tx * TILE - cam.x, ty * TILE - cam.y + oy, TILE, TILE);
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.drawImage(img, tx * TILE - cam.x, ty * TILE - cam.y + oy);
      }
    }

    // crumble shake preview
    for (const [, c] of this.crumbles) {
      if (!c.fallen) {
        const jx = Math.sin(c.t * 50) * 1;
        const img = getTile(this.level.world, T.CRUMBLE, 0);
        ctx.drawImage(img, c.tx * TILE - cam.x + jx, c.ty * TILE - cam.y);
      }
    }

    // entities behind player
    for (const e of this.entities) e.draw(ctx, cam.x, cam.y);

    this.player.draw(ctx, cam.x, cam.y);
    this.particles.draw(ctx, cam.x, cam.y, drawText);

    // darkness vignette (caverns / haunted)
    if (this.level.dark) {
      const px = this.player.x + this.player.w / 2 - cam.x;
      const py = this.player.y + this.player.h / 2 - cam.y;
      const g = ctx.createRadialGradient(px, py, 36, px, py, 130);
      g.addColorStop(0, 'rgba(8,6,18,0)');
      g.addColorStop(1, 'rgba(8,6,18,0.88)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // wind streaks
    if (this.level.wind) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const wy = ((i * 53 + this.time * 40) % VIEW_H);
        const wx = ((i * 97 + this.time * this.level.wind * 150) % (VIEW_W + 40)) - 20;
        ctx.fillRect(wx, wy, 12, 1);
      }
      ctx.globalAlpha = 1;
    }

    this.drawHUD(ctx);

    // boss HP bar
    if (this.boss && !this.boss.dead && this.boss.introDone) {
      const bw = 120, bx = VIEW_W / 2 - bw / 2, by = VIEW_H - 14;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 9);
      ctx.fillStyle = '#5c1020';
      ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#e04050';
      ctx.fillRect(bx, by, bw * clamp(this.boss.hp / this.boss.maxHp, 0, 1), 5);
      drawText(ctx, t('boss' + this.level.world + '_name'), VIEW_W / 2, by - 11, '#ffd9f0', { align: 'center', shadow: '#181624' });
    }

    // state overlays
    if (this.state === 'clear') this.drawClearOverlay(ctx);
    if (this.state === 'gameover') this.drawGameOver(ctx);

    // banners
    let by = 58;
    for (const b of this.banners) {
      const a = b.t < 0.2 ? b.t / 0.2 : b.t > b.life - 0.3 ? (b.life - b.t) / 0.3 : 1;
      ctx.globalAlpha = clamp(a, 0, 1);
      drawText(ctx, b.text, VIEW_W / 2, by, b.color, { align: 'center', shadow: '#181624' });
      if (b.sub) drawText(ctx, b.sub, VIEW_W / 2, by + 10, '#fff6ec', { align: 'center', shadow: '#181624' });
      by += b.sub ? 22 : 12;
      ctx.globalAlpha = 1;
    }

    // debug overlays
    if (this.cheats.collision) this.drawCollisionDebug(ctx, cam);
    if (this.cheats.ai) this.drawAIDebug(ctx, cam);
    if (this.cheats.debug) this.drawDebug(ctx);
  }

  drawHUD(ctx) {
    // hearts
    const img = getSprite('heart');
    for (let i = 0; i < this.player.maxHearts; i++) {
      ctx.globalAlpha = i < this.player.hearts ? 1 : 0.25;
      ctx.drawImage(img, 5 + i * 10, 5);
    }
    ctx.globalAlpha = 1;
    // crystal shield pips
    for (let i = 0; i < this.player.shieldHits; i++) {
      ctx.fillStyle = '#7ae0f0';
      ctx.fillRect(6 + i * 5, 14, 3, 3);
    }
    // petals
    ctx.drawImage(getSprite('petal1'), 5, 20);
    const coinStr = this.cheats.infcoins ? '99+' : String(this.save.coins).padStart(2, '0');
    drawText(ctx, '×' + coinStr, 14, 20, '#fff6ec', { shadow: '#181624' });
    // lives
    drawText(ctx, '♥×' + (this.cheats.inflives ? '99' : this.save.lives), 5, 31, '#ff9ac0', { shadow: '#181624' });
    // level id + time
    drawText(ctx, this.level.id, VIEW_W / 2, 5, '#fff6ec', { align: 'center', shadow: '#181624' });
    if (this.app.settings.difficulty !== 'relaxed' && !this.level.boss) {
      const tl = Math.ceil(this.timeLeft);
      drawText(ctx, String(tl), VIEW_W / 2, 14, tl <= 60 ? '#e04050' : '#c8ceda', { align: 'center', shadow: '#181624' });
    }
    // power icon
    if (this.player.power !== POWER.NONE) {
      const pimg = getSprite('pw_' + this.player.power);
      if (pimg) ctx.drawImage(pimg, VIEW_W - 40, 5);
    }
    if (this.cheats.fps) {
      drawText(ctx, Math.round(this.app.fps) + ' FPS', VIEW_W - 4, VIEW_H - 10, '#8ade6a', { align: 'right', shadow: '#181624' });
    }
  }

  drawClearOverlay(ctx) {
    const k = clamp(this.stateT / 0.5, 0, 1);
    ctx.fillStyle = `rgba(10,6,24,${0.55 * k})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.stateT > 0.3) {
      drawText(ctx, t('level_clear'), VIEW_W / 2, 78, '#ffd042', { align: 'center', scale: 2, shadow: '#181624' });
    }
    if (this.stateT > 0.8 && this.clearStats) {
      drawText(ctx, t('time_bonus') + ': ' + this.clearStats.timeBonus, VIEW_W / 2, 110, '#fff6ec', { align: 'center', shadow: '#181624' });
    }
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(6,4,14,0.85)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawText(ctx, t('game_over'), VIEW_W / 2, 100, '#e04050', { align: 'center', scale: 2, shadow: '#181624' });
    if (this.stateT > 1.2 && Math.floor(this.stateT * 2) % 2 === 0) {
      drawText(ctx, t('try_again'), VIEW_W / 2, 132, '#fff6ec', { align: 'center', shadow: '#181624' });
    }
  }

  drawCollisionDebug(ctx, cam) {
    ctx.strokeStyle = 'rgba(0,255,120,0.8)';
    const p = this.player;
    ctx.strokeRect(p.x - cam.x, p.y - cam.y, p.w, p.h);
    ctx.strokeStyle = 'rgba(255,80,80,0.8)';
    for (const e of this.entities) {
      ctx.strokeRect(e.x - cam.x, e.y - cam.y, e.w, e.h);
    }
    ctx.strokeStyle = 'rgba(255,255,0,0.25)';
    const x0 = Math.floor(cam.x / TILE), x1 = Math.floor((cam.x + VIEW_W) / TILE);
    const y0 = Math.floor(cam.y / TILE), y1 = Math.floor((cam.y + VIEW_H) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tileSolid(this.tileAt(tx, ty))) ctx.strokeRect(tx * TILE - cam.x, ty * TILE - cam.y, TILE, TILE);
    }
  }

  drawAIDebug(ctx, cam) {
    for (const e of this.entities) {
      if (e instanceof Enemy && e.aiNote) {
        drawText(ctx, e.aiNote, e.x + e.w / 2 - cam.x, e.y - 10 - cam.y, '#8ade6a', { align: 'center' });
      }
    }
  }

  drawDebug(ctx) {
    const p = this.player;
    const lines = [
      `X ${p.x.toFixed(1)} Y ${p.y.toFixed(1)}`,
      `VX ${p.vx.toFixed(0)} VY ${p.vy.toFixed(0)}`,
      `ST ${p.state} ${p.anim}`,
      `ENT ${this.entities.length}`,
      `GRND ${p.grounded ? 1 : 0} WALL ${p.wallDir}`
    ];
    lines.forEach((ln, i) => drawText(ctx, ln, 4, 44 + i * 9, '#8ade6a', { shadow: '#181624' }));
  }
}
