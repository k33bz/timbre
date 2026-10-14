// build_kit: several sounds, one module.
//
// resolveKit() turns a request (moments, optionally a theme and a mood) into a list of choices: which
// sound plays for which moment, with which parameter values, and why. buildKitModule() writes the
// choices as ONE JavaScript module:
//
//   * every helper any chosen sound needs appears once (the union of the sounds' helper lists, in
//     dependency order), not once per sound as in a pile of Copy functions;
//   * every sound's recipe appears once, even when two moments share it (toggle-on and toggle-off
//     are one recipe with different parameters);
//   * one master chain per destination, shared by all moments, kept on the context in the same
//     `ac.timbreChains` slot a pasted Copy function uses, built with the same 0.2 s warm-up rule;
//   * the AudioContext is created on the first play() or prime(), never at load.
//
// The recipes, helpers and master chain are the catalog's own text, byte for byte, as in Copy.
import { ToolError } from './errors.js';
import { activeMoods, themeFromText, pickForMoment, hintsFor, specFor } from './suggest.js';
import { dedent, playSource, splitFunction, camel, paramsFor, fmtNum, isIdentifier, PREROLL, VOICE_ALIASES } from './copy.js';

export const MOMENT_NAME = /^[a-z0-9][a-z0-9_-]{0,39}$/;
/** Names the generated module defines itself; no helper may use them. */
const RESERVED = ['play', 'prime', 'has', 'moments', 'setMuted', 'getContext'];
/** Words a global name may not be (it is declared with const in the script form). */
const JS_WORDS = new Set(('break case catch class const continue debugger default delete do else enum export extends false finally for ' +
  'function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await ' +
  'async of implements interface package private protected public undefined NaN Infinity eval arguments globalThis window self document').split(' '));
/** Option keys play() reads, so a sound parameter may not use them. */
const OPT_KEYS = ['when', 'dest', 'seed'];

/** Check parameter overrides against a sound; returns { values, clamped } or throws a ToolError. */
export function checkParams(sound, over, where) {
  const values = {};
  const clamped = [];
  if (over == null) return { values, clamped };
  if (typeof over !== 'object' || Array.isArray(over)) throw new ToolError(`${where}: params must be an object of parameter values.`, { code: 'bad_params' });
  for (const [k, v] of Object.entries(over)) {
    const d = Object.hasOwn(sound.params, k) ? sound.params[k] : null;
    if (k === 'seed') {
      throw new ToolError(`${where}: the seed is not a parameter; pass it as the seed argument (get_copy) or in play(moment, { seed }).`, { code: 'unknown_param', data: { sound: sound.id, valid: Object.keys(sound.params) } });
    }
    if (!d) {
      throw new ToolError(`${where}: ${sound.id} has no parameter "${k}". Its parameters: ${Object.keys(sound.params).join(', ') || '(none)'}.`, { code: 'unknown_param', data: { sound: sound.id, valid: Object.keys(sound.params) } });
    }
    // a parameter with named values (a voice) takes its name, or a voice's other name, as well as its number
    const named = typeof v === 'string' && Array.isArray(d.choices) ? (d.choices.includes(v) ? v : Object.hasOwn(VOICE_ALIASES, v) ? VOICE_ALIASES[v] : null) : null;
    const n = named != null && d.choices.includes(named) ? d.choices.indexOf(named) : Number(v);
    if (v === null || v === '' || typeof v === 'boolean' || !Number.isFinite(n)) {
      const names = Array.isArray(d.choices) ? ` or one of ${d.choices.map((c) => JSON.stringify(c)).join(', ')}` : '';
      throw new ToolError(`${where}: parameter "${k}" of ${sound.id} must be a number between ${d.min} and ${d.max}${d.unit ? ' ' + d.unit : ''}${names}, got ${JSON.stringify(v)}.`, { code: 'bad_param_value' });
    }
    const c = Math.min(d.max, Math.max(d.min, n));
    if (c !== n) clamped.push({ param: k, requested: n, used: c, range: [d.min, d.max] });
    values[k] = c;
  }
  return { values, clamped };
}

/**
 * Resolve a request into choices.
 * moments: strings or { moment, sound?, params? }; theme: a theme id; mood: free text.
 */
