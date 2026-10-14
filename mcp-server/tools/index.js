// The Timbre MCP tools. Each entry: { name, description, inputSchema, handler, codeKey? }.
// Handlers receive (args, ctx) with ctx = { catalog, logger } and return a plain object; the server
// serializes it. A handler throws ToolError for a failure the agent can act on. A tool with codeKey
// returns that field as a second text block (raw code reads better than JSON-escaped code).
import { ToolError } from '../lib/errors.js';
import { CATEGORIES } from '../lib/catalog.js';
import { buildCopy, camel, paramsFor, PREROLL, buildSpeechCopy, SPEAK_PARAMS, VOICE_ALIASES } from '../lib/copy.js';
import { speechRuntime, closure as speechClosure, voiceIds, voiceListing } from '../lib/speech.js';
import { BANDS, BAND_NAMES } from '../lib/levels.js';
import { search, FilterError } from '../lib/search.js';
import { suggest, indexFor } from '../lib/suggest.js';
import { MOMENTS, MOODS, FAMILIES, ROLES } from '../lib/moments.js';
import { resolveKit, buildKitModule, checkParams } from '../lib/kit.js';
import { SERVER_NAME, SERVER_VERSION } from '../lib/meta.js';

const CATEGORY_LABELS = { ui: 'UI', notify: 'Notify', data: 'Data', ai: 'AI', game: 'Game', battle: 'Battle', cards: 'Cards', duel: 'Ink Duel', magic: 'Magic', fx: 'FX', scifi: 'Sci-fi', ambience: 'Ambience', music: 'Music', voice: 'Voice' };

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// ------------------------------------------------------------------ shared pieces

/** The catalog, or a ToolError saying why there is none. */
function need(ctx) {
  const c = ctx.catalog;
  if (c.error) {
    throw new ToolError(c.error.message, { code: c.error.code || 'catalog_unavailable', data: { catalog: c.dir } });
  }
  return c;
}

/** Require a copyable catalog (a manifest with code). */
function needCode(ctx) {
  const c = need(ctx);
  if (c.mode !== 'manifest') throw new ToolError('This catalog has no manifest.json, so sound code is unavailable. Run `node build.mjs` in the Timbre repository.', { code: 'copy_unavailable' });
  return c;
}

function levelsOf(catalog, s) {
  const lv = catalog.levelOf(s);
  if (!lv) return null;
  return { band: lv.band, peak: lv.peak, rms: lv.rms, source: lv.source };
}

/** The family and moments a sound declares, when it does. */
const declared = (s) => ({ ...(s.family ? { family: s.family } : {}), ...(s.moments && s.moments.length ? { moments: s.moments } : {}) });

/** A sound in search results and lists. */
function summary(catalog, s, extra = {}) {
  const lv = levelsOf(catalog, s);
  return {
    id: s.id, name: s.name, category: s.category, ...declared(s), dur: s.dur, tags: s.tags, desc: s.desc,
    params: Object.keys(s.params),
    ...(lv ? { loudness: { band: lv.band, peak: lv.peak, source: lv.source } } : {}),
    ...extra,
  };
}

function getSound(catalog, id) {
  const s = catalog.get(id);
  if (s) return s;
  const index = indexFor(catalog);
  const near = search(catalog, index, { query: String(id).replace(/-/g, ' '), limit: 5 }).rows.map((r) => r.d.s.id);
  throw new ToolError(`No sound with id "${id}".${near.length ? ' Closest: ' + near.join(', ') + '.' : ''} Use search_sounds to list ids.`, { code: 'not_found', data: { near } });
}

function filtersOf(args) {
  const f = {};
  if (args.category != null) f.category = args.category;
  if (args.family != null) f.family = args.family;
  if (args.max_duration != null) f.max_duration = args.max_duration;
  if (args.min_duration != null) f.min_duration = args.min_duration;
  if (args.loudness != null) f.loudness = args.loudness;
  if (args.tags != null) f.tags = args.tags;
  return f;
}

/** Run something that may throw a FilterError and turn that into a ToolError. */
function withFilters(fn) {
  try { return fn(); } catch (e) {
    if (e instanceof FilterError) throw new ToolError(e.message, { code: e.code });
    throw e;
  }
}

function usageLine(s, p) {
  const f = camel(s.id);
  const first = Object.keys(p)[0];
  const ex = first ? `${f}(ac, { ${first}: ${p[first]} })` : `${f}(ac)`;
  return `const ac = new AudioContext(); ${ex};  // call from a click or key handler so the browser lets it start`;
}

