// The Copy parity test: the server's Copy text equals the gallery's, for every sound.
//
// How the gallery builds Copy: the page calls buildCopy(sound, T, params, seed), a function in
// src/core/copy.js that build.mjs bundles into dist/timbre.html (build.mjs: moduleText + buildHtml).
// That function is plain JavaScript on Function.prototype.toString(), so it is reachable from Node:
// this test imports it directly (path 1) and also assembles the page's runtime exactly the way
// buildHtml does, from the same core files, and runs that bundled copy of buildCopy in an isolated
// context (path 2). The server's lib/copy.js is a port of that algorithm fed from the catalog
// instead of the live kit, so path 2 is the closest thing to the browser without a browser.
//
// Every sound is compared at its defaults, at a random parameter set with another seed, at every min
// with seed 0, at every max with the largest seed, and with out-of-range values (clamped alike).
// The manifest under test is built fresh from src/ (so a stale catalog cannot mask a drift) and the
// one on disk is checked as well (so a stale catalog is reported).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HAVE_REPO, REPO, REAL_CATALOG, DASHES, tmpDir, writeCatalog } from './helper.js';
import { buildCopy as portCopy, PREROLL as PORT_PREROLL } from '../lib/copy.js';
import { Catalog } from '../lib/catalog.js';

const imp = (rel) => import(pathToFileURL(path.join(REPO, rel)).href);

let built = null;
let gallery = null;
if (HAVE_REPO) {
  const buildMod = await imp('build.mjs');
  const { T } = await imp('src/core/t.js');
  const copyMod = await imp('src/core/copy.js');
  const renderMod = await imp('src/core/render.js');
  const result = await buildMod.build();
  assert.deepEqual(result.errors, [], 'the sources build');
  built = { manifest: JSON.parse(result.outputs['catalog/manifest.json']), sounds: result.sounds, buildMod, HELPER_MODULES: (await imp('src/core/t.js')).HELPER_MODULES };
  gallery = { T, copy: copyMod, render: renderMod };
}

/** Parameter sets to compare at. */
function cases(sound, buildMod) {
  const defs = sound.params || {};
  const min = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.min]));
  const max = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.max]));
  const wild = Object.fromEntries(Object.keys(defs).map((k, i) => [k, i % 2 ? -1e9 : 1e9]));
  return [
    ['defaults', null, 1],
    ['random', buildMod.randomParamSets(sound, 1, 0xc0b1)[0], 5],
    ['min', min, 0],
    ['max', max, 4294967295],
    ['out of range', wild, 7],
    ['one value with many digits', Object.keys(defs).length ? { [Object.keys(defs)[0]]: defs[Object.keys(defs)[0]].min + 0.123456789 * (defs[Object.keys(defs)[0]].max - defs[Object.keys(defs)[0]].min) } : null, 2],
  ];
}

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

test('PREROLL in the port is the gallery\'s', (t) => {
  if (skip(t)) return;
  assert.equal(PORT_PREROLL, gallery.render.PREROLL);
});

test('the port reproduces the gallery\'s Copy (src/core/copy.js) byte for byte, every sound', (t) => {
  if (skip(t)) return;
  const man = built.manifest;
  assert.ok(built.sounds.length > 0);
  let compared = 0;
  for (const s of built.sounds) {
    const ms = man.sounds.find((x) => x.id === s.id);
    assert.ok(ms, `${s.id} is in the manifest`);
    for (const [label, over, seed] of cases(s, built.buildMod)) {
      const want = gallery.copy.buildCopy(s, gallery.T, over, seed);
      const got = portCopy(ms, man.helpers, over, seed);
      assert.equal(got, want, `${s.id} (${label}) differs from the gallery's Copy`);
      compared++;
    }
  }
  assert.ok(compared >= built.sounds.length * 5);
});

test('...and the page\'s bundled runtime (built the way buildHtml builds it) agrees', (t) => {
  if (skip(t)) return;
  const { moduleText } = built.buildMod;
  const core = built.HELPER_MODULES.map((f) => moduleText('src/core/' + f)).join('\n');
  const names = Object.keys(gallery.T).join(', ');
  // the page runs core + T + render + wav + copy in one scope (build.mjs, buildHtml)
  const script = [
    "'use strict';",
    core,
    'const T = Object.freeze({ ' + names + ' });',
    ['render.js', 'copy.js'].map((f) => moduleText('src/core/' + f)).join('\n'),
    'return { T, buildCopy };',
  ].join('\n');
  const ctx = vm.createContext({});
  const page = vm.runInContext('(function () {\n' + script + '\n})()', ctx, { filename: 'page-runtime.js' });
  const man = built.manifest;
  for (const s of built.sounds) {
    const ms = man.sounds.find((x) => x.id === s.id);
    // a sound as the page holds it: the metadata plus play as a function expression
    const pageSound = { ...JSON.parse(JSON.stringify({ id: ms.id, name: ms.name, category: ms.category, tags: ms.tags, desc: ms.desc, dur: ms.dur, params: ms.params })), play: vm.runInContext('(' + ms.play + ')', ctx) };
    for (const [label, over, seed] of cases(s, built.buildMod).slice(0, 3)) {
      const want = page.buildCopy(pageSound, page.T, over, seed);
      const got = portCopy(ms, man.helpers, over, seed);
      assert.equal(got, want, `${s.id} (${label}) differs from the page's bundled Copy`);
    }
  }
});

test('the catalog on disk gives the same Copy as a fresh build (it is not stale)', (t) => {
  if (skip(t)) return;
  const disk = new Catalog(REAL_CATALOG).load();
  assert.equal(disk.error, null);
  const ids = built.sounds.map((s) => s.id).sort();
  assert.deepEqual(disk.sounds.map((s) => s.id).sort(), ids, 'catalog/manifest.json lists the same sounds as src/sounds: run `node build.mjs`');
  for (const s of built.sounds) {
    const ds = disk.get(s.id);
    const want = gallery.copy.buildCopy(s, gallery.T, null, 1);
    assert.equal(portCopy(ds, disk.helpers, null, 1), want, `${s.id}: catalog/manifest.json is out of date, run \`node build.mjs\``);
  }
});

test('a catalog built here and read through Catalog gives the same Copy too', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), built.manifest);
  const c = new Catalog(dir).load();
  assert.equal(c.error, null);
  for (const s of built.sounds) {
    assert.equal(portCopy(c.get(s.id), c.helpers, null, 1), gallery.copy.buildCopy(s, gallery.T, null, 1), s.id);
  }
});

test('every Copy runs on its own and carries only the helpers it lists', (t) => {
  if (skip(t)) return;
  const man = built.manifest;
  return import('./mockrun.js').then(({ runCopy }) => {
    for (const ms of man.sounds) {
      const text = portCopy(ms, man.helpers, null, 3);
      const r = runCopy(text, ms);
      assert.ok(Math.abs(r.end - (PORT_PREROLL + ms.dur)) < 1e-9, `${ms.id} end ${r.end}`);
      assert.equal(r.limiters, 1, `${ms.id} builds one limiter`);
      assert.equal(r.limitersAfterSecondCall, 1, `${ms.id} reuses its chain`);
      assert.deepEqual(r.defined.filter((n) => n !== r.fname && n !== 'play').sort(), [...ms.helpers].sort(), `${ms.id} defines exactly its helpers`);
      assert.doesNotMatch(text, DASHES, 'no em or en dashes');
    }
  });
});
