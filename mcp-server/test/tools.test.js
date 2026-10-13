// Every tool, called through the JSON-RPC layer the way a client calls it: results, errors, and the
// code blocks. Exact answers come from the synthetic catalog; the real catalog is used for
// invariants (every sound's get_copy equals the gallery's Copy).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { buildCopy } from '../lib/copy.js';
import { MockContext } from '../lib/mockaudio.js';
import { HAVE_REPO, REPO, REAL_CATALOG, DASHES, makeServer, call, tmpDir, writeCatalog } from './helper.js';
import { fixtureDir, fixtureManifest } from './fixture.js';
import { runCopy } from './mockrun.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

let fxDir = null;
let fxServer = null;
function fx(t) {
  if (skip(t)) return null;
  if (!fxServer) {
    fxDir = fixtureDir();
    fxServer = makeServer(fxDir);
  }
  return fxServer;
}

// ---------------------------------------------------------------- info

test('info: the version, the categories (empty ones too), themes, moments and the way on', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'info');
  assert.equal(r.isError, false);
  const d = r.data;
  assert.equal(d.name, 'Timbre');
  assert.equal(d.version, '0.0.0-test');
  assert.equal(d.server.name, 'timbre-mcp-server');
  assert.equal(d.catalog.sounds, 18);
  assert.equal(d.catalog.themes, 2);
  assert.equal(d.catalog.mode, 'manifest');
  assert.deepEqual(d.categories.map((c) => c.category), ['ui', 'notify', 'game', 'cards', 'magic', 'scifi', 'ambience', 'music']);
  assert.equal(d.categories.reduce((n, c) => n + c.count, 0), 18);
  assert.deepEqual(d.themes.map((x) => x.id).sort(), ['arcade', 'soft-ui']);
  assert.ok(d.themes.find((x) => x.id === 'soft-ui').moments.includes('toggle-on'));
  assert.deepEqual(d.loudness.bands.map((b) => b.band), ['quiet', 'medium', 'loud']);
  assert.match(d.loudness.source, /estimated/);
  assert.ok(d.moments.understood.includes('level-up') && d.moments.moods.includes('calm'));
  assert.ok(d.moments.inThemes.includes('coin'));
  assert.match(d.copyContract.signature, /fn\(ac, opts, when, dest\)/);
  assert.ok(d.next.length >= 4);
  assert.ok(d.durations.shortest <= d.durations.median && d.durations.median <= d.durations.longest);
});

test('info: band counts fill in as levels become known, and measured reports are named', async (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const report = path.join(tmpDir(), 'levels.json');
  fs.writeFileSync(report, JSON.stringify({ 'ui-click-soft': { peak: -24, rms: -40 }, 'game-hammer-hit': { peak: -13, rms: -35 } }));
  const s = makeServer(dir, { levels: report });
  const before = (await call(s, 'info')).data.loudness;
  assert.equal(before.counts.quiet + before.counts.loud, 2);
  assert.equal(before.counts.notYetKnown, 16);
  assert.match(before.source, /measured values from .*levels\.json for 2 sound/);
  for (const sd of s.catalog.sounds) s.catalog.levelOf(sd);
  const after = (await call(s, 'info')).data.loudness;
  assert.equal(after.counts.notYetKnown, 0);
  assert.equal(after.counts.quiet + after.counts.medium + after.counts.loud, 18);
});

test('info works with no catalog, and says what is wrong', async () => {
  const s = makeServer(path.join(tmpDir(), 'missing'));
  const r = await call(s, 'info');
  assert.equal(r.isError, false);
  assert.match(r.data.catalog.error, /No Timbre catalog/);
  assert.equal(r.data.catalog.sounds, 0);
  assert.equal(r.data.categories.length, 8);
});

