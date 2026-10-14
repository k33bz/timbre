// Speech for the speak tool, from the catalog alone. The manifest carries every helper's source, so
// the text front end (phonemize), the voice tables and the engines are compiled from that text in an
// isolated context: the same code the gallery runs. lib/copy.js (buildSpeechCopy) then writes the
// function the gallery's Speak rack writes, and test/speak.test.js holds the two byte for byte.
import vm from 'node:vm';
import { ToolError } from './errors.js';
import { dedent, VOICE_ALIASES } from './copy.js';

/** The helpers the speak tool calls; a catalog built before the voices has none of them. */
export const SPEECH_HELPERS = ['phonemize', 'speechVoices', 'babbleVoices', 'speak', 'babble', 'utter', 'chatter'];

/** `names` plus everything they depend on, dependencies first (src/core/copy.js, helperClosure). */
export function closure(names, helperSrc) {
  const out = [];
  const busy = new Set();
  const visit = (n) => {
    if (out.includes(n) || busy.has(n) || !helperSrc[n]) return;
    busy.add(n);
    for (const d of helperSrc[n].deps || []) visit(d);
    busy.delete(n);
    out.push(n);
  };
  names.forEach(visit);
  return out;
}

/** A voice table's ids in the order a person sees them: by display name. */
export function voiceIds(table) {
  return Object.keys(table).sort((a, b) => String(table[a].name).localeCompare(String(table[b].name), 'en'));
}

/** The speech and babble voices as { id: display name }, each in display-name order; null when the
 *  catalog has no speech engine. */
export function voiceListing(helperSrc) {
  let rt;
  try { rt = speechRuntime(helperSrc); } catch (e) { return null; }
  const list = (t) => Object.fromEntries(voiceIds(t).map((id) => [id, t[id].name]));
  return { speech: list(rt.speechVoices()), babble: list(rt.babbleVoices()), aliases: { ...VOICE_ALIASES } };
}

const cache = new WeakMap();

/**
 * The speech functions compiled from a catalog's helpers, cached per helper table:
 * { phonemize, speechVoices, babbleVoices, speak, babble }. Throws a ToolError when the catalog
 * predates the voices.
 */
export function speechRuntime(helperSrc) {
  if (cache.has(helperSrc)) return cache.get(helperSrc);
  const missing = SPEECH_HELPERS.filter((h) => !helperSrc[h] || typeof helperSrc[h].src !== 'string');
  if (missing.length) {
    throw new ToolError(`This catalog has no speech engine (missing ${missing.join(', ')}). Rebuild it with \`node build.mjs\` in a Timbre checkout that has voices.`, { code: 'speech_unavailable' });
  }
  const src = closure(SPEECH_HELPERS, helperSrc).map((h) => dedent(helperSrc[h].src)).join('\n');
  const ctx = vm.createContext({});
  const rt = vm.runInContext(`(function () {\n${src}\nreturn { phonemize, speechVoices, babbleVoices, speak, babble };\n})()`, ctx, { timeout: 2000 });
  cache.set(helperSrc, rt);
  return rt;
}
