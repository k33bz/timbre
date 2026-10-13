// Effects and routing. Each takes (out, t, o) like a voice, builds its nodes into `out`, and
// returns the node to play INTO. Chain them by passing one effect's input as the next one's out:
//   const verb = T.reverb(out, t, { time: 1.2, mix: 0.3 });
//   const lp = T.filter(verb, t, { type: 'lowpass', f: 3000, to: 400, dur: 0.4 });
//   T.noise(lp, t, { ... });
// An effect with a tail (delay, reverb) keeps sounding after the voices stop: the sound's dur must
// include that tail, and the level gate checks that it does.
import { glide } from './envelope.js';
import { rand } from './random.js';

/** A plain gain stage (a trim) into out. Returns its input. */
export function gain(out, v) {
  const g = out.context.createGain();
  g.gain.value = v == null ? 1 : v;
  g.connect(out);
  return g;
}

/**
 * A biquad filter with an optional sweep.
 *   o.type 'lowpass' (default) | 'highpass' | 'bandpass' | 'peaking' | 'lowshelf' | 'highshelf' | 'notch'
 *   o.f start frequency (default 1000), o.to sweep target, o.dur sweep seconds (default 0.3),
 *   o.curve 'exp' (default) or 'lin', o.q (default 0.707), o.db gain for peaking and shelf types
 */
export function filter(out, t, o) {
  o = o || {};
  const b = out.context.createBiquadFilter();
  b.type = o.type || 'lowpass';
  const f = Math.max(20, o.f || 1000);
  glide(b.frequency, t, f, o.to ? Math.max(20, o.to) : f, o.dur == null ? 0.3 : o.dur, o.curve);
  b.Q.value = o.q == null ? 0.707 : o.q;
  if (o.db) b.gain.value = o.db;
  b.connect(out);
  return b;
}

/**
 * Waveshaper drive (tanh saturation), level-safe.
 *   o.amount 0..1 (default 0.5): 0 is nearly clean, 1 is heavy
 *   o.ref    the input level that comes out unchanged (default 0.25, a typical house voice peak)
 * Curve: y = ref * tanh(k x / ref) / tanh(k). Quiet material is lifted (that is the drive), but the
 * output never exceeds about ref, so turning the drive up thickens a sound without making it peak
 * louder.
 */
export function drive(out, t, o) {
  o = o || {};
  const ws = out.context.createWaveShaper();
  const k = 1 + 24 * Math.min(1, Math.max(0, o.amount == null ? 0.5 : o.amount));
  const ref = o.ref || 0.25;
  const n = 4096;
  const cur = new Float32Array(n);
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    cur[i] = (ref * Math.tanh((k * x) / ref)) / norm;
  }
  ws.curve = cur;
  ws.oversample = '2x';
  ws.connect(out);
  return ws;
}

/**
 * Bitcrush by quantizing the waveform with a waveshaper.
 *   o.bits 1..16 (default 6): levels per polarity = 2^(bits-1), counted up to o.ref
 *   o.ref  the level the steps are measured against (default 0.25, a typical house voice peak)
 * Rounding is symmetric, so it adds no DC; anything quieter than half a step becomes silence, which
 * is part of the sound (tails gate off in steps).
 */
export function crush(out, t, o) {
  o = o || {};
  const ws = out.context.createWaveShaper();
  const bits = Math.min(16, Math.max(1, o.bits == null ? 6 : o.bits));
  const steps = Math.pow(2, bits - 1);
  const ref = o.ref || 0.25;
  const n = 8192;
  const cur = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    cur[i] = (Math.round((x / ref) * steps) / steps) * ref;
  }
  ws.curve = cur;
  ws.oversample = 'none';
  ws.connect(out);
  return ws;
}

/**
 * Feedback delay (echo). The dry signal passes at unity; echoes are added on top.
 *   o.time seconds between echoes (default 0.18, 0.01..2)
 *   o.fb   feedback 0..0.9 (default 0.35)
 *   o.mix  echo level (default 0.35)
 *   o.tone lowpass in the loop in Hz (default 4000): each repeat gets darker
 */
export function delay(out, t, o) {
  o = o || {};
  const c = out.context;
  const inp = c.createGain();
  const dl = c.createDelay(2);
  const fbk = c.createGain();
  const wet = c.createGain();
  const lp = c.createBiquadFilter();
  dl.delayTime.value = Math.min(2, Math.max(0.01, o.time == null ? 0.18 : o.time));
  fbk.gain.value = Math.min(0.9, Math.max(0, o.fb == null ? 0.35 : o.fb));
  wet.gain.value = o.mix == null ? 0.35 : o.mix;
  lp.type = 'lowpass';
  lp.frequency.value = o.tone || 4000;
  inp.connect(out);
  inp.connect(dl);
  dl.connect(lp);
  lp.connect(fbk);
  fbk.connect(dl);
  lp.connect(wet);
  wet.connect(out);
  return inp;
}

/**
 * Reverb from a generated impulse response: seeded stereo noise under an exponential decay,
 * darkened by a one-pole lowpass, normalized to unit energy (so a steady input comes back at about
 * its own power). The dry signal passes at unity; the reverb is added on top.
 *   o.time seconds for the tail to fall 60 dB (default 1.2, 0.1..6)
 *   o.mix  reverb level (default 0.3)
 *   o.tone 0..1 (default 0.5): 0 dark, 1 bright
 *   o.pre  pre-delay seconds (default 0)
 */
export function reverb(out, t, o) {
  o = o || {};
  const c = out.context;
  const sr = c.sampleRate;
  const time = Math.min(6, Math.max(0.1, o.time == null ? 1.2 : o.time));
  const len = Math.ceil(time * sr);
  const ir = c.createBuffer(2, len, sr);
  const k = Math.exp(-6.9078 / (time * sr));
  const tone = Math.min(1, Math.max(0, o.tone == null ? 0.5 : o.tone));
  const coef = 0.08 + 0.9 * tone;
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    let e = 1;
    let energy = 0;
    for (let i = 0; i < len; i++) {
      lp += (rand() * 2 - 1 - lp) * coef;
      d[i] = lp * e;
      e *= k;
      energy += d[i] * d[i];
    }
    const sc = energy > 0 ? 1 / Math.sqrt(energy) : 0;
    for (let i = 0; i < len; i++) d[i] *= sc;
  }
  const inp = c.createGain();
  const conv = c.createConvolver();
  const wet = c.createGain();
  conv.normalize = false;
  conv.buffer = ir;
  wet.gain.value = o.mix == null ? 0.3 : o.mix;
  inp.connect(out);
  if (o.pre > 0) {
    const pd = c.createDelay(1);
    pd.delayTime.value = Math.min(1, o.pre);
    inp.connect(pd);
    pd.connect(conv);
  } else {
    inp.connect(conv);
  }
  conv.connect(wet);
  wet.connect(out);
  return inp;
}