test('every other tool says plainly when there is no catalog', async () => {
  const s = makeServer(path.join(tmpDir(), 'missing'));
  const calls = [['search_sounds', {}], ['get_sound', { id: 'x' }], ['get_copy', { id: 'x' }], ['list_themes', {}], ['get_theme', { id: 'x' }], ['build_kit', { moments: ['click'] }], ['suggest_sounds', { description: 'a click' }]];
  for (const [name, args] of calls) {
    const r = await call(s, name, args);
    assert.equal(r.isError, true, name);
    assert.equal(r.data.code, 'catalog_unavailable', name);
    assert.match(r.data.error, /node build\.mjs/, name);
  }
});

// ---------------------------------------------------------------- search_sounds

test('search_sounds: ranked summaries with why, loudness and parameter names', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'search_sounds', { query: 'click' });
  assert.equal(r.isError, false);
  assert.equal(r.data.items[0].id, 'ui-click-soft');
  const top = r.data.items[0];
  assert.deepEqual(Object.keys(top).sort(), ['category', 'desc', 'dur', 'id', 'loudness', 'matched', 'name', 'params', 'score', 'tags']);
  assert.ok(top.matched.some((m) => m.startsWith('tag:click')));
  assert.deepEqual(top.params, ['pitch', 'tone']);
  assert.equal(top.loudness.source, 'estimated');
  assert.ok(r.data.total >= r.data.items.length);
  assert.equal(r.data.code, undefined);
});

test('search_sounds: filters, paging and nextOffset', async (t) => {
  const s = fx(t);
  if (!s) return;
  const q = await call(s, 'search_sounds', { category: 'cards', max_duration: 0.6 });
  assert.deepEqual(q.data.items.map((x) => x.id), ['cards-riffle']);
  const quiet = await call(s, 'search_sounds', { loudness: 'quiet', limit: 50 });
  assert.ok(quiet.data.items.every((x) => x.loudness.band === 'quiet'));
  const p1 = await call(s, 'search_sounds', { limit: 5 });
  assert.equal(p1.data.returned, 5);
  assert.equal(p1.data.nextOffset, 5);
  const p2 = await call(s, 'search_sounds', { limit: 5, offset: 5 });
  assert.notDeepEqual(p1.data.items.map((x) => x.id), p2.data.items.map((x) => x.id));
  const last = await call(s, 'search_sounds', { limit: 50, offset: 10 });
  assert.equal(last.data.nextOffset, undefined);
  const tagged = await call(s, 'search_sounds', { tags: ['card'] });
  assert.equal(tagged.data.total, 2);
});

test('search_sounds: when the filters rule everything out, it shows what the words alone would find', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'search_sounds', { query: 'coin', max_duration: 0.1 });
  assert.equal(r.data.total, 0);
  assert.equal(r.data.relaxed.items[0].id, 'game-coin-flip');
  assert.match(r.data.relaxed.note, /Without the filters/);
  const none = await call(s, 'search_sounds', { query: 'zxqvk' });
  assert.equal(none.data.total, 0);
  assert.match(none.data.hint, /suggest_sounds/);
});

test('search_sounds: bad arguments are errors the agent can fix', async (t) => {
  const s = fx(t);
  if (!s) return;
  for (const [args, code, re] of [
    [{ limit: 0 }, 'invalid_arguments', /limit must be at least 1/],
    [{ limit: 500 }, 'invalid_arguments', /limit must be at most 50/],
    [{ category: 'weather' }, 'bad_category', /Unknown category "weather"\. Categories: ui, notify, game/],
    [{ loudness: 'deafening' }, 'invalid_arguments', /loudness does not match/],
    [{ max_duration: 'long' }, 'invalid_arguments', /max_duration must be a number/],
    [{ qeury: 'typo' }, 'invalid_arguments', /unknown argument "qeury"; allowed: query, category/],
  ]) {
    const r = await call(s, 'search_sounds', args);
    assert.equal(r.isError, true, JSON.stringify(args));
    assert.equal(r.data.code, code);
    assert.match(r.data.error, re);
  }
});

