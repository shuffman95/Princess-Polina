// Camera with look-ahead, vertical platform snapping, and screen shake.
import { VIEW_W, VIEW_H, TILE } from './const.js';
import { clamp, lerp } from './util.js';

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
    this.shakeT = 0; this.shakeMag = 0;
    this.lookX = 0;
    this.enabled = true;
    this.shakeEnabled = true;
  }

  reset(px, py, levelW, levelH) {
    this.levelW = levelW * TILE;
    this.levelH = levelH * TILE;
    this.x = clamp(px - VIEW_W / 2, 0, Math.max(0, this.levelW - VIEW_W));
    this.y = clamp(py - VIEW_H * 0.6, 0, Math.max(0, this.levelH - VIEW_H));
    this.lookX = 0;
    this.shakeT = 0;
  }

  shake(mag = 4, dur = 0.25) {
    if (!this.shakeEnabled) return;
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, dur);
  }

  update(dt, player) {
    // Horizontal: ease toward player + look-ahead in facing/velocity direction
    const targetLook = clamp(player.vx * 0.28, -44, 44);
    this.lookX = lerp(this.lookX, targetLook, 1 - Math.pow(0.001, dt));
    const tx = clamp(player.x + player.w / 2 + this.lookX - VIEW_W / 2, 0, Math.max(0, this.levelW - VIEW_W));
    this.x = lerp(this.x, tx, 1 - Math.pow(0.000001, dt));

    // Vertical: keep player in a comfortable band; follow faster when falling
    const py = player.y + player.h / 2;
    const bandTop = this.y + VIEW_H * 0.32;
    const bandBot = this.y + VIEW_H * 0.62;
    let ty = this.y;
    if (py < bandTop) ty = py - VIEW_H * 0.32;
    else if (py > bandBot) ty = py - VIEW_H * 0.62;
    const vertRate = player.vy > 140 ? 0.000001 : 0.0001;
    this.y = lerp(this.y, clamp(ty, 0, Math.max(0, this.levelH - VIEW_H)), 1 - Math.pow(vertRate, dt));

    if (this.shakeT > 0) this.shakeT -= dt;
  }

  renderOffset() {
    let sx = 0, sy = 0;
    if (this.shakeT > 0 && this.shakeEnabled) {
      sx = (Math.random() * 2 - 1) * this.shakeMag;
      sy = (Math.random() * 2 - 1) * this.shakeMag;
    }
    return { x: Math.round(this.x + sx), y: Math.round(this.y + sy) };
  }
}
