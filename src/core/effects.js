// Effects and routing. Each takes (out, t, o) like a voice, builds its nodes into `out`, and
// returns the node to play INTO. Chain them by passing one effect's input as the next one's out:
//   const verb = T.reverb(out, t, { time: 1.2, mix: 0.3 });
//   const lp = T.filter(verb, t, { type: 'lowpass', f: 3000, to: 400, dur: 0.4 });
//   T.noise(lp, t, { ... });
// An effect with a tail (delay, reverb) keeps sounding after the voices stop: the sound's dur must
// include that tail, and the level gate checks that it does.
import { env, glide } from './envelope.js';
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

/**
 * Stereo placement with an optional sweep. Returns the node to play into.
 *   o.x    position, -1 (left) .. 1 (right) (default 0); o.to sweep target; o.dur sweep s (default 0.3)
 * A balance law: the near side stays at unity and the far side falls linearly to silence, so a
 * centred voice is exactly the mono signal and placing one never raises its peak (the level gate's
 * numbers stay valid). Stereo input (a reverb) keeps its width. A sound that never pans stays mono
 * end to end, and Save WAV writes one channel for it.
 */
export function pan(out, t, o) {
  o = o || {};
  const c = out.context;
  const inp = c.createGain();
  const split = c.createChannelSplitter(2);
  const merge = c.createChannelMerger(2);
  const gl = c.createGain();
  const gr = c.createGain();
  inp.channelCount = 2;
  inp.channelCountMode = 'explicit';
  inp.channelInterpretation = 'speakers';
  const cl = (v) => Math.min(1, Math.max(-1, Number(v) || 0));
  const x0 = cl(o.x);
  const x1 = o.to == null ? x0 : cl(o.to);
  const dur = o.dur == null ? 0.3 : o.dur;
  // side = 1 shapes the left gain (it falls as x moves right), side = -1 the right one
  const shape = (param, side) => {
    const at = (x) => Math.min(1, 1 - side * x);
    param.value = at(x0);
    param.setValueAtTime(at(x0), t);
    if (x1 === x0 || !(dur > 0)) return;
    if (x0 * x1 < 0) param.linearRampToValueAtTime(1, t + (dur * -x0) / (x1 - x0));
    param.linearRampToValueAtTime(at(x1), t + dur);
  };
  shape(gl.gain, 1);
  shape(gr.gain, -1);
  inp.connect(split);
  split.connect(gl, 0);
  split.connect(gr, 1);
  gl.connect(merge, 0, 0);
  gr.connect(merge, 0, 1);
  merge.connect(out);
  return inp;
}

/**
 * A DC blocker: a gentle highpass (default 30 Hz, kept within 20..40) in one call. Returns the
 * node to play into. For waveshaped, crushed or one-sided material whose average drifts off zero
 * (the level gate fails DC above -50 dBFS). t is not needed: T.dcblock(out) works.
 *   o.f  cutoff Hz (default 30)
 */
export function dcblock(out, t, o) {
  const b = out.context.createBiquadFilter();
  b.type = 'highpass';
  b.frequency.value = Math.min(40, Math.max(20, (o && o.f) || 30));
  b.Q.value = 0.707;
  b.connect(out);
  return b;
}

/**
 * A low-frequency oscillator added to one of a node's parameters: tremolo on a T.gain, a wah on a
 * T.filter's frequency. The parameter keeps its own value and automation; the LFO swings around it.
 *   node     the node that owns the parameter (what T.gain or T.filter returned)
 *   o.param  its name: 'frequency' (the default when the node has one), 'gain', 'Q', 'detune'
 *   o.rate   Hz (default 5); o.to rate at the end (a speed-up or a slow-down)
 *   o.depth  the swing either way, in the parameter's own units: a gain 0..1, a frequency in Hz,
 *            detune in cents (default 0.5)
 *   o.type   wave (default 'sine'); o.dur how long it runs, s (default 1)
 *   o.a      fade-in s (default 0.005); the depth fades out over the last 10 ms, so stopping never clicks
 * Keep the swing inside the parameter's sensible range (a gain that swings below zero inverts the
 * signal). Returns the end time.
 */
export function lfo(node, t, o) {
  o = o || {};
  const c = node.context;
  const param = node[o.param || (node.frequency ? 'frequency' : 'gain')];
  const a = Math.max(0.002, o.a == null ? 0.005 : o.a);
  const end = t + Math.max(a + 0.02, o.dur == null ? 1 : o.dur);
  const depth = o.depth == null ? 0.5 : o.depth;
  const w = c.createOscillator();
  const d = c.createGain();
  w.type = o.type || 'sine';
  const rate = Math.max(0.01, o.rate || 5);
  glide(w.frequency, t, rate, o.to ? Math.max(0.01, o.to) : rate, end - t, 'exp');
  d.gain.value = 0;
  d.gain.setValueAtTime(0, t);
  d.gain.linearRampToValueAtTime(depth, t + a);
  d.gain.setValueAtTime(depth, end - 0.01);
  d.gain.linearRampToValueAtTime(0, end);
  w.connect(d);
  d.connect(param);
  w.start(t);
  w.stop(end + 0.05);
  return end;
}

/**
 * A group envelope: one gain stage shaped by env that several voices play into, so a chord or a
 * layered hit swells, holds and fades as one. The voices keep their own envelopes inside it.
 * Returns the node to play into.
 *   env options (see env): peak (default 1: the bus only shapes), a, dur, curve, s, d, r, tail, fade
 */
export function bus(out, t, o) {
  const g = out.context.createGain();
  env(g.gain, t, Object.assign({ peak: 1 }, o));
  g.connect(out);
  return g;
}
