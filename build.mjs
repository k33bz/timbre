#!/usr/bin/env node
// Timbre build. Zero dependencies, Node 22.
//   node build.mjs          validate every sound and theme, write catalog/ and dist/timbre.html
//   node build.mjs --check  the same validation, then fail if any written file would change
//
// Validation is the contract in docs/DESIGN.md and docs/ADDING_SOUNDS.md made executable:
//   * fields: id, name, category, tags, desc, dur, params, play, plus the optional family and
//     moments; ids unique, kebab-case, prefixed with the category, and the file lives at
//     src/sounds/<category>/<id>.js
//   * family, moments, a parameter's role and every theme's moment keys come from ONE vocabulary,
//     src/vocabulary.js, which the MCP server reads too
//   * params: each { min, max, def } (plus optional unit, step, desc, role) with min < max and def
//     in range
//   * a sound tagged loop-cell (one short cell a host re-triggers on an interval) names that
//     interval in its desc
//   * play uses only T.*: it is compiled in an isolated VM context (no window, no document, and
//     Math.random throws) and run against a mock WebAudio graph at the defaults, at every min, at
//     every max and at random settings. That catches globals, unknown helpers, invalid automation
//     (exponential ramps to zero, NaN times) and voices still sounding after the declared dur.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { T, HELPER_MODULES } from './src/core/t.js';
import { stripCode, usedHelpers, playSource, splitFunction, copyHelpers, helperDeps, dedent, VOICE_ALIASES } from './src/core/copy.js';
import { paramsFor, PREROLL, SAMPLE_RATE, MASTER_CHAIN } from './src/core/render.js';
import { MOMENTS, FAMILIES, ROLES } from './src/vocabulary.js';
import { MockContext } from './gates/lib/mockaudio.mjs';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const CATEGORIES = ['ui', 'notify', 'data', 'ai', 'game', 'battle', 'cards', 'duel', 'magic', 'fx', 'scifi', 'dark', 'ambience', 'music', 'voice'];
const SOUND_KEYS = ['id', 'name', 'category', 'tags', 'desc', 'dur', 'params', 'play'];
const OPTIONAL_KEYS = ['family', 'moments'];
const PARAM_KEYS = ['min', 'max', 'def', 'unit', 'step', 'desc', 'role', 'choices'];
// U+2013 and U+2014, built from code points so this file never contains one
const DASH = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
const THEME_KEYS = ['id', 'name', 'desc', 'moments'];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PARAM_NAME = /^[a-z][a-zA-Z0-9]*$/;
// a loop cell's desc names its re-trigger interval: "every 1.2 s", "every 900 ms"
const LOOP_CELL = 'loop-cell';
const INTERVAL = /\d(\.\d+)?\s*(ms|s)\b/;
// Identifiers a play() may not touch (checked on the source with comments and strings removed).
const FORBIDDEN = ['Date', 'performance', 'window', 'document', 'globalThis', 'self', 'navigator', 'fetch',
  'XMLHttpRequest', 'require', 'import', 'eval', 'Function', 'setTimeout', 'setInterval', 'requestAnimationFrame',
  'AudioContext', 'OfflineAudioContext', 'webkitAudioContext', 'this', 'localStorage', 'console', 'process'];

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

/** Import every .js file under dir (sorted, recursive). Resolves to [{ file, def }]. */
export async function loadDir(dir) {
  const files = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) files.push(p);
    }
  };
  walk(dir);
  const out = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(f).href);
    out.push({ file: rel(f), def: mod.default });
  }
  return out;
}

