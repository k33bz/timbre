// The gallery page. Bundled by build.mjs into the same scope as the core helpers (T, seed, master),
// the runtime (renderSound, measure, paramsFor, encodeWav, wavChannels, buildCopy), SOUNDS and
// THEMES. Top-level names here must not reuse those.

const CAT_NAMES = { ui: 'UI', notify: 'Notify', data: 'Data', ai: 'AI', game: 'Game', battle: 'Battle', cards: 'Cards', duel: 'Ink Duel', magic: 'Magic', fx: 'FX', scifi: 'Sci-fi', dark: 'Dark', ambience: 'Ambience', music: 'Music', voice: 'Voice' };
const CAT_ORDER = ['ui', 'notify', 'data', 'ai', 'game', 'battle', 'cards', 'duel', 'magic', 'fx', 'scifi', 'dark', 'ambience', 'music', 'voice'];
const SCOPE_TOP = -6;     // dBFS at the scope's top edge (the master ceiling)
const SCOPE_FLOOR = -54;  // dBFS at the center line
const HOUSE_MAX = -12;    // the dashed reference line, and the peak LED's red threshold
const byId = new Map(SOUNDS.map((s) => [s.id, s]));
const strips = new Map();
const view = { cat: 'all', q: '', theme: THEMES.length ? THEMES[0].id : null };
const stats = { plays: 0, renders: 0, failures: 0 };
const root = document.documentElement;
let actx = null;
let chainIn = null;
let monitorGain = null;
let analyser = null;
let chainReady = 0;
let monitorLevel = 0.8;

const qs = (sel, el) => (el || document).querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: not remembered */ } },
};
for (const s of SOUNDS) if (!CAT_ORDER.includes(s.category)) CAT_ORDER.push(s.category);

// ---------------------------------------------------------------- live audio
/**
 * The AudioContext, created on the first user gesture (browsers refuse to start one before). The
 * master chain's limiter starts cold (see PREROLL in render.js), so nothing plays on it until it is
 * PREROLL seconds old; the context is created on the first pointer or key press anywhere, so that
 * warm-up usually overlaps the click that asked for a sound.
 */
function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // iOS files WebAudio under the ringer, so the silent switch mutes every sound; 'playback' is
    // the media category (Safari 16.4+). Older iOS gets the same effect from a silent <audio> loop.
    if (navigator.audioSession) {
      try { navigator.audioSession.type = 'playback'; } catch (e) { /* read-only in some builds */ }
    }
    actx = new AC();
    const tap = actx.createGain();
    monitorGain = actx.createGain();
    monitorGain.gain.value = monitorLevel;
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    chainIn = master(actx, tap);
    chainReady = actx.currentTime + PREROLL;
    tap.connect(monitorGain);
    tap.connect(analyser);
    monitorGain.connect(actx.destination);
  }
  // Safari also reports 'interrupted' (a call, Siri, the page in the background)
  if (actx.state !== 'running') actx.resume().catch(() => {});
  return actx;
}

/**
 * Unlock audio inside a gesture WebKit accepts. iOS only lets a context start from touchend,
 * click or keydown (pointerdown and touchstart do not count), and starting one silent buffer in
 * that gesture is what actually releases it.
 */
let unlocked = false;
function unlock() {
  const c = audio();
  if (!c) return;
  if (c.state !== 'running') c.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, c.sampleRate);
  src.connect(c.destination);
  src.start(0);
  if (!navigator.audioSession) {
    const el = document.createElement('audio');
    el.setAttribute('x-webkit-airplay', 'deny');
    el.loop = true;
    el.src = silentWav();
    el.play().catch(() => {});
  }
}

/** A tenth of a second of 8 kHz silence as a WAV data URI (the pre-16.4 iOS silent-switch fix). */
function silentWav() {
  const n = 800;
  const b = new DataView(new ArrayBuffer(44 + n));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); b.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); b.setUint32(16, 16, true);
  b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, 8000, true);
  b.setUint32(28, 8000, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true);
  str(36, 'data'); b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  let bin = '';
  const u = new Uint8Array(b.buffer);
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

/** Play a sound now. Returns the scheduled start time, or null without WebAudio. */
function playNow(sound, over, seedValue) {
  const c = audio();
  if (!c) { toast('This browser has no WebAudio, so sounds cannot play.'); return null; }
  const t = Math.max(c.currentTime + 0.03, chainReady);
  seed(seedValue == null ? 1 : seedValue);
  sound.play(T, chainIn, t, paramsFor(sound, over));
  stats.plays++;
  meterUntil(t + sound.dur + 0.1);
  return t;
}

// The output meter: peak of the master chain's output, with a falling hold marker.
let meterEnd = 0;
let meterRaf = 0;
let holdLevel = 0;
const vuEl = qs('#vu');
const meterBuf = new Float32Array(2048);
function meterUntil(end) {
  meterEnd = Math.max(meterEnd, end);
  if (!meterRaf) meterRaf = requestAnimationFrame(meterTick);
}
function meterTick() {
  meterRaf = 0;
  if (!analyser) return;
  analyser.getFloatTimeDomainData(meterBuf);
  let pk = 0;
  for (let i = 0; i < meterBuf.length; i++) { const a = Math.abs(meterBuf[i]); if (a > pk) pk = a; }
  const dB = pk > 0 ? 20 * Math.log10(pk) : -120;
  const lvl = Math.max(0, Math.min(1, (dB + 60) / 60));
  holdLevel = Math.max(lvl, holdLevel - 0.012);
  vuEl.style.setProperty('--lvl', lvl.toFixed(3));
  vuEl.style.setProperty('--hold', holdLevel.toFixed(3));
  vuEl.setAttribute('aria-valuenow', String(Math.round(Math.max(-60, dB))));
  if (actx.currentTime < meterEnd || holdLevel > 0) meterRaf = requestAnimationFrame(meterTick);
  else { vuEl.style.setProperty('--lvl', '0'); vuEl.style.setProperty('--hold', '0'); }
}

