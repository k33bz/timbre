// Timbre landing page. Bundled by website/build.mjs after the core helpers, T, a subset of SOUNDS
// (the ones this page plays), THEMES, INDEX (every sound's id, name, category and tags, for the
// finder), CAT_NAMES and the render and copy runtime, so every sound here is the library's own
// code and every Copy is the gallery's Copy.
const qs = (s, el) => (el || document).querySelector(s);
const qsa = (s, el) => Array.from((el || document).querySelectorAll(s));
const byId = new Map(SOUNDS.map((s) => [s.id, s]));
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};
const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

// ---------------------------------------------------------------- Night / Day
function setMode(mode, save) {
  root.setAttribute('data-theme', mode);
  for (const b of qsa('.mode button')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  if (save) store.set('timbre.mode', mode);
  for (const c of cards.values()) if (c.r) drawWave(c);
}

// ---------------------------------------------------------------- live audio
// The same setup as the gallery: one context, the master chain into a tap that feeds the speakers
// and an analyser (the figure and the scopes draw from it). See the gallery's audio() for why the
// session category and the gesture list matter on iOS.
let actx = null;
let chainIn = null;
let chainReady = 0;
let analyser = null;
let unlocked = false;
function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (navigator.audioSession) {
      try { navigator.audioSession.type = 'playback'; } catch (e) { /* read-only in some builds */ }
    }
    actx = new AC();
    const tap = actx.createGain();
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.72;
    chainIn = T.master(actx, tap);
    chainReady = actx.currentTime + PREROLL;
    tap.connect(actx.destination);
    tap.connect(analyser);
  }
  if (actx.state !== 'running') actx.resume().catch(() => {});
  return actx;
}
function unlock() {
  const c = audio();
  if (!c || unlocked) return;
  unlocked = true;
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, c.sampleRate);
  src.connect(c.destination);
  src.start(0);
  if (!navigator.audioSession) {
    const el = document.createElement('audio');
    el.loop = true;
    el.src = silentWav();
    el.play().catch(() => {});
  }
}
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

/** Play a sound now; resolves the start time and length, or null without WebAudio. */
let lastColor = '';
function play(sound, over, color) {
  const c = audio();
  if (!c) { toast('This browser has no WebAudio, so sounds cannot play.'); return null; }
  const t = Math.max(c.currentTime + 0.03, chainReady);
  T.seed(1);
  sound.play(T, chainIn, t, paramsFor(sound, over));
  lastColor = color || css('--cat-' + sound.category) || css('--accent');
  wake();
  return { t, dur: sound.dur };
}
function flash(el, dur) {
  el.classList.add('hit');
  clearTimeout(el.hitTimer);
  el.hitTimer = setTimeout(() => el.classList.remove('hit'), Math.max(180, dur * 1000));
}

// ---------------------------------------------------------------- copy
let toastTimer = 0;
function toast(msg) {
  const el = qs('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}
async function copyText(text, what) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); toast('Copied ' + what); return; }
  } catch (e) { /* the dialog below */ }
  const dlg = qs('#copy-dialog');
  qs('#copy-text').value = text;
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  qs('#copy-text').select();
}

