// Level parsing: ASCII maps -> tile grid + entity spawns.
//
// Tile legend:
//   #  ground        =  stone        B  brick        R  rock (bear-only)
//   ?  prize block   P  power block  X  hidden block U  used
//   _  platform      -  bridge       C  cloud        F  crumble
//   ^  spikes        v  ceiling spikes
//   ~  water top     w  water        %  lava top     l  lava
//   V  vine          H  ladder       I  ice          |  pillar
//   <  conveyor L    >  conveyor R
//
// Entity legend:
//   S  spawn   G  goal gate   k  checkpoint   s  spring
//   c  petal   g  ancient gem h  heart        m  matryoshka (1up)
//   M  moving platform (horizontal)   N  moving platform (vertical)
//   Enemies: 1 walker 2 hopper 3 flyer 4 armored 5 lunger 6 swooper 7 golem
//            8 dropper 9 burrower 0 spiky q charger e floatshooter y wisp
//            t thrower d shade u turret n dragonewt j leaper
import { T } from './tiles.js';

const TILE_CHARS = {
  '#': T.GROUND, '=': T.STONE, 'B': T.BRICK, 'R': T.ROCK,
  '?': T.QUESTION, 'X': T.HIDDEN, 'U': T.USED,
  '_': T.PLAT, '-': T.BRIDGE, 'C': T.CLOUD, 'F': T.CRUMBLE,
  '^': T.SPIKE, 'v': T.SPIKE_D,
  '~': T.WATERTOP, 'w': T.WATER, '%': T.LAVATOP, 'l': T.LAVA,
  'V': T.VINE, 'H': T.LADDER, 'I': T.ICE, '|': T.PILLAR,
  '<': T.CONVL, '>': T.CONVR
};

const ENEMY_CHARS = {
  '1': 'walker', '2': 'hopper', '3': 'flyer', '4': 'armored', '5': 'lunger',
  '6': 'swooper', '7': 'golem', '8': 'dropper', '9': 'burrower', '0': 'spiky',
  'q': 'charger', 'e': 'floatshooter', 'y': 'wisp', 't': 'thrower',
  'd': 'shade', 'u': 'turret', 'n': 'dragonewt', 'j': 'leaper'
};

export function parseLevel(def) {
  const rows = def.rows;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles = new Uint8Array(w * h);
  const spawns = [];
  let playerSpawn = { x: 32, y: 32 };

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const t = TILE_CHARS[ch];
      if (t !== undefined) { tiles[y * w + x] = t; continue; }
      if (ch === 'P') { tiles[y * w + x] = T.QUESTION; spawns.push({ type: 'powerblock', x, y }); continue; }
      const px = x * 16, py = y * 16;
      if (ch === 'S') playerSpawn = { x: px + 3, y: py + 2 };
      else if (ch === 'G') spawns.push({ type: 'gate', x: px, y: py });
      else if (ch === 'k') spawns.push({ type: 'checkpoint', x: px, y: py });
      else if (ch === 's') spawns.push({ type: 'spring', x: px, y: py });
      else if (ch === 'c') spawns.push({ type: 'petal', x: px, y: py });
      else if (ch === 'g') spawns.push({ type: 'gem', x: px, y: py });
      else if (ch === 'h') spawns.push({ type: 'heart', x: px, y: py });
      else if (ch === 'm') spawns.push({ type: 'matryoshka', x: px, y: py });
      else if (ch === 'M') spawns.push({ type: 'platform_h', x: px, y: py });
      else if (ch === 'N') spawns.push({ type: 'platform_v', x: px, y: py });
      else if (ENEMY_CHARS[ch]) spawns.push({ type: 'enemy', enemy: ENEMY_CHARS[ch], x: px, y: py });
    }
  }
  // 'P' handled above via spawns marker; store power block positions in a set
  const powerBlocks = new Set(spawns.filter((s) => s.type === 'powerblock').map((s) => s.y * w + s.x));

  return {
    id: def.id,
    world: def.world,
    stage: def.stage,
    width: w, height: h,
    tiles,
    spawns: spawns.filter((s) => s.type !== 'powerblock'),
    powerBlocks,
    playerSpawn,
    power: def.power || null,     // what power the P blocks grant
    boss: def.boss || null,
    music: def.music || null,
    wind: def.wind || 0,          // constant horizontal wind (Sky Isles)
    dark: def.dark || false,      // darkness vignette (Caverns/Haunted)
    timeLimit: def.timeLimit || 300
  };
}
