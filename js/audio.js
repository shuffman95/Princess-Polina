// Chiptune audio engine: 2 pulse channels, triangle bass, noise drums.
// All music and sound is synthesized — every note is original data in music.js/sfx.js.

let ctx = null;
let masterGain, musicGain, sfxGain;
let dutyWaves = {};
let noiseBuffer = null;
let unlocked = false;

const NOTE_RE = /^([a-g])([#b]?)(\d)$/;
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

export function noteFreq(name) {
  const m = NOTE_RE.exec(name.toLowerCase());
  if (!m) return 0;
  let s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const oct = parseInt(m[3], 10);
  const midi = (oct + 1) * 12 + s;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeDutyWave(duty) {
  const n = 32;
  const real = new Float32Array(n), imag = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    // Fourier series of a pulse wave with given duty cycle
    real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    imag[i] = 0;
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.connect(masterGain);
  sfxGain = ctx.createGain();
  sfxGain.connect(masterGain);
  dutyWaves = { 125: makeDutyWave(0.125), 25: makeDutyWave(0.25), 50: makeDutyWave(0.5) };
  // 1s of white noise, reused by all noise voices
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume();
});

export function unlockAudio() {
  initAudio();
  if (!ctx) return;
  // WebKit reports 'interrupted' after calls/Siri/alarms; resume from any non-running state.
  if (ctx.state !== 'running') ctx.resume();
  if (!unlocked) {
    // iOS unlock: play a silent buffer inside the user gesture
    const b = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = b; src.connect(ctx.destination); src.start(0);
    unlocked = true;
  }
}

export function setMusicVolume(v) { if (musicGain) musicGain.gain.value = v * v; }
export function setSfxVolume(v) { if (sfxGain) sfxGain.gain.value = v * v; }
export function audioCtx() { return ctx; }
export function audioReady() { return !!ctx && ctx.state === 'running'; }

// ---------------------------------------------------------------------------
// Voice helpers (used by sequencer and SFX)
// ---------------------------------------------------------------------------

export function pulse(freq, time, dur, { duty = 50, vol = 0.16, dest = null, slide = 0, vib = 0 } = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(dutyWaves[duty] || dutyWaves[50]);
  osc.frequency.setValueAtTime(freq, time);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), time + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.004);
  g.gain.setValueAtTime(vol, time + Math.max(0.004, dur - 0.02));
  g.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(g); g.connect(dest || sfxGain);
  if (vib) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 6; lg.gain.value = vib;
    lfo.connect(lg); lg.connect(osc.frequency);
    lfo.start(time); lfo.stop(time + dur);
  }
  osc.start(time); osc.stop(time + dur + 0.01);
  return osc;
}

export function triangle(freq, time, dur, { vol = 0.22, dest = null } = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.005);
  g.gain.setValueAtTime(vol, time + Math.max(0.005, dur - 0.02));
  g.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(g); g.connect(dest || sfxGain);
  osc.start(time); osc.stop(time + dur + 0.01);
}

export function noise(time, dur, { vol = 0.14, hp = 0, lp = 8000, dest = null, decay = true } = {}) {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  src.playbackRate.value = 1;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = (hp + lp) / 2;
  f.Q.value = 0.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, time);
  if (decay) g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  else { g.gain.setValueAtTime(vol, time + dur - 0.01); g.gain.linearRampToValueAtTime(0, time + dur); }
  src.connect(f); f.connect(g); g.connect(dest || sfxGain);
  src.start(time); src.stop(time + dur + 0.02);
}

export function sweep(f0, f1, time, dur, { type = 'square', vol = 0.15, dest = null } = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, f0), time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), time + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(g); g.connect(dest || sfxGain);
  osc.start(time); osc.stop(time + dur + 0.01);
}

// ---------------------------------------------------------------------------
// Music sequencer
// ---------------------------------------------------------------------------
// Track format (music.js): { bpm, sig, p1, p2, tri, noise, p1duty, p2duty }
// Channel data: array of "note:steps" tokens; 'r:steps' = rest. 1 step = a 16th.

function parseChannel(tokens) {
  const out = [];
  for (const tk of tokens.join(' ').split(/\s+/)) {
    if (!tk) continue;
    const [n, d] = tk.split(':');
    out.push({ note: n, steps: parseInt(d || '1', 10) });
  }
  return out;
}

