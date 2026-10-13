# Timbre MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server over the Timbre sound catalog. An
agent can describe an app ("a meditation timer that rings when done, gentle taps"), get ranked
candidate sounds with reasons, read a sound's parameters and levels, and take away working code:
one self-contained function per sound, **one JavaScript module** with `play(moment)` for a whole
interface, or one function that says a line of text in a synthesized voice.

- **Zero dependencies.** Plain Node 22, MCP's JSON-RPC 2.0 over stdio (the transport Claude Code and
  Claude Desktop launch), like the Prism server it follows in style.
- **Reads the catalog the build writes** (`catalog/manifest.json`, default `../catalog`), and re-reads
  it when it changes, so a rebuilt catalog shows up without a restart.
- **Same code as the gallery.** `get_copy` reproduces the Copy button's output byte for byte; a test
  proves it for every sound.
- **Works with whatever the catalog holds.** New categories, tags and themes are picked up with no
  change here; a malformed sound is skipped with a warning instead of taking the server down.
- **Uses the catalog's own word before guessing.** A sound's family and the moments it was made
  for, each parameter's description and switch role, the measured levels, the version and the Copy
  contract all come from the catalog (schema 2) when it has them; inference fills in only what a
  sound does not declare.
- **One vocabulary with the build.** The moment names come from the repository's
  `src/vocabulary.js`, the same list the build checks sounds and themes against, so the server needs
  that file beside it (it lives in the Timbre checkout).

## Connect it

You need Node 22 or later. The server lives in `mcp-server/` of the Timbre repository; use the
absolute path to `cli.js` (forward slashes work on Windows too).

### Claude Code

```
claude mcp add timbre -- node /absolute/path/to/timbre/mcp-server/cli.js start
```

Add `--scope user` to make it available in every project, or `--scope project` to write it to the
project's `.mcp.json`. The same thing by hand, in `.mcp.json` (project) or `~/.claude.json` (user):

```json
{
  "mcpServers": {
    "timbre": {
      "command": "node",
      "args": ["/absolute/path/to/timbre/mcp-server/cli.js", "start"]
    }
  }
}
```

Check it with `claude mcp list` or `/mcp` inside Claude Code: `timbre` should show nine tools.

### Claude Desktop

Edit `claude_desktop_config.json` (Settings, Developer, Edit Config), then restart Claude Desktop:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "timbre": {
      "command": "node",
      "args": ["C:/Users/you/timbre/mcp-server/cli.js", "start"]
    }
  }
}
```

If Desktop cannot find `node`, give the full path to it in `command`.

### Options

| Flag | Environment | What it does |
|---|---|---|
| `--catalog <dir>` | `TIMBRE_CATALOG` | Catalog directory holding `manifest.json` (a path to the file works too). Default `../catalog`. |
| `--levels <file>` | `TIMBRE_LEVELS` | Level report from the level gate, used for sounds the catalog carries no measured levels for. Default: `levels.json` beside the catalog, then `../gates/out/levels.json`. `none` ignores every measured level (the catalog's too), so everything is estimated. |
| `--no-cache` | `TIMBRE_MCP_CACHE` | Estimated levels are kept between runs in the platform cache directory (or the directory in `TIMBRE_MCP_CACHE`); this turns it off. |
| `--log-level <lvl>` | `TIMBRE_MCP_LOG_LEVEL` | `debug`, `info`, `warn` (default), `error` or `silent`. Logs go to stderr only. |

To try it without a client: `node cli.js info`, `node cli.js tools`, or run any tool directly,
for example `node cli.js call search_sounds '{"query":"coin"}'`.

## The tools

All nine only read the catalog and compute; none writes anything, and they are marked read-only.
Each description tells the agent when to reach for it and which neighbour to use instead.

| Tool | Use it to |
|---|---|
| `info` | Start here: version, sounds per category and per family, themes, loudness bands, the moments the suggestion tools understand, the parameter roles, the Copy contract, where the level numbers come from. |
| `suggest_sounds` | Turn a plain description of an app or moment into ranked candidates per moment, with reasons, a fit mark (`strong` or `loose`) and loudness. A sound made for the moment (its `moments`) is a strong match and says so. |
| `search_sounds` | Keyword search over name, tags, moments, family, description and category, with plurals and near-synonyms, filters (category, `family`, `max_duration`, `min_duration`, `loudness`, `tags`) and paging. |
| `get_sound` | Read one sound: family and moments; parameters with ranges, defaults, control kind, what each does and a switch's role; levels; the themes using it; similar sounds; its Copy code at the defaults. |
| `get_copy` | Get the self-contained function for one sound with chosen parameter values (and seed) baked in. |
| `list_themes` / `get_theme` | See the themes (moment-to-sound maps) and one theme's moments with their effective parameters. |
| `build_kit` | Generate one module for an app: `play(moment, opts)`, every helper once, one shared master chain, lazy AudioContext. |
| `speak` | Get one function that says a line of text (or babbles it) in a synthesized voice, the line baked in: the gallery's Speak rack Copy. |

Code comes back as its own content block after a short JSON block of facts, so it arrives as plain
text and not as an escaped string.

### A typical session

```
suggest_sounds { "description": "a todo app: check things off, delete, a reminder, soft and quiet" }
   -> toggle-on: ui-toggle-switch ..., delete: ui-delete ..., reminder: notify-calendar ..., mood: calm