// ---------------------------------------------------------------- helpers
const fmtDb = (v) => (v <= -120 ? '-inf' : v.toFixed(1));
function stepOf(d) {
  if (d.step) return d.step;
  const raw = (d.max - d.min) / 200;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / mag;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : 5) * mag;
}
function decimalsOf(x) {
  const s = String(x);
  const i = s.indexOf('.');
  if (s.includes('e-')) return Number(s.split('e-')[1]);
  return i < 0 ? 0 : s.length - i - 1;
}
/** The name a person sees for a voice id (a speech voice's display name; an alias's voice too). */
function voiceLabel(id) {
  const all = T.speechVoices();
  const key = Object.hasOwn(VOICE_ALIASES, id) ? VOICE_ALIASES[id] : id;
  return Object.hasOwn(all, key) ? all[key].name : id;
}
/** A voice table's ids in the order a person sees them: by display name. */
function byName(table) {
  return Object.keys(table).sort((a, b) => table[a].name.localeCompare(table[b].name, 'en'));
}
function fmtParam(d, v) {
  // a stepped parameter that names its values (a voice) shows the name, a speech voice its display name
  if (d.choices) return voiceLabel(d.choices[Math.max(0, Math.min(d.choices.length - 1, Math.round(v)))]);
  const u = d.unit || '';
  if (d.step === 1 && d.min === 0 && d.max === 1 && !u) return v >= 0.5 ? 'on' : 'off';
  if (u === 's') return v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
  if (u === 'Hz') return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : Math.round(v) + ' Hz';
  if (u === 'x') return v.toFixed(2) + 'x';
  const dec = Math.min(3, decimalsOf(stepOf(d)));
  return v.toFixed(dec) + (u ? ' ' + u : '');
}
let toastTimer = 0;
function toast(msg) {
  const el = qs('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
const ICON = {
  play: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6 4.2v11.6L15.6 10z"/></svg>',
  copy: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="7" y="7" width="9.5" height="9.5" rx="2"/><path d="M13 7V5a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 4 5v6.5A1.5 1.5 0 0 0 5.5 13H7"/></svg>',
  wav: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 3v9.5M6 9l4 4 4-4M4 16.5h12"/></svg>',
};

// ---------------------------------------------------------------- strips (one per sound)
function buildStrip(s) {
  const st = {
    s, params: paramsFor(s, null), seed: 1, vary: false, rendered: false, dirty: true, queued: false,
    render: null, levels: null, playT: -1, raf: 0,
    hay: [s.id, s.name, s.category, CAT_NAMES[s.category] || '', s.desc, ...s.tags].join(' ').toLowerCase(),
  };
  const el = document.createElement('article');
  el.className = 'strip';
  el.id = 's-' + s.id;
  el.dataset.id = s.id;
  el.style.setProperty('--c', 'var(--cat-' + s.category + ', var(--accent))');
  el.setAttribute('aria-labelledby', 'h-' + s.id);
  const faders = Object.entries(s.params).map(([k, d]) => {
    const fid = 'p-' + s.id + '-' + k;
    // the parameter's description (catalog field `desc`) as a hover hint on the label and fader
    const tip = d.desc ? ' title="' + esc(d.desc) + '"' : '';
    return '<div class="fader"><label for="' + esc(fid) + '"' + tip + '>' + esc(k) + '</label>' +
      '<input type="range" id="' + esc(fid) + '"' + tip + ' data-k="' + esc(k) + '" min="' + d.min + '" max="' + d.max +
      '" step="' + stepOf(d) + '" value="' + d.def + '">' +
      '<output for="' + esc(fid) + '"></output></div>';
  }).join('');
  el.innerHTML =
    '<header class="strip-head"><h3 id="h-' + esc(s.id) + '">' + esc(s.name) + '</h3>' +
      '<span class="chip">' + esc(CAT_NAMES[s.category] || s.category) + '</span></header>' +
    '<p class="desc">' + esc(s.desc) + '</p>' +
    '<div class="scope" data-state="idle"><canvas aria-hidden="true"></canvas>' +
      '<span class="scope-ref" aria-hidden="true">' + HOUSE_MAX + '</span>' +
      '<span class="scope-msg">rendering when visible</span></div>' +
    '<div class="meters">' +
      '<span class="badge" data-k="dur" title="Declared length, tail included"><b>DUR</b><span>' + fmtParam({ unit: 's' }, s.dur) + '</span></span>' +
      '<span class="badge" data-k="peak" title="Peak after the master chain, dBFS"><i class="led" aria-hidden="true"></i><b>PK</b><span>--</span></span>' +
      '<span class="badge" data-k="rms" title="RMS over the audible span, dBFS"><b>RMS</b><span>--</span></span>' +
      '<span class="badge" data-k="seed" title="Noise seed of this render" hidden><b>SEED</b><span>1</span></span>' +
    '</div>' +
    '<div class="transport">' +
      '<button class="btn play" type="button"><span class="on" aria-hidden="true"></span>' + ICON.play + 'Play</button>' +
      (s.loop ? '<button class="btn ghost loop" type="button" aria-pressed="false" title="Loop it seamlessly until you stop it"><span class="on" aria-hidden="true"></span>Loop</button>' : '') +
      '<label class="vary" title="Draw a new noise seed for every play"><input type="checkbox"><span class="sw" aria-hidden="true"></span>Vary</label>' +
      '<span class="spacer"></span>' +
      '<button class="btn ghost copy" type="button">' + ICON.copy + 'Copy</button>' +
      '<button class="btn ghost wav" type="button">' + ICON.wav + 'WAV</button>' +
    '</div>' +
    (faders ? '<div class="params"><div class="params-head"><span>Parameters</span>' +
      '<button class="btn ghost reset" type="button">Reset</button></div>' + faders + '</div>' : '') +
    '<footer class="strip-foot"><code class="sid">' + esc(s.id) + '</code><ul class="tags" aria-label="Tags">' +
      s.tags.map((tg) => '<li>' + esc(tg) + '</li>').join('') + '</ul></footer>';
  st.el = el;
  st.canvas = qs('canvas', el);
  st.scope = qs('.scope', el);
  const name = s.name;
  qs('.play', el).setAttribute('aria-label', 'Play ' + name);
  qs('.copy', el).setAttribute('aria-label', 'Copy ' + name + ' as a JavaScript function');
  qs('.wav', el).setAttribute('aria-label', 'Save ' + name + ' as a WAV file');
  qs('.vary input', el).setAttribute('aria-label', 'Vary the noise seed of ' + name + ' on every play');
  qs('.play', el).addEventListener('click', () => onPlay(st));
  if (s.loop) {
    qs('.loop', el).setAttribute('aria-label', 'Loop ' + name + ' seamlessly');
    qs('.loop', el).addEventListener('click', () => toggleLoop(st));
  }
  qs('.copy', el).addEventListener('click', () => onCopy(st));
  qs('.wav', el).addEventListener('click', (e) => onWav(st, e.currentTarget));
  qs('.vary input', el).addEventListener('change', (e) => {
    st.vary = e.currentTarget.checked;
    qs('[data-k="seed"]', el).hidden = st.seed === 1 && !st.vary;
  });
  const reset = qs('.reset', el);
  if (reset) reset.addEventListener('click', () => {
    st.params = paramsFor(s, null);
    for (const inp of el.querySelectorAll('input[type="range"]')) { inp.value = st.params[inp.dataset.k]; syncFader(st, inp); }
    invalidate(st);
  });
  for (const inp of el.querySelectorAll('input[type="range"]')) {
    syncFader(st, inp);
    inp.addEventListener('input', () => {
      st.params[inp.dataset.k] = Number(inp.value);
      syncFader(st, inp);
      invalidate(st);
    });
  }
  strips.set(s.id, st);
  return st;
}

function syncFader(st, inp) {
  const d = st.s.params[inp.dataset.k];
  const v = Number(inp.value);
  const txt = fmtParam(d, v);
  inp.nextElementSibling.textContent = txt;
  inp.setAttribute('aria-valuetext', txt);
  inp.style.setProperty('--fill', ((100 * (v - d.min)) / (d.max - d.min)).toFixed(1) + '%');
}

let reRenderTimer = 0;
const pendingRerender = new Set();
function invalidate(st) {
  st.dirty = true;
  pendingRerender.add(st);
  clearTimeout(reRenderTimer);
  reRenderTimer = setTimeout(() => {
    for (const x of pendingRerender) if (x.rendered) want(x);
    pendingRerender.clear();
  }, 140);
}

function onPlay(st) {
  if (st.vary) {
    st.seed = 1 + Math.floor(Math.random() * 99999);
    st.dirty = true;
  }
  const t = playNow(st.s, st.params, st.seed);
  if (t == null) return;
  st.playT = t;
  st.el.classList.add('playing');
  if (st.dirty) want(st);
  animatePlayhead(st);
}

function animatePlayhead(st) {
  cancelAnimationFrame(st.raf);
  const step = () => {
    const pos = (actx.currentTime - st.playT) / st.s.dur;
    if (pos >= 1) { st.el.classList.remove('playing'); drawScope(st, -1); return; }
    drawScope(st, Math.max(0, pos));
    st.raf = requestAnimationFrame(step);
  };
  st.raf = requestAnimationFrame(step);
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* fall through to the selection route */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

async function onCopy(st) {
  const text = buildCopy(st.s, T, st.params, st.seed);
  const fname = camel(st.s.id);
  if (await copyToClipboard(text)) toast('Copied ' + fname + '(): one function, ' + (text.length / 1024).toFixed(1) + ' KB, no dependencies.');
  else showCode(text, st.el.querySelector('.copy'));
}

// ---------------------------------------------------------------- loops and soundscapes
// A bed's Loop button and the Soundscape rack both play soundscapes (src/core/loop.js) into the live
// master chain. Any number can run at once; the output meter keeps running while one does.
let looping = 0;
function scapeStarted() {
  looping++;
  meterUntil(actx.currentTime + 36000);
}
function scapeStopped() {
  looping = Math.max(0, looping - 1);
  if (!looping) meterEnd = actx.currentTime + 2;
}
function toggleLoop(st) {
  const btn = qs('.loop', st.el);
  if (st.loopCtl) {
    st.loopCtl.stop(1);
    st.loopCtl = null;
    btn.setAttribute('aria-pressed', 'false');
    scapeStopped();
    return;
  }
  const c = audio();
  if (!c) { toast('This browser has no WebAudio, so sounds cannot play.'); return; }
  btn.setAttribute('aria-pressed', 'true');
  const ctl = soundscape(c, chainIn, [{ kind: 'bed', play: st.s.play, p: st.params, seed: st.seed, level: 1 }], T, { fade: 1, when: chainReady });
  st.loopCtl = ctl;
  scapeStarted();
  const slow = setTimeout(() => toast('Cutting a seamless loop from ' + st.s.name + '...'), 400);
  ctl.ready.then(() => clearTimeout(slow));
}

// the Soundscape rack: a preset, or layers of your own
/** Paint a range input's track filled up to its value. */
function fillRange(inp) {
  const lo = Number(inp.min);
  const hi = Number(inp.max);
  inp.style.setProperty('--fill', ((100 * (Number(inp.value) - lo)) / (hi - lo)).toFixed(1) + '%');
}
const EVENT_IDS = ['ambience-thunder-strike', 'dark-door-creak', 'dark-bell-knell', 'dark-funeral-bell', 'dark-whisper-swarm', 'dark-slow-clock', 'magic-sparkle', 'scifi-robot-chirp'];
const sc = { layers: [], preset: null, ctl: null };
function scLayer(sound, from) {
  const s = byId.get(sound);
  const L = { sound, params: from && from.params ? Object.assign({}, from.params) : {}, level: from && from.level != null ? from.level : 0.8 };
  if (!s.loop) {
    L.every = from && from.every ? from.every.slice() : [10, 25];
    if (from && from.vary) L.vary = from.vary;
  }
  return L;
}
function scBuild() {
  const sel = qs('#sc-preset');
  if (!SCAPES.length) { qs('#scape').hidden = true; return; }
  for (const x of SCAPES) {
    const o = document.createElement('option');
    o.value = x.id;
    o.textContent = x.name;
    sel.appendChild(o);
  }
  const mine = document.createElement('option');
  mine.value = '';
  mine.textContent = 'Your mix';
  sel.appendChild(mine);
  sel.addEventListener('change', () => { if (sel.value) scPreset(sel.value); });
  qs('#sc-play').addEventListener('click', () => (sc.ctl ? scStop() : scStart()));
  qs('#sc-add').addEventListener('click', () => {
    if (sc.layers.length >= 6) { toast('Six layers at most.'); return; }
    const used = new Set(sc.layers.map((L) => L.sound));
    const bed = SOUNDS.find((s) => s.loop && !used.has(s.id));
    sc.layers.push(scLayer(bed ? bed.id : SOUNDS.find((s) => s.loop).id));
    scMine();
  });
  qs('#sc-copy').addEventListener('click', async () => {
    const x = scCurrent();
    const text = buildScapeCopy(x, byId, T);
    if (await copyToClipboard(text)) toast('Copied ' + camel(x.id) + '(): the whole soundscape as one function, ' + (text.length / 1024).toFixed(1) + ' KB.');
    else showCode(text, qs('#sc-copy'));
  });
  const first = SCAPES.some((x) => x.id === 'rain-and-thunder') ? 'rain-and-thunder' : SCAPES[0].id;
  scPreset(store.get('timbre.scape') && SCAPES.some((x) => x.id === store.get('timbre.scape')) ? store.get('timbre.scape') : first);
}
function scCurrent() {
  const p = sc.preset && SCAPES.find((x) => x.id === sc.preset);
  return { id: p ? p.id : 'my-soundscape', name: p ? p.name : 'Your mix', layers: sc.layers };
}
function scPreset(id) {
  const x = SCAPES.find((y) => y.id === id);
  sc.preset = id;
  sc.layers = x.layers.map((L) => scLayer(L.sound, L));
  qs('#sc-preset').value = id;
  qs('#sc-desc').textContent = x.desc;
  store.set('timbre.scape', id);
  scRows();
  scRestart();
}
// any edit but a level makes the mix your own
function scMine() {
  sc.preset = null;
  qs('#sc-preset').value = '';
  qs('#sc-desc').textContent = 'Your own mix: change a layer, add one, or start again from a preset.';
  scRows();
  scRestart();
}
function scRows() {
  const box = qs('#sc-layers');
  box.textContent = '';
  const beds = SOUNDS.filter((s) => s.loop);
  const events = EVENT_IDS.map((id) => byId.get(id)).filter(Boolean);
  sc.layers.forEach((L, i) => {
    const s = byId.get(L.sound);
    const row = document.createElement('div');
    row.className = 'sc-layer';
    row.style.setProperty('--c', 'var(--cat-' + s.category + ', var(--accent))');
    const opt = (x) => '<option value="' + esc(x.id) + '"' + (x.id === L.sound ? ' selected' : '') + '>' + esc(x.name) + '</option>';
    const avg = L.every ? Math.round((L.every[0] + L.every[1]) / 2) : 15;
    row.innerHTML =
      '<span class="sc-kind">' + (L.every ? 'EVENT' : 'BED') + '</span>' +
      '<select class="sc-sound" aria-label="Layer ' + (i + 1) + ' sound"><optgroup label="Beds (loop)">' + beds.map(opt).join('') +
        '</optgroup><optgroup label="Events (fire at random)">' + events.map(opt).join('') + '</optgroup></select>' +
      '<label><span>LEVEL</span><input class="sc-lvl" type="range" min="0" max="1.5" step="0.01" value="' + L.level + '" aria-label="Layer ' + (i + 1) + ' level"><output>' + Math.round(L.level * 100) + '%</output></label>' +
      '<label class="sc-every"' + (L.every ? '' : ' hidden') + '><span>EVERY</span><input class="sc-ev" type="range" min="4" max="60" step="1" value="' + avg + '" aria-label="Layer ' + (i + 1) + ' average interval"><output>~' + avg + ' s</output></label>' +
      '<button class="btn ghost icon sc-del" type="button" aria-label="Remove layer ' + (i + 1) + '">&times;</button>';
    if (!L.every) row.appendChild(document.createElement('span'));
    qs('.sc-sound', row).addEventListener('change', (e) => { sc.layers[i] = scLayer(e.currentTarget.value); scMine(); });
    const lv = qs('.sc-lvl', row);
    lv.addEventListener('input', () => {
      L.level = Number(lv.value);
      qs('output', lv.parentNode).textContent = Math.round(L.level * 100) + '%';
      if (sc.ctl) sc.ctl.setLevel(i, L.level);
      fillRange(lv);
    });
    fillRange(lv);
    const ev = qs('.sc-ev', row);
    ev.addEventListener('input', () => { qs('output', ev.parentNode).textContent = '~' + ev.value + ' s'; fillRange(ev); });
    ev.addEventListener('change', () => { const a = Number(ev.value); L.every = [Math.max(2, Math.round(a * 0.6)), Math.round(a * 1.4)]; scMine(); });
    fillRange(ev);
    qs('.sc-del', row).addEventListener('click', () => {
      if (sc.layers.length <= 1) { toast('A soundscape needs at least one layer.'); return; }
      sc.layers.splice(i, 1);
      scMine();
    });
    box.appendChild(row);
  });
}
function scStart() {
  if (!sc.layers.some((L) => !L.every)) { toast('Add a bed (a looping layer) first: events need something to sit on.'); return; }
  const c = audio();
  if (!c) { toast('This browser has no WebAudio, so sounds cannot play.'); return; }
  const layers = sc.layers.map((L) => {
    const s = byId.get(L.sound);
    return { kind: L.every ? 'event' : 'bed', play: s.play, p: paramsFor(s, L.params), seed: 1, level: L.level, every: L.every, vary: L.vary };
  });
  sc.ctl = soundscape(c, chainIn, layers, T, { fade: 2, when: chainReady, seed: Date.now() >>> 0 });
  qs('#scape').classList.add('playing');
  qs('#sc-play').lastChild.textContent = 'Stop';
  scapeStarted();
  const slow = setTimeout(() => toast('Cutting seamless loops...'), 400);
  sc.ctl.ready.then(() => clearTimeout(slow));
}
function scStop() {
  if (!sc.ctl) return;
  sc.ctl.stop(1.2);
  sc.ctl = null;
  qs('#scape').classList.remove('playing');
  qs('#sc-play').lastChild.textContent = 'Play';
  scapeStopped();
}
function scRestart() { if (sc.ctl) { scStop(); scStart(); } }

function showCode(text, back) {
  const dlg = qs('#code');
  const ta = qs('#code-text');
  ta.value = text;
  dlg.returnFocusTo = back;
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  ta.focus();
  ta.select();
}

async function onWav(st, btn) {
  btn.disabled = true;
  try {
    const r = await renderSound(st.s, st.params, st.seed);
    const chans = wavChannels(r);
    const bytes = encodeWav(chans, r.sr);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = st.s.id + (st.seed !== 1 ? '-seed' + st.seed : '') + '.wav';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('Saved ' + a.download + ': ' + (chans.length === 1 ? 'mono' : 'stereo') + ', 16-bit, ' + r.sr / 1000 + ' kHz.');
  } catch (e) {
    toast('Could not render the WAV: ' + (e && e.message ? e.message : e));
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------- offline renders, one at a time
const renderQueue = [];
let rendering = false;
function want(st) {
  if (st.queued) return;
  st.queued = true;
  renderQueue.push(st);
  pump();
}
async function pump() {
  if (rendering) return;
  rendering = true;
  while (renderQueue.length) {
    const st = renderQueue.shift();
    st.queued = false;
    if (!st.dirty && st.rendered) continue;
    st.dirty = false;
    try {
      const r = await renderSound(st.s, st.params, st.seed);
      st.render = r;
      st.levels = measure(r);
      st.rendered = true;
      st.el.dataset.rendered = '1';
      st.scope.dataset.state = 'ready';
      stats.renders++;
      showLevels(st);
      drawScope(st, -1);
    } catch (e) {
      stats.failures++;
      st.scope.dataset.state = 'error';
      qs('.scope-msg', st.el).textContent = 'offline rendering is unavailable here';
      st.el.dataset.rendered = 'error';
    }
  }
  rendering = false;
}

function showLevels(st) {
  const L = st.levels;
  const pk = qs('[data-k="peak"]', st.el);
  qs('span', pk).textContent = fmtDb(L.peak);
  qs('.led', pk).dataset.l = L.peak > HOUSE_MAX ? 'hot' : L.peak > HOUSE_MAX - 3 ? 'warn' : 'ok';
  qs('[data-k="rms"] span', st.el).textContent = fmtDb(L.rms);
  const sb = qs('[data-k="seed"]', st.el);
  qs('span', sb).textContent = String(st.seed);
  sb.hidden = st.seed === 1 && !st.vary;
}

/** Draw the render as a mirrored level envelope on a dB scale: peak outline over an RMS body. */
function drawScope(st, playPos) {
  const r = st.render;
  const cv = st.canvas;
  if (!r || !cv.clientWidth) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(cv.clientWidth * dpr));
  const hgt = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; }
  const g = cv.getContext('2d');
  const cs = getComputedStyle(st.el);
  const col = (n) => cs.getPropertyValue(n).trim();
  const mid = hgt / 2;
  const half = mid - 3 * dpr;
  const yOf = (db) => Math.max(0, Math.min(1, (db - SCOPE_FLOOR) / (SCOPE_TOP - SCOPE_FLOOR))) * half;
  const toDb = (v) => (v > 1e-7 ? 20 * Math.log10(v) : -140);
  g.clearRect(0, 0, w, hgt);
  // time grid: a line at every "nice" interval that gives 4 to 10 divisions
  const dur = r.dur;
  const nice = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2];
  const div = nice.find((x) => dur / x <= 10) || 2;
  g.fillStyle = col('--scope-grid');
  for (let x = div; x < dur - 1e-9; x += div) g.fillRect(Math.round((x / dur) * w), 0, Math.max(1, dpr), hgt);
  for (const db of [-24, -36]) {
    const y = yOf(db);
    g.fillRect(0, Math.round(mid - y), w, Math.max(1, dpr));
    g.fillRect(0, Math.round(mid + y), w, Math.max(1, dpr));
  }
  g.fillRect(0, Math.round(mid), w, Math.max(1, dpr));
  // envelope columns
  const L = r.post[0];
  const R = r.post[1];
  const n = Math.min(L.length, Math.round(dur * r.sr));
  const pkY = new Float32Array(w);
  const rmsY = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const i0 = Math.floor((x * n) / w);
    const i1 = Math.max(i0 + 1, Math.floor(((x + 1) * n) / w));
    let pk = 0;
    let sq = 0;
    for (let i = i0; i < i1; i++) {
      const a = Math.abs(L[i]);
      const b = Math.abs(R[i]);
      const m = a > b ? a : b;
      if (m > pk) pk = m;
      sq += (L[i] * L[i] + R[i] * R[i]) / 2;
    }
    pkY[x] = yOf(toDb(pk));
    rmsY[x] = yOf(toDb(Math.sqrt(sq / (i1 - i0))));
  }
  const band = (ys, fill) => {
    g.beginPath();
    g.moveTo(0, mid - ys[0]);
    for (let x = 1; x < w; x++) g.lineTo(x, mid - ys[x]);
    for (let x = w - 1; x >= 0; x--) g.lineTo(x, mid + ys[x]);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  band(pkY, col('--signal-fill'));
  band(rmsY, col('--signal-body'));
  g.strokeStyle = col('--signal');
  g.lineWidth = Math.max(1, dpr);
  for (const sgn of [-1, 1]) {
    g.beginPath();
    g.moveTo(0, mid + sgn * pkY[0]);
    for (let x = 1; x < w; x++) g.lineTo(x, mid + sgn * pkY[x]);
    g.stroke();
  }
  // the house ceiling
  g.strokeStyle = col('--scope-ref');
  g.setLineDash([4 * dpr, 4 * dpr]);
  for (const sgn of [-1, 1]) {
    const y = Math.round(mid + sgn * yOf(HOUSE_MAX)) + 0.5;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.setLineDash([]);
  if (playPos >= 0) {
    g.fillStyle = col('--accent');
    g.fillRect(Math.round(playPos * w), 0, Math.max(2, 2 * dpr), hgt);
  }
}

// ---------------------------------------------------------------- filters: category and search
function buildCats() {
  const nav = qs('#cats');
  const counts = {};
  for (const s of SOUNDS) counts[s.category] = (counts[s.category] || 0) + 1;
  const mk = (id, label, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat';
    b.dataset.cat = id;
    if (id !== 'all') b.style.setProperty('--c', 'var(--cat-' + id + ', var(--accent))');
    b.innerHTML = '<span class="dot" aria-hidden="true"></span>' + esc(label) + ' <span class="n">' + n + '</span>';
    b.setAttribute('aria-pressed', String(view.cat === id));
    b.addEventListener('click', () => { view.cat = id; applyFilter(); });
    nav.appendChild(b);
  };
  mk('all', 'All', SOUNDS.length);
  for (const c of CAT_ORDER) if (counts[c]) mk(c, CAT_NAMES[c] || c, counts[c]);
  // the intro's category bar: one segment per category, as wide as its share of the library;
  // pressing one filters to it (pressing it again shows everything) and jumps to the sounds
  const bar = qs('#catbar');
  const used = CAT_ORDER.filter((c) => counts[c]);
  for (const c of used) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cbar-seg';
    b.dataset.cat = c;
    b.style.setProperty('--c', 'var(--cat-' + c + ', var(--accent))');
    b.style.setProperty('--n', String(counts[c]));
    b.setAttribute('aria-label', (CAT_NAMES[c] || c) + ', ' + counts[c] + ' sounds');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span aria-hidden="true">' + esc((CAT_NAMES[c] || c).toUpperCase()) + ' ' + counts[c] + '</span>';
    b.addEventListener('click', () => {
      view.cat = view.cat === c ? 'all' : c;
      applyFilter();
      qs('#sounds-h').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    bar.appendChild(b);
  }
  qs('#lib-n').textContent = String(SOUNDS.length);
  qs('#lib-c').textContent = String(used.length);
}

function applyFilter() {
  const terms = view.q.toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const st of strips.values()) {
    const ok = (view.cat === 'all' || st.s.category === view.cat) && terms.every((x) => st.hay.includes(x));
    st.el.hidden = !ok;
    if (ok) shown++;
  }
  for (const b of document.querySelectorAll('.cat, .cbar-seg')) b.setAttribute('aria-pressed', String(b.dataset.cat === view.cat));
  qs('#count').textContent = shown === SOUNDS.length ? String(SOUNDS.length) : shown + ' of ' + SOUNDS.length;
  qs('#empty').hidden = shown > 0;
}

/**
 * Deep links from the landing page: #<category> filters to a category, #<sound-id> clears the
 * filters and brings that sound's strip into view (ids always carry a category prefix, so the two
 * never collide).
 */
function followHash() {
  const key = decodeURIComponent(location.hash.slice(1));
  if (!key) return;
  if (CAT_ORDER.includes(key)) {
    view.cat = key;
    applyFilter();
    return;
  }
  const st = strips.get(key);
  if (!st) return;
  view.cat = 'all';
  view.q = '';
  qs('#q').value = '';
  applyFilter();
  st.el.scrollIntoView({ block: 'center' });
  st.el.classList.remove('linked');
  void st.el.offsetWidth;
  st.el.classList.add('linked');
}

// ---------------------------------------------------------------- sound themes: app moments
function buildThemes() {
  const sel = qs('#theme');
  const sec = qs('#themes');
  if (!THEMES.length) { sec.hidden = true; return; }
  qs('#themes-n').textContent = THEMES.length + (THEMES.length === 1 ? ' KIT' : ' KITS');
  const saved = store.get('timbre.theme');
  if (saved && THEMES.some((th) => th.id === saved)) view.theme = saved;
  for (const th of THEMES) {
    const o = document.createElement('option');
    o.value = th.id;
    o.textContent = th.name;
    sel.appendChild(o);
  }
  sel.value = view.theme;
  sel.addEventListener('change', () => { view.theme = sel.value; store.set('timbre.theme', sel.value); showMoments(); });
  showMoments();
}

function showMoments() {
  const th = THEMES.find((x) => x.id === view.theme) || THEMES[0];
  qs('#theme-desc').textContent = th.desc;
  const box = qs('#moments');
  box.textContent = '';
  for (const [m, v] of Object.entries(th.moments)) {
    const s = byId.get(v.sound);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pad';
    b.dataset.moment = m;
    b.style.setProperty('--c', 'var(--cat-' + s.category + ', var(--accent))');
    b.innerHTML = '<span class="pad-m">' + esc(m) + '</span><span class="pad-s">' + esc(s.name) + '</span>';
    b.setAttribute('aria-label', m + ': plays ' + s.name);
    b.addEventListener('click', () => {
      if (playNow(s, v.params, 1) == null) return;
      b.classList.add('hit');
      setTimeout(() => b.classList.remove('hit'), 160);
    });
    box.appendChild(b);
  }
}

// ---------------------------------------------------------------- speak: a typed line, spoken or babbled
// The rack builds a sound object for the current line, so the gallery's own render, play, level and
// WAV paths take it as they are; Copy bakes the line into one function (buildSpeechCopy).
const sp = {
  mode: 'speak', voice: { speak: 'announcer', babble: 'cute' }, vals: {}, seed: 1,
  s: null, render: null, rendered: false, dirty: true, busy: false, timer: 0, playT: -1, raf: 0,
};

/** The line as speak or babble options: mode, text, voice and the rack's values, clamped. */
function spCfg(cfg) {
  const c = cfg || { mode: sp.mode, text: qs('#sp-text').value, voice: sp.voice[sp.mode], ...sp.vals[sp.mode] };
  const m = c.mode === 'babble' ? 'babble' : 'speak';
  return Object.assign({ mode: m, text: String(c.text || ''), voice: c.voice }, paramsFor({ params: SPEAK_PARAMS[m] }, c));
}

/** A sound for a line (dur from the engine's own length, tail included), named after its words. */
function spSound(cfg) {
  const c = spCfg(cfg);
  const babbled = c.mode === 'babble';
  const slug = (c.text.toLowerCase().match(/[a-z0-9]+/g) || ['line']).slice(0, 4).join('-');
  const end = babbled ? T.babble(null, 0, c) : T.speak(null, 0, c);
  return {
    id: (babbled ? 'babble-' : 'say-') + slug, name: 'Speak', category: 'voice', dur: Math.ceil((end + 0.02) * 1000) / 1000, params: {},
    play(K, out, t) { return babbled ? K.babble(out, t, c) : K.speak(out, t, c); },
  };
}

function spBuild() {
  sp.el = qs('#speak');
  sp.canvas = qs('canvas', sp.el);
  sp.scope = qs('.scope', sp.el);
  for (const m of ['speak', 'babble']) sp.vals[m] = paramsFor({ params: SPEAK_PARAMS[m] }, null);
  qs('#sp-transport').innerHTML =
    '<button class="btn play" type="button" id="sp-play"><span class="on" aria-hidden="true"></span>' + ICON.play + 'Play</button>' +
    '<span class="badge" data-k="dur" title="Length of the line, tail included"><b>DUR</b><span>--</span></span>' +
    '<span class="badge" data-k="peak" title="Peak after the master chain, dBFS"><i class="led" aria-hidden="true"></i><b>PK</b><span>--</span></span>' +
    '<span class="spacer"></span>' +
    '<button class="btn ghost copy" type="button" id="sp-copy">' + ICON.copy + 'Copy</button>' +
    '<button class="btn ghost wav" type="button" id="sp-wav">' + ICON.wav + 'WAV</button>';
  qs('#sp-play').setAttribute('aria-label', 'Play the line');
  qs('#sp-copy').setAttribute('aria-label', 'Copy the line as a JavaScript function');
  qs('#sp-wav').setAttribute('aria-label', 'Save the line as a WAV file');
  for (const r of sp.el.querySelectorAll('input[name="sp-mode"]')) {
    r.addEventListener('change', () => { if (r.checked) { sp.mode = r.value; spMode(); } });
  }
  qs('#sp-voice').addEventListener('change', (e) => { sp.voice[sp.mode] = e.currentTarget.value; spDesc(); spDirty(); });
  const ta = qs('#sp-text');
  ta.addEventListener('input', spDirty);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); spPlay(); } });
  qs('#sp-play').addEventListener('click', spPlay);
  qs('#sp-copy').addEventListener('click', spCopy);
  qs('#sp-wav').addEventListener('click', (e) => onWav({ s: spSound(), params: null, seed: sp.seed }, e.currentTarget));
  spMode();
}

