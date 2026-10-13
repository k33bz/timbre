// Levels: reading the level gate's report, the loudness bands, the LevelBook that prefers measured
// values, and the offline estimate checked against a stored copy of the gate's own numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { bandOf, parseReport, estimateLevels, LevelBook, reportCandidates, loadReport, BANDS } from '../lib/levels.js';
import { Catalog } from '../lib/catalog.js';
import { HAVE_REPO, REAL_CATALOG, HERE, tmpDir, writeCatalog } from './helper.js';
import { realManifest } from './fixture.js';

const GATE = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'levels-gate.json'), 'utf8'));
const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

test('bands cut at -23 and -17 dBFS, edges inclusive on the quieter side', () => {
  assert.equal(bandOf(-30), 'quiet');
  assert.equal(bandOf(-23), 'quiet');
  assert.equal(bandOf(-22.9), 'medium');
  assert.equal(bandOf(-17), 'medium');
  assert.equal(bandOf(-16.9), 'loud');
  assert.equal(bandOf(-12), 'loud');
  assert.deepEqual(BANDS.map((b) => b.name), ['quiet', 'medium', 'loud']);
});

test('parseReport reads the gate\'s report: defaults for the level, all renders for the range', () => {
  const rep = parseReport([
    {
      id: 'a-sound', dur: 0.5, problems: [],
      renders: [
        { label: 'defaults', seed: 1, peak: -20.1, rms: -30, pre: -25.5, end: 0.3 },
        { label: 'defaults', seed: 2, peak: -19.4, rms: -31, pre: -24.9, end: 0.31 },
        { label: 'random 1', seed: 1, peak: -25, rms: -35, pre: -30, end: 0.2 },
        { label: 'random 2', seed: 1, peak: -15.5, rms: -28, pre: -21, end: 0.4 },
      ],
    },
  ]);
  const r = rep.get('a-sound');
  assert.equal(r.peak, -19.4, 'the worst default seed');
  assert.equal(r.rms, -30.5, 'the mean default RMS');
  assert.equal(r.pre, -24.9);
  assert.deepEqual(r.range, { min: -25, max: -15.5 });
  assert.equal(r.problems, 0);
});

test('parseReport also takes a plain { id: { peak, rms } } map and ignores junk', () => {
  const rep = parseReport({ 'x-one': { peak: -21, rms: -33 }, 'x-two': { rms: -3 }, 'x-three': null });
  assert.equal(rep.get('x-one').peak, -21);
  assert.equal(rep.has('x-two'), false);
  assert.equal(parseReport(null).size, 0);
  assert.equal(parseReport([{ nope: 1 }, { id: 5 }, { id: 'e', renders: [] }]).size, 0);
});

test('the stored gate report parses and every default peak is inside the house range', () => {
  const rep = parseReport(GATE);
  assert.ok(rep.size >= 100);
  for (const [id, v] of rep) {
    assert.ok(v.peak <= -12 && v.peak >= -36, `${id} peak ${v.peak} is in the house range`);
    assert.ok(v.range.min <= v.range.max);
  }
});

test('report candidates: explicit first, then levels.json beside the catalog, then the gate output', () => {
  const dir = path.join('x', 'repo', 'catalog');
  const list = reportCandidates(dir, 'my.json');
  assert.equal(list[0], path.resolve('my.json'));
  assert.ok(list.includes(path.join(dir, 'levels.json')));
  assert.ok(list.includes(path.resolve(dir, '..', 'gates', 'out', 'levels.json')));
  assert.deepEqual(reportCandidates(dir, false), [], 'false turns discovery off');
});

test('a report beside the catalog is found, and a broken one is skipped', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'levels.json'), '{ nope');
  assert.equal(loadReport(dir, false), null);
  assert.equal(loadReport(dir), null, 'a broken file is skipped without throwing');
  fs.writeFileSync(path.join(dir, 'levels.json'), JSON.stringify({ 'ui-a': { peak: -22, rms: -35 } }));
  const r = loadReport(dir);
  assert.equal(r.byId.get('ui-a').peak, -22);
  assert.equal(r.file, path.join(dir, 'levels.json'));
});

test('LevelBook: measured values win and say so; the rest are estimated', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  // the report's turn comes only for sounds the catalog carries no measured levels for
  const sound = { ...c.sounds[0], levels: null };
  const est = c.levelOf(sound);
  assert.equal(est.source, 'estimated');
  assert.ok(['quiet', 'medium', 'loud'].includes(est.band));
  const rep = path.join(tmpDir(), 'report.json');
  fs.writeFileSync(rep, JSON.stringify({ [sound.id]: { peak: -13.2, rms: -30 } }));
  const book = new LevelBook({ catalogDir: REAL_CATALOG, explicit: rep });
  const m = book.levelOf(sound, c.helpers);
  assert.equal(m.source, 'measured');
  assert.equal(m.peak, -13.2);
  assert.equal(m.band, 'loud');
  const other = { ...c.sounds[1], levels: null };
  assert.equal(book.levelOf(other, c.helpers).source, 'estimated', 'sounds the report does not cover are estimated');
  assert.equal(book.levelOf(c.sounds[1], c.helpers).from, 'catalog', 'a sound the catalog measured keeps the catalog numbers');
});

