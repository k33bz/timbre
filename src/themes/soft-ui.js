// Soft UI: quiet, rounded feedback for productivity apps. Nothing here should make a person look up
// from what they are doing.
// Voicing: key of C (pentatonic), notes between C5 and A5, sine and triangle tones, no buzzing or
// clanging. The frequent moments (click, hover, type, scroll) are the quietest sounds in the set,
// between -22 and -32 dBFS; nothing else is louder than -16.
export default {
  id: 'soft-ui',
  name: 'Soft UI',
  desc: 'Quiet, rounded feedback for productivity apps: soft ticks, a gentle chime, a low buzz.',
  moments: {
    click: { sound: 'ui-click-soft' },
    hover: { sound: 'ui-hover-tick', params: { pitch: 2093, air: 0.2 } },
    'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, body: 0.4 } },
    'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, body: 0.4 } },
    type: { sound: 'ui-key-light', params: { pitch: 262, bright: 0.25 } },
    // a dialog and a drawer are the same low swell; the glint is what tells the person it arrived
    open: { sound: 'ui-modal', params: { open: 1, air: 0.3, shine: 0.3 } },
    close: { sound: 'ui-modal', params: { open: 0, air: 0.3, shine: 0.3 } },
    transition: { sound: 'game-whoosh', params: { length: 0.22, pitch: 0.8, q: 0.8 } },
    scroll: { sound: 'ui-slider-detent', params: { pitch: 659.25, pos: 0, edge: 0.25 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 392, lift: 0.4, air: 0.3 } },
    // a fingertip pat, not a thud: the quietest way for something to land
    drop: { sound: 'ui-tap', params: { pitch: 261.63, pat: 0.3, soft: 0.9 } },
    tooltip: { sound: 'ui-tooltip-pop', params: { pitch: 1046.5, rise: 0.3, shimmer: 0.2 } },
    copy: { sound: 'ui-copy', params: { pitch: 1567.98, scoop: 0.3, ring: 0.3 } },
    undo: { sound: 'ui-undo', params: { pitch: 659.25, settle: 0.4 } },
    delete: { sound: 'ui-delete', params: { crunch: 3, pitch: 130.81, weight: 0.4 } },
    send: { sound: 'notify-message-out', params: { pitch: 1046.5, air: 0.35 } },
    refresh: { sound: 'notify-sync-done', params: { pitch: 523.25, cycles: 1, shimmer: 0.25 } },
    success: { sound: 'notify-success-chime', params: { shimmer: 0.25 } },
    error: { sound: 'notify-error-buzz', params: { pulses: 2, rough: 0.35, tone: 900 } },
    // C5 down to A4: a falling minor third is a nudge, not an alarm
    warning: { sound: 'notify-warning', params: { pitch: 523.25, drop: 3, tone: 1400 } },
    info: { sound: 'notify-info', params: { pitch: 880, decay: 0.3, bright: 0.2 } },
    notify: { sound: 'magic-sparkle', params: { notes: 3, pitch: 880, gap: 0.07, space: 0.2 } },
    message: { sound: 'notify-message-in', params: { pitch: 659.25, interval: 5, pop: 0.3 } },
    reminder: { sound: 'notify-reminder', params: { pitch: 659.25, drop: 4, ring: 0.5, space: 0.15 } },
    // the second tone of each pair is a fifth above the first (C5 and G5)
    timer: { sound: 'notify-alarm', params: { pitch: 523.25, rounds: 2, swell: 0.8 } },
    achievement: { sound: 'notify-achievement', params: { pitch: 523.25, sparkle: 0.3, space: 0.25 } },
  },
};
