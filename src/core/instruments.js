// Sustained acoustic instruments for the darker moods: a bowed string section, a choir on the
// formant engine, a pipe organ, a tuned drum skin and the endless Shepard glissando. Each takes
// (out, t, o) like a voice and returns its end time. The ones computed into buffers (choir,
// shepard) draw their variation from the seeded generator, so a sound stays reproducible. Every
// table and helper an instrument needs lives inside its function: Copy carries a helper by its own
// source text, so nothing may sit at module level.
import { env, glide } from './envelope.js';
import { rand } from './random.js';
import { osc, noise } from './voices.js';
import { klatt, voiceOut } from './speech.js';

/**
 * A bowed string, or a section of them: sawtooth players through a wooden body (the resonances of a
 * cello's air and plate modes and its bridge hill, scaled by o.body), a little bow noise on top, and
 * one swell over the whole note.
 *   o.f        pitch Hz (default 130.81, a cello's C3); o.to a glide target; o.glide its seconds
 *   o.dur      total length s (default 2); o.a bow attack s (default 30% of dur, at most 0.35);
 *              o.r release s (default 30% of dur, at most 0.4); o.peak level (default 0.12)
 *   o.players  1..8 (default 1): more players, each a few cents off and with its own vibrato,
 *              thicken one instrument into a section
 *   o.body     size of the body: 1 a cello (default), about 1.5 a viola, 0.6 a double bass
 *   o.bright   0..1 (default 0.5): how far the top end opens, from muted to bright and edgy
 *   o.pressure 0..1 (default 0.4): bow noise and grit, from a smooth legato to a scratchy dig
 *   o.vib      vibrato depth in cents (default 12; 0 for a cold, straight tone); o.vibRate Hz (5.2)
 *   o.trem     bowed tremolo, strokes per second (0 or absent: a long bow), the nervous horror
 *              shiver at about 12 to 16
 */
export function bow(out, t, o) {
  o = o || {};
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const c = out.context;
  const f = Math.max(30, o.f || 130.81);
  const dur = Math.max(0.12, o.dur == null ? 2 : o.dur);
  const a = Math.max(0.01, o.a == null ? Math.min(0.35, dur * 0.3) : o.a);
  const r = Math.max(0.02, o.r == null ? Math.min(0.4, dur * 0.3) : o.r);
  const players = Math.round(clamp(o.players || 1, 1, 8));
  const body = clamp(o.body || 1, 0.3, 3);
  const bright = clamp(o.bright == null ? 0.5 : o.bright, 0, 1);
  const press = clamp(o.pressure == null ? 0.4 : o.pressure, 0, 1);
  const vib = o.vib == null ? 12 : Math.max(0, o.vib);
  const vibRate = o.vibRate || 5.2;
  // the body: highpass under the string, three body modes, the bridge hill, then the top rolled off
  let node = c.createGain();
  node.gain.value = 0;
  const end = env(node.gain, t, { peak: o.peak == null ? 0.12 : o.peak, a, dur, s: 1, d: 0.01, r, curve: 'lin' });
  node.connect(out);
  const stages = [
    { type: 'lowpass', f: 1400 + 6000 * bright * bright, q: 0.6 },
    { type: 'peaking', f: 2600, q: 0.9, db: 2 + 3 * bright },
    { type: 'peaking', f: 580 * body, q: 3, db: 4 },
    { type: 'peaking', f: 400 * body, q: 2.5, db: 5 },
    { type: 'peaking', f: 190 * body, q: 3, db: 6 },
    { type: 'highpass', f: Math.max(30, f * 0.7), q: 0.5 },
  ];
  for (const s of stages) {
    const b = c.createBiquadFilter();
    b.type = s.type;
    b.frequency.value = Math.min(c.sampleRate * 0.45, s.f);
    b.Q.value = s.q;
    if (s.db) b.gain.value = s.db;
    b.connect(node);
    node = b;
  }
  const lvl = 0.5 / Math.sqrt(players);
  for (let k = 0; k < players; k++) {
    // each player: its own few cents, vibrato speed and a slightly late entry (always drawn, so the
    // player count never reshuffles the others)
    const cents = players > 1 ? (rand() * 2 - 1) * 9 : 0;
    const rate = vibRate * (0.9 + 0.2 * rand());
    const late = players > 1 ? rand() * Math.min(0.06, a * 0.5) : 0;
    const fk = f * Math.pow(2, cents / 1200);
    osc(node, t + late, {
      type: 'sawtooth', f: fk, to: o.to ? o.to * Math.pow(2, cents / 1200) : fk, glide: o.glide,
      dur: Math.max(0.05, end - t - late), peak: lvl, a: 0.01, s: 1, d: 0.01, r: 0.01, curve: 'lin',
      vib: vib > 0 ? { rate, depth: vib } : null,
      trem: o.trem > 0 ? { rate: o.trem * (0.97 + 0.06 * rand()), depth: 0.85 } : null,
    });
  }
  // the bow on the string: band-passed noise a few octaves up, louder as the bow digs in
  if (press > 0) {
    noise(node, t, {
      filter: 'bandpass', f: clamp(f * 9, 1200, 6000), q: 0.8, dur: end - t, peak: 0.25 * press * press + 0.04 * press,
      a: Math.min(a, 0.1), s: 0.6, d: 0.1, r: 0.01, curve: 'lin',
    });
  }
  return end;
}