function paramInfo(s) {
  return s.paramList.map((p) => ({
    name: p.name, min: p.min, max: p.max, default: p.def,
    ...(p.unit ? { unit: p.unit } : {}), ...(p.step ? { step: p.step } : {}), control: p.kind,
    ...(p.choices ? { choices: p.choices } : {}),
    ...(p.desc ? { desc: p.desc } : {}),
    ...(p.role ? { role: p.role, ...(ROLES[p.role] ? { roleMeans: ROLES[p.role] } : {}) } : {}),
  }));
}

// No enum: a catalog can grow a category this server has not heard of, and the filter checks the
// value against the categories the catalog really has, naming them in its error.
const CATEGORY_SCHEMA = {
  anyOf: [
    { type: 'string' },
    { type: 'array', items: { type: 'string' }, minItems: 1 },
  ],
  description: `One category or a list. Known: ${CATEGORIES.join(', ')} (info shows which have sounds).`,
};
const FAMILY_SCHEMA = {
  anyOf: [
    { type: 'string' },
    { type: 'array', items: { type: 'string' }, minItems: 1 },
  ],
  description: `One timbre family or a list: ${Object.keys(FAMILIES).join(', ')} (info describes each). Sounds that declare no family never match.`,
};
const LOUDNESS_SCHEMA = {
  anyOf: [
    { type: 'string', enum: BAND_NAMES },
    { type: 'array', items: { type: 'string', enum: BAND_NAMES }, minItems: 1 },
  ],
  description: 'Loudness band(s) of the default peak after the master chain: quiet (-28 to -23 dBFS, clicks and air), medium (-23 to -17, ordinary cues), loud (-17 to -12, the loudest hits).',
};

// ------------------------------------------------------------------ the tools

const info = {
  name: 'info',
  description:
    'Start here. Reports the Timbre version, how many sounds the catalog holds in each category, the themes, the loudness bands, the moment names that suggest_sounds and build_kit understand, the voices that speak takes, ' +
    'and where the numbers come from (measured by the level gate, or estimated). Use it once at the start of a task, or to check that the catalog loaded and is current. ' +
    'It does not search and it returns no code: follow it with suggest_sounds or search_sounds to find sounds, then get_copy or build_kit for code.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  handler(args, ctx) {
    const c = ctx.catalog;
    const counts = c.categoryCounts();
    const durs = c.sounds.map((s) => s.dur).sort((a, b) => a - b);
    // levels are made on first use: count what is already known and never force a full estimate here
    const bandCounts = { quiet: 0, medium: 0, loud: 0, notYetKnown: 0 };
    let measured = 0;
    for (const s of c.sounds) {
      const lv = c.peekLevel(s);
      if (!lv) { bandCounts.notYetKnown++; continue; }
      bandCounts[lv.band]++;
      if (lv.source === 'measured') measured++;
    }
    const fams = c.familyCounts();
    const fromCatalog = c.sounds.filter((s) => s.levels).length;
    const reportMeasured = measured - (c.levels.explicit === false ? 0 : fromCatalog);
    const sources = [];
    if (fromCatalog && c.levels.explicit !== false) sources.push(`measured values carried in the catalog (catalog/levels.json, the level gate) for ${fromCatalog} sound(s)`);
    if (c.levels.reportFile && reportMeasured > 0) sources.push(`measured values from ${c.levels.reportFile} for ${reportMeasured} ${sources.length ? 'more' : 'sound(s)'}${c.levels.reportStale ? ' (the report is older than the catalog)' : ''}`);
    // the speech and babble voices, when the catalog carries the speech engine
    const voices = c.helpers ? voiceListing(c.helpers) : null;
    const out = {
      name: 'Timbre',
      about: 'A single-file offline gallery of synthesized WebAudio sound effects. Every sound is a small recipe (oscillators, seeded noise, filters, envelopes); nothing is sampled or fetched.',
      version: c.version,
      schema: c.schema,
      server: { name: SERVER_NAME, version: SERVER_VERSION },
      catalog: {
        dir: c.dir, mode: c.mode, loadedAt: c.loadedAt,
        sounds: c.sounds.length, themes: c.themes.length,
        ...(c.error ? { error: c.error.message } : {}),
        ...(c.warnings.length ? { warnings: c.warnings.slice(0, 10) } : {}),
      },
      categories: Object.entries(counts).map(([category, count]) => ({ category, label: CATEGORY_LABELS[category] || category, count })),
      families: Object.fromEntries(Object.keys(FAMILIES).map((f) => [f, fams[f] || 0])),
      ...(durs.length ? { durations: { shortest: durs[0], median: durs[Math.floor(durs.length / 2)], longest: durs[durs.length - 1] } } : {}),
      themes: c.themes.map((t) => ({ id: t.id, name: t.name, moments: Object.keys(t.moments) })),
      loudness: {
        bands: BANDS.map((b) => ({ band: b.name, note: b.note })),
        houseRange: 'Every sound peaks between -36 and -12 dBFS after the master chain; the typical effect sits at -25 to -15.',
        counts: bandCounts,
        source: sources.length
          ? `${sources.join('; ')}; the rest are estimated offline`
          : 'estimated offline from each sound\'s own recipe (about a dB from the browser level gate on average); no measured levels were found, so nothing is measured',
      },
      moments: {
        inThemes: [...new Set(c.themes.flatMap((t) => Object.keys(t.moments)))],
        understood: Object.keys(MOMENTS),
        moods: Object.keys(MOODS),
      },
      copyContract: c.copyContract ? {
        signature: `${c.copyContract.signature} returns ${c.copyContract.returns || 'the end time'}`,
        masterChain: c.copyContract.master,
        warmUp: `a new master chain needs ${c.copyContract.preroll} s before a sound may start on it`,
        ...(c.copyContract.chains ? { chains: c.copyContract.chains } : {}),
      } : {
        signature: 'fn(ac, opts, when, dest) returns the end time',
        masterChain: 'gain 0.55 -> limiter (-12 dB, 12:1) -> tanh ceiling (-6 dBFS)',
        warmUp: `a new master chain needs ${PREROLL} s before a sound may start on it`,
      },
      parameterRoles: ROLES,
      ...(voices ? { voices: { ...voices, note: 'speak takes a voice id; each list is in display-name order, as the gallery shows it' } } : {}),
      next: [
        'suggest_sounds { description } maps an app or a moment to candidates with reasons',
        'search_sounds { query } is plain ranked search; filter by category, max_duration, loudness',
        'get_sound { id } shows parameters, levels and the Copy code; get_copy { id, params } bakes values in',
        'build_kit { moments: [...], theme?, mood? } returns ONE module with play(moment) for a whole app',
        'Sounds cannot be auditioned through this server: open dist/timbre.html in a browser to listen',
      ],
    };
    return out;
  },
};