test('search_sounds: string numbers from a sloppy client are accepted', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'search_sounds', { query: 'click', limit: '2', max_duration: '0.3' });
  assert.equal(r.isError, false);
  assert.ok(r.data.items.length <= 2);
});

// ---------------------------------------------------------------- get_sound

test('get_sound: metadata, parameters with ranges and control kinds, levels, themes, related, Copy', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_sound', { id: 'ui-toggle-switch' });
  assert.equal(r.isError, false);
  const d = r.data;
  assert.equal(d.id, 'ui-toggle-switch');
  assert.equal(d.category, 'ui');
  assert.equal(d.dur, 0.25);
  const on = d.params.find((p) => p.name === 'on');
  assert.deepEqual(on, { name: 'on', min: 0, max: 1, default: 1, step: 1, control: 'switch' });
  const pitch = d.params.find((p) => p.name === 'pitch');
  assert.equal(pitch.unit, 'Hz');
  assert.equal(pitch.control, 'value');
  assert.equal(d.params.find((p) => p.name === 'body').control, 'amount');
  assert.equal(d.levels.source, 'estimated');
  assert.ok(['quiet', 'medium', 'loud'].includes(d.levels.band));
  assert.ok(d.levels.peak < -12 && d.levels.peak > -40);
  assert.deepEqual(d.themes.map((x) => `${x.theme}/${x.moment}`).sort(), ['soft-ui/toggle-off', 'soft-ui/toggle-on']);
  assert.ok(d.related.some((x) => x.id === 'ui-click-soft'));
  assert.equal(d.copy.functionName, 'uiToggleSwitch');
  assert.equal(d.copy.signature, 'uiToggleSwitch(ac, opts, when, dest)');
  assert.match(d.copy.usage, /new AudioContext\(\)/);
  assert.equal(d.code, 'in the next content block');
  assert.equal(r.blocks.length, 2);
  assert.equal(r.code, buildCopy(s.catalog.get('ui-toggle-switch'), s.catalog.helpers, null, 1));
});

test('get_sound: include_code false returns metadata only', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_sound', { id: 'ui-click-soft', include_code: false });
  assert.equal(r.blocks.length, 1);
  assert.equal(r.data.code, undefined);
  assert.ok(r.data.copy.functionName);
});

test('get_sound: an unknown id names the closest ones', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_sound', { id: 'ui-click-sof' });
  assert.equal(r.isError, true);
  assert.equal(r.data.code, 'not_found');
  assert.match(r.data.error, /Closest: .*ui-click-soft/);
  assert.ok(r.data.data.near.includes('ui-click-soft'));
  const missing = await call(s, 'get_sound', {});
  assert.match(missing.data.error, /id is required/);
});

test('get_sound: measured levels from the gate\'s report are used and labeled', async (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const report = path.join(tmpDir(), 'r.json');
  fs.writeFileSync(report, JSON.stringify([{ id: 'ui-click-soft', dur: 0.08, renders: [{ label: 'defaults', seed: 1, peak: -23.5, rms: -37.8, pre: -29 }, { label: 'random 1', seed: 1, peak: -20, rms: -35, pre: -25 }], problems: [] }]));
  const s = makeServer(dir, { levels: report });
  const d = (await call(s, 'get_sound', { id: 'ui-click-soft', include_code: false })).data;
  assert.equal(d.levels.source, 'measured');
  assert.equal(d.levels.peak, -23.5);
  assert.deepEqual(d.levels.peakAcrossSettings, { min: -23.5, max: -20 });
  assert.match(d.levels.note, /measured by the level gate/);
  assert.equal((await call(s, 'get_sound', { id: 'game-whoosh', include_code: false })).data.levels.source, 'estimated');
});

