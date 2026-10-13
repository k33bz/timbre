// The catalog loader: the real catalog, a catalog with bad entries, a missing one, index-only,
// hot reload, and the defaults for where to look.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Catalog, CATEGORIES, paramKind, DEFAULT_CATALOG_DIR } from '../lib/catalog.js';
import { HAVE_REPO, REAL_CATALOG, REPO, tmpDir, writeCatalog } from './helper.js';
import { realManifest } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

test('the default catalog directory is ../catalog next to the package', () => {
  assert.equal(DEFAULT_CATALOG_DIR, path.join(REPO, 'catalog'));
});

test('loads the real catalog', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG).load();
  assert.equal(c.error, null);
  assert.equal(c.mode, 'manifest');
  assert.ok(c.sounds.length > 0, 'has sounds');
  assert.deepEqual(c.warnings, [], 'a built catalog loads without warnings');
  assert.ok(c.themes.length >= 1, 'has a theme');
  assert.equal(c.version, JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version);
  assert.equal(c.schema, 2);
  for (const s of c.sounds) {
    assert.ok(s.copyable, `${s.id} is copyable`);
    assert.match(s.fname, /^[a-z][A-Za-z0-9]*$/);
    for (const p of s.paramList) assert.ok(p.def >= p.min && p.def <= p.max, `${s.id}.${p.name} default in range`);
    assert.deepEqual(Object.keys(s.defaults), Object.keys(s.params));
  }
});

test('sounds come in gallery order: category, then id', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG).load();
  const order = (s) => CATEGORIES.indexOf(s.category);
  for (let i = 1; i < c.sounds.length; i++) {
    const a = c.sounds[i - 1];
    const b = c.sounds[i];
    assert.ok(order(a) < order(b) || (order(a) === order(b) && a.id < b.id), `${a.id} before ${b.id}`);
  }
});

test('categoryCounts lists every known category, empty ones as zero', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG).load();
  const counts = c.categoryCounts();
  for (const cat of CATEGORIES) assert.ok(cat in counts, cat);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), c.sounds.length);
});

test('a path to manifest.json works as well as the directory', (t) => {
  if (skip(t)) return;
  const c = new Catalog(path.join(REAL_CATALOG, 'manifest.json')).load();
  assert.equal(c.dir, REAL_CATALOG);
  assert.ok(c.sounds.length > 0);
});

test('TIMBRE_CATALOG sets the directory when none is given', (t) => {
  if (skip(t)) return;
  const old = process.env.TIMBRE_CATALOG;
  process.env.TIMBRE_CATALOG = REAL_CATALOG;
  try {
    assert.equal(new Catalog().dir, REAL_CATALOG);
  } finally {
    if (old === undefined) delete process.env.TIMBRE_CATALOG;
    else process.env.TIMBRE_CATALOG = old;
  }
});

test('a missing catalog is an error state, not a crash', () => {
  const c = new Catalog(path.join(tmpDir(), 'nope')).load();
  assert.equal(c.sounds.length, 0);
  assert.equal(c.error.code, 'catalog_unavailable');
  assert.match(c.error.message, /node build\.mjs/);
});

test('malformed JSON is reported as an invalid catalog', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'manifest.json'), '{ not json');
  const c = new Catalog(dir).load();
  assert.equal(c.error.code, 'catalog_invalid');
  assert.match(c.error.message, /not valid JSON/);
});

test('a manifest without a sounds array is invalid', () => {
  const dir = writeCatalog(tmpDir(), { name: 'Timbre', schema: 1 });
  assert.equal(new Catalog(dir).load().error.code, 'catalog_invalid');
});

test('bad sounds are skipped with a warning and the rest load', (t) => {
  if (skip(t)) return;
  const m = realManifest();
  const good = m.sounds[0];
  const bad = [
    { ...structuredClone(good), id: 'ui-no-dur', dur: undefined },
    { ...structuredClone(good), id: 'ui-bad-param', params: { pitch: { min: 5, max: 1, def: 3 } } },
    { ...structuredClone(good), id: 'Not Kebab' },
    { ...structuredClone(good) }, // duplicate id
    null,
  ];
  m.sounds = [good, ...bad];
  const c = new Catalog(writeCatalog(tmpDir(), m)).load();
  assert.equal(c.error, null);
  assert.equal(c.sounds.length, 1);
  const w = c.warnings.join('\n');
  assert.match(w, /ui-no-dur/);
  assert.match(w, /ui-bad-param/);
  assert.match(w, /duplicate sound id/);
  assert.ok(c.warnings.length >= 5);
});

