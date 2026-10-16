// Arcade: punchy, bright game feedback and big wins. A cabinet in a loud room: bright bloops, ringing
// pings, brass fanfares, a real boom.
// Voicing: key of C, bell and triangle voices (the chip switches stay off, that is the 8-bit theme),
// notes from C5 up to C6 with the fanfares an octave under. The frequent moments (click, hover,
// type, scroll) stay at or under -23 dBFS; the wins, the coin, the teleport, the explosion, the
// knockout and the critical alarm are the loudest things in the set, between -14 and -16 dBFS.
export default {
  id: 'arcade',
  name: 'Arcade',
  desc: 'Punchy, bright game feedback and big wins: sharp clicks, ringing pings, brass fanfares, a real boom.',
  moments: {
    click: { sound: 'ui-radio-select', params: { pitch: 783.99, bloop: 0.8, round: 0.2 } },
    hover: { sound: 'ui-hover-tick', params: { pitch: 5200, air: 0.6 } },
    'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, pitch: 3000, gap: 0.06, body: 0.6 } },
    'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, pitch: 3000, gap: 0.06, body: 0.6 } },
    type: { sound: 'ui-key-mechanical', params: { pitch: 3520, click: 0.9, thock: 0.5 } },
    open: { sound: 'ui-expand', params: { open: 1, steps: 5, gap: 0.025, pitch: 523.25 } },
    close: { sound: 'ui-expand', params: { open: 0, steps: 3, gap: 0.025, pitch: 523.25 } },
    transition: { sound: 'game-whoosh', params: { length: 0.3, pitch: 1.2, q: 1.4 } },
    // the menu cursor
    scroll: { sound: 'ui-slider-detent', params: { pitch: 880, pos: 0, edge: 0.7 } },
    // an octave leap: C5 to C6, the bright "yes"
    success: { sound: 'notify-success-chime', params: { pitch: 523.25, interval: 12, gap: 0.08, shimmer: 0.6 } },
    // the game-show buzzer
    error: { sound: 'notify-error-buzz', params: { pitch: 130, pulses: 3, rough: 0.9, tone: 2200 } },
    warning: { sound: 'scifi-alert-siren', params: { pitch: 698.46, cycles: 1, interval: 7, rate: 0.2, tone: 2500 } },
    notify: { sound: 'notify-mention', params: { pitch: 1318.5, glass: 0.8, ring: 0.35, echo: 0.35 } },
    // player up: a bright swoop and a C major arpeggio to C6
    'your-turn': { sound: 'game-your-turn', params: { chip: 0, pitch: 523.25, notes: 4, gap: 0.045, hold: 0.24 } },
    message: { sound: 'notify-message-in', params: { pitch: 659.25, interval: 7, gap: 0.08, pop: 0.8 } },
    timer: { sound: 'notify-alarm', params: { pitch: 880, rounds: 3, pace: 0.12, swell: 0.2 } },
    countdown: { sound: 'game-countdown-beep', params: { chip: 0, go: 0, pitch: 880, length: 0.12 } },
    achievement: { sound: 'music-ta-da', params: { key: 0, tempo: 1.2, sparkle: 0.9, weight: 0.7 } },
    'level-up': { sound: 'game-power-up', params: { chip: 0, notes: 8, pitch: 261.63, gap: 0.045 } },
    'power-up': { sound: 'game-power-up', params: { chip: 0, notes: 5, pitch: 523.25, gap: 0.035 } },
    victory: { sound: 'music-fanfare-short', params: { key: 0, tempo: 1.1, brass: 0.8, weight: 0.8 } },
    'game-over': { sound: 'music-defeat-jingle', params: { key: 0, tempo: 1, droop: 0.8, tone: 0.6 } },
    hit: { sound: 'game-punch', params: { hits: 2, pitch: 150, snap: 0.8, gap: 0.07 } },
    damage: { sound: 'game-hurt', params: { chip: 0, pitch: 300, drop: 0.5, length: 0.2 } },
    attack: { sound: 'game-sword-swing', params: { length: 0.15, pitch: 1.3, edge: 0.7 } },
    pickup: { sound: 'game-pickup-item', params: { chip: 0, pitch: 784, interval: 12, gap: 0.05 } },
    coin: { sound: 'game-coin-flip', params: { spins: 3, pitch: 1567.98, ring: 0.45 } },
    heal: { sound: 'game-heal', params: { pitch: 523.25, length: 0.5, rise: 4, glow: 0.8 } },
    jump: { sound: 'game-jump', params: { chip: 0, pitch: 262, rise: 3, length: 0.16 } },
    footstep: { sound: 'game-footstep-hard', params: { surface: 0.8, weight: 0.3, pitch: 1.1 } },
    shoot: { sound: 'scifi-laser-zap', params: { pitch: 2400, drop: 0.85, shots: 1, edge: 0.7 } },
    explosion: { sound: 'game-explosion-soft', params: { size: 0.6, pitch: 60, soften: 0.8, crackle: 0.6 } },
    shield: { sound: 'game-shield-up', params: { pitch: 196, length: 0.4, shimmer: 0.8, lock: 0.8 } },
    teleport: { sound: 'magic-teleport', params: { pitch: 800, gap: 0.12, reach: 1.6, space: 0.2 } },
    scare: { sound: 'music-alert-sting', params: { key: 0, stabs: 3, edge: 0.6, tempo: 1.2 } },
    music: { sound: 'music-menu-confirm', params: { key: 0, notes: 4, speed: 1.3, echo: 0.8 } },
    critical: { sound: 'notify-critical', params: { pitch: 261.63, stabs: 3, rough: 0.6, sub: 0.6 } },
    // three falling steps E5, D5, C5 under a closing filter, the last one sagging
    'level-down': { sound: 'notify-low-battery', params: { pitch: 659.25, steps: 3, gap: 0.15, tone: 2500 } },
    // a C6 ping; the host raises streak per point and the pings climb the pentatonic
    score: { sound: 'game-combo-ping', params: { chip: 0, pitch: 1046.5, streak: 1, ring: 0.3 } },
    ability: { sound: 'battle-ability', params: { pitch: 523.25, power: 0.6, ring: 0.22 } },
    // C6 and C7 bells on top of the hit
    crit: { sound: 'battle-weakness-bell', params: { pitch: 1046.5, ring: 0.22, air: 0.5 } },
    knockout: { sound: 'battle-ko', params: { pitch: 261.63, weight: 0.4, crack: 0.3 } },
    // dizzy stars, the cartoon status
    debuff: { sound: 'battle-status-confusion', params: { wobble: 9, stars: 3 } },
    // a column of light rising from C4 an octave; the host passes up 0 for the fall
    transform: { sound: 'battle-evolve', params: { up: 1, pitch: 261.63, shimmer: 0.6 } },
    // the cabinet's marquee striking up
    'neon-on': { sound: 'fx-neon-strike', params: { flickers: 4, pitch: 120, buzz: 0.5, length: 0.5 } },
  },
};
