// Glass: bright, bell-like and airy. Struck-glass ticks, high chimes and sparkle, with a magic shimmer
// standing in for the usual success chime.
// Voicing: key of C, high register (ticks around C7 to C8, bells from G5 to G6), partials that ring
// rather than buzz. Every sound is short and clean; the frequent moments (click, hover, type,
// scroll) sit between -25 and -30 dBFS, and so do the ones that repeat while something runs
// (select, progress, data ticks, the loader, thinking, streamed tokens, packets).
export default {
  id: 'glass',
  name: 'Glass',
  desc: 'Bright, bell-like and airy: struck-glass ticks, high chimes and sparkle. Clean and a little cold.',
  moments: {
    click: { sound: 'ui-click-glass', params: { pitch: 3135.96, ring: 0.35, bright: 0.45 } },
    hover: { sound: 'ui-hover-tick', params: { pitch: 4186, air: 0.5 } },
    // no low thud under the switch (body 0): both stages are glass bells, a fourth or so apart
    'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, pitch: 3135.96, gap: 0.06, body: 0 } },
    'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, pitch: 3135.96, gap: 0.06, body: 0 } },
    type: { sound: 'ui-click-glass', params: { pitch: 4186, ring: 0.05, bright: 0.2 } },
    open: { sound: 'ui-menu-slide', params: { open: 1, size: 0.3, tone: 0.8 } },
    close: { sound: 'ui-menu-slide', params: { open: 0, size: 0.3, tone: 0.8 } },
    transition: { sound: 'game-whoosh', params: { length: 0.3, pitch: 1.5, q: 1.5 } },
    scroll: { sound: 'ui-slider-detent', params: { pitch: 1318.51, pos: 0, edge: 0.15 } },
    drag: { sound: 'ui-drag-pickup', params: { pitch: 659.25, lift: 0.8, air: 0.35 } },
    drop: { sound: 'ui-click-glass', params: { pitch: 2093, ring: 0.4, bright: 0.4 } },
    tooltip: { sound: 'ui-tooltip-pop', params: { pitch: 1567.98, rise: 0.4, shimmer: 0.6 } },
    copy: { sound: 'ui-copy', params: { pitch: 2093, scoop: 0.4, ring: 0.5 } },
    undo: { sound: 'ui-undo', params: { pitch: 1046.5, settle: 0.8 } },
    delete: { sound: 'ui-delete', params: { crunch: 2, pitch: 196, weight: 0.25 } },
    send: { sound: 'notify-message-out', params: { pitch: 1318.51, speed: 0.1, air: 0.4 } },
    refresh: { sound: 'notify-sync-done', params: { pitch: 659.25, cycles: 1, speed: 0.07, shimmer: 0.8 } },
    // a single glassy ping on G5 (one star)
    select: { sound: 'ui-rating-star', params: { stars: 1, pitch: 783.99, glint: 0 } },
    step: { sound: 'ai-reasoning-step', params: { pitch: 523.25, glow: 0.4 } },
    // two blips on C6, the start beep a fifth up on G6
    record: { sound: 'ui-record-toggle', params: { pitch: 1046.5, length: 0.12 } },
    // a thin hissing line and a bright tick where it lands
    reveal: { sound: 'ui-wipe', params: { length: 0.3, width: 0.2, tick: 0.6 } },
    // success is the one place the magic family walks into the glass set: four bright notes and air
    success: { sound: 'magic-sparkle', params: { notes: 4, pitch: 1046.5, gap: 0.05, shimmer: 0.6, space: 0.25 } },
    // the catalog has no glass error, so two bells fall a tritone (F5 to B4): same timbre, sour interval
    error: { sound: 'notify-reminder', params: { pitch: 698.46, drop: 6, gap: 0.2, ring: 0.5, space: 0.2 } },
    warning: { sound: 'notify-warning', params: { pitch: 698.46, drop: 5, tone: 4000 } },
    // a bell trill, G5 and B5 in two fast bursts: the glass set has no buzzer, so urgency comes from speed
    critical: { sound: 'notify-incoming-call', params: { pitch: 783.99, rate: 16, rings: 2, tone: 3500 } },
    info: { sound: 'notify-info', params: { pitch: 1046.5, decay: 0.4, bright: 0.8 } },
    notify: { sound: 'notify-mention', params: { pitch: 1046.5, glass: 0.8, ring: 0.35, echo: 0.3 } },
    dismiss: { sound: 'notify-toast-out', params: { speed: 1.3, drain: 0, pat: 0.2 } },
    message: { sound: 'notify-new-mail', params: { pitch: 783.99, interval: 5, swish: 0.3, ring: 0.35 } },
    presence: { sound: 'notify-presence', params: { pitch: 783.99, glow: 0.7 } },
    reminder: { sound: 'notify-reminder', params: { pitch: 783.99, drop: 3, ring: 0.8, space: 0.35 } },
    timer: { sound: 'notify-alarm', params: { pitch: 880, rounds: 2, pace: 0.14, swell: 0.5 } },
    achievement: { sound: 'notify-achievement', params: { pitch: 523.25, sparkle: 0.9, space: 0.5 } },
    // a coin-like glass tink on C7 (the metal coin flip would be the loudest sound in the set)
    purchase: { sound: 'duel-token-mint', params: { pitch: 2093, ring: 0.3, bloop: 0.2 } },
    // a ring of round ticks between G6 and C7, re-triggered every 1 s
    loading: { sound: 'data-spinner-ticks', params: { pitch: 783.99, tone: 0, width: 0.4 } },
    progress: { sound: 'data-progress-fill', params: { pitch: 523.25, span: 12, ticks: 8 } },
    // lands on G5 with a bright check bell on G6
    'load-complete': { sound: 'data-load-done', params: { pitch: 783.99, sweep: 0.1, check: 0.9 } },
    'data-tick': { sound: 'data-counter-tick', params: { pitch: 1567.98, click: 0 } },
    'count-up': { sound: 'data-count-up', params: { pitch: 1046.5, rise: 7, thunk: 0.2 } },
    'chart-reveal': { sound: 'data-line-draw', params: { pitch: 523.25, curve: 0.6, wobble: 0.3, shimmer: 0.8 } },
    threshold: { sound: 'data-threshold', params: { pitch: 783.99, level: 0.5 } },
    sort: { sound: 'data-sort-swap', params: { pitch: 783.99, slide: 0.2 } },
    beacon: { sound: 'data-sonar', params: { pitch: 1567.98, echoes: 2, bright: 0.8 } },
    'pin-drop': { sound: 'data-pin-drop', params: { pitch: 3135.96, glint: 0.8 } },
    // C5 up an octave to the arrival bell on C6
    route: { sound: 'data-route-trace', params: { pitch: 523.25 } },
    packet: { sound: 'data-packet-hop', params: { pitch: 1046.5, tone: 0.8 } },
    link: { sound: 'data-link-state', params: { pitch: 783.99, tone: 0.9 } },
    failover: { sound: 'data-failover', params: { pitch: 523.25, bright: 0.9 } },
    scale: { sound: 'data-scale', params: { pitch: 783.99 } },
    // G5, A5, B5 as bright bubbles, re-triggered every 1.2 s
    thinking: { sound: 'ai-typing-dots', params: { pitch: 783.99, glass: 0.9 } },
    'stream-token': { sound: 'ai-token-stream', params: { pitch: 1567.98, spread: 0.5 } },
    'tool-call': { sound: 'ai-tool-call', params: { pitch: 1046.5 } },
    // a clear G6 ding to allow
    verdict: { sound: 'ai-guard', params: { pitch: 1567.98, edge: 0.6 } },
    sparkle: { sound: 'magic-sparkle', params: { notes: 6, pitch: 1318.51, gap: 0.04, shimmer: 0.8, space: 0.4 } },
    heal: { sound: 'magic-healing-shimmer', params: { pitch: 523.25, swell: 0.3, sparkle: 0.8, space: 0.45 } },
    pickup: { sound: 'game-gem-collect', params: { pitch: 1567.98, ring: 0.45, gap: 0.08, sparkle: 0.7 } },
    teleport: { sound: 'magic-teleport', params: { pitch: 1046.5, gap: 0.12, reach: 1.5, space: 0.45 } },
    music: { sound: 'music-intro-logo', params: { key: 0, shine: 0.9, space: 0.5 } },
  },
};