test('get_sound: with only the search index, the metadata works and Copy is unavailable', async (t) => {
  if (skip(t)) return;
  const index = JSON.parse(fs.readFileSync(path.join(REAL_CATALOG, 'index.json'), 'utf8'));
  const s = makeServer(writeCatalog(tmpDir(), null, index));
  const id = index.sounds[0].id;
  const r = await call(s, 'get_sound', { id });
  assert.equal(r.isError, false);
  assert.match(r.data.copy.unavailable, /manifest\.json missing/);
  assert.equal(r.blocks.length, 1);
  assert.equal((await call(s, 'get_copy', { id })).data.code, 'copy_unavailable');
  assert.equal((await call(s, 'build_kit', { moments: ['click'] })).data.code, 'copy_unavailable');
});

// ---------------------------------------------------------------- get_copy

test('get_copy: the code is its own block, equal to the gallery\'s Copy, with the facts beside it', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_copy', { id: 'notify-success-chime' });
  assert.equal(r.isError, false);
  assert.equal(r.blocks.length, 2);
  const sound = s.catalog.get('notify-success-chime');
  assert.equal(r.code, buildCopy(sound, s.catalog.helpers, null, 1));
  assert.equal(r.data.functionName, 'notifySuccessChime');
  assert.equal(r.data.signature, 'notifySuccessChime(ac, opts, when, dest)');
  assert.deepEqual(r.data.params, sound.defaults);
  assert.equal(r.data.seed, null, 'the chime uses no randomness');
  assert.equal(r.data.bytes, Buffer.byteLength(r.code));
  assert.deepEqual(r.data.helpers, sound.helpers);
  assert.match(r.data.returns, /0\.2 s after the context time/);
  assert.match(r.data.usage, /notifySuccessChime\(ac, \{ pitch: 659\.25 \}\)/);
  assert.equal(r.data.code, 'in the next content block');
  assert.doesNotMatch(r.blocks[0], /function env/, 'the facts block carries no code');
  assert.doesNotMatch(r.code, DASHES);
});

test('get_copy: parameter values are baked in, clamped and reported', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_copy', { id: 'notify-success-chime', params: { pitch: 880, interval: 99 } });
  assert.equal(r.data.params.pitch, 880);
  assert.equal(r.data.params.interval, 12);
  assert.deepEqual(r.data.clamped, [{ param: 'interval', requested: 99, used: 12, range: [3, 12] }]);
  assert.match(r.code, /pitch: 880/);
  assert.match(r.code, /interval: 12/);
  assert.equal(r.code, buildCopy(s.catalog.get('notify-success-chime'), s.catalog.helpers, { pitch: 880, interval: 99 }, 1));
});

test('get_copy: seeded sounds report and bake their seed; unseeded ones say it has no effect', async (t) => {
  const s = fx(t);
  if (!s) return;
  const seeded = await call(s, 'get_copy', { id: 'cards-riffle', seed: 42 });
  assert.equal(seeded.data.seed, 42);
  assert.match(seeded.code, /seed: 42 \}, opts\)/);
  const dflt = await call(s, 'get_copy', { id: 'cards-riffle' });
  assert.equal(dflt.data.seed, 1);
  const plain = await call(s, 'get_copy', { id: 'notify-success-chime', seed: 7 });
  assert.equal(plain.data.seed, null);
  assert.match(plain.data.note, /no randomness/);
});

test('get_copy: errors name what is wrong', async (t) => {
  const s = fx(t);
  if (!s) return;
  const unknown = await call(s, 'get_copy', { id: 'ui-click-soft', params: { piitch: 5 } });
  assert.equal(unknown.data.code, 'unknown_param');
  assert.match(unknown.data.error, /no parameter "piitch"\. Its parameters: pitch, tone/);
  const word = await call(s, 'get_copy', { id: 'ui-click-soft', params: { pitch: 'high' } });
  assert.equal(word.data.code, 'bad_param_value');
  assert.match(word.data.error, /must be a number between 400 and 2400 Hz/);
  assert.equal((await call(s, 'get_copy', { id: 'nope' })).data.code, 'not_found');
  assert.match((await call(s, 'get_copy', { id: 'ui-click-soft', seed: -1 })).data.error, /seed must be at least 0/);
  assert.match((await call(s, 'get_copy', { id: 'ui-click-soft', params: [] })).data.error, /params must be an object/);
});

