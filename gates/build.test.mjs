// Build validation: the real sources pass, and each kind of broken sound or theme is caught with a
// message that says what to fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { T } from '../src/core/t.js';
import { build, loadDir, validateAll, validateSound, validateTheme, validateScape, buildManifest, buildIndex, buildHtml, ROOT, SCHEMA, fingerprint, levelsFor, writeAtomic } from '../build.mjs';
import { levelEntry, updateLevels, steady } from './check_levels.mjs';
import { MOMENTS, FAMILIES, ROLES } from '../src/vocabulary.js';
import { PREROLL, MASTER_CHAIN } from '../src/core/render.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const good = () => ({
  id: 'ui-test-blip',
  name: 'Test Blip',
  category: 'ui',
  tags: ['test', 'blip'],
  desc: 'A fixture sound for the build tests.',
  dur: 0.2,
  params: { pitch: { min: 200, max: 2000, def: 800, unit: 'Hz' }, level: { min: 0.5, max: 1, def: 1 } },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch, dur: 0.1, peak: 0.1 * p.level });
  },
});
const FILE = 'src/sounds/ui/ui-test-blip.js';
const check = (def, file = FILE) => validateSound({ file, def }, T);
const expectError = (def, re, file) => {
  const errs = check(def, file);
  assert.ok(errs.some((e) => re.test(e)), `expected an error matching ${re}, got:\n  ${errs.join('\n  ') || '(none)'}`);
};

test('the real sounds and themes are valid', async () => {
  const { errors, sounds, themes } = await build();
  assert.deepEqual(errors, []);
  assert.ok(sounds.length >= 10);
  assert.ok(themes.length >= 1);
  assert.equal(new Set(sounds.map((s) => s.id)).size, sounds.length);
});

test('a well-formed fixture passes', () => {
  assert.deepEqual(check(good()), []);
});

test('missing and unknown fields are reported', () => {
  const a = good(); delete a.desc;
  expectError(a, /missing required field "desc"/);
  const b = good(); b.description = 'x';
  expectError(b, /unknown field "description"/);
  const c = good(); c.tags = [];
  expectError(c, /tags must be a non-empty array/);
  const d = good(); d.dur = 0;
  expectError(d, /dur must be a number/);
});

test('ids, categories and file locations are enforced', () => {
  const a = good(); a.id = 'UiBlip';
  expectError(a, /kebab-case/);
  const b = good(); b.id = 'game-test-blip';
  expectError(b, /must start with "ui-"/);
  const c = good(); c.category = 'sounds';
  expectError(c, /category "sounds" must be one of/);
  expectError(good(), /must live at src\/sounds\/ui\/ui-test-blip\.js/, 'src/sounds/game/ui-test-blip.js');
});

test('parameters need min < max and a default in range', () => {
  const a = good(); a.params.pitch = { min: 200, max: 2000, def: 5000 };
  expectError(a, /def 5000 is outside \[200, 2000\]/);
  const b = good(); b.params.pitch = { min: 2, max: 1, def: 1.5 };
  expectError(b, /min must be below max/);
  const c = good(); c.params.pitch = { min: 0, max: 1 };
  expectError(c, /needs numeric min, max and def/);
  const d = good(); d.params.seed = { min: 0, max: 1, def: 0 };
  expectError(d, /"seed" is reserved/);
  const e = good(); e.params.pitch.label = 'Pitch';
  expectError(e, /unknown field "label"/);
});

test('play may only use T.*, its arguments and plain JS', () => {
  const a = good(); a.play = function (T, out, t, p) { T.osc(out, t, { f: 400 + Math.random() * 100, dur: 0.1 }); };
  expectError(a, /Math\.random/);
  const b = good(); b.play = function (T, out, t, p) { document.title = 'x'; T.osc(out, t, { dur: 0.1 }); };
  expectError(b, /may not use "document"/);
  const c = good(); c.play = function (T, out, t, p) { T.zap(out, t, {}); };
  expectError(c, /T\.zap does not exist/);
  const d = good(); d.play = function (T, out, t, p) { const g = out.context.createGain(); g.connect(out); };
  expectError(d, /may not reach the AudioContext|may not create audio nodes/);
  const e = good(); e.play = (T, out, t, p) => T.osc(out, t, { dur: 0.1 });
  expectError(e, /written as a method/);
});

test('a free variable that is not a builtin fails when play runs in isolation', () => {
  const a = good(); a.play = function (T, out, t, p) { T.osc(out, t, { f: missingHelper(p.pitch), dur: 0.1 }); };
  expectError(a, /play throws at defaults: missingHelper is not defined/);
});

