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
src/shell/       gallery page template (HTML, CSS, JS)
build.mjs        bundles core + sounds + themes + shell into dist/timbre.html,
                 and writes catalog/manifest.json + catalog/index.json
gates/           level test, page test, copy test (headless browser), unit tests (node --test)
mcp-server/      zero-dependency MCP server over the catalog (later phase)
```

## A sound file
```js
export default {
  id: 'ui-click-soft',            // kebab-case, unique, category prefix
  name: 'Soft Click',
  category: 'ui',                 // ui, notify, game, cards, magic, scifi, ambience, music
  tags: ['click', 'button', 'tap'],
  desc: 'A short muted tick for button presses.',
  dur: 0.08,                      // seconds the render needs, tail included
  params: {                       // live controls; defaults are what the gallery and gates use
    pitch: { min: 200, max: 2000, def: 900, unit: 'Hz' },
    tone:  { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {            // T = core helpers, out = destination node, t = start time,
    T.osc(out, t, { type: 'triangle', f: p.pitch, dur: 0.05, peak: 0.5 });  // p = parameter values
  },
};
```
`play` may only use `T.*`, its arguments and plain JS; the build reads its source for Copy and for
the catalog, so it must stand alone.

## Themes
A theme maps app moments (`click`, `toggle-on`, `success`, `error`, `notify`, `hit`, `pickup`,
`coin`, `level-up`...) to a sound id and parameter overrides, so the same moment can be swapped as a
set: for example Soft UI, 8-bit, Arcade, Sci-fi, Glass, Wood.

## Level range (dBFS, worst of several seeds)
Peak at most -12 for the loudest hits, typically -15 to -25 for effects, -21 to -28 for small
textures; RMS reported; no sample above -1 dBFS through the master chain; DC at or below -50 dBFS;
never silent. These match the Deck Lab sound pass the seed sounds come from.
