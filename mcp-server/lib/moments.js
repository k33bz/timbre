// The vocabulary the suggestion tools use: app MOMENTS (what happened in the interface or the game)
// and MOODS (how the app should feel). Both are only hints layered over the catalog's own tags,
// names and descriptions: a moment says which words and categories point at it, how long a sound for
// it can be, and how loud; a mood shifts categories, tag families and loudness. Nothing here names a
// sound, so a sound added to the catalog is picked up the day it carries the right tags.
//
// The words come from the tag vocabulary the catalog actually uses (soft, wood, glass, mechanical,
// 8-bit, press, tap, whoosh, stinger, ...); the tests check that every moment still finds a sound.
import { stems, stem } from './text.js';

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
 *   hints       parameter values to set when the sound has that parameter (the direction of a
 *               toggle: on; of a drawer or modal: open)
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

const MULTI = /[\s-]/;
for (const [name, m] of Object.entries(MOMENTS)) {
  m.name = name;
  const single = (list) => list.filter((t) => !MULTI.test(t));
  const multi = (list) => list.filter((t) => MULTI.test(t));
  m.tagStems = [...new Set(single(m.tags).flatMap((t) => stems(t)))];
  const termAll = [...new Set(single(m.terms).flatMap((t) => stems(t)))];
  m.termStems = termAll.filter((w) => !m.tagStems.includes(w));   // for scoring sounds
  m.detectStems = termAll;                                        // for reading a description
  m.avoidStems = [...new Set(m.avoid.flatMap((t) => stems(t.replace(/-/g, ' '))))];
  // whole hyphenated tags ("level-up"): matched against a sound's tags as they are written
  m.rawTags = multi(m.tags).map((t) => t.toLowerCase());
  // phrases as stem sequences: the moment's own multi-word name and any multi-word term or tag
  m.phrases = [...multi([name]), ...multi(m.terms), ...multi(m.tags)]
    .map((t) => stems(t.replace(/-/g, ' ')).join(' ')).filter((t) => t.includes(' '));
}

/**
 * Moods. Fields: words that signal it in a description; tags a sound carries when it fits (a tag
 * match lifts the sound); category boosts; loudness preference (best first); categories that clash.
 * hints set parameters the same way a moment's do (the retro mood turns a sound's chip switch on).
 * Boosts are fractions: boost 1.5 lifts a score by 18 percent. A tag match lifts it by tagBoost
 * (default 0.18) per tag, at most two; the style moods (wood, glass, mechanical, air, retro) use 0.6
 * because naming a style is an explicit request.
 */
