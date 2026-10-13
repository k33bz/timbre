// A small offline renderer for the recorded mock graph (lib/mockaudio.js), mono, in plain JS.
//
// Node has no WebAudio, so to read a sound's level without a browser this module plays the recorded
// graph back: oscillators (four waves, pitch and detune automation and modulation, so vibrato and FM
// work), looped or one-shot buffers (the seeded noise the real helpers generated), biquad filters
// with swept cutoffs, gain envelopes with modulation (tremolo), and waveshapers. It is built for the
// house helpers, not for all of WebAudio:
//   * reverb and delay branches are NOT simulated (the dry path is, the wet tail is left out), so a
//     sound with a loud effect tail reads a little low (lib/levels.js adds an allowance);
//   * the master chain is modelled as its warm steady state (lib/levels.js), without the limiter,
//     which only acts above the house range;
//   * oscillators are naive (not band-limited) and run at the context's sample rate.
//
// Signals are sparse: { a, d } means the samples d start at index a and everything outside is zero.
// A grain of noise 20 ms long in an eight second bed costs 20 ms of work and memory, not eight
// seconds, which is what keeps long ambience sounds cheap.

const TWO_PI = Math.PI * 2;
const BLOCK = 32;
const RING = 0.12; // seconds a filter is allowed to ring on past its input

const EMPTY = Object.freeze({ a: 0, d: new Float32Array(0) });
const end = (s) => s.a + s.d.length;

/** One parameter's value over samples [a, b): its events (ramps, steps) plus whatever modulates it. */
function paramWindow(param, a, b, sr, nodeOut) {
  const out = new Float32Array(Math.max(0, b - a));
  if (!out.length) return out;
  const at = (t) => Math.round(t * sr);
  const evs = param.events.map((e, i) => ({ ...e, i })).sort((x, y) => x.t - y.t || x.i - y.i);
  const hold = (v, from, to) => {
    const f = Math.max(from, a);
    const t = Math.min(to, b);
    if (t > f) out.fill(v, f - a, t - a);
  };
  // each event ends a segment that starts where the last one left off: a ramp event moves from the
  // previous value to its own; any other event holds the previous value until it fires
  let cur = { t: 0, v: param._v };
  for (const e of evs) {
    const from = at(cur.t);
    const to = at(e.t);
    if ((e.type === 'lin' || e.type === 'exp') && to > from) {
      const f = Math.max(from, a);
      const t = Math.min(to, b);
      const span = to - from;
      if (e.type === 'lin' || !(cur.v > 0) || !(e.v > 0)) {
        for (let i = f; i < t; i++) out[i - a] = cur.v + (e.v - cur.v) * ((i - from) / span);
      } else {
        const ratio = e.v / cur.v;
        for (let i = f; i < t; i++) out[i - a] = cur.v * Math.pow(ratio, (i - from) / span);
      }
    } else {
      hold(cur.v, from, to);
    }
    cur = { t: Math.max(cur.t, e.t), v: e.v };
  }
  hold(cur.v, at(cur.t), b);
  for (const m of param.mods) {
    const sig = nodeOut(m);
    const f = Math.max(sig.a, a);
    const t = Math.min(end(sig), b);
    for (let i = f; i < t; i++) out[i - a] += sig.d[i - sig.a];
  }
  return out;
}

