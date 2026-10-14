// 8-bit: chiptune. Square and triangle voices, bitcrushed blips, and the chip switch turned on
// wherever a sound offers one.
// Voicing: key of C major (C E G triads). The beeps sit on C5, G5 and C6 and the jingles are in C.
// The frequent moments (click, hover, type, scroll) are short square beeps and triangle ticks at or
// under -23 dBFS, and so are select, progress and the loading blink. The catalog has no chiptune
// delete or undo, so those moments are left out, and the game-over is the nearest thing (a dark
// saw-brass jingle), not a true chip sound.
export default {
  id: '8-bit',
  name: '8-bit',
  desc: 'Chiptune: square and triangle beeps, bitcrushed blips and arpeggio jingles in C major.',
  moments: {
    // a 60 ms square beep at C6
    click: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 1046.5, length: 0.06 } },
    hover: { sound: 'ui-slider-detent', params: { pitch: 1318.51, pos: 0, edge: 0 } },
    // a high beep up, a low beep down
    'toggle-on': { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 1046.5, length: 0.07 } },
    'toggle-off': { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 523.25, length: 0.09 } },
    type: { sound: 'ui-slider-detent', params: { pitch: 1000, pos: 0, edge: 0.3 } },
    // a staircase of triangle steps (the console's triangle channel): up to open, down to close
    open: { sound: 'ui-expand', params: { open: 1, steps: 4, gap: 0.03, pitch: 392 } },
    close: { sound: 'ui-expand', params: { open: 0, steps: 4, gap: 0.03, pitch: 392 } },
    transition: { sound: 'scifi-data-stream', params: { ticks: 16, length: 0.3, pitch: 1046.5, spread: 0.4, grit: 0.8 } },
    scroll: { sound: 'ui-slider-detent', params: { pitch: 784, pos: 0, edge: 0.3 } },
    copy: { sound: 'game-pickup-item', params: { chip: 1, pitch: 987.77, interval: 7, gap: 0.045 } },
    send: { sound: 'game-jump', params: { chip: 1, pitch: 523.25, rise: 2, length: 0.1 } },
    refresh: { sound: 'scifi-data-stream', params: { ticks: 22, length: 0.5, pitch: 1046.5, spread: 0.6, grit: 0.8 } },
    success: { sound: 'music-menu-confirm', params: { key: 0, notes: 3, speed: 1.5, echo: 0.2 } },
    // the square buzzer: low, rough and short
    error: { sound: 'notify-error-buzz', params: { pitch: 120, pulses: 2, rough: 1, tone: 3000 } },
    // triangle channel, C5 down a fourth to G4
    warning: { sound: 'notify-warning', params: { pitch: 523.25, drop: 5, tone: 4000 } },
    info: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 783.99, length: 0.12 } },
    notify: { sound: 'game-combo-ping', params: { chip: 1, pitch: 659.25, streak: 1, ring: 0.35 } },
    message: { sound: 'game-pickup-item', params: { chip: 1, pitch: 659.25, interval: 5, gap: 0.06 } },
    reminder: { sound: 'music-menu-confirm', params: { key: 0, notes: 2, speed: 1.1, echo: 0.6 } },
    timer: { sound: 'game-countdown-beep', params: { chip: 1, go: 1, pitch: 880, length: 0.14 } },
    countdown: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 880, length: 0.14 } },
    achievement: { sound: 'music-menu-confirm', params: { key: 0, notes: 4, speed: 1.5, echo: 0.7 } },
    hit: { sound: 'game-hit-light', params: { pitch: 330, snap: 1, body: 0.3 } },
    damage: { sound: 'game-hurt', params: { chip: 1, pitch: 300, drop: 0.5, length: 0.2 } },
    pickup: { sound: 'game-pickup-item', params: { chip: 1, pitch: 523.25, interval: 7, gap: 0.05 } },
    // one short high ping (E6), louder than the two-note pickup blip
    coin: { sound: 'game-combo-ping', params: { chip: 1, pitch: 1318.5, streak: 1, ring: 0.18 } },
    'level-up': { sound: 'game-power-up', params: { chip: 1, notes: 8, pitch: 261.63, gap: 0.05 } },
    'power-up': { sound: 'game-power-up', params: { chip: 1, notes: 5, pitch: 392, gap: 0.04 } },
    heal: { sound: 'game-heal', params: { pitch: 392, length: 0.4, rise: 4, glow: 0 } },
    victory: { sound: 'music-victory-jingle', params: { key: 0, crunch: 0.6, bass: 0.6 } },
    // the nearest thing the catalog has to a chiptune game over: a saw brass kept dark
    'game-over': { sound: 'music-defeat-jingle', params: { key: 0, tempo: 1.2, droop: 0.5, tone: 0.2 } },
    jump: { sound: 'game-jump', params: { chip: 1, pitch: 262, rise: 2.6, length: 0.16 } },
    shoot: { sound: 'scifi-laser-zap', params: { pitch: 2093, drop: 0.85, shots: 1, edge: 0.8 } },
    explosion: { sound: 'game-explosion-soft', params: { size: 0.5, pitch: 80, soften: 0.7, crackle: 1 } },
    readout: { sound: 'scifi-terminal-blip', params: { count: 4, pitch: 1046.5, speed: 0.06, grit: 0.8 } },
    scare: { sound: 'music-alert-sting', params: { key: 0, stabs: 2, edge: 0.8 } },
    // text-box talk: square beeps on the pentatonic scale, moved down 2.94 semitones from the voice's
    // 620 Hz so the scale sits on C5
    dialogue: { sound: 'voice-babble-beep', params: { pitch: -2.94, speed: 1, spread: 1 } },
    // the alarm is already square stabs: a C4 run of three with the sub low
    critical: { sound: 'notify-critical', params: { pitch: 261.63, stabs: 3, rough: 1, sub: 0.4 } },
    // two quick triangle steps down from A5
    dismiss: { sound: 'ui-expand', params: { open: 0, steps: 2, gap: 0.02, pitch: 783.99 } },
    // a G5 beep, a fifth under the click
    select: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 783.99, length: 0.06 } },
    // the catalog has no chip loop cell: loading is one short C5 beep re-triggered every 0.5 s,
    // thinking a slow run of three crushed computer beeps re-triggered every 1 s
    loading: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 523.25, length: 0.06 } },
    thinking: { sound: 'scifi-terminal-blip', params: { count: 3, pitch: 523.25, speed: 0.1, grit: 0.9 } },
    // the triangle tick climbs an octave from C5 with pos, the fill of the bar
    progress: { sound: 'ui-slider-detent', params: { pitch: 523.25, edge: 0.1 } },
    // two square notes landing on C6
    'load-complete': { sound: 'game-pickup-item', params: { chip: 1, pitch: 783.99, interval: 5, gap: 0.04 } },
    // the open run played backwards and slower: A5, G5, E5, D5, C5
    'level-down': { sound: 'ui-expand', params: { open: 0, steps: 5, gap: 0.05, pitch: 523.25 } },
    // the go tone up an octave, short: a square stab on C7 with its fifth
    crit: { sound: 'game-countdown-beep', params: { chip: 1, go: 1, pitch: 1046.5, length: 0.06 } },
    knockout: { sound: 'game-hurt', params: { chip: 1, pitch: 261.63, drop: 0.7, length: 0.3 } },
    // a C6 square ping; the host raises streak per point and the pings climb the pentatonic
    score: { sound: 'game-combo-ping', params: { chip: 1, pitch: 1046.5, streak: 1, ring: 0.25 } },
    glitch: { sound: 'fx-glitch-burst', params: { harsh: 0.8, pitch: 523.25, slices: 3, split: 0.3 } },
  },
};
