// Moments, moods and suggestions: reading a description, ranking sounds for a moment with reasons,
// and holding the lexicon to the real catalog (every moment still finds a sound).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Catalog } from '../lib/catalog.js';
import { MOMENTS, MOODS, momentsIn, moodsIn } from '../lib/moments.js';
import { suggest, rankMoment, pickForMoment, specFor, themeFromText, activeMoods, hintsFor, trimRows, indexFor } from '../lib/suggest.js';
import { HAVE_REPO, REAL_CATALOG } from './helper.js';
import { fixtureDir } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

let fx = null;
const fixture = (t) => {
  if (skip(t)) return null;
  if (!fx) fx = new Catalog(fixtureDir(), { levelsPath: false }).load();
  return fx;
};
const names = (xs) => xs.map((x) => x.moment);

test('moments: a description yields the moments it names, in order of mention', () => {
  assert.deepEqual(names(momentsIn('a dashboard button click, toggle switches, form error and save success')), ['click', 'toggle-on', 'toggle-off', 'error', 'success']);
  assert.deepEqual(names(momentsIn('a meditation timer app that rings when done, with gentle tap feedback')).sort(), ['click', 'success', 'timer']);
  assert.ok(names(momentsIn('retro platformer: coin pickups, jumping, level up and game over')).includes('game-over'));
  assert.ok(names(momentsIn('retro platformer: coin pickups, jumping, level up and game over')).includes('level-up'));
  assert.deepEqual(names(momentsIn('card game with shuffle and dealing')).sort(), ['card-draw', 'shuffle']);
  assert.deepEqual(names(momentsIn('I need a whoosh for slide transitions')), ['transition']);
});

test('moments: words several moments share do not detect any one of them', () => {
  assert.deepEqual(momentsIn('a tick'), [], 'tick alone is ambiguous (click, hover, type)');
  assert.deepEqual(momentsIn('something nice for my app'), []);
  assert.deepEqual(momentsIn(''), []);
});

test('moods are read from the description, strongest first', () => {
  assert.deepEqual(moodsIn('a calm, gentle meditation timer').map((m) => m.mood.name), ['calm']);
  assert.ok(moodsIn('retro 8-bit arcade game').map((m) => m.mood.name).includes('retro'));
  assert.ok(moodsIn('a wooden board game').map((m) => m.mood.name).includes('wooden'));
  assert.deepEqual(moodsIn('nothing special here'), []);
});

test('every moment and mood is well formed', () => {
  for (const [name, m] of Object.entries(MOMENTS)) {
    assert.equal(m.name, name);
    assert.ok(m.about && m.tags.length >= 3, `${name} has an about and tags`);
    assert.ok(m.categories.length, `${name} has categories`);
    assert.ok(m.loud.length, `${name} has a loudness preference`);
    if (m.maxDur && m.minDur) assert.ok(m.minDur < m.maxDur, name);
  }
  for (const [name, m] of Object.entries(MOODS)) assert.ok(m.about && m.words.length && m.name === name, name);
});

test('specFor gives custom moments a spec made from their words', () => {
  const s = specFor('Pomodoro Finished');
  assert.equal(s.name, 'pomodoro-finished');
  assert.equal(s.known, false);
  assert.deepEqual(s.tagStems, ['pomodoro', 'finish']);
  assert.equal(specFor('click').known, true);
});

test('rankMoment: the fixture gives the obvious answer for the core moments', (t) => {
  const c = fixture(t);
  if (!c) return;
  const best = (m, ctx) => rankMoment(c, specFor(m), ctx)[0].sound.id;
  assert.equal(best('click'), 'ui-click-soft');
  assert.equal(best('hover'), 'ui-hover-tick');
  assert.equal(best('toggle-on'), 'ui-toggle-switch');
  assert.equal(best('success'), 'notify-success-chime');
  assert.equal(best('error'), 'notify-error-buzz');
  assert.equal(best('warning'), 'notify-warning-double');
  assert.equal(best('message'), 'notify-message-pop');
  assert.equal(best('coin'), 'game-coin-flip');
  assert.equal(best('hit'), 'game-hammer-hit');
  assert.equal(best('transition'), 'game-whoosh');
  assert.equal(best('shoot'), 'game-laser-zap');
  assert.equal(best('card-draw'), 'cards-flick');
  assert.equal(best('shuffle'), 'cards-riffle');
  assert.equal(best('sparkle'), 'magic-sparkle');
  assert.equal(best('victory'), 'music-win-jingle');
  assert.equal(best('ambience'), 'ambience-room-tone');
});

test('rankMoment: every candidate carries reasons, and a strong one says which tags matched', (t) => {
  const c = fixture(t);
  if (!c) return;
  const rows = rankMoment(c, specFor('click'));
  assert.ok(rows.length >= 2);
  assert.equal(rows[0].strong, true);
  assert.ok(rows[0].reasons.some((r) => /^tagged .*click/.test(r)), rows[0].reasons.join(' | '));
  assert.ok(rows.every((r) => r.reasons.length >= 1));
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].score >= rows[i].score, 'sorted best first');
});