/**
 * A choir: several singers on the formant engine, each a few cents apart with its own vibrato and
 * breath, holding one vowel (or moving from one to another) on one note or a chord.
 *   o.notes   Hz list (a chord; singers are dealt round the notes) or o.f one note (default 220)
 *   o.voices  singers, 1..12 (default 6)
 *   o.vowel   'oo' | 'oh' | 'ah' | 'eh' | 'ee' | 'mm' (a closed hum; default 'oo'); o.to a vowel to
 *             move to over the note
 *   o.dur     length of the singing s (default 3); o.a swell in s (default 0.6); o.r fade s (0.8)
 *   o.spread  how far apart the singers drift, cents (default 14)
 *   o.vib     vibrato depth in semitones (default 0.12); o.breath 0..1 (default 0.08), air in the tone
 *   o.formant voice size: 1 men, about 1.15 women (default from the pitch: 1.15 above 260 Hz)
 *   o.room    { time, mix } a hall around them (voiceOut's reverb; it lengthens the buffer by time)
 *   o.fx      any other voiceOut effects (hp, lp, eq, drive); o.peak level (default 0.16)
 * Returns the end time (the room's tail included).
 */
export function choir(out, t, o) {
  o = o || {};
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // Choir vowels: F1, F2, F3 (Peterson and Barney) and how dark the source is (tilt). 'mm' is a closed
  // hum: a low first formant, the rest damped.
  const VOWELS = {
    oo: [300, 870, 2240, 0.55], oh: [497, 910, 2459, 0.45], ah: [730, 1090, 2440, 0.35],
    eh: [530, 1840, 2480, 0.4], ee: [270, 2290, 3010, 0.45], mm: [250, 1050, 2300, 0.85],
  };
  const sr = out.context.sampleRate;
  const notes = [].concat(o.notes || o.f || 220).map((x) => clamp(x, 40, 1200));
  const n = Math.round(clamp(o.voices || 6, 1, 12));
  const dur = Math.max(0.2, o.dur == null ? 3 : o.dur);
  const a = clamp(o.a == null ? 0.6 : o.a, 0.02, dur * 0.8);
  const r = clamp(o.r == null ? 0.8 : o.r, 0.02, dur - a);
  const spread = o.spread == null ? 14 : o.spread;
  const v0 = VOWELS[o.vowel] || VOWELS.oo;
  const v1 = VOWELS[o.to] || v0;
  const breath = clamp(o.breath == null ? 0.08 : o.breath, 0, 1);
  const len = Math.ceil((dur + 0.1) * sr);
  const sum = new Float32Array(len);
  for (let k = 0; k < n; k++) {
    const base = notes[k % notes.length];
    const fs = o.formant || (base > 260 ? 1.15 : 1);
    const f0 = base * Math.pow(2, ((rand() * 2 - 1) * spread) / 1200);
    const late = rand() * 0.08;
    const rate = 4.4 + 1.4 * rand();
    const d = dur - late;
    const sing = 0.75 + 0.25 * rand();
    const F = (v, s) => [s, v[0] * fs, v[1] * fs, v[2] * fs, 3500 * fs, 4500 * fs, 50 + 0.04 * v[0], 60 + 0.025 * v[1], 100 + 0.02 * v[2], 250, 300, 270 * fs, 6000 * fs];
    const plan = {
      dur: d,
      f0: [0, f0, d, f0],
      amp: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, a, sing, breath, 0, 0, 0, 0, 0, 0, 0, Math.max(a, d - r), sing, breath, 0, 0, 0, 0, 0, 0, 0, d, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      form: [...F(v0, 0), ...F(v1, d)],
    };
    const y = klatt(sr, plan, { oq: 0.7, tilt: (v0[3] + v1[3]) / 2, jitter: 0.002, shimmer: 0.012, vib: { rate, depth: o.vib == null ? 0.12 : o.vib } });
    const off = Math.round(late * sr);
    for (let i = 0; i < y.length && i + off < len; i++) sum[i + off] += y[i];
  }
  return voiceOut(out, t, sum, { peak: o.peak == null ? 0.16 : o.peak, fx: Object.assign({ hp: 70 }, o.fx || {}, o.room ? { room: o.room } : {}) });
}