/** Speech or babble: the voices, the faders and the readout follow the mode. */
function spMode() {
  const m = sp.mode;
  const voices = m === 'babble' ? T.babbleVoices() : T.speechVoices();
  const sel = qs('#sp-voice');
  sel.textContent = '';
  for (const id of byName(voices)) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = voices[id].name;
    sel.appendChild(o);
  }
  sel.value = sp.voice[m];
  const defs = SPEAK_PARAMS[m];
  const box = qs('#sp-params');
  box.innerHTML = Object.entries(defs).map(([k, d]) =>
    '<div class="fader"><label for="sp-p-' + k + '" title="' + esc(d.desc) + '">' + esc(k) + '</label>' +
    '<input type="range" id="sp-p-' + k + '" title="' + esc(d.desc) + '" data-k="' + k + '" min="' + d.min + '" max="' + d.max +
    '" step="' + stepOf(d) + '" value="' + sp.vals[m][k] + '"><output for="sp-p-' + k + '"></output></div>').join('');
  const fake = { s: { params: defs } };
  for (const inp of box.querySelectorAll('input[type="range"]')) {
    syncFader(fake, inp);
    inp.addEventListener('input', () => { sp.vals[m][inp.dataset.k] = Number(inp.value); syncFader(fake, inp); spDirty(); });
  }
  spDesc();
  spDirty();
}

