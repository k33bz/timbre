// The text tools: tokenizing, the stemmer, stop words and the thesaurus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, stem, stems, stemPairs, related, stemMatch } from '../lib/text.js';

test('tokenize lowercases and splits on anything that is not a letter or digit', () => {
  assert.deepEqual(tokenize('Soft-UI: click, Click!  8-bit'), ['soft', 'ui', 'click', 'click', '8', 'bit']);
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize(null), []);
});

test('the stemmer folds plurals, -ing, -ed and doubled consonants, and agrees with itself', () => {
  const same = [
    ['click', 'clicks', 'clicked', 'clicking'],
    ['coin', 'coins'],
    ['card', 'cards'],
    ['chime', 'chimes'],
    ['sparkle', 'sparkling', 'sparkles'],
    ['drop', 'dropped', 'dropping', 'drops'],
    ['buzz', 'buzzes', 'buzzing'],
    ['battery', 'batteries'],
  ];
  for (const group of same) {
    const s = new Set(group.map(stem));
    assert.equal(s.size, 1, `${group.join(', ')} -> ${[...s].join(', ')}`);
  }
  assert.notEqual(stem('press'), stem('pres'), 'double s is kept: press is not pres');
  assert.equal(stem('bonus'), 'bonus', 'words ending in us keep their s');
  assert.equal(stem('ring'), 'ring', 'short -ing words are left alone');
});

test('stems drops filler words but keeps on and off', () => {
  assert.deepEqual(stems('I need a sound for the button'), ['button']);
  assert.deepEqual(stems('turn it on, then off'), ['turn', 'on', 'off']);
  assert.ok(stems('level up').includes('up'), 'up stays: it is half of "level up"');
});

test('stemPairs keeps the original word beside its stem', () => {
  assert.deepEqual(stemPairs('Coins dropping'), [{ word: 'coins', stem: 'coin' }, { word: 'dropping', stem: 'drop' }]);
});

test('the thesaurus relates neighbours in both directions', () => {
  assert.ok(related(stem('tap')).has(stem('click')));
  assert.ok(related(stem('click')).has(stem('tap')));
  assert.ok(related(stem('failed')).has(stem('error')));
  assert.ok(related(stem('swipe')).has(stem('whoosh')));
  assert.equal(related('zzzz').size, 0);
  assert.ok(!related(stem('click')).has(stem('click')), 'a word is not its own neighbour');
});

test('stemMatch: equal is exact, a long shared prefix is a prefix match, short stems never prefix-match', () => {
  assert.equal(stemMatch('click', 'click'), 'exact');
  assert.equal(stemMatch('sparkle', 'spark'), 'prefix');
  assert.equal(stemMatch('spark', 'sparkle'), 'prefix');
  assert.equal(stemMatch('on', 'online'), null);
  assert.equal(stemMatch('tap', 'tape'), null);
  assert.equal(stemMatch('coin', 'door'), null);
});