/**
 * A pipe organ: each note is a set of ranks (one PeriodicWave), a second set a few cents off for the
 * shimmer of a celeste, a breathy chiff as each pipe speaks, and an optional tremulant.
 *   o.notes   Hz list or o.f one note (default 130.81); o.dur, o.peak (default 0.12, shared by the
 *             notes), o.a speech of the pipes s (default 0.07), o.r release s (default 0.25)
 *   o.stops   'principal' (default) | 'flute' | 'full' | 'reed', or seven levels for the footages
 *             16', 8', 4', 2 2/3', 2', 1 3/5', 1'
 *   o.celeste 0..20 cents (default 4): the second rank's detune; 0 for one dry rank
 *   o.chiff   0..1 (default 0.5): the puff of air as each pipe speaks
 *   o.trem    tremulant depth 0..1 (default 0); o.tremRate Hz (default 6)
 */
export function organ(out, t, o) {
  o = o || {};
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // Organ stops as footages, by harmonic of the 16' pitch: 16', 8', 4', 2 2/3', 2', 1 3/5', 1'
  const RANKS = [1, 2, 4, 6, 8, 10, 16];
  const STOPS = {
    principal: [0.35, 1, 0.55, 0.2, 0.3, 0.08, 0.12],
    flute: [0.5, 1, 0.35, 0, 0.1, 0, 0],
    full: [0.7, 1, 0.8, 0.45, 0.6, 0.3, 0.4],
    reed: [0.3, 1, 0.7, 0.5, 0.45, 0.35, 0.3],
  };
  const c = out.context;
  const notes = [].concat(o.notes || o.f || 130.81).map((x) => clamp(x, 30, 2000));
  const dur = Math.max(0.1, o.dur == null ? 2 : o.dur);
  const lv = typeof o.stops === 'string' || !o.stops ? STOPS[o.stops] || STOPS.principal : o.stops;
  const re = new Float32Array(33);
  const im = new Float32Array(33);
  for (let k = 0; k < RANKS.length; k++) {
    const h = RANKS[k];
    im[h] += lv[k] || 0;
    // a flue pipe is not a pure sine: a little of its own octave
    if (h * 2 <= 32) im[h * 2] += 0.12 * (lv[k] || 0);
  }
  const wave = c.createPeriodicWave(re, im);
  const peak = (o.peak == null ? 0.12 : o.peak) / Math.sqrt(notes.length);
  const cel = o.celeste == null ? 4 : clamp(o.celeste, 0, 20);
  const chiff = clamp(o.chiff == null ? 0.5 : o.chiff, 0, 1);
  const a = Math.max(0.01, o.a == null ? 0.07 : o.a);
  const r = Math.max(0.02, o.r == null ? 0.25 : o.r);
  const trem = o.trem > 0 ? { rate: o.tremRate || 6, depth: clamp(o.trem, 0, 1) } : null;
  let end = t;
  for (const f of notes) {
    const shape = { wave, f: f / 2, dur, a, s: 1, d: 0.02, r, curve: 'lin', trem };
    end = Math.max(end, osc(out, t, Object.assign({}, shape, { peak: cel > 0 ? peak * 0.62 : peak })));
    if (cel > 0) osc(out, t, Object.assign({}, shape, { detune: cel, peak: peak * 0.38 }));
    if (chiff > 0) {
      noise(out, t, { filter: 'bandpass', f: clamp(f * 4, 400, 9000), q: 3, dur: 0.09, a: 0.004, peak: peak * 0.5 * chiff });
    }
  }
  return end;
}

