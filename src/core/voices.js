// Voices. Each takes (out, t, o): the node to play into, the start time, and options, and returns
// the time its envelope ends. Every voice routes through env(), so every voice's gain is zero
// before its first automation event, and every source is stopped 50 ms after its envelope ends.
// Envelope options shared by all voices: peak, a, dur, curve, s, d, r (see env).
import { env, glide } from './envelope.js';
import { rand, noiseBuffer } from './random.js';

/**
 * Oscillator with an optional pitch glide.
 *   o.type   'sine' | 'triangle' | 'square' | 'sawtooth' (default 'sine')
 *   o.f      start frequency in Hz (default 440); o.to end frequency (glide when set)
 *   o.glide  glide seconds (default 90% of dur); o.glideCurve 'exp' (default) or 'lin'
 *   o.detune cents
 *   o.vib    { rate Hz, depth cents }  pitch wobble
 *   o.trem   { rate Hz, depth 0..1 }   level wobble (1 = the level dips to silence)
 */
export function osc(out, t, o) {
  o = o || {};
  const c = out.context;
  const dur = o.dur == null ? 0.2 : o.dur;
  const n = c.createOscillator();
  const g = c.createGain();
  n.type = o.type || 'sine';
  const f = Math.max(20, o.f || 440);
  glide(n.frequency, t, f, o.to ? Math.max(20, o.to) : f, o.glide == null ? dur * 0.9 : o.glide, o.glideCurve);
  if (o.detune) n.detune.value = o.detune;
  const end = env(g.gain, t, o);
  let src = n;
  if (o.vib && o.vib.depth) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = o.vib.rate || 5;
    lg.gain.value = o.vib.depth;
    lfo.connect(lg);
    lg.connect(n.detune);
    lfo.start(t);
    lfo.stop(end + 0.05);
  }
  if (o.trem && o.trem.depth > 0) {
    const depth = Math.min(1, o.trem.depth);
    const am = c.createGain();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    am.gain.value = 1 - depth / 2;
    lg.gain.value = depth / 2;
    lfo.frequency.value = o.trem.rate || 6;
    lfo.connect(lg);
    lg.connect(am.gain);
    n.connect(am);
    src = am;
    lfo.start(t);
    lfo.stop(end + 0.05);
  }
  src.connect(g);
  g.connect(out);
  n.start(t);
  n.stop(end + 0.05);
  return end;
}

/**
 * A burst of seeded white noise through a filter that can sweep.
 *   o.filter 'lowpass' | 'highpass' | 'bandpass' | 'notch' | ... (default 'bandpass'); 'none' = raw
 *   o.f      cutoff or center in Hz (default 1000); o.to sweep target; o.q resonance (default 1)
 *   o.glide  sweep seconds (default 90% of dur); o.glideCurve 'exp' (default) or 'lin'
 * Narrow bands throw most of the noise energy away, so a bandpass voice needs a higher peak than an
 * oscillator to sound as loud. Measure, do not guess.
 */
export function noise(out, t, o) {
  o = o || {};
  const c = out.context;
  const dur = o.dur == null ? 0.2 : o.dur;
  const s = c.createBufferSource();
  const g = c.createGain();
  s.buffer = noiseBuffer(c, Math.max(dur, (o.a || 0.005) + 0.01) + 0.06);
  s.loop = true;
  let head = s;
  if (o.filter !== 'none') {
    const b = c.createBiquadFilter();
    b.type = o.filter || 'bandpass';
    const f = Math.max(40, o.f || 1000);
    glide(b.frequency, t, f, o.to ? Math.max(40, o.to) : f, o.glide == null ? dur * 0.9 : o.glide, o.glideCurve);
    b.Q.value = o.q == null ? 1 : o.q;
    s.connect(b);
    head = b;
  }
  const end = env(g.gain, t, o);
  head.connect(g);
  g.connect(out);
  s.start(t);
  s.stop(end + 0.05);
  return end;
}

/**
 * Two-operator FM: a modulator at f * ratio drives the carrier's frequency.
 *   o.f, o.to, o.glide, o.glideCurve  carrier pitch and glide (the modulator follows at the ratio)
 *   o.ratio   modulator / carrier frequency (default 2; non-integer ratios ring like metal)
 *   o.index   modulation index at the start (default 2); o.index1 at the end (default = index)
 *   o.type    carrier wave (default 'sine'); o.modType modulator wave (default 'sine')
 */
