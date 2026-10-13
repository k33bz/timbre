// build_kit: resolving moments to sounds, and the module it writes, executed for real (against the
// strict audio mock) in the ESM form and in the classic-script form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { Catalog } from '../lib/catalog.js';
import { resolveKit, buildKitModule, checkParams } from '../lib/kit.js';
import { ToolError } from '../lib/errors.js';
import { buildCopy, dedent, camel, PREROLL } from '../lib/copy.js';
import { MOMENTS } from '../lib/moments.js';
import { MockContext } from '../lib/mockaudio.js';
import { HAVE_REPO, REAL_CATALOG, DASHES, tmpDir, count } from './helper.js';
import { fixtureDir, fixtureManifest } from './fixture.js';
import { runCopy } from './mockrun.js';

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

const refuses = (fn, code) => assert.throws(fn, (e) => e instanceof ToolError && (!code || e.code === code), code);

// ---------------------------------------------------------------- resolving

test('resolveKit: a theme fills every moment it covers, with its parameters', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  assert.deepEqual(r.choices.map((x) => x.moment), Object.keys(c.theme('soft-ui').moments));
  assert.ok(r.choices.every((x) => x.source === 'theme'));
  const on = r.choices.find((x) => x.moment === 'toggle-on');
  assert.equal(on.sound.id, 'ui-toggle-switch');
  assert.equal(on.params.on, 1);
  assert.equal(on.params.body, 0.4);
  assert.equal(on.params.pitch, 2600, 'parameters the theme does not set take the sound\'s defaults');
  assert.deepEqual(r.unresolved, []);
});

test('resolveKit: a subset of a theme, and the rest picked automatically', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'arcade', moments: ['click', 'coin', 'error'] });
  const by = Object.fromEntries(r.choices.map((x) => [x.moment, x]));
  assert.equal(by.click.source, 'theme');
  assert.equal(by.click.params.pitch, 1800);
  assert.equal(by.coin.params.spins, 3);
  assert.equal(by.error.source, 'auto');
  assert.equal(by.error.sound.id, 'notify-error-buzz');
  assert.ok(r.warnings.some((w) => /theme arcade has no "error" moment/.test(w)));
});

test('resolveKit: explicit sounds and parameter values win over everything', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui', moments: [{ moment: 'click', sound: 'game-coin-flip', params: { spins: 4 } }] });
  assert.equal(r.choices[0].sound.id, 'game-coin-flip');
  assert.equal(r.choices[0].source, 'explicit');
  assert.equal(r.choices[0].params.spins, 4);
});

test('resolveKit: automatic picks explain themselves and offer alternatives', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['click', 'success', 'error'] });
  assert.deepEqual(r.choices.map((x) => x.sound.id), ['ui-click-soft', 'notify-success-chime', 'notify-error-buzz']);
  for (const x of r.choices) {
    assert.equal(x.source, 'auto');
    assert.ok(x.reason.length > 5);
    assert.equal(x.fit, 'strong');
    assert.ok(Array.isArray(x.alternatives));
  }
});

test('resolveKit: toggles take their direction from the moment', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['toggle-on', 'toggle-off'] });
  assert.equal(r.choices[0].sound.id, 'ui-toggle-switch');
  assert.equal(r.choices[0].params.on, 1);
  assert.equal(r.choices[1].params.on, 0);
});

test('resolveKit: what it cannot fill is listed, the rest still resolves', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['click', 'quantum-entanglement'] });
  assert.equal(r.choices.length, 1);
  assert.equal(r.unresolved[0].moment, 'quantum-entanglement');
  assert.match(r.unresolved[0].why, /no sound in the catalog matches/);
});

test('resolveKit: a mood steers the picks and can name a theme', (t) => {
  const c = fixture(t);
  if (!c) return;
  const named = resolveKit(c, { moments: ['click', 'hit'], mood: 'arcade' });
  assert.equal(named.theme.id, 'arcade');
  assert.equal(named.choices.find((x) => x.moment === 'hit').sound.id, 'game-hammer-hit');
  assert.ok(named.warnings.some((w) => /names the Arcade theme/.test(w)));
  const soft = resolveKit(c, { moments: ['click'], mood: 'soft ui' });
  assert.equal(soft.theme.id, 'soft-ui');
  const calm = resolveKit(c, { moments: ['click'], mood: 'calm' });
  assert.deepEqual(calm.moods.map((m) => m.mood.name), ['calm']);
});