function mulberry(seedValue) {
  let s = seedValue >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let a = Math.imul(s ^ (s >>> 15), s | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 32-bit hash of a string (FNV-1a), for reproducible random parameter sets. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** n random parameter sets for a sound, reproducible from (id, salt), honouring each step. */
export function randomParamSets(sound, n, salt = 0) {
  const r = mulberry(hash(sound.id) ^ salt);
  const sets = [];
  for (let i = 0; i < n; i++) {
    const p = {};
    for (const [k, d] of Object.entries(sound.params || {})) {
      let v = d.min + (d.max - d.min) * r();
      if (d.step) v = Math.min(d.max, d.min + Math.round((v - d.min) / d.step) * d.step);
      p[k] = Number(v.toPrecision(6));
    }
    sets.push(p);
  }
  return sets;
}

const has = (code, name) => new RegExp('(^|[^\\w$.])' + name + '(?![\\w$])').test(code);

/** Compile a play source in an isolated context: only JS builtins, and Math.random throws. */
function isolatedPlay(src) {
  const ctx = vm.createContext({});
  vm.runInContext('Math.random = function () { throw new Error("use T.rand(), not Math.random()"); };', ctx);
  return vm.runInContext('(' + src + ')', ctx, { timeout: 2000 });
}

/** The vocabulary's moment names that look like m (shared words or prefixes), or the whole list. */
function nearMoments(m) {
  const words = String(m).split('-').filter((w) => w.length > 2);
  const near = Object.keys(MOMENTS).filter((k) => words.some((w) => k.includes(w) || w.startsWith(k.slice(0, 4))));
  return near.length ? 'near: ' + near.join(', ') : 'known: ' + Object.keys(MOMENTS).join(', ');
}

/** Validate one sound. Returns a list of error strings (empty = valid). */
export function validateSound(entry, kit = T) {
  const { file, def: s } = entry;
  const errs = [];
  const E = (m) => errs.push(`${file}: ${m}`);
  if (!s || typeof s !== 'object') { E('must `export default` a sound object'); return errs; }
  for (const k of Object.keys(s)) if (!SOUND_KEYS.includes(k) && !OPTIONAL_KEYS.includes(k)) E(`unknown field "${k}" (allowed: ${[...SOUND_KEYS, ...OPTIONAL_KEYS].join(', ')})`);
  for (const k of SOUND_KEYS) if (s[k] == null) E(`missing required field "${k}"`);
  if (typeof s.id !== 'string' || !KEBAB.test(s.id)) E(`id "${s.id}" must be kebab-case`);
  if (!CATEGORIES.includes(s.category)) E(`category "${s.category}" must be one of: ${CATEGORIES.join(', ')}`);
  else if (typeof s.id === 'string' && !s.id.startsWith(s.category + '-')) E(`id "${s.id}" must start with "${s.category}-"`);
  if (file && file.startsWith('src/sounds/') && typeof s.id === 'string' && s.category) {
    const want = `src/sounds/${s.category}/${s.id}.js`;
    if (file !== want) E(`must live at ${want}`);
  }
  if (s.name != null && (typeof s.name !== 'string' || !s.name.trim() || s.name.length > 40)) E('name must be a string of 1 to 40 characters');
  if (s.desc != null && (typeof s.desc !== 'string' || s.desc.length < 10 || s.desc.length > 200)) E('desc must be a string of 10 to 200 characters');
  for (const k of ['name', 'desc']) if (typeof s[k] === 'string' && DASH.test(s[k])) E(`${k} has an en or em dash: use a comma, a colon or "to"`);
  if (s.family != null && !Object.hasOwn(FAMILIES, s.family)) E(`family "${s.family}" must be one of: ${Object.keys(FAMILIES).join(', ')} (src/vocabulary.js)`);
  if (s.moments != null) {
    if (!Array.isArray(s.moments) || !s.moments.length) E('moments must be a non-empty array of moment names (src/vocabulary.js), or left out');
    else {
      for (const m of s.moments) if (typeof m !== 'string' || !Object.hasOwn(MOMENTS, m)) E(`moment "${m}" is not in the vocabulary (src/vocabulary.js: ${nearMoments(m)})`);
      if (new Set(s.moments).size !== s.moments.length) E('moments must be unique');
    }
  }
  if (s.tags != null) {
    if (!Array.isArray(s.tags) || !s.tags.length) E('tags must be a non-empty array');
    else {
      for (const tg of s.tags) if (typeof tg !== 'string' || !KEBAB.test(tg)) E(`tag "${tg}" must be a lowercase kebab-case string`);
      if (new Set(s.tags).size !== s.tags.length) E('tags must be unique');
      if (s.tags.includes(LOOP_CELL) && typeof s.desc === 'string' && !INTERVAL.test(s.desc)) E(`a ${LOOP_CELL} sound names its re-trigger interval in desc (for example "re-trigger every 1.2 s")`);
    }
  }
  if (s.dur != null && !(typeof s.dur === 'number' && s.dur > 0 && s.dur <= 10)) E('dur must be a number of seconds in (0, 10]');
  if (s.params != null) {
    if (typeof s.params !== 'object' || Array.isArray(s.params)) E('params must be an object');
    else {
      for (const [k, d] of Object.entries(s.params)) {
        if (!PARAM_NAME.test(k)) E(`param "${k}" must be a camelCase identifier`);
        if (k === 'seed') E('param name "seed" is reserved (Copy uses p.seed)');
        if (k === 'when' || k === 'dest') E(`param name "${k}" is reserved (an MCP kit's play() takes it as an option)`);
        if (!d || typeof d !== 'object') { E(`param "${k}" must be { min, max, def }`); continue; }
        for (const pk of Object.keys(d)) if (!PARAM_KEYS.includes(pk)) E(`param "${k}" has unknown field "${pk}"`);
        const fin = (v) => typeof v === 'number' && Number.isFinite(v);
        if (!fin(d.min) || !fin(d.max) || !fin(d.def)) { E(`param "${k}" needs numeric min, max and def`); continue; }
        if (!(d.min < d.max)) E(`param "${k}": min must be below max`);
        if (d.def < d.min || d.def > d.max) E(`param "${k}": def ${d.def} is outside [${d.min}, ${d.max}]`);
        if (d.step != null && !(fin(d.step) && d.step > 0)) E(`param "${k}": step must be a positive number`);
        if (d.unit != null && (typeof d.unit !== 'string' || d.unit.length > 6)) E(`param "${k}": unit must be a short string`);
        if (d.desc != null && (typeof d.desc !== 'string' || d.desc.length < 3 || d.desc.length > 100 || /[\r\n]/.test(d.desc))) E(`param "${k}": desc must be one line of 3 to 100 characters`);
        else if (d.desc != null && DASH.test(d.desc)) E(`param "${k}": desc has an en or em dash`);
        if (d.role != null) {
          if (!Object.hasOwn(ROLES, d.role)) E(`param "${k}": role "${d.role}" must be one of: ${Object.keys(ROLES).join(', ')} (src/vocabulary.js)`);
          else if (!(d.step === 1 && d.min === 0 && d.max === 1 && d.unit == null)) E(`param "${k}": role "${d.role}" is a switch, so the param needs min 0, max 1, step 1 and no unit`);
        }
        if (d.choices != null) {
          // a stepped parameter that names its values (a voice): value i is choices[i]
          const ok = Array.isArray(d.choices) && d.choices.length >= 2 && d.choices.every((c) => typeof c === 'string' && KEBAB.test(c)) &&
            new Set(d.choices).size === d.choices.length;
          if (!ok) E(`param "${k}": choices must be two or more unique kebab-case names`);
          else if (!(d.step === 1 && d.min === 0 && d.max === d.choices.length - 1 && d.unit == null && d.role == null)) E(`param "${k}": choices name the values 0 to ${d.choices.length - 1}, so the param needs min 0, max ${d.choices.length - 1}, step 1, no unit and no role`);
        }
      }
    }
  }
  if (typeof s.play !== 'function') { E('play must be a function: play(T, out, t, p) { ... }'); return errs; }
  let src;
  try { src = playSource(s.play); } catch (e) { E(e.message); return errs; }
  const params = splitFunction(src).params.split(',').map((x) => x.trim()).filter(Boolean);
  if (params.length !== 4 || params.some((x) => !/^[A-Za-z_$][\w$]*$/.test(x))) E('play must take exactly (T, out, t, p)');
  const code = stripCode(src);
  const tName = params[0] || 'T';
  if (/\bMath\s*\.\s*random\b/.test(code)) E('play uses Math.random: use T.rand() so renders are reproducible');
  for (const f of FORBIDDEN) if (has(code, f)) E(`play may not use "${f}": only T.*, its arguments and plain JS`);
  if (/\.\s*context\b/.test(code)) E('play may not reach the AudioContext (.context): build nodes through T.*');
  if (/\bcreate[A-Z]\w*\s*\(/.test(code) || /\bnew\s+[A-Z]\w*Node\b/.test(code)) E('play may not create audio nodes directly: use T.*');
  if (tName !== 'T') E('play\'s first argument must be named T');
  for (const u of usedHelpers(src, kit)) if (!(u in kit)) E(`T.${u} does not exist (helpers: ${Object.keys(kit).join(', ')})`);
  if (errs.length) return errs;
  // Run it: defaults, every min, every max, and random settings, each from t = 0.
  let fn;
  try { fn = isolatedPlay(src); } catch (e) { E(`play does not compile: ${e.message}`); return errs; }
  const defs = s.params || {};
  const sets = [
    ['defaults', paramsFor(s, null)],
    ['all min', Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.min]))],
    ['all max', Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.max]))],
    ...randomParamSets(s, 6, 0x5eed).map((p, i) => ['random #' + (i + 1) + ' ' + JSON.stringify(p), p]),
  ];
  for (const [label, p] of sets) {
    const ctx = new MockContext(48000);
    const out = ctx.createGain();
    out.connect(ctx.destination);
    try {
      kit.seed(1);
      fn(kit, out, 0, paramsFor(s, p));
    } catch (e) {
      E(`play throws at ${label}: ${e.message}`);
      break;
    }
    const sources = ctx.nodes.filter((n) => n.started != null);
    if (!sources.length) { E(`play schedules no sound at ${label}`); break; }
    if (sources.some((n) => n.stopped == null)) { E(`play leaves a source without stop() at ${label}`); break; }
    const sounding = ctx.lastStop - 0.05;
    if (sounding > s.dur + 1e-6) { E(`a voice is still sounding at ${sounding.toFixed(3)} s, past dur ${s.dur} s, at ${label}`); break; }
  }
  return errs;
}

