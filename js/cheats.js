// Cheat flags + menu definitions. All disabled by default; session-only (not saved).
import { POWER } from './const.js';

export function defaultCheats() {
  return {
    god: false, infhp: false, inflives: false, infcoins: false, infpower: false,
    allAbilities: false,
    fly: false, moon: false, freeze: false, onehit: false,
    reveal: false, slowmo: false, fastfwd: false,
    fps: false, debug: false, collision: false, ai: false
  };
}

// Menu structure: toggles flip flags; actions run once.
export const CHEAT_ITEMS = [
  { id: 'god', key: 'cheat_god', type: 'toggle' },
  { id: 'infhp', key: 'cheat_infhp', type: 'toggle' },
  { id: 'inflives', key: 'cheat_inflives', type: 'toggle' },
  { id: 'addlife', key: 'cheat_addlife', type: 'action', run: (app) => { app.save.lives = Math.min(99, app.save.lives + 1); } },
  { id: 'removelife', key: 'cheat_removelife', type: 'action', run: (app) => { app.save.lives = Math.max(1, app.save.lives - 1); } },
  { id: 'infcoins', key: 'cheat_infcoins', type: 'toggle' },
  { id: 'infpower', key: 'cheat_infpower', type: 'toggle' },
  { id: 'unlock_levels', key: 'cheat_unlock_levels', type: 'action', run: (app) => app.unlockAllLevels(false) },
  { id: 'unlock_worlds', key: 'cheat_unlock_worlds', type: 'action', run: (app) => app.unlockAllLevels(true) },
  { id: 'allAbilities', key: 'cheat_unlock_abilities', type: 'toggle' },
  { id: 'unlock_cosmetics', key: 'cheat_unlock_cosmetics', type: 'action', run: (app) => app.unlockCosmetics() },
  { id: 'fly', key: 'cheat_fly', type: 'toggle' },
  { id: 'moon', key: 'cheat_moon', type: 'toggle' },
  { id: 'freeze', key: 'cheat_freeze', type: 'toggle' },
  { id: 'onehit', key: 'cheat_onehit', type: 'toggle' },
  { id: 'bossrush', key: 'cheat_bossrush', type: 'action', run: (app) => app.startBossRush() },
  { id: 'spawn_fire', key: 'cheat_spawn_power', type: 'cycle_power' },
  { id: 'spawn_collect', key: 'cheat_spawn_collect', type: 'action', run: (app) => app.cheatSpawnCollectibles() },
  { id: 'reveal', key: 'cheat_reveal', type: 'toggle' },
  { id: 'teleport', key: 'cheat_teleport', type: 'action', run: (app) => app.cheatTeleportNext() },
  { id: 'slowmo', key: 'cheat_slowmo', type: 'toggle' },
  { id: 'fastfwd', key: 'cheat_fastfwd', type: 'toggle' },
  { id: 'fps', key: 'cheat_fps', type: 'toggle' },
  { id: 'debug', key: 'cheat_debug', type: 'toggle' },
  { id: 'collision', key: 'cheat_collision', type: 'toggle' },
  { id: 'ai', key: 'cheat_ai', type: 'toggle' }
];

export const SPAWNABLE_POWERS = [POWER.FIRE, POWER.ICE, POWER.WIND, POWER.BEAR, POWER.BOLT, POWER.CRYSTAL, POWER.SHADOW, POWER.PHOENIX];