test('resolveKit: filters apply to automatic picks', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['click'], filters: { max_duration: 0.06 } });
  assert.ok(r.choices.every((x) => x.sound.dur <= 0.06));
});

test('resolveKit: names are normalized, bad ones refused, repeats warned about', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['Level Up', 'level-up', 'COIN'] });
  assert.deepEqual(r.choices.map((x) => x.moment), ['level-up', 'coin']);
  assert.ok(r.warnings.some((w) => /listed twice/.test(w)));
  refuses(() => resolveKit(c, { moments: ['has spaces!'] }), 'bad_moment');
  refuses(() => resolveKit(c, { moments: [''] }), 'bad_moment');
  refuses(() => resolveKit(c, { moments: [42] }), 'bad_moment');
  refuses(() => resolveKit(c, { moments: ['a'.repeat(41)] }), 'bad_moment');
});

test('resolveKit: errors name the way out', (t) => {
  const c = fixture(t);
  if (!c) return;
  refuses(() => resolveKit(c, {}), 'no_moments');
  refuses(() => resolveKit(c, { theme: 'nope', moments: ['click'] }), 'not_found');
  refuses(() => resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-sof' }] }), 'not_found');
  try { resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-sof' }] }); } catch (e) { assert.match(e.message, /Did you mean ui-click-soft/); }
  refuses(() => resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-soft', params: { nope: 1 } }] }), 'unknown_param');
  refuses(() => resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-soft', params: { pitch: 'high' } }] }), 'bad_param_value');
});

test('resolveKit: out-of-range values are clamped and reported', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-soft', params: { pitch: 99999, tone: -4 } }] });
  assert.equal(r.choices[0].params.pitch, 2400);
  assert.equal(r.choices[0].params.tone, 0);
  assert.equal(r.warnings.filter((w) => /outside/.test(w)).length, 2);
});

test('resolveKit: a sound with a parameter named like a play() option is refused', (t) => {
  if (skip(t)) return;
  const m = fixtureManifest();
  const s = m.sounds.find((x) => x.id === 'ui-click-soft');
  s.params.when = { min: 0, max: 1, def: 0 };
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  const c = new Catalog(dir, { levelsPath: false }).load();
  refuses(() => resolveKit(c, { moments: [{ moment: 'click', sound: 'ui-click-soft' }] }), 'reserved_param');
});

test('checkParams validates, clamps and reports', (t) => {
  const c = fixture(t);
  if (!c) return;
  const s = c.get('ui-click-soft');
  assert.deepEqual(checkParams(s, undefined, 'x'), { values: {}, clamped: [] });
  const r = checkParams(s, { pitch: '1500', tone: 7 }, 'x');
  assert.equal(r.values.pitch, 1500, 'numeric strings are accepted');
  assert.equal(r.values.tone, 1);
  assert.deepEqual(r.clamped, [{ param: 'tone', requested: 7, used: 1, range: [0, 1] }]);
  refuses(() => checkParams(s, [1], 'x'), 'bad_params');
  refuses(() => checkParams(s, { pitch: null }, 'x'), 'bad_param_value');
  refuses(() => checkParams(s, { pitch: true }, 'x'), 'bad_param_value');
  refuses(() => checkParams(s, { pitch: NaN }, 'x'), 'bad_param_value');
});

test('resolveKit on the real catalog: the retro mood switches chip on where a sound has it', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const retro = resolveKit(c, { moments: ['jump'], mood: 'retro' }).choices[0];
  assert.equal(retro.params.chip, 1);
  const plain = resolveKit(c, { moments: ['jump'] }).choices[0];
  assert.ok(plain.params.chip === undefined || plain.params.chip === plain.sound.params.chip.def, 'without the mood chip stays at its default');
  const themed = resolveKit(c, { theme: 'soft-ui', mood: 'retro' });
  assert.ok(themed.choices.every((x) => x.source === 'theme'), 'a theme keeps its own parameters: a mood does not override them');
});

// ---------------------------------------------------------------- the module

let counter = 0;
/** Write a kit module to disk and import it with a fresh strict mock AudioContext as the global. */
async function loadEsm(code, { audio = true } = {}) {
  const dir = tmpDir('timbre-kit-');
  const file = path.join(dir, `kit-${++counter}.mjs`);
  fs.writeFileSync(file, code);
  const state = { created: 0, contexts: [] };
  const old = globalThis.AudioContext;
  if (audio) {
    globalThis.AudioContext = class extends MockContext {
      constructor() { super(48000, { strict: true }); state.created++; state.contexts.push(this); }
    };
  } else {
    delete globalThis.AudioContext;
  }
  try {
    const mod = await import(pathToFileURL(file).href + '?n=' + counter);
    return { mod, state, restore: () => { if (old) globalThis.AudioContext = old; else delete globalThis.AudioContext; } };
  } catch (e) {
    if (old) globalThis.AudioContext = old; else delete globalThis.AudioContext;
    throw e;
  }
}

const limiters = (ac) => ac.nodes.filter((n) => n.kind === 'compressor').length;

test('the ESM kit: nothing happens at load, the context appears on the first play, one chain is shared', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  const k = buildKitModule(c, r.choices);
  const { mod, state, restore } = await loadEsm(k.code);
  try {
    assert.equal(state.created, 0, 'no AudioContext at load');
    assert.deepEqual(Object.keys(mod).sort(), ['default', 'getContext', 'has', 'moments', 'play', 'prime', 'setMuted']);
    assert.deepEqual(mod.moments, r.choices.map((x) => x.moment));
    assert.equal(mod.getContext(), null, 'getContext() before use is null');
    assert.equal(mod.has('click'), true);
    assert.equal(mod.has('constructor'), false);
    assert.equal(state.created, 0, 'asking does not create it');
    const end = mod.play('click');
    assert.equal(state.created, 1, 'created on the first play');
    assert.ok(Math.abs(end - (PREROLL + 0.08)) < 1e-9, `the first sound waits for the limiter: ${end}`);
    for (const m of mod.moments) mod.play(m);
    assert.equal(state.created, 1, 'one context for all moments');
    const ac = state.contexts[0];
    assert.equal(limiters(ac), 1, 'one limiter');
    assert.equal(ac.timbreChains.size, 1, 'one chain, kept where a pasted Copy keeps it');
    assert.equal(mod.getContext(), ac);
    assert.equal(mod.default.play, mod.play);
  } finally { restore(); }
});

test('the ESM kit: unknown moments, muting, when, dest and overrides', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  const { mod, state, restore } = await loadEsm(buildKitModule(c, r.choices).code);
  try {
    assert.equal(mod.play('nope'), null);
    assert.equal(mod.play('__proto__'), null);
    assert.equal(mod.play('toString'), null);
    assert.equal(state.created, 0, 'an unknown moment does not create the context');
    mod.play('click');
    const ac = state.contexts[0];
    // the chain is warm after PREROLL: with when well past it, the sound starts exactly there
    assert.ok(Math.abs(mod.play('click', { when: 5 }) - (5 + 0.08)) < 1e-9);
    // overrides are clamped to range and never throw the strict mock
    assert.doesNotThrow(() => mod.play('click', { pitch: 1e9, tone: -1e9 }));
    assert.doesNotThrow(() => mod.play('click', { pitch: NaN, tone: 'x' }));
    assert.doesNotThrow(() => mod.play('toggle-on', { on: 0 }));
    // a different destination gets its own chain
    const dest = ac.createGain();
    dest.connect(ac.destination);
    mod.play('click', { dest });
    assert.equal(ac.timbreChains.size, 2);
    assert.equal(limiters(ac), 2);
    // muted: nothing is scheduled
    const before = ac.nodes.length;
    mod.setMuted(true);
    assert.equal(mod.play('click'), null);
    assert.equal(ac.nodes.length, before);
    mod.setMuted(false);
    assert.notEqual(mod.play('click'), null);
  } finally { restore(); }
});