function spDesc() {
  const v = (sp.mode === 'babble' ? T.babbleVoices() : T.speechVoices())[sp.voice[sp.mode]];
  qs('#sp-desc').textContent = v ? v.desc + '.' : '';
}

/** The line changed: show its phonemes now, re-render its waveform once typing pauses. */
function spDirty() {
  sp.dirty = true;
  const c = spCfg();
  qs('#sp-ph').textContent = c.mode === 'babble'
    ? 'Babble: a blip per ' + (T.babbleVoices()[c.voice].per === 'syllable' ? 'syllable' : 'letter') + ', no words.'
    : T.phonemize(c.text) || ' ';
  clearTimeout(sp.timer);
  sp.timer = setTimeout(spRender, 220);
}

async function spRender() {
  if (typeof OfflineAudioContext === 'undefined') { qs('.scope-msg', sp.el).textContent = 'offline rendering is unavailable here'; return; }
  if (sp.busy) { sp.timer = setTimeout(spRender, 120); return; }
  sp.busy = true;
  sp.dirty = false;
  try {
    const s = spSound();
    const r = await renderSound(s, null, sp.seed);
    if (!sp.dirty) {
      sp.s = s;
      sp.render = r;
      sp.levels = measure(r);
      sp.rendered = true;
      sp.el.dataset.rendered = '1';
      sp.scope.dataset.state = 'ready';
      qs('[data-k="dur"] span', sp.el).textContent = fmtParam({ unit: 's' }, s.dur);
      const pk = qs('[data-k="peak"]', sp.el);
      qs('span', pk).textContent = fmtDb(sp.levels.peak);
      qs('.led', pk).dataset.l = sp.levels.peak > HOUSE_MAX ? 'hot' : sp.levels.peak > HOUSE_MAX - 3 ? 'warn' : 'ok';
      drawScope(sp, -1);
    }
  } catch (e) {
    stats.failures++;
    sp.scope.dataset.state = 'error';
    qs('.scope-msg', sp.el).textContent = 'offline rendering is unavailable here';
  } finally {
    sp.busy = false;
  }
}

