// World map: 9 themed islands with level nodes, gem tallies and boss keeps.
import { VIEW_W, VIEW_H, WORLD_COUNT } from './const.js';
import { clamp, lerp } from './util.js';
import { drawText } from './font.js';
import { t } from './i18n.js';
import { getSprite } from './sprites.js';
import { THEMES } from './tiles.js';
import { sfx } from './sfx.js';
import { playMusic } from './audio.js';
import { MUSIC } from './music.js';

export class WorldMap {
  constructor(app) {
    this.app = app;
    this.world = 1;
    this.index = 0;
    this.tokenX = 0; this.tokenY = 0;
    this.t = 0;
    this.scrollX = 0;
  }

  levelsFor(world) { return this.app.levelsByWorld[world] || []; }

  enter() {
    playMusic(MUSIC.map, 'map');
    // put cursor on first uncleared unlocked level of the furthest world
    this.world = clamp(this.app.save.world, 1, WORLD_COUNT);
    const lv = this.levelsFor(this.world);
    this.index = 0;
    for (let i = 0; i < lv.length; i++) {
      if (this.app.isUnlocked(lv[i].id) && !this.app.save.cleared[lv[i].id]) { this.index = i; break; }
      if (this.app.save.cleared[lv[i].id]) this.index = Math.min(i + 1, lv.length - 1);
    }
    const n = this.nodePos(this.world, this.index);
    this.tokenX = n.x; this.tokenY = n.y;
  }

  nodePos(world, i) {
    const count = this.levelsFor(world).length;
    const spacing = Math.min(64, 300 / Math.max(1, count - 1));
    const total = spacing * (count - 1);
    const x0 = VIEW_W / 2 - total / 2;
    const y = 150 + Math.sin(i * 1.7 + world) * 14;
    return { x: x0 + i * spacing, y };
  }

  worldUnlocked(w) {
    const lv = this.levelsFor(w);
    return lv.length > 0 && this.app.isUnlocked(lv[0].id);
  }

  update(dt) {
    this.t += dt;
    const inp = this.app.input;
    const lv = this.levelsFor(this.world);

    let moved = false;
    if (inp.pressed('right') && this.index < lv.length - 1) { this.index++; moved = true; }
    else if (inp.pressed('left') && this.index > 0) { this.index--; moved = true; }
    else if ((inp.pressed('up') || (inp.pressed('right') && this.index === lv.length - 1)) && this.world < WORLD_COUNT && this.worldUnlocked(this.world + 1)) {
      this.world++; this.index = 0; moved = true;
    } else if ((inp.pressed('down') || (inp.pressed('left') && this.index === 0)) && this.world > 1) {
      this.world--; this.index = 0; moved = true;
    }
    if (moved) sfx.menuMove();

    // tap support: tap a node to move/select
    for (const tap of inp.taps) {
      for (let i = 0; i < lv.length; i++) {
        const n = this.nodePos(this.world, i);
        if (Math.hypot(tap.x - n.x, tap.y - n.y) < 16) {
          if (i === this.index && this.app.isUnlocked(lv[i].id)) this.select();
          else { this.index = i; sfx.menuMove(); }
        }
      }
      // world arrows
      if (tap.y < 60) {
        if (tap.x > VIEW_W - 70 && this.world < WORLD_COUNT && this.worldUnlocked(this.world + 1)) { this.world++; this.index = 0; sfx.menuMove(); }
        else if (tap.x < 70 && this.world > 1) { this.world--; this.index = 0; sfx.menuMove(); }
      }
    }

    if (inp.pressed('jump')) this.select();
    if (inp.pressed('pause')) this.app.openPauseFromMap();

    const n = this.nodePos(this.world, this.index);
    this.tokenX = lerp(this.tokenX, n.x, 1 - Math.pow(0.0001, dt));
    this.tokenY = lerp(this.tokenY, n.y, 1 - Math.pow(0.0001, dt));
  }

  select() {
    const lv = this.levelsFor(this.world);
    const level = lv[this.index];
    if (!level) return;
    if (!this.app.isUnlocked(level.id)) { sfx.bump(); return; }
    sfx.menuSelect();
    this.app.startLevel(level.id);
  }

