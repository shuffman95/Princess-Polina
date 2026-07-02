// Unified input: keyboard, multi-touch on-screen controls, and gamepads.
// Exposes action states (held / pressed this frame) plus raw touch/tap info for menus.

import { VIEW_W, VIEW_H } from './const.js';

export const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'roll', 'pause'];

export const DEFAULT_KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ', 'KeyK'],
  attack: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyJ'],
  roll: ['KeyC', 'KeyL'],
  pause: ['Escape', 'Enter', 'KeyP']
};

class Input {
  constructor() {
    this.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
    this.held = {}; this.prev = {};
    for (const a of ACTIONS) { this.held[a] = false; this.prev[a] = false; }
    this.kbDown = new Set();
    this.kbJustDown = new Set();   // keydown events since last frame (never miss fast taps)
    this.justActions = new Set();
    this.touches = new Map();       // id -> {x, y} in canvas coords
    this.taps = [];                 // taps completed this frame: {x, y}
    this.tapDowns = [];             // touch-starts this frame: {x, y, id}
    this.anyKeyPressed = false;     // any key/tap this frame (for title screen)
    this.captureNextKey = null;     // callback for remapping
    this.usedTouchEver = false;
    this.usedKeyboardEver = false;
    this.gamepadConnected = false;
    this.gamepadJustChanged = 0;    // 1 connected, -1 disconnected, cleared after read
    this.canvas = null;
    this.scaleX = 1; this.scaleY = 1; this.offX = 0; this.offY = 0;
    // Virtual pad layout (canvas coords), recomputed by ui scale
    this.padScale = 1;
    this.showTouch = false;
    this._buildTouchLayout();
  }

  attach(canvas) {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    const opts = { passive: false };
    canvas.addEventListener('touchstart', (e) => this._onTouch(e, 'start'), opts);
    canvas.addEventListener('touchmove', (e) => this._onTouch(e, 'move'), opts);
    canvas.addEventListener('touchend', (e) => this._onTouch(e, 'end'), opts);
    canvas.addEventListener('touchcancel', (e) => this._onTouch(e, 'end'), opts);
    // Mouse fallback for desktop testing of menus
    canvas.addEventListener('mousedown', (e) => this._onMouse(e, true));
    canvas.addEventListener('mouseup', (e) => this._onMouse(e, false));
    window.addEventListener('gamepadconnected', () => { this.gamepadConnected = true; this.gamepadJustChanged = 1; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadConnected = false; this.gamepadJustChanged = -1; });
    window.addEventListener('blur', () => this._releaseAll());
  }

  setViewTransform(scaleX, scaleY, offX, offY) {
    this.scaleX = scaleX; this.scaleY = scaleY; this.offX = offX; this.offY = offY;
  }

  setPadScale(s) { this.padScale = s; this._buildTouchLayout(); }

  _buildTouchLayout() {
    const s = this.padScale;
    const bigR = Math.round(26 * s), smallR = Math.round(20 * s);
    this.btns = {
      // Left: floating dpad zone (left third of screen)
      dpadZone: { x: 0, y: VIEW_H * 0.25, w: VIEW_W * 0.42, h: VIEW_H * 0.75 },
      jump: { cx: VIEW_W - 30 * s, cy: VIEW_H - 66 * s, r: bigR, label: 'A' },
      attack: { cx: VIEW_W - 72 * s, cy: VIEW_H - 30 * s, r: bigR, label: 'B' },
      roll: { cx: VIEW_W - 27 * s, cy: VIEW_H - 130 * s, r: smallR, label: 'C' },
      pause: { cx: VIEW_W - 14, cy: 12, r: 11, label: '=' }
    };
    this.dpadState = null; // {originX, originY, touchId, dx, dy}
  }

