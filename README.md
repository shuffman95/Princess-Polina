# Princess Polina 👑🐉

An original retro platformer built as an installable Progressive Web App.
Princess Polina sets out to free the kingdom of Zarya from Ivan, an enormous
ancient dragon, across nine hand-crafted worlds.

Everything in this game is original: the code, the pixel art, the level
designs, the chiptune soundtrack, the sound effects, the characters and the
story. It is inspired by the *feel* of classic 8-bit platformers while being
entirely its own game.

## Playing

Serve the repository root over HTTP(S) and open it in a browser:

```bash
npx serve .          # or: python3 -m http.server
```

- **iPhone / iPad**: open in Safari, then *Share → Add to Home Screen* for
  fullscreen play. The game is landscape-only and works fully offline after
  the first load.
- **Desktop**: works in any modern browser (handy for testing).
- **Controllers**: Bluetooth gamepads are supported via the Gamepad API.

### Controls

| Action | Keyboard | Touch | Gamepad |
| --- | --- | --- | --- |
| Move | Arrows / WASD | drag left-side pad | d-pad / stick |
| Jump (hold = higher) | Space / Z / K | A | A |
| Attack / Sprint | Shift / X / J | B | X / B |
| Roll / Air dash | C / L | C | shoulders |
| Pause | Esc / Enter / P | ▌▌ (top right) | Start |

Keys are remappable in **Settings → Controls**.

## Game systems

- **9 worlds** (Emerald Meadows, Ancient Forest, Crystal Caverns, Golden
  Desert, Frozen Peaks, Sky Isles, Haunted Kingdom, Mechanical Citadel,
  Dragon Realm), each with 3 stages + a multi-phase boss.
- **Ability progression**: wall jump, climb, ground pound, roll, swim,
  double jump, air dash and glide — granted by the guardian spirit freed
  after each boss.
- **8 power-ups** that change how you play: Fire Crown, Ice Tiara, Wind
  Cloak, Bear Spirit, Lightning Jewel, Crystal Armor, Shadow Cape, Phoenix
  Feather.
- **17 enemy archetypes** with distinct AI, in per-world palette variants.
- Secrets everywhere: a hidden Ancient Gem in every stage, invisible blocks,
  breakable walls, optional high routes.
- **Full EN / RU localization** (instant switching in Settings), original
  5×7 bitmap font with Latin + Cyrillic.
- 3 save slots with autosave and lifetime statistics.
- Difficulty settings (Relaxed / Classic / Fierce), adjustable touch-control
  size, subtitles, screen-shake toggle, volume sliders.
- A complete **cheat menu** (Settings → Cheat Menu): god mode, fly mode,
  moon gravity, boss rush, level teleport, debug/collision/AI overlays,
  FPS counter and more. All off by default.

## Architecture

No frameworks, no build step, no external assets — plain ES modules,
Canvas 2D and WebAudio. Every sprite is authored as string-art and rasterized
at boot; every tile/background is drawn procedurally per world theme; every
music track is sequenced note data played by a 4-channel chiptune synth
(2 pulse, triangle, noise).

```
index.html            PWA shell (landscape, viewport-locked)
manifest.webmanifest  install metadata
sw.js                 cache-first service worker (offline play)
icons/                generated PNG icons (tools/genicons.mjs)
js/
  main.js             bootstrap + fixed-timestep loop (60 Hz logic)
  engine.js           app state machine, progression, save wiring
  game.js             play state: level, entities, HUD, rules
  player.js           movement, abilities, power-ups
  enemies.js          enemy AI archetypes
  bosses.js           9 multi-phase bosses (incl. Ivan)
  entities.js         items, projectiles, platforms, gates
  leveldata.js        all 36 original maps (segment-composed ASCII)
  levels.js           map parser
  tiles.js            tile behaviors + themed tileset rendering
  backgrounds.js      parallax layers per world
  sprites.js          all pixel art (string-art) + sprite cache
  font.js             5×7 bitmap font (Latin + Cyrillic)
  audio.js            chiptune synth + music sequencer
  music.js            original soundtrack data
  sfx.js              synthesized sound effects
  i18n.js             EN/RU strings
  save.js             slots, settings persistence
  input.js            touch / keyboard / gamepad
  camera.js, particles.js, ui.js, menus.js, worldmap.js,
  story.js, cheats.js, const.js, util.js
```

## Development notes

- `node tools/genicons.mjs` regenerates the PWA icons.
- The game exposes `window.polina` (the app object) for console debugging
  and automated tests.
- Level maps are validated by an automated physics playthrough: a bot that
  only uses the abilities available in each world must be able to finish
  every stage, and every boss must be beatable through its vulnerable
  windows.

## Deploying

Any static host works (GitHub Pages, Netlify, …). For GitHub Pages: serve
the repository root from the `main` branch — no build step is required.
