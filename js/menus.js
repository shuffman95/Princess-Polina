// Menu framework + all menu screens (pause, settings, controls, cheats, stats,
// title screen, save select). Fully touch- and keyboard-navigable.
import { VIEW_W, VIEW_H } from './const.js';
import { clamp, fmtTime } from './util.js';
import { drawText, textWidth } from './font.js';
import { t, LANGS, setLang, getLang } from './i18n.js';
import { sfx } from './sfx.js';
import { setMusicVolume, setSfxVolume, playMusic } from './audio.js';
import { MUSIC } from './music.js';
import { CHEAT_ITEMS, SPAWNABLE_POWERS } from './cheats.js';
import { ACTIONS, DEFAULT_KEYS } from './input.js';
import { getSprite } from './sprites.js';

const ROW_H = 13;

export class MenuStack {
  constructor(app) {
    this.app = app;
    this.stack = [];
    this.repeatT = 0;
  }

  get active() { return this.stack.length > 0; }
  get top() { return this.stack[this.stack.length - 1]; }

  open(screen) {
    screen.sel = screen.sel || 0;
    this.stack.push(screen);
    sfx.menuSelect();
  }

  close() {
    const s = this.stack.pop();
    if (s && s.onClose) s.onClose();
    sfx.menuBack();
  }

  closeAll() { while (this.stack.length) this.stack.pop(); }

  update(dt) {
    const s = this.top;
    if (!s) return;
    const inp = this.app.input;
    if (s.updateCustom && s.updateCustom(dt, inp)) return;

    const items = s.items.filter((i) => !i.hidden || !i.hidden());
    if (!items.length) return;
    s.sel = clamp(s.sel, 0, items.length - 1);

    // key repeat for held directions
    const dirHeld = inp.down('up') || inp.down('down');
    if (dirHeld) this.repeatT -= dt; else this.repeatT = 0;
    const rep = this.repeatT <= 0 && dirHeld;
    if (rep) this.repeatT = 0.18;

    if (inp.pressed('up') || (rep && inp.down('up'))) { s.sel = (s.sel - 1 + items.length) % items.length; sfx.menuMove(); }
    if (inp.pressed('down') || (rep && inp.down('down'))) { s.sel = (s.sel + 1) % items.length; sfx.menuMove(); }

    const item = items[s.sel];
    if (inp.pressed('left') && item.onLeft) { item.onLeft(); sfx.menuMove(); }
    if (inp.pressed('right') && item.onRight) { item.onRight(); sfx.menuMove(); }
    if (inp.pressed('jump') && item.onSelect) { item.onSelect(); }
    if (inp.pressed('pause') || inp.pressed('roll')) { this.close(); return; }

    // touch: taps on rows
    for (const tap of inp.taps) {
      const y0 = s.listY || 70;
      const idx = Math.floor((tap.y - y0 + 3) / ROW_H);
      if (idx >= 0 && idx < items.length) {
        if (s.sel === idx) {
          const it = items[idx];
          if (it.onSelect) it.onSelect();
          else if (it.onRight) { it.onRight(); sfx.menuMove(); }
        } else { s.sel = idx; sfx.menuMove(); }
      }
      // back hotspot (top-left)
      if (tap.x < 50 && tap.y < 24) this.close();
    }
  }

