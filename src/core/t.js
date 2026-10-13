// T: the helper kit every sound's play(T, out, t, p) receives. It is the only thing a sound may
// call. HELPER_MODULES lists the files the helpers live in, in bundle order; build.mjs inlines
// those files into dist/timbre.html and rebuilds T there from the same names.
import * as random from './random.js';
import * as envelope from './envelope.js';
import * as voices from './voices.js';
import * as effects from './effects.js';
import * as mastering from './master.js';
import * as music from './music.js';

export const HELPER_MODULES = ['random.js', 'envelope.js', 'voices.js', 'effects.js', 'master.js', 'music.js'];

export const T = Object.freeze({ ...random, ...envelope, ...voices, ...effects, ...mastering, ...music });