test('invalid automation and over-long voices are caught at the extremes', () => {
  const a = good(); a.play = function (T, out, t, p) { T.osc(out, t - 0.5, { dur: 0.1 }); };
  expectError(a, /play throws at defaults: .*negative time/);
  const b = good(); b.play = function (T, out, t, p) { T.osc(out, t, { f: p.pitch, dur: p.pitch / 5000 }); };
  expectError(b, /still sounding at 0\.400 s, past dur 0\.2 s, at all max/);
  const c = good(); c.play = function (T, out, t, p) { if (p.level < 0.6) T.osc(out, t, { f: NaN * p.pitch, dur: 0.1, glide: 0.05, to: 300 }); else T.osc(out, t, { dur: 0.1 }); };
  // NaN frequency falls back to 440 inside osc (o.f || 440), so this one must pass: the helpers guard
  assert.deepEqual(check(c), []);
});

test('duplicate ids across files are reported', () => {
  const { errors } = validateAll([{ file: FILE, def: good() }, { file: FILE, def: good() }], [], T);
  assert.ok(errors.some((e) => /duplicate id "ui-test-blip"/.test(e)), errors.join('\n'));
});

test('themes must reference real sounds with in-range parameters', () => {
  const s = Object.assign({ file: FILE }, good());
  const byId = new Map([[s.id, s]]);
  const th = { id: 'test-theme', name: 'Test', desc: 'A fixture theme for tests.', moments: { click: { sound: 'ui-test-blip' } } };
  assert.deepEqual(validateTheme({ file: 'src/themes/test-theme.js', def: th }, byId), []);
  const bad = { ...th, moments: { click: { sound: 'ui-nope' }, hit: { sound: 'ui-test-blip', params: { pitch: 9000 } }, tap: { sound: 'ui-test-blip', params: { gain: 1 } } } };
  const errs = validateTheme({ file: 'src/themes/test-theme.js', def: bad }, byId);
  assert.ok(errs.some((e) => /unknown sound "ui-nope"/.test(e)), errs.join('\n'));
  assert.ok(errs.some((e) => /pitch = 9000 is outside/.test(e)), errs.join('\n'));
  assert.ok(errs.some((e) => /has no param "gain"/.test(e)), errs.join('\n'));
});

