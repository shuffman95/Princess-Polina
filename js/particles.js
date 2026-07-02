// Lightweight pooled particle system + floating score text.
import { rand, pick } from './util.js';

const MAX = 220;

export class Particles {
  constructor() {
    this.pool = [];
    this.texts = [];
  }

  spawn(x, y, opts = {}) {
    if (this.pool.length >= MAX) this.pool.shift();
    this.pool.push({
      x, y,
      vx: opts.vx !== undefined ? opts.vx : rand(-40, 40),
      vy: opts.vy !== undefined ? opts.vy : rand(-70, -20),
      g: opts.g !== undefined ? opts.g : 220,
      life: opts.life || rand(0.3, 0.7),
      t: 0,
      size: opts.size || 2,
      color: opts.color || '#fff',
      fade: opts.fade !== false,
      shrink: !!opts.shrink
    });
  }

  burst(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(opts.minSpeed || 30, opts.maxSpeed || 110);
      this.spawn(x, y, {
        ...opts,
        vx: Math.cos(a) * sp + (opts.vx || 0),
        vy: Math.sin(a) * sp * (opts.up ? -Math.abs(Math.sin(a)) / Math.max(0.01, Math.abs(Math.sin(a))) : 1) + (opts.vy || 0),
        color: Array.isArray(opts.color) ? pick(opts.color) : opts.color
      });
    }
  }

  text(x, y, str, color = '#fff') {
    this.texts.push({ x, y, str, color, t: 0, life: 0.9 });
    if (this.texts.length > 12) this.texts.shift();
  }

  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.t += dt;
      if (p.t >= p.life) { this.pool.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const p = this.texts[i];
      p.t += dt;
      p.y -= 26 * dt;
      if (p.t >= p.life) this.texts.splice(i, 1);
    }
  }

  draw(ctx, camX, camY, drawTextFn) {
    for (const p of this.pool) {
      const k = 1 - p.t / p.life;
      ctx.globalAlpha = p.fade ? Math.min(1, k * 2) : 1;
      const s = p.shrink ? Math.max(1, Math.round(p.size * k)) : p.size;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX - s / 2), Math.round(p.y - camY - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
    for (const p of this.texts) {
      const a = p.t < 0.7 ? 1 : 1 - (p.t - 0.7) / 0.2;
      ctx.globalAlpha = Math.max(0, a);
      drawTextFn(ctx, p.str, Math.round(p.x - camX), Math.round(p.y - camY), p.color, { align: 'center' });
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.pool.length = 0; this.texts.length = 0; }
}
