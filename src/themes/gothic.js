// Gothic: organ, choir, bells and stone, for dark fantasy menus, vampire and cathedral settings. Elegant
// dark, never horror: the pipes and voices carry the big moments, stone and candle carry the small ones.
// Voicing: D minor (D E F G A Bb C). Pitched sounds sit on a D or an A inside each sound's range; the choir amen and the
// organ are transposed into D with their key controls, so a session agrees. The frequent moments
// (click, hover, type, scroll) stay at or under -23 dBFS.
export default {
  id: 'gothic',
  name: 'Gothic',
  desc: 'Organ, choir, bells and stone for dark fantasy, cathedrals and candlelit menus: elegant and brooding, never cheap horror.',
  moments: {
    // a knock on old stone, a candle's breath
    click: { sound: 'dark-stone-click', params: { pitch: 146.83, weight: 0.4 } },
    hover: { sound: 'dark-candle-flicker', params: { breath: 0.35, flutter: 0.4, warmth: 0.7 } },
    select: { sound: 'dark-stone-click', params: { pitch: 110, weight: 0.6 } },
    tooltip: { sound: 'dark-candle-flicker', params: { breath: 0.25, flutter: 0.2, warmth: 0.8 } },
    'toggle-on': { sound: 'ui-checkbox', params: { on: 1, pitch: 587.33, bright: 0.25 } },
    'toggle-off': { sound: 'ui-checkbox', params: { on: 0, pitch: 587.33, bright: 0.25 } },
    type: { sound: 'ui-key-light', params: { pitch: 146.83, bright: 0.2, size: 0 } },
    // a stone slab drawn aside, and set back
    open: { sound: 'dark-crypt-open', params: { open: 1, weight: 0.4, length: 0.4 } },
    close: { sound: 'dark-crypt-open', params: { open: 0, weight: 0.4, length: 0.35 } },
    transition: { sound: 'game-whoosh', params: { length: 0.45, pitch: 0.6, q: 1.2 } },
    scroll: { sound: 'ui-scroll-detent', params: { pitch: 440, ticks: 1 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 293.66, lift: 0.3, air: 0.3 } },
    drop: { sound: 'ui-drag-drop', params: { pitch: 146.83, bounce: 0.1, snap: 0.2 } },
    delete: { sound: 'ui-delete', params: { crunch: 4, pitch: 146.83, weight: 0.5 } },
    // the choir closes on D minor (iv to i); an achievement lifts it to the major
    success: { sound: 'dark-choir-amen', params: { key: 5, voices: 5, light: 0, length: 0.4 } },
    achievement: { sound: 'dark-choir-amen', params: { key: 5, voices: 8, light: 1, length: 0.8 } },
    'load-complete': { sound: 'dark-choir-amen', params: { key: 5, voices: 4, light: 0, length: 0.2 } },
    error: { sound: 'dark-cello-stab', params: { pitch: 73.42, clash: 1, grit: 0.5, length: 0.4 } },
    warning: { sound: 'dark-bell-knell', params: { pitch: 220, ring: 0.4, strike: 0.55, room: 0.3 } },
    notify: { sound: 'dark-bell-knell', params: { pitch: 293.66, ring: 0.5, strike: 0.4, room: 0.45 } },
    message: { sound: 'dark-bell-knell', params: { pitch: 440, ring: 0.3, strike: 0.3, room: 0.35 } },
    reminder: { sound: 'dark-bell-knell', params: { pitch: 220, ring: 0.7, strike: 0.3, room: 0.5 } },
    timer: { sound: 'dark-slow-clock', params: { tempo: 1, case: 0.6, room: 0.4 } },
    critical: { sound: 'dark-doom-drum', params: { pitch: 73.42, mallet: 0.5, space: 0.4 } },
    // the big moments: pipes, voices and the tower bell
    reveal: { sound: 'dark-cathedral-choir', params: { key: 0, singers: 8, vowel: 0, space: 0.45 } },
    scare: { sound: 'dark-organ-minor', params: { key: 0, stops: 2, tremulant: 0.5, space: 0.5 } },
    music: { sound: 'dark-organ-minor', params: { key: 0, stops: 1, tremulant: 0.2, space: 0.4 } },
    victory: { sound: 'dark-organ-minor', params: { key: 0, stops: 2, tremulant: 0, space: 0.45 } },
    'game-over': { sound: 'dark-funeral-bell', params: {} },
    ambience: { sound: 'dark-monk-chant', params: { key: 0, singers: 4, room: 0.5 } },
    tension: { sound: 'dark-cello-drone', params: { key: 0, players: 4, grit: 0.3, shiver: 0 } },
    'level-down': { sound: 'dark-dread-descent', params: { speed: 0.2, rise: 0, edge: 0.4, length: 3 } },
    door: { sound: 'dark-door-creak', params: { length: 2, pitch: 0.8, close: 1 } },
    explosion: { sound: 'dark-doom-drum', params: { pitch: 55, mallet: 0.7, space: 0.45 } },
    // game moments kept low and in D
    'level-up': { sound: 'magic-enchant', params: { pitch: 293.66, notes: 7, speed: 0.07, glow: 0.5, space: 0.5 } },
    'power-up': { sound: 'magic-charge-up', params: { length: 0.8, pitch: 293.66, shimmer: 0.4, space: 0.4 } },
    heal: { sound: 'magic-healing-shimmer', params: { pitch: 293.66, swell: 0.35, sparkle: 0.4, space: 0.5 } },
    spell: { sound: 'magic-spell-cast', params: { pitch: 587.33, gather: 0.4, bloom: 0.5, space: 0.5 } },
    debuff: { sound: 'magic-curse-hex', params: { pitch: 73.42, dread: 0.7, whisper: 0.5, space: 0.4 } },
    hit: { sound: 'game-sword-clash', params: { pitch: 1174.66, ring: 0.4, scrape: 0.4 } },
    attack: { sound: 'game-sword-swing', params: { length: 0.2, pitch: 0.8, edge: 0.4 } },
    damage: { sound: 'game-punch', params: { hits: 1, pitch: 110, snap: 0.3 } },
    pickup: { sound: 'game-gem-collect', params: { pitch: 1174.66, ring: 0.5, gap: 0.09, sparkle: 0.3 } },
    coin: { sound: 'game-coin-flip', params: { spins: 3, pitch: 1174.66, ring: 0.4 } },
    footstep: { sound: 'game-footstep-soft', params: { weight: 0.6, surface: 0.2, length: 0.12 } },
    teleport: { sound: 'magic-teleport', params: { pitch: 587.33, gap: 0.18, reach: 1.5, space: 0.5 } },
    step: { sound: 'ui-step-advance', params: { pitch: 293.66 } },
  },
};
