<div align="center">

# ♪ Timbre

**Every sound, synthesized. Nothing downloaded.**

A single-file gallery of **360** offline, synthesized sound effects, built to be auditioned by humans *and* driven by AI agents. Every sound is a small WebAudio recipe, not a sample, so anything you copy out of Timbre plays anywhere, forever, including fully offline. Ships with a **zero-dependency MCP server** so Claude (Desktop, Code, or the API) can pick sounds for an app and hand back ready-to-paste code.

![Sounds](https://img.shields.io/badge/sounds-360-ff9900) ![Categories](https://img.shields.io/badge/categories-15-4493f8) ![Themes](https://img.shields.io/badge/themes-10-e0a52b) ![Dependencies](https://img.shields.io/badge/dependencies-0-3fb950) ![Offline](https://img.shields.io/badge/offline-100%25-3fb950) ![MCP](https://img.shields.io/badge/MCP-server%20included-c879ff) ![Single file](https://img.shields.io/badge/single%20file-HTML-e0a52b)

</div>

---

## What Timbre is

Timbre is **one HTML file**, `dist/timbre.html`, containing a whole library of interface and game sounds: clicks, toggles, toasts, alarms, loaders, chart reveals, map pins, packet hops, AI thinking states, card handling, creature-battle strikes, magic, screen effects, sci-fi consoles, ambient beds, short music stings and synthesized voices. Every sound is built from oscillators, seeded noise, filters, envelopes, waveshapers, delays and generated reverbs. No samples, fonts, scripts or CDNs are fetched.

It is the audio sibling of [Prism](https://github.com/k33bz/Prism), the CSS/SVG component gallery: many of its sounds were made to sit under Prism's animations, moment for moment.

It serves two audiences from the same source of truth:

- **Humans** open the file in a browser, audition every sound with live parameter sliders, and hit **Copy** for one self-contained JavaScript function or **Save WAV** for a 48 kHz file.
- **AI agents** talk to the **Timbre MCP server** (in [`mcp-server/`](./mcp-server)) to turn *"a meditation timer with gentle taps"* into ranked picks with reasons, or to get one module that plays a whole app's sounds with `play('click')`.

---

## Quick start (just open the file)

Try it live at **[timbre.k33bz.com](https://timbre.k33bz.com)** (the gallery itself is at [/timbre.html](https://timbre.k33bz.com/timbre.html); `#ui` opens a category, `#ui-cascade` a sound), or open `dist/timbre.html` in a browser. It works from disk, offline; nothing is fetched. Sound starts on your first click (browsers require a gesture). Press `/` to search.

Every card shows a waveform rendered offline, the sound's duration, peak and RMS, its parameters as sliders, and a **Vary** switch that draws a new noise seed on each play. Pick a **theme** to hear a whole app's worth of moments as one set.

---

## The categories

| Category | Sounds | A few of them |
|---|---|---|
| UI | 45 | Soft Click, Glass Click, Checkbox, Tab Switch, Sheet Snap, Star Rating, Keypad Key, Stagger Cascade |
| Notifications | 25 | Toast Arrive, Critical Alarm, Badge Pop, Banner Drop, Presence Change, Achievement Unlocked |
| Data | 27 | Load Pulse, Spinner Ticks, Progress Fill, Bar Rise, Gauge Needle, Pin Drop, Packet Hop, Failover |
| AI | 10 | Thinking Hum, Typing Dots, Token Stream, Tool Call, Agent Handoff, Retrieval Sweep, Guardrail Verdict |
| Game | 29 | Coin Flip, Arrow Shot, Bounce, Checkpoint, Combo Ping, Countdown Beep, Your Turn Jingle, Referee Whistle |
| Battle | 35 | eleven element strikes, eight attack archetypes, status conditions, Knockout, Evolve, Coin Chain |
| Cards | 27 | Card Deal, Card Reveal, Card Tap, Table Wash, Hand Sweep, Chip Stack, Dice Roll |
| Ink Duel | 42 | Well Drip, Exert Tilt, Lore Gain, Duel Clash, Banish Shatter, six ink hues, ten keywords |
| Magic | 12 | Arcane Charge, Enchant, Fire Spell, Ice Spell, Healing Shimmer, Curse Hex |
| Screen effects | 19 | Glitch Burst, Neon Strike, CRT Power, Hologram On, Scramble Decode, Confetti Pop, Firework |
| Sci-fi | 13 | Facility Klaxon, Laser Zap, Blaster Bolt, Data Stream, Hologram Flicker |
| Dark | 27 | Cathedral Choir, Organ Minor Swell, Cello Drone, Doom Braam, Horror Strings, Funeral Bell, Music Box, Heartbeat in the Dark |
| Ambience | 20 | Aurora Pad, Cave Drips, Distant Thunder, Night Crickets, Storm Roar, Grid Hum (8 s fading beds) |
| Music | 9 | Short Fanfare, Level Complete, Defeat Jingle, Intro Logo Sting, Menu Confirm Melody |
| Voice | 20 | Warning, Access Denied, Countdown, Containment Breach, Your Turn Call, robot lines, five babble voices |

Battle and Ink Duel are fan-made, unbranded sounds for the generic mechanics of creature-battle and ink-and-lore trading card games: no game, card or character names anywhere.

Dark is built on five sustained instruments in `src/core/instruments.js`: a bowed string section (`bow`), a choir on the formant engine (`choir`), a pipe organ (`organ`), timpani, taiko and toms (`membrane`) and the endless Shepard glissando (`shepard`). Any sound can use them, and Copy carries them like every other helper.

Loaders, thinking states and live-data sounds are **loop cells**: one short cell meant to be re-triggered on an interval, which each one's description names.

---

## Soundscapes

Every ambience bed (rain, surf, fire, wind, birds, crickets, drones and more, 19 in all) can **loop seamlessly**: the engine renders it long, finds its steady middle and crossfades the end back into the start at a phase-matched point, so it plays for ever without a gap or a click. A **soundscape** layers looping beds with **events**, one-shot sounds fired at random intervals, each a little different (Thunder Strike over rain, a door creaking upstairs).

Presets: **Rain and Thunder**, **Storm at Sea**, **Ocean and Rain**, **Campfire Night**, **Cozy Cabin**, **Forest Dawn**, **Deep Cave**, **Haunted House** and **Deep Space** (`src/scapes/`). In the gallery every bed has a **Loop** button and the **Soundscape** rack edits layers live; its Copy gives the whole soundscape as one function:

```js
const ac = new AudioContext();
const scape = rainAndThunder(ac);   // beds loop, thunder rolls in now and then
scape.setLevel(0, 0.6);               // turn the rain down
scape.stop(2);                        // fade out over 2 s
```

---

## Themes

A theme maps app moments (`click`, `toggle-on`, `success`, `error`, `loading`, `critical`, `select`, `thinking`, `score`, ...) to a sound and parameter overrides in the theme's own key, register and loudness, so a whole set can be swapped at once.

**Soft UI** (the default), **Glass**, **Wood and Paper**, **Mechanical**, **8-bit**, **Arcade**, **Sci-fi Console**, **Fantasy**, **Gothic** (organ, choir, bells and stone) and **Dread** (strings, heartbeat and sub hits). One shared list of 102 moment names (`src/vocabulary.js`) is used by the themes, the build and the MCP server.

---

## Voices

A formant speech synthesizer in the page: Klatt's cascade/parallel design computed sample by sample, so it renders the same everywhere, with an English text front end (the NRL letter-to-sound rules and a small lexicon).

- **Speech voices:** **Announcer (Female)** and **Announcer (Male)**, one classic synthesized PA system with two speakers (vowel targets from Peterson and Barney's 1952 women's and men's averages, hers lifted for a shorter vocal tract, with a young, higher, quicker and livelier voice), Deep Robot, Retro Computer, Small Robot and Whisper.
- **Babble voices:** Cute, Gruff, Robot Beep, Tiny Sprite and Wise Elder, for text boxes and speech bubbles.
- Every voice list (the Speak rack, a voice sound's slider, `build.mjs --say`, the MCP server) is in display-name order.
- The **Speak** rack says any typed line; its Copy bakes the line into one function that carries only the engine.

---

## Install the MCP server

The [Model Context Protocol](https://modelcontextprotocol.io) lets an AI agent call tools over a well-defined interface. The bundled server exposes the catalog as **9 tools**: `info`, `search_sounds`, `suggest_sounds`, `get_sound`, `get_copy`, `list_themes`, `get_theme`, `build_kit` and `speak`. It has **zero runtime dependencies** (Node.js 22 or newer) and speaks MCP over **stdio**.

### 1. Get the code

```bash
git clone https://github.com/k33bz/timbre.git
cd timbre
node build.mjs          # makes sure catalog/ is current
```

There is **nothing to `npm install`**.

### 2. Check it without a client

```bash
node mcp-server/cli.js info      # catalog stats
npm test --prefix mcp-server     # the server's tests
```

### 3. Connect it to a client

```bash
# Claude Code (add --scope user for every project)
claude mcp add timbre -- node /absolute/path/to/timbre/mcp-server/cli.js start
```

```jsonc
// Claude Desktop: claude_desktop_config.json
// (macOS ~/Library/Application Support/Claude/, Windows %APPDATA%\Claude\)
{ "mcpServers": { "timbre": { "command": "node", "args": ["/absolute/path/to/timbre/mcp-server/cli.js", "start"] } } }
```

The tools, the module `build_kit` writes, the moods `suggest_sounds` understands and how levels are measured or estimated are in [mcp-server/README.md](mcp-server/README.md).

---

## Use a copied sound

```js
// Usage: const ac = new AudioContext(); uiClickSoft(ac, { pitch: 1100 }); ...
function uiClickSoft(ac, opts, when, dest) { /* helpers + the recipe, generated by Copy */ }

const ac = new AudioContext();
button.addEventListener('click', () => uiClickSoft(ac));
```

`opts` overrides the parameter values baked in at copy time (and `seed`), `when` is the earliest start time, `dest` an optional node to end in. The function returns the time the sound ends. The first call on a context builds the master chain and starts the sound 0.2 s later, while the limiter warms up; later calls play at once. A Copy carries only the helpers its sound uses, and renders the same as the gallery (the copy gate checks this to 0.5 dB, per channel).

---

## Add a sound in three steps

1. Write `src/sounds/<category>/<id>.js`: id, name, category, tags, desc, dur, params and a `play(T, out, t, p)` that uses the helper kit `T`. Start from a sound in the same category. A spoken line uses `T.speak` (`node build.mjs --say "Your line."` prints its phonemes and length; `--voice announcer-female` for one voice).
2. Run `node build.mjs`. It validates every sound (fields, parameter ranges, `play` run in isolation at the defaults, the extremes and random settings) and rebuilds `dist/timbre.html` and the catalog.
3. Run the gates (below), tune until the level gate passes, then listen in the page.

The full contract, the helper API and the level targets are in [docs/ADDING_SOUNDS.md](docs/ADDING_SOUNDS.md); the design is in [docs/DESIGN.md](docs/DESIGN.md).

---

## Run the gates

```bash
node build.mjs --check          # sources valid, dist/ and catalog/ up to date
node --test gates/*.test.mjs    # unit tests: build validation, Copy tree-shaking, core helpers, WAV, voices
npm test --prefix mcp-server    # the MCP server's tests
node gates/check_levels.mjs     # every sound, 12 renders each, against the house level range
node gates/check_page.mjs       # the page: cards, Play, keyboard, filters, theme, WAV, Copy, phone width
node gates/check_copy.mjs       # each Copy pasted into a blank page matches the gallery, per channel
node mcp-server/scripts/check_kit.mjs   # a build_kit module renders what each Copy renders
bash gates/run_all.sh           # all of the above, browser gates one at a time
node gates/voice_wavs.mjs       # a listening pass: every voice as WAVs in gates/out/voice/
```

The browser gates need Edge or Chrome (set `TIMBRE_BROWSER` for another Chromium-family binary). Each launches one headless browser with muted audio and kills its whole process tree when done. Where browser jobs must queue, set `TIMBRE_BROWSER_WRAP` to the queue command prefix and `run_all.sh` runs each browser gate through it.

---

## Repository layout

```
src/core/          synth library (T): seeded noise, envelopes, voices, effects, master chain; the
                   speech engine and its text front end; offline render and measurement, WAV
                   encoder, Copy builder
src/sounds/<category>/<id>.js   one sound per file
src/themes/<id>.js              sound themes: moment -> sound + parameter overrides
src/vocabulary.js  the one list of moments, families and parameter roles (build, themes, MCP server)
src/shell/         the gallery page: index.html template, style.css, app.js
build.mjs          validates, writes catalog/manifest.json and catalog/index.json, bundles dist/timbre.html
catalog/           manifest.json (every field, play source, helpers, Copy contract, vocabulary,
                   measured levels); index.json (search fields); levels.json (the level gate)
dist/timbre.html   the single page (generated; do not edit by hand)
website/           the timbre.k33bz.com landing page; `node website/build.mjs <outdir>` writes it
                   with the gallery beside it (Pages runs this on every push to main)
gates/             unit tests and the level, page and copy gates
mcp-server/        MCP server over the catalog (tools, tests, smoke run)
```

---

## Design principles

- **Synthesized, not sampled.** Every sound is code: small, seedable, tweakable, and free of licensing questions about recordings.
- **Measured, not guessed.** Every sound renders through the same master chain and is gated to the house level range at its defaults and at random settings; the numbers travel in the catalog.
- **What you copy is what you heard.** A Copy is one function with only the helpers it needs, checked against the gallery's own render.
- **One vocabulary.** Sounds, themes, the build and the MCP server share one list of moments, families and parameter roles.
- **Offline forever.** One file, no network, no dependencies.

---

## License

[MIT](LICENSE)