/** Validate one theme against the sounds. Returns a list of error strings. */
export function validateTheme(entry, soundsById) {
  const { file, def: th } = entry;
  const errs = [];
  const E = (m) => errs.push(`${file}: ${m}`);
  if (!th || typeof th !== 'object') { E('must `export default` a theme object'); return errs; }
  for (const k of Object.keys(th)) if (!THEME_KEYS.includes(k)) E(`unknown field "${k}" (allowed: ${THEME_KEYS.join(', ')})`);
  if (typeof th.id !== 'string' || !KEBAB.test(th.id)) E(`id "${th.id}" must be kebab-case`);
  else if (file && file.startsWith('src/themes/') && file !== `src/themes/${th.id}.js`) E(`must live at src/themes/${th.id}.js`);
  if (typeof th.name !== 'string' || !th.name.trim()) E('name is required');
  if (typeof th.desc !== 'string' || th.desc.length < 10) E('desc must be at least 10 characters');
  if (!th.moments || typeof th.moments !== 'object' || !Object.keys(th.moments).length) { E('moments must map at least one moment'); return errs; }
  for (const [m, v] of Object.entries(th.moments)) {
    if (!KEBAB.test(m)) E(`moment "${m}" must be kebab-case`);
    else if (!Object.hasOwn(MOMENTS, m)) E(`moment "${m}" is not in the vocabulary (src/vocabulary.js: ${nearMoments(m)}); add it there once, for every theme`);
    if (!v || typeof v.sound !== 'string') { E(`moment "${m}" needs { sound: '<id>' }`); continue; }
    for (const k of Object.keys(v)) if (k !== 'sound' && k !== 'params') E(`moment "${m}" has unknown field "${k}"`);
    const s = soundsById.get(v.sound);
    if (!s) { E(`moment "${m}" uses unknown sound "${v.sound}"`); continue; }
    for (const [k, val] of Object.entries(v.params || {})) {
      const d = s.params[k];
      if (!d) E(`moment "${m}": sound "${s.id}" has no param "${k}"`);
      else if (typeof val !== 'number' || val < d.min || val > d.max) E(`moment "${m}": ${k} = ${val} is outside [${d.min}, ${d.max}]`);
    }
  }
  return errs;
}

