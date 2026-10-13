#!/usr/bin/env node
// Timbre build. Zero dependencies, Node 22.
//   node build.mjs          validate every sound and theme, write catalog/ and dist/timbre.html
//   node build.mjs --check  the same validation, then fail if any written file would change
//
// Validation is the contract in docs/DESIGN.md and docs/ADDING_SOUNDS.md made executable:
//   * fields: exactly id, name, category, tags, desc, dur, params, play; ids unique, kebab-case,
//     prefixed with the category, and the file lives at src/sounds/<category>/<id>.js
//   * params: each { min, max, def } (plus optional unit, step) with min < max and def in range
//   * play uses only T.*: it is compiled in an isolated VM context (no window, no document, and
//     Math.random throws) and run against a mock WebAudio graph at the defaults, at every min, at
//     every max and at random settings. That catches globals, unknown helpers, invalid automation
//     (exponential ramps to zero, NaN times) and voices still sounding after the declared dur.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { T, HELPER_MODULES } from './src/core/t.js';
import { stripCode, usedHelpers, playSource, splitFunction, copyHelpers, helperDeps, dedent } from './src/core/copy.js';
import { paramsFor } from './src/core/render.js';
import { MockContext } from './gates/lib/mockaudio.mjs';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const CATEGORIES = ['ui', 'notify', 'game', 'cards', 'magic', 'scifi', 'ambience', 'music'];
const SOUND_KEYS = ['id', 'name', 'category', 'tags', 'desc', 'dur', 'params', 'play'];
const PARAM_KEYS = ['min', 'max', 'def', 'unit', 'step'];
const THEME_KEYS = ['id', 'name', 'desc', 'moments'];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PARAM_NAME = /^[a-z][a-zA-Z0-9]*$/;
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

/** Validate one sound. Returns a list of error strings (empty = valid). */
export function validateSound(entry, kit = T) {
  const { file, def: s } = entry;
  const errs = [];
  const E = (m) => errs.push(`${file}: ${m}`);
  if (!s || typeof s !== 'object') { E('must `export default` a sound object'); return errs; }
  for (const k of Object.keys(s)) if (!SOUND_KEYS.includes(k)) E(`unknown field "${k}" (allowed: ${SOUND_KEYS.join(', ')})`);
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
  if (s.tags != null) {
    if (!Array.isArray(s.tags) || !s.tags.length) E('tags must be a non-empty array');
    else {
      for (const tg of s.tags) if (typeof tg !== 'string' || !KEBAB.test(tg)) E(`tag "${tg}" must be a lowercase kebab-case string`);
      if (new Set(s.tags).size !== s.tags.length) E('tags must be unique');
    }
  }
  if (s.dur != null && !(typeof s.dur === 'number' && s.dur > 0 && s.dur <= 10)) E('dur must be a number of seconds in (0, 10]');
  if (s.params != null) {
    if (typeof s.params !== 'object' || Array.isArray(s.params)) E('params must be an object');
    else {
      for (const [k, d] of Object.entries(s.params)) {
        if (!PARAM_NAME.test(k)) E(`param "${k}" must be a camelCase identifier`);
        if (k === 'seed') E('param name "seed" is reserved (Copy uses p.seed)');
        if (!d || typeof d !== 'object') { E(`param "${k}" must be { min, max, def }`); continue; }
        for (const pk of Object.keys(d)) if (!PARAM_KEYS.includes(pk)) E(`param "${k}" has unknown field "${pk}"`);
        const fin = (v) => typeof v === 'number' && Number.isFinite(v);
        if (!fin(d.min) || !fin(d.max) || !fin(d.def)) { E(`param "${k}" needs numeric min, max and def`); continue; }
        if (!(d.min < d.max)) E(`param "${k}": min must be below max`);
        if (d.def < d.min || d.def > d.max) E(`param "${k}": def ${d.def} is outside [${d.min}, ${d.max}]`);
        if (d.step != null && !(fin(d.step) && d.step > 0)) E(`param "${k}": step must be a positive number`);
        if (d.unit != null && (typeof d.unit !== 'string' || d.unit.length > 6)) E(`param "${k}": unit must be a short string`);
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
  const themes = themeEntries.map((e) => Object.assign({ file: e.file }, e.def)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { errors, sounds, themes };
}

const meta = (s) => ({ id: s.id, name: s.name, category: s.category, tags: s.tags, desc: s.desc, dur: s.dur, params: s.params });
const themeMeta = (th) => ({ id: th.id, name: th.name, desc: th.desc, moments: th.moments });

/** catalog/manifest.json: every field, the play source, the helpers it needs, and every helper. */
export function buildManifest(sounds, themes, kit = T) {
  const helpers = {};
  for (const name of Object.keys(kit).sort()) helpers[name] = { deps: helperDeps(name, kit), src: dedent(kit[name].toString()) };
  return {
    name: 'Timbre',
    schema: 1,
    count: sounds.length,
    categories: CATEGORIES.filter((c) => sounds.some((s) => s.category === c)),
    sounds: sounds.map((s) => {
      const { uses, helpers: need } = copyHelpers(s, kit);
      return { ...meta(s), file: s.file, play: playSource(s.play), uses, helpers: need };
    }),
    themes: themes.map((th) => ({ ...themeMeta(th), file: th.file })),
    helpers,
  };
}

/** catalog/index.json: search fields only. */
export function buildIndex(sounds, themes) {
  return {
    name: 'Timbre',
    schema: 1,
    count: sounds.length,
    sounds: sounds.map((s) => ({ id: s.id, name: s.name, category: s.category, tags: s.tags, desc: s.desc, dur: s.dur })),
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
    'catalog/manifest.json': JSON.stringify(buildManifest(sounds, themes, T), null, 2) + '\n',
    'catalog/index.json': JSON.stringify(buildIndex(sounds, themes), null, 2) + '\n',
    'dist/timbre.html': buildHtml(sounds, themes, T),
  };
  return { errors, outputs, sounds, themes };
}

async function main() {
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
    if (old !== text) fs.writeFileSync(p, text);
    console.log(`  ${f}  ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB${old === text ? ' (unchanged)' : ''}`);
  }
  console.log(`build: ${sounds.length} sounds, ${themes.length} theme(s) valid${check ? (stale ? '' : '; outputs up to date') : ''}`);
  if (stale) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
