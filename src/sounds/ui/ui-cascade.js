// A row of items popping in one after another: short sine pops that each bend up a hair, climbing a
// pentatonic scale while they roll from the left of the stereo field to the right, the last one
// ringing a little longer. Where ui-expand is a single stepped run, this is a quick rolling shower
// meant for staggered lists, chips and words.
export default {
  id: 'ui-cascade',
  name: 'Stagger Cascade',
  category: 'ui',
  tags: ['cascade', 'stagger', 'pop-in', 'list', 'chips', 'rolling', 'sequence', 'reveal'],
  desc: 'A quick roll of soft pops climbing in pitch from left to right, the last one ringing slightly. For staggered lists, chips and words appearing one by one.',
  dur: 0.75,
  family: 'soft',
  moments: ['reveal', 'chart-reveal'],
  params: {
    items: { min: 3, max: 9, def: 6, step: 1, desc: 'How many pops roll by' },
    gap: { min: 0.02, max: 0.07, def: 0.04, unit: 's', desc: 'Time between pops: short a tight roll, long a stepped cascade' },
    pitch: { min: 520, max: 1100, def: 700, unit: 'Hz', desc: 'Note of the first pop; the rest climb from it' },
    fan: { min: 0, max: 1, def: 0.55, desc: 'How far the pops fan upward: 0 every pop on one note, 1 about two octaves' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.items);
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const lane = T.pan(out, t, { x: -0.5, to: 0.5, dur: (n - 1) * p.gap + 0.05 });
    for (let k = 0; k < n; k++) {
      const u = n > 1 ? k / (n - 1) : 0;
      const f = p.pitch * Math.pow(2, scale[Math.round(u * p.fan * 9)] / 12);
      const last = k === n - 1;
      T.tick(lane, t + k * p.gap, {
        f: f * 3.4, q: 2, dur: 0.008, peak: 0.02, jitter: 0.5,
        blip: f, blipTo: f * 1.07, blipDur: last ? 0.17 : 0.055, blipPeak: (0.036 + 0.014 * u) * (last ? 1.15 : 1),
      });
    }
  },
};