/** Chromium's lowpass/highpass (resonance in dB) and the RBJ cookbook for the rest. */
function biquadCoefs(type, cutoff, q, gainDb) {
  // returns [b0, b1, b2, a1, a2] with a0 normalized to 1 (y = b0 x + b1 x1 + b2 x2 - a1 y1 - a2 y2)
  if (!(cutoff > 0)) return type === 'highpass' ? [1, 0, 0, 0, 0] : [0, 0, 0, 0, 0];
  if (cutoff >= 1) return type === 'highpass' ? [0, 0, 0, 0, 0] : [1, 0, 0, 0, 0];
  const w0 = Math.PI * cutoff;
  if (type === 'lowpass' || type === 'highpass') {
    const res = Math.max(0, q);
    const g = Math.pow(10, 0.05 * res);
    const d = Math.sqrt((4 - Math.sqrt(Math.max(0, 16 - 16 / (g * g)))) / 2);
    const sn = 0.5 * d * Math.sin(w0);
    const beta = 0.5 * (1 - sn) / (1 + sn);
    const gamma = (0.5 + beta) * Math.cos(w0);
    const alpha = 0.25 * (0.5 + beta + (type === 'lowpass' ? -gamma : gamma));
    const b0 = 2 * alpha;
    return [b0, type === 'lowpass' ? 2 * b0 : -2 * b0, b0, -2 * gamma, 2 * beta];
  }
  const qq = Math.max(0.0001, q);
  const alpha = Math.sin(w0) / (2 * qq);
  const k = Math.cos(w0);
  const A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'bandpass': b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * k; a2 = 1 - alpha; break;
    case 'notch': b0 = 1; b1 = -2 * k; b2 = 1; a0 = 1 + alpha; a1 = -2 * k; a2 = 1 - alpha; break;
    case 'allpass': b0 = 1 - alpha; b1 = -2 * k; b2 = 1 + alpha; a0 = 1 + alpha; a1 = -2 * k; a2 = 1 - alpha; break;
    case 'peaking':
      b0 = 1 + alpha * A; b1 = -2 * k; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * k; a2 = 1 - alpha / A; break;
    case 'lowshelf': {
      const s = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) - (A - 1) * k + s); b1 = 2 * A * ((A - 1) - (A + 1) * k); b2 = A * ((A + 1) - (A - 1) * k - s);
      a0 = (A + 1) + (A - 1) * k + s; a1 = -2 * ((A - 1) + (A + 1) * k); a2 = (A + 1) + (A - 1) * k - s; break;
    }
    case 'highshelf': {
      const s = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) + (A - 1) * k + s); b1 = -2 * A * ((A - 1) + (A + 1) * k); b2 = A * ((A + 1) + (A - 1) * k - s);
      a0 = (A + 1) - (A - 1) * k + s; a1 = 2 * ((A - 1) - (A + 1) * k); a2 = (A + 1) - (A - 1) * k - s; break;
    }
    default: return [1, 0, 0, 0, 0];
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

function wave(type, ph) {
  const f = ph - Math.floor(ph);
  switch (type) {
    case 'square': return f < 0.5 ? 1 : -1;
    case 'sawtooth': return 2 * (f < 0.5 ? f : f - 1);
    case 'triangle': return f < 0.25 ? 4 * f : f < 0.75 ? 2 - 4 * f : 4 * f - 4;
    default: return Math.sin(TWO_PI * f);
  }
}

/**
 * Render the recorded graph of `ctx` (a MockContext after a sound has run) to a mono signal
 * `seconds` long, as the destination would receive it (before the master chain).
 */
