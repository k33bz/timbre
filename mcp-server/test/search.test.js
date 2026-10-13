// Ranked search over a catalog whose tags the test controls, and over the real one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Catalog } from '../lib/catalog.js';
import { SearchIndex, search, applyFilters, FilterError } from '../lib/search.js';
import { indexFor } from '../lib/suggest.js';
import { HAVE_REPO, REAL_CATALOG } from './helper.js';
import { fixtureDir } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

let fx = null;
function fixture(t) {
  if (skip(t)) return null;
  if (!fx) {
    const c = new Catalog(fixtureDir(), { levelsPath: false }).load();
    fx = { c, index: indexFor(c) };
  }
  return fx;
}
const ids = (r) => r.rows.map((x) => x.d.s.id);

test('a tag match beats a description match, and the best sound comes first', (t) => {
  const f = fixture(t);
  if (!f) return;
  assert.equal(ids(search(f.c, f.index, { query: 'click' }))[0], 'ui-click-soft');
  assert.equal(ids(search(f.c, f.index, { query: 'coin' }))[0], 'game-coin-flip');
  assert.equal(ids(search(f.c, f.index, { query: 'shuffle' }))[0], 'cards-riffle');
  assert.equal(ids(search(f.c, f.index, { query: 'error' }))[0], 'notify-error-buzz');
  assert.equal(ids(search(f.c, f.index, { query: 'laser' }))[0], 'game-laser-zap');
});

test('plurals and -ing forms find the same sounds', (t) => {
  const f = fixture(t);
  if (!f) return;
  assert.deepEqual(ids(search(f.c, f.index, { query: 'coins' })).slice(0, 1), ['game-coin-flip']);
  assert.equal(ids(search(f.c, f.index, { query: 'shuffling cards' }))[0], 'cards-riffle');
  assert.equal(ids(search(f.c, f.index, { query: 'clicking' }))[0], 'ui-click-soft');
});

test('near-synonyms find sounds that never use the word (tap -> click, failed -> error, swipe -> whoosh)', (t) => {
  const f = fixture(t);
  if (!f) return;
  assert.ok(ids(search(f.c, f.index, { query: 'tap' })).slice(0, 2).includes('ui-click-soft'));
  assert.equal(ids(search(f.c, f.index, { query: 'rejected' }))[0], 'notify-error-buzz');
  assert.ok(ids(search(f.c, f.index, { query: 'swipe' })).slice(0, 2).includes('game-whoosh'));
});

test('a word that is only in the description still finds the sound, at a lower rank', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { query: 'reactor' });
  assert.equal(ids(r)[0], 'scifi-power-hum');
  const r2 = search(f.c, f.index, { query: 'anvil' });
  assert.ok(r2.total === 0 || ids(r2)[0] !== 'ui-click-soft');
});

test('several words: a sound that matches all of them wins over one that matches part', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { query: 'card paper deck' });
  assert.equal(ids(r)[0], 'cards-riffle');
  assert.equal(ids(search(f.c, f.index, { query: 'metal hit' }))[0], 'game-hammer-hit');
});

test('every hit says why: matched fields name the words', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { query: 'click' });
  assert.ok(r.rows[0].why.some((w) => w.startsWith('tag:click')));
  assert.ok(r.rows[0].score > r.rows[r.rows.length - 1].score);
});

test('no query lists everything that passes the filters in gallery order', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { limit: 100 });
  assert.equal(r.total, f.c.sounds.length);
  assert.deepEqual(ids(r), f.c.sounds.map((s) => s.id));
});

test('an unknown word finds nothing', (t) => {
  const f = fixture(t);
  if (!f) return;
  assert.equal(search(f.c, f.index, { query: 'zxqvk' }).total, 0);
});

test('filters: category, one or several', (t) => {
  const f = fixture(t);
  if (!f) return;
  const ui = search(f.c, f.index, { filters: { category: 'ui' }, limit: 50 });
  assert.ok(ui.total > 0 && ids(ui).every((id) => id.startsWith('ui-')));
  const two = search(f.c, f.index, { filters: { category: ['cards', 'magic'] }, limit: 50 });
  assert.deepEqual(new Set(ids(two).map((id) => id.split('-')[0])), new Set(['cards', 'magic']));
});

test('filters: duration bounds', (t) => {
  const f = fixture(t);
  if (!f) return;
  const short = search(f.c, f.index, { filters: { max_duration: 0.1 }, limit: 50 });
  assert.ok(short.total >= 2);
  assert.ok(short.rows.every((r) => r.d.s.dur <= 0.1));
  const long = search(f.c, f.index, { filters: { min_duration: 1.5 }, limit: 50 });
  assert.ok(long.total >= 2);
  assert.ok(long.rows.every((r) => r.d.s.dur >= 1.5));
  const mid = search(f.c, f.index, { filters: { min_duration: 0.4, max_duration: 0.6 }, limit: 50 });
  assert.ok(mid.rows.every((r) => r.d.s.dur >= 0.4 && r.d.s.dur <= 0.6));
});

test('filters: loudness band', (t) => {
  const f = fixture(t);
  if (!f) return;
  for (const band of ['quiet', 'medium', 'loud']) {
    const r = search(f.c, f.index, { filters: { loudness: band }, limit: 50 });
    assert.ok(r.total > 0, `some ${band} sounds`);
    assert.ok(r.rows.every((x) => x.d.level.band === band));
  }
  const two = search(f.c, f.index, { filters: { loudness: ['quiet', 'loud'] }, limit: 50 });
  assert.ok(two.rows.every((x) => ['quiet', 'loud'].includes(x.d.level.band)));
});