test('manifest carries play sources and helper lists; index carries search fields only', async () => {
  const sounds = await loadDir(path.join(ROOT, 'src/sounds'));
  const themes = await loadDir(path.join(ROOT, 'src/themes'));
  const v = validateAll(sounds, themes, T);
  const m = buildManifest(v.sounds, v.themes, T);
  assert.equal(m.count, v.sounds.length);
  for (const s of m.sounds) {
    assert.match(s.play, /^function \(T, out, t, p\) \{/);
    assert.ok(s.helpers.includes('master'));
    for (const h of s.uses) assert.ok(s.helpers.includes(h), `${s.id}: ${h} in uses but not helpers`);
    for (const h of s.helpers) assert.ok(m.helpers[h], `${s.id}: helper ${h} missing from the helper table`);
  }
  const ix = buildIndex(v.sounds, v.themes);
  for (const s of ix.sounds) assert.deepEqual(Object.keys(s).filter((k) => k !== 'family' && k !== 'moments' && k !== 'loop').sort(), ['category', 'desc', 'dur', 'id', 'name', 'tags']);
});

test('the bundle is one page whose script compiles and holds every sound', async () => {
  const { outputs, sounds } = await build();
  const html = outputs['dist/timbre.html'];
  assert.match(html, /^<!doctype html>/i);
  assert.doesNotMatch(html, /\/\*@(STYLE|SCRIPT)@\*\//);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 2, 'the early theme script and the bundle');
  assert.doesNotThrow(() => new vm.Script(scripts[1]), 'bundle script must parse');
  for (const s of sounds) assert.ok(html.includes(JSON.stringify(s.id)), s.id);
  assert.doesNotMatch(html, /<link[^>]+stylesheet|<script[^>]+src=/i, 'nothing external');
});

test('the build is deterministic', async () => {
  const a = await build();
  const b = await build();
  for (const k of Object.keys(a.outputs)) assert.equal(a.outputs[k], b.outputs[k], k);
  assert.equal(buildHtml(a.sounds, a.themes, T, a.scapes), a.outputs['dist/timbre.html']);
});

// ---- catalog fields (schema 2)

test('family, moments, a parameter desc and a switch role validate against the shared vocabulary', () => {
  const a = good(); a.family = 'glass'; a.moments = ['click', 'hover']; a.params.pitch.desc = 'Pitch of the blip';
  a.params.on = { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 rising, 0 falling' };
  assert.deepEqual(check(a), []);
  const b = good(); b.family = 'plastic';
  expectError(b, /family "plastic" must be one of: soft, glass/);
  const c = good(); c.moments = ['click', 'boop'];
  expectError(c, /moment "boop" is not in the vocabulary/);
  const d = good(); d.moments = [];
  expectError(d, /moments must be a non-empty array/);
  const e = good(); e.moments = ['click', 'click'];
  expectError(e, /moments must be unique/);
  const f = good(); f.params.pitch.desc = 'x';
  expectError(f, /desc must be one line of 3 to 100 characters/);
  const g = good(); g.params.pitch.desc = 'High ' + String.fromCharCode(0x2014) + ' low';
  expectError(g, /desc has an en or em dash/);
  const h = good(); h.params.pitch.role = 'on';
  expectError(h, /role "on" is a switch, so the param needs min 0, max 1, step 1 and no unit/);
  const i = good(); i.params.on = { min: 0, max: 1, def: 0, step: 1, role: 'direction' };
  expectError(i, /role "direction" must be one of: on, open, chip, go/);
  const j = good(); j.desc = 'A fixture ' + String.fromCharCode(0x2013) + ' with a dash.';
  expectError(j, /desc has an en or em dash/);
});

test('choices name the values of a stepped parameter, 0 to n - 1', () => {
  const a = good();
  a.params.voice = { min: 0, max: 2, def: 1, step: 1, choices: ['announcer', 'deep', 'small'], desc: 'Who speaks' };
  assert.deepEqual(check(a), []);
  const b = good(); b.params.voice = { min: 0, max: 3, def: 1, step: 1, choices: ['announcer', 'deep', 'small'] };
  expectError(b, /choices name the values 0 to 2, so the param needs min 0, max 2, step 1/);
  const c = good(); c.params.voice = { min: 0, max: 1, def: 0, step: 1, choices: ['Announcer', 'deep'] };
  expectError(c, /choices must be two or more unique kebab-case names/);
  const d = good(); d.params.voice = { min: 0, max: 1, def: 0, step: 1, choices: ['deep', 'deep'] };
  expectError(d, /choices must be two or more unique kebab-case names/);
  const e = good(); e.params.voice = { min: 0, max: 1, def: 0, step: 1, unit: 'x', choices: ['a', 'b'] };
  expectError(e, /choices name the values 0 to 1/);
  const f = good(); f.category = 'voice'; f.id = 'voice-test-line';
  assert.deepEqual(check(f, 'src/sounds/voice/voice-test-line.js'), [], 'voice is a category');
});

test('the gap-fill categories, roles and the loop-cell convention', () => {
  for (const c of ['data', 'ai', 'fx', 'battle', 'duel']) {
    const s = good(); s.category = c; s.id = c + '-test-blip';
    assert.deepEqual(check(s, `src/sounds/${c}/${c}-test-blip.js`), [], `${c} is a category`);
  }
  for (const r of ['up', 'pass', 'tick']) {
    const s = good(); s.params.dir = { min: 0, max: 1, def: 1, step: 1, role: r };
    assert.deepEqual(check(s), [], `${r} is a role`);
  }
  const a = good(); a.tags = ['loading', 'loop-cell']; a.desc = 'A soft pulse for a loader, played again and again.';
  expectError(a, /loop-cell sound names its re-trigger interval in desc/);
  const b = good(); b.tags = ['loading', 'loop-cell']; b.desc = 'A soft pulse for a loader: re-trigger every 1.2 s.';
  assert.deepEqual(check(b), []);
  for (const m of ['loading', 'thinking']) assert.ok(MOMENTS[m].tags.includes('loop-cell'), `${m} asks for a loop cell`);
});

test('every voice sound speaks or babbles a fixed line and names its voices', async () => {
  const { sounds } = await build();
  const voices = sounds.filter((s) => s.category === 'voice');
  assert.ok(voices.length >= 15);
  for (const s of voices) {
    assert.equal(s.family, 'voice', s.id);
    assert.match(String(s.play), /T\.(speak|babble)\(/, s.id);
    // every speech voice, in the order a person sees them: by display name
    const sv = T.speechVoices();
    const sorted = Object.keys(sv).sort((a, b) => sv[a].name.localeCompare(sv[b].name, 'en'));
    if (s.params.voice) assert.deepEqual(s.params.voice.choices, sorted, `${s.id} lists the speech voices by display name`);
  }
});

test('every real sound declares a family and describes its parameters', async () => {
  const { sounds } = await build();
  for (const s of sounds) assert.ok(Object.hasOwn(FAMILIES, s.family), `${s.id} family ${s.family}`);
  for (const s of sounds) for (const [k, d] of Object.entries(s.params)) assert.ok(typeof d.desc === 'string', `${s.id}.${k} has no desc`);
  // the 0/1 switches the MCP server sets by role carry one
  for (const s of sounds) for (const k of ['on', 'open', 'chip', 'go']) if (s.params[k]) assert.equal(s.params[k].role, k, `${s.id}.${k}`);
  // and so does any other switch named after a role (notify-calendar's tick is an amount, not a switch)
  const isSwitch = (d) => d.step === 1 && d.min === 0 && d.max === 1 && !d.unit;
  for (const s of sounds) for (const k of Object.keys(ROLES)) if (s.params[k] && isSwitch(s.params[k])) assert.equal(s.params[k].role, k, `${s.id}.${k}`);
});

test('theme moments come from the vocabulary', async () => {
  const sd =Object.assign({ file: FILE }, good());
  const byId = new Map([[sd.id, sd]]);
  const th = { id: 'test-theme', name: 'Test', desc: 'A fixture theme for tests.', moments: { click: { sound: 'ui-test-blip' }, 'toggle-up': { sound: 'ui-test-blip' } } };
  const errs = validateTheme({ file: 'src/themes/test-theme.js', def: th }, byId);
  assert.equal(errs.length, 1, errs.join('\n'));
  assert.match(errs[0], /moment "toggle-up" is not in the vocabulary \(src\/vocabulary\.js: near: toggle-on, toggle-off\)/);
  for (const k of Object.keys(MOMENTS)) assert.match(k, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test('the manifest carries the version, the Copy contract, the vocabulary and fingerprints', async () => {
  const { sounds, themes } = await build();
  const m = buildManifest(sounds, themes, T);
  assert.equal(m.schema, SCHEMA);
  assert.equal(m.version, JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version);
  assert.equal(m.copy.preroll, PREROLL);
  assert.deepEqual(m.copy.master, MASTER_CHAIN);
  assert.deepEqual(Object.keys(m.vocabulary.families), Object.keys(FAMILIES));
  assert.deepEqual(Object.keys(m.vocabulary.moments), Object.keys(MOMENTS));
  for (const s of m.sounds) assert.match(s.fingerprint, /^[0-9a-f]{12}$/);
  assert.equal(new Set(m.sounds.map((s) => s.fingerprint)).size, m.sounds.length, 'fingerprints are distinct');
});

test('a fingerprint follows what decides the render and nothing else', () => {
  const a = good();
  const fp = fingerprint(a, T);
  const b = good(); b.params.pitch.desc = 'Pitch of the blip'; b.family = 'soft'; b.moments = ['click']; b.tags = ['other'];
  assert.equal(fingerprint(b, T), fp, 'descriptions and metadata do not change it');
  const c = good(); c.dur = 0.25;
  const d = good(); d.params.pitch.max = 2100;
  const e = good(); e.play = function (T, out, t, p) { T.osc(out, t, { f: p.pitch, dur: 0.1, peak: 0.11 * p.level }); };
  for (const x of [c, d, e]) assert.notEqual(fingerprint(x, T), fp);
});

test('measured levels are embedded only while their fingerprint matches the sound', async () => {
  const { sounds, themes } = await build();
  const [s1, s2] = sounds;
  const report = { sounds: {
    [s1.id]: { fingerprint: fingerprint(s1, T), peak: -20.1, rms: -30.2, worstPeak: -18, worstRms: -28, lowestPeak: -25, pre: -21, end: 0.2, extra: 1 },
    [s2.id]: { fingerprint: '000000000000', peak: -19 },
  } };
  const m = buildManifest(sounds, themes, T, report);
  assert.deepEqual(m.sounds[0].levels, { peak: -20.1, rms: -30.2, worstPeak: -18, worstRms: -28, lowestPeak: -25, pre: -21, end: 0.2 });
  assert.equal(m.sounds[1].levels, undefined, 'a stale measurement is left out');
  assert.equal(m.levels.measured, 1);
  assert.deepEqual(levelsFor(s1, null, T), null);
});

test('the level gate keeps catalog/levels.json merged, sorted and unchanged when nothing changed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'timbre-levels-'));
  const file = path.join(dir, 'levels.json');
  try {
    const renders = [
      { label: 'defaults', peak: -20, rms: -30, pre: -22, end: 0.1 }, { label: 'defaults', peak: -21, rms: -31, pre: -23, end: 0.12 },
      { label: 'random 1', peak: -15, rms: -26, pre: -16, end: 0.3 }, { label: 'random 2', peak: -28, rms: -38, pre: -29, end: 0.05 },
    ];
    const e = levelEntry(renders, 'abc');
    assert.deepEqual(e, { fingerprint: 'abc', peak: -20, rms: -30.5, worstPeak: -15, worstRms: -26, lowestPeak: -28, pre: -16, end: 0.12 });
    assert.equal(updateLevels({ b: e }, ['b', 'a'], file), true);
    assert.equal(updateLevels({ a: e }, ['b', 'a', 'c'], file), true);
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(Object.keys(doc.sounds), ['a', 'b'], 'merged and sorted');
    assert.equal(updateLevels({ a: e }, ['b', 'a'], file), false, 'same content: not rewritten');
    assert.equal(updateLevels({}, ['a'], file), true);
    assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')).sounds), ['a'], 'a sound gone from the catalog drops out');
    assert.deepEqual(fs.readdirSync(dir), ['levels.json'], 'no temporary file left behind');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a remeasured, unchanged sound keeps values that moved by one rounding step (engine noise)', () => {
  const prev = { fingerprint: 'abc', peak: -20.1, rms: -30, end: 0.12, pre: -22 };
  assert.deepEqual(steady({ fingerprint: 'abc', peak: -20.2, rms: -30.5, end: 0.121, pre: -22 }, prev), { fingerprint: 'abc', peak: -20.1, rms: -30.5, end: 0.12, pre: -22 });
  assert.deepEqual(steady({ fingerprint: 'new', peak: -20.2 }, prev), { fingerprint: 'new', peak: -20.2 }, 'a changed sound takes the new numbers');
  assert.deepEqual(steady({ fingerprint: 'abc', peak: -20.2 }, null), { fingerprint: 'abc', peak: -20.2 });
});

test('writeAtomic replaces a file whole and leaves no temporary file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'timbre-atomic-'));
  try {
    const f = path.join(dir, 'x.json');
    writeAtomic(f, 'one');
    writeAtomic(f, 'two');
    assert.equal(fs.readFileSync(f, 'utf8'), 'two');
    assert.deepEqual(fs.readdirSync(dir), ['x.json']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('soundscapes: beds must loop, events need an interval, params and vary stay in range', () => {
  const bed = { ...good(), id: 'ambience-test-bed', category: 'ambience', loop: true, params: { length: { min: 3, max: 8, def: 8, unit: 's' }, rate: { min: 0, max: 1, def: 0.5 } } };
  const hit = { ...good(), id: 'ambience-test-hit', category: 'ambience', params: { distance: { min: 0, max: 1, def: 0.5 } } };
  const byId = new Map([[bed.id, bed], [hit.id, hit]]);
  const check = (layers, extra) => validateScape({ file: 'src/scapes/test-scape.js', def: { id: 'test-scape', name: 'Test', desc: 'A soundscape for the tests.', layers, ...extra } }, byId);
  assert.deepEqual(check([{ sound: bed.id, params: { rate: 0.7 }, level: 0.8 }, { sound: hit.id, every: [6, 12], vary: { distance: [0.2, 0.9] } }]), []);
  const has = (errs, re) => assert.ok(errs.some((e) => re.test(e)), errs.join(' | ') || 'no errors');
  has(check([{ sound: hit.id }]), /does not loop; give it every/);
  has(check([{ sound: hit.id, every: [6, 12] }]), /needs at least one bed/);
  has(check([{ sound: bed.id }, { sound: hit.id, every: [1, 12] }]), /every must be \[lo, hi\]/);
  has(check([{ sound: bed.id, params: { rate: 2 } }]), /rate = 2 is outside/);
  has(check([{ sound: bed.id }, { sound: hit.id, every: [6, 12], vary: { distance: [0.5, 1.5] } }]), /vary distance must be/);
  has(check([{ sound: bed.id, vary: { rate: [0, 1] } }]), /vary only applies to an event/);
  has(check([{ sound: 'ambience-nope' }]), /unknown sound/);
  has(check([]), /1 to 6 layers/);
  // loop: true is for beds only
  assert.deepEqual(check([{ sound: bed.id }]), []);
  const notBed = { ...good(), loop: true };
  assert.ok(check.length && validateSound({ file: `src/sounds/ui/${notBed.id}.js`, def: notBed }).some((e) => /only ambience and dark beds can loop/.test(e)));
});
