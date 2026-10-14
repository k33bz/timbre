// Copy: one self-contained JavaScript function per sound, carrying only the helpers it uses.
//
// Helpers are plain top-level functions that call each other by name, so their sources come
// straight from Function.prototype.toString() (the same text in Node and in the page) and their
// dependencies from scanning that text. stripCode() removes comments and string contents first, so
// a helper named in a comment or a string is never pulled in. build.mjs uses the same functions to
// write each sound's helper list into the catalog, and the unit tests check the result.
import { paramsFor, PREROLL } from './render.js';

/** Remove comments and the contents of string and template literals, keeping the code. */
export function stripCode(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    const nx = src[i + 1];
    if (ch === '/' && nx === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && nx === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e < 0 ? n : e + 2;
      out += ' ';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < n && src[i] !== ch) i += src[i] === '\\' ? 2 : 1;
      i++;
      out += '""';
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** The T members a play source uses (T.name), in first-use order. Unknown names included. */
export function usedHelpers(src, T) {
  const code = stripCode(typeof src === 'function' ? src.toString() : src);
  const re = /\bT\s*\.\s*([A-Za-z_$][\w$]*)/g;
  const seen = [];
  let m;
  while ((m = re.exec(code))) if (!seen.includes(m[1])) seen.push(m[1]);
  return seen;
}

/** The helpers that helper `name` calls, read from its source. */
export function helperDeps(name, T) {
  const code = stripCode(T[name].toString());
  return Object.keys(T).filter(
    (h) => h !== name && new RegExp('(^|[^\\w$.])' + h.replace(/\$/g, '\\$') + '(?![\\w$])(?!\\s*:)').test(code),
  );
}

/** `names` plus everything they depend on, dependencies first. */
export function helperClosure(names, T) {
  const out = [];
  const busy = new Set();
  const visit = (n) => {
    if (out.includes(n) || busy.has(n) || !(n in T)) return;
    busy.add(n);
    for (const d of helperDeps(n, T)) visit(d);
    busy.delete(n);
    out.push(n);
  };
  names.forEach(visit);
  return out;
}

/** Remove the indentation the lines after the first share (toString keeps the file's indent). */
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

/**
 * A sound's play as a normalized anonymous function source: 'function (T, out, t, p) { ... }'.
 * Accepts the method form a sound file uses (play(T, out, t, p) { ... }) and function forms.
 */
export function playSource(fn) {
  let s = (typeof fn === 'function' ? fn.toString() : String(fn)).trim();
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

/** The helpers a sound's Copy carries: what play uses, plus seed (with rand) and master. */
export function copyHelpers(sound, T) {
  const uses = usedHelpers(playSource(sound.play), T).filter((n) => n in T);
  const want = uses.slice();
  if (helperClosure(uses, T).includes('rand')) want.push('seed');
  want.push('master');
  return { uses, helpers: helperClosure(want, T) };
}

const fmtNum = (v) => String(Number(Number(v).toPrecision(6)));
const indent = (s, pad) => s.split('\n').map((l) => (l.trim() ? pad + l : l)).join('\n');

/**
 * The Copy text for a sound at parameter values `over` (defaults where absent) and a seed.
 * The result defines one function named after the sound (ui-click-soft -> uiClickSoft):
 *   uiClickSoft(ac, opts, when, dest) plays through a master chain into dest (default
 *   ac.destination). The chain is built once per destination and kept on the context; a sound never
 *   starts before its chain is PREROLL seconds old (the limiter's warm-up, see render.js), nor
 *   before `when`. Returns the time the sound ends.
 */
export function buildCopy(sound, T, over, seedValue) {
  const fname = camel(sound.id);
  const play = playSource(sound.play);
  const { uses, helpers } = copyHelpers(sound, T);
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
  for (const h of helpers) lines.push(indent(dedent(T[h].toString()), '  '));
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

/** The controls of a spoken or babbled line (the gallery's Speak panel, the MCP server's speak tool). */
export const SPEAK_PARAMS = {
  speak: {
    pitch: { min: -12, max: 12, def: 0, unit: 'st', desc: 'Pitch of the voice, up or down from its own' },
    rate: { min: 0.5, max: 1.6, def: 1, unit: 'x', desc: 'Speaking rate: low slow and deliberate, high brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 a flat monotone, 1 the voice\'s own, 2 animated' },
  },
  babble: {
    pitch: { min: -12, max: 12, def: 0, unit: 'st', desc: 'Pitch of the voice, up or down from its own' },
    speed: { min: 0.5, max: 1.6, def: 1, unit: 'x', desc: 'Talking speed: low drawn out, high rapid fire' },
    spread: { min: 0, max: 2, def: 1, desc: 'Pitch spread between blips: 0 a monotone, 1 the voice\'s own, 2 wild' },
  },
};

/** Other names a speech voice answers to: the announcer is the male voice. */
export const VOICE_ALIASES = { 'announcer-male': 'announcer' };

/**
 * Copy for a line from the Speak panel: one self-contained function that says (or babbles) it.
 * Speech is baked in as phonemes, so the function carries the engine only (utter, the synthesizer
 * and its output stage), never the text front end or the voice tables; babble carries the line and
 * chatter. cfg: mode ('speak' or 'babble'), text, voice (a name), the values of SPEAK_PARAMS[mode]
 * and seed. The function, fn(ac, opts, when, dest), keeps a sound's Copy contract: opts overrides
 * those values and the seed, and it returns the end time.
 */
export function buildSpeechCopy(T, cfg) {
  cfg = cfg || {};
  const babble = cfg.mode === 'babble';
  const voices = babble ? T.babbleVoices() : T.speechVoices();
  const want = Object.hasOwn(VOICE_ALIASES, String(cfg.voice)) ? VOICE_ALIASES[cfg.voice] : cfg.voice;
  const vname = Object.hasOwn(voices, want) ? want : Object.keys(voices)[0];
  const text = String(cfg.text == null ? '' : cfg.text);
  const engine = babble ? 'chatter' : 'utter';
  const vals = paramsFor({ params: SPEAK_PARAMS[babble ? 'babble' : 'speak'] }, cfg);
  const pairs = Object.keys(vals).map((k) => k + ': ' + fmtNum(vals[k]));
  pairs.push('seed: ' + ((Number(cfg.seed == null ? 1 : cfg.seed) || 0) >>> 0));
  const words = (text.match(/[A-Za-z0-9]+/g) || []).slice(0, 4).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  const fname = (babble ? 'babble' : 'say') + (words.join('') || 'Line');
  // JSON literals, with < escaped so the text can never close a script tag it is pasted into
  const lit = (x) => JSON.stringify(x).replace(/</g, '\\u003c');
  const line = babble ? { text } : { ph: T.phonemize(text) };
  // the line as the usage comment quotes it: one line, no angle brackets
  const shown = text.replace(/[\u0000-\u001f\u2028\u2029]+/g, ' ').replace(/[<>]/g, '').trim();
  const quote = shown.length > 60 ? shown.slice(0, 57) + '...' : shown;
  const lines = [];
  lines.push('// Usage: const ac = new AudioContext(); ' + fname + '(ac); // "' + quote + '", ' + (babble ? 'babbled' : 'spoken') +
    ' by the ' + voices[vname].name + ' voice, synthesized (Timbre). Optional: opts { ' + Object.keys(vals).join(', ') +
    ', seed }, when (s), dest node. Returns the end time.');
  lines.push('function ' + fname + '(ac, opts, when, dest) {');
  for (const h of helperClosure([engine, 'seed', 'master'], T)) lines.push(indent(dedent(T[h].toString()), '  '));
  lines.push('  const LINE = ' + lit(line) + ';');
  lines.push('  const VOICE = ' + lit(voices[vname]) + ';');
  lines.push('  const p = Object.assign({ ' + pairs.join(', ') + ' }, opts);');
  lines.push('  // one master chain per destination, kept on the context; a new one needs ' + PREROLL + ' s to warm up');
  lines.push('  const chains = ac.timbreChains || (ac.timbreChains = new Map());');
  lines.push('  const to = dest || ac.destination;');
  lines.push('  if (!chains.has(to)) chains.set(to, { out: master(ac, to), ready: ac.currentTime + ' + PREROLL + ' });');
  lines.push('  const chain = chains.get(to);');
  lines.push('  const out = chain.out;');
  lines.push('  const t = Math.max(when == null ? 0 : when, ac.currentTime + 0.02, chain.ready);');
  lines.push('  seed(p.seed);');
  lines.push('  return ' + engine + '(out, t, Object.assign({}, LINE, { voice: VOICE, ' + Object.keys(vals).map((k) => k + ': p.' + k).join(', ') + ' }));');
  lines.push('}');
  return lines.join('\n') + '\n';
}
