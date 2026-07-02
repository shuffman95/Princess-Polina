// Core constants for Princess Polina.

export const TILE = 16;
export const VIEW_W = 432;          // 27 tiles
export const VIEW_H = 240;          // 15 tiles
export const FPS = 60;
export const DT = 1 / FPS;

// Physics tuning (px/sec, px/sec^2). Tuned for tight, momentum-driven feel.
export const PHYS = {
  walkSpeed: 78,
  runSpeed: 138,
  accel: 420,
  runAccel: 520,
  decel: 620,
  airAccel: 380,
  airDecel: 180,
  skidDecel: 900,
  gravity: 830,
  fallGravity: 1010,
  maxFall: 270,
  jumpVel: -238,
  runJumpBonus: -30,
  jumpCutFactor: 0.45,
  coyoteTime: 0.09,
  jumpBuffer: 0.12,
  wallSlideMax: 78,
  wallJumpVX: 150,
  wallJumpVY: -218,
  rollSpeed: 190,
  rollTime: 0.34,
  poundSpeed: 360,
  dashSpeed: 250,
  dashTime: 0.18,
  glideFall: 46,
  swimAccel: 300,
  swimMax: 96,
  swimGravity: 160,
  swimJump: -130,
  climbSpeed: 72
};

// Game states
export const ST = {
  BOOT: 0,
  TITLE: 1,
  SAVES: 2,
  STORY: 3,
  WORLDMAP: 4,
  LEVEL: 5,
  ENDING: 6
};

// Entity collision layers
export const HIT = { NONE: 0, PLAYER: 1, ENEMY: 2, PLAYER_ATK: 3, ENEMY_ATK: 4 };

// Power-up ids
export const POWER = {
  NONE: 'none',
  FIRE: 'fire',        // Fire Crown — throw fireballs
  ICE: 'ice',          // Ice Tiara — freeze enemies into platforms
  WIND: 'wind',        // Wind Cloak — higher jump + slow fall
  BEAR: 'bear',        // Bear Spirit — smash blocks, stronger stomp
  BOLT: 'bolt',        // Lightning Jewel — dash attack is lethal, faster run
  CRYSTAL: 'crystal',  // Crystal Armor — absorbs two extra hits
  SHADOW: 'shadow',    // Shadow Cape — brief phase through hazards
  PHOENIX: 'phoenix'   // Phoenix Feather — one revive on death
};

// Ability unlock order (granted by defeating world bosses / finding shrines)
export const ABILITY = {
  RUN: 'run',
  WALLJUMP: 'walljump',
  ROLL: 'roll',
  CLIMB: 'climb',
  SWIM: 'swim',
  POUND: 'pound',
  DOUBLEJUMP: 'doublejump',
  DASH: 'dash',
  GLIDE: 'glide'
};

export const WORLD_COUNT = 9;
