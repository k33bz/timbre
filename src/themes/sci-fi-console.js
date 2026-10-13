// Sci-fi Console: terminal blips, scanners and synthetic confirmations, for a ship's bridge or a
// hacker's terminal. Bitcrushed squares and FM chirps for the machine talking, clean sine and triangle
// for the interface.
// Voicing: A minor pentatonic (A C D E G), the beeps on A5 and E6, the drones low. The frequent
// moments (click, hover, type, scroll) are short ticks at or under -23 dBFS; the bitcrushed sounds
// (blips, data streams) are kept for readouts, copies and screen changes.
export default {
  id: 'sci-fi-console',
  name: 'Sci-fi Console',
  desc: 'Terminal blips, scanner sweeps and synthetic confirmations: bitcrushed beeps and clean digital tones.',
  moments: {
    click: { sound: 'ui-click-crisp', params: { pitch: 3800, snap: 0.3, body: 0.1 } },
    hover: { sound: 'ui-hover-tick', params: { pitch: 3520, air: 0.3 } },
    // two sine plucks a fifth apart going up, a single falling one going down
    'toggle-on': { sound: 'ui-checkbox', params: { on: 1, pitch: 1174.66, bright: 0.9 } },
    'toggle-off': { sound: 'ui-checkbox', params: { on: 0, pitch: 880, bright: 0.9 } },
    type: { sound: 'ui-slider-detent', params: { pitch: 1500, pos: 0, edge: 0.1 } },
    open: { sound: 'ui-modal', params: { open: 1, pitch: 130.81, air: 0.3, shine: 0.8 } },
    close: { sound: 'ui-modal', params: { open: 0, pitch: 130.81, air: 0.3, shine: 0.8 } },
    transition: { sound: 'scifi-data-stream', params: { ticks: 14, length: 0.35, pitch: 1200, spread: 0.5, grit: 0.6 } },
    scroll: { sound: 'ui-slider-detent', params: { pitch: 880, pos: 0.5, edge: 0.3 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 523.25, lift: 0.8, air: 0.2 } },
    drop: { sound: 'ui-drag-drop', params: { pitch: 130.81, bounce: 0, snap: 0.8 } },
    tooltip: { sound: 'ui-tooltip-pop', params: { pitch: 1760, rise: 0.6, shimmer: 1 } },
    copy: { sound: 'scifi-data-stream', params: { ticks: 10, length: 0.3, pitch: 1567.98, spread: 0.3, grit: 0.5 } },
    undo: { sound: 'ui-undo', params: { pitch: 880, speed: 40, settle: 0.5 } },
    // a short spin-down with a clunk at the end
    delete: { sound: 'scifi-power-down', params: { length: 0.5, pitch: 160, ticks: 3, bright: 0.5 } },
    send: { sound: 'notify-upload-done', params: { pitch: 659.25, rise: 0.1, ring: 0.2, shimmer: 0.7 } },
    refresh: { sound: 'notify-sync-done', params: { pitch: 523.25, cycles: 2, speed: 0.07, shimmer: 0.6 } },
    // A5 then E6, with a sine shimmer an octave above the second tone
    success: { sound: 'notify-success-chime', params: { pitch: 880, interval: 7, gap: 0.12, shimmer: 0.4 } },
    error: { sound: 'notify-error-buzz', params: { pitch: 150, pulses: 3, rough: 0.9, tone: 1800 } },
    warning: { sound: 'scifi-alert-siren', params: { pitch: 440, cycles: 1, interval: 7, rate: 0.2, tone: 2000 } },
    info: { sound: 'scifi-terminal-blip', params: { count: 1, pitch: 1174.66, grit: 0.3 } },
    notify: { sound: 'scifi-hologram-flicker', params: { pitch: 880, flickers: 3, glitch: 0.3, length: 0.55 } },
    message: { sound: 'scifi-robot-chirp', params: { pitch: 880, chirps: 2, mood: 0.8, speed: 0.08 } },
    reminder: { sound: 'notify-mention', params: { pitch: 880, glass: 0.2, ring: 0.3, echo: 0.5 } },
    timer: { sound: 'game-countdown-beep', params: { chip: 1, go: 1, pitch: 880, length: 0.14 } },
    countdown: { sound: 'game-countdown-beep', params: { chip: 1, go: 0, pitch: 880, length: 0.1 } },
    'power-up': { sound: 'scifi-power-up', params: { length: 0.8, pitch: 110, ticks: 9, bright: 0.5 } },
    'power-down': { sound: 'scifi-power-down', params: { length: 0.8, pitch: 110, ticks: 7, bright: 0.5 } },
    shield: { sound: 'scifi-shield-hum', params: { pitch: 110, pulse: 5, bright: 0.5, length: 1 } },
    shoot: { sound: 'scifi-laser-zap', params: { pitch: 2400, drop: 0.85, shots: 1, edge: 0.5 } },
    teleport: { sound: 'scifi-warp-jump', params: { charge: 0.5, pitch: 90, boom: 0.6, tail: 0.5 } },
    readout: { sound: 'scifi-terminal-blip', params: { count: 3, pitch: 1174.66, speed: 0.055, grit: 0.5 } },
    scan: { sound: 'scifi-scanner-sweep', params: { pitch: 440, sweeps: 1, length: 0.5, wobble: 0.5 } },
    scare: { sound: 'music-mystery-sting', params: { key: 0, eerie: 0.6 } },
    ambience: { sound: 'ambience-space-drone', params: { length: 6, pitch: 55, tone: 0.4, shimmer: 0.4 } },
    // boot chime: a major-seventh chord on C over the A minor drones
    music: { sound: 'music-intro-logo', params: { key: 0, shine: 0.7, space: 0.5 } },
    // the ship's computer: the announcer a semitone up, so its voice sits on A2, a little flatter
    announce: { sound: 'voice-system-online', params: { voice: 0, pitch: 1, rate: 1, range: 0.8 } },
  },
};