// ---------------------------------------------------------------- hero pads and live cards
const cards = new Map();
function drawWave(c, pos) {
  const cv = c.canvas;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(cv.clientWidth * dpr));
  const h = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.strokeStyle = css('--grid');
  g.lineWidth = 1;
  for (let x = 1; x < 8; x++) { g.beginPath(); g.moveTo(Math.round((x * w) / 8) + 0.5, 0); g.lineTo(Math.round((x * w) / 8) + 0.5, h); g.stroke(); }
  const col = css('--cat-' + c.s.category) || css('--accent');
  const mid = h / 2;
  if (!c.r) {
    g.strokeStyle = col;
    g.globalAlpha = 0.35;
    g.beginPath(); g.moveTo(0, mid); g.lineTo(w, mid); g.stroke();
    g.globalAlpha = 1;
    return;
  }
  const L = c.r.post[0];
  const R = c.r.post[1] || L;
  // fit the audible span (down to -54 dBFS, the floor of the scale below) to the width
  let n = Math.min(L.length, Math.round(c.s.dur * c.r.sr));
  if (!c.fit) {
    let last = 0;
    for (let k = 0; k < n; k++) if (Math.abs(L[k]) > 0.002 || Math.abs(R[k]) > 0.002) last = k;
    c.fit = Math.min(n, Math.max(Math.round(0.05 * c.r.sr), Math.round(last * 1.06)));
  }
  n = c.fit;
  const cols = Math.max(1, Math.floor(w / (2 * dpr)));
  const per = n / cols;
  // log-ish amplitude so quiet tails stay visible, scaled to the master ceiling (-6 dBFS)
  const amp = (v) => Math.max(0, (20 * Math.log10(Math.max(v, 1e-6)) + 54) / 48);
  g.fillStyle = col;
  for (let i = 0; i < cols; i++) {
    let pk = 0;
    const a = Math.floor(i * per);
    const b = Math.min(n, Math.floor((i + 1) * per));
    for (let k = a; k < b; k++) { const x = Math.abs(L[k]); const y = Math.abs(R[k]); if (x > pk) pk = x; if (y > pk) pk = y; }
    const hh = Math.max(1, amp(pk) * (h * 0.44));
    g.globalAlpha = pos != null && i / cols <= pos ? 1 : 0.55;
    g.fillRect(Math.round((i * w) / cols), mid - hh, Math.max(1, Math.floor(w / cols) - dpr), hh * 2);
  }
  g.globalAlpha = 1;
  if (pos != null && pos >= 0 && pos <= 1) {
    g.fillStyle = css('--ink');
    g.fillRect(Math.round(pos * w), 0, Math.max(2, dpr * 1.5), h);
  }
}
function renderCard(c) {
  if (c.r || c.rendering || typeof OfflineAudioContext === 'undefined') return;
  c.rendering = true;
  renderSound(c.s).then((r) => { c.r = r; drawWave(c); }).catch(() => {}).finally(() => { c.rendering = false; });
}
function playCard(c) {
  const p = play(c.s);
  if (!p) return;
  c.el.classList.add('playing');
  const tick = () => {
    const span = c.fit && c.r ? c.fit / c.r.sr : p.dur;
    const pos = (actx.currentTime - p.t) / span;
    if (actx.currentTime - p.t > p.dur || pos > 1) { c.el.classList.remove('playing'); drawWave(c); return; }
    drawWave(c, Math.max(0, pos));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function wireCards() {
  for (const el of qsa('.card[data-id]')) {
    const s = byId.get(el.dataset.id);
    if (!s) continue;
    const c = { el, s, canvas: qs('canvas', el), r: null };
    cards.set(s.id, c);
    qs('.scope', el).addEventListener('click', () => playCard(c));
    qs('.copy', el).addEventListener('click', () => copyText(buildCopy(s, T), s.name));
    drawWave(c);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { renderCard(cards.get(en.target.dataset.id)); io.unobserve(en.target); }
    }, { rootMargin: '200px 0px' });
    for (const c of cards.values()) io.observe(c.el);
  } else {
    for (const c of cards.values()) renderCard(c);
  }
  let rs = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rs); rs = requestAnimationFrame(() => { for (const c of cards.values()) drawWave(c); }); });
  for (const b of qsa('.hpad[data-id]')) {
    const s = byId.get(b.dataset.id);
    if (s) b.addEventListener('click', () => { const p = play(s); if (p) flash(b, p.dur); });
  }
}