test('the ESM kit: prime() builds the context and the chain ahead of the first sound', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const { mod, state, restore } = await loadEsm(buildKitModule(c, resolveKit(c, { moments: ['click'] }).choices).code);
  try {
    assert.equal(mod.prime(), true);
    assert.equal(state.created, 1);
    const ac = state.contexts[0];
    assert.equal(limiters(ac), 1);
    assert.equal(mod.prime(), true);
    assert.equal(limiters(ac), 1, 'priming twice builds one chain');
    ac.currentTime = 1; // the chain has had time to warm
    assert.ok(Math.abs(mod.play('click') - (1.02 + 0.08)) < 1e-9, 'no warm-up wait on the first real sound');
  } finally { restore(); }
});

test('the ESM kit: with no Web Audio at all it stays silent instead of throwing', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const { mod, restore } = await loadEsm(buildKitModule(c, resolveKit(c, { moments: ['click'] }).choices).code, { audio: false });
  try {
    assert.equal(mod.play('click'), null);
    assert.equal(mod.prime(), false);
    assert.equal(mod.getContext(), null);
  } finally { restore(); }
});

test('the kit shares its master chain with a pasted Copy function on the same context', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['click'] });
  const { mod, state, restore } = await loadEsm(buildKitModule(c, r.choices).code);
  try {
    mod.play('click');
    const ac = state.contexts[0];
    const copy = buildCopy(c.get('notify-success-chime'), c.helpers, null, 1);
    const ctx = vm.createContext({});
    vm.runInContext(copy, ctx);
    ctx.notifySuccessChime(ac);
    assert.equal(limiters(ac), 1, 'the Copy reused the kit\'s chain');
  } finally { restore(); }
});

