// Layered parallax backgrounds — procedurally drawn, horizontally tileable.
import { VIEW_W, VIEW_H } from './const.js';
import { makeCanvas, mulberry32 } from './util.js';
import { THEMES } from './tiles.js';

const cache = new Map();
const LW = 512; // layer tile width

function skyCanvas(th, world) {
  const c = makeCanvas(VIEW_W, VIEW_H);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(1, th.sky[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, VIEW_W, VIEW_H);
  const rng = mulberry32(world * 77 + 5);
  if (world === 3 || world === 7) {
    // stars / motes
    for (let i = 0; i < 40; i++) {
      x.fillStyle = i % 3 ? 'rgba(255,255,255,0.5)' : 'rgba(180,200,255,0.8)';
      x.fillRect((rng() * VIEW_W) | 0, (rng() * VIEW_H * 0.7) | 0, 1, 1);
    }
  }
  if (world === 9) {
    // ash embers sky glow
    for (let i = 0; i < 24; i++) {
      x.fillStyle = 'rgba(255,120,60,0.35)';
      x.fillRect((rng() * VIEW_W) | 0, (rng() * VIEW_H) | 0, 1, 1);
    }
  }
  if (world === 1 || world === 6) {
    // sun
    x.fillStyle = 'rgba(255,240,180,0.9)';
    x.beginPath(); x.arc(360, 42, 14, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,240,180,0.35)';
    x.beginPath(); x.arc(360, 42, 20, 0, 7); x.fill();
  }
  if (world === 5) {
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.beginPath(); x.arc(70, 50, 11, 0, 7); x.fill();
  }
  if (world === 7) {
    // pale moon
    x.fillStyle = '#d8d8ea';
    x.beginPath(); x.arc(350, 46, 16, 0, 7); x.fill();
    x.fillStyle = th.sky[0];
    x.beginPath(); x.arc(343, 42, 13, 0, 7); x.fill();
  }
  return c;
}

// Far layer: silhouettes on the horizon.
function farCanvas(th, world) {
  const c = makeCanvas(LW, VIEW_H);
  const x = c.getContext('2d');
  const rng = mulberry32(world * 31 + 9);
  const col = th.hills[1];
  x.fillStyle = col;
  switch (world) {
    case 1: case 2: { // rolling hills
      for (let i = 0; i < 5; i++) {
        const cx = i * 110 + rng() * 40, r = 60 + rng() * 50;
        x.beginPath(); x.arc(cx, VIEW_H + 30, r, 0, 7); x.fill();
      }
      break;
    }
    case 3: { // stalagmite silhouettes and stalactites
      for (let i = 0; i < 9; i++) {
        const bx = i * 58 + rng() * 30, w = 18 + rng() * 20, h = 60 + rng() * 90;
        x.beginPath(); x.moveTo(bx, VIEW_H); x.lineTo(bx + w / 2, VIEW_H - h); x.lineTo(bx + w, VIEW_H); x.fill();
      }
      for (let i = 0; i < 8; i++) {
        const bx = i * 66 + rng() * 30, w = 14 + rng() * 18, h = 40 + rng() * 60;
        x.beginPath(); x.moveTo(bx, 0); x.lineTo(bx + w / 2, h); x.lineTo(bx + w, 0); x.fill();
      }
      break;
    }
    case 4: { // dunes
      for (let i = 0; i < 4; i++) {
        const cx = i * 140 + rng() * 50, r = 90 + rng() * 60;
        x.beginPath(); x.arc(cx, VIEW_H + 55, r, 0, 7); x.fill();
      }
      // pyramid-ish ziggurat silhouette
      x.fillRect(300, 170, 90, 70); x.fillRect(315, 150, 60, 20); x.fillRect(330, 134, 30, 16);
      break;
    }
    case 5: { // jagged peaks
      for (let i = 0; i < 6; i++) {
        const bx = i * 90 + rng() * 40, w = 90 + rng() * 40, h = 90 + rng() * 70;
        x.beginPath(); x.moveTo(bx, VIEW_H); x.lineTo(bx + w / 2, VIEW_H - h); x.lineTo(bx + w, VIEW_H); x.fill();
        x.fillStyle = '#ffffff';
        x.beginPath(); x.moveTo(bx + w / 2 - 12, VIEW_H - h + 24); x.lineTo(bx + w / 2, VIEW_H - h); x.lineTo(bx + w / 2 + 12, VIEW_H - h + 24); x.fill();
        x.fillStyle = col;
      }
      break;
    }
    case 6: { // distant cloud banks
      x.fillStyle = th.hills[1];
      for (let i = 0; i < 6; i++) {
        const bx = i * 90 + rng() * 40, by = 120 + rng() * 90;
        x.beginPath(); x.arc(bx, by, 22, 0, 7); x.arc(bx + 22, by + 4, 16, 0, 7); x.arc(bx - 20, by + 6, 14, 0, 7); x.fill();
      }
      break;
    }
    case 7: { // ruined towers and fences
      for (let i = 0; i < 5; i++) {
        const bx = i * 100 + rng() * 40, w = 26 + rng() * 16, h = 80 + rng() * 70;
        x.fillRect(bx, VIEW_H - h, w, h);
        for (let mx = bx; mx < bx + w - 4; mx += 8) x.fillRect(mx, VIEW_H - h - 6, 5, 6);
      }
      break;
    }
    case 8: { // smokestacks and gears
      for (let i = 0; i < 6; i++) {
        const bx = i * 84 + rng() * 30, w = 20 + rng() * 20, h = 70 + rng() * 90;
        x.fillRect(bx, VIEW_H - h, w, h);
        x.fillRect(bx - 3, VIEW_H - h, w + 6, 7);
      }
      break;
    }
    case 9: { // volcano ridge
      for (let i = 0; i < 4; i++) {
        const bx = i * 130 + rng() * 40, w = 140, h = 110 + rng() * 60;
        x.beginPath(); x.moveTo(bx, VIEW_H); x.lineTo(bx + w * 0.4, VIEW_H - h); x.lineTo(bx + w * 0.6, VIEW_H - h); x.lineTo(bx + w, VIEW_H); x.fill();
        x.fillStyle = '#ff5020';
        x.fillRect(bx + w * 0.44, VIEW_H - h - 3, w * 0.12, 3);
        x.fillStyle = col;
      }
      break;
    }
  }
  return c;
}

// Near layer: bolder shapes that scroll faster.
function nearCanvas(th, world) {
  const c = makeCanvas(LW, VIEW_H);
  const x = c.getContext('2d');
  const rng = mulberry32(world * 53 + 3);
  const col = th.hills[0];
  x.fillStyle = col;
  switch (world) {
    case 1: { // bushes and small trees
      for (let i = 0; i < 6; i++) {
        const bx = i * 86 + rng() * 40, by = VIEW_H - 20;
        x.beginPath(); x.arc(bx, by, 16 + rng() * 8, 0, 7); x.fill();
      }
      for (let i = 0; i < 3; i++) {
        const bx = 60 + i * 170 + rng() * 40;
        x.fillStyle = '#7d5028'; x.fillRect(bx - 3, VIEW_H - 66, 6, 40);
        x.fillStyle = col;
        x.beginPath(); x.arc(bx, VIEW_H - 72, 22, 0, 7); x.fill();
        x.fillStyle = '#ff9ac0';
        for (let j = 0; j < 6; j++) x.fillRect(bx - 18 + rng() * 36, VIEW_H - 88 + rng() * 28, 2, 2);
        x.fillStyle = col;
      }
      break;
    }
    case 2: { // giant trunks
      for (let i = 0; i < 5; i++) {
        const bx = i * 100 + rng() * 46, w = 22 + rng() * 14;
        x.fillStyle = '#2a4a34';
        x.fillRect(bx, 0, w, VIEW_H);
        x.fillStyle = '#1d3a28';
        x.fillRect(bx + w - 5, 0, 5, VIEW_H);
        x.fillRect(bx, 30 + rng() * 60, w, 4);
        x.fillRect(bx, 120 + rng() * 60, w, 4);
      }
      break;
    }
    case 3: { // crystal clusters
      for (let i = 0; i < 8; i++) {
        const bx = i * 66 + rng() * 30, by = VIEW_H - 8, h = 26 + rng() * 40;
        x.fillStyle = i % 2 ? '#4a5aa0' : '#5a4a90';
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + 8, by - h); x.lineTo(bx + 16, by); x.fill();
        x.fillStyle = 'rgba(160,220,255,0.5)';
        x.beginPath(); x.moveTo(bx + 6, by); x.lineTo(bx + 8, by - h + 6); x.lineTo(bx + 10, by); x.fill();
      }
      break;
    }
    case 4: { // cacti and bones
      for (let i = 0; i < 5; i++) {
        const bx = i * 100 + rng() * 50, by = VIEW_H - 14;
        x.fillStyle = '#7da03a';
        x.fillRect(bx, by - 30, 8, 30);
        x.fillRect(bx - 8, by - 22, 8, 5); x.fillRect(bx - 8, by - 22, 4, 12);
        x.fillRect(bx + 8, by - 16, 8, 5); x.fillRect(bx + 12, by - 16, 4, 9);
      }
      break;
    }
    case 5: { // snow drifts and pines
      for (let i = 0; i < 6; i++) {
        const bx = i * 88 + rng() * 30, by = VIEW_H;
        x.fillStyle = '#dfeeff';
        x.beginPath(); x.arc(bx, by + 8, 26, 0, 7); x.fill();
      }
      for (let i = 0; i < 4; i++) {
        const bx = 40 + i * 130 + rng() * 40, by = VIEW_H - 16;
        x.fillStyle = '#3a6a5a';
        for (let t = 0; t < 3; t++) {
          const w = 26 - t * 7, h = 14;
          x.beginPath(); x.moveTo(bx - w / 2, by - t * 11); x.lineTo(bx, by - t * 11 - h); x.lineTo(bx + w / 2, by - t * 11); x.fill();
        }
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.fillRect(bx - 8, by - 26, 16, 2);
      }
      break;
    }
    case 6: { // nearby puffy clouds
      for (let i = 0; i < 5; i++) {
        const bx = i * 104 + rng() * 40, by = 150 + rng() * 70;
        x.fillStyle = '#ffffff';
        x.beginPath(); x.arc(bx, by, 18, 0, 7); x.arc(bx + 18, by + 3, 13, 0, 7); x.arc(bx - 17, by + 5, 12, 0, 7); x.fill();
        x.fillStyle = '#dfe8ff';
        x.fillRect(bx - 26, by + 9, 52, 4);
      }
      break;
    }
    case 7: { // crooked gravestones and dead trees
      for (let i = 0; i < 6; i++) {
        const bx = i * 84 + rng() * 40, by = VIEW_H - 10;
        x.fillStyle = '#3e3450';
        x.fillRect(bx, by - 18, 12, 18);
        x.beginPath(); x.arc(bx + 6, by - 18, 6, Math.PI, 0); x.fill();
      }
      for (let i = 0; i < 3; i++) {
        const bx = 50 + i * 170 + rng() * 30, by = VIEW_H - 8;
        x.strokeStyle = '#2a2038'; x.lineWidth = 4;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx, by - 44); x.stroke();
        x.lineWidth = 2;
        x.beginPath(); x.moveTo(bx, by - 30); x.lineTo(bx - 14, by - 46); x.stroke();
        x.beginPath(); x.moveTo(bx, by - 38); x.lineTo(bx + 13, by - 52); x.stroke();
      }
      break;
    }
    case 8: { // pipes and machinery
      x.fillStyle = '#463a30';
      for (let i = 0; i < 4; i++) {
        const by = 60 + i * 46 + rng() * 10;
        x.fillRect(0, by, LW, 8);
        for (let j = 0; j < 6; j++) x.fillRect(j * 90 + rng() * 30, by - 4, 6, 16);
      }
      break;
    }
    case 9: { // dragon spires and chains
      for (let i = 0; i < 5; i++) {
        const bx = i * 100 + rng() * 40, w = 18, h = 90 + rng() * 70;
        x.fillStyle = '#3e1418';
        x.fillRect(bx, VIEW_H - h, w, h);
        x.beginPath(); x.moveTo(bx - 6, VIEW_H - h); x.lineTo(bx + w / 2, VIEW_H - h - 22); x.lineTo(bx + w + 6, VIEW_H - h); x.fill();
      }
      break;
    }
  }
  return c;
}

export function getBackground(world) {
  let bg = cache.get(world);
  if (bg) return bg;
  const th = THEMES[world] || THEMES[1];
  bg = { sky: skyCanvas(th, world), far: farCanvas(th, world), near: nearCanvas(th, world) };
  cache.set(world, bg);
  return bg;
}

// Draw parallax stack given camera x/y.
export function drawBackground(ctx, world, camX, camY, time) {
  const bg = getBackground(world);
  ctx.drawImage(bg.sky, 0, 0);
  const layers = [
    { c: bg.far, f: 0.18, yOff: Math.round(-camY * 0.05) },
    { c: bg.near, f: 0.42, yOff: Math.round(-camY * 0.12) }
  ];
  for (const L of layers) {
    let ox = -Math.round(camX * L.f) % LW;
    if (ox > 0) ox -= LW;
    for (let xx = ox; xx < VIEW_W; xx += LW) ctx.drawImage(L.c, xx, L.yOff);
  }
}