test('a sound whose helper is missing loads but is not copyable', (t) => {
  if (skip(t)) return;
  const m = realManifest();
  delete m.helpers.osc;
  const c = new Catalog(writeCatalog(tmpDir(), m)).load();
  const uses = c.sounds.filter((s) => s.helpers.includes('osc'));
  assert.ok(uses.length > 0);
  for (const s of uses) {
    assert.equal(s.copyable, false);
    assert.match(s.copyIssue, /osc/);
  }
  assert.ok(c.warnings.some((w) => /osc/.test(w)));
});

test('index.json alone gives a search-only catalog with a warning', (t) => {
  if (skip(t)) return;
  const index = JSON.parse(fs.readFileSync(path.join(REAL_CATALOG, 'index.json'), 'utf8'));
  const c = new Catalog(writeCatalog(tmpDir(), null, index)).load();
  assert.equal(c.error, null);
  assert.equal(c.mode, 'index');
  assert.ok(c.sounds.length > 0);
  assert.ok(c.warnings.some((w) => /manifest\.json is missing/.test(w)));
  assert.ok(c.sounds.every((s) => !s.copyable));
});

test('themes keep their moments and parameter overrides', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG).load();
  const th = c.theme('soft-ui');
  assert.ok(th);
  assert.equal(th.moments.click.sound, 'ui-click-soft');
  assert.deepEqual(th.moments['toggle-on'].params, { on: 1, body: 0.4 });
  assert.equal(c.theme('nope'), null);
});

test('refresh() reloads when the manifest changes and not otherwise', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), realManifest());
  const c = new Catalog(dir).load();
  const n = c.sounds.length;
  const gen = c.generation;
  assert.equal(c.refresh(), false);
  assert.equal(c.generation, gen);
  const m = realManifest();
  const extra = structuredClone(m.sounds[0]);
  extra.id = 'ui-extra-test';
  extra.name = 'Extra Test';
  m.sounds.push(extra);
  m.count = m.sounds.length;
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m, null, 2));
  assert.equal(c.refresh(), true);
  assert.equal(c.sounds.length, n + 1);
  assert.ok(c.get('ui-extra-test'));
  assert.ok(c.generation > gen);
});

test('a catalog that appears after the server started is picked up', (t) => {
  if (skip(t)) return;
  const dir = path.join(tmpDir(), 'late');
  const c = new Catalog(dir).load();
  assert.ok(c.error);
  writeCatalog(dir, realManifest());
  assert.equal(c.refresh(), true);
  assert.equal(c.error, null);
  assert.ok(c.sounds.length > 0);
});

test('a count that disagrees with the sounds is flagged as stale', (t) => {
  if (skip(t)) return;
  const m = realManifest();
  m.count = m.sounds.length + 3;
  const c = new Catalog(writeCatalog(tmpDir(), m)).load();
  assert.ok(c.warnings.some((w) => /count/.test(w)));
});

test('paramKind reads the control a parameter is', () => {
  assert.equal(paramKind({ min: 0, max: 1, def: 1, step: 1 }), 'switch');
  assert.equal(paramKind({ min: 1, max: 6, def: 1, step: 1 }), 'count');
  assert.equal(paramKind({ min: 0, max: 1, def: 0.4 }), 'amount');
  assert.equal(paramKind({ min: 400, max: 2400, def: 1100, unit: 'Hz' }), 'value');
  assert.equal(paramKind({ min: 0, max: 1, def: 0.5, unit: 'x' }), 'value');
});

test('a manifest caught half written keeps the last good catalog, and the finished one replaces it', (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), realManifest());
  const c = new Catalog(dir).load();
  const n = c.sounds.length;
  const text = fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8');
  fs.writeFileSync(path.join(dir, 'manifest.json'), text.slice(0, Math.floor(text.length / 2)));
  assert.equal(c.refresh(), true);
  assert.equal(c.error, null, 'no error state: the old sounds are still served');
  assert.equal(c.sounds.length, n);
  assert.ok(c.warnings.some((w) => /kept the previous catalog: .*not valid JSON/.test(w)));
  assert.equal(c.refresh(), false, 'the broken file is not retried until it changes');
  fs.writeFileSync(path.join(dir, 'manifest.json'), text + '\n');
  assert.equal(c.refresh(), true);
  assert.equal(c.sounds.length, n);
  assert.deepEqual(c.warnings, [], 'the warning goes away with the good file');
});
