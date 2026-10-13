// A scanning beam: a wobbling triangle sweeping up and back (each turn continues from where the
// last ended), a narrow resonant noise riding it, and two square blips to confirm.
export default {
  id: 'scifi-scanner-sweep',
  name: 'Scanner Sweep',
  category: 'scifi',
  tags: ['scanner', 'scan', 'sweep', 'radar', 'sensor', 'detect', 'sonar'],
  desc: 'A narrow beam sweeping up and back with a wobble, ending on a two-blip confirm.',
  dur: 2.3,
  family: 'synthetic',
  moments: ['scan'],
  params: {
    pitch: { min: 300, max: 1200, def: 520, unit: 'Hz', desc: 'Bottom of the sweep; the beam climbs two octaves and the blips sit above' },
    sweeps: { min: 1, max: 3, def: 2, step: 1, desc: 'Number of beam passes, alternating up and back, before the confirm blips' },
    length: { min: 0.3, max: 0.7, def: 0.5, unit: 's', desc: 'Duration of each sweep' },
    wobble: { min: 0, max: 1, def: 0.5, desc: 'Depth of the fast tremolo on the beam, steady to warbling' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.sweeps);
    const L = p.length;
    for (let k = 0; k < n; k++) {
      const up = k % 2 === 0;
      const from = up ? p.pitch : p.pitch * 4;
      const to = up ? p.pitch * 4 : p.pitch;
      const at = t + k * L;
      const hold = { a: 0.04, s: 0.9, d: 0.05, r: 0.05, dur: L + 0.03 };
      T.osc(out, at, { type: 'triangle', f: from, to, glide: L, peak: 0.07, a: hold.a, s: hold.s, d: hold.d, r: hold.r, dur: hold.dur, trem: { rate: 14, depth: 0.7 * p.wobble } });
      T.osc(out, at, { f: from * 2, to: to * 2, glide: L, peak: 0.025, a: hold.a, s: hold.s, d: hold.d, r: hold.r, dur: hold.dur });
      T.noise(out, at, { filter: 'bandpass', f: from * 1.5, to: to * 1.5, q: 14, glide: L, peak: 0.4, a: hold.a, s: hold.s, d: hold.d, r: hold.r, dur: hold.dur });
    }
    const end = t + n * L;
    T.osc(out, end, { type: 'square', f: p.pitch * 4, dur: 0.05, peak: 0.045, a: 0.002 });
    T.osc(out, end + 0.08, { type: 'square', f: p.pitch * 6, dur: 0.07, peak: 0.045, a: 0.002 });
  },
};