  _canvasXY(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width * VIEW_W,
      y: (clientY - r.top) / r.height * VIEW_H
    };
  }

  _onKeyDown(e) {
    if (e.repeat) { e.preventDefault(); return; }
    this.usedKeyboardEver = true;
    if (this.captureNextKey) {
      if (e.code !== 'Escape') this.captureNextKey(e.code);
      else this.captureNextKey(null);
      this.captureNextKey = null;
      e.preventDefault();
      return;
    }
    this.kbDown.add(e.code);
    this.kbJustDown.add(e.code);
    this.anyKeyPressed = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  }

  _onKeyUp(e) { this.kbDown.delete(e.code); }

  _onMouse(e, down) {
    const p = this._canvasXY(e.clientX, e.clientY);
    if (down) { this.tapDowns.push({ x: p.x, y: p.y, id: 'mouse' }); this.anyKeyPressed = true; this._mouseHeld = p; }
    else { this.taps.push(p); this._mouseHeld = null; }
  }

  _onTouch(e, phase) {
    e.preventDefault();
    this.usedTouchEver = true;
    this.showTouch = true;
    for (const t of e.changedTouches) {
      const p = this._canvasXY(t.clientX, t.clientY);
      if (phase === 'start') {
        this.touches.set(t.identifier, { x: p.x, y: p.y, startX: p.x, startY: p.y, t: performance.now() });
        this.tapDowns.push({ x: p.x, y: p.y, id: t.identifier });
        this.anyKeyPressed = true;
      } else if (phase === 'move') {
        const rec = this.touches.get(t.identifier);
        if (rec) { rec.x = p.x; rec.y = p.y; }
      } else {
        const rec = this.touches.get(t.identifier);
        if (rec) {
          const dt = performance.now() - rec.t;
          const moved = Math.hypot(p.x - rec.startX, p.y - rec.startY);
          if (dt < 350 && moved < 14) this.taps.push({ x: p.x, y: p.y });
        }
        this.touches.delete(t.identifier);
        if (this.dpadState && this.dpadState.touchId === t.identifier) this.dpadState = null;
      }
    }
  }

  _releaseAll() {
    this.kbDown.clear();
    this.touches.clear();
    this.dpadState = null;
  }

  _keyHeld(action) {
    for (const code of this.keys[action]) if (this.kbDown.has(code)) return true;
    return false;
  }

  _pollGamepad(state) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      this.gamepadConnected = true;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (ax < -0.4 || b(14)) state.left = true;
      if (ax > 0.4 || b(15)) state.right = true;
      if (ay < -0.4 || b(12)) state.up = true;
      if (ay > 0.4 || b(13)) state.down = true;
      if (b(0)) state.jump = true;                 // A / cross
      if (b(2) || b(1)) state.attack = true;       // X / square, B / circle
      if (b(5) || b(4) || b(3)) state.roll = true; // shoulders, Y / triangle
      if (b(9)) state.pause = true;                // start
    }
  }

  _pollTouch(state) {
    if (!this.canvas) return;
    const B = this.btns;
    let dpadTouch = null;
    for (const [id, rec] of this.touches) {
      // buttons
      for (const name of ['jump', 'attack', 'roll']) {
        const btn = B[name];
        if (Math.hypot(rec.x - btn.cx, rec.y - btn.cy) <= btn.r + 8) state[name] = true;
      }
      const pz = B.dpadZone;
      if (rec.startX >= pz.x && rec.startX <= pz.x + pz.w && rec.startY >= pz.y) {
        dpadTouch = { id, rec };
      }
    }
    if (dpadTouch) {
      if (!this.dpadState || this.dpadState.touchId !== dpadTouch.id) {
        this.dpadState = { touchId: dpadTouch.id, originX: dpadTouch.rec.startX, originY: dpadTouch.rec.startY };
      }
      const ds = this.dpadState, rec = dpadTouch.rec;
      let dx = rec.x - ds.originX, dy = rec.y - ds.originY;
      // Drag re-centering: if finger drifts far, pull origin along
      const dist = Math.hypot(dx, dy), maxR = 26 * this.padScale;
      if (dist > maxR) {
        ds.originX += dx / dist * (dist - maxR);
        ds.originY += dy / dist * (dist - maxR);
        dx = rec.x - ds.originX; dy = rec.y - ds.originY;
      }
      ds.dx = dx; ds.dy = dy;
      const dead = 7 * this.padScale;
      if (dx < -dead) state.left = true;
      if (dx > dead) state.right = true;
      if (dy < -dead * 1.4) state.up = true;
      if (dy > dead * 1.4) state.down = true;
    } else {
      this.dpadState = null;
    }
  }

  // Call once per frame BEFORE game update.
  update() {
    for (const a of ACTIONS) this.prev[a] = this.held[a];
    const state = {};
    for (const a of ACTIONS) state[a] = this._keyHeld(a);
    this._pollGamepad(state);
    this._pollTouch(state);
    if (this._mouseHeld) { /* menus use taps; no held actions from mouse */ }
    for (const a of ACTIONS) this.held[a] = !!state[a];
    // record actions whose key went down since last frame, even if already released
    this.justActions.clear();
    for (const a of ACTIONS) {
      for (const code of this.keys[a]) {
        if (this.kbJustDown.has(code)) { this.justActions.add(a); break; }
      }
    }
    this.kbJustDown.clear();
  }

  // Call once per frame AFTER game update.
  postUpdate() {
    this.taps.length = 0;
    this.tapDowns.length = 0;
    this.anyKeyPressed = false;
    this.gamepadJustChanged = 0;
  }

  down(a) { return this.held[a]; }
  pressed(a) { return (this.held[a] && !this.prev[a]) || this.justActions.has(a); }
  released(a) { return !this.held[a] && this.prev[a]; }

  // For menu navigation: directional press with key-repeat feel handled by menus.
  menuPressed(a) { return this.pressed(a); }
}

export const input = new Input();