/** Validate everything. Resolves to { errors, sounds, themes } with sounds in catalog order. */
export function validateAll(soundEntries, themeEntries, kit = T) {
  const errors = [];
  const ids = new Map();
  for (const e of soundEntries) {
    errors.push(...validateSound(e, kit));
    const id = e.def && e.def.id;
    if (typeof id === 'string') {
      if (ids.has(id)) errors.push(`${e.file}: duplicate id "${id}" (also in ${ids.get(id)})`);
      else ids.set(id, e.file);
    }
  }
  const order = (s) => CATEGORIES.indexOf(s.category);
  const sounds = soundEntries.map((e) => Object.assign({ file: e.file }, e.def))
    .filter((s) => s && typeof s.id === 'string')
    .sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id));
  const byId = new Map(sounds.map((s) => [s.id, s]));
  const tids = new Set();
  for (const e of themeEntries) {
    errors.push(...validateTheme(e, byId));
    const id = e.def && e.def.id;
    if (tids.has(id)) errors.push(`${e.file}: duplicate theme id "${id}"`);
    tids.add(id);
  }
  // the default theme leads (the gallery opens on the first one); the rest by id
  const themes = themeEntries.map((e) => Object.assign({ file: e.file }, e.def))
    .sort((a, b) => (b.id === DEFAULT_THEME) - (a.id === DEFAULT_THEME) || String(a.id).localeCompare(String(b.id)));
  return { errors, sounds, themes };
}

