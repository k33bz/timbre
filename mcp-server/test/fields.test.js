// The catalog's own fields (schema 2) used in place of inference: family, moments, parameter desc
// and role, measured levels carried in the catalog, the version and the Copy contract. Each test
// writes a small catalog from the fixture with exactly the fields it needs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Catalog } from '../lib/catalog.js';
import { parseReport, LevelBook } from '../lib/levels.js';
import { rankMoment, specFor, hintsFor, paramFor, activeMoods } from '../lib/suggest.js';
import { MOMENTS, FAMILIES, ROLES } from '../lib/moments.js';
import { MOMENTS as SHARED } from '../../src/vocabulary.js';
import { HAVE_REPO, makeServer, call, tmpDir, writeCatalog } from './helper.js';
import { fixtureManifest, realManifest } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

/** The fixture manifest with edits applied to named sounds. */
function manifestWith(edits = {}, top = {}) {
  const m = fixtureManifest();
  for (const s of m.sounds) if (edits[s.id]) Object.assign(s, typeof edits[s.id] === 'function' ? edits[s.id](s) : edits[s.id]);
  return Object.assign(m, top);
}
const catalogOf = (m, opts = { levelsPath: false }) => new Catalog(writeCatalog(tmpDir(), m), opts).load();

test('the moment vocabulary is the shared one: same keys, same order, derived fields on copies only', () => {
  assert.deepEqual(Object.keys(MOMENTS), Object.keys(SHARED));
  assert.ok(MOMENTS.click.tagStems && !SHARED.click.tagStems, 'derived fields stay out of the shared objects');
  assert.ok(Object.keys(FAMILIES).length >= 8);
  assert.deepEqual(Object.keys(ROLES).sort(), ['chip', 'go', 'on', 'open']);
});

test('catalog: family, moments, param desc and role, levels, fingerprint and the Copy contract are read', (t) => {
  if (skip(t)) return;
  const m = manifestWith({
    'ui-click-soft': { family: 'soft', moments: ['click', 'hover'], fingerprint: 'abcdef123456', levels: { peak: -23.7, rms: -36, worstPeak: -20, lowestPeak: -29, worstRms: -33, pre: -25, end: 0.07, junk: 'x' } },
    'ui-hover-tick': { family: 7, moments: 'hover', levels: { rms: -30 } },
  }, { copy: { signature: 'fn(ac, opts, when, dest)', returns: 'the end time', preroll: 0.2, master: { gain: 0.55 } } });
  const c = catalogOf(m);
  const s = c.get('ui-click-soft');
  assert.equal(s.family, 'soft');
  assert.deepEqual(s.moments, ['click', 'hover']);
  assert.equal(s.fingerprint, 'abcdef123456');
  assert.deepEqual(s.levels, { peak: -23.7, rms: -36, worstPeak: -20, worstRms: -33, lowestPeak: -29, pre: -25, end: 0.07 });
  const h = c.get('ui-hover-tick');
  assert.equal(h.family, null, 'a malformed family is ignored, not fatal');
  assert.deepEqual(h.moments, []);
  assert.equal(h.levels, null, 'levels without a peak are ignored');
  const sw = c.get('ui-toggle-switch').paramList.find((p) => p.name === 'on');
  assert.equal(sw.role, 'on');
  assert.match(sw.desc, /\w/);
  assert.equal(c.copyContract.preroll, 0.2);
  assert.deepEqual(c.warnings, []);
});