test('get_copy: the returned function runs on its own and ends where it says', async (t) => {
  const s = fx(t);
  if (!s) return;
  for (const sound of s.catalog.sounds) {
    const r = await call(s, 'get_copy', { id: sound.id });
    const run = runCopy(r.code, sound);
    assert.ok(Math.abs(run.end - (0.2 + sound.dur)) < 1e-9, sound.id);
    assert.equal(run.limiters, 1);
  }
});

test('get_copy equals the gallery\'s Copy for every sound in the real catalog, through the tool', async (t) => {
  if (skip(t)) return;
  const { T } = await import(pathToFileURL(path.join(REPO, 'src/core/t.js')).href);
  const galleryCopy = (await import(pathToFileURL(path.join(REPO, 'src/core/copy.js')).href)).buildCopy;
  const { loadDir, randomParamSets } = await import(pathToFileURL(path.join(REPO, 'build.mjs')).href);
  const sounds = (await loadDir(path.join(REPO, 'src/sounds'))).map((e) => e.def);
  const s = makeServer(REAL_CATALOG);
  assert.equal(s.catalog.sounds.length, sounds.length, 'catalog and sources agree: run `node build.mjs` if not');
  for (const sound of sounds) {
    const dflt = await call(s, 'get_copy', { id: sound.id });
    assert.equal(dflt.code, galleryCopy(sound, T, null, 1), `${sound.id} at its defaults`);
    const params = randomParamSets(sound, 1, 0xfeed)[0];
    const some = await call(s, 'get_copy', { id: sound.id, params, seed: 11 });
    assert.equal(some.code, galleryCopy(sound, T, params, 11), `${sound.id} at ${JSON.stringify(params)}`);
    const viaGetSound = await call(s, 'get_sound', { id: sound.id });
    assert.equal(viaGetSound.code, dflt.code, `${sound.id}: get_sound carries the same Copy`);
  }
});

// ---------------------------------------------------------------- themes

test('list_themes and get_theme: moment-to-sound maps with effective parameters', async (t) => {
  const s = fx(t);
  if (!s) return;
  const list = await call(s, 'list_themes');
  assert.equal(list.data.count, 2);
  const soft = list.data.themes.find((x) => x.id === 'soft-ui');
  assert.deepEqual(soft.moments, ['click', 'toggle-on', 'toggle-off', 'success', 'error', 'notify']);
  assert.ok(soft.sounds.includes('ui-toggle-switch') && soft.sounds.length === 5);
  const one = await call(s, 'get_theme', { id: 'soft-ui' });
  assert.equal(one.isError, false);
  const on = one.data.moments.find((m) => m.moment === 'toggle-on');
  assert.equal(on.sound, 'ui-toggle-switch');
  assert.deepEqual(on.overrides, { on: 1, body: 0.4 });
  assert.deepEqual(on.params, { on: 1, pitch: 2600, gap: 0.075, body: 0.4 });
  assert.ok(on.loudness.band);
  assert.match(one.data.use, /build_kit \{ "theme": "soft-ui" \}/);
  assert.equal(one.data.missing, undefined);
});

test('get_theme: unknown theme lists the real ones; a theme naming a missing sound is reported, not hidden', async (t) => {
  if (skip(t)) return;
  const s = fx(t);
  const r = await call(s, 'get_theme', { id: 'sofft-ui' });
  assert.equal(r.data.code, 'not_found');
  assert.match(r.data.error, /Themes: arcade, soft-ui|Themes: soft-ui, arcade/);
  const m = fixtureManifest();
  m.themes[0].moments.ghost = { sound: 'ui-not-there' };
  const s2 = makeServer(writeCatalog(tmpDir(), m));
  const g = await call(s2, 'get_theme', { id: 'soft-ui' });
  assert.deepEqual(g.data.missing, [{ moment: 'ghost', sound: 'ui-not-there' }]);
  assert.match(g.data.warning, /rebuild/);
  assert.ok(g.data.moments.length === 6);
});