const optional = (s) => ({ ...(s.family != null ? { family: s.family } : {}), ...(s.moments != null ? { moments: s.moments } : {}) });
const meta = (s) => ({ id: s.id, name: s.name, category: s.category, tags: s.tags, desc: s.desc, dur: s.dur, ...optional(s), params: s.params });
const themeMeta = (th) => ({ id: th.id, name: th.name, desc: th.desc, moments: th.moments });

/** The catalog schema. 2 added version, copy, levels, vocabulary, family, moments, fingerprint and param desc and role. */
export const SCHEMA = 2;
/** The theme the gallery opens on (listed first; the others follow by id). */
export const DEFAULT_THEME = 'soft-ui';

/** The repository version (package.json), carried by the catalog. */
export function version() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
}

/**
 * A short hash of everything that decides how a sound renders: its dur, parameter ranges, play
 * source and the source of every helper its Copy carries (master included). The level gate stores
 * it next to each measurement, so the build embeds a level only while it still describes the sound.
 */
export function fingerprint(s, kit = T) {
  const params = Object.entries(s.params || {}).map(([k, d]) => [k, d.min, d.max, d.def, d.step || 0]);
  const { helpers } = copyHelpers(s, kit);
  const text = JSON.stringify([s.dur, params, playSource(s.play), helpers.map((h) => [h, kit[h].toString()])]);
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
}

export const LEVELS_FILE = 'catalog/levels.json';

/** catalog/levels.json as the level gate wrote it, or null. */
export function readLevels(root = ROOT) {
  try { return JSON.parse(fs.readFileSync(path.join(root, LEVELS_FILE), 'utf8')); } catch (e) { return null; }
}

export const LEVEL_FIELDS = ['peak', 'rms', 'worstPeak', 'worstRms', 'lowestPeak', 'pre', 'end'];

/** The measured levels of a sound when the report holds a current measurement of it, else null. */
export function levelsFor(s, report, kit = T) {
  const m = report && report.sounds && report.sounds[s.id];
  if (!m || m.fingerprint !== fingerprint(s, kit)) return null;
  const out = {};
  for (const k of LEVEL_FIELDS) if (Number.isFinite(m[k])) out[k] = m[k];
  return Number.isFinite(out.peak) ? out : null;
}

/**
 * catalog/manifest.json: every field, the play source, the helpers it needs, every helper, the Copy
 * contract, the shared vocabulary and, for sounds the level gate measured as they are now, their
 * measured levels.
 */
export function buildManifest(sounds, themes, kit = T, report = null) {
  const helpers = {};
  for (const name of Object.keys(kit).sort()) helpers[name] = { deps: helperDeps(name, kit), src: dedent(kit[name].toString()) };
  let measured = 0;
  const list = sounds.map((s) => {
    const { uses, helpers: need } = copyHelpers(s, kit);
    const lv = levelsFor(s, report, kit);
    if (lv) measured++;
    return { ...meta(s), file: s.file, play: playSource(s.play), uses, helpers: need, fingerprint: fingerprint(s, kit), ...(lv ? { levels: lv } : {}) };
  });
  return {
    name: 'Timbre',
    version: version(),
    schema: SCHEMA,
    count: sounds.length,
    categories: CATEGORIES.filter((c) => sounds.some((s) => s.category === c)),
    copy: {
      signature: 'fn(ac, opts, when, dest)',
      returns: 'the end time in AudioContext seconds',
      preroll: PREROLL,
      chains: 'one master chain per destination, kept on the context in ac.timbreChains',
      master: MASTER_CHAIN,
      sampleRate: SAMPLE_RATE,
    },
    levels: {
      source: LEVELS_FILE,
      measured,
      about: 'Measured by gates/check_levels.mjs in dBFS after the master chain on a warm chain. peak and rms: at the defaults (the worst peak and the mean RMS of 3 seeds). worstPeak, worstRms and lowestPeak: over all 12 renders (the defaults and 3 random parameter sets, 3 seeds each). pre: the highest peak before the limiter over all renders. end: where the default render falls below -60 dBFS, in seconds.',
    },
    vocabulary: {
      families: FAMILIES,
      roles: ROLES,
      moments: Object.fromEntries(Object.entries(MOMENTS).map(([k, m]) => [k, m.about])),
    },
    sounds: list,
    themes: themes.map((th) => ({ ...themeMeta(th), file: th.file })),
    helpers,
  };
}

