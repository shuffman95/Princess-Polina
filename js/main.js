// Bootstrap: canvas scaling, fixed-timestep loop, lifecycle.
import { VIEW_W, VIEW_H, DT } from './const.js';
import { App } from './engine.js';
import { t, setLang } from './i18n.js';

const canvas = document.getElementById('game');
const app = new App(canvas);
window.polina = app; // console/testing handle

// Scale canvas to fill the window while keeping aspect + pixel crispness.
function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const scale = Math.min(ww / VIEW_W, wh / VIEW_H);
  // prefer integer scaling when close, for crisp pixels
  const intScale = Math.max(1, Math.floor(scale));
  const useScale = (scale - intScale) < 0.22 ? intScale : scale;
  canvas.style.width = Math.round(VIEW_W * useScale) + 'px';
  canvas.style.height = Math.round(VIEW_H * useScale) + 'px';
  const rotateText = document.getElementById('rotate-text');
  if (rotateText) rotateText.textContent = t('rotate');
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 60));
resize();

// Fixed-timestep loop with accumulator (60 Hz logic, rAF render).
let last = performance.now();
let acc = 0;
let running = true;

function frame(now) {
  requestAnimationFrame(frame);
  if (!running) { last = now; return; }
  let ft = now - last;
  last = now;
  app.tickFps(ft);
  if (ft > 250) ft = 250; // avoid spiral of death after tab-away
  acc += ft / 1000;
  let steps = 0;
  while (acc >= DT && steps < 5) {
    app.update(DT);
    acc -= DT;
    steps++;
  }
  if (steps === 5) acc = 0;
  app.draw();
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (!document.hidden) last = performance.now();
});