/**
 * A struck drum skin: its modes ringing down, the pitch sagging as the skin relaxes, the mallet's
 * contact on top, and (for the big drums) a low push of air.
 *   o.kind  'timpani' (default) | 'taiko' | 'tom'; o.modes [[ratio, level, decay], ...] overrides
 *   o.f     pitch Hz (default 98, a G2 kettle); o.drop end pitch as a ratio of the start
 *   o.dur   ring time s (default by kind); o.peak (default 0.22)
 *   o.stick 0..1 (default 0.5): how much of the mallet you hear, from a soft felt to a hard stick
 *   o.boom  0..1 (default 0.6 for taiko, 0.3 otherwise): the low push of air under the skin
 */
export function membrane(out, t, o) {
  o = o || {};
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // Drum skins: [ratio, level, decay share] per mode. A timpani's modes sit close to a harmonic
  // series (that is why it has a pitch); a taiko's are rougher and die quicker.
  const SKINS = {
    timpani: { modes: [[1, 1, 1], [1.5, 0.55, 0.8], [1.98, 0.4, 0.65], [2.44, 0.25, 0.5], [2.94, 0.15, 0.4], [3.42, 0.08, 0.3]], drop: 0.985, dur: 2.5, stick: 1200 },
    taiko: { modes: [[1, 1, 1], [1.59, 0.45, 0.5], [2.14, 0.25, 0.35], [2.65, 0.15, 0.25]], drop: 0.82, dur: 1.2, stick: 700 },
    tom: { modes: [[1, 1, 1], [1.59, 0.35, 0.4], [2.14, 0.15, 0.3]], drop: 0.9, dur: 0.6, stick: 2200 },
  };
  const kind = SKINS[o.kind] || SKINS.timpani;
  const f = clamp(o.f || 98, 25, 1000);
  const dur = Math.max(0.08, o.dur == null ? kind.dur : o.dur);
  const peak = o.peak == null ? 0.22 : o.peak;
  const drop = o.drop || kind.drop;
  const stick = clamp(o.stick == null ? 0.5 : o.stick, 0, 1);
  const boom = clamp(o.boom == null ? (o.kind === 'taiko' ? 0.6 : 0.3) : o.boom, 0, 1);
  let end = t;
  for (const m of o.modes || kind.modes) {
    const fm = f * m[0];
    if (fm > out.context.sampleRate * 0.45) continue;
    end = Math.max(end, osc(out, t, {
      f: fm, to: fm * drop, glide: Math.min(0.4, dur * 0.3), dur: Math.max(0.05, dur * m[2]), peak: peak * m[1] * 0.5, a: 0.003,
    }));
  }
  if (boom > 0) {
    end = Math.max(end, osc(out, t, { f: f * 0.75, to: f * 0.5, glide: 0.2, dur: Math.min(dur, 0.35), peak: peak * 0.6 * boom, a: 0.004 }));
  }
  if (stick > 0) {
    noise(out, t, { filter: 'lowpass', f: kind.stick * (0.5 + stick), q: 0.7, dur: 0.012 + 0.03 * (1 - stick), a: 0.001, peak: peak * (0.15 + 0.5 * stick) });
  }
  return end;
}

