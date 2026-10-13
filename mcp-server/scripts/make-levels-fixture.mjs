#!/usr/bin/env node
// Condense a level-gate report (gates/out/levels.json) into test/fixtures/levels-gate.json, the
// stored measurements test/levels.test.js checks the offline estimator against.
//   node scripts/make-levels-fixture.mjs [path/to/levels.json] [path/to/catalog]
// Each sound keeps a short hash of its play source, so the test skips a sound that changed since.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const report = process.argv[2] || path.resolve(HERE, '..', '..', 'gates', 'out', 'levels.json');
const catalog = process.argv[3] || path.resolve(HERE, '..', '..', 'catalog');
const out = path.resolve(HERE, '..', 'test', 'fixtures', 'levels-gate.json');
const rep = JSON.parse(fs.readFileSync(report, 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(catalog, 'manifest.json'), 'utf8'));
const hash = (t) => crypto.createHash('sha1').update(t).digest('hex').slice(0, 12);
const keep = ['label', 'seed', 'peak', 'rms', 'pre', 'end'];
const pick = (m) => Object.fromEntries(keep.map((k) => [k, m[k]]));
const rows = [];
for (const r of rep) {
  const s = man.sounds.find((x) => x.id === r.id);
  if (!s) continue;
  const def = r.renders.filter((m) => m.label === 'defaults');
  const others = r.renders.filter((m) => m.label !== 'defaults');
  const lo = others.length ? others.reduce((a, b) => (b.peak < a.peak ? b : a)) : null;
  const hi = others.length ? others.reduce((a, b) => (b.peak > a.peak ? b : a)) : null;
  rows.push({ id: r.id, dur: r.dur, playHash: hash(s.play), renders: [...def.map(pick), ...(lo ? [pick(lo), pick(hi)] : [])] });
}
const text = '[\n' + rows.map((r) => ' ' + JSON.stringify({ ...r, renders: '@@' }).replace('"@@"', '[\n' + r.renders.map((x) => '   ' + JSON.stringify(x)).join(',\n') + '\n  ]')).join(',\n') + '\n]\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, text);
console.log(`wrote ${out}: ${rows.length} sounds, ${(text.length / 1024).toFixed(0)} KB`);