  draw(ctx) {
    const s = this.top;
    if (!s) return;
    ctx.fillStyle = 'rgba(8,5,20,0.88)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawText(ctx, '← ' + t('back'), 6, 8, '#8e94a6');
    if (s.title) drawText(ctx, s.title(), VIEW_W / 2, 26, '#ffd042', { align: 'center', scale: 2, shadow: '#181624' });
    if (s.note) drawText(ctx, s.note(), VIEW_W / 2, 48, '#8e94a6', { align: 'center' });

    const items = s.items.filter((i) => !i.hidden || !i.hidden());
    const y0 = s.listY || 70;
    const maxVisible = Math.floor((VIEW_H - y0 - 10) / ROW_H);
    let first = 0;
    if (items.length > maxVisible) first = clamp(s.sel - Math.floor(maxVisible / 2), 0, items.length - maxVisible);
    for (let i = first; i < Math.min(items.length, first + maxVisible); i++) {
      const it = items[i];
      const y = y0 + (i - first) * ROW_H;
      const seld = i === s.sel;
      if (seld) {
        ctx.fillStyle = 'rgba(255,208,66,0.14)';
        ctx.fillRect(VIEW_W / 2 - 150, y - 2, 300, ROW_H - 1);
        drawText(ctx, '▶', VIEW_W / 2 - 146, y, '#ffd042');
      }
      const label = typeof it.label === 'function' ? it.label() : it.label;
      drawText(ctx, label, VIEW_W / 2 - 132, y, seld ? '#fff6ec' : '#c8ceda');
      if (it.value) {
        const v = it.value();
        drawText(ctx, v, VIEW_W / 2 + 146, y, seld ? '#ffd042' : '#8e94a6', { align: 'right' });
      }
    }
    if (items.length > maxVisible) {
      if (first > 0) drawText(ctx, '↑', VIEW_W / 2, y0 - 10, '#8e94a6', { align: 'center' });
      if (first + maxVisible < items.length) drawText(ctx, '↓', VIEW_W / 2, y0 + maxVisible * ROW_H + 2, '#8e94a6', { align: 'center' });
    }
    if (s.drawExtra) s.drawExtra(ctx);
  }
}

// --- Screen builders ----------------------------------------------------------

function volumeRow(labelKey, get, set) {
  const bump = (d) => {
    set(clamp(Math.round((get() + d) * 10) / 10, 0, 1));
  };
  return {
    label: () => t(labelKey),
    value: () => {
      const v = Math.round(get() * 10);
      let bar = '';
      for (let i = 0; i < 10; i++) bar += i < v ? '=' : '-';
      return bar;
    },
    onLeft: () => bump(-0.1),
    onRight: () => bump(0.1),
    onSelect: () => bump(0.1)
  };
}

export function pauseScreen(app, fromMap = false) {
  return {
    title: () => t('paused'),
    items: [
      { label: () => t('continue'), onSelect: () => app.menus.close() },
      { label: () => t('restart_level'), hidden: () => fromMap, onSelect: () => { app.menus.closeAll(); app.retryLevel(false); } },
      { label: () => t('settings'), onSelect: () => app.menus.open(settingsScreen(app)) },
      { label: () => t('quit_to_map'), hidden: () => fromMap, onSelect: () => { app.menus.closeAll(); app.exitToMap(); } },
      { label: () => t('quit_to_title'), onSelect: () => { app.menus.closeAll(); app.toTitle(); } }
    ]
  };
}

export function settingsScreen(app) {
  const st = app.settings;
  return {
    title: () => t('settings'),
    items: [
      volumeRow('music_volume', () => st.musicVol, (v) => { st.musicVol = v; setMusicVolume(v); app.saveSettingsNow(); }),
      volumeRow('sfx_volume', () => st.sfxVol, (v) => { st.sfxVol = v; setSfxVolume(v); sfx.coin(); app.saveSettingsNow(); }),
      {
        label: () => t('language'),
        value: () => LANGS.find((l) => l.id === getLang()).label,
        onLeft: () => app.cycleLang(-1), onRight: () => app.cycleLang(1), onSelect: () => app.cycleLang(1)
      },
      {
        label: () => t('difficulty'),
        value: () => t('diff_' + st.difficulty),
        onLeft: () => app.cycleDifficulty(-1), onRight: () => app.cycleDifficulty(1), onSelect: () => app.cycleDifficulty(1)
      },
      {
        label: () => t('ui_scale'),
        value: () => Math.round(st.uiScale * 100) + '%',
        onLeft: () => { st.uiScale = clamp(st.uiScale - 0.1, 0.7, 1.4); app.applyUiScale(); },
        onRight: () => { st.uiScale = clamp(st.uiScale + 0.1, 0.7, 1.4); app.applyUiScale(); },
        onSelect: () => { st.uiScale = st.uiScale >= 1.4 ? 0.7 : st.uiScale + 0.1; app.applyUiScale(); }
      },
      {
        label: () => t('subtitles'),
        value: () => st.subtitles ? t('on') : t('off'),
        onSelect: () => { st.subtitles = !st.subtitles; app.saveSettingsNow(); },
        onLeft: () => { st.subtitles = !st.subtitles; app.saveSettingsNow(); },
        onRight: () => { st.subtitles = !st.subtitles; app.saveSettingsNow(); }
      },
      {
        label: () => t('screen_shake'),
        value: () => st.screenShake ? t('on') : t('off'),
        onSelect: () => { st.screenShake = !st.screenShake; app.applyShake(); },
        onLeft: () => { st.screenShake = !st.screenShake; app.applyShake(); },
        onRight: () => { st.screenShake = !st.screenShake; app.applyShake(); }
      },
      { label: () => t('controls'), onSelect: () => app.menus.open(controlsScreen(app)) },
      { label: () => t('stats'), onSelect: () => app.menus.open(statsScreen(app)) },
      { label: () => t('cheat_menu'), onSelect: () => app.menus.open(cheatsScreen(app)) },
      { label: () => t('reset_settings'), onSelect: () => { app.resetSettings(); sfx.menuSelect(); } },
      { label: () => t('back'), onSelect: () => app.menus.close() }
    ]
  };
}