test('vary: false repeats exactly, vary: true draws a new noise seed each play', async (t) => {
  const c = fixture(t);
  if (!c) return;
  const choices = resolveKit(c, { moments: [{ moment: 'shuffle', sound: 'cards-riffle' }] }).choices;
  const noise = (ac) => ac.nodes.filter((n) => n.kind === 'buffer').map((n) => Array.from(n.buffer.getChannelData(0).slice(0, 8)).join(','));
  const run = async (vary) => {
    const { mod, state, restore } = await loadEsm(buildKitModule(c, choices, { vary }).code);
    try {
      mod.play('shuffle');
      mod.play('shuffle');
      const all = noise(state.contexts[0]);
      const half = all.length / 2;
      return { first: all.slice(0, half), second: all.slice(half) };
    } finally { restore(); }
  };
  const fixed = await run(false);
  assert.deepEqual(fixed.first, fixed.second, 'the same noise every time');
  const varied = await run(true);
  assert.notDeepEqual(varied.first, varied.second, 'a new seed per play');
  const { mod, state, restore } = await loadEsm(buildKitModule(c, choices, { vary: true }).code);
  try {
    mod.play('shuffle', { seed: 9 });
    mod.play('shuffle', { seed: 9 });
    const all = noise(state.contexts[0]);
    assert.deepEqual(all.slice(0, all.length / 2), all.slice(all.length / 2), 'an explicit seed wins over vary');
  } finally { restore(); }
});

test('the module carries each helper and each recipe exactly once, byte for byte the catalog\'s', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  const k = buildKitModule(c, r.choices);
  const code = k.code;
  for (const h of k.helpers) {
    assert.equal(count(code, new RegExp('^function ' + h + '\\(', 'm')), 1, `${h} is defined once`);
    assert.ok(code.includes(dedent(c.helpers[h].src)), `${h} is the catalog's source`);
  }
  // each recipe is the Copy's recipe with the function renamed
  for (const id of k.sounds) {
    const s = c.get(id);
    const copy = buildCopy(s, c.helpers, null, 1).split('\n');
    const start = copy.findIndex((l) => l.startsWith('  function play('));
    let end = start;
    while (copy[end] !== '  }') end++;
    const recipe = copy.slice(start, end + 1).map((l) => l.slice(2)).join('\n').replace('function play(', 'function sfx' + camel(id).replace(/^./, (x) => x.toUpperCase()) + '(');
    assert.ok(code.includes(recipe), `${id}: the recipe differs from the Copy's`);
    assert.equal(count(code, new RegExp('^// ' + s.name + ' \\(' + id + '\\)', 'm')), 1);
  }
  assert.equal(count(code, /^function master\(/gm), 1);
  assert.doesNotMatch(code, DASHES);
});

test('a kit is smaller than the same sounds pasted one by one', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  const k = buildKitModule(c, r.choices);
  const separate = k.sounds.reduce((n, id) => n + buildCopy(c.get(id), c.helpers, null, 1).length, 0);
  assert.ok(k.code.length < separate * 0.6, `${k.code.length} bytes against ${separate}`);
});

