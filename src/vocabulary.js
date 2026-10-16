// The shared vocabulary: one list of each, read by the build (which validates sounds and themes
// against it) and by the MCP server (which ranks and explains sounds with it). Plain data, no imports.
//   MOMENTS   what happens in an app or a game (click, toggle-on, success, coin, ...): the keys are
//             the canonical moment names a theme maps and a sound may list in `moments`; each entry
//             also carries the hints the MCP server's suggestions use
//   FAMILIES  the timbre family a sound may declare in `family`, one per sound
//   ROLES     what a 0/1 switch parameter means (`role`), so a tool can set it without guessing
//             from its name
// A new moment, family or role is added here, once, and both sides pick it up.

/**
 * Moments. Fields:
 *   about       what the moment is
 *   tags        words a catalog tag or name would carry (the strong signal); hyphenated entries
 *               ("level-up") match a whole tag
 *   terms       other words and phrases that mean this moment in an app description
 *   categories  categories that fit, best first (a moment of a newer category also lists an older
 *               one, so suggestions have somewhere to look while the new category is still empty)
 *   avoid       tags that rule a sound out for this moment
 *   maxDur/minDur  soft length bounds in seconds (a frequent moment wants a short sound)
 *   loud        preferred loudness bands, best first
 *   hints       parameter values to set when the sound has a parameter with that role (ROLES) or,
 *               failing that, that name (the direction of a toggle: on; of a drawer or modal: open)
 * A moment that names both directions of a switch (record, auth, presence, link, verdict, card-tap,
 * transform) hints the first one; the host plays the other by passing the switch's value. debuff
 * sets no tick hint: a hint falls back to a parameter of that name, and notify-calendar's tick is an
 * amount. loading and thinking want a loop cell: a short sound tagged loop-cell that the host
 * re-triggers on an interval (docs/DESIGN.md).
 */
