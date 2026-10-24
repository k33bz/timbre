// Dread: strings, heartbeat and sub hits, for horror games and anything that should feel watched. The
// small moments are dull and close (stone, breath, a muffled latch); the big ones are the horror score:
// screeching strings, the braam, the sub drop, the jump scare.
// Voicing: C, with the minor second (Db) as the house interval. Pitched sounds sit on a C or a G inside each sound's range; the
// frequent moments (click, hover, type, scroll) stay at or under -23 dBFS.
export default {
  id: 'dread',
  name: 'Dread',
  desc: 'Strings, heartbeat and sub hits for horror games and anything that should feel watched: dull, close small sounds and a horror score for the big ones.',
  moments: {
    click: { sound: 'dark-stone-click', params: { pitch: 90, weight: 0.7 } },
    hover: { sound: 'dark-candle-flicker', params: { breath: 0.3, flutter: 0.7, warmth: 0.2 } },
    select: { sound: 'dark-stone-click', params: { pitch: 75, weight: 0.8 } },
    tooltip: { sound: 'dark-candle-flicker', params: { breath: 0.2, flutter: 0.5, warmth: 0.2 } },
    'toggle-on': { sound: 'ui-checkbox', params: { on: 1, pitch: 523.25, bright: 0.1 } },
    'toggle-off': { sound: 'ui-checkbox', params: { on: 0, pitch: 523.25, bright: 0.1 } },
    type: { sound: 'ui-key-light', params: { pitch: 196, bright: 0.15, size: 0 } },
    open: { sound: 'dark-crypt-open', params: { open: 1, weight: 0.8, length: 0.6 } },
    close: { sound: 'dark-crypt-open', params: { open: 0, weight: 0.8, length: 0.5 } },
    transition: { sound: 'dark-sub-drop', params: { depth: 0.4, length: 0.9, impact: 0.3 } },
    scroll: { sound: 'ui-scroll-detent', params: { pitch: 392, ticks: 1 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 261.63, lift: 0.2, air: 0.2 } },
    drop: { sound: 'ui-drag-drop', params: { pitch: 98, bounce: 0.05, snap: 0.3 } },
    delete: { sound: 'ui-delete', params: { crunch: 5, pitch: 98, weight: 0.8 } },
    // relief is brief and minor; only a real win turns major
    success: { sound: 'dark-choir-amen', params: { key: 3, voices: 4, light: 0, length: 0.3 } },
    'load-complete': { sound: 'dark-choir-amen', params: { key: 3, voices: 3, light: 0, length: 0.15 } },
    achievement: { sound: 'dark-choir-amen', params: { key: 3, voices: 6, light: 1, length: 0.6 } },
    error: { sound: 'dark-cello-stab', params: { pitch: 65.41, clash: 1, grit: 0.9, length: 0.5 } },
    warning: { sound: 'dark-cello-stab', params: { pitch: 98, clash: 6, grit: 0.6, length: 0.3 } },
    critical: { sound: 'dark-horror-strings', params: { pitch: 620, cluster: 1, shiver: 1, length: 1.4 } },
    notify: { sound: 'dark-bell-knell', params: { pitch: 196, ring: 0.3, strike: 0.6, room: 0.3 } },
    message: { sound: 'dark-bell-knell', params: { pitch: 261.63, ring: 0.2, strike: 0.5, room: 0.25 } },
    reminder: { sound: 'dark-bell-knell', params: { pitch: 196, ring: 0.6, strike: 0.4, room: 0.4 } },
    timer: { sound: 'dark-slow-clock', params: { tempo: 1.2, case: 0.7, room: 0.2 } },
    loading: { sound: 'dark-tense-ostinato', params: { tempo: 110, pitch: 0, intensity: 0.3 } },
    // the horror score
    tension: { sound: 'dark-heartbeat', params: {} },
    scare: { sound: 'dark-jump-scare', params: { punch: 0.8, pitch: 520, tail: 0.6 } },
    reveal: { sound: 'dark-doom-braam', params: { pitch: 41, weight: 0.7, length: 1.8 } },
    music: { sound: 'dark-music-box', params: { key: 0, wind: 0.8, detune: 0.6, room: 0.35 } },
    ambience: { sound: 'dark-haunted-corridor', params: {} },
    door: { sound: 'dark-door-creak', params: { length: 2.8, pitch: 0.7, close: 1 } },
    'game-over': { sound: 'dark-dread-descent', params: { speed: 0.25, rise: 0, edge: 0.5, length: 4 } },
    'level-down': { sound: 'dark-sub-drop', params: { depth: 0.8, length: 1.6, impact: 0.6 } },
    explosion: { sound: 'dark-doom-drum', params: { pitch: 55, mallet: 0.8, space: 0.4 } },
    victory: { sound: 'dark-choir-amen', params: { key: 3, voices: 8, light: 1, length: 1 } },
    // game moments: heavy and close
    hit: { sound: 'dark-doom-drum', params: { pitch: 90, mallet: 0.9, space: 0.15 } },
    damage: { sound: 'dark-cello-stab', params: { pitch: 82.41, clash: 1, grit: 0.8, length: 0.2 } },
    attack: { sound: 'game-sword-swing', params: { length: 0.22, pitch: 0.6, edge: 0.3 } },
    debuff: { sound: 'magic-curse-hex', params: { pitch: 98, dread: 0.9, whisper: 0.7, space: 0.3 } },
    heal: { sound: 'magic-healing-shimmer', params: { pitch: 261.63, swell: 0.3, sparkle: 0.2, space: 0.4 } },
    pickup: { sound: 'game-pickup-item', params: {} },
    footstep: { sound: 'game-footstep-soft', params: { weight: 0.7, surface: 0.6, length: 0.12 } },
    step: { sound: 'ui-step-advance', params: { pitch: 392 } },
  },
};
