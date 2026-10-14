# Adding sounds to Timbre

This is the contract for anyone adding sounds or themes. The build enforces most of it and the
gates measure the rest, so a sound that passes `node build.mjs` and the three browser gates is
ready. Read `docs/DESIGN.md` for the why.

## The short version
1. Create `src/sounds/<category>/<id>.js` (copy a seed sound in the same category as a start).
2. `node build.mjs` until it reports no problems. It runs your `play` against a mock audio graph at
   the defaults, at every min, at every max and at random settings, so most mistakes show up here,
   in under a second, without a browser.
3. `node gates/check_levels.mjs <id>` and `node gates/check_copy.mjs <id>` (on a shared machine,
   through the browser queue; see "Checking one sound"). Adjust peaks until the level gate is ok.
4. Open `dist/timbre.html`, listen at the defaults and at the extremes of every slider.

## The file
```js
// One line on where the sound comes from or what it imitates.
export default {
  id: 'game-laser-zap',                 // kebab-case, unique, starts with its category
  name: 'Laser Zap',                    // 1 to 40 characters, Title Case
  category: 'game',                     // ui, notify, data, ai, game, battle, cards, duel, magic, fx,
                                        // scifi, ambience, music, voice
  tags: ['laser', 'zap', 'shoot'],      // lowercase kebab-case words people would search for
  desc: 'A bright falling zap for a shot fired.',  // 10 to 200 characters, one or two sentences
  dur: 0.4,                             // seconds, tail included, at ANY parameter values
  family: 'chip',                       // optional: one of the families in src/vocabulary.js
  moments: ['shoot'],                   // optional: the moments it is made for (src/vocabulary.js)
  params: {
    pitch: { min: 600, max: 3000, def: 1800, unit: 'Hz', desc: 'Start pitch of the zap' },
    drop: { min: 0.1, max: 0.9, def: 0.6, desc: 'How far it falls: low a short dip, high a deep plunge' },
    shots: { min: 1, max: 3, def: 1, step: 1, desc: 'How many shots in the burst' },
  },
  play(T, out, t, p) {
    for (let k = 0; k < Math.round(p.shots); k++) {
      T.osc(out, t + k * 0.1, { type: 'square', f: p.pitch, to: p.pitch * (1 - p.drop), dur: 0.12, peak: 0.03 });
    }
  },
};
```
Rules the build checks:
- These fields: `id`, `name`, `category`, `tags`, `desc`, `dur`, `params`, `play`, plus the optional
  `family` and `moments`. Anything else (a `description`, a `label`) is an error, so typos cannot
  hide.
- `family` is one of the families and every entry of `moments` one of the moments in
  `src/vocabulary.js`, the one list the build, the themes and the MCP server share. Families: soft,
  glass, wood, paper, metal, mechanical, air, chip, synthetic, organic, orchestral, impact, voice (pick the
  character of the source; follow the material tags the sound carries). List only the moments the
  sound is really made for: the MCP server treats them as the catalog's own word ("made for
  toggle-on"), ahead of anything it infers from tags.
- The file lives at `src/sounds/<category>/<id>.js` and the id starts with `<category>-`.
- `play` is a method, `play(T, out, t, p) { ... }`, not an arrow function. It may use `T.*`, its four
  arguments and plain JavaScript (`Math`, loops, local functions and arrays). It may not touch
  `window`, `document`, `Date`, `console`, timers, `Math.random`, `out.context` or create nodes
  itself: everything goes through `T`. It runs in an isolated context at build time, so a free
  variable fails the build.
- Every voice must have stopped by `dur` at every parameter value (the build reports the time a
  voice is still sounding and the settings that caused it). Effects with tails (delay, reverb) are
  checked by the level gate: the render must be below -60 dBFS after `dur`.
