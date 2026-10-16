// Wood and Paper: warm, tactile and organic. Wooden knocks and blocks, cards and paper, a clock tick,
// a drawer that creaks. Nothing electronic.
// Voicing: key of C, notes between G4 and G5 on mallets and plucks; the rest is noise and thumps, so
// the pitched sounds carry the key and the tactile ones stay out of the way. Frequent moments (click,
// hover, type, scroll) sit between -23 and -30 dBFS, and so do select, the counter tick, the clock
// that marks loading and the card tap. The rubber stamp is the one thump that rises above the rest.
export default {
  id: 'wood-and-paper',
  name: 'Wood and Paper',
  desc: 'Warm, tactile and organic: wood knocks, cards and paper, a ticking clock, a creaking drawer.',
  moments: {
    click: { sound: 'ui-click-wood', params: { pitch: 783.99, ring: 0.25, hollow: 0.4 } },
    // a muffled pat of felt on wood: the hover tick would be a glass sine here
    hover: { sound: 'cards-place', params: { weight: 0, tone: 0.6, drop: 0 } },
    // a peg pressed in (E5) and pulled out (A4): two pitches of the same hollow tok
    'toggle-on': { sound: 'cards-piece-move', params: { pitch: 659.25, hollow: 0.6, slide: 0.03 } },
    'toggle-off': { sound: 'cards-piece-move', params: { pitch: 440, hollow: 0.6, slide: 0.03 } },
    type: { sound: 'ui-key-light', params: { pitch: 220, bright: 0.3, size: 0 } },
    // a wooden drawer: it creaks out (a short, dry hinge) and shuts with a soft thud
    open: { sound: 'game-door-open', params: { pitch: 130, length: 0.4, creak: 0.3 } },
    close: { sound: 'ui-drag-drop', params: { pitch: 130, bounce: 0, snap: 0.7 } },
    transition: { sound: 'ui-page-turn', params: { length: 0.3, rustle: 0.6, bright: 0.4 } },
    scroll: { sound: 'ui-scroll-detent', params: { pitch: 523.25, ticks: 1 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 330, lift: 0.3, air: 0.25 } },
    drop: { sound: 'ui-drag-drop', params: { pitch: 220, bounce: 0.5, snap: 0.2 } },
    tooltip: { sound: 'ui-tap', params: { pitch: 500, pat: 0.2, soft: 0.5 } },
    // two quick flicks: a duplicate
    copy: { sound: 'cards-flick', params: { count: 2, gap: 0.07, bright: 0 } },
    // a card slid back toward you
    undo: { sound: 'cards-slide', params: { rise: 1, length: 0.2, pitch: 1, grit: 0.3 } },
    delete: { sound: 'ui-delete', params: { crunch: 4, pitch: 130.81, weight: 0.6 } },
    send: { sound: 'cards-discard', params: { toss: 0.6, pile: 0.3, weight: 0.4 } },
    refresh: { sound: 'cards-riffle', params: { cards: 6 } },
    // a two-note mallet, C5 up to G5
    success: { sound: 'cards-your-turn', params: { pitch: 523.25, interval: 7, bright: 0.35, ring: 0.35 } },
    // one dull thunk: the wooden way to say no
    error: { sound: 'ui-click-deep', params: { pitch: 100, click: 0.8, length: 0.8 } },
    warning: { sound: 'notify-warning', params: { pitch: 392, drop: 3, tone: 1200 } },
    info: { sound: 'ui-click-wood', params: { pitch: 880, ring: 0.7, hollow: 0.7 } },
    notify: { sound: 'notify-double-tap', params: { pitch: 330, taps: 2 } },
    // your move: two soft mallet strokes on wood, A4 up to E5 (success climbs C5 to G5)
    'your-turn': { sound: 'cards-your-turn', params: { pitch: 440, interval: 7, bright: 0.25, ring: 0.3 } },
    message: { sound: 'cards-deal', params: { reach: 0.2, tone: 0.5, land: 0.5 } },
    // plucked strings, G4 up a fourth to C5
    reminder: { sound: 'notify-calendar', params: { pitch: 392, interval: 5, gap: 0.18, bright: 0.3, tick: 0.6 } },
    // a small kitchen bell: E5 then C5
    timer: { sound: 'notify-reminder', params: { pitch: 659.25, drop: 4, ring: 0.6, space: 0.1 } },
    achievement: { sound: 'music-level-complete', params: { key: 0, tempo: 1.2, sparkle: 0.3, space: 0.25 } },
    pickup: { sound: 'cards-piece-move', params: { pitch: 520, hollow: 0.5, slide: 0.08 } },
    hit: { sound: 'cards-piece-capture', params: { pitch: 450, force: 0.5, scatter: 0.3 } },
    footstep: { sound: 'game-footstep-hard', params: { surface: 0.2, weight: 0.4, pitch: 0.9 } },
    door: { sound: 'game-door-open', params: { pitch: 110, length: 0.8, creak: 0.6 } },
    'card-draw': { sound: 'cards-draw' },
    'card-flip': { sound: 'cards-flip' },
    shuffle: { sound: 'cards-shuffle-overhand' },
    dice: { sound: 'cards-dice-roll', params: { surface: 0.6 } },
    chips: { sound: 'cards-chip-stack', params: { chips: 4, pace: 0.07, pitch: 1800 } },
    ambience: { sound: 'ambience-fire-crackle', params: { length: 6, crackle: 0.5, roar: 0.3, tone: 0.4 } },
    // a card slid away from you (undo slides it back)
    dismiss: { sound: 'cards-slide', params: { rise: 0, length: 0.18, pitch: 1, grit: 0.3 } },
    // one card flicked over, like an index tab
    select: { sound: 'cards-flick', params: { count: 1, bright: 0.2 } },
    stamp: { sound: 'ui-stamp', params: { weight: 0.3, ink: 0.4, pitch: 130.81 } },
    // a wooden clock, tick and tock, re-triggered every 0.9 s while it waits
    loading: { sound: 'cards-timer-tick', params: { beats: 2, gap: 0.45, pitch: 1200, tone: 0.2 } },
    // the dry wheel click of a counter, G5
    'data-tick': { sound: 'data-counter-tick', params: { pitch: 783.99, click: 1 } },
    // a cardboard flip board rolling over
    'count-up': { sound: 'data-split-flap', params: { digits: 3, cards: 5, tone: 0 } },
    // marimba bars climbing the pentatonic from G4
    'chart-reveal': { sound: 'data-bar-rise', params: { bars: 5, pitch: 392, climb: 0.75 } },
    'card-tap': { sound: 'cards-tap', params: { on: 1, weight: 0.5, tone: 0.4 } },
    // a card laid in the resource row with a low thunk
    resource: { sound: 'cards-land', params: { onto: 0, weight: 0.4, tone: 0.6 } },
    // wooden chips knocked out one by one, climbing from G4, without the glass ping
    score: { sound: 'duel-bag-resolve', params: { count: 3, gap: 0.14, pitch: 392, ping: 0 } },
  },
};
