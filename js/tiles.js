// Tile behaviors + per-world themed tileset rendering (16x16, cached canvases).
import { TILE } from './const.js';
import { makeCanvas, mulberry32 } from './util.js';

export const T = {
  EMPTY: 0,
  GROUND: 1,   // solid terrain with themed top
  STONE: 2,    // solid block
  BRICK: 3,    // breakable (Bear Spirit / roll / pound)
  QUESTION: 4, // prize block
  USED: 5,     // spent prize block
  PLAT: 6,     // one-way platform
  SPIKE: 7,    // floor spikes
  SPIKE_D: 8,  // ceiling spikes
  WATER: 9,
  WATERTOP: 10,
  LAVA: 11,
  LAVATOP: 12,
  VINE: 13,    // climbable
  LADDER: 14,  // climbable
  ICE: 15,     // slippery solid
  CLOUD: 16,   // soft semisolid
  CONVL: 17,   // conveyor left
  CONVR: 18,   // conveyor right
  CRUMBLE: 19, // crumbles underfoot
  PILLAR: 20,  // solid decorative column
  BRIDGE: 21,  // thin walkable bridge (one-way)
  HIDDEN: 22,  // invisible block: appears when bumped from below
  ROCK: 23     // heavy breakable (Bear Spirit only)
};

export const SOLID = new Set([T.GROUND, T.STONE, T.BRICK, T.QUESTION, T.USED, T.ICE, T.CONVL, T.CONVR, T.CRUMBLE, T.PILLAR, T.ROCK]);
export const SEMISOLID = new Set([T.PLAT, T.CLOUD, T.BRIDGE]);
export const DEADLY = new Set([T.SPIKE, T.SPIKE_D, T.LAVA, T.LAVATOP]);
export const CLIMBABLE = new Set([T.VINE, T.LADDER]);
export const LIQUID = new Set([T.WATER, T.WATERTOP]);
export const BREAKABLE = new Set([T.BRICK, T.ROCK]);

// Per-world visual themes.
export const THEMES = {
  1: { // Emerald Meadows
    sky: ['#8ecdff', '#c9ecff'], top: '#5cc94a', topLight: '#8ee06a', ground: '#a5713d', groundDark: '#7d5028',
    stone: '#b0b6c2', accent: '#ff7ab0', hills: ['#63b04e', '#3f8a3a'], deco: 'meadow'
  },
  2: { // Ancient Forest
    sky: ['#2d4a3e', '#5a8a6a'], top: '#3fae4a', topLight: '#66cc5a', ground: '#5c4326', groundDark: '#3d2c18',
    stone: '#7d8a7a', accent: '#ffd042', hills: ['#2a6a44', '#1d4a34'], deco: 'forest'
  },
  3: { // Crystal Caverns
    sky: ['#141428', '#2c2c54'], top: '#7a6aae', topLight: '#a898de', ground: '#4a4070', groundDark: '#332a52',
    stone: '#5c5c86', accent: '#7ae0f0', hills: ['#28284a', '#1c1c38'], deco: 'cave'
  },
  4: { // Golden Desert
    sky: ['#ffca6a', '#ffeab0'], top: '#eec868', topLight: '#ffe9a0', ground: '#cf9c4a', groundDark: '#a3742f',
    stone: '#c8a878', accent: '#3fae4a', hills: ['#d8a850', '#b08038'], deco: 'desert'
  },
  5: { // Frozen Peaks
    sky: ['#7ab0e0', '#cfe8ff'], top: '#ffffff', topLight: '#ffffff', ground: '#9ab4d4', groundDark: '#6a86ac',
    stone: '#b8ccdf', accent: '#7ae0f0', hills: ['#b0cce8', '#8aabcf'], deco: 'snow'
  },
  6: { // Sky Isles
    sky: ['#6aa0ff', '#b8d8ff'], top: '#6ecf5a', topLight: '#9ce87a', ground: '#c8b088', groundDark: '#9a8460',
    stone: '#d8dfea', accent: '#ffffff', hills: ['#ffffff', '#dfe8ff'], deco: 'sky'
  },
  7: { // Haunted Kingdom
    sky: ['#1a1026', '#3a2448'], top: '#5a6a52', topLight: '#7a8a6e', ground: '#4a3e5a', groundDark: '#332a42',
    stone: '#6a6a7e', accent: '#9a4ad0', hills: ['#2a1c3a', '#1e1430'], deco: 'haunted'
  },
  8: { // Mechanical Citadel
    sky: ['#3a2c24', '#6a5240'], top: '#8a8a96', topLight: '#b0b0bc', ground: '#5a5a66', groundDark: '#3e3e4a',
    stone: '#787886', accent: '#ff8830', hills: ['#4a3a30', '#352a22'], deco: 'citadel'
  },
  9: { // Dragon Realm
    sky: ['#2c0e12', '#601c1c'], top: '#6e4a4a', topLight: '#8e6a5a', ground: '#4c3038', groundDark: '#341f26',
    stone: '#5e4a52', accent: '#ff5020', hills: ['#3e1418', '#2a0e10'], deco: 'dragon'
  }
};