const searchSounds = {
  name: 'search_sounds',
  description:
    'Find sounds by words, ranked by relevance with the reasons for each hit. Searches name, tags, the moments a sound was made for, its family, description and category, understands plurals and near-synonyms ("tap" finds clicks), ' +
    'and filters by category, family (wood, glass, chip, ...), maximum or minimum duration, loudness band and required tags. Use it when you know roughly what you want ("coin", "soft click", "whoosh", "paper") or want to browse a category. ' +
    'With no query it lists everything that passes the filters. It returns summaries, not code: use get_sound for parameters and levels, get_copy or build_kit for code. ' +
    'To turn a description of an app or a moment into picks, use suggest_sounds instead.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Words to look for, e.g. "coin", "button press", "paper shuffle". Optional.' },
      category: CATEGORY_SCHEMA,
      family: FAMILY_SCHEMA,
      max_duration: { type: 'number', minimum: 0.01, description: 'Longest allowed sound in seconds (the sound\'s declared duration, tail included).' },
      min_duration: { type: 'number', minimum: 0, description: 'Shortest allowed sound in seconds.' },
      loudness: LOUDNESS_SCHEMA,
      tags: { type: 'array', items: { type: 'string' }, description: 'Tags every result must carry, e.g. ["card"].' },
      limit: { type: 'integer', minimum: 1, maximum: 50, description: 'How many results to return (default 10).' },
      offset: { type: 'integer', minimum: 0, description: 'Skip this many results, to page through a long list.' },
    },
    additionalProperties: false,
  },
  handler(args, ctx) {
    const c = need(ctx);
    const limit = args.limit == null ? 10 : args.limit;
    const offset = args.offset == null ? 0 : args.offset;
    const filters = filtersOf(args);
    const index = indexFor(c);
    const r = withFilters(() => search(c, index, { query: args.query || '', filters, limit, offset }));
    const items = r.rows.map((row) => summary(c, row.d.s, args.query ? { score: round(row.score), matched: row.why.slice(0, 6).map((w) => w.replace(/^(\w+):(.*)$/, (m, f, st) => `${f}:${row.d.disp.get(st.split('~')[0]) || st.split('~')[0]}${st.includes('~') ? ' (related)' : ''}`)) } : {}));
    const out = { query: args.query || '', filters, total: r.total, returned: items.length, offset, items };
    if (!r.total && Object.keys(filters).length) {
      // say which filter cost the result: search again without them
      const loose = search(c, index, { query: args.query || '', filters: {}, limit: 3 });
      if (loose.total) out.relaxed = { note: 'No sound passes every filter. Without the filters the best matches are:', items: loose.rows.map((row) => summary(c, row.d.s)) };
    } else if (!r.total) {
      out.hint = 'No match. Try fewer or more general words, or call suggest_sounds with a description of the moment.';
    }
    if (r.total > offset + items.length) out.nextOffset = offset + items.length;
    return out;
  },
};