export function renderGraph(ctx, seconds) {
  const sr = ctx.sampleRate;
  const n = Math.max(1, Math.ceil(seconds * sr));
  const ins = new Map();
  for (const node of ctx.nodes) {
    for (const o of node.outs) {
      if (o && o.kind) {
        if (!ins.has(o)) ins.set(o, []);
        ins.get(o).push(node);
      }
    }
  }
  const memo = new Map();
  const busy = new Set();
  const clampI = (i) => Math.max(0, Math.min(n, i));

  /** The sum of everything connected into a node. */
  function sumIn(node) {
    const list = (ins.get(node) || []).map(nodeOut).filter((s) => s.d.length);
    if (!list.length) return EMPTY;
    let a = Infinity;
    let b = -Infinity;
    for (const s of list) { if (s.a < a) a = s.a; if (end(s) > b) b = end(s); }
    const d = new Float32Array(b - a);
    for (const s of list) for (let i = 0; i < s.d.length; i++) d[s.a - a + i] += s.d[i];
    return { a, d };
  }

  function renderOsc(node) {
    if (node.started == null) return EMPTY;
    const i0 = clampI(Math.round(node.started * sr));
    const i1 = node.stopped == null ? n : clampI(Math.round(node.stopped * sr));
    if (i1 <= i0) return EMPTY;
    const f = paramWindow(node.frequency, i0, i1, sr, nodeOut);
    const det = paramWindow(node.detune, i0, i1, sr, nodeOut);
    const d = new Float32Array(i1 - i0);
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      d[i] = wave(node.type, ph);
      ph += (f[i] * (det[i] ? Math.pow(2, det[i] / 1200) : 1)) / sr;
    }
    return { a: i0, d };
  }

  function renderBuffer(node) {
    if (node.started == null || !node.buffer) return EMPTY;
    const data = node.buffer.getChannelData(0);
    if (!data.length) return EMPTY;
    const i0 = clampI(Math.round(node.started * sr));
    let i1 = node.stopped == null ? n : clampI(Math.round(node.stopped * sr));
    if (!node.loop) i1 = Math.min(i1, i0 + data.length);
    if (i1 <= i0) return EMPTY;
    const d = new Float32Array(i1 - i0);
    for (let i = 0; i < d.length; i++) d[i] = data[node.loop ? i % data.length : i];
    return { a: i0, d };
  }

  function renderBiquad(node) {
    const x = sumIn(node);
    if (!x.d.length) return EMPTY;
    const a = x.a;
    const b = clampI(end(x) + Math.round(RING * sr));
    const len = b - a;
    const freq = paramWindow(node.frequency, a, b, sr, nodeOut);
    const q = paramWindow(node.Q, a, b, sr, nodeOut);
    const gdb = paramWindow(node.gain, a, b, sr, nodeOut);
    const y = new Float32Array(len);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    let c = [1, 0, 0, 0, 0];
    let last = 0;
    for (let i = 0; i < len; i++) {
      if (i % BLOCK === 0) c = biquadCoefs(node.type, Math.min(1, freq[i] / (sr / 2)), q[i], gdb[i]);
      const xi = i < x.d.length ? x.d[i] : 0;
      const v = c[0] * xi + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
      x2 = x1; x1 = xi; y2 = y1; y1 = v;
      y[i] = v;
      if (v > 1e-5 || v < -1e-5) last = i;
    }
    // keep the window only as far as the filter still rings
    return { a, d: last + 1 < len ? y.subarray(0, last + 1) : y };
  }

  function renderShaper(node) {
    const x = sumIn(node);
    const cur = node.curve;
    if (!x.d.length || !cur || !cur.length) return x;
    const m = cur.length - 1;
    const d = new Float32Array(x.d.length);
    for (let i = 0; i < d.length; i++) {
      const v = x.d[i];
      const pos = ((v < -1 ? -1 : v > 1 ? 1 : v) + 1) * 0.5 * m;
      const k = Math.floor(pos);
      d[i] = cur[k] + ((k < m ? cur[k + 1] : cur[k]) - cur[k]) * (pos - k);
    }
    return { a: x.a, d };
  }

  function renderGain(node) {
    const x = sumIn(node);
    if (!x.d.length) return EMPTY;
    const g = paramWindow(node.gain, x.a, end(x), sr, nodeOut);
    const d = new Float32Array(x.d.length);
    for (let i = 0; i < d.length; i++) d[i] = x.d[i] * g[i];
    return { a: x.a, d };
  }

  function nodeOut(node) {
    if (memo.has(node)) return memo.get(node);
    if (busy.has(node)) return EMPTY; // a feedback loop: the echo is not simulated
    busy.add(node);
    let sig;
    switch (node.kind) {
      case 'osc': sig = renderOsc(node); break;
      case 'buffer': sig = renderBuffer(node); break;
      case 'biquad': sig = renderBiquad(node); break;
      case 'shaper': sig = renderShaper(node); break;
      case 'gain': sig = renderGain(node); break;
      case 'delay':
      case 'convolver': sig = EMPTY; break; // wet branches are left out
      default: sig = sumIn(node);
    }
    busy.delete(node);
    memo.set(node, sig);
    return sig;
  }

  const sig = nodeOut(ctx.destination);
  const out = new Float32Array(n);
  const f = Math.max(0, sig.a);
  const t = Math.min(n, end(sig));
  for (let i = f; i < t; i++) out[i] = sig.d[i - sig.a];
  return out;
}

const db = (v) => (v > 0 ? Math.max(-120, Math.round(200 * Math.log10(v)) / 10) : -120);

/**
 * Levels of a mono signal, in dBFS rounded to 0.1, with the gate's definitions (src/core/render.js,
 * measure): peak is the highest sample, rms is taken over the audible span (first to last sample
 * above -60 dBFS), end is the end of that span in seconds.
 */
export function measureSignal(y, sr, dur) {
  let pk = 0;
  let i0 = -1;
  let i1 = -1;
  let tail = 0;
  const cut = Math.round(dur * sr);
  for (let i = 0; i < y.length; i++) {
    const a = y[i] < 0 ? -y[i] : y[i];
    if (a > pk) pk = a;
    if (a > 0.001) { if (i0 < 0) i0 = i; i1 = i; }
    if (i >= cut && a > tail) tail = a;
  }
  let s2 = 0;
  const cnt = i0 < 0 ? 0 : i1 - i0 + 1;
  for (let i = Math.max(0, i0); cnt && i <= i1; i++) s2 += y[i] * y[i];
  return {
    peak: db(pk),
    rms: db(cnt ? Math.sqrt(s2 / cnt) : 0),
    end: i0 < 0 ? 0 : Math.round((1000 * (i1 + 1)) / sr) / 1000,
    tail: db(tail),
    silent: i0 < 0,
  };
}
