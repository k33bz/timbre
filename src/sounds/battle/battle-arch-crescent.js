// Spinning blades thrown in an arc: each a tremolo whirr that swings across the stereo field,
// ending in a low pop and a short burst of bright points. The points are three quick pings with a
// short fall and no reverb, so the burst stays dry enough to sit under an element strike.
export default {
  id: 'battle-arch-crescent',
  name: 'Spinning Crescents',
  category: 'battle',
  tags: ['crescent', 'whirr', 'twirl', 'arc', 'blades', 'scatter', 'attack', 'battle', 'archetype'],
  desc: 'Up to three spinning blades whirring across in an arc, bursting into bright points at the end. Dry, so it stacks under any element.',
  dur: 0.92,
  moments: ['attack'],
  family: 'synthetic',
  params: {
    flight: { min: 0.2, max: 0.55, def: 0.36, unit: 's', desc: 'How long the blades fly before they burst' },
    spin: { min: 6, max: 24, def: 14, unit: 'Hz', desc: 'How fast the blades whirr; low a slow throb, high a buzzing spin' },
    discs: { min: 1, max: 3, def: 3, step: 1, desc: 'How many blades are thrown, each a little higher than the last' },
    stars: { min: 0, max: 1, def: 0.6, desc: 'Level and length of the bright points at the end, 0 none' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.discs);
    const b = t + p.flight;
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.06;
      const d = Math.max(0.12, b - at);
      // each blade crosses from one side to the other, the next one the other way round
      const lane = T.pan(out, at, { x: k % 2 ? 0.7 : -0.7, to: k % 2 ? -0.7 : 0.7, dur: d });
      const f = 1046.5 * (1 + 0.12 * k);
      T.osc(lane, at, { type: 'triangle', f, to: f * 1.1, dur: d, peak: 0.04, a: 0.1, trem: { rate: p.spin, depth: 0.8 } });
    }
    // the burst: a low pop, then three bright points climbing and a breath of air
    T.osc(out, b, { f: 180, to: 80, dur: 0.18, peak: 0.085, a: 0.004 });
    if (p.stars > 0.02) {
      [1318.5, 1760, 2637].forEach((f, k) => {
        T.osc(out, b + k * 0.035, { type: 'triangle', f, dur: 0.12 + 0.18 * p.stars, peak: 0.052 * p.stars, a: 0.004 });
      });
      T.noise(out, b, { filter: 'highpass', f: 5000, to: 7000, q: 0.8, dur: 0.1, peak: 0.035 * p.stars, a: 0.005 });
    }
  },
};