const getSoundTool = {
  name: 'get_sound',
  description:
    'Read everything about one sound before using it: name, family, the moments it was made for, tags, description, duration, every parameter with its range, default, control kind (switch, count, amount, value), what it does and, for switches, its role, ' +
    'levels (peak and RMS in dBFS with the loudness band, marked measured or estimated), the themes that use it, similar sounds, and its self-contained Copy code at the default parameters. ' +
    'Use it after search_sounds or suggest_sounds named an id, especially to see what a parameter can do before tuning it. ' +
    'To get code with specific parameter values baked in, call get_copy; to use several sounds in one project, call build_kit. ' +
    'The code is 4 to 10 KB per sound: set include_code false when you are only comparing candidates.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 1, description: 'Sound id, e.g. "ui-click-soft".' },
      include_code: { type: 'boolean', description: 'Include the Copy code at the default parameters (default true). Set false to read only the metadata, which is much shorter.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  codeKey: 'code',
  handler(args, ctx) {
    const c = need(ctx);
    const s = getSound(c, args.id);
    const lv = c.levelOf(s);
    const usedBy = [];
    for (const t of c.themes) for (const [moment, m] of Object.entries(t.moments)) if (m.sound === s.id) usedBy.push({ theme: t.id, moment, ...(Object.keys(m.params).length ? { params: m.params } : {}) });
    const mine = new Set(s.tags);
    const related = c.sounds.filter((o) => o.id !== s.id)
      .map((o) => ({ o, shared: o.tags.filter((t) => mine.has(t)) }))
      .filter((x) => x.shared.length || x.o.category === s.category)
      .sort((a, b) => b.shared.length - a.shared.length || (b.o.category === s.category) - (a.o.category === s.category) || a.o.id.localeCompare(b.o.id))
      .slice(0, 4)
      .map((x) => ({ id: x.o.id, name: x.o.name, why: x.shared.length ? `shares ${x.shared.join(', ')}` : `same category (${s.category})` }));
    const out = {
      id: s.id, name: s.name, category: s.category, ...declared(s), file: s.file, tags: s.tags, desc: s.desc, dur: s.dur,
      params: paramInfo(s),
      levels: lv ? {
        peak: lv.peak, rms: lv.rms, band: lv.band, source: lv.source,
        ...(lv.peakRange ? { peakAcrossSettings: lv.peakRange } : {}),
        ...(lv.worstRms != null ? { loudestRms: lv.worstRms } : {}),
        ...(lv.preLimiter != null ? { preLimiter: lv.preLimiter } : {}),
        ...(lv.audibleEnd != null ? { audibleEnd: lv.audibleEnd } : {}),
        note: lv.source === 'measured'
          ? 'measured by the level gate in a browser: worst of 3 seeds at the defaults, after the master chain, dBFS' +
            (lv.from === 'catalog' ? '; carried in the catalog for this exact version of the sound' : '') +
            (lv.stale ? ' (the report is older than the catalog; the sound may have changed)' : '')
          : 'estimated offline from the sound\'s recipe at the defaults (about a dB of the browser gate on the seed sounds; reverb and delay tails are left out), after the master chain, dBFS',
      } : null,
      themes: usedBy,
      related,
    };
    if (s.copyable) {
      out.copy = {
        functionName: s.fname,
        signature: `${s.fname}(ac, opts, when, dest)`,
        helpers: s.helpers,
        usage: usageLine(s, s.defaults),
        note: `opts overrides the parameter values; when is the earliest start (s); dest is the node to end in. The first call on a context builds the master chain and starts ${PREROLL} s later. Returns the end time.`,
      };
      if (args.include_code !== false) out.code = buildCopy(s, c.helpers, null, 1);
    } else {
      out.copy = { unavailable: s.copyIssue || 'this catalog carries no code (manifest.json missing)' };
    }
    return out;
  },
};

const getCopyTool = {
  name: 'get_copy',
  description:
    'Get the self-contained JavaScript function for ONE sound with the parameter values you choose baked in. The text is exactly what the gallery\'s Copy button produces for the same values: ' +
    'a single function named after the sound (ui-click-soft becomes uiClickSoft), carrying only the helpers it uses and the shared master chain, with the signature fn(ac, opts, when, dest). ' +
    'Paste it anywhere with a Web Audio context; it plays the same sound as the gallery. Use it when a project needs one sound, or one sound at specific settings (find ranges with get_sound). ' +
    'For two or more sounds, use build_kit: it shares the helpers and the master chain once instead of repeating them.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 1, description: 'Sound id, e.g. "notify-success-chime".' },
      params: { type: 'object', description: 'Parameter values to bake in as defaults, e.g. { "pitch": 880 }. Names and ranges come from get_sound. Values outside the range are clamped and reported; unknown names are an error.' },
      seed: { type: 'integer', minimum: 0, maximum: 4294967295, description: 'Noise seed baked in (default 1). Only sounds with randomness use it; the result says whether yours does.' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  codeKey: 'code',
  handler(args, ctx) {
    const c = needCode(ctx);
    const s = getSound(c, args.id);
    if (!s.copyable) throw new ToolError(`Sound ${s.id} cannot be copied: ${s.copyIssue || 'the catalog has no code for it'}.`, { code: 'copy_unavailable' });
    const checked = checkParams(s, args.params, s.id);
    const effective = paramsFor(s, checked.values);
    const seeded = s.helpers.includes('rand');
    const seed = args.seed == null ? 1 : args.seed;
    const code = buildCopy(s, c.helpers, checked.values, seed);
    return {
      id: s.id,
      functionName: s.fname,
      signature: `${s.fname}(ac, opts, when, dest)`,
      params: effective,
      ...(checked.clamped.length ? { clamped: checked.clamped } : {}),
      seed: seeded ? seed : null,
      ...(!seeded && args.seed != null ? { note: 'This sound uses no randomness, so the seed has no effect.' } : {}),
      dur: s.dur,
      helpers: s.helpers,
      bytes: Buffer.byteLength(code),
      usage: usageLine(s, effective),
      returns: `the end time: ${PREROLL} s after the context time on the first call (the master chain warms up), then when + ${s.dur} s`,
      code,
    };
  },
};

const listThemes = {
  name: 'list_themes',
  description:
    'List the sound themes. A theme maps app moments (click, toggle-on, success, error, notify, ...) to sounds with parameter overrides, so a whole interface can take one consistent voice. ' +
    'Use it when the user wants a set that matches a feel ("soft", "arcade") or you want a consistent family of sounds rather than separate picks. ' +
    'Then call get_theme for a theme\'s full map, or build_kit with theme to get the code.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  handler(args, ctx) {
    const c = need(ctx);
    return {
      count: c.themes.length,
      themes: c.themes.map((t) => ({
        id: t.id, name: t.name, desc: t.desc,
        moments: Object.keys(t.moments),
        sounds: [...new Set(Object.values(t.moments).map((m) => m.sound))],
      })),
      ...(c.themes.length ? {} : { hint: 'This catalog has no themes. build_kit and suggest_sounds still work from the moment vocabulary.' }),
    };
  },
};

const getTheme = {
  name: 'get_theme',
  description:
    'Read one theme as a moment-to-sound map: for each moment the sound, its name, category, duration, the parameter overrides the theme sets and the full effective parameters. ' +
    'Use it to inspect a theme before adopting it, to see which sound it uses for a moment, or to take one moment from a theme (then call get_copy with those params). ' +
    'To get working code for a whole theme, call build_kit with theme set.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', minLength: 1, description: 'Theme id from list_themes, e.g. "soft-ui".' },
    },
    required: ['id'],
    additionalProperties: false,
  },
  handler(args, ctx) {
    const c = need(ctx);
    const t = c.theme(args.id);
    if (!t) throw new ToolError(`No theme with id "${args.id}". Themes: ${c.themes.map((x) => x.id).join(', ') || '(none)'}.`, { code: 'not_found', data: { themes: c.themes.map((x) => x.id) } });
    const missing = [];
    const moments = [];
    for (const [moment, m] of Object.entries(t.moments)) {
      const s = c.get(m.sound);
      if (!s) { missing.push({ moment, sound: m.sound }); continue; }
      const lv = levelsOf(c, s);
      moments.push({
        moment, sound: s.id, name: s.name, category: s.category, dur: s.dur,
        overrides: m.params, params: paramsFor(s, m.params),
        ...(lv ? { loudness: { band: lv.band, peak: lv.peak, source: lv.source } } : {}),
      });
    }
    return {
      id: t.id, name: t.name, desc: t.desc, file: t.file, moments,
      ...(missing.length ? { missing, warning: 'These moments name sounds that are not in the catalog; rebuild it with `node build.mjs`.' } : {}),
      use: `build_kit { "theme": "${t.id}" } returns one module with play(moment) for every moment above; add "moments" to take a subset.`,
    };
  },
};