function spPlay() {
  const s = spSound();
  const t = playNow(s, null, sp.seed);
  if (t == null) return;
  // the playhead runs over the waveform of what plays: render it first if typing outran it
  if (!sp.render || sp.render.id !== s.id || sp.dirty || sp.s.dur !== s.dur) { clearTimeout(sp.timer); spRender(); }
  sp.s = s;
  sp.playT = t;
  sp.el.classList.add('playing');
  animatePlayhead(sp);
}

async function spCopy() {
  const text = buildSpeechCopy(T, spCfg());
  const fname = /^function (\w+)/m.exec(text)[1];
  if (await copyToClipboard(text)) toast('Copied ' + fname + '(): one function, ' + (text.length / 1024).toFixed(1) + ' KB, no dependencies.');
  else showCode(text, qs('#sp-copy'));
}

// ---------------------------------------------------------------- color theme, monitor, keys
const darkQuery = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function setMode(mode, remember) {
  root.setAttribute('data-theme', mode);
  if (remember) store.set('timbre.mode', mode);
  const next = mode === 'dark' ? 'light' : 'dark';
  qs('#mode').setAttribute('aria-label', 'Switch to ' + next + ' theme');
  qs('#mode').title = 'Switch to ' + next + ' theme';
  for (const st of strips.values()) if (st.rendered) drawScope(st, -1);
  if (sp.rendered) drawScope(sp, -1);
}

