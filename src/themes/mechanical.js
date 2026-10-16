// Mechanical: switches, ratchets, relays and a typewriter bell. Clicky, dry and precise.
// Voicing: the clicks are bandpassed noise and short bells with nothing sustained. The few tonal
// sounds are bells and plucks in C major (the alarm is G5 and B5, the rest sit on C, D, E and A), so
// the dings agree with each other. Frequent moments (click, hover, type, scroll) sit between -22 and
// -28 dBFS, with the counter tick and the gauge needle; the loading ratchet is a little quieter.
export default {
  id: 'mechanical',
  name: 'Mechanical',
  desc: 'Switches, ratchets, relays and a typewriter bell: clicky, dry and precise.',
  moments: {
    click: { sound: 'ui-click-crisp', params: { pitch: 3200, snap: 0.4, body: 0.2 } },
    hover: { sound: 'ui-slider-detent', params: { pitch: 1500, pos: 0, edge: 0.1 } },
    'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, pitch: 2800, gap: 0.07, body: 0.35 } },
    'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, pitch: 2800, gap: 0.07, body: 0.35 } },
    type: { sound: 'ui-key-mechanical', params: { pitch: 3520, click: 0.8, thock: 0.6 } },
    // a drawer on a ratchet: four quick steps up to open, three down to close
    open: { sound: 'ui-expand', params: { open: 1, steps: 4, gap: 0.025, pitch: 523.25 } },
    close: { sound: 'ui-expand', params: { open: 0, steps: 3, gap: 0.025, pitch: 523.25 } },
    transition: { sound: 'ui-menu-slide', params: { open: 1, size: 0.9, tone: 0.25 } },
    scroll: { sound: 'ui-scroll-detent', params: { pitch: 800, ticks: 1 } },
    drag: { sound: 'ui-click-crisp', params: { pitch: 1800, snap: 0.3, body: 0.8 } },
    drop: { sound: 'ui-click-deep', params: { pitch: 140, click: 0.6, length: 0.3 } },
    tooltip: { sound: 'ui-hover-tick', params: { pitch: 2600, air: 0.1 } },
    copy: { sound: 'cards-chip-click', params: { pitch: 2500, ring: 0.05, weight: 0.4 } },
    // a tape rewinding: the fastest flutter the undo sound has
    undo: { sound: 'ui-undo', params: { pitch: 1000, speed: 46, settle: 0.7 } },
    delete: { sound: 'ui-click-deep', params: { pitch: 95, click: 1, length: 0.7 } },
    // a carriage return: a quick rising ratchet
    send: { sound: 'cards-fan', params: { cards: 8, length: 0.22, bright: 0.8 } },
    refresh: { sound: 'cards-timer-tick', params: { beats: 3, gap: 0.25, pitch: 1900, tone: 0.9 } },
    // a key turns, the bolt drops and a small bell rings
    success: { sound: 'game-key-unlock', params: { jingles: 2, pitch: 3000, clunk: 0.4, ding: 0.8 } },
    error: { sound: 'notify-error-buzz', params: { pitch: 110, pulses: 2, rough: 1, tone: 2500 } },
    warning: { sound: 'notify-warning', params: { pitch: 523.25, drop: 5, tone: 3000 } },
    // the typewriter bell (C6), one short ding
    info: { sound: 'notify-info', params: { pitch: 1046.5, decay: 0.5, bright: 0.9 } },
    notify: { sound: 'notify-reminder', params: { pitch: 880, drop: 7, gap: 0.2, ring: 0.5, space: 0 } },
    // your move: two hard, dry strikes, E5 up to A5
    'your-turn': { sound: 'cards-your-turn', params: { pitch: 659.25, interval: 5, bright: 0.9, ring: 0.2 } },
    reminder: { sound: 'notify-calendar', params: { pitch: 440, interval: 5, gap: 0.14, bright: 0.6, tick: 1 } },
    // a wind-up alarm clock: one short burst of bell
    timer: { sound: 'notify-incoming-call', params: { pitch: 783.99, rate: 14, rings: 1, tone: 3000 } },
    countdown: { sound: 'cards-timer-tick', params: { beats: 1, pitch: 2000, tone: 1 } },
    'power-up': { sound: 'scifi-power-up', params: { length: 0.6, pitch: 130, ticks: 8, bright: 0.5 } },
    'power-down': { sound: 'scifi-power-down', params: { length: 0.6, ticks: 6 } },
    door: { sound: 'game-key-unlock', params: { jingles: 3, pitch: 2400, clunk: 1, ding: 0.1 } },
    hit: { sound: 'game-hammer-hit', params: { swing: 0.15, pitch: 800, weight: 0.2, ring: 0.1 } },
    chips: { sound: 'cards-chip-stack', params: { chips: 5, pace: 0.06, pitch: 2300 } },
    dice: { sound: 'cards-dice-shake', params: { shakes: 3, dice: 2, pitch: 1.1 } },
    ambience: { sound: 'ambience-room-hum', params: { length: 6, pitch: 60, buzz: 0.5, air: 0.3 } },
    // a fire bell: the alarm clock's bell (G5 and B5) ringing hard, three bursts
    critical: { sound: 'notify-incoming-call', params: { pitch: 783.99, rate: 16, rings: 3, tone: 3500 } },
    // a dater stamp, dry ink
    stamp: { sound: 'ui-stamp', params: { weight: 0.4, ink: 0.2, pitch: 130.81 } },
    // a cash register: a short ratchet, the drawer stop and the margin bell on E7
    purchase: { sound: 'ui-typewriter-bell', params: { slide: 0.12, pitch: 2637.02, ring: 0.3, bell: 1 } },
    // a line typed out ends on the carriage return and the bell on C7
    'type-out': { sound: 'ui-typewriter-bell', params: { slide: 0.22, pitch: 2093, ring: 0.38, bell: 0.7 } },
    // a fine ratchet turning once, re-triggered every 1 s
    loading: { sound: 'data-spinner-ticks', params: { steps: 12, pitch: 523.25, tone: 1, width: 0.2 } },
    // the needle swings up the dial and settles on a detent
    progress: { sound: 'data-gauge-needle', params: { sweep: 0.3, swing: 0.2, pitch: 261.63 } },
    // the dry wheel click of a counter
    'data-tick': { sound: 'data-counter-tick', params: { pitch: 1046.5, click: 1 } },
    // the ticks climb from C6 to A6
    'count-up': { sound: 'data-count-up', params: { pitch: 1046.5, rise: 9, thunk: 0.6 } },
    // a departures board: rows of hard plastic flaps clattering into their new order
    sort: { sound: 'data-split-flap', params: { digits: 6, cards: 4, tone: 0.8 } },
  },
};
