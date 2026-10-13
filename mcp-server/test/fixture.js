// A synthetic catalog for tests that need exact answers: the repository's helpers and ten seed
// sounds, plus eight more sounds in new categories (cloned recipes with new names and tags), and a
// second theme. Built in memory from catalog/manifest.json, so it always carries helpers that exist.
import fs from 'node:fs';
import path from 'node:path';
import { REAL_CATALOG, tmpDir, writeCatalog } from './helper.js';

export function realManifest() {
  return JSON.parse(fs.readFileSync(path.join(REAL_CATALOG, 'manifest.json'), 'utf8'));
}

const clone = (o) => JSON.parse(JSON.stringify(o));

/** Eight extra sounds built from the seed recipes. */
export function extraSounds(real) {
  const by = (id) => real.sounds.find((s) => s.id === id);
  const make = (from, over) => ({ ...clone(by(from)), file: `src/sounds/${over.category}/${over.id}.js`, ...over });
  return [
    make('ui-click-soft', { id: 'ui-hover-tick', name: 'Hover Tick', category: 'ui', tags: ['hover', 'tick', 'light', 'focus'], desc: 'A barely-there tick as the pointer moves over a control.', dur: 0.05 }),
    make('notify-error-buzz', { id: 'notify-warning-double', name: 'Warning Double', category: 'notify', tags: ['warning', 'alert', 'caution', 'double'], desc: 'Two even beeps that ask for attention without alarm.', dur: 0.5 }),
    make('magic-sparkle', { id: 'notify-message-pop', name: 'Message Pop', category: 'notify', tags: ['message', 'pop', 'chat', 'incoming', 'ping'], desc: 'A soft pop for an incoming chat message.', dur: 0.4 }),
    make('game-whoosh', { id: 'game-laser-zap', name: 'Laser Zap', category: 'game', tags: ['laser', 'zap', 'shoot', 'blaster'], desc: 'A bright falling zap for a shot fired.', dur: 0.4 }),
    make('ui-click-soft', { id: 'scifi-console-beep', name: 'Console Beep', category: 'scifi', tags: ['console', 'beep', 'hud', 'terminal', 'computer'], desc: 'A clipped beep from a ship console.', dur: 0.2 }),
    make('magic-sparkle', { id: 'scifi-power-hum', name: 'Power Hum', category: 'scifi', tags: ['power', 'hum', 'engine', 'reactor', 'startup'], desc: 'A rising hum as a reactor spins up.', dur: 2 }),
    make('game-whoosh', { id: 'ambience-room-tone', name: 'Room Tone', category: 'ambience', tags: ['room', 'ambient', 'tone', 'background', 'air'], desc: 'A faint bed of air for a quiet room.', dur: 6 }),
    make('notify-success-chime', { id: 'music-win-jingle', name: 'Win Jingle', category: 'music', tags: ['win', 'jingle', 'fanfare', 'victory', 'melody'], desc: 'A four note jingle for winning a round.', dur: 2 }),
  ];
}

/** The synthetic manifest: seed sounds + extras, two themes. */
export function fixtureManifest() {
  const real = realManifest();
  const m = clone(real);
  m.sounds = [...m.sounds, ...extraSounds(real)];
  m.count = m.sounds.length;
  m.categories = ['ui', 'notify', 'game', 'cards', 'magic', 'scifi', 'ambience', 'music'];
  m.themes = [
    ...m.themes,
    {
      id: 'arcade',
      name: 'Arcade',
      desc: 'Bright, chunky feedback for games.',
      moments: {
        click: { sound: 'ui-click-soft', params: { pitch: 1800 } },
        coin: { sound: 'game-coin-flip', params: { spins: 3 } },
        hit: { sound: 'game-hammer-hit' },
        victory: { sound: 'music-win-jingle' },
      },
      file: 'src/themes/arcade.js',
    },
  ];
  return m;
}

/** Write the synthetic catalog to a temporary directory and return its path. */
export function fixtureDir() {
  return writeCatalog(tmpDir('timbre-fixture-'), fixtureManifest());
}