test('LevelBook: a report older than the catalog is flagged stale, and a rewritten report is re-read', (t) => {
  if (skip(t)) return;
  const man = realManifest();
  for (const x of man.sounds) delete x.levels;   // a catalog without its own measurements
  const dir = writeCatalog(tmpDir(), man);
  const rep = path.join(dir, 'levels.json');
  fs.writeFileSync(rep, JSON.stringify({ 'ui-click-soft': { peak: -20, rms: -35 } }));
  const old = new Date(Date.now() - 3600 * 1000);
  fs.utimesSync(rep, old, old);
  const c = new Catalog(dir).load();
  const lv = c.levelOf(c.get('ui-click-soft'));
  assert.equal(lv.source, 'measured');
  assert.equal(lv.stale, true);
  fs.writeFileSync(rep, JSON.stringify({ 'ui-click-soft': { peak: -18, rms: -35 } }));
  c.refresh();
  assert.equal(c.levelOf(c.get('ui-click-soft')).peak, -18, 'the new report is picked up');
});

test('estimates are cached per sound and stable', (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const s = c.get('ui-click-soft');
  const a = c.levelOf(s);
  const b = c.levelOf(s);
  assert.equal(a, b, 'the same object comes back from the cache');
  const again = estimateLevels(s, c.helpers);
  assert.equal(again.peak, a.peak, 'a second run gives the same number (seeded noise)');
});

test('a sound that cannot run yields no estimate instead of throwing', () => {
  const broken = { id: 'x-broken', dur: 0.2, params: {}, play: 'function (T, out, t, p) { T.nothing(out, t); }', uses: ['osc'], helpers: ['osc'] };
  assert.equal(estimateLevels(broken, { osc: { src: 'function osc() {}' } }), null);
  const silent = { id: 'x-silent', dur: 0.2, params: {}, play: 'function (T, out, t, p) { }', uses: [], helpers: [] };
  assert.equal(estimateLevels(silent, {}), null);
  const loop = { id: 'x-loop', dur: 0.2, params: {}, play: 'function (T, out, t, p) { while (true) {} }', uses: [], helpers: [] };
  assert.equal(estimateLevels(loop, {}, null, 1, { timeout: 150 }), null, 'an endless play is cut off by the timeout');
});

test('the estimate tracks the level gate (stored report) on the real sounds', { timeout: 120000 }, (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const gate = parseReport(GATE);
  const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
  const fixtureHash = new Map(GATE.map((g) => [g.id, g.playHash]));
  const diffs = [];
  let hits = 0;
  for (const s of c.sounds) {
    const g = gate.get(s.id);
    if (!g || fixtureHash.get(s.id) !== hash(s.play)) continue; // new or changed since the report: not comparable
    const e = estimateLevels(s, c.helpers);
    assert.ok(e, `${s.id} can be estimated`);
    diffs.push({ id: s.id, d: e.peak - g.peak, rd: e.rms - g.rms });
    if (bandOf(e.peak) === bandOf(g.peak)) hits++;
  }
  if (diffs.length < 8) return t.skip('too few sounds in common with the stored report');
  const abs = diffs.map((x) => Math.abs(x.d)).sort((a, b) => a - b);
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
  const worst = [...diffs].sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3).map((x) => `${x.id} ${x.d.toFixed(1)}`).join(', ');
  t.diagnostic(`compared ${diffs.length} sounds: mean |peak error| ${mean.toFixed(2)} dB, median ${abs[abs.length >> 1].toFixed(2)}, worst ${worst}; same band for ${hits} (${((100 * hits) / diffs.length).toFixed(0)}%)`);
  assert.ok(mean <= 1.5, `mean peak error ${mean.toFixed(2)} dB`);
  assert.ok(abs[abs.length - 1] <= 5.5, `largest peak error ${abs[abs.length - 1].toFixed(1)} dB`);
  assert.ok(hits / diffs.length >= 0.85, `same loudness band for ${hits} of ${diffs.length}`);
  const rms = diffs.map((x) => Math.abs(x.rd)).sort((a, b) => a - b);
  assert.ok(rms[rms.length >> 1] <= 1.0, `median RMS error ${rms[rms.length >> 1].toFixed(2)} dB`);
});