export function controlsScreen(app) {
  const screen = {
    title: () => t('controls'),
    note: () => app.remapAction ? t('press_key') : t('remap_hint'),
    items: [],
    listY: 66
  };
  const keyName = (a) => (app.input.keys[a] || []).map((k) => k.replace('Key', '').replace('Arrow', '').replace('Digit', '')).slice(0, 2).join('/');
  for (const a of ACTIONS) {
    screen.items.push({
      label: () => t('act_' + a),
      value: () => (app.remapAction === a ? '...' : keyName(a)),
      onSelect: () => {
        app.remapAction = a;
        app.input.captureNextKey = (code) => {
          if (code) {
            app.input.keys[a] = [code];
            app.settings.keys = app.input.keys;
            app.saveSettingsNow();
          }
          app.remapAction = null;
        };
      }
    });
  }
  screen.items.push({
    label: () => t('reset_controls'),
    onSelect: () => {
      app.input.keys = JSON.parse(JSON.stringify(DEFAULT_KEYS));
      app.settings.keys = null;
      app.saveSettingsNow();
      sfx.menuSelect();
    }
  });
  screen.items.push({ label: () => t('back'), onSelect: () => app.menus.close() });
  return screen;
}

export function statsScreen(app) {
  const s = () => app.save.stats;
  const rows = [
    ['stat_time', () => fmtTime(s().time)],
    ['stat_levels', () => String(Object.keys(app.save.cleared).length)],
    ['stat_gems', () => String(Object.keys(app.save.gems).length)],
    ['stat_coins', () => String(s().coins)],
    ['stat_enemies', () => String(s().enemies)],
    ['stat_deaths', () => String(s().deaths)],
    ['stat_jumps', () => String(s().jumps)]
  ];
  return {
    title: () => t('stats'),
    items: rows.map(([k, v]) => ({ label: () => t(k), value: v })).concat([
      { label: () => t('back'), onSelect: () => app.menus.close() }
    ])
  };
}

export function cheatsScreen(app) {
  const items = CHEAT_ITEMS.map((c) => {
    if (c.type === 'toggle') {
      return {
        label: () => t(c.key),
        value: () => (app.cheats[c.id] ? t('on') : t('off')),
        onSelect: () => { app.cheats[c.id] = !app.cheats[c.id]; sfx.cheat(); },
        onLeft: () => { app.cheats[c.id] = !app.cheats[c.id]; sfx.cheat(); },
        onRight: () => { app.cheats[c.id] = !app.cheats[c.id]; sfx.cheat(); }
      };
    }
    if (c.type === 'cycle_power') {
      return {
        label: () => t(c.key),
        value: () => t('pw_' + SPAWNABLE_POWERS[app.cheatPowerIdx]).split(' ')[0],
        onLeft: () => { app.cheatPowerIdx = (app.cheatPowerIdx + SPAWNABLE_POWERS.length - 1) % SPAWNABLE_POWERS.length; },
        onRight: () => { app.cheatPowerIdx = (app.cheatPowerIdx + 1) % SPAWNABLE_POWERS.length; },
        onSelect: () => { app.cheatSpawnPower(); sfx.cheat(); }
      };
    }
    return {
      label: () => t(c.key),
      value: () => '!',
      onSelect: () => { c.run(app); sfx.cheat(); }
    };
  });
  items.push({ label: () => t('cheat_done'), onSelect: () => app.menus.close() });
  return {
    title: () => t('cheats_title'),
    note: () => t('cheats_note'),
    items,
    listY: 62
  };
}