test('rankMoment: a long sound is marked down for a frequent moment, and says so', (t) => {
  const c = fixture(t);
  if (!c) return;
  const rows = rankMoment(c, specFor('click'));
  const long = rows.find((r) => r.sound.dur > 0.3);
  if (long) assert.ok(long.reasons.some((r) => /long for click/.test(r)));
  const short = rows.find((r) => r.sound.id === 'ui-click-soft');
  assert.ok(short.reasons.some((r) => /short enough to repeat/.test(r)));
});

test('rankMoment: a clashing tag rules a sound down (the error buzz is not a success)', (t) => {
  const c = fixture(t);
  if (!c) return;
  const rows = rankMoment(c, specFor('success'));
  const ids = rows.map((r) => r.sound.id);
  assert.ok(!ids.slice(0, 2).includes('notify-error-buzz'));
});

test('rankMoment: moods change the order (calm prefers quiet ui; arcade prefers game)', (t) => {
  const c = fixture(t);
  if (!c) return;
  const calm = rankMoment(c, specFor('notify'), { moods: activeMoods('calm and gentle') });
  const playful = rankMoment(c, specFor('notify'), { moods: activeMoods('playful and magical') });
  assert.ok(calm.length && playful.length);
  const r = (rows, id) => rows.findIndex((x) => x.sound.id === id);
  assert.ok(r(playful, 'magic-sparkle') <= r(calm, 'magic-sparkle'), 'a magical mood lifts the sparkle');
  assert.ok(playful[0].reasons.some((x) => /mood/.test(x)) || calm[0].reasons.some((x) => /mood/.test(x)));
});

test('rankMoment: a theme nudges the sound it uses for the moment', (t) => {
  const c = fixture(t);
  if (!c) return;
  const arcade = c.theme('arcade');
  const rows = rankMoment(c, specFor('click'), { theme: arcade });
  assert.equal(rows[0].sound.id, 'ui-click-soft');
  assert.ok(rows[0].reasons.some((x) => /Arcade theme/.test(x)));
  const vict = rankMoment(c, specFor('victory'), { theme: arcade });
  assert.equal(vict[0].sound.id, 'music-win-jingle');
});

test('rankMoment honors filters: category, duration, loudness', (t) => {
  const c = fixture(t);
  if (!c) return;
  assert.ok(rankMoment(c, specFor('click'), { filters: { category: 'game' } }).every((r) => r.sound.category === 'game'));
  assert.ok(rankMoment(c, specFor('click'), { filters: { max_duration: 0.06 } }).every((r) => r.sound.dur <= 0.06));
  assert.ok(rankMoment(c, specFor('click'), { filters: { loudness: 'loud' } }).every((r) => r.level.band === 'loud'));
});

test('hintsFor sets a parameter only when the sound has it, inside its range', (t) => {
  const c = fixture(t);
  if (!c) return;
  assert.deepEqual(hintsFor(MOMENTS['toggle-on'], c.get('ui-toggle-switch')), { on: 1 });
  assert.deepEqual(hintsFor(MOMENTS['toggle-off'], c.get('ui-toggle-switch')), { on: 0 });
  assert.deepEqual(hintsFor(MOMENTS['toggle-on'], c.get('ui-click-soft')), {});
  assert.deepEqual(hintsFor(MOMENTS.click, c.get('ui-click-soft')), {});
});

test('pickForMoment returns the best sound and a few alternatives, or null', (t) => {
  const c = fixture(t);
  if (!c) return;
  const p = pickForMoment(c, 'click');
  assert.equal(p.row.sound.id, 'ui-click-soft');
  assert.ok(Array.isArray(p.alternatives));
  assert.equal(pickForMoment(c, 'quantum-entanglement'), null);
});

test('pickForMoment spreads picks: a sound already used is marked down', (t) => {
  const c = fixture(t);
  if (!c) return;
  const a = pickForMoment(c, 'notify');
  const b = pickForMoment(c, 'notify', { used: new Set([a.row.sound.id]) });
  assert.ok(b.row.score < a.row.score || b.row.sound.id !== a.row.sound.id);
});

test('trimRows drops the long tail and keeps the best', () => {
  const rows = [10, 9, 6, 1.5, 1].map((score, i) => ({ score, strong: i < 3, sound: { id: 'x' + i } }));
  const kept = trimRows(rows, 10);
  assert.deepEqual(kept.map((r) => r.score), [10, 9, 6]);
  assert.equal(trimRows(rows, 2).length, 2);
  assert.deepEqual(trimRows([], 3), []);
});