/** catalog/index.json: search fields only. */
export function buildIndex(sounds, themes) {
  return {
    name: 'Timbre',
    version: version(),
    schema: SCHEMA,
    count: sounds.length,
    sounds: sounds.map((s) => ({ id: s.id, name: s.name, category: s.category, tags: s.tags, desc: s.desc, dur: s.dur, ...optional(s) })),
    themes: themes.map((th) => ({ id: th.id, name: th.name, desc: th.desc, moments: Object.keys(th.moments) })),
  };
}

/** A core module's text as plain script: import lines dropped, `export` keywords removed. */
export function moduleText(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8')
    .replace(/^import\s[^;]*;[ \t]*\r?\n/gm, '')
    .replace(/^export\s+(?=(async\s+)?function\b|const\b|let\b|class\b)/gm, '');
}

/** Keep inline script text from closing its own tag or opening an HTML comment. */
export const safeScript = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

/** The single page: core + sounds + themes + shell, inline. */
export function buildHtml(sounds, themes, kit = T) {
  const core = HELPER_MODULES.map((f) => moduleText('src/core/' + f)).join('\n');
  const soundJs = (s) => '{' + JSON.stringify(meta(s)).slice(1, -1) + ',"play":' + playSource(s.play) + '}';
  const script = [
    '(function () {',
    "'use strict';",
    '// ---- core helpers (src/core) ----',
    core,
    'const T = Object.freeze({ ' + Object.keys(kit).join(', ') + ' });',
    '// ---- sounds (src/sounds) ----',
    'const SOUNDS = [\n' + sounds.map(soundJs).join(',\n') + '\n];',
    '// ---- themes (src/themes) ----',
    'const THEMES = ' + JSON.stringify(themes.map(themeMeta), null, 1) + ';',
    '// ---- version (package.json) ----',
    'const VERSION = ' + JSON.stringify(version()) + ';',
    '// ---- runtime (src/core) ----',
    ['render.js', 'wav.js', 'copy.js'].map((f) => moduleText('src/core/' + f)).join('\n'),
    '// ---- gallery (src/shell/app.js) ----',
    fs.readFileSync(path.join(ROOT, 'src/shell/app.js'), 'utf8'),
    '})();',
  ].join('\n');
  const css = fs.readFileSync(path.join(ROOT, 'src/shell/style.css'), 'utf8');
  const tpl = fs.readFileSync(path.join(ROOT, 'src/shell/index.html'), 'utf8');
  if (!tpl.includes('/*@STYLE@*/') || !tpl.includes('/*@SCRIPT@*/')) throw new Error('src/shell/index.html must contain /*@STYLE@*/ and /*@SCRIPT@*/');
  return tpl.replace('/*@STYLE@*/', () => css.replace(/<\/style/gi, '<\\/style')).replace('/*@SCRIPT@*/', () => safeScript(script));
}

/** Load, validate and produce every output. Resolves to { errors, outputs: { path: text } }. */
export async function build() {
  const soundEntries = await loadDir(path.join(ROOT, 'src/sounds'));
  const themeEntries = await loadDir(path.join(ROOT, 'src/themes'));
  const { errors, sounds, themes } = validateAll(soundEntries, themeEntries, T);
  if (errors.length) return { errors, outputs: {}, sounds, themes };
  const outputs = {
    'catalog/manifest.json': JSON.stringify(buildManifest(sounds, themes, T, readLevels()), null, 2) + '\n',
    'catalog/index.json': JSON.stringify(buildIndex(sounds, themes), null, 2) + '\n',
    'dist/timbre.html': buildHtml(sounds, themes, T),
  };
  return { errors, outputs, sounds, themes };
}