export function fm(out, t, o) {
  o = o || {};
  const c = out.context;
  const dur = o.dur == null ? 0.3 : o.dur;
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const depth = c.createGain();
  const g = c.createGain();
  car.type = o.type || 'sine';
  mod.type = o.modType || 'sine';
  const f = Math.max(20, o.f || 440);
  const to = o.to ? Math.max(20, o.to) : f;
  const ratio = o.ratio || 2;
  const gl = o.glide == null ? dur * 0.9 : o.glide;
  glide(car.frequency, t, f, to, gl, o.glideCurve);
  glide(mod.frequency, t, f * ratio, to * ratio, gl, o.glideCurve);
  const i0 = o.index == null ? 2 : o.index;
  const i1 = o.index1 == null ? i0 : o.index1;
  const end = env(g.gain, t, o);
  glide(depth.gain, t, i0 * f * ratio, i1 * to * ratio, end - t, 'lin');
  mod.connect(depth);
  depth.connect(car.frequency);
  car.connect(g);
  g.connect(out);
  car.start(t);
  mod.start(t);
  car.stop(end + 0.05);
  mod.stop(end + 0.05);
  return end;
}

/**
 * Karplus-Strong plucked string, computed into a buffer (a DelayNode loop cannot go below one
 * 128-sample render quantum, which would cap the pitch near 350 Hz).
 *   o.f       pitch in Hz (default 220)
 *   o.dur     seconds until the string has rung down 60 dB (default 0.8)
 *   o.bright  0..1 (default 0.5): how slowly the high partials die
 *   o.peak    output peak (the buffer is normalized, so this is the true peak pre-master)
 */
export function pluck(out, t, o) {
  o = o || {};
  const c = out.context;
  const sr = c.sampleRate;
  const dur = Math.max(0.05, o.dur == null ? 0.8 : o.dur);
  const f = Math.max(30, Math.min(sr / 4, o.f || 220));
  const len = Math.ceil((dur + 0.06) * sr);
  const buf = c.createBuffer(1, len, sr);
  const y = buf.getChannelData(0);
  const bright = Math.min(1, Math.max(0, o.bright == null ? 0.5 : o.bright));
  const w = 0.5 - 0.45 * bright;           // weight of the older sample in the loop's averager
  const P = sr / f;                         // samples per period
  const D = P - w;                          // the averager itself delays by w samples
  const N = Math.floor(D);
  const fr = D - N;
  const fb = Math.pow(0.001, 1 / (f * dur)); // -60 dB after dur seconds
  const ex = Math.min(len, Math.round(P));
  // the excitation: one period of seeded noise with its mean removed (the loop passes DC almost
  // untouched, so a short burst's random offset would otherwise ride under the whole note)
  let mean = 0;
  for (let i = 0; i < ex; i++) { y[i] = rand() * 2 - 1; mean += y[i]; }
  mean /= ex;
  for (let i = 0; i < ex; i++) y[i] -= mean;
  let pk = 0;
  for (let i = 0; i < len; i++) {
    let v = y[i];
    if (i - N - 2 >= 0) {
      const d0 = y[i - N] + (y[i - N - 1] - y[i - N]) * fr;
      const d1 = y[i - N - 1] + (y[i - N - 2] - y[i - N - 1]) * fr;
      v += fb * ((1 - w) * d0 + w * d1);
    }
    y[i] = v;
    const m = v < 0 ? -v : v;
    if (m > pk) pk = m;
  }
  if (pk > 0) for (let i = 0; i < len; i++) y[i] /= pk;
  const s = c.createBufferSource();
  const g = c.createGain();
  s.buffer = buf;
  const end = env(g.gain, t, {
    peak: o.peak == null ? 0.2 : o.peak, a: o.a == null ? 0.002 : o.a, dur, s: 1, d: 0.002,
    r: Math.min(0.05, dur * 0.2),
  });
  s.connect(g);
  g.connect(out);
  s.start(t);
  s.stop(end + 0.05);
  return end;
}

/**
 * Additive bell: a set of sine partials, each with its own level and decay.
 *   o.f         fundamental in Hz (default 880)
 *   o.partials  [[ratio, level, decay], ...] (level and decay relative to o.peak and o.dur);
 *               default is a struck-metal set with inharmonic ratios 1, 2.76, 5.40, 8.93
 *   o.drift     end pitch as a ratio of the start (default 1: none; 0.98 = a slight droop)
 *   o.peak      level of a partial at level 1; o.dur, o.a, o.curve as in env; o.type wave
 */
export function bell(out, t, o) {
  o = o || {};
  const f = o.f || 880;
  const dur = o.dur == null ? 1 : o.dur;
  const peak = o.peak == null ? 0.15 : o.peak;
  const drift = o.drift == null ? 1 : o.drift;
  const parts = o.partials || [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.25, 0.4], [8.93, 0.12, 0.25]];
  let end = t;
  for (let k = 0; k < parts.length; k++) {
    const pr = parts[k];
    const e = osc(out, t, {
      type: o.type || 'sine', f: f * pr[0], to: f * pr[0] * drift,
      dur: Math.max(0.03, dur * (pr[2] == null ? 1 : pr[2])), peak: peak * (pr[1] == null ? 1 : pr[1]),
      a: o.a == null ? 0.002 : o.a, curve: o.curve,
    });
    if (e > end) end = e;
  }
  return end;
}
