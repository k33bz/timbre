#!/usr/bin/env node
// The timbre.k33bz.com site. Zero dependencies, Node 22.
//   node website/build.mjs <outdir>
// Writes <outdir>/index.html (this landing page), <outdir>/timbre.html (the gallery, byte for byte
// the committed dist/timbre.html) and the favicon. The landing page runs the library's own code:
// the core helpers, T, the sounds it plays (play functions straight from src/sounds) and the render
// and copy runtime, bundled the way build.mjs bundles the gallery. Every count on the page comes
// from the validated sounds, themes, voices and MCP tool list, so nothing here can drift.
// Fails when dist/timbre.html is stale, a featured sound or theme moment is missing, or the page
// would load anything from another origin.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, moduleText, safeScript, version, ROOT, CATEGORIES } from '../build.mjs';
import { HELPER_MODULES, T } from '../src/core/t.js';
import { playSource } from '../src/core/copy.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// The hero's three pads and the eight live cards (one per category family, all under 3 s).
const HERO = [
  { id: 'ui-click-soft', label: 'Soft click' },
  { id: 'notify-success-chime', label: 'Success' },
  { id: 'game-gem-collect', label: 'Gem collect' },
];
const CARDS = ['ui-cascade', 'notify-success-chime', 'data-split-flap', 'ai-token-stream', 'game-power-up', 'cards-riffle', 'magic-spell-cast', 'scifi-warp-jump'];
// The theme desk's pads: moments every theme maps.
const PADS = [
  { m: 'click', label: 'Click' }, { m: 'toggle-on', label: 'Toggle on' }, { m: 'type', label: 'Type' }, { m: 'open', label: 'Open' },
  { m: 'success', label: 'Success' }, { m: 'notify', label: 'Notify' }, { m: 'warning', label: 'Warning' }, { m: 'error', label: 'Error' },
];
const CAT_NAMES = { ui: 'UI', notify: 'Notify', data: 'Data', ai: 'AI', game: 'Game', battle: 'Battle', cards: 'Cards', duel: 'Ink Duel', magic: 'Magic', fx: 'FX', scifi: 'Sci-fi', ambience: 'Ambience', music: 'Music', voice: 'Voice' };
const CAT_BLURBS = {
  ui: 'Clicks, toggles, keys, sheets and sliders',
  notify: 'Chimes, badges, alerts and incoming calls',
  data: 'Counters, gauges, packets and split-flap boards',
  ai: 'Thinking hums, token streams and tool calls',
  game: 'Jumps, coins, hits, power-ups and doors',
  battle: 'Strikes, statuses, knockouts and prizes',
  cards: 'Deals, riffles, chips, dice and board pieces',
  duel: 'Inks, quests, songs and lore for card duels',
  magic: 'Spells, portals, potions and curses',
  fx: 'Glitches, confetti, shatters and neon',
  scifi: 'Lasers, warp jumps, scanners and klaxons',
  ambience: 'Rain, surf, fire and space, eight-second beds',
  music: 'Fanfares, stings and jingles',
  voice: 'Announcers, robots and babble, spoken live',
};
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('en-US');

function fail(msg) { console.error('website build: ' + msg); process.exit(1); }