build_kit { "moments": ["toggle-on", "delete", "reminder"], "mood": "calm" }
   -> a table of what plays for each moment and why, plus the module
get_copy { "id": "ui-click-soft", "params": { "pitch": 900 } }
   -> just that one function, pitch baked in
```

### What `get_copy` guarantees

The text is what the gallery's Copy button produces for the same values: one function named after
the sound (`ui-click-soft` becomes `uiClickSoft`), `fn(ac, opts, when, dest)`, only the helpers it
uses, the shared master chain (gain 0.55, a limiter, a tanh ceiling), the 0.2 s warm-up rule, and the
end time as its return value. `test/copy-parity.test.js` compares it with `src/core/copy.js` and with
the page runtime assembled the way `build.mjs` assembles it, for every sound at six parameter sets.
Differences from the gallery, both deliberate: unknown parameter names are an error (the gallery has
no way to type one), and values outside a range are clamped *and reported*.

### What `speak` gives

`speak { "text": "Containment breach. Evacuate the facility.", "voice": "announcer" }` returns the
phonemes the text was read as, the line's length and one function,
`sayContainmentBreachEvacuateThe(ac, opts, when, dest)`, that says it. The text front end ran on the
server, so the function carries the phonemes and only the synthesizer, the voice and the master chain
(about 26 KB). Speech voices: announcer (a classic synthesized PA voice), deep and small (robots),
whisper, retro (an 8-bit home computer); `mode: "babble"` gives Animalese style talk instead (cute,
gruff, beep, sprite, elder). pitch, rate and range (speed and spread for babble) and the seed are
baked in and can change in `opts` at play time; values out of range are clamped and reported. A word
read wrong is fixed in the text with its ARPAbet in brackets: `"Press [S T AA1 R T] to begin."`. The
engine is compiled from the catalog's own helper sources, so `speak` needs a catalog built with
voices; `test/speak.test.js` holds its output byte for byte to the gallery's Speak rack.

A parameter with named values (a voice sound's `voice`) is listed with `control: "choice"` and its
`choices`; `get_copy` and `build_kit` take the name (`{ "voice": "deep" }`) as well as the number.

### The module `build_kit` writes

```js
import { play, prime } from './sounds.js';