function wire() {
  // pointerdown starts the limiter's warm-up early on desktop; the others are the gestures iOS
  // accepts, and they stay attached so a context Safari interrupts comes back on the next tap
  document.addEventListener('pointerdown', () => audio(), { capture: true, once: true });
  for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && actx && actx.state !== 'running') actx.resume().catch(() => {});
  });
  setMode(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
  qs('#mode').addEventListener('click', () => setMode(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', (e) => { if (!store.get('timbre.mode')) setMode(e.matches ? 'dark' : 'light', false); });
  }
  const vol = qs('#vol');
  const savedVol = Number(store.get('timbre.monitor'));
  if (store.get('timbre.monitor') != null && isFinite(savedVol)) monitorLevel = Math.min(1, Math.max(0, savedVol));
  vol.value = monitorLevel;
  const syncVol = () => {
    monitorLevel = Number(vol.value);
    vol.style.setProperty('--fill', Math.round(monitorLevel * 100) + '%');
    vol.setAttribute('aria-valuetext', Math.round(monitorLevel * 100) + ' percent');
    if (monitorGain) monitorGain.gain.setTargetAtTime(monitorLevel, actx.currentTime, 0.02);
  };
  vol.addEventListener('input', () => { syncVol(); store.set('timbre.monitor', String(monitorLevel)); });
  syncVol();
  const q = qs('#q');
  q.addEventListener('input', () => { view.q = q.value; applyFilter(); });
  q.addEventListener('keydown', (e) => { if (e.key === 'Escape' && q.value) { q.value = ''; view.q = ''; applyFilter(); } });
  qs('#clear').addEventListener('click', () => { q.value = ''; view.q = ''; view.cat = 'all'; applyFilter(); q.focus(); });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); q.focus(); q.select(); }
  });
  const dlg = qs('#code');
  qs('#code-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { if (dlg.returnFocusTo) dlg.returnFocusTo.focus(); });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      for (const st of strips.values()) if (st.rendered) drawScope(st, -1);
      if (sp.rendered) drawScope(sp, -1);
    }, 120);
  });
}

