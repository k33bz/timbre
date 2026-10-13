// A blob changing shape: a two-voice FM tone whose pitch and brightness glide together while a
// resonant lowpass is swung back and forth (the wobble), with a few membrane bloops along the way.
// The up switch picks the direction: 1 swells (low and dull to high and bright), 0 shrinks back.
export default {
  id: 'fx-morph-blob',
  name: 'Blob Morph',
  category: 'fx',
  tags: ['morph', 'blob', 'transform', 'shapeshift', 'liquid', 'goo', 'wobble', 'evolve'],
  desc: 'A gooey wobbling tone that swells up (or shrinks back down) as a shape morphs, with a few soft bloops along the way.',
  dur: 1.1,
  family: 'synthetic',
  moments: ['transform'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 swells and brightens as the shape grows, 0 shrinks and darkens' },
    length: { min: 0.35, max: 1, def: 0.65, unit: 's', desc: 'How long the morph takes' },
    pitch: { min: 110, max: 260, def: 160, unit: 'Hz', desc: 'Low note of the morph; the other end sits about an octave and a quarter above' },
    wobble: { min: 2, max: 9, def: 5, unit: 'Hz', desc: 'How fast the goo wobbles: low a slow slosh, high a quick shiver' },
    goo: { min: 0, max: 1, def: 0.5, desc: 'Richness of the tone: 0 smooth and round, 1 buzzy and thick' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const up = p.up >= 0.5;
    const lo = p.pitch;
    const hi = p.pitch * 2.4;
    const a = up ? lo : hi;
    const b = up ? hi : lo;
    const i0 = 0.8;
    const i1 = 0.8 + 4.2 * p.goo;
    const ia = up ? i0 : i1;
    const ib = up ? i1 : i0;
    // the wobbling lowpass every voice plays through
    const clean = T.dcblock(out);
    const wah = T.filter(clean, t, { type: 'lowpass', f: up ? 500 : 2600, to: up ? 2600 : 500, dur: L, q: 3 });
    T.lfo(wah, t, { param: 'frequency', rate: p.wobble, to: p.wobble * 1.5, depth: 380, dur: L + 0.04, a: 0.05 });
    T.fm(wah, t, { f: a, to: b, ratio: 1, index: ia, index1: ib, dur: L, peak: 0.05, a: L * 0.25, tail: 0.15 });
    T.fm(wah, t, { f: a * 1.007, to: b * 1.007, ratio: 2, index: ia * 0.7, index1: ib * 0.7, dur: L, peak: 0.025, a: L * 0.25, tail: 0.15 });
    // membrane bloops: three small pops that follow the pitch up or down
    for (let k = 0; k < 3; k++) {
      const u = 0.2 + 0.6 * ((k + T.rand(0.1, 0.9)) / 3);
      const f = a * Math.pow(b / a, u) * 3;
      T.osc(out, t + L * u, { f, to: f * (up ? 1.5 : 0.7), dur: 0.07, peak: 0.014, a: 0.004 });
    }
  },
};