export const MOODS = {
  calm: {
    about: 'Quiet, unobtrusive feedback.',
    words: ['calm', 'soft', 'gentle', 'quiet', 'subtle', 'mindful', 'meditation', 'wellness', 'sleep', 'relax', 'relaxing', 'zen', 'minimal', 'peaceful', 'cozy', 'muted', 'unobtrusive', 'discreet'],
    tags: ['soft', 'gentle', 'cozy', 'warm', 'quiet'],
    boost: { ui: 1.5, notify: 1 }, loud: ['quiet', 'medium'], dislike: ['loud'],
  },
  professional: {
    about: 'Clean, restrained feedback for work tools.',
    words: ['professional', 'productivity', 'business', 'enterprise', 'saas', 'dashboard', 'work', 'serious', 'corporate', 'fintech', 'finance', 'banking', 'admin', 'office', 'tool', 'b2b'],
    tags: ['soft', 'glass'],
    boost: { ui: 1.5, notify: 1 }, loud: ['quiet', 'medium'], dislike: ['loud'], penalty: { game: 1.5, magic: 1 },
  },
  playful: {
    about: 'Bright, bouncy, rewarding.',
    words: ['playful', 'fun', 'kids', 'children', 'casual', 'cheerful', 'friendly', 'happy', 'cute', 'bouncy', 'colorful', 'family'],
    tags: ['cartoon', 'bounce', 'bubble', 'pop', 'cheerful', 'bloop'],
    boost: { game: 1, magic: 1.5 }, loud: ['medium', 'loud'],
  },
  retro: {
    about: 'Retro game feel: chiptune beeps and blips.',
    words: ['retro', 'arcade', '8bit', 'chiptune', 'pixel', 'nes', 'platformer', 'rpg'],
    tags: ['8-bit', 'chiptune', 'retro', 'arcade', 'square'],
    tagBoost: 0.6,
    hints: { chip: 1 },   // game sounds with a chip switch get their square-wave voicing
    boost: { game: 2 }, loud: ['medium', 'loud'],
  },
  gamey: {
    about: 'A video game.',
    words: ['game', 'gaming', 'gamer', 'videogame'],
    tags: [],
    boost: { game: 1 }, loud: ['medium', 'loud'],
  },
  'sci-fi': {
    about: 'Futuristic and technical.',
    words: ['scifi', 'sci', 'space', 'futuristic', 'cyber', 'cyberpunk', 'robot', 'tech', 'hud', 'starship', 'terminal'],
    tags: ['sci-fi', 'digital', 'robot', 'computer', 'terminal', 'console'],
    boost: { scifi: 2.5 }, loud: ['medium'],
  },
  magical: {
    about: 'Fantasy and wonder.',
    words: ['magic', 'magical', 'fantasy', 'whimsical', 'fairy', 'wizard', 'enchanted', 'storybook', 'spell'],
    tags: ['magic', 'spell', 'fairy', 'sparkle', 'shimmer'],
    boost: { magic: 2.5 }, loud: ['medium', 'quiet'],
  },
  tabletop: {
    about: 'Cards, boards and dice.',
    words: ['cards', 'card', 'tabletop', 'board', 'poker', 'deck', 'solitaire', 'boardgame', 'dice', 'casino', 'chess'],
    tags: ['card', 'poker', 'board-game', 'casino', 'dice', 'chess'],
    boost: { cards: 2.5 }, loud: ['quiet', 'medium'],
  },
  atmospheric: {
    about: 'Immersive background sound.',
    words: ['ambient', 'atmospheric', 'immersive', 'ambience', 'soundscape'],
    tags: ['ambient', 'bed', 'nature'],
    boost: { ambience: 2.5 }, loud: ['quiet'],
  },
  musical: {
    about: 'Melodic, tuned feedback.',
    words: ['musical', 'melodic', 'music', 'melody', 'tuned'],
    tags: ['stinger', 'jingle', 'melody', 'arpeggio'],
    boost: { music: 2.5 }, loud: ['medium'],
  },
  dramatic: {
    about: 'Big, punchy, high impact.',
    words: ['dramatic', 'epic', 'intense', 'powerful', 'action', 'heavy', 'punchy', 'bold', 'loud', 'cinematic'],
    tags: ['heavy', 'boss', 'impact', 'combat'],
    boost: { game: 1 }, loud: ['loud', 'medium'],
  },
  wooden: {
    about: 'Warm, natural, wooden knocks.',
    words: ['wood', 'wooden', 'natural', 'organic', 'warm', 'analog', 'handmade', 'craft'],
    tags: ['wood', 'knock', 'thock'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  glassy: {
    about: 'Bright, clear, glassy ticks and pings.',
    words: ['glass', 'glassy', 'crystal', 'crystalline', 'shiny', 'crisp', 'clear', 'bright', 'sleek', 'modern'],
    tags: ['glass', 'crystal', 'ting', 'bright'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  mechanical: {
    about: 'Switches, keys and latches.',
    words: ['mechanical', 'keyboard', 'clicky', 'industrial', 'switch', 'tactile'],
    tags: ['mechanical', 'clicky', 'thock', 'latch'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet', 'medium'],
  },
  airy: {
    about: 'Light, breathy, airy.',
    words: ['airy', 'breathy', 'whisper', 'floaty', 'light', 'ethereal'],
    tags: ['air', 'breeze'],
    tagBoost: 0.6,
    boost: {}, loud: ['quiet'],
  },
};
for (const [name, m] of Object.entries(MOODS)) {
  m.name = name;
  m.wordStems = [...new Set(m.words.map((w) => stem(w)))];
  m.tagStems = [...new Set(m.tags.flatMap((t) => stems(t.replace(/-/g, ' '))))].filter((w) => w !== '8');
}

/** The moods named by words in a text, strongest first (by number of words matched). */
export function moodsIn(text) {
  const have = new Set(stems(text));
  const out = [];
  for (const m of Object.values(MOODS)) {
    const hits = m.wordStems.filter((w) => have.has(w));
    if (hits.length) out.push({ mood: m, hits });
  }
  return out.sort((a, b) => b.hits.length - a.hits.length);
}

// How many moments each stem points at: a word shared by several moments says less about any one.
const SHARED = new Map();
for (const m of Object.values(MOMENTS)) {
  const own = MULTI.test(m.name) ? [] : stems(m.name);
  for (const w of new Set([...own, ...m.tagStems, ...m.detectStems])) SHARED.set(w, (SHARED.get(w) || 0) + 1);
}

/** Detection needs this much evidence in total, and at least one strong hit. */
const DETECT_MIN = 1.4;

/**
 * The moments a free-text description names: [{ moment, strength, matched, first }], in order of
 * first mention. A moment's own name or phrase counts most, then its terms, then its tags; a word
 * that several moments share counts for less in each, and shared tags alone never detect a moment.
 */
export function momentsIn(text) {
  const toks = stems(text);
  const joined = ' ' + toks.join(' ') + ' ';
  // every position in the text where a stem sequence (one word or a phrase) occurs
  const positions = (seq) => {
    const words = seq.split(' ');
    const out = [];
    for (let i = 0; i + words.length <= toks.length; i++) {
      if (words.every((x, k) => toks[i + k] === x)) for (let k = 0; k < words.length; k++) out.push(i + k);
    }
    return out;
  };
  const found = [];
  const inPhrase = new Set();   // words that a phrase of some moment already accounts for
  for (const m of Object.values(MOMENTS)) {
    const matched = [];
    const where = new Set();
    let strength = 0;
    let strong = false;
    let phrase = false;
    let first = Infinity;
    const note = (w, base, isTag) => {
      if (matched.includes(w)) return;
      const weight = base / Math.sqrt(SHARED.get(w) || 1);
      matched.push(w);
      strength += weight;
      if (isTag ? weight >= 1.4 : weight >= 1.0) strong = true;
      const at = joined.indexOf(' ' + w + ' ');
      if (at >= 0 && at < first) first = at;
      for (const i of positions(w)) where.add(i);
    };
    for (const ph of m.phrases) {
      if (!joined.includes(' ' + ph + ' ')) continue;
      note(ph, 3, false);
      phrase = true;
      for (const i of positions(ph)) inPhrase.add(i);
    }
    if (!MULTI.test(m.name)) for (const w of stems(m.name)) if (toks.includes(w)) note(w, 3, false);
    for (const w of m.detectStems) if (toks.includes(w)) note(w, 2, false);
    for (const w of m.tagStems) if (toks.includes(w)) note(w, 1.5, true);
    if (strong && strength >= DETECT_MIN) found.push({ moment: m.name, strength: Math.round(strength * 10) / 10, matched, first, where, phrase });
  }
  // "warp jump" is a teleport, not also a jump: a moment whose every word sits inside another
  // moment's phrase, and which has no phrase of its own, is dropped
  return found
    .filter((f) => f.phrase || ![...f.where].every((i) => inPhrase.has(i)))
    .map(({ where, phrase, ...rest }) => rest)
    .sort((a, b) => a.first - b.first);
}