test('list_themes: a catalog with no themes says so', async (t) => {
  if (skip(t)) return;
  const m = fixtureManifest();
  m.themes = [];
  const s = makeServer(writeCatalog(tmpDir(), m));
  const r = await call(s, 'list_themes');
  assert.equal(r.data.count, 0);
  assert.match(r.data.hint, /no themes/);
});

// ---------------------------------------------------------------- build_kit

test('build_kit: a theme becomes a module and a table of what plays for each moment', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'build_kit', { theme: 'soft-ui' });
  assert.equal(r.isError, false);
  assert.equal(r.blocks.length, 2);
  assert.equal(r.data.format, 'esm');
  assert.equal(r.data.theme, 'soft-ui');
  assert.deepEqual(r.data.moments.map((m) => m.moment), ['click', 'toggle-on', 'toggle-off', 'success', 'error', 'notify']);
  assert.ok(r.data.moments.every((m) => m.source === 'theme' && m.reason && m.params));
  assert.equal(r.data.sounds.length, 5, 'toggle-on and toggle-off share one sound');
  assert.equal(r.data.bytes, Buffer.byteLength(r.code));
  assert.ok(r.data.exports['play(moment, opts)']);
  assert.match(r.data.usage, /import \{ play, prime \} from '\.\/sounds\.js'/);
  assert.match(r.code, /^export \{ play, prime, has, moments, setMuted, getContext \};$/m);
  assert.doesNotMatch(r.code, DASHES);
});

test('build_kit: explicit choices, a mood, filters, vary and the script form', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'build_kit', {
    moments: ['click', { moment: 'boom', sound: 'game-hammer-hit', params: { weight: 1 } }, 'success'],
    mood: 'calm', format: 'script', global_name: 'appSounds', vary: true, max_duration: 1,
  });
  assert.equal(r.isError, false);
  assert.equal(r.data.format, 'script');
  assert.deepEqual(r.data.mood, ['calm']);
  assert.equal(r.data.moments.find((m) => m.moment === 'boom').source, 'explicit');
  assert.equal(r.data.moments.find((m) => m.moment === 'boom').params.weight, 1);
  assert.match(r.code, /^const appSounds = \(function \(\) \{$/m);
  assert.match(r.code, /const kitVary = true;/);
  assert.match(r.data.usage, /appSounds\.prime\(\)/);
  // and it runs
  const created = [];
  const ctx = vm.createContext({ AudioContext: class extends MockContext { constructor() { super(48000, { strict: true }); created.push(this); } } });
  vm.runInContext(r.code, ctx);
  const kit = vm.runInContext('appSounds', ctx);
  assert.deepEqual([...kit.moments], ['click', 'boom', 'success']);
  assert.ok(kit.play('boom') > 0);
});

test('build_kit: what cannot be filled is listed; nothing resolvable is an error', async (t) => {
  const s = fx(t);
  if (!s) return;
  const part = await call(s, 'build_kit', { moments: ['click', 'quantum-entanglement'] });
  assert.equal(part.isError, false);
  assert.equal(part.data.unresolved[0].moment, 'quantum-entanglement');
  assert.deepEqual(part.data.moments.map((m) => m.moment), ['click']);
  const none = await call(s, 'build_kit', { moments: ['quantum-entanglement'] });
  assert.equal(none.isError, true);
  assert.equal(none.data.code, 'no_match');
});

