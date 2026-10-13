// The estimate cache: estimated levels survive a restart, a reload, a corrupt file and a version
// bump without ever being trusted when the sound has changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Catalog } from '../lib/catalog.js';
import { cacheFileFor, defaultCacheDir, ESTIMATOR_VERSION } from '../lib/levels.js';
import { HAVE_REPO, tmpDir, writeCatalog } from './helper.js';
import { fixtureManifest } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

function catalogWithCache(dir, cacheDir) {
  return new Catalog(dir, { levelsPath: false, cache: cacheDir }).load();
}

test('estimates are written to the cache file and read back by the next catalog', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const cacheDir = tmpDir('timbre-cache-');
  const first = catalogWithCache(dir, cacheDir);
  const file = cacheFileFor(dir, cacheDir);
  assert.equal(fs.existsSync(file), false);
  const want = first.sounds.slice(0, 4).map((s) => first.levelOf(s));
  assert.ok(first.levels.flush(), 'flush wrote the file');
  assert.ok(fs.existsSync(file));
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(saved.version, ESTIMATOR_VERSION);
  assert.ok(Object.keys(saved.entries).length >= 4);
  const second = catalogWithCache(dir, cacheDir);
  second.sounds.slice(0, 4).forEach((s, i) => {
    const seen = second.peekLevel(s);
    assert.ok(seen, 'known before anything was computed');
    assert.deepEqual(seen, want[i]);
  });
  assert.equal(second.peekLevel(second.sounds[10]), undefined, 'what was never estimated is still unknown');
});

test('a cache for one catalog directory is not used for another', (t) => {
  if (skip(t)) return;
  const cacheDir = tmpDir('timbre-cache-');
  const a = writeCatalog(tmpDir(), fixtureManifest());
  const b = writeCatalog(tmpDir(), fixtureManifest());
  assert.notEqual(cacheFileFor(a, cacheDir), cacheFileFor(b, cacheDir));
});

test('a sound whose recipe changed does not reuse the old estimate', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const cacheDir = tmpDir('timbre-cache-');
  const first = catalogWithCache(dir, cacheDir);
  first.levelOf(first.get('ui-click-soft'));
  first.levels.flush();
  const m = fixtureManifest();
  const s = m.sounds.find((x) => x.id === 'ui-click-soft');
  s.play = s.play.replace('peak: 0.042', 'peak: 0.084');
  assert.notEqual(s.play, fixtureManifest().sounds.find((x) => x.id === 'ui-click-soft').play, 'the edit applied');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  const second = catalogWithCache(dir, cacheDir);
  assert.equal(second.peekLevel(second.get('ui-click-soft')), undefined);
  const louder = second.levelOf(second.get('ui-click-soft'));
  assert.ok(louder.peak > first.levelOf(first.get('ui-click-soft')).peak + 3, 'doubling the peak is about 6 dB');
});

test('a corrupt or old-version cache is ignored', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const cacheDir = tmpDir('timbre-cache-');
  const file = cacheFileFor(dir, cacheDir);
  fs.writeFileSync(file, '{ nope');
  assert.equal(catalogWithCache(dir, cacheDir).peekLevel(catalogWithCache(dir, cacheDir).sounds[0]), undefined);
  fs.writeFileSync(file, JSON.stringify({ version: ESTIMATOR_VERSION + 1, entries: { x: { peak: -1 } } }));
  const c = catalogWithCache(dir, cacheDir);
  assert.equal(c.levels.cache.size, 0);
});

test('the estimate cache survives the catalog files being reloaded in the same process', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const c = new Catalog(dir, { levelsPath: false }).load();
  const lv = c.levelOf(c.get('ui-click-soft'));
  const m = fixtureManifest();
  m.sounds.push({ ...structuredClone(m.sounds[0]), id: 'ui-another-one' });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  assert.equal(c.refresh(), true);
  assert.deepEqual(c.peekLevel(c.get('ui-click-soft')), lv, 'no recomputation after a reload');
});

test('with no cache option nothing is written', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const c = new Catalog(dir, { levelsPath: false }).load();
  c.levelOf(c.sounds[0]);
  assert.equal(c.levels.cacheFile, null);
  assert.equal(c.levels.flush(), false);
});

test('the default cache directory follows TIMBRE_MCP_CACHE', () => {
  const old = process.env.TIMBRE_MCP_CACHE;
  process.env.TIMBRE_MCP_CACHE = path.resolve('some', 'where');
  try {
    assert.equal(defaultCacheDir(), path.resolve('some', 'where'));
  } finally {
    if (old === undefined) delete process.env.TIMBRE_MCP_CACHE;
    else process.env.TIMBRE_MCP_CACHE = old;
  }
  assert.match(defaultCacheDir(), /timbre-mcp$/);
});