test('levels: the catalog\'s measured numbers come first and say where they are from', (t) => {
  if (skip(t)) return;
  const m = manifestWith({ 'ui-click-soft': { levels: { peak: -16.4, rms: -30, worstPeak: -14, lowestPeak: -22, end: 0.08 } } });
  const dir = writeCatalog(tmpDir(), m);
  // a report beside the catalog says something else for the same sound: the catalog wins
  fs.writeFileSync(path.join(dir, 'levels.json'), JSON.stringify({ 'ui-click-soft': { peak: -30, rms: -40 } }));
  const c = new Catalog(dir).load();
  const lv = c.levelOf(c.get('ui-click-soft'));
  assert.equal(lv.source, 'measured');
  assert.equal(lv.from, 'catalog');
  assert.equal(lv.peak, -16.4);
  assert.equal(lv.band, 'loud');
  assert.deepEqual(lv.peakRange, { min: -22, max: -14 });
  assert.equal(lv.audibleEnd, 0.08);
  const other = c.levelOf(c.get('ui-hover-tick'));
  assert.equal(other.source, 'estimated', 'a sound with no measurement anywhere is estimated');
  // levels: false (--levels none) ignores measured numbers wherever they are
  const none = new Catalog(dir, { levelsPath: false }).load();
  assert.equal(none.levelOf(none.get('ui-click-soft')).source, 'estimated');
});

test('parseReport reads catalog/levels.json, and a report entry for another version of a sound is not used', (t) => {
  if (skip(t)) return;
  const rep = parseReport({ schema: 1, about: 'x', sounds: {
    'ui-click-soft': { fingerprint: 'aaaaaaaaaaaa', peak: -23.5, rms: -36.1, worstPeak: -21, worstRms: -34, lowestPeak: -27, pre: -24, end: 0.07 },
    'ui-hover-tick': { fingerprint: 'bbbbbbbbbbbb', peak: -24 },
  } });
  assert.deepEqual(rep.get('ui-click-soft'), { peak: -23.5, rms: -36.1, pre: -24, range: { min: -27, max: -21 }, end: 0.07, renders: 1, problems: 0, fingerprint: 'aaaaaaaaaaaa' });
  const dir = writeCatalog(tmpDir(), manifestWith({ 'ui-click-soft': { fingerprint: 'aaaaaaaaaaaa' }, 'ui-hover-tick': { fingerprint: 'cccccccccccc' } }));
  const file = path.join(dir, 'levels.json');
  fs.writeFileSync(file, JSON.stringify({ schema: 1, sounds: {
    'ui-click-soft': { fingerprint: 'aaaaaaaaaaaa', peak: -23.5, rms: -36.1 },
    'ui-hover-tick': { fingerprint: 'bbbbbbbbbbbb', peak: -24, rms: -38 },
  } }));
  const c = new Catalog(dir).load();
  assert.equal(c.levelOf(c.get('ui-click-soft')).source, 'measured');
  assert.equal(c.levelOf(c.get('ui-click-soft')).from, 'report');
  assert.equal(c.levelOf(c.get('ui-hover-tick')).source, 'estimated', 'measured for another fingerprint: not this sound');
  assert.ok(new LevelBook({ catalogDir: dir }).report, 'the catalog report is found beside the manifest');
});

test('suggest: a sound that lists the moment is made for it, a strong match with that reason first', (t) => {
  if (skip(t)) return;
  const base = rankMoment(catalogOf(manifestWith()), specFor('copy'));
  assert.ok(!base.some((r) => r.sound.id === 'ui-hover-tick'), 'nothing about the hover tick says copy');
  const c = catalogOf(manifestWith({ 'ui-hover-tick': { moments: ['copy', 'hover'] } }));
  const rows = rankMoment(c, specFor('copy'));
  assert.equal(rows[0].sound.id, 'ui-hover-tick');
  assert.equal(rows[0].strong, true);
  assert.equal(rows[0].reasons[0], 'made for copy');
});

test('hints set a switch by its role, whatever the parameter is called', (t) => {
  if (skip(t)) return;
  const renamed = (s) => {
    const { on, ...rest } = s.params;
    return { params: { state: { ...on, role: 'on' }, ...rest }, play: s.play.replace(/p\.on\b/g, 'p.state') };
  };
  const c = catalogOf(manifestWith({ 'ui-toggle-switch': renamed }));
  const sw = c.get('ui-toggle-switch');
  assert.equal(paramFor(sw, 'on'), 'state');
  assert.deepEqual(hintsFor(specFor('toggle-off'), sw), { state: 0 });
  assert.deepEqual(hintsFor(specFor('toggle-on'), sw), { state: 1 });
  // a parameter named like a role but declaring another role is not taken for it
  const odd = catalogOf(manifestWith({ 'ui-toggle-switch': (s) => ({ params: { ...s.params, on: { ...s.params.on, role: 'open' } } }) }));
  assert.equal(paramFor(odd.get('ui-toggle-switch'), 'on'), null);
  assert.deepEqual(hintsFor(specFor('open'), odd.get('ui-toggle-switch')), { on: 1 });
});