- Leave about 10 ms of `dur` past the last envelope end (measured). The master chain's limiter
  looks ahead, so what you hear trails the voices (an impulse into the chain comes out 8.7 ms
  later), and an envelope that ends at a level well above silence (a `'lin'` decay, a `tail`, a
  held note's release) is still sounding at its end in the output. With `dur` exactly at the
  envelope end the level gate's tail check (-60 dBFS after `dur`) fails; 10 ms of margin passes. A
  default exponential decay is far below -60 dBFS in its last milliseconds and gets away without
  it, but the margin costs nothing.
- Never `seed` as a parameter name (Copy uses `p.seed`).
- A sound tagged `loop-cell` is one short cell a host re-triggers on an interval (a loader, an agent
  thinking, a live feed): it falls to silence inside `dur`, and its `desc` names the interval
  ("re-trigger every 1.2 s"). The build checks the desc names a time. See DESIGN.md, "Loop cells
  and silence"; decorative animations (glow, foil, static diagrams) get no sound.

Style: no em dashes anywhere (names, descriptions, comments). Comment the one or two decisions a
reader would question (why a peak is higher, why a filter is narrow).

## Parameters
- Two to five parameters. Each must be audible: if moving it end to end changes little, drop it.
- Give each a `desc`: one line (3 to 100 characters, a capital first, no full stop) saying what
  moving it does, true to the code, with the low and high ends where that helps ("0 a dry tap, 1 a
  short glassy ring"). Do not repeat the unit or the range; the gallery and the MCP server show
  those. For a 0/1 switch say what 1 does and what 0 does.
- A 0/1 switch that means one of the shared roles carries `role` (`src/vocabulary.js`): `on` (1 the
  on direction, 0 off), `open` (1 opening, 0 closing), `chip` (1 an 8-bit square voicing), `go` (1
  the go cue of a countdown), `up` (1 rising or increasing, 0 falling), `pass` (1 allow or valid, 0
  block or invalid), `tick` (1 the recurring per-turn tick, 0 the first application). Tools set a
  switch by its role (build_kit turns toggle-off into `on: 0`), so use the role whatever you name
  the parameter. The build checks a role sits on a switch (`min: 0, max: 1, step: 1`, no unit).
- Short camelCase names that read on a slider: `pitch`, `tone`, `bright`, `gap`, `ring`, `speed`,
  `length`, `weight`, `space`, `rough`, `notes`, `count`.
- Units: `Hz` (shows as Hz or kHz), `s` (shows as ms below one second), `st` (semitones), `x` (a
  ratio). Leave `unit` out for 0..1 amounts.
- `step: 1` for counts; a 0..1 parameter with `step: 1` and no unit shows as off and on.
- A stepped parameter that picks one of several named things (a voice) carries `choices`: kebab-case
  names for the values 0, 1, 2, ... (`{ min: 0, max: 5, def: 1, step: 1, choices: ['announcer-female',
  'announcer', 'deep', 'retro', 'small', 'whisper'] }`). The gallery shows the name (a speech voice's
  display name: Announcer (Female), Announcer (Male), ...), the MCP
  server lists them and takes a name for the number. The build checks min 0, max one less than the
  count, step 1, no unit and no role; `play` maps the number to the name itself
  (`['announcer', ...][Math.round(p.voice)]`).
- `def` is the sound people hear first and the one the gallery draws: make it the best version.
- The whole range must be safe. The level gate renders random settings, so a range that can push the
  peak over -12 or under -36, or a tail past `dur`, fails. Prefer ranges that stay musical end to end
  over ranges that cover everything.
- `play` should be defensive about stepped values: `Math.round(p.count)`.

## The helper kit (T)
Voices and effects take `(out, t, o)` and every option has a default. Voices return the time their
envelope ends; effects return the node to play into (chain by passing it as the next `out`).

| Helper | What it does |
|---|---|
| `T.osc(out, t, o)` | Oscillator. `type` ('sine', 'triangle', 'square', 'sawtooth'), `f`, `to` (pitch glide target), `glide` (s, default 90% of dur), `glideCurve` ('exp', 'lin'), `detune` (cents), `vib: { rate, depth }` (cents), `trem: { rate, depth }` (0..1), `lp` / `hp` (a built-in lowpass / highpass: a cutoff in Hz, or `{ f, to, q, glide, curve }` to sweep it), `wave` (a PeriodicWave) |
| `T.pulse(out, t, o)` | A pulse wave with a variable duty cycle, band-limited (a PeriodicWave of 128 partials): `duty` 0.05..0.95 (default 0.25; 0.5 is a square, 0.125 thin and nasal). Every `osc` option applies |
| `T.noise(out, t, o)` | Seeded white noise through a biquad. `filter` ('bandpass' default, 'lowpass', 'highpass', 'notch', ..., 'none'), `f`, `to` (sweep target), `q`, `glide`, `glideCurve`, plus `lp` / `hp` stages as on `osc` |
| `T.tick(out, t, o)` | A tick or grain: a short band-passed noise burst (`f` default 3000, `q` 1.5, `dur` 0.012, `peak` 0.1) with an optional pitched blip under it (`blip` Hz, `blipTo`, `blipPeak`, `blipDur`, `blipType`), and `jitter` 0..1: seeded variation of the band (up to 25%), level (3 dB) and blip pitch (50 cents). Always draws three values, so the amount never reshuffles later noise |
| `T.crackle(out, t, o)` | Random, non-overlapping noise bursts over a span: `dur` (span), `rate` (bursts per s, default 30), `f` and `to` (the center drifts from one to the other), `spread` (octaves of random center, 0.5), `q`, `len` (burst s, 0.006), `peak` (the loudest burst), `vary` (level spread 0..1, 0.7), `bend` (pitch drift inside a burst). One source carries every burst |
| `T.fm(out, t, o)` | Two-operator FM. `f`, `to`, `ratio` (modulator / carrier), `index`, `index1` (index at the end), `type`, `modType` |
| `T.pluck(out, t, o)` | Karplus-Strong string, computed into a buffer. `f`, `dur` (time to fall 60 dB), `bright` (0..1: how slowly the highs die in the loop), `tone` (0..1: the pick itself, low a soft round thumb, high a hard pick; leave it out for the original excitation), `peak` is the true peak |
| `T.bell(out, t, o)` | Additive partials. `f`, `partials: [[ratio, level, decay], ...]` (default struck metal: 1, 2.76, 5.40, 8.93), `drift` (end pitch ratio, 0.98 = droop) |
| `T.chord(out, t, o)` | Several notes through one voice, the level split so they never peak above `peak` together: `notes` (names, Hz, or with `root` semitones: `[0, 4, 7]`), `root`, `voice` (default `T.osc`; `T.pulse`, `T.pluck`, `T.bell`, `T.fm` work), `strum` (s between onsets, negative strums down), `spread` (detune cents across the notes), `bend` (end pitch ratio); other options go to the voice |
| `T.filter(out, t, o)` | Biquad with an optional sweep. `type`, `f`, `to`, `dur` (sweep s), `q`, `db` (peaking and shelf gain) |
| `T.drive(out, t, o)` | tanh saturation. `amount` 0..1, `ref` (default 0.25): output never exceeds about `ref`, RMS rises |
| `T.crush(out, t, o)` | Bitcrush by quantizing. `bits` 1..16, steps measured against `ref` (0.25); quiet tails gate off |
| `T.delay(out, t, o)` | Feedback echo, dry passes at unity. `time`, `fb` (0..0.9), `mix`, `tone` (lowpass in the loop, Hz) |
| `T.reverb(out, t, o)` | Convolution with a generated, seeded, unit-energy impulse. `time` (s to -60 dB), `mix`, `tone` (0..1), `pre` (s) |
| `T.pan(out, t, o)` | Stereo placement: `x` -1 (left) .. 1 (right), `to` and `dur` to sweep. A balance law: the near side stays at unity, so the centre is exactly mono and placing a voice never raises its peak. A sound that never pans stays mono, and Save WAV writes it as one channel |
| `T.bus(out, t, o)` | A group envelope: one gain shaped by `env` (`peak` default 1) that several voices play into, so a layer swells and fades as one |
| `T.lfo(node, t, o)` | Swings a parameter of a node (what `T.filter` or `T.gain` returned) around its own value: `param` ('frequency' when the node has one, else 'gain'), `rate` Hz, `to` (rate at the end), `depth` (in the parameter's units), `type`, `dur`, `a` (fade-in); fades out over its last 10 ms. Returns the end time |
| `T.dcblock(out, t, o)` | A 20 to 40 Hz highpass (default 30) in one call, for shaped or one-sided material that drifts off zero. `T.dcblock(out)` works |
| `T.gain(out, v)` | A trim stage. Returns its input |
| `T.env(param, t, o)` | The envelope every voice uses (zero first). Percussive by default; ADSR when `s` > 0; `tail` for a slower decay (below) |
| `T.glide(param, t, from, to, dur, curve)` | Move a parameter, exponential by default |
| `T.rand(lo, hi)` | Seeded random: `rand()` in [0, 1), `rand(x)` in [0, x), `rand(lo, hi)` |
| `T.jitter(x, o)` | Seeded variation for repeated sounds: `jitter(x, 0.1)` is x within 10%, `jitter(f, { cents: 30 })` a pitch, `jitter(peak, { db: 2 })` a level, `jitter(opts, { cents, db })` a copy of a voice's options with `f`, `to` and `peak` moved. Draws a fixed number of values (one for a number, two for options) |
| `T.note(n)` | Hz of a note name ('A4', 'C#5', 'Eb3') or of semitones from A4 |
| `T.speak(out, t, o)` | Speech (see Voices): `text` (English; `[W EY1 T]` spells a word in ARPAbet) or `ph` (phonemes), `voice` ('announcer-female', 'announcer' or 'announcer-male', 'deep', 'retro', 'small', 'whisper', or a voice object), `pitch` (semitones from the voice's own), `rate` and `range` (times the voice's), `peak` (default 0.18), `fx` (false: no effect chain). Returns the end time; `T.speak(null, 0, o)` schedules nothing and returns the line's length |
| `T.babble(out, t, o)` | Animalese style talk: a pitched vowel blip per letter or syllable. `text`, `voice` ('cute', 'gruff', 'beep', 'sprite', 'elder'), `pitch` (semitones), `speed` and `spread` (times the voice's speed and pitch spread), `peak`, `fx`. Returns the end time; with `out = null` the length |
| `T.phonemize(text)` | The text front end: English to ARPAbet with stress, `/` between words, punctuation kept ("Access denied." is `AE1 K S EH2 S / D IH0 N AY1 D .`) |
| `T.utter`, `T.chatter` | The engines under speak and babble: phonemes (or a line) and a whole voice object, no front end or voice table. What a baked Copy carries |
| `T.speechVoices()`, `T.babbleVoices()` | The voice tables (name, desc, f0, rate, range, formant, a voice's own vowel table and bandwidth scale, source shape, effect chain) |
| `T.speechPlan`, `T.babblePlan`, `T.klatt`, `T.voiceOut`, `T.phones` | The engine's parts: the planner (durations, targets, pitch as key frames), the synthesizer, the output stage (effects, level, the buffer source) and the phoneme inventory. A sound does not need them |
| `T.seed`, `T.noiseBuffer`, `T.master` | Used by the runtime; a sound does not need them |

Envelope options on every voice: `peak` (linear level before the master chain), `a` (attack s,
default 0.005, at least 0.002), `dur` (total length from `t`, attack included), `curve` ('exp' or
'lin'), and for a held note `s` (sustain as a fraction of peak), `d` (decay s), `r` (release s).
The default decay is exponential all the way to the floor, which falls fast and sounds shorter
than `dur`. For a slower tail give `tail`: the decay (or release) only falls to `tail` times its
starting level (0.05 is -26 dB, 0.2 is -14 dB) and a linear fade of `fade` seconds (default 0.02)
takes it to silence at the end. A tail ends loud, so keep the 10 ms of `dur` margin.

Every new option is a branch that only runs when it is given: a sound that does not use `lp`,
`hp`, `wave`, `tail` or `tone` builds exactly the graph it built before they existed.

## Voices
The `voice` category holds spoken lines and talk babble. Speech is synthesized, never sampled: a
formant synthesizer (`src/core/speech.js`) computes the line sample by sample into one buffer, so it
renders the same everywhere, and the text front end (`src/core/phonetics.js`) turns English into
phonemes. A text cannot be a slider, so each voice sound says one fixed line:
```js
export default {
  id: 'voice-access-denied',
  ...
  dur: 3.2,                       // the slowest rate in the slowest voice, tail included
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 5, def: 1, step: 1, choices: ['announcer-female', 'announcer', 'deep', 'retro', 'small', 'whisper'], desc: 'Who speaks' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
  },
  play(T, out, t, p) {
    const voice = ['announcer-female', 'announcer', 'deep', 'retro', 'small', 'whisper'][Math.round(p.voice)];
    T.speak(out, t, { text: 'Access denied.', voice, pitch: p.pitch, rate: p.rate });
  },
};
```
- **The line.** Plain English: numbers ("3, 2, 1", "42%", "1st"), punctuation (`.` falls, `?` rises,
  `,` lifts a little and pauses, `...` holds a long pause, `!` is emphatic), contractions and
  acronyms without vowels ("TV", spelled). A word the front end gets wrong is fixed in place with its
  ARPAbet in brackets: `'Press [S T AA1 R T] to begin.'`. A word many lines need belongs in the
  lexicon in `src/core/phonetics.js`.
- **Phonemes.** `T.speak` also takes `ph`, ARPAbet separated by spaces: vowels carry their stress
  (0 none, 1 primary, 2 secondary), `/` separates words, the punctuation above makes pauses, and
  `AA1*3` holds a phoneme three times its length.
- **The voices.** A voice sound lists every speech voice in the order a person sees them, by display
  name (Announcer (Female), Announcer (Male), Deep Robot, Retro Computer, Small Robot, Whisper: the
  order of the table in `src/core/speech.js`, which the build test and a voice test hold), and its
  default points at the voice it speaks with. A new voice goes in at its place in that order, so the
  numbers after it move: move each default with them, and any theme override that sets `voice`. The
  ids stay (`announcer` also answers to `announcer-male`), and a Copy carries its own list, so code
  already pasted keeps working. The announcer is a pair on one PA system, both at the same rate, so
  a line lasts as long in either.
- **Its length.** `node build.mjs --say "Access denied."` prints the phonemes and the length in each
  voice at three rates (`--babble` for babble, `--voice <name>` for one); `dur` must cover the
  slowest setting the parameters allow, and the build reports the time a voice is still sounding
  past it. In a sound, `T.speak(null, t, o)` returns the end time without playing, to place
  something after the line; the countdown speaks each number with its own call, on a beat.
- **Level.** Every line is normalized to its `peak` (default 0.18), so it measures -15 dBFS after the
  master chain at any voice, rate or pitch; leave `peak` alone unless the sound layers other voices
  under the speech.
- **Babble.** `T.babble(out, t, { text, voice, pitch, speed, spread })`: each letter (cute, beep,
  sprite) or syllable (gruff, elder) becomes a blip that sings the vowel of the letter's name after
  its consonant; sentence ends pause, a question mark lifts the last blips. Its length never depends
  on the seed, so `T.babble(null, ...)` is exact.
- **Moments.** `announce` for spoken alerts and status lines, `dialogue` for talk; a line made for
  another moment (a whispered scare) may list that one instead.
- **Copy** of a voice sound carries the text front end and the voice table (about 45 KB); the
  gallery's Speak rack and the MCP server's `speak` tool bake a line in as phonemes and carry the
  engine only (about 26 KB).
- `gates/voice.test.mjs` measures the engine (formants by LPC, fricative bands, stop bursts, nasal
  murmur, intonation, determinism; the female announcer's vowels, pitch, voice quality and consonants
  against the male's; the male announcer against `gates/fixtures/announcer.json`, what main rendered)
  and holds the front end to the reviewed table in
  `gates/fixtures/phonemes.tsv`: after changing the rules or the lexicon, review the changed rows and
  update the table. `node gates/voice_wavs.mjs` writes WAVs of every voice to `gates/out/voice/` for a
  listening pass.

## Levels
The level gate writes what it measures to `catalog/levels.json` (peak and RMS at the defaults, the
loudest and quietest peak and the loudest RMS over random settings, the pre-limiter peak and the
audible end), keyed by each sound's fingerprint (a hash of its dur, ranges, play source and the
helpers it uses). The build embeds a measurement in the manifest only while the fingerprint still
matches, so after changing a sound run the level gate and then `node build.mjs` again; the build
says how many sounds carry measured levels. The MCP server prefers these numbers and labels them
measured.

The house range, measured after the master chain on a warm chain, worst of 3 seeds at the defaults
and at 3 random parameter sets:

| Kind | Default peak | Examples |
|---|---|---|
| Loudest hits | -15 to -12 | hammer hit (-15.0), coin flip (-15.2) |
| Effects | -25 to -15 | success chime (-19.1), magic sparkle (-20.0), error buzz (-20.9) |
| Small textures | -28 to -21 | soft click (-23.7), whoosh (-25.2), card flick (-25.8), deck riffle (-26.6) |
| Voices | -15 | every spoken or babbled line is normalized to its peak: access denied (-15.0), cute babble (-15.0) |

Hard limits (the gate fails): peak above -12 or below -36, any sample above -1, the voices' own sum
above -3 before the limiter, DC above -50, anything above -60 after `dur`, silence, NaN.

How to land there:
- On a warm chain, quiet material passes at about unity, so for tonal voices the peak in dBFS is
  roughly `20 * log10(sum of the peaks that overlap)`. A sine at `peak: 0.042` alone lands near
  -27.5 (the soft click adds a noise tick on top and reads -23.7); a triangle at 0.11 lands near -19
  (the success chime).
- Filtered noise lands lower than its `peak`, and a narrow band much lower: the deck riffle needs
  `peak: 0.135` at `q: 2.2` to sit at -26. The whoosh lifts its peak by `sqrt(q)` to hold loudness as
  `q` rises.
- Noise peaks vary with the seed by 1 to 2 dB. The gate takes the worst seed; leave that margin.
- Measure, do not guess: change a peak, rebuild, rerun `check_levels.mjs <id>`.

## Determinism
`T.rand` and every noise voice draw from one seeded stream, reset before each render. A render at
fixed parameters and seed is identical every time, which is what lets the copy gate compare the
pasted function with the gallery to 0.0 dB. Order matters: the same calls in the same order give the
same sound. Use `T.rand` for natural variation (pitch jitter, level jitter); the gallery's Vary
switch then plays a new seed each time.

## Themes
`src/themes/<id>.js` maps app moments to sounds:
```js
export default {
  id: 'arcade',
  name: 'Arcade',
  desc: 'Bright, chunky feedback for games.',
  moments: {
    click: { sound: 'ui-click-soft', params: { pitch: 1800 } },
    coin: { sound: 'game-coin-flip', params: { spins: 3 } },
  },
};
```
Moments are the keys of `MOMENTS` in `src/vocabulary.js` (`click`, `toggle-on`, `toggle-off`,
`success`, `error`, `notify`, `hit`, `pickup`, `coin`, `level-up`, ...); the build rejects any other
name and suggests the near ones. A moment the vocabulary lacks is added there once, with its hints
for the MCP server, and then every theme can use it. Sounds must exist and overrides must be
parameters of that sound, inside its range. Reuse the same moment names across themes so apps can
swap themes as a set.

## Checking one sound
```
node build.mjs                          # validation and the mock run; writes dist/ and catalog/
node gates/check_levels.mjs game-laser  # the level table for ids containing "game-laser"; updates catalog/levels.json
node build.mjs                          # embeds the new measurement in the manifest
node gates/check_copy.mjs game-laser    # the pasted Copy matches the gallery within 0.5 dB
```
Both browser gates launch one headless Edge or Chrome and close it. On a machine shared with other
agents, run them through the browser queue, one at a time, for example
`node <path>/guard_wait.mjs 1800 600 node gates/check_levels.mjs game-laser`. Never run two browser
gates at once.

Common build messages:
- `a voice is still sounding at 0.52 s, past dur 0.4 s, at all max`: raise `dur` or shorten the
  voices at the extreme settings named.
- `play throws at random #3 {...}: ... negative time`: something schedules before `t` (a `t - x`).
- `play uses Math.random`: use `T.rand()`.
- `T.zap does not exist`: the helper list in the message is the whole kit.

Before you commit: `node build.mjs` (so `dist/` and `catalog/` match the sources), then
`bash gates/run_all.sh` (with `TIMBRE_BROWSER_WRAP` set on a shared machine). It also runs the MCP
server's tests and its kit check, and fails if the level gate changed `catalog/levels.json` without
a rebuild.