class Sequencer {
  constructor() {
    this.track = null;
    this.trackId = null;
    this.playing = false;
    this.stepTime = 0;
    this.nextTime = 0;
    this.pos = { p1: 0, p2: 0, tri: 0, noise: 0 };
    this.stepsElapsed = { p1: 0, p2: 0, tri: 0, noise: 0 };
    this.timer = null;
    this.parsed = null;
    this.trackGain = null;
    this.speed = 1;
  }

  play(track, id) {
    if (!ctx) return;
    if (this.trackId === id && this.playing) return;
    this.stopNow(0.35);
    this.track = track;
    this.trackId = id;
    this.parsed = {
      p1: track.p1 ? parseChannel(track.p1) : null,
      p2: track.p2 ? parseChannel(track.p2) : null,
      tri: track.tri ? parseChannel(track.tri) : null,
      noise: track.noise ? parseChannel(track.noise) : null
    };
    this.pos = { p1: 0, p2: 0, tri: 0, noise: 0 };
    this.stepTime = 60 / track.bpm / 4;
    this.trackGain = ctx.createGain();
    this.trackGain.gain.setValueAtTime(0, ctx.currentTime);
    this.trackGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.25);
    this.trackGain.connect(musicGain);
    this.nextChanTime = { p1: ctx.currentTime + 0.08, p2: ctx.currentTime + 0.08, tri: ctx.currentTime + 0.08, noise: ctx.currentTime + 0.08 };
    this.playing = true;
    if (!this.timer) this.timer = setInterval(() => this._tick(), 40);
  }

  stopNow(fade = 0.2) {
    if (this.trackGain && ctx) {
      const g = this.trackGain;
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
      setTimeout(() => { try { g.disconnect(); } catch (e) { /* already gone */ } }, fade * 1000 + 60);
    }
    this.playing = false;
    this.trackId = null;
    this.trackGain = null;
  }

  setSpeed(s) { this.speed = s; }

  _scheduleChan(chan, until) {
    const data = this.parsed[chan];
    if (!data || !data.length) return;
    const tr = this.track;
    while (this.nextChanTime[chan] < until) {
      const ev = data[this.pos[chan] % data.length];
      const t = this.nextChanTime[chan];
      const dur = ev.steps * this.stepTime / this.speed;
      if (ev.note !== 'r') {
        if (chan === 'noise') {
          const kind = ev.note;
          if (kind === 'k') noise(t, Math.min(dur, 0.11), { vol: 0.20, hp: 40, lp: 200, dest: this.trackGain });
          else if (kind === 's') noise(t, Math.min(dur, 0.13), { vol: 0.13, hp: 700, lp: 2600, dest: this.trackGain });
          else if (kind === 'h') noise(t, Math.min(dur, 0.05), { vol: 0.05, hp: 5000, lp: 9000, dest: this.trackGain });
          else if (kind === 'o') noise(t, Math.min(dur, 0.22), { vol: 0.06, hp: 4500, lp: 9000, dest: this.trackGain });
        } else {
          const f = noteFreq(ev.note);
          if (f > 0) {
            if (chan === 'tri') triangle(f, t, dur * 0.94, { vol: 0.20, dest: this.trackGain });
            else pulse(f, t, dur * 0.90, {
              duty: chan === 'p1' ? (tr.p1duty || 50) : (tr.p2duty || 25),
              vol: chan === 'p1' ? 0.115 : 0.075,
              dest: this.trackGain,
              vib: dur > 0.30 ? 3 : 0
            });
          }
        }
      }
      this.nextChanTime[chan] += dur;
      this.pos[chan]++;
    }
  }

  _tick() {
    if (!this.playing || !ctx) return;
    const until = ctx.currentTime + 0.18;
    for (const c of ['p1', 'p2', 'tri', 'noise']) this._scheduleChan(c, until);
  }
}

export const sequencer = new Sequencer();

let currentMusicId = null;
export function playMusic(track, id) {
  if (!ctx || !track) return;
  currentMusicId = id;
  sequencer.play(track, id);
}
export function stopMusic(fade = 0.3) { currentMusicId = null; sequencer.stopNow(fade); }
export function currentMusic() { return currentMusicId; }
