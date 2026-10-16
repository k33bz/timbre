// Fantasy: spells, chimes and parchment, for game menus and role-playing games. Harps and bells in a
// stone hall, a quill, a fireball, a brass horn.
// Voicing: key of D (D E F# A B). Pitched sounds are set on D4, D5 or A5, and the fanfare, the
// game-over, the mystery sting and the title logo are transposed up two semitones with their key
// control, so a whole session agrees. The card-duel and battle moments keep to D too: the Gold ink
// signature sits on D4, the lore chimes and the weakness bells on D6. The frequent moments (click,
// hover, type, scroll) stay at or under -23 dBFS.
export default {
  id: 'fantasy',
  name: 'Fantasy',
  desc: 'Spells, chimes and parchment for game menus and role-playing games: harps, bells, a quill and a fireball.',
  moments: {
    click: { sound: 'ui-click-wood', params: { pitch: 587.33, ring: 0.5, hollow: 0.5 } },
    hover: { sound: 'ui-hover-tick', params: { pitch: 2349.32, air: 0.8 } },
    // two harp plucks a fifth apart (D5 and A5) turning on, one falling pluck turning off
    'toggle-on': { sound: 'ui-checkbox', params: { on: 1, pitch: 587.33, bright: 0.7 } },
    'toggle-off': { sound: 'ui-checkbox', params: { on: 0, pitch: 587.33, bright: 0.7 } },
    // a quill on parchment
    type: { sound: 'ui-key-light', params: { pitch: 293.66, bright: 0.8, size: 0 } },
    // parchment unrolled, then rolled back up a little faster and duller
    open: { sound: 'ui-page-turn', params: { length: 0.3, rustle: 0.8, bright: 0.6 } },
    close: { sound: 'ui-page-turn', params: { length: 0.16, rustle: 0.3, bright: 0.2 } },
    transition: { sound: 'game-whoosh', params: { length: 0.4, pitch: 0.7, q: 1.6 } },
    scroll: { sound: 'ui-scroll-detent', params: { pitch: 587.33, ticks: 1 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 293.66, lift: 0.4, air: 0.4 } },
    drop: { sound: 'ui-drag-drop', params: { pitch: 146.83, bounce: 0.2, snap: 0.2 } },
    delete: { sound: 'ui-delete', params: { crunch: 4, pitch: 146.83, weight: 0.3 } },
    // three bells fanning up D, A, D: a quest saved
    success: { sound: 'game-checkpoint', params: { pitch: 293.66, spread: 0.07, ring: 0.6 } },
    // a low toll with the sour interval taken down and the whispers almost gone
    error: { sound: 'magic-curse-hex', params: { pitch: 73.42, dread: 0.3, whisper: 0.2, space: 0.2 } },
    // a horn call falling a fifth, A4 to D4
    warning: { sound: 'notify-warning', params: { pitch: 440, drop: 7, gap: 0.2, tone: 1500 } },
    notify: { sound: 'notify-reminder', params: { pitch: 587.33, drop: 7, ring: 0.8, space: 0.45 } },
    // your move at the table: two bright mallet strokes, D5 up to F#5
    'your-turn': { sound: 'cards-your-turn', params: { pitch: 587.33, interval: 4, bright: 0.6, ring: 0.45 } },
    // a letter arrives: a swish and two bells, D5 and A5
    message: { sound: 'notify-new-mail', params: { pitch: 587.33, interval: 7, swish: 0.6, ring: 0.5 } },
    // a lute: A4 up a fourth to D5
    reminder: { sound: 'notify-calendar', params: { pitch: 440, interval: 5, gap: 0.18, bright: 0.3, tick: 0.4 } },
    achievement: { sound: 'notify-achievement', params: { pitch: 587.33, sparkle: 0.8, space: 0.5 } },
    // a harp glissando into a bell
    'level-up': { sound: 'magic-enchant', params: { pitch: 293.66, notes: 7, speed: 0.06, glow: 0.7, space: 0.4 } },
    'power-up': { sound: 'magic-charge-up', params: { length: 0.8, pitch: 293.66, shimmer: 0.6, space: 0.3 } },
    heal: { sound: 'magic-healing-shimmer', params: { pitch: 293.66, swell: 0.35, sparkle: 0.7, space: 0.45 } },
    victory: { sound: 'music-fanfare-short', params: { key: 2, tempo: 0.95, brass: 0.6, weight: 0.7 } },
    'game-over': { sound: 'music-defeat-jingle', params: { key: 2, tempo: 0.9, droop: 0.7, tone: 0.4 } },
    hit: { sound: 'game-sword-clash', params: { pitch: 1174.66, ring: 0.5, scrape: 0.3 } },
    attack: { sound: 'game-sword-swing', params: { length: 0.17, pitch: 1, edge: 0.5 } },
    damage: { sound: 'game-punch', params: { hits: 1, pitch: 110, snap: 0.4 } },
    pickup: { sound: 'game-gem-collect', params: { pitch: 1174.66, ring: 0.5, gap: 0.08, sparkle: 0.6 } },
    coin: { sound: 'game-coin-flip', params: { spins: 4, pitch: 1174.66, ring: 0.4 } },
    footstep: { sound: 'game-footstep-soft', params: { weight: 0.4, surface: 0.3, length: 0.1 } },
    shoot: { sound: 'game-arrow-shot', params: { pitch: 146.83, flight: 0.22, twang: 0.7 } },
    explosion: { sound: 'magic-fire-spell', params: { heat: 0.6, length: 0.8, crackle: 0.6, weight: 0.5 } },
    door: { sound: 'game-door-open', params: { pitch: 146.83, length: 0.8, creak: 0.6 } },
    spell: { sound: 'magic-spell-cast', params: { pitch: 587.33, gather: 0.2, bloom: 0.7, space: 0.4 } },
    sparkle: { sound: 'magic-sparkle', params: { notes: 5, pitch: 1174.66, gap: 0.05, shimmer: 0.6, space: 0.35 } },
    teleport: { sound: 'magic-teleport', params: { pitch: 587.33, gap: 0.16, reach: 1.5, space: 0.4 } },
    scare: { sound: 'music-mystery-sting', params: { key: 2, eerie: 0.6 } },
    dice: { sound: 'cards-dice-roll', params: { surface: 0.5 } },
    ambience: { sound: 'ambience-fire-crackle', params: { length: 6, crackle: 0.6, roar: 0.4, tone: 0.4 } },
    music: { sound: 'music-intro-logo', params: { key: 2, shine: 0.8, space: 0.55 } },
    // a chord on D4 falling away an octave
    'level-down': { sound: 'battle-evolve', params: { up: 0, pitch: 293.66, length: 0.6, shimmer: 0.5 } },
    // the Gold ink signature already sits on D4: plucks climbing into a warm pair of bells
    ability: { sound: 'duel-ink-gold', params: { pitch: 1, glow: 0.5, space: 0.3 } },
    // a reedy swell rising a fifth, D3 to A3
    transform: { sound: 'duel-shift-swell', params: { up: 1, pitch: 146.83, swell: 0.32, land: 0.6 } },
    // a potion gone bad: bubbles from D4
    debuff: { sound: 'battle-status-poison', params: { pitch: 293.66, bubbles: 4 } },
    // D6 and D7 bells over the blow
    crit: { sound: 'battle-weakness-bell', params: { pitch: 1174.66, ring: 0.25, air: 0.5 } },
    knockout: { sound: 'battle-ko', params: { pitch: 146.83, weight: 0.3, crack: 0.2 } },
    // lore: glass chimes climbing from D6
    score: { sound: 'duel-lore-gain', params: { lore: 2, pitch: 1174.7, shine: 0.5 } },
    // a bead of ink into the well, D5
    resource: { sound: 'duel-well-drip', params: { pitch: 587.33, glass: 0.5, pool: 0.5 } },
    'card-tap': { sound: 'duel-exert-tilt', params: { on: 1, weight: 0.5, tone: 0.5 } },
    // a quest log: one note per step up the D pentatonic
    step: { sound: 'ui-step-advance', params: { pitch: 293.66 } },
    // gold counted out at the shop: three coins ringing up from D7
    purchase: { sound: 'battle-coin-chain', params: { flips: 3, heads: 3, gap: 0.08, pitch: 2349.32 } },
  },
};