const buildKit = {
  name: 'build_kit',
  description:
    'Generate ONE JavaScript module for an app that exposes play(moment, opts): it bundles every helper once, shares one master chain across all sounds, and creates the AudioContext lazily on the first play() or prime(). ' +
    'Name the moments your app needs ("click", "toggle-on", "success", "error", "notify", "coin", ...). Each is filled from the theme if you give one, else from your explicit { moment, sound, params }, else by picking the best catalog match for that moment and mood, with the reason shown. ' +
    'Use it whenever an app needs more than one sound; for a single sound, get_copy is simpler. ' +
    'Returns the module (as ESM, or a plain script that defines a global), a table of which sound plays for each moment and why, anything it could not fill, and usage notes.',
  inputSchema: {
    type: 'object',
    properties: {
      moments: {
        type: 'array',
        minItems: 1,
        maxItems: 40,
        description: 'The moments to cover: names like "click", or objects { moment, sound?, params? } to choose a sound (and parameter values) yourself. Omit to take every moment of the theme.',
        items: {
          anyOf: [
            { type: 'string', minLength: 1, maxLength: 40 },
            {
              type: 'object',
              properties: {
                moment: { type: 'string', minLength: 1, maxLength: 40 },
                sound: { type: 'string', description: 'Sound id to use for this moment.' },
                params: { type: 'object', description: 'Parameter values for this moment (clamped to range).' },
              },
              required: ['moment'],
              additionalProperties: false,
            },
          ],
        },
      },
      theme: { type: 'string', description: 'A theme id from list_themes. Its sound and parameters are used for each moment it covers.' },
      mood: { type: 'string', description: 'How the app should feel, in plain words: "calm", "playful", "retro arcade", "professional", "sci-fi". Steers the picks that no theme or choice decides. A mood that names a theme (for example "soft ui") uses that theme.' },
      format: { type: 'string', enum: ['esm', 'script'], description: '"esm" (default): an ES module with named exports. "script": a classic script that defines one global (see global_name), for pages without modules.' },
      global_name: { type: 'string', description: 'For format "script": the global to define (default "timbreKit").' },
      vary: { type: 'boolean', description: 'Use a fresh noise seed on every play so repeated sounds are never identical (default false: the gallery\'s sound, every time).' },
      category: CATEGORY_SCHEMA,
      family: FAMILY_SCHEMA,
      max_duration: { type: 'number', minimum: 0.01, description: 'Longest allowed sound in seconds, for automatic picks.' },
      loudness: LOUDNESS_SCHEMA,
    },
    additionalProperties: false,
  },
  codeKey: 'code',
  handler(args, ctx) {
    const c = needCode(ctx);
    const filters = {};
    if (args.category != null) filters.category = args.category;
    if (args.family != null) filters.family = args.family;
    if (args.max_duration != null) filters.max_duration = args.max_duration;
    if (args.loudness != null) filters.loudness = args.loudness;
    const r = withFilters(() => resolveKit(c, { moments: args.moments, theme: args.theme, mood: args.mood, filters }));
    if (!r.choices.length) {
      throw new ToolError(`No moment could be filled. ${r.unresolved.map((u) => `${u.moment}: ${u.why}`).join(' | ')}`, { code: 'no_match', data: { unresolved: r.unresolved } });
    }
    const format = args.format || 'esm';
    const mod = buildKitModule(c, r.choices, { format, globalName: args.global_name || 'timbreKit', vary: !!args.vary });
    const g = mod.globalName;
    return {
      format,
      ...(r.theme ? { theme: r.theme.id } : {}),
      ...(r.moods.length ? { mood: r.moods.map((m) => m.mood.name) } : {}),
      moments: r.choices.map((x) => ({
        moment: x.moment, sound: x.sound.id, name: x.sound.name, dur: x.sound.dur, source: x.source, fit: x.fit,
        reason: x.reason, params: x.params,
        ...(x.alternatives.length ? { alternatives: x.alternatives } : {}),
      })),
      ...(r.unresolved.length ? { unresolved: r.unresolved } : {}),
      ...(r.warnings.length ? { warnings: r.warnings } : {}),
      sounds: mod.sounds,
      helpers: mod.helpers,
      bytes: Buffer.byteLength(mod.code),
      exports: {
        'play(moment, opts)': 'plays a moment; opts overrides its parameters (clamped), plus seed, when (s), dest (node); returns the end time or null',
        'prime()': 'creates the context and warms the master chain; call from the first user gesture',
        'has(moment)': 'true when the kit has that moment',
        'moments': 'the moment names',
        'setMuted(on)': 'silences play() without touching the context',
        'getContext()': 'the AudioContext, or null before the first play()/prime()',
      },
      usage: format === 'esm'
        ? `Save as sounds.js. import { play, prime } from './sounds.js'; call prime() on the first pointerdown, then play('${r.choices[0].moment}') from event handlers.`
        : `Save as sounds.js and load it with a script tag. Then ${g}.prime() on the first pointerdown and ${g}.play('${r.choices[0].moment}') from event handlers.`,
      note: 'Browsers start audio only after a user gesture. The first sound on a new context starts 0.2 s late while the limiter warms up; prime() moves that wait ahead of the first real sound.',
      code: mod.code,
    };
  },
};

