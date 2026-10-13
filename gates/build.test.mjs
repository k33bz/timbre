// Build validation: the real sources pass, and each kind of broken sound or theme is caught with a
// message that says what to fix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { T } from '../src/core/t.js';
import { build, loadDir, validateAll, validateSound, validateTheme, buildManifest, buildIndex, buildHtml, ROOT } from '../build.mjs';
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
  for (const s of ix.sounds) assert.deepEqual(Object.keys(s).sort(), ['category', 'desc', 'dur', 'id', 'name', 'tags']);
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
  assert.equal(buildHtml(a.sounds, a.themes, T), a.outputs['dist/timbre.html']);
});