/**
 * The Shepard-Risset glissando: octave-spaced tones all sliding the same way under a fixed bell
 * curve of level, so new tones fade in at one end as old ones fade out at the other and the pitch
 * seems to rise (or fall) for ever. Computed into a buffer.
 *   o.rate    octaves per second (default -0.15: falling; positive rises)
 *   o.center  Hz at the top of the level curve (default 330); o.width its spread in octaves (1.3)
 *   o.tones   how many octaves are sounding (default 8)
 *   o.dur     s (default 4); o.a fade in s (default 0.5); o.r fade out s (default 0.6)
 *   o.peak    (default 0.16); o.edge 0..1 (default 0): adds each tone's octave and fifth, from a
 *             pure sine to a reedy, organ-like buzz
 */
export function shepard(out, t, o) {
  o = o || {};
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const c = out.context;
  const sr = c.sampleRate;
  const dur = Math.max(0.2, o.dur == null ? 4 : o.dur);
  const rate = o.rate == null ? -0.15 : o.rate;
  const tones = Math.round(clamp(o.tones || 8, 3, 10));
  const center = clamp(o.center || 330, 60, 4000);
  const width = Math.max(0.3, o.width || 1.3);
  const edge = clamp(o.edge || 0, 0, 1);
  const a = clamp(o.a == null ? 0.5 : o.a, 0.005, dur / 2);
  const r = clamp(o.r == null ? 0.6 : o.r, 0.005, dur / 2);
  const len = Math.ceil(dur * sr);
  const buf = c.createBuffer(1, len, sr);
  const y = buf.getChannelData(0);
  const fmin = center * Math.pow(2, -tones / 2);
  const ph = new Float64Array(tones);
  const tw = (2 * Math.PI) / sr;
  const mid = tones / 2;
  let pk = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / sr;
    let v = 0;
    for (let k = 0; k < tones; k++) {
      let p = (k + rate * tt) % tones;
      if (p < 0) p += tones;
      const fk = fmin * Math.pow(2, p);
      const g = Math.exp(-((p - mid) * (p - mid)) / (2 * width * width));
      ph[k] += tw * fk;
      if (ph[k] > 1e6) ph[k] -= 2 * Math.PI * Math.floor(ph[k] / (2 * Math.PI));
      let s = Math.sin(ph[k]);
      if (edge > 0) s += edge * (0.35 * Math.sin(2 * ph[k]) + 0.2 * Math.sin(3 * ph[k]));
      v += g * s;
    }
    y[i] = v;
    const m = v < 0 ? -v : v;
    if (m > pk) pk = m;
  }
  const k = pk > 0 ? 1 / pk : 0;
  const ia = a * sr;
  const ir = r * sr;
  for (let i = 0; i < len; i++) y[i] *= k * Math.min(1, i / ia, (len - 1 - i) / ir);
  const s = c.createBufferSource();
  const gn = c.createGain();
  s.buffer = buf;
  gn.gain.value = 0;
  gn.gain.setValueAtTime(o.peak == null ? 0.16 : o.peak, t);
  s.connect(gn);
  gn.connect(out);
  s.start(t);
  s.stop(t + dur + 0.05);
  glide(gn.gain, t + dur, o.peak == null ? 0.16 : o.peak, 0, 0.001, 'lin');
  return t + dur;
}