export const MOMENTS = {
  // ---- interface
  click: {
    about: 'A button, link or control is pressed.',
    tags: ['click', 'tap', 'button', 'press', 'tick'], terms: ['select', 'pointer', 'mouse', 'choose', 'pick', 'tapped', 'pressed', 'touch', 'finger'],
    categories: ['ui'], avoid: ['error', 'fail'], maxDur: 0.3, loud: ['quiet', 'medium'],
  },
  hover: {
    about: 'The pointer moves over or focuses a control.',
    tags: ['hover', 'focus', 'tick', 'pointer', 'cursor', 'mouseover'], terms: ['highlight', 'rollover', 'tab focus'],
    categories: ['ui'], avoid: ['error', 'fail'], maxDur: 0.15, loud: ['quiet'],
  },
  'toggle-on': {
    about: 'A switch, checkbox or setting is turned on.',
    tags: ['toggle', 'switch', 'checkbox', 'on', 'check'], terms: ['toggle', 'switch', 'checkbox', 'enable', 'enabled', 'activate', 'turn on', 'switch on', 'checked'],
    categories: ['ui'], avoid: ['error', 'fail'], maxDur: 0.4, loud: ['quiet', 'medium'], hints: { on: 1 },
  },
  'toggle-off': {
    about: 'A switch, checkbox or setting is turned off.',
    tags: ['toggle', 'switch', 'checkbox', 'off', 'uncheck'], terms: ['toggle', 'switch', 'checkbox', 'disable', 'disabled', 'deactivate', 'turn off', 'switch off', 'unchecked'],
    categories: ['ui'], avoid: ['error', 'fail'], maxDur: 0.4, loud: ['quiet', 'medium'], hints: { on: 0 },
  },
  type: {
    about: 'A key is pressed while typing.',
    tags: ['key', 'keypress', 'typing', 'keyboard', 'type', 'thock'], terms: ['keystroke', 'typewriter'],
    categories: ['ui'], avoid: ['error', 'fail'], maxDur: 0.12, loud: ['quiet'],
  },
  open: {
    about: 'A menu, panel, modal or drawer opens or slides in.',
    tags: ['open', 'expand', 'modal', 'dialog', 'menu', 'drawer', 'popup', 'panel', 'dropdown', 'sheet', 'unfold'], terms: ['slide in', 'overlay', 'appear', 'sidebar'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.8, loud: ['quiet', 'medium'], hints: { open: 1 },
  },
  close: {
    about: 'A menu, panel, modal or drawer closes.',
    tags: ['close', 'collapse', 'dismiss', 'modal', 'dialog', 'menu', 'drawer', 'popup', 'panel'], terms: ['slide out', 'hide', 'fold'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.8, loud: ['quiet', 'medium'], hints: { open: 0 },
  },
  transition: {
    about: 'A screen, page or scene changes; something sweeps past.',
    tags: ['whoosh', 'swoosh', 'swipe', 'transition', 'slide', 'swing', 'dash'], terms: ['navigate', 'navigation', 'page', 'scene', 'wipe', 'screen change'],
    categories: ['game', 'ui'], avoid: ['error'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  scroll: {
    about: 'A scroll wheel, picker or slider passes a notch.',
    tags: ['scroll', 'detent', 'notch', 'ratchet', 'wheel', 'picker', 'slider'], terms: ['scrolling', 'dial', 'stepper'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.15, loud: ['quiet'],
  },
  drag: {
    about: 'An item is picked up to be dragged.',
    tags: ['drag', 'lift', 'grab', 'drag-start'], terms: ['pick up', 'dragging', 'move item'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.3, loud: ['quiet'],
  },
  drop: {
    about: 'A dragged item lands on its target.',
    tags: ['drop', 'place', 'land', 'thud', 'drag-end'], terms: ['dropped', 'set down', 'snap into place'],
    categories: ['ui', 'cards'], avoid: ['error'], maxDur: 0.3, loud: ['quiet'],
  },
  tooltip: {
    about: 'A tooltip, hint or popover appears.',
    tags: ['tooltip', 'popover', 'hint', 'pop'], terms: ['help bubble', 'hint'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.3, loud: ['quiet'],
  },
  copy: {
    about: 'Something is copied to the clipboard.',
    tags: ['copy', 'clipboard', 'duplicate'], terms: ['copied', 'paste'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.5, loud: ['quiet', 'medium'],
  },
  undo: {
    about: 'An action is undone or reverted.',
    tags: ['undo', 'revert', 'rewind', 'restore', 'back'], terms: ['redo', 'step back', 'rollback'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.5, loud: ['quiet'],
  },
  delete: {
    about: 'Something is removed, trashed or cleared.',
    tags: ['delete', 'remove', 'trash', 'discard', 'bin', 'crumple'], terms: ['erase', 'clear', 'throw away'],
    categories: ['ui'], avoid: [], maxDur: 0.6, loud: ['quiet', 'medium'],
  },
  send: {
    about: 'A message or form is sent, submitted or published.',
    tags: ['send', 'sent', 'outgoing', 'submit', 'post', 'message'], terms: ['publish', 'upload', 'share', 'message sent', 'whoosh out'],
    categories: ['notify', 'ui'], avoid: ['error', 'incoming', 'received'], maxDur: 0.8, loud: ['quiet', 'medium'],
  },
  refresh: {
    about: 'Content reloads or syncs.',
    tags: ['refresh', 'reload', 'sync', 'cycle', 'backup'], terms: ['pull to refresh', 'update', 'loading'],
    categories: ['notify', 'ui'], avoid: ['error'], maxDur: 1.2, loud: ['quiet', 'medium'],
  },
  select: {
    about: 'The selection moves to another tab, segment, pill or option. A sound for it may take a pos parameter (0 to 1): where the selection lands.',
    tags: ['select', 'tab', 'segment', 'pill', 'selection', 'option'], terms: ['tab switch', 'tabs', 'segmented control', 'radio', 'choose option', 'selected'],
    categories: ['ui'], avoid: ['error'], maxDur: 0.4, loud: ['quiet'],
  },
  step: {
    about: 'A stepper or wizard advances to its next step. A sound for it may take a step parameter: which step it reached.',
    tags: ['step', 'stepper', 'milestone', 'advance', 'checkpoint'], terms: ['stepper', 'onboarding', 'milestone', 'checkout step', 'progress stepper', 'setup wizard', 'next step'],
    categories: ['ui', 'notify', 'game'], avoid: ['error', 'footstep', 'walk', 'land'], maxDur: 0.8, loud: ['quiet'],
  },
  record: {
    about: 'Recording starts or stops: a sound for it carries an on switch, 1 starts, 0 stops.',
    tags: ['record', 'recording', 'rec', 'mic', 'microphone', 'blip', 'beep'], terms: ['start recording', 'stop recording', 'voice memo', 'screen recording', 'recorder'],
    categories: ['ui', 'notify', 'scifi'], avoid: ['error'], maxDur: 1.0, loud: ['quiet', 'medium'], hints: { on: 1 },
  },
  reveal: {
    about: 'Content is uncovered: a wipe, an iris, a shutter, a curtain.',
    tags: ['reveal', 'wipe', 'iris', 'shutter', 'curtain', 'uncover', 'unfold'], terms: ['unveil', 'uncover', 'curtain', 'iris', 'shutter', 'spoiler'],
    categories: ['ui', 'fx', 'magic'], avoid: ['error'], maxDur: 1.2, loud: ['quiet', 'medium'],
  },
  stamp: {
    about: 'A rubber stamp lands: approved, paid, verified, a label slapped on.',
    tags: ['stamp', 'rubber-stamp', 'thump', 'seal', 'slap'], terms: ['rubber stamp', 'stamped', 'seal of approval', 'verified'],
    categories: ['ui', 'notify', 'game'], avoid: [], maxDur: 0.8, loud: ['medium', 'quiet'],
  },
  auth: {
    about: 'A sign in or out, a lock or unlock: a sound for it carries an on switch, 1 signs in or unlocks, 0 signs out or locks.',
    tags: ['auth', 'login', 'logout', 'lock', 'unlock', 'padlock', 'vault'], terms: ['sign in', 'sign out', 'log in', 'log out', 'authenticate', 'password', 'passcode', 'unlocked', 'locked'],
    categories: ['ui', 'notify', 'game'], avoid: [], maxDur: 1.2, loud: ['quiet', 'medium'], hints: { on: 1 },
  },
  // ---- feedback
  success: {
    about: 'An action finished well: saved, sent, paid, completed.',
    tags: ['success', 'done', 'complete', 'confirm', 'chime', 'positive'], terms: ['saved', 'finish', 'finished', 'completed', 'accepted', 'approved', 'payment', 'passed', 'correct', 'ok', 'confirmed'],
    categories: ['notify', 'ui'], avoid: ['error', 'fail', 'negative'], maxDur: 1.5, loud: ['medium', 'quiet'],
  },
  error: {
    about: 'An action was rejected or failed: invalid input, denied, failed.',
    tags: ['error', 'fail', 'invalid', 'denied', 'buzz', 'negative'], terms: ['failed', 'failure', 'wrong', 'rejected', 'declined', 'blocked', 'forbidden', 'incorrect', 'mistake', 'problem'],
    categories: ['notify', 'ui'], avoid: ['success', 'positive'], maxDur: 1.2, loud: ['medium', 'quiet'],
  },
  warning: {
    about: 'Something needs attention but did not fail.',
    tags: ['warning', 'caution', 'attention', 'careful', 'uh-oh', 'alert'], terms: ['heads up', 'low battery', 'confirm delete', 'unsaved'],
    categories: ['notify'], avoid: ['success', 'positive'], maxDur: 1.2, loud: ['medium', 'quiet'],
  },
  info: {
    about: 'Neutral news: nothing wrong, nothing won.',
    tags: ['info', 'notice', 'neutral', 'fyi', 'heads-up'], terms: ['information', 'tip', 'note'],
    categories: ['notify'], avoid: ['error', 'fail'], maxDur: 1.2, loud: ['quiet', 'medium'],
  },
  notify: {
    about: 'A notification arrives.',
    tags: ['notify', 'notification', 'alert', 'ping', 'bell', 'ding', 'mention'], terms: ['incoming', 'inbox', 'chime', 'alert'],
    categories: ['notify', 'magic'], avoid: ['error', 'fail'], maxDur: 2.0, loud: ['medium', 'quiet'],
  },
  message: {
    about: 'A message, chat or email arrives.',
    tags: ['message', 'received', 'chat', 'incoming', 'dm', 'mail', 'email', 'inbox'], terms: ['new message', 'direct message', 'new mail'],
    categories: ['notify'], avoid: ['error', 'fail', 'outgoing', 'sent'], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  reminder: {
    about: 'A calendar event, reminder or due date comes up.',
    tags: ['reminder', 'calendar', 'due', 'event', 'meeting', 'schedule', 'appointment'], terms: ['agenda', 'task due', 'upcoming'],
    categories: ['notify'], avoid: ['error', 'fail'], maxDur: 2.0, loud: ['medium', 'quiet'],
  },
  timer: {
    about: 'A timer, countdown or alarm ends.',
    tags: ['timer', 'alarm', 'countdown', 'beep', 'clock', 'wake'], terms: ['stopwatch', 'time is up', 'pomodoro', 'meditation bell', 'ring'],
    categories: ['notify'], avoid: ['error'], maxDur: 2.5, loud: ['medium', 'quiet'],
  },
  achievement: {
    about: 'A milestone, badge or reward is earned.',
    tags: ['achievement', 'unlock', 'reward', 'trophy', 'level-up', 'fanfare', 'win', 'bonus'], terms: ['badge', 'unlocked', 'streak', 'milestone', 'celebrate'],
    categories: ['notify', 'magic', 'game', 'fx'], avoid: ['error', 'fail'], minDur: 0.3, maxDur: 3.0, loud: ['medium', 'loud'],
  },
  dismiss: {
    about: 'A notification, toast or chip is dismissed or swiped away.',
    tags: ['dismiss', 'toast', 'snackbar', 'swipe-away', 'clear'], terms: ['swipe away', 'close toast', 'clear notification', 'dismissed', 'mark as read'],
    categories: ['notify', 'ui'], avoid: ['error'], maxDur: 0.6, loud: ['quiet'],
  },
  critical: {
    about: 'A critical alert, a severity above error: an incident, a breach, an outage.',
    tags: ['critical', 'severe', 'incident', 'emergency', 'alarm', 'urgent'], terms: ['incident', 'breach', 'outage', 'emergency', 'severity', 'pager'],
    categories: ['notify', 'scifi'], avoid: ['success', 'positive'], maxDur: 1.5, loud: ['loud', 'medium'],
  },
  presence: {
    about: 'Someone comes online or goes offline: a sound for it carries an on switch, 1 online, 0 offline.',
    tags: ['presence', 'online', 'offline', 'status', 'available', 'ding-dong'], terms: ['online', 'came online', 'went offline', 'available', 'status change'],
    categories: ['notify', 'ui'], avoid: ['error', 'speech'], maxDur: 0.8, loud: ['quiet'], hints: { on: 1 },
  },
  purchase: {
    about: 'A payment or purchase completes: a cash register, a checkout, a tip.',
    tags: ['purchase', 'cash-register', 'payment', 'buy', 'cha-ching', 'money'], terms: ['payment', 'checkout', 'order placed', 'paid', 'buy', 'cash register', 'transaction'],
    categories: ['notify', 'game', 'ui'], avoid: ['error', 'fail'], maxDur: 1.5, loud: ['medium', 'quiet'],
  },
  // ---- data: loaders, counters, charts, maps and diagrams
  loading: {
    about: 'Something loads or waits with no known end: a spinner, dots, a skeleton. A sound for it is a loop cell (tag loop-cell), re-triggered on an interval while the wait lasts.',
    tags: ['loading', 'loader', 'spinner', 'busy', 'pending', 'loop-cell'], terms: ['spinner', 'waiting', 'please wait', 'fetching', 'buffering', 'skeleton'],
    categories: ['data', 'notify', 'ui', 'scifi'], avoid: ['error', 'fail'], maxDur: 1.5, loud: ['quiet'],
  },
  progress: {
    about: 'A determinate step of progress: a bar or ring advances. A sound for it may take a pos parameter (0 to 1) and be played on each update.',
    tags: ['progress', 'fill', 'percent', 'meter', 'bar'], terms: ['progress bar', 'percent', 'percentage', 'uploading', 'downloading', 'installing'],
    categories: ['data', 'ui', 'notify'], avoid: ['error'], maxDur: 0.6, loud: ['quiet'],
  },
  'load-complete': {
    about: 'A wait resolves: a spinner turns into a check, a skeleton into content.',
    tags: ['loaded', 'resolve', 'complete', 'sync', 'skeleton'], terms: ['finished loading', 'done loading', 'content ready', 'resolved'],
    categories: ['data', 'notify', 'ui'], avoid: ['error', 'fail'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  'data-tick': {
    about: 'A counter, odometer or ticker steps by one value.',
    tags: ['counter', 'tick', 'odometer', 'ticker', 'increment', 'digit'], terms: ['counter', 'odometer', 'ticker', 'stock ticker', 'flip clock', 'nixie'],
    categories: ['data', 'battle', 'ui', 'cards'], avoid: ['error'], maxDur: 0.2, loud: ['quiet'],
  },
  'count-up': {
    about: 'A number rolls up to its value: a KPI, a total, an odometer run.',
    tags: ['count-up', 'count', 'tally', 'total', 'odometer'], terms: ['count up', 'counting', 'tally', 'running total', 'big number', 'kpi'],
    categories: ['data', 'game', 'ui'], avoid: ['error', 'dice'], maxDur: 2.0, loud: ['quiet', 'medium'],
  },
  'chart-reveal': {
    about: 'A chart draws in: bars rise, a line traces, areas fill.',
    tags: ['chart', 'graph', 'bars', 'plot', 'draw-in', 'bloom'], terms: ['bar chart', 'line chart', 'pie chart', 'graph', 'plot', 'visualization', 'draw in', 'analytics'],
    categories: ['data', 'ui', 'magic'], avoid: ['error'], maxDur: 2.0, loud: ['quiet', 'medium'],
  },
  threshold: {
    about: 'A meter or gauge crosses into amber or red, or back: a limit, an SLO, a quota.',
    tags: ['threshold', 'gauge', 'meter', 'limit', 'caution'], terms: ['crosses threshold', 'over limit', 'quota', 'slo', 'red zone', 'gauge'],
    categories: ['data', 'notify'], avoid: [], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  sort: {
    about: 'Rows or items reorder: a table sorts, a leaderboard swaps places.',
    tags: ['sort', 'reorder', 'swap', 'rank', 'leaderboard'], terms: ['sorting', 'reorder', 'sorted', 'leaderboard', 'rerank'],
    categories: ['data', 'ui', 'cards'], avoid: ['error'], maxDur: 1.0, loud: ['quiet'],
  },
  beacon: {
    about: 'One beacon or sonar pulse: you are here, an accuracy ring, an outage ripple.',
    tags: ['beacon', 'sonar', 'pulse', 'ripple', 'locate'], terms: ['you are here', 'sonar ping', 'locator', 'geolocation', 'ripple'],
    categories: ['data', 'scifi', 'notify'], avoid: ['error'], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  'pin-drop': {
    about: 'A map pin or marker drops onto its spot.',
    tags: ['pin', 'marker', 'map', 'location', 'drop-pin'], terms: ['map pin', 'drop a pin', 'marker', 'map marker', 'location'],
    categories: ['data', 'ui'], avoid: ['error'], maxDur: 0.6, loud: ['quiet', 'medium'],
  },
  route: {
    about: 'A dot or vehicle travels a route on a map, hop by hop to its arrival.',
    tags: ['route', 'path', 'waypoint', 'trace', 'journey', 'dash'], terms: ['directions', 'delivery tracking', 'flight path', 'waypoints'],
    categories: ['data', 'game', 'ui'], avoid: ['error'], maxDur: 3.0, loud: ['quiet', 'medium'],
  },
  packet: {
    about: 'A packet hops along a wire or link between nodes in a diagram.',
    tags: ['packet', 'data', 'hop', 'network', 'request', 'node'], terms: ['network', 'data flow', 'api call', 'traffic', 'message bus'],
    categories: ['data', 'scifi'], avoid: ['error'], maxDur: 1.0, loud: ['quiet'],
  },
  link: {
    about: 'A connection is made or dropped: a socket, a peering, a VPN. A sound for it carries an on switch, 1 connects, 0 disconnects.',
    tags: ['link', 'connect', 'disconnect', 'connection', 'socket', 'blip'], terms: ['connected', 'disconnected', 'reconnect', 'websocket', 'vpn', 'pairing', 'bluetooth', 'handshake', 'link up', 'link down'],
    categories: ['data', 'notify', 'scifi'], avoid: ['card'], maxDur: 1.0, loud: ['quiet', 'medium'], hints: { on: 1 },
  },
  failover: {
    about: 'The active node fails and a standby takes over.',
    tags: ['failover', 'standby', 'takeover', 'backup', 'switchover', 'recovery'], terms: ['fail over', 'high availability', 'disaster recovery', 'redundancy', 'outage'],
    categories: ['data', 'notify', 'scifi'], avoid: [], maxDur: 2.0, loud: ['medium', 'quiet'],
  },
  scale: {
    about: 'Capacity scales out or in: servers added or removed, a cluster grows or shrinks. A sound for it carries an up switch, 1 scales out, 0 scales in.',
    tags: ['scale', 'autoscale', 'scale-out', 'scale-in', 'capacity', 'cluster'], terms: ['auto scaling', 'scale out', 'scale in', 'add servers', 'serverless', 'capacity'],
    categories: ['data', 'scifi'], avoid: ['error'], maxDur: 1.5, loud: ['quiet', 'medium'], hints: { up: 1 },
  },
  // ---- AI and agents
  thinking: {
    about: 'An AI or agent is working or thinking. A sound for it is a loop cell (tag loop-cell), re-triggered on an interval while it works.',
    tags: ['thinking', 'processing', 'working', 'reasoning', 'pulse', 'hum', 'loop-cell'], terms: ['ai', 'agent', 'llm', 'assistant', 'chatbot', 'generating', 'typing indicator'],
    categories: ['ai', 'scifi', 'ambience', 'data'], avoid: ['error', 'fail'], maxDur: 2.0, loud: ['quiet'],
  },
  'stream-token': {
    about: 'Machine text streams in token by token (not a person typing).',
    tags: ['token', 'tokens', 'stream', 'streaming', 'generate', 'output'], terms: ['streaming reply', 'token stream', 'llm output', 'generating text'],
    categories: ['ai', 'scifi', 'data'], avoid: ['keyboard', 'keypress'], maxDur: 1.0, loud: ['quiet'],
  },
  'tool-call': {
    about: 'An agent calls a tool or function and the result comes back.',
    tags: ['tool', 'tool-call', 'function', 'invoke', 'result', 'terminal'], terms: ['function call', 'tool use', 'api call', 'agent tool', 'mcp'],
    categories: ['ai', 'data', 'scifi'], avoid: ['phone', 'telephone', 'ringtone'], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  verdict: {
    about: 'A check passes or blocks: a guardrail, a field validation, a review. A sound for it carries a pass switch, 1 allows, 0 blocks.',
    tags: ['verdict', 'valid', 'invalid', 'pass', 'block', 'guardrail', 'validation'], terms: ['validation', 'validate', 'guardrail', 'moderation', 'allowed', 'field check', 'input check'],
    categories: ['ai', 'ui', 'notify'], avoid: [], maxDur: 0.8, loud: ['quiet', 'medium'], hints: { pass: 1 },
  },
  // ---- games
  hit: {
    about: 'A blow lands: a hit, impact or strike.',
    tags: ['hit', 'impact', 'smash', 'punch', 'hammer', 'clank', 'strike'], terms: ['damage', 'attack', 'slam', 'thud', 'bang', 'knock', 'crash'],
    categories: ['game', 'battle', 'duel'], avoid: ['soft'], maxDur: 1.2, loud: ['loud', 'medium'],
  },
  damage: {
    about: 'The player takes damage.',
    tags: ['hurt', 'damage', 'ouch', 'pain'], terms: ['injured', 'taken a hit', 'lose health'],
    categories: ['game'], avoid: ['heal'], maxDur: 0.8, loud: ['medium', 'loud'],
  },
  attack: {
    about: 'A melee swing or strike.',
    tags: ['sword', 'swing', 'slash', 'blade', 'attack', 'combat', 'melee'], terms: ['swing sword', 'stab'],
    categories: ['game', 'battle', 'duel'], avoid: ['soft'], maxDur: 0.8, loud: ['medium', 'loud'],
  },
  pickup: {
    about: 'An item is picked up or collected.',
    tags: ['pickup', 'collect', 'grab', 'loot', 'item', 'gem', 'treasure', 'pick-up', 'inventory'], terms: ['jewel', 'collected'],
    categories: ['game'], avoid: ['error'], maxDur: 1.0, loud: ['medium', 'loud'],
  },
  coin: {
    about: 'A coin, currency or small reward is gained or spun.',
    tags: ['coin', 'money', 'ping', 'spin', 'flip', 'toss', 'gem', 'score'], terms: ['cash', 'gold', 'currency', 'purchase', 'reward'],
    categories: ['game', 'battle'], avoid: ['error'], maxDur: 2.0, loud: ['medium', 'loud'],
  },
  'level-up': {
    about: 'The player levels up or unlocks something big.',
    tags: ['level-up', 'level', 'upgrade', 'bonus', 'fanfare', 'unlock'], terms: ['level up', 'rank up', 'evolve', 'promotion'],
    categories: ['game', 'magic', 'music'], avoid: ['error', 'fail'], minDur: 0.5, maxDur: 3.0, loud: ['medium', 'loud'],
  },
  'power-up': {
    about: 'A power-up, boost or buff is collected.',
    tags: ['power-up', 'powerup', 'upgrade', 'boost', 'buff', 'energize', 'charge'], terms: ['power up', 'stronger', 'speed boost'],
    categories: ['game', 'scifi', 'magic'], avoid: ['error', 'fail', 'power-down'], minDur: 0.3, maxDur: 2.5, loud: ['medium', 'loud'],
  },
  heal: {
    about: 'Health is restored.',
    tags: ['heal', 'health', 'regen', 'recover', 'restore', 'blessing'], terms: ['healing', 'potion', 'revive'],
    categories: ['magic', 'game'], avoid: ['hurt', 'curse'], maxDur: 2.5, loud: ['medium', 'quiet'],
  },
  victory: {
    about: 'The player wins a round or finishes a level.',
    tags: ['victory', 'win', 'fanfare', 'jingle', 'level-complete', 'stage-clear', 'ta-da', 'celebrate'], terms: ['win', 'you win', 'won', 'finish line', 'triumph', 'celebration', 'complete level', 'stage clear'],
    categories: ['music', 'game', 'duel', 'fx'], avoid: ['error', 'fail', 'defeat'], minDur: 0.6, maxDur: 5.0, loud: ['loud', 'medium'],
  },
  'game-over': {
    about: 'The player loses or the run ends.',
    tags: ['game-over', 'defeat', 'lose', 'sad', 'trombone', 'death'], terms: ['game over', 'you lose', 'lost', 'died', 'run ended'],
    categories: ['music', 'game'], avoid: ['success', 'positive', 'win'], minDur: 0.5, maxDur: 4.0, loud: ['medium', 'loud'],
  },
  jump: {
    about: 'A character jumps or bounces.',
    tags: ['jump', 'hop', 'bounce', 'boing', 'spring', 'double-jump'], terms: ['leap', 'trampoline'],
    categories: ['game'], avoid: ['error'], maxDur: 0.6, loud: ['medium', 'quiet'],
  },
  footstep: {
    about: 'A footstep while walking or running.',
    tags: ['footstep', 'step', 'walk', 'run'], terms: ['footsteps', 'walking', 'running'],
    categories: ['game'], avoid: [], maxDur: 0.4, loud: ['quiet'],
  },
  shoot: {
    about: 'A weapon fires: a laser, blaster, arrow or shot.',
    tags: ['laser', 'zap', 'shoot', 'blaster', 'shot', 'pew', 'bolt', 'arrow', 'cannon'], terms: ['fire', 'beam', 'phaser', 'bullet', 'gun', 'plasma'],
    categories: ['scifi', 'game'], avoid: ['soft'], maxDur: 1.0, loud: ['medium', 'loud'],
  },
  explosion: {
    about: 'Something blows up.',
    tags: ['explosion', 'boom', 'blast', 'bomb', 'detonate', 'burst'], terms: ['explode', 'destroy', 'destruction', 'crash'],
    categories: ['game', 'scifi', 'fx'], avoid: [], minDur: 0.4, maxDur: 3.0, loud: ['loud', 'medium'],
  },
  countdown: {
    about: 'A countdown beat before a round starts.',
    tags: ['countdown', 'beep', 'ready', 'go', 'race', 'start'], terms: ['three two one', 'get ready', 'on your marks'],
    categories: ['game', 'notify'], avoid: ['error'], maxDur: 0.6, loud: ['medium'],
  },
  'level-down': {
    about: 'A demotion, the mirror of level-up: a rank drops, a streak is lost, a level is taken away.',
    tags: ['level-down', 'demote', 'rank-down', 'streak-lost', 'defeat', 'sad', 'lose'], terms: ['level down', 'rank down', 'demoted', 'demotion', 'lost streak', 'downgrade'],
    categories: ['game', 'music', 'notify'], avoid: ['level-up', 'win', 'success'], minDur: 0.3, maxDur: 3.0, loud: ['medium', 'quiet'],
  },
  // ---- cards and tabletop
  'card-draw': {
    about: 'A card is drawn, dealt or flicked.',
    tags: ['card', 'draw', 'deal', 'flick', 'pull', 'deck', 'skim'], terms: ['dealt', 'dealing', 'card game', 'deal cards'],
    categories: ['cards', 'duel'], avoid: ['shuffle'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  'card-flip': {
    about: 'A card is turned face up.',
    tags: ['flip', 'card', 'turn', 'reveal', 'face-up', 'show'], terms: ['turn over', 'flip card'],
    categories: ['cards'], avoid: [], maxDur: 0.8, loud: ['quiet', 'medium'],
  },
  shuffle: {
    about: 'A deck is shuffled or riffled.',
    tags: ['shuffle', 'riffle', 'deck', 'card', 'bridge', 'overhand'], terms: ['shuffling', 'mix cards'],
    categories: ['cards'], avoid: [], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  dice: {
    about: 'Dice are shaken and rolled.',
    tags: ['dice', 'roll', 'shake', 'rattle', 'craps', 'cup'], terms: ['roll the dice', 'throw dice'],
    categories: ['cards'], avoid: [], maxDur: 2.0, loud: ['quiet', 'medium'],
  },
  'your-turn': {
    about: 'Control passes to you in a turn-based game or a shared session: your move.',
    tags: ['your-turn', 'your-move', 'turn-start', 'player-up'], terms: ['your turn', 'your move', 'their turn', 'whose turn', 'you are up', 'my turn', 'turn starts', 'turn to play', 'next player', 'player turn', 'turn order', 'pass the turn', 'hand off', 'take turns'],
    categories: ['cards', 'game', 'notify', 'voice', 'battle', 'duel'], avoid: ['error', 'fail'], maxDur: 2.5, loud: ['medium', 'quiet'],
  },
  // ---- card duels and creature battles (cards, duel, battle)
  'card-tap': {
    about: 'A card turns sideways to act or pay (tap, exert) or stands up again: a sound for it carries an on switch, 1 taps, 0 untaps or readies.',
    tags: ['exert', 'untap', 'rotate', 'sideways', 'card'], terms: ['exert', 'exerted', 'untap', 'turn sideways', 'ready step'],
    categories: ['cards', 'duel', 'battle'], avoid: [], maxDur: 0.5, loud: ['quiet', 'medium'], hints: { on: 1 },
  },
  resource: {
    about: 'A resource is added: mana, ink, an energy attached.',
    tags: ['resource', 'mana', 'ink', 'energy', 'attach', 'inkwell'], terms: ['mana', 'ink', 'energy', 'attach energy', 'land drop', 'inkwell'],
    categories: ['duel', 'battle', 'cards', 'game'], avoid: ['error'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  score: {
    about: 'Points are scored: lore, prizes, victory points.',
    tags: ['score', 'points', 'lore', 'prize', 'victory-points', 'tally'], terms: ['points', 'lore', 'prize card', 'victory points', 'scored'],
    categories: ['duel', 'battle', 'game', 'cards'], avoid: ['error', 'fail'], maxDur: 1.5, loud: ['medium', 'quiet'],
  },
  ability: {
    about: 'A creature or card ability activates: a triggered, passive or once per turn power.',
    tags: ['ability', 'activate', 'trigger', 'passive', 'skill', 'charge'], terms: ['special ability', 'activate ability', 'triggered', 'once per turn', 'skill'],
    categories: ['battle', 'duel', 'magic', 'game'], avoid: ['error'], maxDur: 1.5, loud: ['medium', 'quiet'],
  },
  debuff: {
    about: 'A status condition or debuff lands (poison, burn, sleep, paralysis, confusion) or ticks at the turn checkup: a sound for it may carry a tick switch, 0 the application, 1 the recurring tick.',
    tags: ['debuff', 'status', 'poison', 'burn', 'sleep', 'paralysis', 'confusion', 'curse'], terms: ['status condition', 'poisoned', 'burned', 'asleep', 'paralyzed', 'confused', 'weakened'],
    categories: ['battle', 'game', 'magic'], avoid: ['heal'], maxDur: 2.0, loud: ['medium', 'quiet'],
  },
  crit: {
    about: 'A critical or super effective hit: a weakness doubles the damage.',
    tags: ['crit', 'critical-hit', 'weakness', 'super-effective', 'bonus-damage'], terms: ['critical hit', 'super effective', 'weakness', 'double damage'],
    categories: ['battle', 'game'], avoid: ['soft'], maxDur: 1.2, loud: ['loud', 'medium'],
  },
  knockout: {
    about: 'A creature or character is knocked out: heavier than a hit, the end of one fighter.',
    tags: ['knockout', 'ko', 'faint', 'heavy', 'fallen'], terms: ['fainted', 'faints', 'banished', 'final blow', 'defeated creature'],
    categories: ['battle', 'game', 'duel'], avoid: ['heal'], minDur: 0.3, maxDur: 2.0, loud: ['loud', 'medium'],
  },
  // ---- magic and sci-fi
  sparkle: {
    about: 'A magical twinkle: a bonus, a reveal.',
    tags: ['sparkle', 'shimmer', 'twinkle', 'fairy', 'glitter', 'bloom'], terms: ['enchant', 'wonder', 'reveal', 'whimsical', 'fantasy', 'wish'],
    categories: ['magic'], avoid: ['error', 'curse'], maxDur: 2.5, loud: ['medium', 'quiet'],
  },
  spell: {
    about: 'A spell is cast.',
    tags: ['spell', 'cast', 'magic', 'conjure', 'wand', 'fireball', 'lightning', 'summon'], terms: ['cast spell', 'wizard', 'sorcery'],
    categories: ['magic'], avoid: ['error'], maxDur: 3.0, loud: ['medium', 'loud'],
  },
  teleport: {
    about: 'A teleport, warp or portal.',
    tags: ['teleport', 'warp', 'portal', 'blink', 'hyperspace', 'vanish', 'phase'], terms: ['jump drive', 'warp jump', 'warp drive', 'hyperspace jump', 'beam me up', 'dimension'],
    categories: ['magic', 'scifi'], avoid: ['error'], maxDur: 3.0, loud: ['medium'],
  },
  'power-down': {
    about: 'A machine, shield or system powers down.',
    tags: ['power-down', 'shutdown', 'deactivate', 'spin-down'], terms: ['switch off machine', 'offline'],
    categories: ['scifi'], avoid: ['power-up'], maxDur: 3.0, loud: ['medium', 'quiet'],
  },
  door: {
    about: 'A door, hatch or chest opens or latches.',
    tags: ['door', 'creak', 'hinge', 'latch', 'squeak', 'entrance', 'lock', 'chest'], terms: ['hatch', 'gate', 'creaks', 'unlock door'],
    categories: ['game'], avoid: ['error'], maxDur: 2.0, loud: ['quiet', 'medium'],
  },
  shield: {
    about: 'A shield or force field goes up or takes a hit.',
    tags: ['shield', 'barrier', 'force-field', 'deflect', 'guard', 'defend', 'block'], terms: ['force field', 'protect', 'forcefield'],
    categories: ['scifi', 'game', 'magic', 'duel'], avoid: ['error'], maxDur: 2.5, loud: ['medium'],
  },
  readout: {
    about: 'A console or HUD prints a readout or acknowledges.',
    tags: ['blip', 'terminal', 'console', 'readout', 'computer', 'hud'], terms: ['blips', 'bleep', 'interface beep', 'ship computer'],
    categories: ['scifi'], avoid: ['error'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  scan: {
    about: 'A scanner, radar or sensor sweeps.',
    tags: ['scanner', 'scan', 'sweep', 'radar', 'sensor', 'sonar', 'detect'], terms: ['scanning', 'ping the area'],
    categories: ['scifi', 'fx'], avoid: ['error'], maxDur: 3.0, loud: ['quiet', 'medium'],
  },
  chips: {
    about: 'Poker chips are clicked, stacked or pushed.',
    tags: ['chip', 'chips', 'casino', 'bet', 'poker', 'stack', 'pot'], terms: ['betting', 'ante', 'raise', 'all in'],
    categories: ['cards'], avoid: [], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  scare: {
    about: 'A sting for a scare, a twist or a mystery.',
    tags: ['scare', 'spooky', 'eerie', 'suspense', 'mystery', 'stinger', 'sting', 'clue'], terms: ['jump scare', 'horror', 'creepy', 'twist', 'dread'],
    categories: ['music'], avoid: ['cheerful', 'win'], minDur: 0.5, maxDur: 6, loud: ['medium'],
  },
  // ---- screen effects
  transform: {
    about: 'Something morphs, evolves or devolves: a sound for it carries an up switch, 1 evolves or grows, 0 devolves or shrinks.',
    tags: ['transform', 'morph', 'evolve', 'devolve', 'shapeshift', 'mutate', 'alchemy'], terms: ['morph', 'evolution', 'devolve', 'transformation', 'shape shift'],
    categories: ['fx', 'battle', 'duel', 'magic', 'game'], avoid: ['error'], maxDur: 3.0, loud: ['medium', 'quiet'], hints: { up: 1 },
  },
  glitch: {
    about: 'A digital glitch or corruption burst: an RGB split, a datamosh, a VHS tear.',
    tags: ['glitch', 'corrupt', 'stutter', 'bitcrush', 'vhs', 'static'], terms: ['glitchy', 'corruption', 'datamosh', 'signal tear', 'crt', 'distortion'],
    categories: ['fx', 'scifi'], avoid: [], maxDur: 1.0, loud: ['medium', 'quiet'],
  },
  'neon-on': {
    about: 'A neon tube or a bad bulb strikes, flickers and settles into its hum.',
    tags: ['neon', 'flicker', 'tube', 'bulb', 'sign', 'hum'], terms: ['neon sign', 'light flicker', 'fluorescent', 'bad bulb'],
    categories: ['fx', 'scifi', 'ambience'], avoid: [], maxDur: 2.0, loud: ['quiet', 'medium'],
  },
  'type-out': {
    about: 'Text types or decodes onto the screen: a typewriter line and its carriage return, a teletype, a scramble that resolves into words.',
    tags: ['typewriter', 'teletype', 'decode', 'type-out', 'text-reveal', 'carriage'], terms: ['typewriter effect', 'typing animation', 'text reveal', 'decode text', 'matrix text', 'teletype'],
    categories: ['fx', 'ui', 'scifi'], avoid: ['error'], maxDur: 1.5, loud: ['quiet', 'medium'],
  },
  // ---- voices
  announce: {
    about: 'A voice announces something: an alert, a status, a result.',
    tags: ['announcer', 'announcement', 'speech', 'spoken', 'callout', 'pa'], terms: ['announcer voice', 'voice line', 'voice alert', 'spoken alert', 'computer voice', 'pa system', 'intercom', 'narrator', 'voiceover', 'callout'],
    categories: ['voice'], avoid: ['babble'], minDur: 0.4, maxDur: 8, loud: ['loud', 'medium'],
  },
  dialogue: {
    about: 'A character talks: babble under a text box or a speech bubble.',
    tags: ['babble', 'dialogue', 'talk', 'chatter', 'gibberish', 'animalese'], terms: ['dialog', 'text box', 'speech bubble', 'npc', 'character talks', 'talking', 'conversation', 'typewriter text'],
    categories: ['voice'], avoid: ['announcer'], minDur: 0.3, maxDur: 8, loud: ['medium', 'loud'],
  },
  // ---- beds and phrases
  ambience: {
    about: 'A bed of sound under a scene.',
    tags: ['ambience', 'ambient', 'bed', 'drone', 'loop', 'nature', 'room-tone'], terms: ['background', 'atmosphere', 'backdrop', 'soundscape'],
    categories: ['ambience'], avoid: [], minDur: 1.0, maxDur: 10, loud: ['quiet'],
  },
  music: {
    about: 'A short musical phrase, sting or jingle.',
    tags: ['music', 'melody', 'jingle', 'fanfare', 'stinger', 'arpeggio', 'intro', 'logo'], terms: ['tune', 'phrase', 'musical', 'sting'],
    categories: ['music'], avoid: [], minDur: 0.5, maxDur: 8, loud: ['medium'],
  },
};

/**
 * Timbre families: the character of a sound's source, one per sound (`family`). They follow the
 * material and style tags the catalog already uses (soft, glass, wood, paper, metal, mechanical,
 * air, 8-bit), so a theme or an agent can keep a set of sounds in one family.
 */
export const FAMILIES = {
  soft: 'Muted, rounded and padded: sine blips, thocks, gentle swells and quiet chimes',
  glass: 'Bright, clear and ringing: glassy ticks, pings, crystal and glints',
  wood: 'Knocks, clacks and taps of wood, clay or bone: blocks, clocks, board pieces, chips, dice',
  paper: 'Cards, pages, crumples and rustles',
  metal: 'Struck and ringing metal: coins, keys, blades, hammers',
  mechanical: 'Switches, keys, latches, machines and hum',
  air: 'Whooshes, breaths, swishes, slides and wind',
  chip: '8-bit square and pulse voices: chiptune, arcade and retro computer beeps',
  synthetic: 'Electronic tones: buzzes, lasers, FM, sweeps, pads, drones and sci-fi machines',
  organic: 'Natural sources: water, fire, weather, birds, bubbles, footsteps, a bowstring',
  orchestral: 'Tuned instruments in a phrase: bells, plucks, mallets, harp and brass',
  impact: 'Blows, thuds and booms: punches, heavy hits, landings and explosions',
  voice: 'Speech and talk: synthesized announcers and robots, whispers, character babble',
};

/**
 * Parameter roles (`role`): what a 0/1 switch means. Every role is a switch (step 1, 0..1, no unit).
 * A moment's hints name roles, so build_kit turns toggle-off into on: 0 whatever the switch is called.
 */
export const ROLES = {
  on: 'Switch: 1 plays the on direction (check, enable, switch on), 0 the off direction',
  open: 'Switch: 1 plays opening (expand, show, slide in), 0 closing',
  chip: 'Switch: 1 swaps in an 8-bit square-wave voicing, 0 keeps the softer voice',
  go: 'Switch: 1 plays the longer, higher go cue that ends a countdown, 0 a count beat',
  up: 'Switch: 1 plays the rising direction (increase, rise, evolve), 0 the falling one (decrease, fall, devolve)',
  pass: 'Switch: 1 plays the pass verdict (allow, valid), 0 the block (deny, invalid)',
  tick: 'Switch: 1 plays the recurring per-turn tick (a checkup, an upkeep), 0 the first application',
};
