// Copy, rebuilt from the catalog alone.
//
// The gallery's Copy button calls buildCopy(sound, T, params, seed) in src/core/copy.js, where T is
// the live helper kit. This module is the same algorithm fed from catalog/manifest.json instead:
// a sound's `play` source, its `uses` and `helpers` lists (computed by the build with the same
// functions) and each helper's source text. Nothing here imports from the repository's src/, so the
// server runs on a catalog file alone; test/copy-parity.test.js proves the output is byte for byte
// what the gallery produces, for every sound.
//
// Keep the text this file emits in step with src/core/copy.js (buildCopy, playSource, splitFunction,
// dedent, camel, paramsFor, fmtNum) and with PREROLL in src/core/render.js. The parity test fails
// the day they drift.

/** Seconds a master chain needs before a sound may start on it (src/core/render.js, PREROLL). */
export const PREROLL = 0.2;

/** Remove the indentation the lines after the first share (src/core/copy.js, dedent). */
export function dedent(s) {
  const lines = s.split('\n');
  let min = Infinity;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const m = lines[i].length - lines[i].trimStart().length;
    if (m < min) min = m;
  }
  if (!isFinite(min) || min === 0) return s;
  return lines.map((l, i) => (i === 0 ? l : l.slice(Math.min(min, l.length - l.trimStart().length)))).join('\n');
}

/** A play source as a normalized anonymous function: 'function (T, out, t, p) { ... }'. */
export function playSource(src) {
  let s = String(src).trim();
  if (/^function\b/.test(s)) s = s.replace(/^function\s*[\w$]*\s*\(/, 'function (');
  else if (/^[A-Za-z_$][\w$]*\s*\(/.test(s)) s = s.replace(/^[A-Za-z_$][\w$]*\s*\(/, 'function (');
  else throw new Error('play must be written as a method: play(T, out, t, p) { ... }');
  return dedent(s);
}

/** Split 'function (a, b) { body }' into its parameter list and body text. */
export function splitFunction(src) {
  const open = src.indexOf('(');
  const close = src.indexOf(')', open);
  const lb = src.indexOf('{', close);
  const rb = src.lastIndexOf('}');
  return { params: src.slice(open + 1, close).trim(), body: src.slice(lb + 1, rb) };
}

/** 'ui-click-soft' -> 'uiClickSoft' */
export function camel(id) {
  return String(id).replace(/[-_]+([a-z0-9])/gi, (m, ch) => ch.toUpperCase());
}

/** Parameter values for a sound: defaults, overridden by `over`, clamped to each range. */
export function paramsFor(sound, over) {
  const p = {};
  const defs = sound.params || {};
  for (const k of Object.keys(defs)) {
    const d = defs[k];
    let v = over && over[k] != null ? Number(over[k]) : d.def;
    if (!isFinite(v)) v = d.def;
    p[k] = Math.min(d.max, Math.max(d.min, v));
  }
  return p;
}

export const fmtNum = (v) => String(Number(Number(v).toPrecision(6)));
const indent = (s, pad) => s.split('\n').map((l) => (l.trim() ? pad + l : l)).join('\n');

/** True when a string is safe to use as a JavaScript identifier in generated code. */
export const isIdentifier = (s) => /^[A-Za-z_$][\w$]*$/.test(s);

/**
 * The Copy text for a sound at parameter values `over` (defaults where absent) and a seed.
 * `helperSrc` maps a helper name to its source text (manifest.helpers[name].src).
 * The sound's own `uses` (T members it calls) and `helpers` (dependency closure plus seed and
 * master, dependencies first) come from the manifest.
 */
export function buildCopy(sound, helperSrc, over, seedValue) {
  const fname = camel(sound.id);
  if (!isIdentifier(fname)) throw new Error(`"${sound.id}" does not make a valid function name`);
  const play = playSource(sound.play);
  const uses = sound.uses;
  const helpers = sound.helpers;
  for (const h of helpers) {
    if (!helperSrc[h] || typeof helperSrc[h].src !== 'string') throw new Error(`helper "${h}" (needed by ${sound.id}) is not in the catalog`);
  }
  const seeded = helpers.includes('rand');
  const vals = paramsFor(sound, over);
  const pairs = Object.keys(vals).map((k) => k + ': ' + fmtNum(vals[k]));
  if (seeded) pairs.push('seed: ' + ((Number(seedValue == null ? 1 : seedValue) || 0) >>> 0));
  const defaults = pairs.length ? '{ ' + pairs.join(', ') + ' }' : '{}';
  const first = Object.keys(vals)[0];
  const example = first ? fname + '(ac, { ' + first + ': ' + fmtNum(vals[first]) + ' })' : fname + '(ac)';
  const { params, body } = splitFunction(play);
  const lines = [];
  lines.push('// Usage: const ac = new AudioContext(); ' + example + '; // ' + sound.name +
    ', synthesized (Timbre). Optional: when (s), dest node. Returns the end time.');
  lines.push('function ' + fname + '(ac, opts, when, dest) {');
  for (const h of helpers) lines.push(indent(dedent(helperSrc[h].src), '  '));
  lines.push(indent('function play(' + params + ') {' + body.replace(/\s+$/, '') + '\n}', '  '));
  lines.push('  const T = { ' + uses.join(', ') + ' };');
  lines.push('  const p = Object.assign(' + defaults + ', opts);');
  lines.push('  // one master chain per destination, kept on the context; a new one needs ' + PREROLL + ' s to warm up');
  lines.push('  const chains = ac.timbreChains || (ac.timbreChains = new Map());');
  lines.push('  const to = dest || ac.destination;');
  lines.push('  if (!chains.has(to)) chains.set(to, { out: master(ac, to), ready: ac.currentTime + ' + PREROLL + ' });');
  lines.push('  const chain = chains.get(to);');
  lines.push('  const out = chain.out;');
  lines.push('  const t = Math.max(when == null ? 0 : when, ac.currentTime + 0.02, chain.ready);');
  if (seeded) lines.push('  seed(p.seed);');
  lines.push('  play(T, out, t, p);');
  lines.push('  return t + ' + fmtNum(sound.dur) + ';');
  lines.push('}');
  return lines.join('\n') + '\n';
}