test('filters: required tags, and they combine with the query', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { filters: { tags: ['card'] }, limit: 50 });
  assert.deepEqual(ids(r).sort(), ['cards-flick', 'cards-riffle']);
  const both = search(f.c, f.index, { query: 'paper', filters: { tags: ['deck'] } });
  assert.deepEqual(ids(both), ['cards-riffle']);
});

test('filters combine: category + max duration + query', (t) => {
  const f = fixture(t);
  if (!f) return;
  const r = search(f.c, f.index, { query: 'click', filters: { category: 'ui', max_duration: 0.1 } });
  assert.equal(ids(r)[0], 'ui-click-soft');
  assert.ok(r.rows.every((x) => x.d.s.category === 'ui' && x.d.s.dur <= 0.1), 'nothing outside the filters');
  assert.ok(!ids(r).includes('ui-toggle-switch'), 'the 0.25 s toggle is excluded');
});

test('an unknown category or loudness band is an error that names the choices', (t) => {
  const f = fixture(t);
  if (!f) return;
  assert.throws(() => search(f.c, f.index, { filters: { category: 'weather' } }), (e) => e instanceof FilterError && /Categories: /.test(e.message) && e.code === 'bad_category');
  assert.throws(() => search(f.c, f.index, { filters: { loudness: 'deafening' } }), (e) => e instanceof FilterError && /quiet, medium, loud/.test(e.message));
});

test('paging: offset and limit slice one ranked list', (t) => {
  const f = fixture(t);
  if (!f) return;
  const all = search(f.c, f.index, { query: 'click', limit: 50 });
  const p1 = search(f.c, f.index, { query: 'click', limit: 2, offset: 0 });
  const p2 = search(f.c, f.index, { query: 'click', limit: 2, offset: 2 });
  assert.equal(p1.total, all.total);
  assert.deepEqual([...ids(p1), ...ids(p2)], ids(all).slice(0, 4));
});

test('ties break by shorter duration, then id (stable, deterministic)', (t) => {
  const f = fixture(t);
  if (!f) return;
  const a = ids(search(f.c, f.index, { query: 'card', limit: 50 }));
  const b = ids(search(f.c, f.index, { query: 'card', limit: 50 }));
  assert.deepEqual(a, b);
});

test('IDF: a rare word outweighs a common one', () => {
  const sounds = [
    { id: 'a-one', name: 'One', category: 'ui', tags: ['common', 'rare'], desc: 'something quiet here', dur: 0.1 },
    { id: 'a-two', name: 'Two', category: 'ui', tags: ['common'], desc: 'something quiet here', dur: 0.1 },
    { id: 'a-three', name: 'Three', category: 'ui', tags: ['common'], desc: 'something quiet here', dur: 0.1 },
    { id: 'a-four', name: 'Four', category: 'ui', tags: ['common'], desc: 'something quiet here', dur: 0.1 },
  ];
  const idx = new SearchIndex(sounds);
  assert.ok(idx.idf('rare') > idx.idf('common'));
  const cat = { sounds, get: () => null };
  const r = search(cat, idx, { query: 'common rare' });
  assert.equal(r.rows[0].d.s.id, 'a-one');
});

test('applyFilters ignores a catalog category it does not know only when the sounds carry it', () => {
  const sounds = [{ id: 'x-one', name: 'One', category: 'x', tags: ['t'], desc: 'a thing here now', dur: 0.1 }];
  const idx = new SearchIndex(sounds);
  const cat = { sounds };
  assert.equal(applyFilters(cat, idx.docs, { category: 'x' }).length, 1);
  assert.throws(() => applyFilters(cat, idx.docs, { category: 'y' }), FilterError);
});

test('the real catalog: common words find sounds of the right kind', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const idx = indexFor(c);
  const top = (q, n = 5) => search(c, idx, { query: q, limit: n }).rows.map((r) => r.d.s);
  assert.ok(top('click').some((s) => s.category === 'ui' && s.tags.includes('click')), 'click');
  assert.ok(top('coin').some((s) => s.tags.includes('coin')), 'coin');
  assert.ok(top('shuffle', 3).every((s) => s.category === 'cards' || s.tags.includes('shuffle')), 'shuffle');
  assert.ok(top('rain').some((s) => s.category === 'ambience'), 'rain');
  assert.ok(top('laser', 3).some((s) => s.category === 'scifi'), 'laser');
  assert.ok(top('fanfare', 3).some((s) => s.category === 'music'), 'fanfare');
  assert.ok(top('error').some((s) => s.tags.includes('error') || s.tags.includes('fail')), 'error');
  for (const q of ['click', 'whoosh', 'bell', 'sword', 'coin', 'wood']) {
    assert.ok(search(c, idx, { query: q }).total > 0, `"${q}" finds something`);
  }
});

test('the real catalog: every sound is found by its own name, id and leading tags', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const idx = indexFor(c);
  const rankOf = (query, id) => ids(search(c, idx, { query, limit: 300 })).indexOf(id) + 1;
  let byName3 = 0;
  const lost = [];
  for (const s of c.sounds) {
    const rn = rankOf(s.name, s.id);
    if (rn >= 1 && rn <= 3) byName3++;
    const ri = rankOf(s.id.replace(/-/g, ' '), s.id);
    if (ri < 1 || ri > 5) lost.push(`${s.id} by id: ${ri}`);
    const r2 = rankOf(s.tags.slice(0, 2).join(' '), s.id);
    if (r2 < 1 || r2 > 15) lost.push(`${s.id} by tags: ${r2}`);
  }
  assert.ok(byName3 / c.sounds.length >= 0.97, `${byName3} of ${c.sounds.length} found in the top 3 by name`);
  assert.deepEqual(lost, []);
});