test('build_kit: errors name what is wrong', async (t) => {
  const s = fx(t);
  if (!s) return;
  assert.equal((await call(s, 'build_kit', {})).data.code, 'no_moments');
  assert.equal((await call(s, 'build_kit', { moments: ['click'], theme: 'nope' })).data.code, 'not_found');
  assert.equal((await call(s, 'build_kit', { moments: [{ moment: 'click', sound: 'nope' }] })).data.code, 'not_found');
  assert.equal((await call(s, 'build_kit', { moments: ['click'], format: 'script', global_name: 'class' })).data.code, 'bad_global_name');
  assert.match((await call(s, 'build_kit', { moments: ['click'], format: 'cjs' })).data.error, /format must be one of "esm", "script"/);
  assert.match((await call(s, 'build_kit', { moments: [] })).data.error, /moments needs at least 1 item/);
  assert.match((await call(s, 'build_kit', { moments: Array(41).fill('click') })).data.error, /allows at most 40 items/);
  assert.match((await call(s, 'build_kit', { moments: [{ sound: 'x' }] })).data.error, /moments\[0\]/);
});

test('build_kit: a theme with a moment whose sound vanished is repaired with a warning', async (t) => {
  if (skip(t)) return;
  const m = fixtureManifest();
  m.themes[0].moments.click = { sound: 'ui-gone' };
  const s = makeServer(writeCatalog(tmpDir(), m));
  const r = await call(s, 'build_kit', { theme: 'soft-ui', moments: ['click'] });
  assert.equal(r.isError, false);
  assert.equal(r.data.moments[0].source, 'auto');
  assert.ok(r.data.warnings.some((w) => /ui-gone, which is not in the catalog/.test(w)));
});

test('build_kit on the real catalog: a whole interface from a theme, played end to end', async (t) => {
  if (skip(t)) return;
  const s = makeServer(REAL_CATALOG);
  const r = await call(s, 'build_kit', { theme: 'soft-ui', format: 'script' });
  assert.equal(r.isError, false, JSON.stringify(r.data));
  const created = [];
  const ctx = vm.createContext({ AudioContext: class extends MockContext { constructor() { super(48000, { strict: true }); created.push(this); } } });
  vm.runInContext(r.code, ctx);
  const kit = vm.runInContext('timbreKit', ctx);
  for (const m of kit.moments) assert.ok(kit.play(m) > 0, m);
  assert.equal(created.length, 1);
});

// ---------------------------------------------------------------- suggest_sounds

test('suggest_sounds: reads moments and mood from a description and ranks with reasons', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'suggest_sounds', { description: 'a meditation timer app that rings when done, with gentle tap feedback' });
  assert.equal(r.isError, false);
  assert.deepEqual(r.data.read.moments.map((m) => m.moment).sort(), ['click', 'success', 'timer']);
  assert.deepEqual(r.data.read.mood.map((m) => m.mood), ['calm']);
  const click = r.data.suggestions.find((g) => g.moment === 'click');
  assert.equal(click.candidates[0].id, 'ui-click-soft');
  assert.equal(click.candidates[0].fit, 'strong');
  assert.ok(click.candidates[0].reasons.length >= 2);
  assert.ok(click.candidates[0].loudness.band);
  assert.match(r.data.next, /get_sound/);
});

test('suggest_sounds: named moments, a mood, a theme, filters and a limit', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'suggest_sounds', { description: 'arcade shooter', moments: ['hit', 'coin'], theme: 'arcade', limit: 1, max_duration: 2 });
  assert.equal(r.isError, false);
  assert.equal(r.data.read.theme, 'arcade');
  assert.ok(r.data.suggestions.every((g) => g.candidates.length <= 1));
  assert.equal(r.data.suggestions.find((g) => g.moment === 'hit').candidates[0].id, 'game-hammer-hit');
  const toggles = await call(s, 'suggest_sounds', { moments: ['toggle-off'] });
  assert.deepEqual(toggles.data.suggestions[0].candidates[0].params, { on: 0 });
});