export function resolveKit(catalog, { moments, theme, mood, filters = {} }) {
  if (catalog.mode !== 'manifest') throw new ToolError('This catalog has no manifest.json, so kits cannot be built. Run `node build.mjs` in the Timbre repository.', { code: 'copy_unavailable' });
  const moods = activeMoods(mood);
  let themeObj = null;
  let themeNote = null;
  if (theme) {
    themeObj = catalog.theme(theme);
    if (!themeObj) throw new ToolError(`Unknown theme "${theme}". Themes: ${catalog.themes.map((t) => t.id).join(', ') || '(none)'}.`, { code: 'not_found', data: { themes: catalog.themes.map((t) => t.id) } });
  } else if (mood) {
    themeObj = themeFromText(catalog, mood);
    if (themeObj) themeNote = `mood "${mood}" names the ${themeObj.name} theme, so its sounds were used where it covers a moment`;
  }
  // normalize the list of requested moments
  let items = Array.isArray(moments) ? moments.slice() : [];
  if (!items.length) {
    if (!themeObj) throw new ToolError('Give at least one moment (for example ["click", "success", "error"]) or a theme to take its moments from.', { code: 'no_moments' });
    items = Object.keys(themeObj.moments);
  }
  const seen = new Set();
  const warnings = [];
  const wanted = [];
  for (const it of items) {
    const obj = typeof it === 'string' ? { moment: it } : it;
    if (!obj || typeof obj !== 'object') throw new ToolError(`Each moment must be a name or an object { moment, sound?, params? }, got ${JSON.stringify(it)}.`, { code: 'bad_moment' });
    const raw = obj.moment != null ? obj.moment : obj.name;
    const name = String(raw == null ? '' : raw).trim().toLowerCase().replace(/\s+/g, '-');
    if (!MOMENT_NAME.test(name)) throw new ToolError(`Moment name ${JSON.stringify(raw)} is not usable. Use 1 to 40 letters, digits, "-" or "_" (for example "click" or "level-up").`, { code: 'bad_moment' });
    if (seen.has(name)) { warnings.push(`moment "${name}" was listed twice; the first entry is used`); continue; }
    seen.add(name);
    wanted.push({ name, sound: obj.sound, params: obj.params });
  }
  const used = new Set();
  const choices = [];
  const unresolved = [];
  for (const w of wanted) {
    const spec = specFor(w.name);
    let sound = null;
    let source = null;
    let reason = '';
    let fit = 'strong';
    let base = {};
    let alternatives = [];
    if (w.sound != null) {
      sound = catalog.get(String(w.sound));
      if (!sound) {
        const near = catalog.sounds.filter((s) => s.id.includes(String(w.sound)) || String(w.sound).includes(s.id)).slice(0, 5).map((s) => s.id);
        throw new ToolError(`Moment "${w.name}": no sound with id "${w.sound}".${near.length ? ' Did you mean ' + near.join(', ') + '?' : ' Use search_sounds to find ids.'}`, { code: 'not_found', data: { near } });
      }
      source = 'explicit';
      reason = 'chosen by you';
    } else if (themeObj && Object.hasOwn(themeObj.moments, w.name)) {
      const tm = themeObj.moments[w.name];
      sound = catalog.get(tm.sound);
      if (sound) { source = 'theme'; reason = `the ${themeObj.name} theme's sound for ${w.name}`; base = tm.params || {}; }
      else warnings.push(`theme ${themeObj.id} maps ${w.name} to ${tm.sound}, which is not in the catalog; picked another`);
    }
    if (!sound) {
      const pick = pickForMoment(catalog, w.name, { theme: themeObj, moods, used, filters });
      if (!pick) {
        unresolved.push({ moment: w.name, why: `no sound in the catalog matches "${w.name}"${Object.keys(filters).length ? ' under these filters' : ''}; name one with { moment, sound }, or use search_sounds` });
        continue;
      }
      sound = pick.row.sound;
      source = 'auto';
      fit = pick.row.strong ? 'strong' : 'loose';
      reason = pick.row.reasons.slice(0, 3).join('; ');
      alternatives = pick.alternatives.map((r) => r.sound.id);
      base = hintsFor(pick.spec, sound, moods);
      if (!pick.row.strong) warnings.push(`moment "${w.name}": only a loose match (${sound.id}); consider choosing explicitly`);
      if (themeObj && !Object.hasOwn(themeObj.moments, w.name)) warnings.push(`theme ${themeObj.id} has no "${w.name}" moment; picked ${sound.id} from the catalog`);
    } else if (source === 'explicit') {
      base = hintsFor(spec, sound, moods);
    }
    if (!sound.copyable) throw new ToolError(`Sound ${sound.id} cannot be copied: ${sound.copyIssue || 'the catalog has no code for it'}.`, { code: 'copy_unavailable' });
    for (const k of OPT_KEYS) {
      if (Object.hasOwn(sound.params, k)) throw new ToolError(`Sound ${sound.id} has a parameter named "${k}", which a kit's play() reserves for its own options. Pick another sound.`, { code: 'reserved_param' });
    }
    const checked = checkParams(sound, w.params, `moment "${w.name}"`);
    for (const c of checked.clamped) warnings.push(`moment "${w.name}": ${c.param} ${c.requested} is outside ${c.range[0]}..${c.range[1]}; used ${c.used}`);
    const values = paramsFor(sound, { ...base, ...checked.values });
    used.add(sound.id);
    choices.push({ moment: w.name, sound, source, fit, reason, params: values, overrides: { ...base, ...checked.values }, alternatives });
  }
  if (themeNote) warnings.unshift(themeNote);
  return { choices, unresolved, warnings, theme: themeObj, moods };
}

