// Generates PWA icons (PNG) from the Polina pixel-art motif — no dependencies.
// Usage: node tools/genicons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- tiny PNG writer --------------------------------------------------------
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// --- draw the icon ----------------------------------------------------------
const PAL = {
  k: [24, 22, 36], s: [255, 203, 164], h: [122, 74, 34], g: [255, 208, 66],
  r: [224, 64, 80], R: [156, 32, 56], w: [255, 246, 236], m: [255, 154, 192],
  b: [106, 68, 38]
};
// 16x16 Polina face motif
const ART = [
  '................',
  '.....g.gg.g.....',
  '.....gggggg.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhssssssh....',
  '...hhsksskshh...',
  '....hssssssh....',
  '.....ssssss.....',
  '....rrrrrrrr....',
  '...rrrrrrrrrr...',
  '...wrrrrrrrrw...',
  '..rrrrrrrrrrrr..',
  '..gRrRrrrRrRrg..',
  '....bb....bb....',
  '................'
];

function makeIcon(size, maskable = false) {
  const rgba = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };
  // background: night gradient + rounded corners (square for maskable)
  const corner = maskable ? 0 : Math.round(size * 0.16);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-corner mask
      if (corner) {
        const cx = x < corner ? corner - x : x >= size - corner ? x - (size - 1 - corner) : 0;
        const cy = y < corner ? corner - y : y >= size - corner ? y - (size - 1 - corner) : 0;
        if (cx * cx + cy * cy > corner * corner) { put(x, y, [0, 0, 0], 0); continue; }
      }
      const t = y / size;
      put(x, y, [26 + 46 * t, 10 + 22 * t, 46 + 32 * t]);
    }
  }
  // stars
  let seed = 12345;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < size / 3; i++) {
    const x = Math.floor(rnd() * size), y = Math.floor(rnd() * size * 0.5);
    put(x, y, [255, 246, 236]);
  }
  // Polina sprite scaled to ~70% (56% for maskable safe zone)
  const artScale = Math.max(1, Math.floor(size * (maskable ? 0.56 : 0.72) / 16));
  const ox = Math.floor((size - 16 * artScale) / 2);
  const oy = Math.floor((size - 16 * artScale) / 2);
  for (let ay = 0; ay < 16; ay++) {
    for (let ax = 0; ax < 16; ax++) {
      const ch = ART[ay][ax];
      if (ch === '.') continue;
      const c = PAL[ch];
      for (let dy = 0; dy < artScale; dy++) {
        for (let dx = 0; dx < artScale; dx++) put(ox + ax * artScale + dx, oy + ay * artScale + dy, c);
      }
    }
  }
  return png(size, size, rgba);
}

mkdirSync(join(root, 'icons'), { recursive: true });
writeFileSync(join(root, 'icons/icon-192.png'), makeIcon(192));
writeFileSync(join(root, 'icons/icon-512.png'), makeIcon(512));
writeFileSync(join(root, 'icons/icon-512-maskable.png'), makeIcon(512, true));
writeFileSync(join(root, 'icons/apple-touch-icon.png'), makeIcon(180, true));
console.log('icons written');