test('suggest_sounds: words with no moment fall back to the closest sounds, and say so', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'suggest_sounds', { description: 'reactor engine startup' });
  assert.equal(r.data.suggestions.length, 0);
  assert.equal(r.data.closest[0].id, 'scifi-power-hum');
  assert.match(r.data.note, /No known moment was named/);
  const nothing = await call(s, 'suggest_sounds', { description: 'zxqvk qwlmn' });
  assert.match(nothing.data.hint, /Nothing recognizable/);
});

test('suggest_sounds: errors name what is wrong', async (t) => {
  const s = fx(t);
  if (!s) return;
  assert.match((await call(s, 'suggest_sounds', {})).data.error, /description of the app or moment, or a list of moments/);
  assert.equal((await call(s, 'suggest_sounds', { description: 'x', theme: 'nope' })).data.code, 'not_found');
  assert.match((await call(s, 'suggest_sounds', { description: 'x', limit: 99 })).data.error, /limit must be at most 10/);
  assert.match((await call(s, 'suggest_sounds', { description: '' })).data.error, /description must have at least 1 character/);
});

test('suggest_sounds on the real catalog: an app description gets sensible, distinct, explained picks', async (t) => {
  if (skip(t)) return;
  const s = makeServer(REAL_CATALOG);
  const r = await call(s, 'suggest_sounds', { description: 'a retro arcade platformer with coin pickups, jumping, a power-up and game over' });
  const by = Object.fromEntries(r.data.suggestions.map((g) => [g.moment, g]));
  for (const m of ['coin', 'jump', 'game-over']) assert.ok(by[m] && by[m].candidates.length, m);
  assert.equal(by.jump.candidates[0].category, 'game');
  assert.ok(r.data.read.mood.some((m) => m.mood === 'retro'));
  assert.ok(Object.values(by).every((g) => g.candidates.every((c) => c.reasons.length > 0)));
});

// ---------------------------------------------------------------- names that are also Object.prototype members

test('names that are also properties of every object are just unknown names', async (t) => {
  const s = fx(t);
  if (!s) return;
  for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const args = JSON.parse(`{ ${JSON.stringify(key)}: 1 }`);
    const r = await call(s, 'search_sounds', args);
    assert.equal(r.isError, true, key);
    assert.match(r.data.error, new RegExp(`unknown argument "${key}"`), key);
    const p = await call(s, 'get_copy', { id: 'ui-click-soft', params: JSON.parse(`{ ${JSON.stringify(key)}: 1 }`) });
    assert.equal(p.isError, true, key);
    assert.equal(p.data.code, 'unknown_param', key);
  }
  const moment = await call(s, 'suggest_sounds', { moments: ['constructor'] });
  assert.equal(moment.isError, false);
  assert.equal(moment.data.suggestions[0].moment, 'constructor');
  assert.equal(moment.data.suggestions[0].candidates.length, 0);
  const kit = await call(s, 'build_kit', { moments: ['constructor', 'click'], theme: 'soft-ui' });
  assert.equal(kit.isError, false);
  assert.deepEqual(kit.data.unresolved.map((u) => u.moment), ['constructor']);
  assert.deepEqual(kit.data.moments.map((m) => m.moment), ['click']);
});

test('get_copy: the seed is its own argument and says so when passed as a parameter', async (t) => {
  const s = fx(t);
  if (!s) return;
  const r = await call(s, 'get_copy', { id: 'cards-riffle', params: { seed: 4 } });
  assert.equal(r.isError, true);
  assert.match(r.data.error, /the seed is not a parameter; pass it as the seed argument/);
  assert.match((await call(s, 'get_copy', { id: 'cards-riffle', seed: 4294967296 })).data.error, /seed must be at most 4294967295/);
  assert.equal((await call(s, 'get_copy', { id: 'cards-riffle', seed: 4294967295 })).isError, false);
});
