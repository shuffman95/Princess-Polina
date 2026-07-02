// On-screen touch controls + screen transitions.
import { VIEW_W, VIEW_H } from './const.js';
import { clamp, easeInOutQuad } from './util.js';
import { drawText } from './font.js';

export function drawTouchControls(ctx, input, inGame, showRoll = true) {
  if (!input.showTouch) return;
  const B = input.btns;
  ctx.save();

  // floating dpad: show at touch origin while active, faint hint otherwise
  if (input.dpadState) {
    const ds = input.dpadState;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff6ec';
    ctx.beginPath(); ctx.arc(ds.originX, ds.originY, 22 * input.padScale, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#fff6ec';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ds.originX, ds.originY, 22 * input.padScale, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(ds.originX + clamp(ds.dx || 0, -20, 20), ds.originY + clamp(ds.dy || 0, -20, 20), 11 * input.padScale, 0, 7);
    ctx.fill();
  } else if (inGame) {
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#fff6ec';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(52, VIEW_H - 56, 20 * input.padScale, 0, 7); ctx.stroke();
    drawText(ctx, '←', 40, VIEW_H - 59, '#fff6ec');
    drawText(ctx, '→', 58, VIEW_H - 59, '#fff6ec');
  }

  if (inGame) {
    for (const name of ['jump', 'attack', 'roll']) {
      if (name === 'roll' && !showRoll) continue; // hidden until an ability uses it
      const b = B[name];
      const active = input.down(name);
      ctx.globalAlpha = active ? 0.5 : 0.2;
      ctx.fillStyle = active ? '#ffd042' : '#fff6ec';
      ctx.beginPath(); ctx.arc(b.cx, b.cy, b.r, 0, 7); ctx.fill();
      ctx.globalAlpha = active ? 0.9 : 0.45;
      drawText(ctx, b.label, b.cx, b.cy - 3, '#181624', { align: 'center' });
    }
    // pause button
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff6ec';
    ctx.fillRect(B.pause.cx - 6, B.pause.cy - 4, 3, 8);
    ctx.fillRect(B.pause.cx - 1, B.pause.cy - 4, 3, 8);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Fade/iris transition between screens.
export class Transition {
  constructor() {
    this.mode = null;  // 'out' | 'in'
    this.t = 0;
    this.dur = 0.45;
    this.onMid = null;
  }
  start(onMid, dur = 0.45) {
    this.mode = 'out';
    this.t = 0;
    this.dur = dur;
    this.onMid = onMid;
  }
  get active() { return this.mode !== null; }
  update(dt) {
    if (!this.mode) return;
    this.t += dt;
    if (this.mode === 'out' && this.t >= this.dur) {
      this.mode = 'in';
      this.t = 0;
      if (this.onMid) { const f = this.onMid; this.onMid = null; f(); }
    } else if (this.mode === 'in' && this.t >= this.dur) {
      this.mode = null;
    }
  }
  draw(ctx, focusX = VIEW_W / 2, focusY = VIEW_H / 2) {
    if (!this.mode) return;
    const k = easeInOutQuad(clamp(this.t / this.dur, 0, 1));
    const r = this.mode === 'out' ? (1 - k) : k;
    const maxR = Math.hypot(VIEW_W, VIEW_H) * 0.62;
    // iris wipe
    ctx.save();
    ctx.fillStyle = '#0a0616';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.arc(focusX, focusY, Math.max(0.01, r * maxR), 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }
}
