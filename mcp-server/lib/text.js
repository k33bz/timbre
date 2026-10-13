// Small text tools for search and suggestions: tokenizing, a light stemmer and synonym groups.
// No dependencies, no model: the catalog is a few hundred short records with curated tags, so a
// weighted keyword match with a thesaurus does the job and stays explainable (every hit lists why).

/** Words that carry no meaning for matching a sound. */
const STOP = new Set(('a an the and or of for to in with when my our your is it its this that these those app apps ' +
  'sound sounds effect effects sfx need want like make get give some any be as at by from i we you should would ' +
  'please use using used one will then than into out about each every so can also very just more most it\'s ' +
  'something thing things new').split(' '));
// "on" and "off" stay: they mean something for switches. "up" is dropped on purpose ("level up" is a phrase).
STOP.delete('on');

export const tokenize = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

/** A crude English stemmer: plural, -ing, -ed and doubled consonants. Applied to both sides alike. */
export function stem(w) {
  if (w.length <= 3) return w;
  let s = w;
  if (s.endsWith('ies') && s.length > 4) s = s.slice(0, -3) + 'y';
  else if (/(ss|us|is)$/.test(s)) s = s;
  else if (/(sh|ch|x|z|s)es$/.test(s) && s.length > 5) s = s.slice(0, -2);
  else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  if (s.length > 3 && s[s.length - 1] === s[s.length - 2] && !/(ll|ss|ee|oo)$/.test(s)) s = s.slice(0, -1);
  if (s.endsWith('e') && s.length > 4) s = s.slice(0, -1);
  return s;
}

/** Pairs [{ word, stem }] of a text, without stop words, in order. */
export function stemPairs(text) {
  return tokenize(text).filter((t) => !STOP.has(t)).map((word) => ({ word, stem: stem(word) }));
}

/** Stemmed tokens of a text, without stop words, in order. */
export function stems(text) {
  return tokenize(text).filter((t) => !STOP.has(t)).map(stem);
}

/** Groups of words that point at the same kind of sound. Each word relates to the others in its group. */
const SYNONYM_GROUPS = [
  ['click', 'tap', 'press', 'button', 'tick', 'pointer', 'mouse', 'select', 'choose', 'pick'],
  ['toggle', 'switch', 'checkbox', 'radio', 'enable', 'disable', 'activate'],
  ['success', 'done', 'complete', 'completed', 'finish', 'finished', 'confirm', 'confirmation', 'accept', 'accepted', 'ok', 'positive', 'correct', 'saved', 'save', 'chime', 'ding', 'approve'],
  ['error', 'fail', 'failure', 'failed', 'invalid', 'denied', 'reject', 'rejected', 'wrong', 'negative', 'buzz', 'incorrect', 'blocked', 'forbidden', 'declined', 'mistake'],
  ['warning', 'caution', 'alert', 'attention', 'careful'],
  ['notify', 'notification', 'ping', 'message', 'remind', 'reminder', 'incoming', 'inbox', 'alert', 'chat', 'mail', 'email'],
  ['whoosh', 'swoosh', 'swish', 'swipe', 'swing', 'dash', 'slide', 'transition', 'air', 'rush', 'fly'],
  ['coin', 'money', 'cash', 'gold', 'currency', 'pickup', 'collect', 'reward', 'loot', 'treasure', 'ping'],
  ['card', 'deck', 'deal', 'draw', 'shuffle', 'paper', 'flick', 'riffle', 'poker', 'tabletop'],
  ['magic', 'sparkle', 'shimmer', 'twinkle', 'fairy', 'heal', 'spell', 'enchant', 'glitter', 'bonus', 'wonder', 'whimsical'],
  ['hit', 'impact', 'smash', 'punch', 'hammer', 'clank', 'anvil', 'thud', 'slam', 'strike', 'bang', 'metal', 'knock'],
  ['laser', 'zap', 'shoot', 'blaster', 'beam', 'phaser', 'shot', 'fire'],
  ['scifi', 'futuristic', 'space', 'robot', 'cyber', 'tech', 'digital', 'computer'],
  ['ambient', 'ambience', 'atmosphere', 'background', 'drone', 'texture', 'loop', 'room'],
  ['music', 'melody', 'jingle', 'fanfare', 'tune', 'musical', 'arpeggio', 'stinger', 'sting', 'note'],
  ['explosion', 'boom', 'blast', 'bomb', 'explode', 'crash', 'detonate'],
  ['jump', 'hop', 'bounce', 'boing', 'spring', 'leap'],
  ['open', 'close', 'modal', 'dialog', 'menu', 'expand', 'collapse', 'panel', 'drawer', 'popup'],
  ['delete', 'remove', 'trash', 'discard', 'erase', 'clear', 'dismiss'],
  ['send', 'submit', 'post', 'publish', 'upload', 'launch', 'share'],
  ['level', 'upgrade', 'powerup', 'promotion', 'unlock', 'victory', 'triumph', 'win', 'achievement', 'celebrate', 'celebration'],
  ['lose', 'defeat', 'gameover', 'death', 'die', 'dead'],
  ['loading', 'progress', 'wait', 'processing', 'spinner', 'refresh', 'sync'],
  ['hover', 'focus', 'highlight', 'over'],
  ['type', 'typing', 'keyboard', 'keypress', 'keystroke', 'key'],
  ['timer', 'countdown', 'alarm', 'clock', 'beep'],
  ['game', 'gaming', 'arcade', 'play'],
];

const RELATED = new Map();
for (const g of SYNONYM_GROUPS) {
  const ss = [...new Set(g.map(stem))];
  for (const a of ss) {
    if (!RELATED.has(a)) RELATED.set(a, new Set());
    for (const b of ss) if (b !== a) RELATED.get(a).add(b);
  }
}

/** Stems related to a stem by the thesaurus (empty set when none). */
export const related = (s) => RELATED.get(s) || new Set();

/** True when stem `d` (from a document) matches query stem `q`: equal, or a prefix of at least 4 letters. */
export function stemMatch(d, q) {
  if (d === q) return 'exact';
  if (q.length >= 4 && d.length >= 4 && (d.startsWith(q) || q.startsWith(d))) return 'prefix';
  return null;
}
