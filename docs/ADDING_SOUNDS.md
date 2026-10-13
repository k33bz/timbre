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
  category: 'game',                     // ui, notify, game, cards, magic, scifi, ambience, music
  tags: ['laser', 'zap', 'shoot'],      // lowercase kebab-case words people would search for
  desc: 'A bright falling zap for a shot fired.',  // 10 to 200 characters, one or two sentences
  dur: 0.4,                             // seconds, tail included, at ANY parameter values
  params: {
    pitch: { min: 600, max: 3000, def: 1800, unit: 'Hz' },
    drop: { min: 0.1, max: 0.9, def: 0.6 },
    shots: { min: 1, max: 3, def: 1, step: 1 },
  },
  play(T, out, t, p) {
    for (let k = 0; k < Math.round(p.shots); k++) {
      T.osc(out, t + k * 0.1, { type: 'square', f: p.pitch, to: p.pitch * (1 - p.drop), dur: 0.12, peak: 0.03 });
    }
  },
};
```
Rules the build checks:
- Exactly these fields: `id`, `name`, `category`, `tags`, `desc`, `dur`, `params`, `play`. Anything
  else (a `description`, a `label`) is an error, so typos cannot hide.
- The file lives at `src/sounds/<category>/<id>.js` and the id starts with `<category>-`.
- `play` is a method, `play(T, out, t, p) { ... }`, not an arrow function. It may use `T.*`, its four
  arguments and plain JavaScript (`Math`, loops, local functions and arrays). It may not touch
  `window`, `document`, `Date`, `console`, timers, `Math.random`, `out.context` or create nodes
  itself: everything goes through `T`. It runs in an isolated context at build time, so a free
  variable fails the build.
- Every voice must have stopped by `dur` at every parameter value (the build reports the time a
  voice is still sounding and the settings that caused it). Effects with tails (delay, reverb) are
  checked by the level gate: the render must be below -60 dBFS after `dur`.
- Never `seed` as a parameter name (Copy uses `p.seed`).

Style: no em dashes anywhere (names, descriptions, comments). Comment the one or two decisions a
reader would question (why a peak is higher, why a filter is narrow).

## Parameters
- Two to five parameters. Each must be audible: if moving it end to end changes little, drop it.
- Short camelCase names that read on a slider: `pitch`, `tone`, `bright`, `gap`, `ring`, `speed`,
  `length`, `weight`, `space`, `rough`, `notes`, `count`.
- Units: `Hz` (shows as Hz or kHz), `s` (shows as ms below one second), `st` (semitones), `x` (a
  ratio). Leave `unit` out for 0..1 amounts.
- `step: 1` for counts; a 0..1 parameter with `step: 1` and no unit shows as off and on.
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
| `T.osc(out, t, o)` | Oscillator. `type` ('sine', 'triangle', 'square', 'sawtooth'), `f`, `to` (pitch glide target), `glide` (s, default 90% of dur), `glideCurve` ('exp', 'lin'), `detune` (cents), `vib: { rate, depth }` (cents), `trem: { rate, depth }` (0..1) |
| `T.noise(out, t, o)` | Seeded white noise through a biquad. `filter` ('bandpass' default, 'lowpass', 'highpass', 'notch', ..., 'none'), `f`, `to` (sweep target), `q`, `glide`, `glideCurve` |
| `T.fm(out, t, o)` | Two-operator FM. `f`, `to`, `ratio` (modulator / carrier), `index`, `index1` (index at the end), `type`, `modType` |
| `T.pluck(out, t, o)` | Karplus-Strong string, computed into a buffer. `f`, `dur` (time to fall 60 dB), `bright` (0..1), `peak` is the true peak |
| `T.bell(out, t, o)` | Additive partials. `f`, `partials: [[ratio, level, decay], ...]` (default struck metal: 1, 2.76, 5.40, 8.93), `drift` (end pitch ratio, 0.98 = droop) |
| `T.filter(out, t, o)` | Biquad with an optional sweep. `type`, `f`, `to`, `dur` (sweep s), `q`, `db` (peaking and shelf gain) |
| `T.drive(out, t, o)` | tanh saturation. `amount` 0..1, `ref` (default 0.25): output never exceeds about `ref`, RMS rises |
| `T.crush(out, t, o)` | Bitcrush by quantizing. `bits` 1..16, steps measured against `ref` (0.25); quiet tails gate off |
| `T.delay(out, t, o)` | Feedback echo, dry passes at unity. `time`, `fb` (0..0.9), `mix`, `tone` (lowpass in the loop, Hz) |
| `T.reverb(out, t, o)` | Convolution with a generated, seeded, unit-energy impulse. `time` (s to -60 dB), `mix`, `tone` (0..1), `pre` (s) |
| `T.gain(out, v)` | A trim stage. Returns its input |
| `T.env(param, t, o)` | The envelope every voice uses (zero first). Percussive by default; ADSR when `s` > 0 |
| `T.glide(param, t, from, to, dur, curve)` | Move a parameter, exponential by default |
| `T.rand(lo, hi)` | Seeded random: `rand()` in [0, 1), `rand(x)` in [0, x), `rand(lo, hi)` |
| `T.note(n)` | Hz of a note name ('A4', 'C#5', 'Eb3') or of semitones from A4 |
| `T.seed`, `T.noiseBuffer`, `T.master` | Used by the runtime; a sound does not need them |

Envelope options on every voice: `peak` (linear level before the master chain), `a` (attack s,
default 0.005, at least 0.002), `dur` (total length from `t`, attack included), `curve` ('exp' or
'lin'), and for a held note `s` (sustain as a fraction of peak), `d` (decay s), `r` (release s).

## Levels
The house range, measured after the master chain on a warm chain, worst of 3 seeds at the defaults
and at 3 random parameter sets:

| Kind | Default peak | Examples |
|---|---|---|
| Loudest hits | -15 to -12 | hammer hit (-15.0), coin flip (-15.2) |
| Effects | -25 to -15 | success chime (-19.1), magic sparkle (-20.0), error buzz (-20.9) |
| Small textures | -28 to -21 | soft click (-23.7), whoosh (-25.2), card flick (-25.8), deck riffle (-26.6) |

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
Moments are kebab-case (`click`, `toggle-on`, `toggle-off`, `success`, `error`, `notify`, `hit`,
`pickup`, `coin`, `level-up`, ...). Sounds must exist and overrides must be parameters of that sound,
inside its range. Reuse the same moment names across themes so apps can swap themes as a set.

## Checking one sound
```
node build.mjs                          # validation and the mock run; writes dist/ and catalog/
node gates/check_levels.mjs game-laser  # the level table for ids containing "game-laser"
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
`bash gates/run_all.sh` (with `TIMBRE_BROWSER_WRAP` set on a shared machine).
