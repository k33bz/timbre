# Timbre: design

Timbre is a single-file, offline gallery of synthesized sound effects, a sibling of Prism (the
CSS/SVG component gallery). Every sound is a small WebAudio recipe: no samples, no downloads, no
dependencies. People browse and audition sounds; agents search a catalog and pull exact code
through an MCP server.

## Principles
- **Synthesized only.** Oscillators, noise, filters, envelopes, waveshapers, delays and generated
  impulse responses. Nothing is fetched.
- **One file to ship.** `dist/timbre.html` works offline, opened from disk.
- **Sources stay small.** Each sound is its own source file; a build step bundles everything into the
  single page and the catalog. Nobody edits the bundle by hand.
- **Deterministic when it matters.** Noise comes from a seeded generator, so a render at fixed
  parameters is reproducible: the waveform, the level test and the copy test all compare like for
  like. Live playback may vary the seed for natural repetition.
- **Measured, not guessed.** Every sound declares its duration and is rendered offline in a gate
  that checks peak, RMS, DC offset, clipping and silence. Nothing ships louder than the house range.
- **Copy is self-contained.** Copy yields one JavaScript function plus only the helpers it uses;
  pasted anywhere it plays the same sound (same render within 0.5 dB).

## Layout
```
src/core/        synth library: voices, envelopes, effects, seeded noise, master chain
src/sounds/<category>/<id>.js   one sound per file
src/themes/<id>.js              sound themes: moment -> sound + parameter overrides
src/vocabulary.js               the one list of moments, families and parameter roles
src/shell/       gallery page template (HTML, CSS, JS)
build.mjs        bundles core + sounds + themes + shell into dist/timbre.html,
                 and writes catalog/manifest.json + catalog/index.json
catalog/levels.json             measured levels per sound, written by the level gate
gates/           level test, page test, copy test (headless browser), unit tests (node --test)
mcp-server/      zero-dependency MCP server over the catalog
```

## A sound file
```js
export default {
  id: 'ui-click-soft',            // kebab-case, unique, category prefix
  name: 'Soft Click',
  category: 'ui',                 // ui, notify, game, cards, magic, scifi, ambience, music
  tags: ['click', 'button', 'tap'],
  desc: 'A short muted tick for button presses.',
  dur: 0.08,                      // seconds the render needs, tail included, at ANY parameter values
  family: 'soft',                 // optional: the timbre family (src/vocabulary.js)
  moments: ['click'],             // optional: the moments it is made for (src/vocabulary.js)
  params: {                       // live controls; defaults are what the gallery and gates use
    pitch: { min: 400, max: 2400, def: 1100, unit: 'Hz', desc: 'Start note of the falling blip' },
    tone:  { min: 0, max: 1, def: 0.4, desc: 'Brightness of the noise breath: 0 muted, 1 airy' },
  },                              // optional per param: unit, step, desc, role (a switch's meaning)
  play(T, out, t, p) {            // T = core helpers, out = destination node, t = start time,
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.73, dur: 0.035, peak: 0.042 });  // p = parameter values
  },
};
```
`play` may only use `T.*`, its arguments and plain JS; the build reads its source for Copy and for
the catalog, so it must stand alone. It is written as a method, `play(T, out, t, p) { ... }`, and
uses `T.rand()` for anything random (never `Math.random`). `seed` is not a parameter name: Copy uses
`p.seed`. The build enforces all of this (see docs/ADDING_SOUNDS.md for the helper API).

## Themes
A theme maps app moments (`click`, `toggle-on`, `success`, `error`, `notify`, `hit`, `pickup`,
`coin`, `level-up`...) to a sound id and parameter overrides, so the same moment can be swapped as a
set: for example Soft UI, 8-bit, Arcade, Sci-fi, Glass, Wood.

## One vocabulary
`src/vocabulary.js` holds the moments (with the hints the MCP server ranks sounds by), the timbre
families and the parameter roles. The build validates sounds and themes against it and the MCP
server imports it, so a theme's moment, a sound's `moments` and a suggestion's moment are always
the same names. A new name is added there once.

