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
  pasted anywhere it plays the same sound (same render within 0.5 dB, in each channel).

## Layout
```
src/core/        synth library: voices, envelopes, effects, seeded noise, master chain; the speech
                 engine (speech.js) and its text front end (phonetics.js)
src/sounds/<category>/<id>.js   one sound per file
src/themes/<id>.js              sound themes: moment -> sound + parameter overrides
src/vocabulary.js               the one list of moments, families and parameter roles
src/shell/       gallery page template (HTML, CSS, JS)
build.mjs        bundles core + sounds + themes + shell into dist/timbre.html,
                 and writes catalog/manifest.json + catalog/index.json
catalog/levels.json             measured levels per sound, written by the level gate
gates/           level test, page test, copy test (headless browser), unit tests (node --test)
gates/fixtures/phonemes.tsv     the reviewed text-to-phoneme table the front end is held to
mcp-server/      zero-dependency MCP server over the catalog
```

## A sound file
```js
export default {
  id: 'ui-click-soft',            // kebab-case, unique, category prefix
  name: 'Soft Click',
  category: 'ui',                 // ui, notify, data, ai, game, battle, cards, duel, magic, fx,
                                  // scifi, dark, ambience, music, voice
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

Categories are the other shared list, in gallery order: ui, notify, data, ai, game, battle, cards,
duel, magic, fx, scifi, dark, ambience, music, voice. `battle` is generic creature-battle card game moments
(elements, status conditions, knockouts); `duel`, labelled Ink Duel, is a fan-made, unbranded family
of ink-and-lore card game mechanics. A category is listed in `build.mjs` (CATEGORIES), the gallery
(`src/shell/app.js`: label and order; `src/shell/style.css`: a color per theme), and the MCP server
(`mcp-server/lib/catalog.js`, and the labels in `mcp-server/tools/index.js`). A category with no
sounds yet is left out of the manifest's category list and the gallery's filters, and the MCP
server's `info` shows it with a count of zero. Each moment of a newer category also lists an older
one (`thinking`: ai, then scifi), so suggestions have a fallback until its sounds land.

## Loop cells and silence
Every sound is a one-shot with a fixed `dur`. A wait with no fixed end (a loader, an agent thinking,
a live data feed) is served by a loop cell: one short cell, tagged `loop-cell`, that the host
re-triggers on an interval for as long as the wait lasts. The cell falls to silence inside its
`dur`, so back-to-back plays never pile up, and its `desc` names the interval it is made for
("re-trigger every 1.2 s"; the build checks a time is named). The `loading` and `thinking` moments
ask for loop cells.

## Seamless loops and soundscapes
A bed (an ambience or dark sound with `loop: true`) is still written as one swell with a fade at each
end, but it can also play for ever. `src/core/loop.js`:
- `seamless(channels, sr)` cuts a loop out of a long render: it finds the steady span between the
  fades from half-second levels (within 4 dB of the median), searches the last half second of loop
  lengths for the one whose continuation best matches the head in phase (a drone crossfaded against
  itself out of phase cancels), then crossfades that continuation into the head over up to 2 s. The
  curve follows how alike the two passages are: equal power for noise, closer to equal gain as they
  correlate, so the join keeps its level either way. The last sample of the loop flows into the first.
- `loopBuffer` renders the bed before the master chain (the live chain applies it), with its
  `length` raised to 18 s so the steady span is long, and returns the loop as an AudioBuffer. A bed
  whose swell scales with its length must cap it at its longest setting (Abyss Drone does).
- `soundscape(c, dest, layers, T)` plays layers into a master chain: beds loop (each starting at its
  own point, so beds of one length never pulse together), events (any sound, `every: [lo, hi]` s)
  fire at random with a fresh seed each time and `vary` drawing params afresh. It returns
  `{ ready, stop(fade), setLevel(i, v), layers }`.

Presets live in `src/scapes/<id>.js` (`id`, `name`, `desc`, `layers`); the build checks every bed
loops, every event has an interval, and params and `vary` stay in range. Soundscape Copy
(`buildScapeCopy`) is one function that carries the layers' plays, their helpers and the loop
runtime: `rainAndThunder(ac, opts, dest)` returns the controller. `gates/check_loops.mjs` cuts every
bed's loop at 3 seeds and fails a loop under 6 s, a join that leaves the bed's own level range, or a
wrap whose jump exceeds twice the bed's own 99.9th percentile step.

Purely decorative animations stay silent by design: decorative glow, borders and gradient text,
foil and holo shimmer, and static diagrams (nodes, boundaries, org charts). Timbre makes no sounds
for them, and a gallery that pairs sounds with animations leaves them unpaired.

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

## Voices
Speech is synthesized like everything else. A formant synthesizer in the cascade/parallel design of
Klatt (1980) computes a line sample by sample into one AudioBuffer (`src/core/speech.js`), which
plays through the master chain like any voice: a smooth glottal pulse with jitter and shimmer,
aspiration and frication from the seeded generator, five cascade formants with a nasal pole and
zero, a parallel bank for fricatives and bursts, and a voice's effect chain (a PA horn and a hall,
a metallic comb, an 8-bit converter). Computing it in JavaScript keeps a line deterministic: the
gallery, the level gate, the copy gate and a pasted Copy hear the same samples. A planner turns
phonemes into durations (Klatt 1979), formant targets with coarticulation (Peterson and Barney 1952
vowels, locus equations for consonants) and a pitch contour (declination, a hat on each stressed
vowel, a fall or a question's rise). The text front end (`src/core/phonetics.js`) is the NRL
letter-to-sound rules (Elovitz, Johnson, McHugh and Shore 1976, a public domain U.S. government
report) with stress, numbers, symbols and a lexicon of about 240 words the rules get wrong or the
voice sounds say. Everything is written from those publications; no code or data comes from another
speech engine. Babble (Animalese style talk) reuses the synthesizer: a pitched vowel blip per letter
or syllable.

Every voice list a person sees (the Speak rack's picker, a voice sound's slider, `build.mjs --say`,
the MCP server's listings, these docs) is in display-name order, the order of the voice tables
themselves: the speech voices Announcer (Female), Announcer (Male), Deep Robot, Narrator (Female),
Narrator (Male), Retro Computer, Small Robot, Soft Guide and Whisper, the babble voices Cute, Gruff, Robot Beep, Tiny Sprite and Wise Elder. Ids
do not change with names: code and Copy say `announcer-female` and `announcer` (or `announcer-male`),
and the gallery shows a voice sound's choice by the voice's display name.

The announcer is a pair: one PA system, two speakers. `announcer`, Announcer (Male), is exactly what
it was. `announcer-female`, Announcer (Female), is a young woman's voice, not his pitched up, tuned
on the cues listening studies tie to a female voice (F0 and formants both, Hillenbrand and Clark
2009; a wider pitch range) and away from the cues they tie to an older one (a low F0, jitter and
shimmer, a noisy, hoarse source, tremor, a slow rate and slack articulation: Linville 2001,
Harnsberger et al. 2008, Schotz 2006):
- Vowels: her own table, carried in the voice as `vowels`: Peterson and Barney (1952), women; EY and
  OW start at the /e/ and /o/ of Hillenbrand et al. (1995), women; every other diphthong target is
  his times their women-to-men ratio, formant by formant, for the vowel it is nearest (AY and AW
  start at /a/; EY ends toward /i/, AY and OY toward /I/, AW toward /U/, OW toward /u/). AX is the
  neutral tube of a woman's tract (585, 1755, 2925 Hz). The women-to-men ratio of the Peterson and
  Barney formants runs from 1.02 (F1 of ER) to 1.46 (F1 of AH), so no single scale would do.
- Tract: `vowelScale` [1.07, 1.09, 1.11] lifts that table past the women's averages, more in the upper
  formants: a shorter tract than the average woman's and a wider formant dispersion. `formant` 1.3
  (1.17, the mean women-to-men ratio of the Peterson and Barney formants, times 1.11) moves what has
  no table of its own with the top formants: consonant loci, F4 and F5, the nasals and the frication,
  so her sibilants and alveolar burst sit 20 to 28% above his.
- Pitch: 240 Hz. `range` 1.1, `accent` 1.8 and `fall` 0.5 give her contour 1.5 times his span in
  semitones (7.7 against 5.1 over six test lines), with lively accents, a question that ends 7
  semitones above her F0 (his: 4) and a statement that ends 2 below it (his: 3); her F0 stays above
  205 Hz, never down where a voice turns creaky.
- Pace: `rate` 1 (his 0.92), `vowelTime` 0.92 (the steady states shorten more than the consonants)
  and `transition` 0.7 (the formants reach and leave each vowel in 70% of his time): her speech takes
  12% less time than his over the six lines, 1.13 times his rate. Every voice sound's dur, set by the
  slowest voice, holds for her.
- Source: a long open phase (0.8, his 0.55) and a soft tilt (0.8, his 0.25) keep it light rather than
  pressed (Klatt and Klatt 1990), on a clean source: aspiration in the voicing at 0.055 (his 0.02),
  jitter 0.0015 and shimmer 0.008 (his 0.003 and 0.02), no vibrato, every cascade bandwidth 15% wider
  (`bw` 1.15). Measured on a held vowel: H1-H2 about 8 dB above his (a strong first harmonic), H1-A3
  4 to 6 dB above, harmonics-to-noise 34 to 35 dB (his 42).
- Chain: his horn and hall with less drive (0.12, his 0.25) and a little less hall (0.95 s at 0.14,
  his 1.1 s at 0.18), the high-pass lowered from 300 to 150 Hz so her fundamental passes (at 240 Hz it
  loses under 1 dB, where his horn takes 6), a presence peak at 2.6 kHz and air at 6 kHz (`eq` takes
  a list), under a 7 kHz top instead of his 4.5: still a PA, a young woman on it.

Every line is normalized to its peak (-15 dBFS after the chain), so a whisper and an announcer read
alike. Each has a public helper over an engine: `speak` and `babble` resolve the text and the voice
name, `utter` and `chatter` take phonemes and a whole voice. A voice sound's Copy carries the front
end; a Copy of a typed line (the gallery's Speak rack, the MCP server's `speak` tool) bakes the line
in as phonemes and carries the engine only. With `out = null` the helpers return a line's length
without playing it.

### The second family: the LF source and prosody 2 (2026-10-24)
Narrator (Female), Narrator (Male) and Soft Guide are built on two additions that every older voice
leaves switched off, so those voices render exactly what they did (`gates/fixtures/voices-v1.json`
holds all eleven to it):
- **The glottal source.** A voice with `source: 'lf'` drives the synthesizer with the Liljencrants-Fant
  flow derivative (`lfShape`) instead of the differentiated polynomial pulse. One shape parameter,
  `rd` (Fant 1995), sets the pulse: about 0.3 pressed and tense, 1 modal, 2 and above lax and
  breathy; the opening grows as a damped sine to the closing peak, the return phase reaches the
  closed phase exactly at the period's end, and the growth rate is solved so the net flow is zero.
  Aspiration on an LF voice rides on the open glottis (full where the flow is, a third of that where
  it is closed) instead of a steady hiss. The polynomial path keeps its code unchanged.
- **Prosody 2.** A voice with `prosody: 2` gets the planner's second set of rules on top of Klatt's
  durations: the last syllable before a major boundary lengthens (the last word a little), stressed
  vowels gain and unstressed ones lose a few percent, the phrase starts low and rises into its first
  accent, accents downstep with the nuclear accent lifted and peaking later in its vowel, a statement
  falls from the nuclear accent to a low that settles before the end, a question dips there and
  rises, and vowel onsets carry the consonant before them (a touch high after a voiceless one, low
  after a voiced obstruent). The original rules are what `prosody` 1 or absent runs.
- **The lexicon** grew by 136 common app and game words the rules got wrong (final, finish, photo,
  volume, version, library, success, congratulations and such), checked against a reference
  pronunciation; these apply to every voice, since a mispronounced word is a bug, and none of the
  shipped voice lines carried one.
The narrators are a woman (Rd 1.3, 196 Hz, the women's vowel table and a 1.25 tract scale) and a man
(Rd 1, 108 Hz) reading close and dry: jitter and shimmer at a healthy voice's levels, some breath, a
small room, no horn. Soft Guide is a lax, breathy woman (Rd 2, 184 Hz, breath 0.12) at a slow rate
with long vowels and a longer, softer room, for meditation and quiet instructions. A speech Copy of
an LF voice carries `lfShape` with the engine; a Copy of an older voice carries the (now longer)
engine but renders the same samples.

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
- 2026-10-13, voices: a ninth category, `voice`, a thirteenth family, `voice`, and two moments,
  `announce` and `dialogue` (Sci-fi Console now maps announce, 8-bit maps dialogue). A parameter may
  carry `choices`, names for the values of a stepped parameter (min 0, max one less than the count,
  step 1, no unit or role): the gallery shows the name, the catalog carries it, the MCP server lists
  the names and takes one for the number. Choices are labels, so they stay out of the fingerprint;
  play maps the number itself. New helpers: speak, babble, utter, chatter, phonemize, speechVoices,
  babbleVoices, speechPlan, babblePlan, klatt, voiceOut and phones (see Voices); with out = null,
  speak and babble return a line's length instead of playing it, and `node build.mjs --say "..."`
  prints a line's phonemes and its length per voice for setting dur. Voice sounds are normalized to
  -15 dBFS. A rule for core helpers: no quote character inside a regular expression literal, because
  stripCode (which finds a helper's dependencies) reads it as the start of a string; one hid a call
  to rand until it was written as a Unicode escape. The gallery gained a Speak rack (a typed line,
  speech or babble, a voice and three faders; Play, Ctrl+Enter, Save WAV, Copy) and the Copy module a
  second builder, buildSpeechCopy, which the MCP server's new ninth tool, speak, mirrors byte for byte
  (tested). The earlier sounds are unchanged: their 134 entries and the 27 earlier helpers are
  identical in the manifest (play, helper lists, fingerprints, levels), and each rendered side by
  side with the base bundle in the browser, at its defaults and at a random setting, matched sample
  for sample (92 renders) or within the engine's own run-to-run noise (176 renders, at most 7.3e-6,
  the same as the base bundle against itself).
- 2026-10-13, gap-fill vocabulary: five categories, `data`, `ai`, `fx`, `battle` and `duel`
  (labelled Ink Duel), in the gallery order under "One vocabulary" and empty until their sounds
  land; 39 moments (loaders, progress and counters, charts, maps and diagram packets, AI work,
  dismissal and severity, interface controls, screen effects, creature battles and card duels,
  among them `card-tap`, `resource` and `score`); and three roles, `up`, `pass` and `tick`. Two
  names differ from the plan: `ping` became `beacon` and `tap` became `card-tap`, because ping and
  tap already name notification and press sounds (tags of `notify`, `coin` and `click`), and a
  moment named after either would take the word over ("gentle tap feedback" read as a card tap).
  A moment that names both directions of a switch hints the first (`link`, `presence`, `record`,
  `auth` and `card-tap` set on 1, `verdict` pass 1, `transform` up 1); `debuff` sets no tick hint,
  because a hint falls back to a parameter of that name and notify-calendar's `tick` is an amount.
  Added "Loop cells and silence": the `loop-cell` tag, its interval named in `desc` (the build
  checks it) and the silence policy for decorative animations. With today's catalog the MCP server
  picks a sound inside each new moment's own categories (the real-catalog test holds all 98 moments
  to that), and it reads the tested descriptions as before. No sound changed: the manifest's
  sounds, helpers and levels are identical to the base; only its vocabulary grew.
- 2026-10-13, gap-fill themes and moods: the eight themes map 132 of the new moments where they
  belong (Soft UI 25, Glass 27 and Sci-fi Console 29 take the data, AI, notify and interface
  moments; 8-bit 12, Arcade 9, Fantasy 11, Mechanical 9 and Wood and Paper 10 take the game, battle,
  duel, card and effect moments that suit them), each override set to the theme's key, register and
  level. No gate renders a theme's overrides (the level gate renders defaults and random settings,
  the page gate counts the first theme's pads and plays one), so every theme moment was rendered
  once in the engine at its theme parameters, worst of three seeds: all inside the house range, Soft
  UI still under -16, and the moments that repeat while something runs (select, progress, data
  ticks, loaders, thinking, tokens, packets) sit with each theme's frequent moments. `auth` stays
  unmapped: no sound carries a lock switch yet. The MCP moods weigh the new categories
  (professional favours data and ai and marks down battle, duel and cards; gamey and tabletop
  favour battle, duel and cards; sci-fi favours fx, data and ai), and the word "gamey", which `info`
  lists, now calls up its own mood. The copy gate measures each channel on its own as well as both
  together, so a Copy that lost or mirrored a sound's placement (`T.pan`) fails; 77 sounds render a
  different left and right, all 34 that use `T.pan` among them.
- 2026-10-13, female announcer: a sixth speech voice, `announcer-female`, the male announcer's
  counterpart on the same PA system (see Voices). `announcer` is unchanged and also answers to
  `announcer-male` (speak, a Speak Copy, `build.mjs --say --voice`, the MCP server's speak, get_copy
  and build_kit; VOICE_ALIASES in src/core/copy.js, mirrored in the MCP server). The engine reads two
  new voice fields, each a branch that runs only when a voice sets it: `vowels` (a voice's own vowel
  table, which `formant` then leaves alone) and `bw` (a bandwidth scale). The male voices render
  sample for sample what they rendered before: every speech voice, every babble voice and every voice
  sound at its defaults and six random settings, compared with main on the mock graph, 213 renders,
  worst difference 0; gates/fixtures/announcer.json keeps him there. The voice sounds offer her as a
  sixth `voice` choice (number 5, after retro, so every saved number keeps its meaning) rather than a
  separate male and female switch: their `voice` parameter already names who speaks, and the build
  test holds every voice sound to the full list of speech voices in order, so the robot, whisper and
  retro sounds list her too while still speaking with their own voice by default. No default changed,
  so no existing render did; the speech sounds' fingerprints moved (their Copy carries the new voice
  table) and were measured again. gates/voice.test.mjs measures her (F1 and F2 of the eleven steady
  vowels within 10% of the women's table through her tract at 100 Hz and at her own 210 Hz with her
  intonation, the diphthongs gliding, F0 and the contour, H1-H2, H1-A3 and the aspiration against
  his, the sibilants and the alveolar burst a little higher); the copy gate runs every voice sound
  in her voice and a Speak line in it; voice_wavs.mjs writes both announcers saying the same two
  lines and every announcer sound in her voice. The gallery's Speak rack and the MCP server list her
  with the other voices.
- 2026-10-14, a more feminine announcer and voices by display name: after a listening pass, Announcer
  (Female) moved further from him on every cue (see Voices): F0 210 to 230 Hz with 1.5 times his
  span in semitones (livelier accents, a brighter question rise, a gentler statement fall), her
  formants 6 to 10% above the women's averages (`vowelScale`, weighted to F2 and F3; `formant` 1.17
  to 1.29 for the consonants, F4, F5 and frication), a breathier, softer source (open quotient 0.7
  to 0.8, tilt 0.75 to 0.8, breath 0.1 to 0.16) and a wider PA band for her (high-pass 300 to 150 Hz,
  top 5.2 to 7 kHz with presence and air). New engine fields, each a branch that runs only when a
  voice sets it: `vowelScale`, `accent` and `fall` in the planner, and `eq` as a list in the effect
  chain. The two announcers are now named Announcer (Female) and Announcer (Male) wherever a person
  sees them (ids unchanged: `announcer-female`, `announcer` and its alias `announcer-male`), and every
  voice list a person sees is in display-name order: the voice tables themselves, so the Speak rack,
  `build.mjs --say`, the MCP server (speak's description, its `voices` and errors, a new `voices`
  listing in `info`, get_sound's and get_copy's choices) and the docs follow, and the gallery shows a
  voice sound's choice by display name. The voice sounds' `choices` are reordered to match (number 0
  is now announcer-female, 1 announcer, 2 deep, 3 retro, 4 small, 5 whisper), so each default moved
  with its voice (access-denied 0 to 1, game-over 1 to 2, retro-greetings 4 to 3, robot-processing 2
  to 4, whisper-behind-you 3 to 5, and so on) and Sci-fi Console's announce override moved from 0 to
  1: every default render is unchanged. A saved number from before now names another voice, and a
  name still names the same one; a Copy carries its own list and renders as it did. The build test
  expects the sorted order, and a voice test fails when a person-facing list (the tables, the voice
  sounds' sliders, `--say`, the docs, the speak description) is out of order. The male voices,
  babble and every non-female setting of the voice sounds render sample for sample as before (242
  renders against main on the mock graph, worst difference 0).
- 2026-10-16, a younger Announcer (Female) and a your-turn set: after a listening pass she read old,
  so she moves off the cues of perceived age (see Voices): F0 230 to 240 Hz, aspiration 0.16 to
  0.055 (harmonics-to-noise 27 to 35 dB), jitter 0.003 to 0.0015 and shimmer 0.02 to 0.008, about 13%
  faster speech with quicker formant transitions, vowelScale and formant a touch higher, less drive
  (0.25 to 0.12) and a little less hall (1.1 s at 0.18 to 0.95 s at 0.14); the soft tilt and the long
  open phase stay. Two new planner fields, each a branch that runs only when a voice sets it:
  `vowelTime` and `transition`. Her ids and names are unchanged, and every other voice renders as
  before (238 renders against main, worst difference 0). A new moment, `your-turn` (control passes
  to you in a turn-based game or a shared session), in cards, game, notify, voice, battle and duel;
  cards-your-turn now lists it, and two sounds join it: voice-your-turn (the announcer says "Your
  turn.", "Your move." or "You're up.", Announcer (Female) by default, the same sorted `voice`
  choices as the other voice sounds) and game-your-turn (a bright arcade swoop into an arpeggio that
  lands on a held octave, with a chip switch). Six themes map it in their key and level: 8-bit and
  Arcade the arcade cue (chip on and off), Fantasy, Wood and Paper and Mechanical the mallet cue, and
  Soft UI the mallet cue at its quietest, for a shared session that hands a person the floor.
