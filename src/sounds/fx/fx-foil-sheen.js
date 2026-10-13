// A light catching shiny foil: three narrow bands of noise a major third apart glide upward together
// (a high, hollow comb) and swell to the middle of the sweep and fall away, over a soft breath of air,
// with a few tiny glints sparkling along the way. It is a one-shot for a triggered sheen (a hover, a
// tilt, a rare card turned over), not a loop: an idle foil shimmer stays silent by design.
export default {
  id: 'fx-foil-sheen',
  name: 'Foil Sheen',
  category: 'fx',
  tags: ['foil', 'sheen', 'shimmer', 'holo', 'shine', 'glint', 'sparkle', 'hover', 'rare', 'comb'],
  desc: 'A bright hollow sweep with a breath of air and a few tiny glints, like light sliding across foil. For a hover, a tilt or a shiny card being revealed.',
  dur: 0.78,
  family: 'air',
  params: {
    pitch: { min: 2500, max: 5500, def: 4200, unit: 'Hz', desc: 'Where the sheen starts; it climbs about a fifth as it passes' },
    length: { min: 0.2, max: 0.7, def: 0.4, unit: 's', desc: 'How long the sheen takes to sweep across' },
    breath: { min: 0, max: 1, def: 0.4, desc: 'Soft air under the sweep: 0 almost none, 1 a clear breathy whoosh' },
    shine: { min: 0, max: 1, def: 0.5, desc: 'How many tiny glints sparkle along the sweep: few to many' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const swell = L * 0.45;
    // the comb: bands a major third apart glide up together, peaking at the middle of the sweep
    const ratios = [1, 1.26, 1.59];
    for (let i = 0; i < 3; i++) {
      T.noise(out, t, { filter: 'bandpass', f: p.pitch * ratios[i], to: p.pitch * ratios[i] * 1.6, q: 14, dur: L, peak: 0.2 / (1 + 0.25 * i), a: swell });
    }
    // the breath of air the light rides on
    T.noise(out, t, { filter: 'bandpass', f: 1800, to: 2600, q: 0.6, dur: L + 0.05, peak: 0.015 + 0.04 * p.breath, a: swell });
    // the glints
    const n = 2 + Math.round(4 * p.shine);
    for (let k = 0; k < n; k++) {
      const at = t + L * (0.2 + (0.6 * (k + T.rand(0.1, 0.9))) / n);
      T.osc(out, at, { f: T.rand(3500, 7500), dur: 0.07, peak: 0.02, a: 0.001 });
    }
  },
};