// ---------------------------------------------------------------- boot
function boot() {
  const grid = qs('#sounds');
  for (const s of SOUNDS) grid.appendChild(buildStrip(s).el);
  qs('#foot-count').textContent = VERSION + ', ' + SOUNDS.length + ' sounds';
  buildCats();
  buildThemes();
  spBuild();
  scBuild();
  wire();
  applyFilter();
  followHash();
  window.addEventListener('hashchange', followHash);
  const canRender = typeof OfflineAudioContext !== 'undefined';
  if (!canRender) {
    for (const st of strips.values()) qs('.scope-msg', st.el).textContent = 'offline rendering is unavailable here';
    return;
  }
  const seen = (st) => { if (!st.rendered || st.dirty) want(st); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) seen(strips.get(en.target.closest('.strip').dataset.id));
    }, { rootMargin: '200px 0px' });
    for (const st of strips.values()) io.observe(st.scope);
  } else {
    for (const st of strips.values()) seen(st);
  }
}

// The page's programmatic face, used by the gates (and handy in the console).
window.Timbre = Object.freeze({
  version: VERSION,
  T, sounds: SOUNDS, themes: THEMES, preroll: PREROLL, sampleRate: SAMPLE_RATE,
  paramsFor: (id, over) => paramsFor(byId.get(id), over),
  render: (id, over, seedValue) => renderSound(byId.get(id), over, seedValue),
  measure,
  copy: (id, over, seedValue) => buildCopy(byId.get(id), T, over, seedValue),
  wav: (id, over, seedValue) => renderSound(byId.get(id), over, seedValue).then((r) => encodeWav(wavChannels(r), r.sr)),
  play: (id, over, seedValue) => playNow(byId.get(id), over, seedValue),
  audio: () => actx,
  stats: () => Object.assign({}, stats),
  // the Speak rack: a line (cfg: mode, text, voice and the SPEAK_PARAMS values) as a sound, a render, a Copy
  // a loopable bed's seamless loop, as raw channels (the loop gate measures its seam)
  loop: (id, over, seedValue) => {
    const s = byId.get(id);
    const c = new OfflineAudioContext(2, 1, SAMPLE_RATE);
    return loopBuffer(c, T, s.play, paramsFor(s, over), seedValue).then((b) => (b ? { sr: b.sampleRate, xfade: b.xfade, channels: [b.getChannelData(0), b.getChannelData(1)] } : null));
  },
  scapes: SCAPES,
  // the live output's peak right now, dBFS (-120 before anything has played)
  level: () => {
    if (!analyser) return -120;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let pk = 0;
    for (let i = 0; i < buf.length; i++) pk = Math.max(pk, Math.abs(buf[i]));
    return pk > 0 ? Math.round(200 * Math.log10(pk)) / 10 : -120;
  },
  scape: Object.freeze({
    preset: (id) => scPreset(id),
    play: () => scStart(),
    stop: () => scStop(),
    playing: () => !!sc.ctl,
    copy: () => buildScapeCopy(scCurrent(), byId, T),
  }),
  speak: Object.freeze({
    params: SPEAK_PARAMS,
    voices: () => ({ speak: T.speechVoices(), babble: T.babbleVoices() }),
    phonemes: (text) => T.phonemize(text),
    sound: (cfg) => spSound(cfg),
    render: (cfg, seedValue) => renderSound(spSound(cfg), null, seedValue),
    wav: (cfg, seedValue) => renderSound(spSound(cfg), null, seedValue).then((r) => encodeWav(wavChannels(r), r.sr)),
    copy: (cfg) => buildSpeechCopy(T, cfg),
  }),
});

boot();
