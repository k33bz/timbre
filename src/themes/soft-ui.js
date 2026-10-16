// Soft UI: quiet, rounded feedback for productivity apps. Nothing here should make a person look up
// from what they are doing.
// Voicing: key of C (pentatonic), notes between C5 and A5, sine and triangle tones, no buzzing or
// clanging. The frequent moments (click, hover, type, scroll) are the quietest sounds in the set,
// between -22 and -32 dBFS, and the ones that repeat while something runs (select, progress, data
// ticks, the loader, thinking, streamed tokens, packets) sit with them; nothing else is louder than
// -16, the critical alarm and the stamp included.
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
    // the pip follows pos, the tab the selection lands on
    select: { sound: 'ui-tab-switch', params: { air: 0.35 } },
    // C5 up the pentatonic, one note per step (523 is the top of the range, a hair under C5)
    step: { sound: 'ui-step-advance', params: { pitch: 523 } },
    // two blips on C5, the start beep a fifth up on G5
    record: { sound: 'ui-record-toggle', params: { pitch: 523.25, length: 0.15 } },
    reveal: { sound: 'ui-wipe', params: { length: 0.34, width: 0.6, tick: 0.3 } },
    // a light office stamp, nearly dry
    stamp: { sound: 'ui-stamp', params: { weight: 0.1, ink: 0.3, pitch: 130.81 } },
    success: { sound: 'notify-success-chime', params: { shimmer: 0.25 } },
    error: { sound: 'notify-error-buzz', params: { pulses: 2, rough: 0.35, tone: 900 } },
    // C5 down to A4: a falling minor third is a nudge, not an alarm
    warning: { sound: 'notify-warning', params: { pitch: 523.25, drop: 3, tone: 1400 } },
    // the one sound here meant to make a person look up: the timer's rounded beeps, higher (A5 and
    // E6), faster and all at full level, still with nothing buzzing
    critical: { sound: 'notify-alarm', params: { pitch: 880, rounds: 3, pace: 0.12, swell: 0 } },
    info: { sound: 'notify-info', params: { pitch: 880, decay: 0.3, bright: 0.2 } },
    notify: { sound: 'magic-sparkle', params: { notes: 3, pitch: 880, gap: 0.07, space: 0.2 } },
    // a shared session hands you the floor (pairing, a whiteboard, a review): two soft mallet
    // notes, C5 up to G5
    'your-turn': { sound: 'cards-your-turn', params: { pitch: 523.25, interval: 7, bright: 0.15, ring: 0.3 } },
    dismiss: { sound: 'notify-toast-out', params: { speed: 1, drain: 0, pat: 0.4 } },
    message: { sound: 'notify-message-in', params: { pitch: 659.25, interval: 5, pop: 0.3 } },
    // E5 up a fourth to A5 coming online, one E5 sagging away going offline
    presence: { sound: 'notify-presence', params: { pitch: 659.25, glow: 0.4 } },
    reminder: { sound: 'notify-reminder', params: { pitch: 659.25, drop: 4, ring: 0.5, space: 0.15 } },
    // the second tone of each pair is a fifth above the first (C5 and G5)
    timer: { sound: 'notify-alarm', params: { pitch: 523.25, rounds: 2, swell: 0.8 } },
    achievement: { sound: 'notify-achievement', params: { pitch: 523.25, sparkle: 0.3, space: 0.25 } },
    // loading and thinking are loop cells: a C5 breath re-triggered every 0.9 s, three dots
    // (C5, D5, E5) re-triggered every 1.2 s
    loading: { sound: 'data-load-pulse', params: { breath: 0.9, pitch: 523.25, tone: 0.3, wobble: 0.3 } },
    // a smooth glide from C5 (empty) to A5 (full), played on each update with pos
    progress: { sound: 'data-progress-fill', params: { pitch: 523.25, span: 9, ticks: 0 } },
    'load-complete': { sound: 'data-load-done', params: { pitch: 523.25, sweep: 0.12, check: 0.4 } },
    // E5 up a fourth to A5
    'data-tick': { sound: 'data-delta-tick', params: { pitch: 659.25, size: 0.3 } },
    // the ticks climb from C5 to A5
    'count-up': { sound: 'data-count-up', params: { pitch: 523.25, rise: 9, thunk: 0.4 } },
    'chart-reveal': { sound: 'data-line-draw', params: { pitch: 523.25, curve: 0.6, wobble: 0.3, shimmer: 0.3 } },
    // amber by default: one note repeated in triangles; the host raises level for red
    threshold: { sound: 'data-threshold', params: { pitch: 523.25, level: 0.5 } },
    sort: { sound: 'data-sort-swap', params: { pitch: 523.25, slide: 0.3 } },
    beacon: { sound: 'data-sonar', params: { pitch: 880, echoes: 2, bright: 0.2 } },
    packet: { sound: 'data-packet-hop', params: { pitch: 523.25, tone: 0.2 } },
    link: { sound: 'data-link-state', params: { pitch: 523.25, tone: 0.3 } },
    // C5 drops away, then the standby comes up C5, E5, G5
    failover: { sound: 'data-failover', params: { pitch: 523.25, bright: 0.2 } },
    scale: { sound: 'data-scale', params: { pitch: 523.25 } },
    thinking: { sound: 'ai-typing-dots', params: { pitch: 523.25, gap: 0.17, glass: 0.3 } },
    // C6 pentatonic pips, kept to the lowest three notes
    'stream-token': { sound: 'ai-token-stream', params: { pitch: 1046.5, spread: 0.3 } },
    'tool-call': { sound: 'ai-tool-call', params: { pitch: 783.99 } },
    // E5 up a minor third to G5 for valid; the invalid pips barely buzz
    verdict: { sound: 'ui-verdict', params: { pitch: 659.25, rough: 0.2 } },
  },
};
