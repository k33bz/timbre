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
 *   o.lp, o.hp  built-in lowpass / highpass after the oscillator: a cutoff in Hz, or
 *            { f, to, q, glide, curve } to sweep it (default q 0.707, glide as the pitch's)
 *   o.wave   a PeriodicWave to use instead of type (T.pulse builds one)
 */
export function osc(out, t, o) {
  o = o || {};
  const c = out.context;
  const dur = o.dur == null ? 0.2 : o.dur;
  const n = c.createOscillator();
  const g = c.createGain();
  n.type = o.type || 'sine';
  if (o.wave) n.setPeriodicWave(o.wave);
  const f = Math.max(20, o.f || 440);
  glide(n.frequency, t, f, o.to ? Math.max(20, o.to) : f, o.glide == null ? dur * 0.9 : o.glide, o.glideCurve);
  if (o.detune) n.detune.value = o.detune;
  const end = env(g.gain, t, o);
  let src = n;
  if (o.vib && o.vib.depth) {
    const wob = c.createOscillator();
    const lg = c.createGain();
    wob.frequency.value = o.vib.rate || 5;
    lg.gain.value = o.vib.depth;
    wob.connect(lg);
    lg.connect(n.detune);
    wob.start(t);
    wob.stop(end + 0.05);
  }
  if (o.trem && o.trem.depth > 0) {
    const depth = Math.min(1, o.trem.depth);
    const am = c.createGain();
    const wob = c.createOscillator();
    const lg = c.createGain();
    am.gain.value = 1 - depth / 2;
    lg.gain.value = depth / 2;
    wob.frequency.value = o.trem.rate || 6;
    wob.connect(lg);
    lg.connect(am.gain);
    n.connect(am);
    src = am;
    wob.start(t);
    wob.stop(end + 0.05);
  }
  for (const k of ['lp', 'hp']) {
    if (!o[k]) continue;
    const fo = typeof o[k] === 'number' ? { f: o[k] } : o[k];
    const b = c.createBiquadFilter();
    const fc = Math.max(20, fo.f || 1000);
    b.type = k === 'lp' ? 'lowpass' : 'highpass';
    glide(b.frequency, t, fc, fo.to ? Math.max(20, fo.to) : fc, fo.glide == null ? dur * 0.9 : fo.glide, fo.curve);
    b.Q.value = fo.q == null ? 0.707 : fo.q;
    src.connect(b);
    src = b;
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
 *   o.lp, o.hp  extra lowpass / highpass stages after the filter, as on osc (a cutoff in Hz, or
 *            { f, to, q, glide, curve })
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
  for (const k of ['lp', 'hp']) {
    if (!o[k]) continue;
    const fo = typeof o[k] === 'number' ? { f: o[k] } : o[k];
    const b = c.createBiquadFilter();
    const fc = Math.max(20, fo.f || 1000);
    b.type = k === 'lp' ? 'lowpass' : 'highpass';
    glide(b.frequency, t, fc, fo.to ? Math.max(20, fo.to) : fc, fo.glide == null ? dur * 0.9 : fo.glide, fo.curve);
    b.Q.value = fo.q == null ? 0.707 : fo.q;
    head.connect(b);
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
 *   o.tone    0..1: how bright the pluck itself is (the excitation is lowpassed, two poles, cutoff
 *             from about 120 Hz at 0 to open at 1): low is a soft, round thumb or nylon pluck, high
 *             a hard pick. Leave it out for the original unfiltered excitation.
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
  if (o.tone != null && o.tone < 1) {
    // a darker excitation: two passes of a one-pole lowpass, run twice around the period so the
    // filter has settled where the loop wraps
    const k = 1 - Math.exp((-2 * Math.PI * 120 * Math.pow(sr / 240, Math.max(0, o.tone))) / sr);
    for (let pass = 0; pass < 2; pass++) {
      let z = 0;
      for (let i = 0; i < 2 * ex; i++) { z += (y[i % ex] - z) * k; if (i >= ex) y[i - ex] = z; }
    }
    mean = 0;
    for (let i = 0; i < ex; i++) mean += y[i];
  }
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

/**
 * Pulse wave with a variable duty cycle (the classic 8-bit voice), built as a PeriodicWave so it is
 * band-limited like the built-in waves. Every osc option applies (f, to, glide, vib, trem, lp, hp
 * and the envelope).
 *   o.duty  fraction of each period spent high, 0.05..0.95 (default 0.25; 0.5 is a square, 0.125
 *           thin and nasal)
 * The wave is normalized like the built-in ones, so a pulse at a given peak sits near a square.
 */
export function pulse(out, t, o) {
  o = o || {};
  const duty = Math.min(0.95, Math.max(0.05, o.duty == null ? 0.25 : o.duty));
  const n = 128;
  const re = new Float32Array(n + 1);
  const im = new Float32Array(n + 1);
  for (let k = 1; k <= n; k++) {
    re[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
    im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
  }
  return osc(out, t, Object.assign({}, o, { wave: out.context.createPeriodicWave(re, im) }));
}

/**
 * A tick: a short burst of band-passed seeded noise with an optional pitched blip under it, and
 * seeded jitter so a repeated tick never sounds stamped. Clicks, keys, ratchets, clocks, grains.
 *   o.f        band center Hz (default 3000); o.q (default 1.5); o.filter (default 'bandpass')
 *   o.dur      burst length s (default 0.012); o.peak (default 0.1); o.lp, o.hp as on noise
 *   o.blip     Hz of a sine blip under the burst (default 0: none); o.blipTo its end pitch;
 *              o.blipPeak (default peak / 2); o.blipDur (default 0.03); o.blipType (default 'sine')
 *   o.jitter   0..1 (default 0): seeded variation of the band center (up to +/- 25%), the level
 *              (up to +/- 3 dB) and the blip pitch (up to +/- 50 cents)
 * It always draws three values for the jitter, so changing the amount never reshuffles the noise.
 * Returns the end time.
 */
export function tick(out, t, o) {
  o = o || {};
  const j = Math.min(1, Math.max(0, o.jitter || 0));
  const fr = 1 + 0.25 * j * (rand() * 2 - 1);
  const lv = Math.pow(10, (3 * j * (rand() * 2 - 1)) / 20);
  const br = Math.pow(2, (50 * j * (rand() * 2 - 1)) / 1200);
  const peak = (o.peak == null ? 0.1 : o.peak) * lv;
  let end = noise(out, t, {
    filter: o.filter || 'bandpass', f: (o.f || 3000) * fr, q: o.q == null ? 1.5 : o.q,
    dur: o.dur == null ? 0.012 : o.dur, peak, a: 0.002, lp: o.lp, hp: o.hp,
  });
  if (o.blip) {
    const bf = o.blip * br;
    const e = osc(out, t, {
      type: o.blipType || 'sine', f: bf, to: o.blipTo ? o.blipTo * br : bf, a: 0.002,
      dur: o.blipDur == null ? 0.03 : o.blipDur, peak: o.blipPeak == null ? peak / 2 : o.blipPeak * lv,
    });
    if (e > end) end = e;
  }
  return end;
}

/**
 * Crackle: bursts of band-passed seeded noise at random moments, each at a random level and a
 * center that drifts over the span. Fire, static, vinyl, sparks, frying. One noise source, one
 * filter and one gain carry every burst, so a long crackle stays cheap.
 *   o.dur     span the bursts fill, s (default 1); o.rate bursts per second on average (default 30)
 *   o.f       band center at the start, Hz (default 2500); o.to center at the end (default f)
 *   o.spread  random spread of each burst's center, in octaves either way (default 0.5); o.q (default 1.2)
 *   o.len     burst length s (default 0.006, 0.002..0.05); o.peak level of the loudest burst (default 0.2)
 *   o.vary    0..1 (default 0.7): how far burst levels fall below peak at random
 *   o.bend    pitch drift inside each burst, end center / start center (default 1: none)
 * Bursts never overlap. Returns the end of the last burst.
 */
export function crackle(out, t, o) {
  o = o || {};
  const c = out.context;
  const len = Math.min(0.05, Math.max(0.002, o.len == null ? 0.006 : o.len));
  const span = Math.max(len + 0.002, o.dur == null ? 1 : o.dur);
  const rate = Math.max(1, o.rate == null ? 30 : o.rate);
  const f0 = Math.max(40, o.f || 2500);
  const f1 = o.to ? Math.max(40, o.to) : f0;
  const spread = o.spread == null ? 0.5 : o.spread;
  const vary = Math.min(1, Math.max(0, o.vary == null ? 0.7 : o.vary));
  const bend = o.bend > 0 ? o.bend : 1;
  const peak = o.peak == null ? 0.2 : o.peak;
  const top = c.sampleRate * 0.45;
  const s = c.createBufferSource();
  const b = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noiseBuffer(c, 0.5);
  s.loop = true;
  b.type = 'bandpass';
  b.Q.value = o.q == null ? 1.2 : o.q;
  b.frequency.setValueAtTime(f0, t);
  g.gain.value = 0;
  g.gain.setValueAtTime(0, t);
  let at = t + rand() * Math.min(1 / rate, span - len);
  let end = t;
  while (at + len <= t + span + 1e-9) {
    const fc = Math.min(top, f0 * Math.pow(f1 / f0, (at - t) / span) * Math.pow(2, spread * (rand() * 2 - 1)));
    const lv = Math.max(0.0002, peak * (1 - vary * rand()));
    b.frequency.setValueAtTime(fc, at);
    if (bend !== 1) b.frequency.exponentialRampToValueAtTime(Math.min(top, fc * bend), at + len);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(lv, at + 0.0005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    g.gain.setValueAtTime(0, at + len);
    end = at + len;
    // the next burst: an exponential gap (a Poisson process) after this one ends
    at = end + 0.001 - Math.log(1 - rand()) / rate;
  }
  s.connect(b);
  b.connect(g);
  g.connect(out);
  s.start(t);
  s.stop(end + 0.05);
  return end;
}