async function main() {
  const out = process.argv[2];
  if (!out) fail('usage: node website/build.mjs <outdir>');
  const { errors, outputs, sounds, themes } = await build();
  if (errors.length) fail(errors.length + ' library error(s); run node build.mjs');
  const dist = fs.readFileSync(path.join(ROOT, 'dist/timbre.html'), 'utf8');
  if (dist !== outputs['dist/timbre.html']) fail('dist/timbre.html is stale; run node build.mjs and commit it');

  const byId = new Map(sounds.map((s) => [s.id, s]));
  const need = new Set([...HERO.map((h) => h.id), ...CARDS]);
  for (const id of need) if (!byId.has(id)) fail('featured sound ' + id + ' is not in the library');
  const order = ['soft-ui', ...themes.map((t) => t.id).filter((id) => id !== 'soft-ui').sort()];
  const themeList = order.map((id) => themes.find((t) => t.id === id));
  for (const th of themeList) {
    for (const p of PADS) {
      const m = th.moments[p.m];
      if (!m || !byId.has(m.sound)) fail('theme ' + th.id + ' has no sound for ' + p.m);
      need.add(m.sound);
    }
  }
  const counts = {};
  for (const s of sounds) counts[s.category] = (counts[s.category] || 0) + 1;
  const cats = CATEGORIES.filter((c) => counts[c]);
  const speech = T.speechVoices();
  const babble = T.babbleVoices();
  const voiceCount = Object.keys(speech).length + Object.keys(babble).length;
  const toolSrc = fs.readFileSync(path.join(ROOT, 'mcp-server/tools/index.js'), 'utf8');
  const tools = [...toolSrc.matchAll(/^ {2}name: '([a-z_]+)'/gm)].map((m) => m[1]);
  if (tools.length < 5) fail('found only ' + tools.length + ' MCP tools in mcp-server/tools/index.js');

  // ---- markup filled from the library
  const color = (c) => ' style="--c: var(--cat-' + c + ')"';
  const heroPads = HERO.map(({ id, label }) => {
    const s = byId.get(id);
    return '        <button class="hpad" type="button" data-id="' + id + '"' + color(s.category) + '><svg class="ic glyph"><use href="#i-play"/></svg><b>' + esc(label) + '</b><span>' + esc(CAT_NAMES[s.category].toUpperCase()) + '</span></button>';
  }).join('\n');
  const cards = CARDS.map((id) => {
    const s = byId.get(id);
    const ci = String(cats.indexOf(s.category) + 1).padStart(2, '0');
    const ref = String(sounds.filter((x) => x.category === s.category).indexOf(s) + 1).padStart(3, '0');
    return [
      '      <article class="card" data-id="' + id + '"' + color(s.category) + '>',
      '        <div class="card-top"><span>' + ci + ' / ' + esc(CAT_NAMES[s.category].toUpperCase()) + '</span><span class="live">LIVE</span></div>',
      '        <div class="scope" role="button" tabindex="0" aria-label="Play ' + esc(s.name) + '"><canvas aria-hidden="true"></canvas><span class="big-play" aria-hidden="true"><svg class="ic"><use href="#i-play"/></svg></span></div>',
      '        <div class="card-body"><h3>' + esc(s.name) + '</h3><p class="ref">' + esc(id) + '</p><p>' + esc(s.desc.split(/(?<=\.)\s/)[0]) + '</p></div>',
      '        <div class="card-foot"><button class="btn ghost copy" type="button" aria-label="Copy ' + esc(s.name) + ' as a JavaScript function"><svg class="ic"><use href="#i-copy"/></svg>COPY</button><span>' + ci + '.' + ref + ' · ' + s.dur.toFixed(2) + ' s</span></div>',
      '      </article>',
    ].join('\n');
  }).join('\n');
  const catList = cats.map((c, i) => '      <li><a href="timbre.html#' + c + '"' + color(c) + '><span class="sw"><i></i></span><span><b>' + esc(CAT_NAMES[c]) + '</b><span>' + esc(CAT_BLURBS[c] || '') + '</span></span><span class="n"><em>' + String(i + 1).padStart(2, '0') + '</em>' + counts[c] + '</span></a></li>').join('\n');
  const themeTabs = themeList.map((th, i) => '        <button type="button" role="tab" data-theme="' + th.id + '" aria-selected="' + (i === 0) + '">' + esc(th.name) + '</button>').join('\n');
  const pads = PADS.map((p) => '        <button class="pad" type="button" data-moment="' + p.m + '"><i aria-hidden="true"></i><b>' + esc(p.label) + '</b><span>&nbsp;</span></button>').join('\n');
  const vname = (id, v) => v.name || id;
  const speakOpts = Object.entries(speech).map(([id, v]) => [vname(id, v), id]).sort((a, b) => a[0].localeCompare(b[0]));
  const babbleOpts = Object.entries(babble).map(([id, v]) => [vname(id, v), 'babble:' + id]).sort((a, b) => a[0].localeCompare(b[0]));
  const opt = ([name, val]) => '            <option value="' + esc(val) + '"' + (val === 'announcer-female' ? ' selected' : '') + '>' + esc(name) + '</option>';
  const voiceOptions = '            <optgroup label="Speech">\n' + speakOpts.map(opt).join('\n') + '\n            </optgroup>\n            <optgroup label="Babble">\n' + babbleOpts.map((o) => opt([o[0] + ' babble', o[1]])).join('\n') + '\n            </optgroup>';
  const toolChips = tools.map((t) => '          <li>' + esc(t) + '</li>').join('\n');

  // ---- the script: the gallery's core bundle, the sounds this page plays, then site.js
  const core = HELPER_MODULES.map((f) => moduleText('src/core/' + f)).join('\n');
  const used = sounds.filter((s) => need.has(s.id));
  const soundJs = (s) => '{' + JSON.stringify({ id: s.id, name: s.name, category: s.category, tags: s.tags, desc: s.desc, dur: s.dur, params: s.params }).slice(1, -1) + ',"play":' + playSource(s.play) + '}';
  const index = sounds.map((s) => ({ id: s.id, name: s.name, category: s.category, tags: s.tags }));
  const script = [
    '(function () {',
    "'use strict';",
    core,
    'const T = Object.freeze({ ' + Object.keys(T).join(', ') + ' });',
    'const SOUNDS = [\n' + used.map(soundJs).join(',\n') + '\n];',
    'const THEMES = ' + JSON.stringify(themeList.map((th) => ({ id: th.id, name: th.name, desc: th.desc, moments: th.moments }))) + ';',
    'const INDEX = ' + JSON.stringify(index) + ';',
    'const CAT_NAMES = ' + JSON.stringify(CAT_NAMES) + ';',
    ['render.js', 'copy.js'].map((f) => moduleText('src/core/' + f)).join('\n'),
    fs.readFileSync(path.join(HERE, 'site.js'), 'utf8'),
    '})();',
  ].join('\n');

  const fills = {
    SOUNDS: fmt(sounds.length), CATS: String(cats.length), THEMES: String(themes.length), THEMES_WORD: WORDS[themes.length] || String(themes.length),
    VOICES: String(voiceCount), TOOLS: String(tools.length), VERSION: esc(version()),
    HERO_PADS: heroPads, CARDS: cards, CATEGORIES: catList, THEME_TABS: themeTabs, PADS: pads, VOICE_OPTIONS: voiceOptions, TOOL_CHIPS: toolChips,
  };
  let html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
  html = html.replace(/@@([A-Z_]+)@@/g, (m, k) => { if (!(k in fills)) fail('unknown placeholder ' + m); return fills[k]; });
  const cssText = fs.readFileSync(path.join(HERE, 'site.css'), 'utf8');
  html = html.replace('/*@STYLE@*/', () => cssText.replace(/<\/style/gi, '<\\/style')).replace('/*@SCRIPT@*/', () => safeScript(script));

  // nothing may load from another origin (links out are fine: href on <a> only)
  const offsite = [...html.matchAll(/<(script|link|img|iframe|source|audio|video)\b[^>]*\b(src|href)="(https?:)?\/\//gi)];
  if (offsite.length) fail('off-origin load: ' + offsite[0][0]);
  if (/url\((["']?)(https?:)?\/\//i.test(cssText)) fail('off-origin url() in site.css');
  const dash = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
  if (dash.test(html.replace(/<script>[\s\S]*<\/script>/, ''))) fail('the page text contains an en or em dash');

  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  fs.writeFileSync(path.join(out, 'timbre.html'), dist);
  fs.copyFileSync(path.join(HERE, 'favicon.svg'), path.join(out, 'favicon.svg'));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  console.log('website: index.html ' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB (' + used.length + ' sounds bundled), timbre.html ' + (Buffer.byteLength(dist) / 1024).toFixed(1) + ' KB -> ' + out);
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
