// Challenger: strength pumped up for the attack. A run of short, narrow pulses that climb in
// pitch, one for each point added, ending in a crack and a quick thump as the attack lands.
export default {
  id: 'duel-spike-pump',
  name: 'Spike Pump',
  category: 'duel',
  tags: ['ink-duel', 'challenger', 'keyword', 'climb', 'crack', 'charge', 'pump', 'buff'],
  desc: 'A quick rising run of bright notes ending in a crack: strength pumped up as the attack begins. For Challenger.',
  dur: 0.35,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    pumps: { min: 2, max: 5, def: 3, step: 1, desc: 'How many pulses climb, one for each point of strength added' },
    pitch: { min: 300, max: 700, def: 440, unit: 'Hz', desc: 'Note of the first pulse; each one climbs a minor third above the last' },
    crack: { min: 0, max: 1, def: 0.6, desc: 'The crack and thump that close the run: 0 soft, 1 hard' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.pumps);
    const step = 0.052;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, (k * 3) / 12);
      T.pulse(out, t + k * step, { duty: 0.2, f, to: f * 1.12, dur: 0.034, peak: 0.05 * (0.8 + 0.2 * (n > 1 ? k / (n - 1) : 1)), a: 0.003, lp: 3600 });
    }
    // the crack as the attack lands
    const c = t + n * step + 0.01;
    T.noise(out, c, { filter: 'highpass', f: 2400, to: 3800, q: 0.8, dur: 0.025, peak: 0.025 + 0.055 * p.crack, a: 0.001 });
    T.osc(out, c, { f: 520, to: 150, dur: 0.06, peak: 0.012 + 0.028 * p.crack, a: 0.002 });
  },
};