const suggestSounds = {
  name: 'suggest_sounds',
  description:
    'Turn a plain description of an app or a moment into candidate sounds with reasons. Say what the app is and what happens in it ("a meditation timer that rings when done, gentle taps", "retro platformer: coin pickup, jump, game over") ' +
    'or name moments directly; it reads the moments and mood out of your words, ranks catalog sounds for each by tags, category, length and loudness, and says why. ' +
    'Use it when you do not know the catalog or need a first set of picks to react to. Candidates marked fit "loose" are the nearest thing the catalog has, not a match. ' +
    'Use search_sounds for plain keyword lookup, build_kit to turn the picks into one module.',
  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string', minLength: 1, maxLength: 2000, description: 'The app, the moment, or both, in plain words.' },
      moments: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 40 }, maxItems: 20, description: 'Moments to rank directly, e.g. ["click", "success"]. Added to the ones read from the description.' },
      mood: { type: 'string', description: 'How it should feel: "calm", "playful", "retro arcade", "professional", "sci-fi", ...' },
      theme: { type: 'string', description: 'Prefer the sounds of this theme where it covers a moment.' },
      limit: { type: 'integer', minimum: 1, maximum: 10, description: 'Candidates per moment (default 3).' },
      category: CATEGORY_SCHEMA,
      family: FAMILY_SCHEMA,
      max_duration: { type: 'number', minimum: 0.01, description: 'Longest allowed sound in seconds.' },
      loudness: LOUDNESS_SCHEMA,
    },
    additionalProperties: false,
  },
  handler(args, ctx) {
    const c = need(ctx);
    if (!args.description && !(args.moments && args.moments.length)) {
      throw new ToolError('Give a description of the app or moment, or a list of moments.', { code: 'invalid_arguments' });
    }
    if (args.theme && !c.theme(args.theme)) {
      throw new ToolError(`Unknown theme "${args.theme}". Themes: ${c.themes.map((x) => x.id).join(', ') || '(none)'}.`, { code: 'not_found' });
    }
    const filters = {};
    if (args.category != null) filters.category = args.category;
    if (args.family != null) filters.family = args.family;
    if (args.max_duration != null) filters.max_duration = args.max_duration;
    if (args.loudness != null) filters.loudness = args.loudness;
    const r = withFilters(() => suggest(c, {
      description: args.description || '', moments: args.moments || [], mood: args.mood || '', theme: args.theme || null,
      limit: args.limit == null ? 3 : args.limit, filters,
    }));
    const out = {
      read: {
        moments: r.groups.map((g) => ({ moment: g.moment, from: g.source })),
        mood: r.moods.map((m) => ({ mood: m.mood.name, words: m.hits })),
        ...(r.theme ? { theme: r.theme.id } : {}),
      },
      suggestions: r.groups,
    };
    if (r.match && r.match.candidates.length) {
      out.note = r.groups.length
        ? 'None of the moments found a sound; these are the closest by plain words.'
        : 'No known moment was named; these are the closest sounds by plain words.';
      out.closest = r.match.candidates;
    }
    if (!out.suggestions.length && !out.closest) out.hint = 'Nothing recognizable. Name a moment (click, success, error, coin, ...) or use search_sounds with a keyword.';
    out.next = 'get_sound { id } for parameters and code; build_kit { moments: [...] } to bundle several; search_sounds to look further.';
    return out;
  },
};