/**
 * Write a file whole or not at all: a temporary file beside it, then a rename over it, so a reader
 * (the MCP server watching the catalog, a browser reloading the page) never sees half a file. On
 * Windows a rename can fail for a moment while another process holds the target open; it retries.
 */
export function writeAtomic(file, text) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  for (let i = 0; ; i++) {
    try { fs.renameSync(tmp, file); return; } catch (e) {
      if (i >= 20 || !['EPERM', 'EACCES', 'EBUSY'].includes(e.code)) { try { fs.rmSync(tmp, { force: true }); } catch (x) { /* gone */ } throw e; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
}

/**
 * node build.mjs --say "Access denied." [--voice announcer-female] [--babble]: the phonemes of a
 * line and how long it lasts in each voice at three rates (speed for babble), tail included, to set
 * a voice sound's dur (it must cover the slowest setting its parameters allow). The voices are
 * listed by display name: Announcer (Female) announcer-female, Announcer (Male) announcer (also
 * announcer-male), Deep Robot deep, Retro Computer retro, Small Robot small, Whisper whisper; with
 * --babble Cute cute, Gruff gruff, Robot Beep beep, Tiny Sprite sprite, Wise Elder elder.
 */
/** A voice table's ids in the order a person sees them: by display name. */
export function sayOrder(table) {
  return Object.keys(table).sort((a, b) => table[a].name.localeCompare(table[b].name, 'en'));
}

function say(args) {
  const opt = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
  const text = opt('say') || '';
  const babble = args.includes('--babble');
  const voices = babble ? T.babbleVoices() : T.speechVoices();
  const asked = opt('voice');
  const names = asked ? [!babble && Object.hasOwn(VOICE_ALIASES, asked) ? VOICE_ALIASES[asked] : asked] : sayOrder(voices);
  if (!babble) console.log('phonemes: ' + T.phonemize(text));
  for (const v of names) {
    if (!Object.hasOwn(voices, v)) { console.error(`unknown voice "${v}" (${sayOrder(voices).join(', ')}${babble ? '' : '; ' + Object.keys(VOICE_ALIASES).map((a) => a + ' is ' + VOICE_ALIASES[a]).join(', ')})`); process.exit(1); }
    const lens = [0.75, 1, 1.3].map((r) => (babble ? T.babble(null, 0, { text, voice: v, speed: r }) : T.speak(null, 0, { text, voice: v, rate: r })).toFixed(2));
    console.log(`  ${voices[v].name.padEnd(18)} ${v.padEnd(16)} ${lens.join(' s, ')} s at ${babble ? 'speed' : 'rate'} 0.75, 1, 1.3`);
  }
}

async function main() {
  if (process.argv.includes('--say')) { say(process.argv); return; }
  const check = process.argv.includes('--check');
  const { errors, outputs, sounds, themes } = await build();
  if (errors.length) {
    console.error(`build: ${errors.length} problem(s):`);
    for (const e of errors) console.error('  ' + e);
    process.exit(1);
  }
  let stale = 0;
  for (const [f, text] of Object.entries(outputs)) {
    const p = path.join(ROOT, f);
    const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (check) {
      if (old !== text) { console.error(`build --check: ${f} is out of date (run node build.mjs)`); stale++; }
      continue;
    }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (old !== text) writeAtomic(p, text);
    console.log(`  ${f}  ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB${old === text ? ' (unchanged)' : ''}`);
  }
  console.log(`build: ${sounds.length} sounds, ${themes.length} theme(s) valid${check ? (stale ? '' : '; outputs up to date') : ''}`);
  const report = readLevels();
  const current = report ? sounds.filter((s) => levelsFor(s, report)).length : 0;
  if (current < sounds.length) {
    console.log(`levels: ${current}/${sounds.length} sounds carry measured levels; ${report ? 'the rest changed since ' + LEVELS_FILE + ' was written, or were never measured' : LEVELS_FILE + ' is missing'} (run node gates/check_levels.mjs, then node build.mjs)`);
  }
  if (stale) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