// --- Title screen (custom draw) --------------------------------------------------
export function titleScreen(app) {
  let tt = 0;
  return {
    items: [],
    updateCustom(dt, inp) {
      tt += dt;
      if (inp.anyKeyPressed || inp.pressed('jump') || inp.pressed('pause')) {
        sfx.menuSelect();
        app.toSaveSelect();
      }
      return true;
    },
    drawExtra: null,
    drawCustom(ctx) {
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      g.addColorStop(0, '#1a0a2e'); g.addColorStop(0.6, '#4a2050'); g.addColorStop(1, '#8a3060');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      // stars
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % VIEW_W, sy = (i * 53) % 140;
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(tt * 2 + i);
        ctx.fillStyle = '#fff6ec';
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.globalAlpha = 1;
      // distant dragon silhouette circling
      ctx.fillStyle = '#141020';
      const dx = VIEW_W / 2 + Math.cos(tt * 0.3) * 150, dy = 60 + Math.sin(tt * 0.6) * 16;
      ctx.fillRect(dx - 8, dy, 16, 4);
      ctx.fillRect(dx - 14 + Math.sin(tt * 6) * 2, dy - 3, 7, 3);
      ctx.fillRect(dx + 7 + Math.sin(tt * 6 + 1) * 2, dy - 3, 7, 3);
      // ground
      ctx.fillStyle = '#241430';
      ctx.fillRect(0, 200, VIEW_W, 40);
      ctx.fillStyle = '#38204a';
      for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(i * 50, 205, 14, Math.PI, 0); ctx.fill(); }
      // cherry petals
      for (let i = 0; i < 16; i++) {
        const px = (i * 61 + Math.sin(tt + i) * 40 + tt * 12) % VIEW_W;
        const py = (i * 37 + tt * (16 + (i % 4) * 6)) % VIEW_H;
        ctx.fillStyle = i % 2 ? '#ff9ac0' : '#ffd9f0';
        ctx.fillRect(px, py, 2, 2);
      }
      // Polina
      const img = getSprite('polina_victory');
      ctx.drawImage(img, VIEW_W / 2 - 18, 148 + Math.sin(tt * 2) * 2, 36, 48);
      // title
      const ty = 52 + Math.sin(tt * 1.6) * 2;
      drawText(ctx, t('title'), VIEW_W / 2 + 2, ty + 2, '#5c1030', { align: 'center', scale: 3 });
      drawText(ctx, t('title'), VIEW_W / 2, ty, '#ffd042', { align: 'center', scale: 3 });
      drawText(ctx, t('subtitle'), VIEW_W / 2, ty + 28, '#ff9ac0', { align: 'center', shadow: '#181624' });
      if (Math.floor(tt * 1.6) % 2 === 0) {
        drawText(ctx, app.input.usedTouchEver ? t('press_start') : t('press_start_key'), VIEW_W / 2, 208, '#fff6ec', { align: 'center', shadow: '#181624' });
      }
      drawText(ctx, t('copyright'), VIEW_W / 2, 228, '#8e94a6', { align: 'center' });
    }
  };
}