const speakTool = {
  name: 'speak',
  description:
    'Get ONE self-contained JavaScript function that says a line of text in a synthesized voice, or babbles it (Animalese style), with the line baked in. ' +
    'Speech runs the text through the text front end (letter-to-sound rules and a lexicon; numbers and punctuation are understood, and [W EY1 T] in the text spells a word in ARPAbet) and bakes in the phonemes, so the function carries only the formant synthesizer, the voice and the master chain: the same function the gallery\'s Speak rack copies. ' +
    'Speech voices (display name, then id): Announcer (Female) announcer-female (the same PA system with a woman speaking); Announcer (Male) announcer (the classic synthesized PA voice, the default; announcer-male names it too); Deep Robot deep; Retro Computer retro (an 8-bit home computer); Small Robot small; Whisper whisper. ' +
    'Babble voices: Cute cute (the default), Gruff gruff, Robot Beep beep, Tiny Sprite sprite, Wise Elder elder. ' +
    'The function keeps the Copy contract, fn(ac, opts, when, dest), returns the end time, and takes pitch, rate and range (speed and spread for babble) and seed in opts at play time. ' +
    'Use it for a custom line; for ready-made announcements, countdowns and babble, search_sounds with category "voice", then get_copy.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', minLength: 1, maxLength: 500, description: 'The line, in English, e.g. "Access granted. Welcome back, commander."' },
      mode: { type: 'string', enum: ['speech', 'babble'], description: '"speech" (default) says the words; "babble" turns each letter or syllable into a short pitched talk blip.' },
      voice: { type: 'string', description: 'A voice id. Speech: announcer-female (Announcer (Female)), announcer (Announcer (Male), the default; also announcer-male), deep, retro, small, whisper. Babble: cute (the default), gruff, beep, sprite, elder.' },
      pitch: { type: 'number', description: 'Semitones up or down from the voice\'s own pitch, -12 to 12 (default 0).' },
      rate: { type: 'number', description: 'Speech only: speaking rate, 0.5 to 1.6 (default 1).' },
      range: { type: 'number', description: 'Speech only: intonation, 0 a monotone to 2 animated (default 1).' },
      speed: { type: 'number', description: 'Babble only: talking speed, 0.5 to 1.6 (default 1).' },
      spread: { type: 'number', description: 'Babble only: pitch spread between blips, 0 to 2 (default 1).' },
      seed: { type: 'integer', minimum: 0, maximum: 4294967295, description: 'Noise seed baked in (default 1): breath, frication and pitch jitter draw from it.' },
    },
    required: ['text'],
    additionalProperties: false,
  },
  codeKey: 'code',
  handler(args, ctx) {
    const c = needCode(ctx);
    const rt = speechRuntime(c.helpers);
    const mode = args.mode === 'babble' ? 'babble' : 'speak';
    const defs = SPEAK_PARAMS[mode];
    const other = mode === 'babble' ? ['rate', 'range'] : ['speed', 'spread'];
    const wrong = other.filter((k) => args[k] != null);
    if (wrong.length) {
      throw new ToolError(`${wrong.join(' and ')} ${wrong.length > 1 ? 'apply' : 'applies'} to ${mode === 'babble' ? 'speech' : 'babble'}; ${mode === 'babble' ? 'babble' : 'speech'} takes ${Object.keys(defs).join(', ')}.`, { code: 'bad_params' });
    }
    const voices = mode === 'babble' ? rt.babbleVoices() : rt.speechVoices();
    const asked = args.voice == null ? (mode === 'babble' ? 'cute' : 'announcer') : String(args.voice).toLowerCase();
    const voice = mode === 'speak' && Object.hasOwn(VOICE_ALIASES, asked) ? VOICE_ALIASES[asked] : asked;
    if (!Object.hasOwn(voices, voice)) {
      throw new ToolError(`Unknown ${mode === 'babble' ? 'babble' : 'speech'} voice "${args.voice}". Voices: ${voiceIds(voices).join(', ')}.`, { code: 'not_found', data: { voices: voiceIds(voices) } });
    }
    if (!/[A-Za-z0-9]/.test(args.text)) throw new ToolError('The text has nothing to say: give it words or numbers.', { code: 'invalid_arguments' });
    const clamped = [];
    const cfg = { mode, text: args.text, voice, seed: args.seed == null ? 1 : args.seed };
    for (const [k, d] of Object.entries(defs)) {
      if (args[k] == null) continue;
      const v = Math.min(d.max, Math.max(d.min, args[k]));
      if (v !== args[k]) clamped.push({ param: k, requested: args[k], used: v, range: [d.min, d.max] });
      cfg[k] = v;
    }
    const r = buildSpeechCopy(c.helpers, rt, speechClosure, cfg);
    const dur = (mode === 'babble' ? rt.babble : rt.speak)(null, 0, { text: args.text, voice, ...r.values });
    const v = voices[voice];
    return {
      mode: mode === 'babble' ? 'babble' : 'speech',
      text: args.text,
      voice: r.voice,
      voiceName: v.name,
      voiceDesc: v.desc,
      ...(mode === 'speak' ? { phonemes: r.line.ph } : {}),
      functionName: r.fname,
      signature: `${r.fname}(ac, opts, when, dest)`,
      params: r.values,
      ...(clamped.length ? { clamped } : {}),
      seed: cfg.seed,
      dur: Math.round(dur * 1000) / 1000,
      bytes: Buffer.byteLength(r.code),
      voices: { speech: voiceIds(rt.speechVoices()), babble: voiceIds(rt.babbleVoices()) },
      usage: `const ac = new AudioContext(); ${r.fname}(ac);  // call from a click or key handler so the browser lets it start; ${r.fname}(ac, { pitch: 2 }) changes it at play time`,
      returns: `the end time: ${PREROLL} s after the context time on the first call (the master chain warms up), then when + about ${Math.round(dur * 100) / 100} s`,
      note: mode === 'speak' ? 'phonemes shows how the text was read; to fix a word, put its ARPAbet in brackets in the text, e.g. [W EY1 T].' : 'Babble has no words: each letter or syllable is a blip, and a question mark lifts the last ones.',
      code: r.code,
    };
  },
};

export const TOOLS = [info, suggestSounds, searchSounds, getSoundTool, getCopyTool, listThemes, getTheme, buildKit, speakTool];
export function buildTools() { return TOOLS; }
export { ToolError };
