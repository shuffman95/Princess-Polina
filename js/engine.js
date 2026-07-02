// App orchestrator: state machine, progression, settings, save slots, loop glue.
import { VIEW_W, VIEW_H, ST, DT, ABILITY, WORLD_COUNT, TILE } from './const.js';
import { clamp } from './util.js';
import { input, DEFAULT_KEYS } from './input.js';
import { t, setLang, getLang, LANGS } from './i18n.js';
import * as SAVE from './save.js';
import { Game } from './game.js';
import { WorldMap } from './worldmap.js';
import { MenuStack, pauseScreen, titleScreen, saveSelectScreen, settingsScreen } from './menus.js';
import { introScene, spiritScene, endingScene } from './story.js';
import { Transition, drawTouchControls } from './ui.js';
import { LEVELS } from './leveldata.js';
import { parseLevel } from './levels.js';
import { unlockAudio, setMusicVolume, setSfxVolume, playMusic, stopMusic } from './audio.js';
import { MUSIC } from './music.js';
import { defaultCheats, SPAWNABLE_POWERS } from './cheats.js';
import { drawText } from './font.js';
import { sfx } from './sfx.js';
import { PowerUp, Petal, Heart } from './entities.js';

// Ability granted by freeing each world's guardian spirit.
const WORLD_ABILITY = {
  1: ABILITY.WALLJUMP, 2: ABILITY.CLIMB, 3: ABILITY.POUND, 4: ABILITY.ROLL,
  5: ABILITY.SWIM, 6: ABILITY.DOUBLEJUMP, 7: ABILITY.DASH, 8: ABILITY.GLIDE
};

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.input = input;
    this.input.attach(canvas);

    this.settings = SAVE.loadSettings();
    if (this.settings.keys) this.input.keys = this.settings.keys;
    const autoLang = (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
    setLang(this.settings.lang || autoLang);
    setMusicVolume(this.settings.musicVol);
    setSfxVolume(this.settings.sfxVol);
    this.applyUiScale(false);

    // level registry
    this.levels = LEVELS.map(parseLevel);
    this.levelById = new Map(this.levels.map((l) => [l.id, l]));
    this.levelsByWorld = {};
    for (const l of this.levels) (this.levelsByWorld[l.world] = this.levelsByWorld[l.world] || []).push(l);
    this.totalLevels = this.levels.length;

    this.cheats = defaultCheats();
    this.cheatPowerIdx = 0;
    this.remapAction = null;
    this.bossRush = false;

    this.save = null;
    this.slot = -1;

    this.state = ST.TITLE;
    this.menus = new MenuStack(this);
    this.transition = new Transition();
    this.worldmap = new WorldMap(this);
    this.game = new Game(this);
    this.story = null;
    this.titleUi = titleScreen(this);
    this.savesUi = saveSelectScreen(this);

    this.fps = 60;
    this.fpsAcc = 0; this.fpsN = 0;
    this.gamepadToast = 0;

    // unlock audio on any first interaction
    const unlock = () => { unlockAudio(); setMusicVolume(this.settings.musicVol); setSfxVolume(this.settings.sfxVol); this.ensureTitleMusic(); };
    canvas.addEventListener('touchstart', unlock, { once: false });
    canvas.addEventListener('mousedown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
  }

  ensureTitleMusic() {
    if (this.state === ST.TITLE) playMusic(MUSIC.title, 'title');
  }

  // --- settings helpers ------------------------------------------------------
  saveSettingsNow() {
    this.settings.lang = getLang();
    SAVE.saveSettings(this.settings);
  }
  applyUiScale(persist = true) {
    this.input.setPadScale(this.settings.uiScale);
    if (persist) this.saveSettingsNow();
  }
  applyShake() {
    this.game.camera.shakeEnabled = this.settings.screenShake;
    this.saveSettingsNow();
  }
  cycleLang(dir) {
    const idx = LANGS.findIndex((l) => l.id === getLang());
    const next = LANGS[(idx + dir + LANGS.length) % LANGS.length];
    setLang(next.id);
    this.saveSettingsNow();
  }
  cycleDifficulty(dir) {
    const opts = ['relaxed', 'classic', 'fierce'];
    const idx = opts.indexOf(this.settings.difficulty);
    this.settings.difficulty = opts[(idx + dir + opts.length) % opts.length];
    this.saveSettingsNow();
  }
  resetSettings() {
    this.settings = SAVE.defaultSettings();
    this.input.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
    setLang((navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en');
    setMusicVolume(this.settings.musicVol);
    setSfxVolume(this.settings.sfxVol);
    this.applyUiScale(false);
    this.saveSettingsNow();
  }

  // --- save slots -------------------------------------------------------------
  slotSummaries() { return SAVE.slotSummaries(); }
  deleteSlot(i) { SAVE.deleteSlot(i); }
  pickSlot(i) {
    this.slot = i;
    const existing = SAVE.loadSlot(i);
    if (existing) {
      this.save = existing;
      this.toWorldMap();
    } else {
      this.save = SAVE.defaultSave();
      SAVE.saveSlot(i, this.save);
      // new game: play intro story
      this.story = introScene(this, () => this.toWorldMap());
      stopMusic(0.5);
      this.state = ST.STORY;
    }
  }
  autoSave() {
    if (this.slot >= 0 && this.save) SAVE.saveSlot(this.slot, this.save);
  }

  // --- progression --------------------------------------------------------------
  isUnlocked(id) { return !!(this.save && (this.save.unlocked[id] || this.save.cleared[id])); }
  hasAbility(ab) { return this.cheats.allAbilities || !!this.save.abilities[ab]; }

  markLevelCleared(id) {
    this.save.cleared[id] = true;
    const list = this.levelsByWorld[this.levelById.get(id).world];
    const idx = list.findIndex((l) => l.id === id);
    if (idx >= 0 && idx + 1 < list.length) this.save.unlocked[list[idx + 1].id] = true;
    this.autoSave();
  }

  unlockAllLevels(allWorlds) {
    for (const l of this.levels) {
      if (allWorlds || l.world <= this.save.world) this.save.unlocked[l.id] = true;
    }
    if (allWorlds) this.save.world = WORLD_COUNT;
  }

  unlockCosmetics() {
    for (const p of SPAWNABLE_POWERS) this.save.cosmetics[p] = true;
  }

  // --- state changes ---------------------------------------------------------------
  toTitle() {
    this.state = ST.TITLE;
    this.menus.closeAll();
    this.autoSave();
    playMusic(MUSIC.title, 'title');
  }
  toSaveSelect() {
    this.savesUi = saveSelectScreen(this);
    this.state = ST.SAVES;
  }
  toWorldMap() {
    this.state = ST.WORLDMAP;
    this.worldmap.enter();
  }

  startLevel(id, opts = {}) {
    const level = this.levelById.get(id);
    if (!level) return;
    this.currentLevelId = id;
    this.transition.start(() => {
      this.game.loadLevel(level, opts);
      this.state = ST.LEVEL;
    });
  }

  retryLevel(fromCheckpoint) {
    const level = this.levelById.get(this.currentLevelId);
    this.transition.start(() => {
      this.game.loadLevel(level, { fromCheckpoint });
      this.state = ST.LEVEL;
    });
  }

  exitToMap() {
    this.bossRush = false;
    this.transition.start(() => this.toWorldMap());
  }

  onLevelComplete() {
    this.autoSave();
    this.transition.start(() => this.toWorldMap());
  }

  onBossComplete() {
    const world = this.levelById.get(this.currentLevelId).world;
    this.save.bossesDefeated[world] = true;
    this.markLevelCleared(this.currentLevelId);

    if (this.bossRush) {
      const next = world + 1;
      if (next <= WORLD_COUNT) {
        const bossLevel = (this.levelsByWorld[next] || []).find((l) => l.boss);
        if (bossLevel) { this.startLevel(bossLevel.id); return; }
      }
      this.bossRush = false;
    }

    if (world >= WORLD_COUNT) {
      // Ivan defeated — roll the ending
      sfx.worldClear();
      this.story = endingScene(this, () => {
        this.autoSave();
        this.toTitle();
      });
      stopMusic(0.5);
      playMusic(MUSIC.ending, 'ending');
      this.state = ST.STORY;
      return;
    }

    // free the guardian spirit, grant ability, unlock next world
    const ability = WORLD_ABILITY[world];
    if (ability) this.save.abilities[ability] = true;
    const nextList = this.levelsByWorld[world + 1];
    if (nextList && nextList.length) {
      this.save.unlocked[nextList[0].id] = true;
      this.save.world = Math.max(this.save.world, world + 1);
    }
    this.autoSave();
    sfx.worldClear();
    stopMusic(0.3);
    this.story = spiritScene(this, world, () => {
      if (ability) {
        this.abilityBanner = { key: 'ab_' + ability, t: 0 };
      }
      this.toWorldMap();
    });
    this.state = ST.STORY;
  }

  openPauseFromMap() {
    this.menus.open(pauseScreen(this, true));
  }

  // --- cheat actions -----------------------------------------------------------------
  startBossRush() {
    this.bossRush = true;
    this.menus.closeAll();
    const first = this.levels.find((l) => l.boss);
    if (first) this.startLevel(first.id);
  }
  cheatSpawnPower() {
    if (this.state !== ST.LEVEL) return;
    const p = this.game.player;
    this.game.entities.push(new PowerUp(this.game, p.x + p.facing * 24, p.y - 10, SPAWNABLE_POWERS[this.cheatPowerIdx]));
  }
  cheatSpawnCollectibles() {
    if (this.state !== ST.LEVEL) return;
    const p = this.game.player;
    for (let i = 0; i < 6; i++) {
      this.game.entities.push(new Petal(this.game, p.x - 40 + i * 16, p.y - 30));
    }
    this.game.entities.push(new Heart(this.game, p.x + 20, p.y - 40));
  }
  cheatTeleportNext() {
    if (!this.save) return;
    this.menus.closeAll();
    const idx = this.levels.findIndex((l) => l.id === this.currentLevelId);
    const next = this.levels[(idx + 1) % this.levels.length];
    this.save.unlocked[next.id] = true;
    this.startLevel(next.id);
  }

  // --- frame -----------------------------------------------------------------------
  update(dt) {
    this.input.update();

    if (this.input.gamepadJustChanged !== 0) {
      this.gamepadToast = 2.5;
      this.gamepadToastMsg = this.input.gamepadJustChanged > 0 ? 'gamepad_connected' : 'gamepad_disconnected';
    }
    if (this.gamepadToast > 0) this.gamepadToast -= dt;
    if (this.abilityBanner) {
      this.abilityBanner.t += dt;
      if (this.abilityBanner.t > 3.5) this.abilityBanner = null;
    }

    this.transition.update(dt);

    if (this.menus.active) {
      this.menus.update(dt);
      this.input.postUpdate();
      return;
    }

    switch (this.state) {
      case ST.TITLE:
        this.titleUi.updateCustom(dt, this.input);
        break;
      case ST.SAVES:
        this.savesUi.updateCustom(dt, this.input);
        break;
      case ST.STORY:
        if (this.story) this.story.update(dt);
        break;
      case ST.WORLDMAP:
        this.worldmap.update(dt);
        break;
      case ST.LEVEL:
        if (this.input.pressed('pause')) {
          sfx.pause();
          this.menus.open(pauseScreen(this, false));
          break;
        }
        // touch pause button
        for (const tap of this.input.taps) {
          const b = this.input.btns.pause;
          if (Math.hypot(tap.x - b.cx, tap.y - b.cy) < 16) {
            sfx.pause();
            this.menus.open(pauseScreen(this, false));
          }
        }
        if (!this.transition.active || this.transition.mode === 'in') this.game.update(dt);
        break;
    }
    this.input.postUpdate();
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    switch (this.state) {
      case ST.TITLE: this.titleUi.drawCustom(ctx); break;
      case ST.SAVES: this.savesUi.drawCustom(ctx); break;
      case ST.STORY: if (this.story) this.story.draw(ctx); break;
      case ST.WORLDMAP: this.worldmap.draw(ctx); break;
      case ST.LEVEL: this.game.draw(ctx); break;
    }

    if (this.menus.active) this.menus.draw(ctx);

    // ability banner (after spirit scenes)
    if (this.abilityBanner && this.state === ST.WORLDMAP) {
      const b = this.abilityBanner;
      const a = b.t < 0.3 ? b.t / 0.3 : b.t > 3.0 ? clamp((3.5 - b.t) / 0.5, 0, 1) : 1;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(8,5,20,0.8)';
      ctx.fillRect(VIEW_W / 2 - 120, 66, 240, 34);
      drawText(ctx, t('new_ability'), VIEW_W / 2, 72, '#ffd042', { align: 'center', shadow: '#181624' });
      drawText(ctx, t(b.key) + ' — ' + t(b.key + '_d'), VIEW_W / 2, 86, '#fff6ec', { align: 'center' });
      ctx.globalAlpha = 1;
    }

    // gamepad toast
    if (this.gamepadToast > 0) {
      ctx.globalAlpha = clamp(this.gamepadToast, 0, 1);
      drawText(ctx, t(this.gamepadToastMsg), VIEW_W / 2, VIEW_H - 22, '#8ade6a', { align: 'center', shadow: '#181624' });
      ctx.globalAlpha = 1;
    }

    // touch controls overlay
    drawTouchControls(ctx, this.input, this.state === ST.LEVEL && !this.menus.active);

    this.transition.draw(ctx);
  }

  tickFps(frameMs) {
    this.fpsAcc += frameMs; this.fpsN++;
    if (this.fpsAcc >= 500) {
      this.fps = 1000 / (this.fpsAcc / this.fpsN);
      this.fpsAcc = 0; this.fpsN = 0;
    }
  }
}