// --- Save select (custom draw) -----------------------------------------------------
export function saveSelectScreen(app) {
  let sel = 0;
  let confirmDelete = -1;
  let holdT = 0;
  return {
    items: [],
    updateCustom(dt, inp) {
      const sums = app.slotSummaries();
      if (confirmDelete >= 0) {
        if (inp.pressed('jump')) { app.deleteSlot(confirmDelete); confirmDelete = -1; sfx.breakBlock(); }
        else if (inp.pressed('pause') || inp.pressed('roll') || inp.pressed('attack')) { confirmDelete = -1; sfx.menuBack(); }
        for (const tap of inp.taps) {
          if (tap.y > 150 && tap.y < 180) {
            if (tap.x < VIEW_W / 2) { app.deleteSlot(confirmDelete); sfx.breakBlock(); }
            confirmDelete = -1;
          }
        }
        return true;
      }
      if (inp.pressed('left')) { sel = (sel + 2) % 3; sfx.menuMove(); }
      if (inp.pressed('right')) { sel = (sel + 1) % 3; sfx.menuMove(); }
      if (inp.pressed('jump')) { sfx.menuSelect(); app.pickSlot(sel); }
      if (inp.pressed('pause')) { app.toTitle(); }
      // hold attack to delete
      if (inp.down('attack') && sums[sel]) {
        holdT += dt;
        if (holdT > 1.0) { confirmDelete = sel; holdT = 0; }
      } else holdT = 0;
      for (const tap of inp.taps) {
        for (let i = 0; i < 3; i++) {
          const x0 = 30 + i * 130;
          if (tap.x >= x0 && tap.x <= x0 + 116 && tap.y >= 60 && tap.y <= 190) {
            if (sel === i) { sfx.menuSelect(); app.pickSlot(i); }
            else { sel = i; sfx.menuMove(); }
          }
        }
        if (tap.x < 50 && tap.y < 24) app.toTitle();
      }
      this.sel = sel;
      this.holdT = holdT;
      this.confirmDelete = confirmDelete;
      return true;
    },
    drawCustom(ctx) {
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      drawText(ctx, '← ' + t('back'), 6, 8, '#8e94a6');
      drawText(ctx, t('select_save'), VIEW_W / 2, 24, '#ffd042', { align: 'center', scale: 2, shadow: '#181624' });
      const sums = app.slotSummaries();
      for (let i = 0; i < 3; i++) {
        const x0 = 30 + i * 130, y0 = 60;
        const selected = i === sel;
        ctx.fillStyle = selected ? 'rgba(255,208,66,0.16)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(x0, y0, 116, 130);
        ctx.strokeStyle = selected ? '#ffd042' : '#555b6e';
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, 115, 129);
        drawText(ctx, t('slot') + ' ' + (i + 1), x0 + 58, y0 + 8, selected ? '#ffd042' : '#c8ceda', { align: 'center' });
        const s = sums[i];
        if (!s) {
          drawText(ctx, t('empty_slot'), x0 + 58, y0 + 60, '#8e94a6', { align: 'center' });
        } else {
          const img = getSprite('polina_idle');
          ctx.drawImage(img, x0 + 52, y0 + 22);
          drawText(ctx, t('world_short') + s.world + ' · ' + t('w' + s.world).slice(0, 12), x0 + 58, y0 + 46, '#fff6ec', { align: 'center' });
          drawText(ctx, '♥×' + s.lives, x0 + 58, y0 + 62, '#ff9ac0', { align: 'center' });
          drawText(ctx, '◆ ' + s.gems, x0 + 58, y0 + 74, '#7ae0f0', { align: 'center' });
          drawText(ctx, t('time_played') + ' ' + fmtTime(s.time), x0 + 58, y0 + 86, '#c8ceda', { align: 'center' });
          drawText(ctx, t('completion') + ' ' + s.cleared + '/' + app.totalLevels, x0 + 58, y0 + 98, '#c8ceda', { align: 'center' });
        }
      }
      if (confirmDelete >= 0) {
        ctx.fillStyle = 'rgba(8,5,20,0.9)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        drawText(ctx, t('confirm_delete'), VIEW_W / 2, 120, '#e04050', { align: 'center', scale: 2, shadow: '#181624' });
        drawText(ctx, '(A) ' + t('yes') + '    (B) ' + t('no'), VIEW_W / 2, 160, '#fff6ec', { align: 'center' });
      } else if (sums[sel]) {
        const pct = Math.min(1, holdT / 1.0);
        if (pct > 0.05) {
          ctx.fillStyle = '#e04050';
          ctx.fillRect(VIEW_W / 2 - 60, 210, 120 * pct, 4);
        }
        drawText(ctx, t('delete_save') + ' (B)', VIEW_W / 2, 200, '#8e94a6', { align: 'center' });
      }
    }
  };
}