// ---------------------------------------------------------------- finder
function wireFinder() {
  const q = qs('#find-q');
  const out = qs('#find-results');
  const hay = INDEX.map((s) => [s.id, s.name, s.category, CAT_NAMES[s.category] || '', s.tags.join(' ')].join(' ').toLowerCase());
  const run = () => {
    const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { out.hidden = true; out.textContent = ''; return; }
    const hits = [];
    for (let i = 0; i < INDEX.length && hits.length < 12; i++) if (terms.every((x) => hay[i].includes(x))) hits.push(INDEX[i]);
    out.textContent = '';
    if (!hits.length) {
      const li = document.createElement('li');
      li.className = 'none';
      li.textContent = 'Nothing by that name yet. The library has ' + INDEX.length + ' sounds to browse.';
      out.appendChild(li);
    }
    for (const s of hits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = 'timbre.html#' + s.id;
      a.style.setProperty('--c', 'var(--cat-' + s.category + ')');
      const b = document.createElement('b');
      b.textContent = s.name;
      const sp = document.createElement('span');
      sp.textContent = (CAT_NAMES[s.category] || s.category) + ' · ' + s.id;
      a.append(b, sp);
      li.appendChild(a);
      out.appendChild(li);
    }
    out.hidden = false;
  };
  q.addEventListener('input', run);
}

// ---------------------------------------------------------------- sound themes
let theme = THEMES[0];
function showTheme(id) {
  theme = THEMES.find((t) => t.id === id) || THEMES[0];
  for (const b of qsa('#theme-tabs button')) b.setAttribute('aria-selected', String(b.dataset.theme === theme.id));
  qs('#theme-desc').textContent = theme.desc;
  for (const p of qsa('.pad[data-moment]')) {
    const m = theme.moments[p.dataset.moment];
    const s = m && byId.get(m.sound);
    p.disabled = !s;
    qs('span', p).textContent = s ? s.name : 'not in this kit';
  }
  store.set('timbre.theme', theme.id);
}
function wireThemes() {
  for (const b of qsa('#theme-tabs button')) b.addEventListener('click', () => showTheme(b.dataset.theme));
  qs('#theme-tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = qsa('#theme-tabs button');
    const i = tabs.findIndex((b) => b.dataset.theme === theme.id);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    showTheme(next.dataset.theme);
    next.focus();
  });
  for (const p of qsa('.pad[data-moment]')) {
    p.addEventListener('click', () => {
      const m = theme.moments[p.dataset.moment];
      const s = m && byId.get(m.sound);
      if (!s) return;
      const r = play(s, m.params);
      if (r) flash(p, r.dur);
    });
  }
  showTheme(store.get('timbre.theme') || THEMES[0].id);
}

// ---------------------------------------------------------------- voices
function speakCfg() {
  const voice = qs('#sp-voice').value;
  const babble = voice.startsWith('babble:');
  const mode = babble ? 'babble' : 'speak';
  const text = qs('#sp-text').value.trim() || 'Hello there.';
  return Object.assign({ mode, text, voice: babble ? voice.slice(7) : voice }, paramsFor({ params: SPEAK_PARAMS[mode] }, null));
}
let spLive = false;
function wireSpeak() {
  qs('#speak').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = speakCfg();
    const babbled = c.mode === 'babble';
    const end = babbled ? T.babble(null, 0, c) : T.speak(null, 0, c);
    const s = { id: 'say', name: 'Speak', category: 'voice', dur: end + 0.02, params: {}, play(K, out, t) { return babbled ? K.babble(out, t, c) : K.speak(out, t, c); } };
    const p = play(s);
    if (!p) return;
    spLive = true;
    setTimeout(() => { spLive = false; }, (p.t - actx.currentTime + p.dur + 0.2) * 1000);
  });
  qs('#sp-copy').addEventListener('click', () => {
    const c = speakCfg();
    copyText(c.mode === 'babble' ? buildCopy(babbleSound(c), T) : buildSpeechCopy(T, c), 'the line');
  });
}
// buildSpeechCopy covers spoken lines; babble copies like any sound through a one-off sound record
function babbleSound(c) {
  const end = T.babble(null, 0, c);
  return {
    id: 'babble-' + ((c.text.toLowerCase().match(/[a-z0-9]+/g) || ['line']).slice(0, 3).join('-')), name: 'Babble', category: 'voice',
    dur: Math.ceil((end + 0.02) * 1000) / 1000, params: {},
    play: new Function('T', 'out', 't', 'p', 'return T.babble(out, t, ' + JSON.stringify(c) + ');'),
  };
}