## The catalog
`catalog/manifest.json` (schema 2) carries every sound's fields, play source, helper list and a
fingerprint (a hash of what decides its render: dur, ranges, play source, the helpers its Copy
carries); every helper's source; the version (package.json); the Copy contract (signature, preroll,
the master chain's settings); the vocabulary; and, per sound, the levels the level gate measured,
taken from `catalog/levels.json` only while their fingerprint matches. `catalog/index.json` is the
search subset. Both, and the page, are written whole (a temporary file, then a rename), so a
reader never sees half a file.

## Master chain and warm-up
Every sound plays through the same chain, live, offline and in Copy: gain 0.55, a
DynamicsCompressor used as a limiter (-12 dB threshold, knee 6, 12:1, 3 ms attack, 120 ms release)
and a `0.5 * tanh(2x)` waveshaper as a hard ceiling (-6 dBFS). All three are ported unchanged from the
Deck Lab viewer; the ceiling is kept because a fast filter sweep over noise can spike past the
compressor's 3 ms attack.

Chrome's DynamicsCompressor starts cold: on a new chain its gain ramps from about -8 dB to its
steady makeup (+5.4 dB with these settings) over roughly 150 ms. So every offline render builds the
chain and starts the sound 0.2 s later (`PREROLL`), and live playback and Copy never start a sound
on a chain younger than 0.2 s. With the warm chain, quiet material passes at about unity
(0.55 x makeup).

## Copy
Copy gives one function named after the sound (`ui-click-soft` -> `uiClickSoft`) that carries only
the helpers it uses plus the master chain: `uiClickSoft(ac, opts, when, dest)`. `opts` overrides the
parameter values baked in at copy time (and `seed`), `when` is the earliest start, `dest` the node
the chain ends in (default `ac.destination`); it returns the end time. One chain per destination
is kept on the context.

## Level range (dBFS, worst of several seeds)
Peak at most -12 for the loudest hits, typically -15 to -25 for effects, -21 to -28 for small
textures; RMS reported; no sample above -1 dBFS through the master chain; DC at or below -50 dBFS;
never silent. These match the Deck Lab sound pass the seed sounds come from.

The level gate (`gates/check_levels.mjs`) renders each sound on a warm chain at its defaults and at
3 random parameter sets, each with 3 seeds, and fails any render with: peak above -12 or below -36;
a sample above -1; a pre-limiter peak (the voices' own sum after the 0.55 gain) above -3 (the
ceiling is a guard, never the sound); DC above -50; anything above -60 after `dur`; silence or NaN.
Because random settings are tested, every parameter range must be safe end to end.

## Stereo
Sounds are mono unless they place a voice (`T.pan`) or use the stereo reverb. `T.pan` uses a
balance law (the near side at unity, the far side fading), so a centred voice is the mono signal
and panning never raises a peak. The master chain, the offline render (which measures the louder
channel) and Copy pass two channels through; Save WAV writes one channel when both are identical.

## Changes to this contract
- 2026-10-13, foundation build: added "Master chain and warm-up" (the measured cold start would
  otherwise make every gate underestimate short sounds by up to 13 dB: a click rendered at t = 0
  read -28.8 dBFS and plays at -15.7), "Copy" (the function signature the catalog and the MCP
  server will rely on) and the gate's exact thresholds under "Level range". The sound-file example
  now uses values that pass the gate (`peak: 0.5` would not), and the file rules spell out what the
  build enforces (method form, `T.rand`, reserved `seed`, `dur` covering every parameter value,
  optional `unit` and `step`).
- 2026-10-13, phase 2 core: new helpers (pulse, tick, crackle, pan, dcblock, lfo, bus, chord,
  jitter) and options (lp and hp on osc and noise, wave on osc, tail and fade on env, tone on
  pluck), each a branch that runs only when asked, so every existing sound renders as before
  (checked sample by sample in the browser and graph by graph offline). Added "One vocabulary",
  "The catalog" and "Stereo": sounds may declare a family and moments, parameters a desc and a role,
  themes may only use vocabulary moments, the manifest moved to schema 2 (version, Copy contract,
  vocabulary, fingerprints, measured levels) and build outputs are written atomically. The level
  gate keeps catalog/levels.json, and docs/ADDING_SOUNDS.md now asks for about 10 ms of dur past the
  last envelope end (the limiter's lookahead delays the output by 8.7 ms, measured with an impulse;
  an envelope that ends above silence failed the tail check without the margin).