test('themeFromText finds a theme named by every word of its name', (t) => {
  const c = fixture(t);
  if (!c) return;
  assert.equal(themeFromText(c, 'soft ui').id, 'soft-ui');
  assert.equal(themeFromText(c, 'something like Arcade please').id, 'arcade');
  assert.equal(themeFromText(c, 'soft'), null, 'half of a name is not the theme');
  assert.equal(themeFromText(c, ''), null);
});

test('suggest: a description turns into moments with candidates and reasons', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { description: 'a meditation timer app that rings when done, with gentle tap feedback' });
  const byMoment = Object.fromEntries(r.groups.map((g) => [g.moment, g]));
  assert.ok(byMoment.timer && byMoment.success && byMoment.click);
  assert.equal(byMoment.click.candidates[0].id, 'ui-click-soft');
  assert.equal(byMoment.success.candidates[0].id, 'notify-success-chime');
  assert.deepEqual(r.moods.map((m) => m.mood.name), ['calm']);
  for (const g of r.groups) for (const cand of g.candidates) {
    assert.ok(cand.reasons.length && cand.fit && cand.name && typeof cand.score === 'number');
    assert.ok(cand.loudness && cand.loudness.band);
  }
  assert.ok(byMoment.click.source === 'read from the description');
});

test('suggest: named moments are added to the ones read from the description', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { description: 'a quiz app', moments: ['success', 'error'] });
  assert.deepEqual(r.groups.map((g) => g.moment), ['success', 'error']);
  assert.ok(r.groups.every((g) => g.source === 'requested'));
});

test('suggest: toggles come with the parameter that sets their direction', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { moments: ['toggle-on', 'toggle-off'] });
  assert.deepEqual(r.groups[0].candidates[0].params, { on: 1 });
  assert.deepEqual(r.groups[1].candidates[0].params, { on: 0 });
});

test('suggest: a moment the catalog cannot fill says so', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { moments: ['quantum-entanglement'] });
  assert.equal(r.groups[0].candidates.length, 0);
  assert.match(r.groups[0].note, /Nothing in the catalog matches/);
  assert.ok(r.match, 'falls back to plain-word matching');
});

test('suggest: words with no known moment fall back to plain search', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { description: 'reactor engine startup' });
  assert.equal(r.groups.length, 0);
  assert.equal(r.match.candidates[0].id, 'scifi-power-hum');
  assert.ok(r.match.candidates[0].reasons[0].startsWith('words match'));
});

test('suggest: filters apply to every group', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { moments: ['click', 'coin'], filters: { max_duration: 0.3 } });
  for (const g of r.groups) for (const cand of g.candidates) assert.ok(cand.dur <= 0.3);
});

test('suggest: a theme named in the mood is used where it covers a moment', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = suggest(c, { moments: ['hit'], mood: 'arcade' });
  assert.equal(r.theme.id, 'arcade');
  assert.equal(r.groups[0].candidates[0].id, 'game-hammer-hit');
});

test('the real catalog: every moment in the lexicon finds a sound, and the picks are in the right category', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  indexFor(c);
  let empty = [];
  let wrongCategory = [];
  for (const [name, spec] of Object.entries(MOMENTS)) {
    const p = pickForMoment(c, name);
    if (!p) { empty.push(name); continue; }
    if (!spec.categories.includes(p.row.sound.category)) wrongCategory.push(`${name} -> ${p.row.sound.id}`);
  }
  assert.deepEqual(empty, [], 'moments with no sound at all');
  assert.ok(wrongCategory.length <= 4, `picks outside the moment's categories: ${wrongCategory.join(', ')}`);
});

test('the real catalog: well-known moments pick the sound a person would', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const best = (m) => pickForMoment(c, m).row.sound;
  assert.ok(best('click').tags.includes('click'));
  assert.equal(best('success').category, 'notify');
  assert.equal(best('error').category, 'notify');
  assert.ok(best('error').tags.some((x) => ['error', 'fail', 'negative'].includes(x)));
  assert.equal(best('card-draw').category, 'cards');
  assert.equal(best('shuffle').category, 'cards');
  assert.equal(best('shoot').category, 'scifi');
  assert.equal(best('ambience').category, 'ambience');
  assert.equal(best('hit').category, 'game');
  assert.equal(best('sparkle').category, 'magic');
});

test('the real catalog: a style word picks that style (wood, glass, mechanical, retro)', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const pick = (mood, m) => pickForMoment(c, m, { moods: activeMoods(mood) }).row.sound;
  const wood = pick('wooden', 'click');
  const glass = pick('glassy', 'click');
  const mech = pick('mechanical', 'type');
  assert.ok(wood.tags.includes('wood') || /wood/.test(wood.id), wood.id);
  assert.ok(glass.tags.includes('glass') || /glass/.test(glass.id), glass.id);
  assert.ok(mech.tags.includes('mechanical') || /mechanical/.test(mech.id), mech.id);
  const retro = pick('retro 8-bit arcade', 'jump');
  assert.equal(retro.category, 'game');
});
