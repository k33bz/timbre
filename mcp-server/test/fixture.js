// A synthetic catalog for tests that need exact answers while the real catalog keeps growing.
//
// Every fixture sound has metadata written here (id, name, tags, description, duration, category),
// so what a search should find never depends on how the real sounds are tagged. Its code (play,
// params, helper list) is borrowed from a real sound of the same shape, and the helper sources come
// from the real catalog, so Copy and kits built from the fixture are real, runnable code. The
// template's own family, moments, measured levels and fingerprint are dropped: they describe the
// real sound, not the fixture one (tests that need them set their own).
import fs from 'node:fs';
import path from 'node:path';
import { REAL_CATALOG, tmpDir, writeCatalog } from './helper.js';

export function realManifest() {
  return JSON.parse(fs.readFileSync(path.join(REAL_CATALOG, 'manifest.json'), 'utf8'));
}

const clone = (o) => JSON.parse(JSON.stringify(o));

/** [id, template sound id, category, name, tags, desc, dur] */
const SOUNDS = [
  ['ui-click-soft', 'ui-click-soft', 'ui', 'Soft Click', ['click', 'button', 'tap', 'tick', 'press'], 'A short muted tick for button presses.', 0.08],
  ['ui-toggle-switch', 'ui-toggle-switch', 'ui', 'Toggle Switch', ['toggle', 'switch', 'checkbox', 'on', 'off', 'click'], 'A two-stage click-clack for switches, rising on and falling off.', 0.25],
  ['ui-hover-tick', 'ui-click-soft', 'ui', 'Hover Tick', ['hover', 'tick', 'light', 'focus'], 'A barely-there tick as the pointer moves over a control.', 0.05],
  ['notify-error-buzz', 'notify-error-buzz', 'notify', 'Error Buzz', ['error', 'fail', 'invalid', 'denied', 'buzz', 'negative'], 'A low falling double buzz for a rejected action.', 0.45],
  ['notify-success-chime', 'notify-success-chime', 'notify', 'Success Chime', ['success', 'done', 'complete', 'confirm', 'chime', 'positive'], 'A gentle two-note rising chime for a completed action.', 0.5],
  ['notify-warning-double', 'notify-error-buzz', 'notify', 'Warning Double', ['warning', 'alert', 'caution', 'double'], 'Two even beeps that ask for attention without alarm.', 0.5],
  ['notify-message-pop', 'magic-sparkle', 'notify', 'Message Pop', ['message', 'pop', 'chat', 'incoming', 'ping'], 'A soft pop for an incoming chat message.', 0.4],
  ['game-coin-flip', 'game-coin-flip', 'game', 'Coin Flip', ['coin', 'flip', 'toss', 'spin', 'money', 'ping'], 'A coin spun into the air, then a bright ping when it lands.', 1.5],
  ['game-hammer-hit', 'game-hammer-hit', 'game', 'Hammer Hit', ['hammer', 'hit', 'impact', 'metal', 'clank', 'smash'], 'A hammer landing on metal: air, then a clank with a thump under it.', 0.95],
  ['game-whoosh', 'game-whoosh', 'game', 'Whoosh', ['whoosh', 'swoosh', 'swing', 'swipe', 'dash', 'air', 'transition'], 'Air rushing past: a swing, a dash, or a panel sliding across.', 0.62],
  ['game-laser-zap', 'game-whoosh', 'game', 'Laser Zap', ['laser', 'zap', 'shoot', 'blaster'], 'A bright falling zap for a shot fired.', 0.4],
  ['cards-flick', 'cards-flick', 'cards', 'Card Flick', ['card', 'flick', 'paper', 'draw', 'deal', 'snap'], 'A playing card flicked off the deck, or a short fan of them.', 0.65],
  ['cards-riffle', 'cards-riffle', 'cards', 'Deck Riffle', ['card', 'deck', 'riffle', 'shuffle', 'paper', 'bridge'], 'A deck riffled together: a quick ripple of paper ticks.', 0.55],
  ['magic-sparkle', 'magic-sparkle', 'magic', 'Magic Sparkle', ['magic', 'sparkle', 'shimmer', 'twinkle', 'fairy', 'heal', 'bonus'], 'A rising twinkle of bright notes over a breath of shimmer.', 1.5],
  ['scifi-console-beep', 'ui-click-soft', 'scifi', 'Console Beep', ['console', 'beep', 'hud', 'terminal', 'computer'], 'A clipped beep from a ship console.', 0.2],
  ['scifi-power-hum', 'magic-sparkle', 'scifi', 'Power Hum', ['power', 'hum', 'engine', 'reactor', 'startup'], 'A rising hum as a reactor spins up.', 2],
  ['ambience-room-tone', 'game-whoosh', 'ambience', 'Room Tone', ['room', 'ambient', 'tone', 'background', 'air'], 'A faint bed of air for a quiet room.', 6],
  ['music-win-jingle', 'notify-success-chime', 'music', 'Win Jingle', ['win', 'jingle', 'fanfare', 'victory', 'melody'], 'A four note jingle for winning a round.', 2],
];

/** The synthetic manifest: 18 sounds in all eight categories except none empty, two themes. */
export function fixtureManifest() {
  const real = realManifest();
  const by = (id) => {
    const s = real.sounds.find((x) => x.id === id);
    if (!s) throw new Error(`the fixture borrows code from ${id}, which the real catalog no longer has`);
    return s;
  };
  const sounds = SOUNDS.map(([id, from, category, name, tags, desc, dur]) => {
    const { family, moments, levels, fingerprint, ...t } = clone(by(from));
    return { ...t, id, name, category, tags, desc, dur, file: `src/sounds/${category}/${id}.js` };
  });
  return {
    name: 'Timbre',
    version: '0.0.0-test',
    schema: 1,
    count: sounds.length,
    categories: ['ui', 'notify', 'game', 'cards', 'magic', 'scifi', 'ambience', 'music'],
    sounds,
    themes: [
      {
        id: 'soft-ui', name: 'Soft UI', desc: 'Quiet, rounded feedback for productivity apps.', file: 'src/themes/soft-ui.js',
        moments: {
          click: { sound: 'ui-click-soft' },
          'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, body: 0.4 } },
          'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, body: 0.4 } },
          success: { sound: 'notify-success-chime', params: { shimmer: 0.25 } },
          error: { sound: 'notify-error-buzz', params: { pulses: 2, rough: 0.35, tone: 900 } },
          notify: { sound: 'magic-sparkle', params: { notes: 3, pitch: 880, gap: 0.07, space: 0.2 } },
        },
      },
      {
        id: 'arcade', name: 'Arcade', desc: 'Bright, chunky feedback for games.', file: 'src/themes/arcade.js',
        moments: {
          click: { sound: 'ui-click-soft', params: { pitch: 1800 } },
          coin: { sound: 'game-coin-flip', params: { spins: 3 } },
          hit: { sound: 'game-hammer-hit' },
          victory: { sound: 'music-win-jingle' },
        },
      },
    ],
    helpers: clone(real.helpers),
  };
}

/** Write the synthetic catalog to a temporary directory and return its path. */
export function fixtureDir() {
  return writeCatalog(tmpDir('timbre-fixture-'), fixtureManifest());
}