const cache = new Map();

function px(x, c, X, Y, w = 1, h = 1) { x.fillStyle = c; x.fillRect(X, Y, w, h); }

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// frame: 0/1 for animated tiles (water, lava, conveyors)
export function getTile(world, type, frame = 0) {
  const key = `${world}|${type}|${frame}`;
  let c = cache.get(key);
  if (c) return c;
  c = drawTile(THEMES[world] || THEMES[1], type, frame, world);
  cache.set(key, c);
  return c;
}

function drawTile(th, type, frame, world) {
  const c = makeCanvas(TILE, TILE);
  const x = c.getContext('2d');
  const rng = mulberry32(world * 1000 + type * 17 + frame * 7);

  switch (type) {
    case T.GROUND: {
      px(x, th.ground, 0, 0, 16, 16);
      // dirt speckle
      for (let i = 0; i < 9; i++) px(x, th.groundDark, (rng() * 16) | 0, 4 + ((rng() * 12) | 0), 2, 1);
      for (let i = 0; i < 4; i++) px(x, shade(th.ground, 1.15), (rng() * 16) | 0, 5 + ((rng() * 10) | 0), 1, 1);
      // themed top band
      px(x, th.top, 0, 0, 16, 4);
      px(x, th.topLight, 0, 0, 16, 1);
      // irregular fringe
      for (let i = 0; i < 16; i += 2) {
        if (rng() > 0.45) px(x, th.top, i, 4, 2, 1);
        if (rng() > 0.7) px(x, th.top, i, 5, 1, 1);
      }
      px(x, shade(th.top, 0.72), 0, 3, 16, 1);
      break;
    }
    case T.STONE: case T.PILLAR: {
      const base = th.stone;
      px(x, base, 0, 0, 16, 16);
      px(x, shade(base, 1.25), 0, 0, 16, 1);
      px(x, shade(base, 1.25), 0, 0, 1, 16);
      px(x, shade(base, 0.6), 0, 15, 16, 1);
      px(x, shade(base, 0.6), 15, 0, 1, 16);
      for (let i = 0; i < 5; i++) px(x, shade(base, 0.8), 2 + ((rng() * 12) | 0), 2 + ((rng() * 12) | 0), 2, 1);
      if (type === T.PILLAR) { px(x, shade(base, 0.7), 3, 0, 1, 16); px(x, shade(base, 0.7), 12, 0, 1, 16); }
      break;
    }
    case T.ROCK: {
      const base = shade(th.stone, 0.85);
      px(x, base, 0, 0, 16, 16);
      px(x, shade(base, 1.3), 1, 1, 6, 2);
      px(x, shade(base, 0.55), 0, 14, 16, 2);
      px(x, shade(base, 0.7), 8, 4, 5, 2);
      px(x, shade(base, 0.7), 3, 8, 4, 2);
      px(x, shade(base, 1.15), 10, 9, 4, 2);
      // cracks
      px(x, shade(base, 0.45), 7, 2, 1, 5);
      px(x, shade(base, 0.45), 4, 10, 5, 1);
      break;
    }
    case T.BRICK: {
      const base = shade(th.ground, 1.1);
      px(x, base, 0, 0, 16, 16);
      const mortar = shade(base, 0.55);
      px(x, mortar, 0, 3, 16, 1); px(x, mortar, 0, 7, 16, 1);
      px(x, mortar, 0, 11, 16, 1); px(x, mortar, 0, 15, 16, 1);
      px(x, mortar, 7, 0, 1, 3); px(x, mortar, 3, 4, 1, 3); px(x, mortar, 11, 4, 1, 3);
      px(x, mortar, 7, 8, 1, 3); px(x, mortar, 3, 12, 1, 3); px(x, mortar, 11, 12, 1, 3);
      px(x, shade(base, 1.2), 0, 0, 16, 1);
      break;
    }
    case T.QUESTION: {
      px(x, '#ffd042', 0, 0, 16, 16);
      px(x, '#ffe98a', 1, 1, 14, 1); px(x, '#ffe98a', 1, 1, 1, 14);
      px(x, '#b8901c', 1, 14, 14, 1); px(x, '#b8901c', 14, 1, 1, 14);
      px(x, '#181624', 0, 0, 1, 1); px(x, '#181624', 15, 0, 1, 1);
      px(x, '#181624', 0, 15, 1, 1); px(x, '#181624', 15, 15, 1, 1);
      // diamond emblem
      const d = '#a3742f';
      px(x, d, 7, 4, 2, 1); px(x, d, 5, 6, 6, 1); px(x, d, 4, 7, 8, 2);
      px(x, d, 5, 9, 6, 1); px(x, d, 7, 11, 2, 1);
      px(x, '#fff6ec', 6, 6, 2, 2);
      break;
    }
    case T.USED: {
      const base = shade(th.stone, 0.75);
      px(x, base, 0, 0, 16, 16);
      px(x, shade(base, 1.2), 1, 1, 14, 1);
      px(x, shade(base, 0.6), 1, 14, 14, 1);
      px(x, shade(base, 0.6), 6, 6, 4, 4);
      break;
    }
    case T.PLAT: {
      const wcol = world === 8 ? '#787886' : '#b07840';
      px(x, wcol, 0, 0, 16, 5);
      px(x, shade(wcol, 1.25), 0, 0, 16, 1);
      px(x, shade(wcol, 0.6), 0, 4, 16, 1);
      px(x, shade(wcol, 0.75), 3, 1, 1, 3); px(x, shade(wcol, 0.75), 11, 1, 1, 3);
      break;
    }
    case T.BRIDGE: {
      const wcol = '#8a5c30';
      px(x, wcol, 0, 2, 16, 3);
      px(x, shade(wcol, 1.25), 0, 2, 16, 1);
      px(x, shade(wcol, 0.55), 0, 5, 16, 1);
      px(x, shade(wcol, 0.7), 4, 2, 1, 4); px(x, shade(wcol, 0.7), 12, 2, 1, 4);
      break;
    }
    case T.SPIKE: {
      const s = world === 5 ? '#cfe8ff' : '#c8ceda';
      for (const ox of [0, 8]) {
        px(x, '#181624', ox + 3, 6, 2, 10);
        px(x, s, ox + 3, 8, 2, 8);
        px(x, '#181624', ox + 1, 12, 6, 4);
        px(x, s, ox + 2, 13, 4, 3);
        px(x, shade(s, 0.6), ox + 4, 8, 1, 8);
      }
      break;
    }
    case T.SPIKE_D: {
      const s = world === 5 ? '#cfe8ff' : '#c8ceda';
      for (const ox of [0, 8]) {
        px(x, '#181624', ox + 3, 0, 2, 10);
        px(x, s, ox + 3, 0, 2, 8);
        px(x, '#181624', ox + 1, 0, 6, 4);
        px(x, s, ox + 2, 0, 4, 3);
      }
      break;
    }
    case T.WATER: {
      px(x, 'rgba(42,90,200,0.78)', 0, 0, 16, 16);
      for (let i = 0; i < 3; i++) px(x, 'rgba(120,180,255,0.5)', (rng() * 14) | 0, (rng() * 14) | 0, 3, 1);
      break;
    }
    case T.WATERTOP: {
      px(x, 'rgba(42,90,200,0.78)', 0, 3, 16, 13);
      const off = frame ? 4 : 0;
      for (let i = 0; i < 16; i += 8) {
        px(x, '#cfe8ff', ((i + off) % 16), 2, 4, 1);
        px(x, '#8ab8ff', ((i + off + 4) % 16), 3, 4, 1);
      }
      break;
    }
    case T.LAVA: {
      px(x, '#c03010', 0, 0, 16, 16);
      for (let i = 0; i < 4; i++) px(x, '#ff8830', (rng() * 14) | 0, (rng() * 14) | 0, 3, 1);
      for (let i = 0; i < 2; i++) px(x, '#ffd042', (rng() * 14) | 0, (rng() * 14) | 0, 2, 1);
      break;
    }
    case T.LAVATOP: {
      px(x, '#c03010', 0, 3, 16, 13);
      const off = frame ? 4 : 0;
      for (let i = 0; i < 16; i += 8) {
        px(x, '#ffd042', ((i + off) % 16), 2, 4, 1);
        px(x, '#ff8830', ((i + off + 4) % 16), 3, 4, 1);
      }
      px(x, '#ff5020', 0, 4, 16, 1);
      break;
    }
    case T.VINE: {
      px(x, '#2a7a30', 6, 0, 3, 16);
      px(x, '#3fae4a', 7, 0, 1, 16);
      for (let i = 2; i < 16; i += 5) {
        px(x, '#3fae4a', 3, i, 4, 2);
        px(x, '#8ade6a', 4, i, 2, 1);
        px(x, '#3fae4a', 9, i + 2, 4, 2);
        px(x, '#8ade6a', 10, i + 2, 2, 1);
      }
      break;
    }
    case T.LADDER: {
      const wd = '#b07840';
      px(x, wd, 2, 0, 2, 16); px(x, wd, 12, 0, 2, 16);
      px(x, shade(wd, 0.65), 3, 0, 1, 16); px(x, shade(wd, 0.65), 13, 0, 1, 16);
      px(x, wd, 2, 3, 12, 2); px(x, wd, 2, 10, 12, 2);
      px(x, shade(wd, 1.2), 2, 3, 12, 1); px(x, shade(wd, 1.2), 2, 10, 12, 1);
      break;
    }
    case T.ICE: {
      px(x, '#a8dff0', 0, 0, 16, 16);
      px(x, '#e0f6ff', 0, 0, 16, 2);
      px(x, '#e0f6ff', 0, 0, 2, 16);
      px(x, '#5aa8cc', 0, 14, 16, 2);
      px(x, '#5aa8cc', 14, 0, 2, 16);
      px(x, '#ffffff', 3, 3, 4, 1); px(x, '#ffffff', 5, 5, 1, 3);
      px(x, '#7ac8e0', 9, 8, 4, 1); px(x, '#7ac8e0', 11, 10, 1, 3);
      break;
    }
    case T.CLOUD: {
      px(x, '#ffffff', 1, 4, 14, 8);
      px(x, '#ffffff', 3, 2, 10, 12);
      px(x, '#ffffff', 0, 6, 16, 5);
      px(x, '#dfe8ff', 1, 10, 14, 2);
      px(x, '#c8d8f0', 3, 12, 10, 2);
      break;
    }
    case T.CONVL: case T.CONVR: {
      px(x, '#4a4a58', 0, 0, 16, 16);
      px(x, '#787886', 0, 0, 16, 3);
      px(x, '#b0b0bc', 0, 0, 16, 1);
      px(x, '#2e2e3a', 0, 13, 16, 3);
      const off = (type === T.CONVR ? frame * 3 : -frame * 3 + 16) % 8;
      for (let i = 0; i < 16; i += 8) {
        const ax = (i + off + 16) % 16;
        px(x, '#ffd042', ax, 6, 3, 1);
        px(x, '#ffd042', ax + (type === T.CONVR ? 2 : 0), 5, 1, 3);
      }
      px(x, '#181624', 0, 3, 16, 1);
      break;
    }
    case T.CRUMBLE: {
      const base = '#b07840';
      px(x, base, 0, 0, 16, 16);
      px(x, shade(base, 1.2), 0, 0, 16, 1);
      px(x, shade(base, 0.6), 0, 15, 16, 1);
      px(x, shade(base, 0.5), 4, 2, 1, 6);
      px(x, shade(base, 0.5), 8, 6, 1, 8);
      px(x, shade(base, 0.5), 12, 1, 1, 5);
      px(x, shade(base, 0.5), 2, 9, 6, 1);
      px(x, shade(base, 0.5), 9, 12, 6, 1);
      break;
    }
    case T.HIDDEN: {
      // invisible in normal play (rendered only with reveal cheat)
      break;
    }
    default: break;
  }
  return c;
}

export function tileSolid(t) { return SOLID.has(t); }
export function tileSemisolid(t) { return SEMISOLID.has(t); }
export function tileDeadly(t) { return DEADLY.has(t); }
export function tileClimbable(t) { return CLIMBABLE.has(t); }
export function tileLiquid(t) { return LIQUID.has(t); }