  draw(ctx) {
    const th = THEMES[this.world];
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // ground band
    ctx.fillStyle = th.hills[1];
    ctx.fillRect(0, 176, VIEW_W, VIEW_H - 176);
    ctx.fillStyle = th.hills[0];
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(20 + i * 52, 186, 18 + (i % 3) * 6, Math.PI, 0);
      ctx.fill();
    }

    // header
    drawText(ctx, t('w' + this.world), VIEW_W / 2, 16, '#fff6ec', { align: 'center', scale: 2, shadow: '#181624' });
    const gems = this.levelsFor(this.world).filter((l) => this.app.save.gems[l.id]).length;
    const total = this.levelsFor(this.world).filter((l) => !l.boss).length;
    drawText(ctx, `◆ ${gems}/${total}`, VIEW_W / 2, 38, '#7ae0f0', { align: 'center', shadow: '#181624' });
    drawText(ctx, `${this.world}/${WORLD_COUNT}`, VIEW_W / 2, 50, '#c8ceda', { align: 'center' });

    // world arrows
    if (this.world > 1) drawText(ctx, '← ' + t('w' + (this.world - 1)), 8, 32, '#ffd9f0', { shadow: '#181624' });
    if (this.world < WORLD_COUNT && this.worldUnlocked(this.world + 1)) {
      drawText(ctx, t('w' + (this.world + 1)) + ' →', VIEW_W - 8, 32, '#ffd9f0', { align: 'right', shadow: '#181624' });
    }

    // path + nodes
    const lv = this.levelsFor(this.world);
    for (let i = 0; i < lv.length - 1; i++) {
      const a = this.nodePos(this.world, i), b = this.nodePos(this.world, i + 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (let i = 0; i < lv.length; i++) {
      const level = lv[i];
      const n = this.nodePos(this.world, i);
      const unlocked = this.app.isUnlocked(level.id);
      const cleared = !!this.app.save.cleared[level.id];
      const r = level.boss ? 11 : 8;
      ctx.fillStyle = '#181624';
      ctx.beginPath(); ctx.arc(n.x, n.y + 1, r + 2, 0, 7); ctx.fill();
      ctx.fillStyle = !unlocked ? '#555b6e' : cleared ? '#3fae4a' : level.boss ? '#e04050' : '#ffd042';
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(n.x - 2, n.y - 2, r * 0.45, 0, 7); ctx.fill();
      if (level.boss) drawText(ctx, '★', n.x, n.y - 3, '#fff6ec', { align: 'center' });
      else drawText(ctx, String(level.stage), n.x, n.y - 3, '#181624', { align: 'center' });
      if (!unlocked) drawText(ctx, '×', n.x, n.y - 3, '#c8ceda', { align: 'center' });
      if (this.app.save.gems[level.id]) drawText(ctx, '◆', n.x + r, n.y - r - 4, '#7ae0f0');
      // label under selected node
      if (i === this.index) {
        const nm = level.boss ? t('boss' + this.world + '_name') : `${t('level_of')} ${level.stage}`;
        drawText(ctx, nm, n.x, n.y + r + 6, '#fff6ec', { align: 'center', shadow: '#181624' });
        if (unlocked) drawText(ctx, t('map_enter') + ' (A)', n.x, n.y + r + 17, '#ffd042', { align: 'center', shadow: '#181624' });
        else drawText(ctx, t('map_locked'), n.x, n.y + r + 17, '#8e94a6', { align: 'center', shadow: '#181624' });
      }
    }

    // Polina token
    const img = getSprite('polina_idle');
    const bob = Math.sin(this.t * 4) * 2;
    ctx.drawImage(img, Math.round(this.tokenX - 6), Math.round(this.tokenY - 26 + bob));

    // footer: lives & petals
    drawText(ctx, '♥×' + this.app.save.lives, 8, VIEW_H - 14, '#ff9ac0', { shadow: '#181624' });
    ctx.drawImage(getSprite('petal1'), 60, VIEW_H - 15);
    drawText(ctx, '×' + this.app.save.coins, 69, VIEW_H - 14, '#fff6ec', { shadow: '#181624' });
    drawText(ctx, '= ' + t('settings'), VIEW_W - 8, VIEW_H - 14, '#c8ceda', { align: 'right', shadow: '#181624' });
  }
}
