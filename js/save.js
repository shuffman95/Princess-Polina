// Save system: 3 slots + global settings, stored in localStorage.
// Save data is a plain serializable object (cloud-friendly: one JSON blob per slot).

const KEY_PREFIX = 'polina.save.';
const KEY_SETTINGS = 'polina.settings';

export function defaultSettings() {
  return {
    musicVol: 0.8,
    sfxVol: 0.9,
    lang: null,            // null = auto-detect
    difficulty: 'classic', // relaxed | classic | fierce
    uiScale: 1.0,
    subtitles: true,
    screenShake: true,
    keys: null             // null = defaults (see input.js)
  };
}

export function defaultSave() {
  return {
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // progress
    world: 1,                 // furthest unlocked world
    unlocked: { '1-1': true },// level id -> unlocked
    cleared: {},              // level id -> true
    gems: {},                 // level id -> true (hidden ancient gem found)
    bossesDefeated: {},       // world -> true
    abilities: { run: true }, // ability id -> true
    cosmetics: {},            // cosmetic id -> true
    lives: 4,
    coins: 0,
    power: 'none',
    stockedPower: 'none',
    // stats
    stats: { time: 0, deaths: 0, coins: 0, gems: 0, enemies: 0, levels: 0, jumps: 0 }
  };
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function write(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); return true; }
  catch (e) { return false; }
}

export function loadSettings() {
  const s = { ...defaultSettings(), ...(read(KEY_SETTINGS) || {}) };
  return s;
}

export function saveSettings(s) { write(KEY_SETTINGS, s); }

export function loadSlot(i) {
  const d = read(KEY_PREFIX + i);
  if (!d) return null;
  // merge over defaults so older saves gain new fields
  const base = defaultSave();
  return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } };
}

export function saveSlot(i, data) {
  data.updatedAt = Date.now();
  return write(KEY_PREFIX + i, data);
}

export function deleteSlot(i) {
  try { localStorage.removeItem(KEY_PREFIX + i); } catch (e) { /* ignore */ }
}

export function slotSummaries() {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const d = loadSlot(i);
    if (!d) { out.push(null); continue; }
    const clearedCount = Object.keys(d.cleared).length;
    out.push({
      world: d.world,
      lives: d.lives,
      time: d.stats.time,
      gems: Object.keys(d.gems).length,
      cleared: clearedCount
    });
  }
  return out;
}
