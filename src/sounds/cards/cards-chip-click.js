// One clay poker chip knocked against another or dropped on the table: a hard noise tick, two
// narrow ringing bands at inharmonic ratios (the sound of a composite disc, not a bell) and, for a
// chip landing on felt, a small dull thump under it. Each play is a little different.
export default {
  id: 'cards-chip-click',
  name: 'Chip Click',
  category: 'cards',
  tags: ['chip', 'poker', 'click', 'clay', 'bet', 'casino', 'tap'],
  desc: 'A single poker chip clicked down: a crisp clay tick with a short ring and a hint of felt underneath.',
  dur: 0.12,
  family: 'wood',
  moments: ['chips'],
  params: {
    pitch: { min: 1600, max: 3600, def: 2500, unit: 'Hz', desc: 'Ring frequency of the clay bands: low duller chip, high crisper and brighter' },
    ring: { min: 0.02, max: 0.1, def: 0.05, unit: 's', desc: 'How long the clay ring lasts after the tick' },
    weight: { min: 0, max: 1, def: 0.4, desc: 'Felt thump under the click: 0 chip on chip, 1 heavy landing on felt' },
  },
  play(T, out, t, p) {
    const f = p.pitch * T.rand(0.97, 1.03);
    // the two bands are narrow, so their peaks are high for the level they deliver
    T.noise(out, t, { filter: 'bandpass', f, to: f * 0.93, q: 9, dur: p.ring, peak: 0.25, a: 0.001 });
    T.noise(out, t, { filter: 'bandpass', f: f * 1.62, to: f * 1.5, q: 9, dur: p.ring * 0.7, peak: 0.15, a: 0.001 });
    T.noise(out, t, { filter: 'highpass', f: 3800, to: 2600, q: 0.8, dur: 0.012, peak: 0.024, a: 0.001 });
    T.osc(out, t, { f: 700, to: 380, dur: 0.035, peak: 0.003 + 0.03 * p.weight, a: 0.002 });
  },
};
