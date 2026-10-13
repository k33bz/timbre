// Copy: the dependency scan is exact, each sound's Copy carries only the helpers it uses, and the
// copied function runs on its own in an empty context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import { T } from '../src/core/t.js';
import { stripCode, helperDeps, helperClosure, usedHelpers, buildCopy, copyHelpers, camel, playSource } from '../src/core/copy.js';
import { PREROLL } from '../src/core/render.js';
import { loadDir, ROOT } from '../build.mjs';
import { MockContext } from './lib/mockaudio.mjs';

const sounds = (await loadDir(path.join(ROOT, 'src/sounds'))).map((e) => e.def);
const fixture = (play) => ({ id: 'ui-fixture', name: 'Fixture', category: 'ui', tags: ['x'], desc: 'fixture sound', dur: 0.3, params: { f: { min: 100, max: 900, def: 400 } }, play });

/** Function names a Copy text defines, and the identifiers it references outside definitions. */
function anatomy(text) {
  const code = stripCode(text);
  const defined = [...code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
  const refs = (name) => (code.match(new RegExp('(^|[^\\w$.])' + name + '(?![\\w$])', 'g')) || []).length;
  return { defined, refs };
}

test('stripCode drops comments and string contents but keeps code', () => {
  const s = stripCode("const a = 'noise'; // reverb here\n/* osc */ b(\"filter\", `env`); c.delay(1);");
  assert.doesNotMatch(s, /noise|reverb|osc|filter|env/);
  assert.match(s, /const a = ""/);
  assert.match(s, /b\("", ""\)/);
  assert.match(s, /c\.delay\(1\)/);
});

test('helper dependencies are read from the sources', () => {
  assert.deepEqual(helperDeps('osc', T).sort(), ['env', 'glide']);
  assert.deepEqual(helperDeps('noise', T).sort(), ['env', 'glide', 'noiseBuffer']);
  assert.deepEqual(helperDeps('bell', T), ['osc']);
  assert.deepEqual(helperDeps('seed', T), ['rand']);
  assert.deepEqual(helperDeps('master', T), []);
  assert.deepEqual(helperDeps('reverb', T), ['rand']);
  // deps come before the helpers that need them
  const c = helperClosure(['bell'], T);
  assert.deepEqual(c, ['env', 'glide', 'osc', 'bell']);
});

test('a sound that only uses T.osc carries osc, its deps and master, nothing else', () => {
  const s = fixture(function (T, out, t, p) {
    // a comment about T.noise and reverb must not pull them in
    const label = 'T.reverb';
    T.osc(out, t, { f: p.f, dur: 0.2, peak: 0.1, type: label ? 'sine' : 'square' });
  });
  const { uses, helpers } = copyHelpers(s, T);
  assert.deepEqual(uses, ['osc']);
  assert.deepEqual(helpers.sort(), ['env', 'glide', 'master', 'osc']);
  const text = buildCopy(s, T, null, 1);
  assert.doesNotMatch(text, /function (noise|rand|seed|noiseBuffer|reverb)\(/);
  assert.doesNotMatch(text, /seed\(p\.seed\)/);
});

test('a sound that draws noise carries the seeded generator and seeds it', () => {
  const s = fixture(function (T, out, t, p) { T.noise(out, t, { f: p.f, dur: 0.2, peak: 0.1 }); });
  const { helpers } = copyHelpers(s, T);
  for (const h of ['noise', 'noiseBuffer', 'rand', 'seed', 'env', 'glide', 'master']) assert.ok(helpers.includes(h), h);
  assert.equal(helpers.length, 7);
  assert.match(buildCopy(s, T, null, 7), /seed: 7 \}, opts\);[\s\S]*seed\(p\.seed\);/);
});

for (const s of sounds) {
  test(`copy of ${s.id} defines exactly what it uses`, () => {
    const text = buildCopy(s, T, null, 1);
    const fname = camel(s.id);
    const { defined, refs } = anatomy(text);
    const { uses, helpers } = copyHelpers(s, T);
    assert.deepEqual(defined.filter((n) => n !== fname && n !== 'play').sort(), [...helpers].sort());
    for (const h of helpers) assert.ok(refs(h) >= 2, `${h} is defined but never used`);
    // every T.x the play uses is in the T object the copy builds
    const tLine = text.match(/const T = \{ ([^}]*) \};/)[1].split(', ').filter(Boolean);
    assert.deepEqual(tLine.sort(), [...uses].sort());
    assert.deepEqual(usedHelpers(playSource(s.play), T).sort(), [...uses].sort());
    assert.equal(text.split('\n')[0].startsWith('// Usage: '), true);
    assert.doesNotMatch(text, new RegExp('\u2014'), 'no em dashes');
  });

  test(`copy of ${s.id} runs alone in an empty context`, () => {
    const text = buildCopy(s, T, null, 3);
    const fname = camel(s.id);
    const ctx = vm.createContext({});
    vm.runInContext(text, ctx, { filename: fname + '.js' });
    const fn = ctx[fname];
    assert.equal(typeof fn, 'function');
    const ac = new MockContext(48000);
    const end = fn(ac);
    // a new chain warms up first: the sound starts PREROLL after the chain is built
    assert.ok(Math.abs(end - (PREROLL + s.dur)) < 1e-9, `end ${end}`);
    assert.ok(ac.nodes.some((n) => n.started != null), 'it schedules sources');
    assert.equal(ac.timbreChains.size, 1);
    // later calls reuse the chain; `when` is honored once the chain is warm
    const limiters = () => ac.nodes.filter((n) => n.threshold).length;
    assert.equal(limiters(), 1);
    const end2 = fn(ac, null, 1);
    assert.ok(Math.abs(end2 - (1 + s.dur)) < 1e-9);
    assert.equal(ac.timbreChains.size, 1);
    assert.equal(limiters(), 1, 'no second limiter');
    // parameter overrides at every max still run
    const max = Object.fromEntries(Object.entries(s.params).map(([k, d]) => [k, d.max]));
    fn(ac, max, 2);
  });
}

test('copy reflects the values it is given and stays deterministic', () => {
  const s = sounds.find((x) => x.id === 'notify-success-chime');
  const a = buildCopy(s, T, { interval: 5, pitch: 700.123456789 }, 1);
  assert.match(a, /interval: 5/);
  assert.match(a, /pitch: 700\.123/);
  assert.equal(a, buildCopy(s, T, { interval: 5, pitch: 700.123456789 }, 1));
  // out-of-range values are clamped to the parameter's range
  assert.match(buildCopy(s, T, { interval: 99 }, 1), /interval: 12/);
});