test('two moments that share a sound share its recipe', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: ['toggle-on', 'toggle-off'] });
  const k = buildKitModule(c, r.choices);
  assert.deepEqual(k.sounds, ['ui-toggle-switch']);
  assert.equal(count(k.code, /^function sfxUiToggleSwitch\(/gm), 1);
  assert.match(k.code, /"toggle-on": \{ run: sfxUiToggleSwitch,.* on: 1/);
  assert.match(k.code, /"toggle-off": \{ run: sfxUiToggleSwitch,.* on: 0/);
});

test('the script form defines one global and runs the same', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { theme: 'soft-ui' });
  const k = buildKitModule(c, r.choices, { format: 'script', globalName: 'mySounds' });
  assert.equal(k.globalName, 'mySounds');
  assert.doesNotMatch(k.code, /^export /m);
  const created = [];
  const ctx = vm.createContext({ AudioContext: class extends MockContext { constructor() { super(48000, { strict: true }); created.push(this); } } });
  vm.runInContext(k.code, ctx);
  assert.equal(created.length, 0, 'nothing created at load');
  const kit = vm.runInContext('mySounds', ctx);
  assert.deepEqual(Object.keys(kit).sort(), ['getContext', 'has', 'moments', 'play', 'prime', 'setMuted']);
  assert.ok(kit.play('success') > 0);
  assert.equal(created.length, 1);
  assert.equal(limiters(created[0]), 1);
  // strict script: it does not leak helpers into the page's globals
  assert.equal(vm.runInContext('typeof osc', ctx), 'undefined');
});

test('globalName must be a safe identifier', (t) => {
  const c = fixture(t);
  if (!c) return;
  const choices = resolveKit(c, { moments: ['click'] }).choices;
  for (const bad of ['1bad', 'a b', 'x;alert(1)', 'class', 'eval', 'a'.repeat(41), '', 'a-b']) {
    refuses(() => buildKitModule(c, choices, { format: 'script', globalName: bad }), 'bad_global_name');
  }
  assert.doesNotThrow(() => buildKitModule(c, choices, { format: 'script', globalName: 'appSounds' }));
  refuses(() => buildKitModule(c, choices, { format: 'cjs' }), 'bad_format');
  refuses(() => buildKitModule(c, []), 'no_moments');
});

test('names and values reach the generated code only as JSON or numbers', (t) => {
  const c = fixture(t);
  if (!c) return;
  const r = resolveKit(c, { moments: [{ moment: 'my-click_2', sound: 'ui-click-soft', params: { pitch: 1234.56789012 } }] });
  const k = buildKitModule(c, r.choices);
  assert.match(k.code, /"my-click_2": \{ run: sfxUiClickSoft, dur: 0\.08, seeded: true, params: \{ pitch: 1234\.57,/);
});

test('the real catalog: a kit of every known moment builds, runs and plays them all', async (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const r = resolveKit(c, { moments: Object.keys(MOMENTS), mood: 'calm' });
  assert.ok(r.choices.length >= Object.keys(MOMENTS).length - 2, `unresolved: ${r.unresolved.map((u) => u.moment).join(', ')}`);
  const k = buildKitModule(c, r.choices);
  const { mod, state, restore } = await loadEsm(k.code);
  try {
    for (const m of mod.moments) {
      assert.notEqual(mod.play(m), null, m);
      const sound = r.choices.find((x) => x.moment === m).sound;
      const max = Object.fromEntries(Object.entries(sound.params).map(([key, d]) => [key, d.max]));
      const min = Object.fromEntries(Object.entries(sound.params).map(([key, d]) => [key, d.min]));
      assert.doesNotThrow(() => mod.play(m, max), `${m} at every max`);
      assert.doesNotThrow(() => mod.play(m, min), `${m} at every min`);
    }
    assert.equal(limiters(state.contexts[0]), 1);
    // helpers: each defined once even with dozens of sounds
    for (const h of k.helpers) assert.equal(count(k.code, new RegExp('^function ' + h + '\\(', 'm')), 1, h);
    assert.ok(k.helpers.length <= Object.keys(c.helpers).length);
  } finally { restore(); }
});

test('every real sound works as a one-moment kit (shared helper plumbing holds for each)', async (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const sample = c.sounds.filter((_, i) => i % 3 === 0);
  for (const s of sample) {
    const r = resolveKit(c, { moments: [{ moment: 'x', sound: s.id }] });
    const { mod, restore } = await loadEsm(buildKitModule(c, r.choices).code);
    try {
      assert.notEqual(mod.play('x'), null, s.id);
    } finally { restore(); }
  }
  // and the standalone Copy of the same sounds (the other route to the same recipes)
  for (const s of sample.slice(0, 10)) runCopy(buildCopy(s, c.helpers, null, 1), s);
});
