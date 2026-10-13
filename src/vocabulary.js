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
 *   categories  categories that fit, best first
 *   avoid       tags that rule a sound out for this moment
 *   maxDur/minDur  soft length bounds in seconds (a frequent moment wants a short sound)
 *   loud        preferred loudness bands, best first
 *   hints       parameter values to set when the sound has a parameter with that role (ROLES) or,
 *               failing that, that name (the direction of a toggle: on; of a drawer or modal: open)
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
    categories: ['notify', 'magic', 'game'], avoid: ['error', 'fail'], minDur: 0.3, maxDur: 3.0, loud: ['medium', 'loud'],
  },
  // ---- games
  hit: {
    about: 'A blow lands: a hit, impact or strike.',
    tags: ['hit', 'impact', 'smash', 'punch', 'hammer', 'clank', 'strike'], terms: ['damage', 'attack', 'slam', 'thud', 'bang', 'knock', 'crash'],
    categories: ['game'], avoid: ['soft'], maxDur: 1.2, loud: ['loud', 'medium'],
  },
  damage: {
    about: 'The player takes damage.',
    tags: ['hurt', 'damage', 'ouch', 'pain'], terms: ['injured', 'taken a hit', 'lose health'],
    categories: ['game'], avoid: ['heal'], maxDur: 0.8, loud: ['medium', 'loud'],
  },
  attack: {
    about: 'A melee swing or strike.',
    tags: ['sword', 'swing', 'slash', 'blade', 'attack', 'combat', 'melee'], terms: ['swing sword', 'stab'],
    categories: ['game'], avoid: ['soft'], maxDur: 0.8, loud: ['medium', 'loud'],
  },
  pickup: {
    about: 'An item is picked up or collected.',
    tags: ['pickup', 'collect', 'grab', 'loot', 'item', 'gem', 'treasure', 'pick-up', 'inventory'], terms: ['jewel', 'collected'],
    categories: ['game'], avoid: ['error'], maxDur: 1.0, loud: ['medium', 'loud'],
  },
  coin: {
    about: 'A coin, currency or small reward is gained or spun.',
    tags: ['coin', 'money', 'ping', 'spin', 'flip', 'toss', 'gem', 'score'], terms: ['cash', 'gold', 'currency', 'purchase', 'reward'],
    categories: ['game'], avoid: ['error'], maxDur: 2.0, loud: ['medium', 'loud'],
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
    categories: ['music', 'game'], avoid: ['error', 'fail', 'defeat'], minDur: 0.6, maxDur: 5.0, loud: ['loud', 'medium'],
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
    categories: ['game', 'scifi'], avoid: [], minDur: 0.4, maxDur: 3.0, loud: ['loud', 'medium'],
  },
  countdown: {
    about: 'A countdown beat before a round starts.',
    tags: ['countdown', 'beep', 'ready', 'go', 'race', 'start'], terms: ['three two one', 'get ready', 'on your marks'],
    categories: ['game', 'notify'], avoid: ['error'], maxDur: 0.6, loud: ['medium'],
  },
  // ---- cards and tabletop
  'card-draw': {
    about: 'A card is drawn, dealt or flicked.',
    tags: ['card', 'draw', 'deal', 'flick', 'pull', 'deck', 'skim'], terms: ['dealt', 'dealing', 'card game', 'deal cards'],
    categories: ['cards'], avoid: ['shuffle'], maxDur: 1.0, loud: ['quiet', 'medium'],
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
    categories: ['scifi', 'game', 'magic'], avoid: ['error'], maxDur: 2.5, loud: ['medium'],
  },
  readout: {
    about: 'A console or HUD prints a readout or acknowledges.',
    tags: ['blip', 'terminal', 'console', 'readout', 'computer', 'hud'], terms: ['blips', 'bleep', 'interface beep', 'ship computer'],
    categories: ['scifi'], avoid: ['error'], maxDur: 1.0, loud: ['quiet', 'medium'],
  },
  scan: {
    about: 'A scanner, radar or sensor sweeps.',
    tags: ['scanner', 'scan', 'sweep', 'radar', 'sensor', 'sonar', 'detect'], terms: ['scanning', 'ping the area'],
    categories: ['scifi'], avoid: ['error'], maxDur: 3.0, loud: ['quiet', 'medium'],
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
};