/**
 * Write the module for resolved choices.
 * opts: { format: 'esm' | 'script', globalName, vary }
 */
export function buildKitModule(catalog, choices, { format = 'esm', globalName = 'timbreKit', vary = false } = {}) {
  if (!choices.length) throw new ToolError('Nothing to build: no moment resolved to a sound.', { code: 'no_moments' });
  if (format !== 'esm' && format !== 'script') throw new ToolError('format must be "esm" or "script".', { code: 'bad_format' });
  if (format === 'script' && (!isIdentifier(globalName) || globalName.length > 40 || JS_WORDS.has(globalName))) throw new ToolError(`globalName "${globalName}" is not a valid JavaScript identifier.`, { code: 'bad_global_name' });
  const helperSrc = catalog.helpers;
  // sounds, in first-use order, once each
  const sounds = [];
  for (const c of choices) if (!sounds.includes(c.sound)) sounds.push(c.sound);
  // helpers: the union of each sound's list, first-seen order keeps every dependency before its user
  const helpers = [];
  const uses = [];
  for (const s of sounds) {
    for (const h of s.helpers) if (!helpers.includes(h)) helpers.push(h);
    for (const u of s.uses) if (!uses.includes(u)) uses.push(u);
  }
  for (const h of helpers) {
    if (RESERVED.includes(h) || /^kit[A-Z]/.test(h) || /^sfx[A-Z]/.test(h)) {
      throw new ToolError(`The helper "${h}" collides with a name the kit module defines. Rename it in the Timbre sources.`, { code: 'name_collision' });
    }
    if (!helperSrc[h] || typeof helperSrc[h].src !== 'string') throw new ToolError(`helper "${h}" is not in the catalog`, { code: 'catalog_invalid' });
  }
  const fnName = (s) => 'sfx' + camel(s.id).replace(/^./, (ch) => ch.toUpperCase());
  const names = new Set();
  for (const s of sounds) {
    const n = fnName(s);
    if (!isIdentifier(n) || names.has(n)) throw new ToolError(`Sound id "${s.id}" does not make a unique function name.`, { code: 'name_collision' });
    names.add(n);
  }
  const seeded = helpers.includes('rand');
  const lines = [];
  const L = (s = '') => lines.push(s);
  const momentList = choices.map((c) => c.moment);
  L(`// Timbre sound kit: ${choices.length} moment${choices.length === 1 ? '' : 's'}, ${sounds.length} sound${sounds.length === 1 ? '' : 's'}. Synthesized with WebAudio, no files, no dependencies.`);
  L(`// Moments: ${momentList.join(', ')}`);
  if (format === 'esm') {
    L(`// Usage: import { play } from './sounds.js'; button.addEventListener('click', () => play('click'));`);
  } else {
    L(`// Usage: <script src="sounds.js"></script> then ${globalName}.play('click') from an event handler.`);
  }
  L('//   play(moment, opts) plays the sound for a moment and returns its end time (AudioContext seconds),');
  L('//   or null when nothing played (unknown moment, muted, no AudioContext). opts overrides parameters');
  L('//   (clamped to their range), plus: seed, when (earliest start in seconds), dest (node to end in).');
  L('//   prime() creates the context and warms the limiter early: call it from the first user gesture.');
  L(`//   The AudioContext is created on the first play() or prime(). All moments share one master chain.`);
  if (format === 'script') { L(`const ${globalName} = (function () {`); L("'use strict';"); }
  L('');
  L('// ---- helpers, each once ----');
  for (const h of helpers) L(dedent(helperSrc[h].src));
  L('');
  L('// ---- sounds, each once ----');
  for (const s of sounds) {
    const { params, body } = splitFunction(playSource(s.play));
    L(`// ${s.name} (${s.id}), ${fmtNum(s.dur)} s`);
    L('function ' + fnName(s) + '(' + params + ') {' + body.replace(/\s+$/, '') + '\n}');
    L('');
  }
  L('// ---- moments ----');
  L(`const kitT = { ${uses.join(', ')} };`);
  L('const kitMoments = {');
  for (const c of choices) {
    const pairs = Object.entries(c.params).map(([k, v]) => `${k}: ${fmtNum(v)}`);
    if (c.sound.helpers.includes('rand')) pairs.push('seed: 1');
    const ranges = Object.entries(c.sound.params).map(([k, d]) => `${k}: [${fmtNum(d.min)}, ${fmtNum(d.max)}]`);
    L(`  // ${c.moment}: ${c.sound.name} (${c.sound.id})`);
    L(`  ${JSON.stringify(c.moment)}: { run: ${fnName(c.sound)}, dur: ${fmtNum(c.sound.dur)}, seeded: ${c.sound.helpers.includes('rand')}, params: { ${pairs.join(', ')} }, ranges: { ${ranges.join(', ')} } },`);
  }
  L('};');
  L(`const kitVary = ${vary ? 'true' : 'false'};   // true: a new noise seed on every play, unless opts.seed is given`);
  L('let kitCtx = null;');
  L('let kitMuted = false;');
  L('');
  L('function kitContext() {');
  L('  if (kitCtx) return kitCtx;');
  L("  const AC = typeof globalThis !== 'undefined' ? globalThis.AudioContext || globalThis.webkitAudioContext : undefined;");
  L('  if (!AC) return null;');
  L('  try { kitCtx = new AC(); } catch (e) { return null; }');
  L('  return kitCtx;');
  L('}');
  L('');
  L('// One master chain per destination, kept on the context (the slot a pasted Timbre Copy shares).');
  L(`// A new chain needs ${PREROLL} s to warm up: no sound starts on it before then.`);
  L('function kitChain(ac, dest) {');
  L('  const chains = ac.timbreChains || (ac.timbreChains = new Map());');
  L('  const to = dest || ac.destination;');
  L(`  if (!chains.has(to)) chains.set(to, { out: master(ac, to), ready: ac.currentTime + ${PREROLL} });`);
  L('  return chains.get(to);');
  L('}');
  L('');
  L('function prime() {');
  L('  const ac = kitContext();');
  L('  if (!ac) return false;');
  L("  if (ac.state === 'suspended' && ac.resume) ac.resume();");
  L('  kitChain(ac);');
  L('  return true;');
  L('}');
  L('');
  L('function getContext() {');
  L('  return kitCtx;');
  L('}');
  L('');
  L('function has(moment) {');
  L('  return Object.prototype.hasOwnProperty.call(kitMoments, moment);');
  L('}');
  L('');
  L('function setMuted(on) {');
  L('  kitMuted = !!on;');
  L('}');
  L('');
  L('function play(moment, opts) {');
  L('  if (kitMuted || !has(moment)) return null;');
  L('  const m = kitMoments[moment];');
  L('  const ac = kitContext();');
  L('  if (!ac) return null;');
  L("  if (ac.state === 'suspended' && ac.resume) ac.resume();");
  L('  const o = opts || {};');
  L('  const p = Object.assign({}, m.params, o);');
  L('  for (const k of Object.keys(m.ranges)) {');
  L('    const r = m.ranges[k];');
  L('    const v = Number(p[k]);');
  L('    p[k] = Math.min(r[1], Math.max(r[0], Number.isFinite(v) ? v : m.params[k]));');
  L('  }');
  L('  const chain = kitChain(ac, o.dest);');
  L('  const t = Math.max(o.when == null ? 0 : o.when, ac.currentTime + 0.02, chain.ready);');
  if (seeded) {
    L('  if (m.seeded) seed(kitVary && o.seed == null ? (Math.random() * 4294967296) >>> 0 : p.seed);');
  }
  L('  m.run(kitT, chain.out, t, p);');
  L('  return t + m.dur;');
  L('}');
  L('');
  L('const moments = Object.keys(kitMoments);');
  if (format === 'esm') {
    L('');
    L('export { play, prime, has, moments, setMuted, getContext };');
    L('export default { play, prime, has, moments, setMuted, getContext };');
  } else {
    L('');
    L('return { play, prime, has, moments, setMuted, getContext };');
    L('})();');
  }
  // The script form keeps the recipes and helpers unindented: re-indenting could change a multi-line
  // string inside one of them.
  const text = lines.join('\n') + '\n';
  return { code: text, sounds: sounds.map((s) => s.id), helpers, functionNames: sounds.map(fnName), globalName: format === 'script' ? globalName : null };
}
