// Run generated code (a Copy function, a kit) against the recording audio mock, strictly: it throws
// where the real Web Audio API would.
import vm from 'node:vm';
import { MockContext } from '../lib/mockaudio.js';
import { camel } from '../lib/copy.js';

/** Names of the functions a Copy text defines directly inside its outer function. */
export function definedFunctions(text) {
  return [...text.matchAll(/^ {2}function ([A-Za-z_$][\w$]*)\(/gm)].map((m) => m[1]);
}

/**
 * Evaluate a Copy text in an empty context and call it twice on one strict mock context.
 * Returns { fname, end, limiters, limitersAfterSecondCall, defined, ac }.
 */
export function runCopy(text, sound) {
  const fname = camel(sound.id);
  const ctx = vm.createContext({});
  vm.runInContext(text, ctx, { filename: fname + '.js' });
  const fn = ctx[fname];
  if (typeof fn !== 'function') throw new Error(`the code did not define ${fname}()`);
  const ac = new MockContext(48000, { strict: true });
  const end = fn(ac);
  const limiters = () => ac.nodes.filter((n) => n.kind === 'compressor').length;
  const first = limiters();
  const max = Object.fromEntries(Object.entries(sound.params || {}).map(([k, d]) => [k, d.max]));
  fn(ac, max, 2);
  fn(ac, null, 3, undefined);
  return { fname, end, limiters: first, limitersAfterSecondCall: limiters(), defined: definedFunctions(text), ac };
}
