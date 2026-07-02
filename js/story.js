// Story scenes: intro, spirit blessings after bosses, and the ending.
import { VIEW_W, VIEW_H } from './const.js';
import { drawText, drawTextWrapped } from './font.js';
import { t } from './i18n.js';
import { getSprite } from './sprites.js';
import { sfx } from './sfx.js';
import { clamp } from './util.js';

// A sequence of localized text pages with a typewriter effect.
export class StoryScene {
  constructor(app, pageKeys, { onDone, bgColor = '#141428', sprite = null } = {}) {
    this.app = app;
    this.pages = pageKeys;
    this.page = 0;
    this.chars = 0;
    this.t = 0;
    this.onDone = onDone;
    this.bgColor = bgColor;
    this.sprite = sprite;
    this.blipT = 0;
  }

  get pageText() { return t(this.pages[this.page]); }

  update(dt) {
    this.t += dt;
    const full = this.pageText.length;
    if (this.chars < full) {
      this.chars += dt * 34;
      this.blipT -= dt;
      if (this.blipT <= 0) { sfx.textBlip(); this.blipT = 0.09; }
      if (this.chars > full) this.chars = full;
    }
    const inp = this.app.input;
    const advance = inp.pressed('jump') || inp.pressed('pause') || inp.taps.length > 0;
    if (advance) {
      if (this.chars < full) { this.chars = full; }
      else {
        this.page++;
        this.chars = 0;
        sfx.menuSelect();
        if (this.page >= this.pages.length) { this.onDone && this.onDone(); }
      }
    }
    // skip button (attack / long list)
    if (inp.pressed('attack') && this.page < this.pages.length) {
      this.page = this.pages.length;
      this.onDone && this.onDone();
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // gentle falling petals
    for (let i = 0; i < 14; i++) {
      const px = (i * 73 + Math.sin(this.t * 0.8 + i) * 30 + this.t * 9) % VIEW_W;
      const py = (i * 41 + this.t * (14 + (i % 5) * 4)) % VIEW_H;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = i % 2 ? '#ff9ac0' : '#ffd9f0';
      ctx.fillRect(px, py, 2, 2);
      ctx.globalAlpha = 1;
    }
    if (this.sprite) {
      const img = getSprite(this.sprite);
      if (img) {
        const s = 3;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, Math.round(VIEW_W / 2 - img.width * s / 2), 34, img.width * s, img.height * s);
      }
    }
    if (this.page < this.pages.length) {
      const shown = this.pageText.slice(0, Math.floor(this.chars));
      drawTextWrapped(ctx, shown, VIEW_W / 2 - 160, this.sprite ? 128 : 92, 320, '#fff6ec', { scale: 1 });
      // continue arrow
      if (this.chars >= this.pageText.length && Math.floor(this.t * 2) % 2 === 0) {
        drawText(ctx, '↓', VIEW_W / 2, VIEW_H - 30, '#ffd042', { align: 'center' });
      }
      drawText(ctx, t('story_skip') + ' (B)', VIEW_W - 8, VIEW_H - 12, '#8e94a6', { align: 'right' });
      drawText(ctx, `${this.page + 1}/${this.pages.length}`, 8, VIEW_H - 12, '#8e94a6');
    }
  }
}

export function introScene(app, onDone) {
  return new StoryScene(app, ['story1', 'story2', 'story3', 'story4', 'story5'], { onDone, sprite: 'polina_victory' });
}

export function spiritScene(app, world, onDone) {
  return new StoryScene(app, ['boss_defeated', 'spirit' + world], { onDone, bgColor: '#0e1a2e', sprite: 'gem' });
}

export function endingScene(app, onDone) {
  const scene = new StoryScene(app, ['ending1', 'ending2', 'ending3', 'ending4', 'the_end', 'thanks'], { onDone, sprite: 'polina_victory', bgColor: '#2a1030' });
  return scene;
}