document.addEventListener('pointerdown', prime, { once: true });   // optional: warm the limiter early
button.addEventListener('click', () => play('click'));
play('coin', { pitch: 1800 });          // override a parameter (clamped to its range)
play('hit', { when: ctx.currentTime + 0.5, seed: 7 });
```

| Export | |
|---|---|
| `play(moment, opts)` | Plays a moment; returns the end time (AudioContext seconds) or `null`. `opts`: parameter overrides, plus `seed`, `when` (earliest start), `dest` (node to end in). Unknown moments return `null`, never throw. |
| `prime()` | Creates the context and builds the master chain now. Call it from the first user gesture so the first real sound does not wait 0.2 s. |
| `has(moment)`, `moments` | Which moments the kit has. |
| `setMuted(on)` | Silences `play()`. |
| `getContext()` | The AudioContext, or `null` before first use. |

Details: the AudioContext is created on the first `play()` or `prime()`, never at load. All moments
share one master chain per destination, kept on the context in `ac.timbreChains`, the same slot a
pasted Copy function uses, so mixing a kit and a pasted Copy on one context still builds one chain.
`format: "script"` gives a classic script that defines one global (`global_name`, default
`timbreKit`). `vary: true` draws a fresh noise seed per play.

A moment can also set a parameter: `toggle-on` and `toggle-off` set a sound's `on` switch,
`open` and `close` set its `open` switch, and the `retro` mood turns a sound's `chip` switch on.
These are parameter roles: the switch is found by its `role` in the catalog, whatever it is called,
and by its name only in a catalog without roles. A mood also lifts the sounds of its family (calm:
soft; glassy: glass; retro: chip; ...) the way it lifts sounds carrying its tags.
How a moment gets its sound, in order: the theme (if you named one, or your `mood` names one such as
"soft ui"), then your explicit `{ moment, sound, params }`, then the best catalog match for the
moment, shaped by the mood. Every choice carries its reason; loose matches and anything repaired or
clamped are listed under `warnings`; moments nothing fits are listed under `unresolved`.

## Levels: measured when possible, estimated otherwise

The level gate (`gates/check_levels.mjs`) measures every sound in a browser and writes
`catalog/levels.json`; the build embeds each measurement in the manifest while the sound's
fingerprint still matches what was measured. So, for each sound:

- When the catalog carries its levels, they are **measured** (`"source": "measured"`, `"from":
  "catalog"`), with the loudest and quietest peak over random settings and the audible end.
- Otherwise, when a report is found (`--levels`, `TIMBRE_LEVELS`, `levels.json` beside the catalog,
  or the gate's full `../gates/out/levels.json`), its numbers are **measured** too (`"from":
  "report"`); an entry that names a fingerprint is used only for that version of the sound.
- For every sound neither covers, the server **estimates**: it runs the sound's own recipe
  against a recording mock of the audio graph, plays that back through a small offline renderer
  (oscillators, the seeded noise, filters, envelopes, shapers) and the master chain's warm steady
  state, and reads peak and RMS the way the gate does. Reverb and delay tails are not simulated.
  Against the gate on the first 133 sounds: peak within 0.8 dB on average (median 0.4, worst 3.8),
  the same loudness band for 123 of 133. Estimates carry `"source": "estimated"`.

The bands used by the `loudness` filter, on the default peak after the master chain: `quiet` up to
-23 dBFS (clicks, ticks, air), `medium` -23 to -17 (ordinary cues), `loud` above -17 (the loudest
hits; the house range ends at -12). Estimates are made in the background after startup and kept in a
cache file between runs; a first loudness filter on a cold start may take a few seconds.

## Tests

```
npm test            # node --test: the whole suite
npm run smoke       # the server as a child process, real JSON-RPC over stdio
```

The suite covers the loader, the Copy parity with the gallery, the offline renderer and the level
estimate (checked against a stored copy of the gate's report), search, suggestions, kits (generated
modules are executed against a strict audio mock, as ESM and as a script), every tool, the protocol
and the stdio framing, the CLI, and the catalog's own fields (family, moments, roles, measured levels;
`test/fields.test.js`). Tests that need the Timbre sources next to this package skip
themselves when it stands alone.

One optional check needs a browser: `npm run check:kit` (`scripts/check_kit.mjs`) builds a kit that
covers every helper the catalog uses, loads it in one headless Edge or Chrome, and requires each
moment to render the same signal as that sound's `get_copy` function in a real Web Audio engine
(offline contexts), the context to appear only on the first play, and one master chain to be shared.
It uses `gates/lib/browser.mjs`, so the same rules apply: one browser at a time, and on a shared
machine run it through your browser queue (`TIMBRE_BROWSER` picks the binary).

`scripts/make-levels-fixture.mjs` refreshes `test/fixtures/levels-gate.json` from a new gate report.

## Layout

```
cli.js            start | info | tools | call
index.js          the server: JSON-RPC dispatch, stdio transport
tools/index.js    the nine tools (descriptions, schemas, handlers)
lib/catalog.js    loads and watches the catalog          lib/copy.js     Copy, rebuilt from the catalog
lib/search.js     ranked search                          lib/suggest.js  moments and moods to sounds
lib/moments.js    moods; moments from src/vocabulary.js  lib/kit.js      resolve choices, write the module
lib/levels.js     measured and estimated levels          lib/render.js   offline renderer for the estimate
lib/speech.js     the speech runtime, compiled from the catalog's helper sources
lib/mockaudio.js  recording audio mock                   lib/schema.js   argument checking
scripts/smoke.js  the stdio smoke run                    test/           node --test suites and fixtures
scripts/check_kit.mjs  browser check of a generated kit
```