test('a mood lifts sounds of its family, and says so', (t) => {
  if (skip(t)) return;
  const spec = specFor('click');
  const moods = activeMoods('glassy');
  const plain = rankMoment(catalogOf(manifestWith()), spec, { moods });
  const c = catalogOf(manifestWith({ 'ui-hover-tick': { family: 'glass' } }));
  const rows = rankMoment(c, spec, { moods });
  const before = plain.find((r) => r.sound.id === 'ui-hover-tick');
  const after = rows.find((r) => r.sound.id === 'ui-hover-tick');
  assert.ok(after.score > before.score * 1.4, `${before.score} -> ${after.score}`);
  assert.ok(after.reasons.includes('glass family, a glassy mood'), after.reasons.join(' | '));
});

test('tools: family filter, family and moments in results, param desc and role, version and Copy contract', async (t) => {
  if (skip(t)) return;
  const m = manifestWith({
    'ui-click-soft': { family: 'soft', moments: ['click'] },
    'cards-flick': { family: 'paper', moments: ['card-draw'] },
  }, { version: '9.9.9', copy: { signature: 'fn(ac, opts, when, dest)', returns: 'the end time in AudioContext seconds', preroll: 0.2, chains: 'one per destination', master: { gain: 0.55 } } });
  const srv = makeServer(writeCatalog(tmpDir(), m));
  const info = (await call(srv, 'info')).data;
  assert.equal(info.version, '9.9.9');
  assert.deepEqual(info.copyContract.masterChain, { gain: 0.55 });
  assert.equal(info.families.soft, 1);
  assert.deepEqual(Object.keys(info.parameterRoles).sort(), ['chip', 'go', 'on', 'open']);
  const fam = (await call(srv, 'search_sounds', { family: 'paper' })).data;
  assert.deepEqual(fam.items.map((x) => x.id), ['cards-flick']);
  assert.deepEqual(fam.items[0].moments, ['card-draw']);
  const bad = await call(srv, 'search_sounds', { family: 'plastic' });
  assert.equal(bad.isError, true);
  assert.equal(bad.data.code, 'bad_family');
  assert.match(bad.data.error, /Unknown family "plastic"/);
  const g = (await call(srv, 'get_sound', { id: 'ui-click-soft', include_code: false })).data;
  assert.equal(g.family, 'soft');
  assert.deepEqual(g.moments, ['click']);
  assert.ok(g.params.every((p) => typeof p.desc === 'string'));
  const kit = (await call(srv, 'build_kit', { moments: ['click'], family: 'soft' })).data;
  assert.equal(kit.moments[0].sound, 'ui-click-soft');
  const sug = (await call(srv, 'suggest_sounds', { moments: ['card-draw'], family: 'paper' })).data;
  assert.equal(sug.suggestions[0].candidates[0].id, 'cards-flick');
  assert.ok(sug.suggestions[0].candidates[0].reasons.includes('made for card-draw'));
});

test('the real catalog: every sound has a family and its switches a role, and a rebuilt catalog validates its moments', (t) => {
  if (skip(t)) return;
  const real = realManifest();
  assert.ok(real.schema >= 2);
  for (const s of real.sounds) {
    assert.ok(Object.hasOwn(FAMILIES, s.family), `${s.id}: ${s.family}`);
    for (const m of s.moments || []) assert.ok(Object.hasOwn(MOMENTS, m), `${s.id}: ${m}`);
  }
  const c = catalogOf(real);
  for (const name of ['on', 'open', 'chip', 'go']) {
    for (const s of c.sounds.filter((x) => Object.hasOwn(x.params, name))) assert.equal(paramFor(s, name), name, `${s.id}.${name}`);
  }
  assert.equal(c.version, real.version);
  assert.equal(c.copyContract.preroll, 0.2);
});