// ---------------------------------------------------------------- the figure and the speak scope
// One sine comes in from the left, passes a resonator, and leaves as a fan of harmonics; when a
// sound plays the fan becomes that sound's live spectrum, colored by its category.
const fig = { cv: null, g: null, raf: 0, until: 0, t0: performance.now(), seen: true };
const rays = 28;
const hold = new Float32Array(rays);
let freq = null;
let wave = null;
function wake() {
  fig.until = performance.now() + 1200;
  if (!fig.raf) fig.raf = requestAnimationFrame(frame);
}
function sizeCanvas(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(cv.clientWidth * dpr));
  const h = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return [w, h, dpr];
}
function frame(now) {
  fig.raf = 0;
  const [w, h, dpr] = sizeCanvas(fig.cv);
  const g = fig.g;
  const t = (now - fig.t0) / 1000;
  const still = reduced.matches;
  g.clearRect(0, 0, w, h);
  let level = 0;
  if (analyser) {
    if (!freq) { freq = new Uint8Array(analyser.frequencyBinCount); wave = new Float32Array(analyser.fftSize); }
    analyser.getByteFrequencyData(freq);
    for (let i = 0; i < 160; i++) level = Math.max(level, freq[i]);
    level /= 255;
  }
  const cx = w * 0.46;
  const cy = h * 0.47;
  const accent = css('--accent');
  const ink = css('--muted');
  // the incoming tone
  g.lineWidth = 2 * dpr;
  g.strokeStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 10 * dpr;
  g.beginPath();
  const x0 = w * 0.04;
  for (let x = x0; x <= cx; x += 2 * dpr) {
    const u = (x - x0) / (cx - x0);
    const y = cy + Math.sin(u * 14 - (still ? 0 : t * 3)) * h * 0.035 * (0.6 + 0.4 * u);
    if (x === x0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  g.shadowBlur = 0;
  // the resonator: a ringed body
  const rr = Math.min(w, h) * 0.11;
  for (let k = 3; k >= 1; k--) {
    g.beginPath();
    g.ellipse(cx, cy, rr * (0.55 + k * 0.22) * (1 + level * 0.08), rr * (0.9 + k * 0.32) * (1 + level * 0.08), 0, 0, Math.PI * 2);
    g.strokeStyle = ink;
    g.globalAlpha = 0.18 + 0.1 * (3 - k) + level * 0.3;
    g.lineWidth = dpr;
    g.stroke();
  }
  g.globalAlpha = 1;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.2);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, 'transparent');
  g.fillStyle = glow;
  g.globalAlpha = 0.35 + level * 0.5;
  g.beginPath(); g.arc(cx, cy, rr * 1.2, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  // the fan out: harmonics at rest, the live spectrum while a sound plays
  const hues = ['--cat-notify', '--cat-game', '--cat-battle', '--cat-magic', '--cat-ai', '--cat-cards', '--cat-duel', '--cat-scifi', '--cat-ui', '--cat-ambience'];
  const span = 1.15;
  const live = level > 0.02 && freq;
  if (live) {
    // each ray is the loudest bin of its band (log-spaced, ~50 Hz to ~12 kHz), spread a little to
    // its neighbours and held with a decay, so a tonal sound blooms instead of lighting two rays
    const raw = new Float32Array(rays);
    for (let i = 0; i < rays; i++) {
      const lo = Math.floor(2 * Math.pow(256, i / rays));
      const hi = Math.max(lo + 1, Math.floor(2 * Math.pow(256, (i + 1) / rays)));
      let v = 0;
      for (let k = lo; k < hi && k < freq.length; k++) if (freq[k] > v) v = freq[k];
      raw[i] = Math.min(1, Math.max(0, (v - 40) / 160));
    }
    for (let i = 0; i < rays; i++) {
      const sp = Math.max(raw[i], 0.7 * (raw[i - 1] || 0), 0.7 * (raw[i + 1] || 0), 0.4 * (raw[i - 2] || 0), 0.4 * (raw[i + 2] || 0));
      hold[i] = Math.max(sp, hold[i] * 0.93);
    }
  } else {
    for (let i = 0; i < rays; i++) hold[i] *= 0.9;
  }
  for (let i = 0; i < rays; i++) {
    const u = i / (rays - 1);
    const ang = -span / 2 + u * span;
    const rest = (0.5 + 0.5 / (1 + i * 0.22)) * (still ? 1 : 0.86 + 0.14 * Math.sin(t * 1.6 + i * 0.7));
    const len = Math.max(rest * (live ? 0.3 : 1 - Math.min(1, hold[i] * 1.5)), 0.14 + 0.86 * hold[i]);
    const L = (w - cx) * 0.9 * len;
    const col = hold[i] > 0.05 && lastColor ? lastColor : css(hues[Math.floor(u * (hues.length - 1))]);
    const gr = g.createLinearGradient(cx, cy, cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
    gr.addColorStop(0, 'transparent');
    gr.addColorStop(0.18, col);
    gr.addColorStop(1, 'transparent');
    g.strokeStyle = gr;
    g.lineWidth = (2.2 - u) * dpr;
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * rr * 0.9, cy + Math.sin(ang) * rr * 0.9);
    g.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
    g.stroke();
  }
  // the speak scope draws the live waveform while a line plays
  if (analyser && spLive) drawScope(qs('#sp-scope'), css('--cat-voice'));
  const running = level > 0.01 || now < fig.until || spLive || hold.some((v) => v > 0.01);
  // the idle drift runs only while the figure is on screen; a playing sound always finishes drawing
  if (running || (!still && fig.seen && !document.hidden)) fig.raf = requestAnimationFrame(frame);
}
function drawScope(cv, col) {
  const [w, h, dpr] = sizeCanvas(cv);
  const g = cv.getContext('2d');
  if (!analyser) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = col;
    g.globalAlpha = 0.35;
    g.fillRect(0, Math.round(h / 2), w, dpr);
    g.globalAlpha = 1;
    return;
  }
  analyser.getFloatTimeDomainData(wave);
  g.clearRect(0, 0, w, h);
  g.strokeStyle = col;
  g.lineWidth = 1.6 * dpr;
  g.beginPath();
  const n = wave.length;
  for (let i = 0; i < n; i += 2) {
    const x = (i / n) * w;
    const y = h / 2 - wave[i] * h * 0.9;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
}

// ---------------------------------------------------------------- boot
function boot() {
  fig.cv = qs('#fig');
  fig.g = fig.cv.getContext('2d');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { fig.seen = en[0].isIntersecting; if (fig.seen) wake(); }).observe(fig.cv);
  }
  for (const b of qsa('.mode button')) b.addEventListener('click', () => setMode(b.dataset.mode, true));
  setMode(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
  document.addEventListener('pointerdown', () => audio(), { capture: true, once: true });
  for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && actx && actx.state !== 'running') actx.resume().catch(() => {});
    if (!document.hidden) wake();
  });
  reduced.addEventListener && reduced.addEventListener('change', wake);
  wireCards();
  wireFinder();
  wireThemes();
  wireSpeak();
  drawScope(qs('#sp-scope'), css('--cat-voice'));
  wake();
}
boot();
