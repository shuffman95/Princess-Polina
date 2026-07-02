// Original synthesized sound effects. Each is a tiny procedural recipe.
import { audioCtx, pulse, triangle, noise, sweep, noteFreq } from './audio.js';

function now() { const c = audioCtx(); return c ? c.currentTime : 0; }
function ready() { const c = audioCtx(); return c && c.state === 'running'; }

export const sfx = {
  jump() {
    if (!ready()) return;
    sweep(300, 620, now(), 0.13, { type: 'square', vol: 0.10 });
  },
  doubleJump() {
    if (!ready()) return;
    sweep(420, 860, now(), 0.12, { type: 'square', vol: 0.09 });
    sweep(630, 1290, now() + 0.03, 0.10, { type: 'square', vol: 0.05 });
  },
  wallJump() {
    if (!ready()) return;
    noise(now(), 0.06, { vol: 0.10, hp: 1200, lp: 4000 });
    sweep(350, 700, now() + 0.01, 0.11, { type: 'square', vol: 0.08 });
  },
  land() {
    if (!ready()) return;
    noise(now(), 0.07, { vol: 0.08, hp: 60, lp: 300 });
  },
  stomp() {
    if (!ready()) return;
    sweep(700, 120, now(), 0.12, { type: 'square', vol: 0.13 });
    noise(now(), 0.09, { vol: 0.11, hp: 200, lp: 900 });
  },
  coin() {
    if (!ready()) return;
    const t = now();
    pulse(noteFreq('b5'), t, 0.06, { duty: 50, vol: 0.10 });
    pulse(noteFreq('e6'), t + 0.06, 0.16, { duty: 50, vol: 0.10 });
  },
  gem() {
    if (!ready()) return;
    const t = now();
    ['e5', 'g5', 'b5', 'e6', 'g6'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.07, 0.14, { duty: 25, vol: 0.10 }));
  },
  powerup() {
    if (!ready()) return;
    const t = now();
    ['c5', 'e5', 'g5', 'c6', 'e6', 'g6'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.055, 0.10, { duty: 50, vol: 0.10 }));
  },
  powerdown() {
    if (!ready()) return;
    const t = now();
    ['g5', 'e5', 'c5', 'g4'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.07, 0.10, { duty: 25, vol: 0.10 }));
  },
  oneUp() {
    if (!ready()) return;
    const t = now();
    ['e5', 'g5', 'e6', 'c6', 'd6', 'g6'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.09, 0.12, { duty: 50, vol: 0.11 }));
  },
  hurt() {
    if (!ready()) return;
    sweep(400, 90, now(), 0.25, { type: 'sawtooth', vol: 0.12 });
  },
  die() {
    if (!ready()) return;
    // Polina's signature farewell: a startled hop up, then a tumbling lament.
    const t = now();
    const flick = [['g5', 0, 0.07], ['b5', 0.07, 0.1]];
    const lament = [
      ['e5', 0.3, 0.13], ['c5', 0.44, 0.13], ['a4', 0.58, 0.13],
      ['f4', 0.72, 0.2], ['g4', 0.95, 0.11], ['e4', 1.07, 0.42]
    ];
    for (const [n, dt, dur] of flick) pulse(noteFreq(n), t + dt, dur, { duty: 50, vol: 0.13 });
    for (const [n, dt, dur] of lament) {
      pulse(noteFreq(n), t + dt, dur, { duty: 50, vol: 0.12 });
      // soft echo voice an octave down, slightly behind
      pulse(noteFreq(n) / 2, t + dt + 0.03, dur, { duty: 25, vol: 0.05 });
    }
    triangle(noteFreq('a2'), t + 0.3, 0.4, { vol: 0.16 });
    triangle(noteFreq('e2'), t + 0.72, 0.35, { vol: 0.16 });
    triangle(noteFreq('a1'), t + 1.07, 0.55, { vol: 0.18 });
    noise(t + 1.45, 0.25, { vol: 0.1, hp: 50, lp: 300 });
  },
  fireball() {
    if (!ready()) return;
    noise(now(), 0.09, { vol: 0.09, hp: 900, lp: 3500 });
    sweep(900, 300, now(), 0.09, { type: 'square', vol: 0.06 });
  },
  iceShot() {
    if (!ready()) return;
    sweep(1400, 2400, now(), 0.08, { type: 'triangle', vol: 0.11 });
    pulse(noteFreq('a6'), now() + 0.05, 0.07, { duty: 125, vol: 0.06 });
  },
  freeze() {
    if (!ready()) return;
    const t = now();
    ['e6', 'c6', 'a5', 'e5'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.04, 0.08, { duty: 125, vol: 0.08 }));
  },
  bump() {
    if (!ready()) return;
    sweep(220, 130, now(), 0.08, { type: 'square', vol: 0.10 });
  },
  breakBlock() {
    if (!ready()) return;
    noise(now(), 0.16, { vol: 0.13, hp: 400, lp: 2500 });
    sweep(500, 150, now(), 0.1, { type: 'square', vol: 0.07 });
  },
  pound() {
    if (!ready()) return;
    sweep(300, 50, now(), 0.18, { type: 'square', vol: 0.15 });
    noise(now() + 0.02, 0.15, { vol: 0.15, hp: 50, lp: 400 });
  },
  dash() {
    if (!ready()) return;
    noise(now(), 0.11, { vol: 0.09, hp: 2000, lp: 7000 });
    sweep(500, 1100, now(), 0.10, { type: 'square', vol: 0.05 });
  },
  roll() {
    if (!ready()) return;
    noise(now(), 0.08, { vol: 0.06, hp: 500, lp: 2000 });
  },
  splash() {
    if (!ready()) return;
    noise(now(), 0.22, { vol: 0.11, hp: 1200, lp: 5200 });
    sweep(500, 150, now(), 0.15, { type: 'sine', vol: 0.07 });
  },
  swim() {
    if (!ready()) return;
    noise(now(), 0.1, { vol: 0.05, hp: 900, lp: 3200 });
    sweep(240, 420, now(), 0.09, { type: 'sine', vol: 0.05 });
  },
  checkpoint() {
    if (!ready()) return;
    const t = now();
    ['g5', 'c6', 'e6'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.08, 0.14, { duty: 50, vol: 0.10 }));
  },
  door() {
    if (!ready()) return;
    sweep(180, 420, now(), 0.22, { type: 'triangle', vol: 0.11 });
  },
  shoot() {
    if (!ready()) return;
    sweep(1000, 350, now(), 0.09, { type: 'square', vol: 0.07 });
  },
  bossRoar() {
    if (!ready()) return;
    const t = now();
    sweep(160, 55, t, 0.55, { type: 'sawtooth', vol: 0.17 });
    noise(t, 0.5, { vol: 0.13, hp: 80, lp: 700 });
  },
  bossHit() {
    if (!ready()) return;
    sweep(500, 100, now(), 0.2, { type: 'sawtooth', vol: 0.13 });
    noise(now(), 0.12, { vol: 0.10, hp: 300, lp: 1500 });
  },
  bossDie() {
    if (!ready()) return;
    const t = now();
    for (let i = 0; i < 6; i++) {
      noise(t + i * 0.13, 0.14, { vol: 0.13, hp: 100, lp: 1000 });
      sweep(400 - i * 40, 60, t + i * 0.13, 0.12, { type: 'square', vol: 0.09 });
    }
    ['c5', 'e5', 'g5', 'c6'].forEach((n, i) => pulse(noteFreq(n), t + 0.8 + i * 0.09, 0.13, { duty: 50, vol: 0.11 }));
  },
  menuMove() {
    if (!ready()) return;
    pulse(noteFreq('c6'), now(), 0.045, { duty: 25, vol: 0.06 });
  },
  menuSelect() {
    if (!ready()) return;
    const t = now();
    pulse(noteFreq('c6'), t, 0.05, { duty: 50, vol: 0.08 });
    pulse(noteFreq('g6'), t + 0.05, 0.09, { duty: 50, vol: 0.08 });
  },
  menuBack() {
    if (!ready()) return;
    const t = now();
    pulse(noteFreq('g5'), t, 0.05, { duty: 50, vol: 0.07 });
    pulse(noteFreq('c5'), t + 0.05, 0.08, { duty: 50, vol: 0.07 });
  },
  pause() {
    if (!ready()) return;
    const t = now();
    pulse(noteFreq('e6'), t, 0.06, { duty: 25, vol: 0.08 });
    pulse(noteFreq('b5'), t + 0.07, 0.06, { duty: 25, vol: 0.08 });
  },
  textBlip() {
    if (!ready()) return;
    pulse(noteFreq('e5'), now(), 0.03, { duty: 25, vol: 0.04 });
  },
  cheat() {
    if (!ready()) return;
    const t = now();
    ['c6', 'c5', 'c6', 'c5'].forEach((n, i) => pulse(noteFreq(n), t + i * 0.05, 0.05, { duty: 125, vol: 0.08 }));
  },
  // Jingles (scheduled sequences; caller stops music first)
  levelClear() {
    if (!ready()) return;
    const t = now();
    const mel = [['g4', 0, 0.11], ['c5', 0.11, 0.11], ['e5', 0.22, 0.11], ['g5', 0.33, 0.11], ['c6', 0.44, 0.11], ['e6', 0.55, 0.3],
      ['d6', 0.9, 0.11], ['e6', 1.01, 0.11], ['f6', 1.12, 0.5]];
    for (const [n, dt, dur] of mel) pulse(noteFreq(n), t + dt, dur, { duty: 50, vol: 0.11 });
    triangle(noteFreq('c3'), t, 0.4, { vol: 0.16 });
    triangle(noteFreq('g2'), t + 0.44, 0.4, { vol: 0.16 });
    triangle(noteFreq('f2'), t + 0.9, 0.7, { vol: 0.16 });
  },
  gameOver() {
    if (!ready()) return;
    const t = now();
    const mel = [['e5', 0, 0.22], ['c5', 0.25, 0.22], ['a4', 0.5, 0.22], ['f4', 0.75, 0.3], ['g4', 1.1, 0.18], ['e4', 1.3, 0.6]];
    for (const [n, dt, dur] of mel) pulse(noteFreq(n), t + dt, dur, { duty: 25, vol: 0.11 });
    triangle(noteFreq('a1'), t + 1.3, 0.8, { vol: 0.18 });
  },
  worldClear() {
    if (!ready()) return;
    const t = now();
    const mel = [['c5', 0, 0.1], ['e5', 0.1, 0.1], ['g5', 0.2, 0.1], ['c6', 0.3, 0.22],
      ['g5', 0.55, 0.1], ['c6', 0.65, 0.35], ['e6', 1.05, 0.5]];
    for (const [n, dt, dur] of mel) pulse(noteFreq(n), t + dt, dur, { duty: 50, vol: 0.11 });
    for (const [n, dt, dur] of mel) pulse(noteFreq(n) / 2, t + dt + 0.02, dur, { duty: 25, vol: 0.06 });
    triangle(noteFreq('c2'), t, 0.5, { vol: 0.17 });
    triangle(noteFreq('g2'), t + 0.55, 0.4, { vol: 0.17 });
    triangle(noteFreq('c3'), t + 1.05, 0.6, { vol: 0.17 });
  }
};
