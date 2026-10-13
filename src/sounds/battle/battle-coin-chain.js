// A row of coins landing one after another, the sound of a flip-until-tails streak. There is no
// spinning here (the coin toss in the game category is one coin turning in the air, then a ping):
// a faint flutter of coins in the air, then each coin settles in turn, a heads as a bright ring that
// climbs a little higher than the last, a tails as a dull clack. Coins are scattered left and right.
export default {
  id: 'battle-coin-chain',
  name: 'Coin Chain',
  category: 'battle',
  tags: ['coin', 'flip', 'heads', 'tails', 'chain', 'streak', 'row', 'toss', 'luck', 'card-game'],
  desc: 'A row of coins settling one after another: each heads rings a little higher than the last, each tails lands with a dull clack. For a run of coin flips.',
  dur: 1.41,
  family: 'metal',
  moments: ['coin'],
  params: {
    flips: { min: 1, max: 7, def: 4, step: 1, desc: 'How many coins land in the row' },
    heads: { min: 0, max: 7, def: 3, step: 1, desc: 'How many coins land heads, first in the row (never more than the flips)' },
    gap: { min: 0.05, max: 0.18, def: 0.12, unit: 's', desc: 'Time between one coin landing and the next' },
    pitch: { min: 1200, max: 2600, def: 1760, unit: 'Hz', desc: 'Note of the first heads ring; each later heads climbs above it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.flips);
    const heads = Math.min(n, Math.round(p.heads));
    const lead = 0.12;
    // coins still in the air: a thin flutter that lasts until the last one lands
    T.noise(out, t, { filter: 'bandpass', f: 1800, to: 2600, q: 3, dur: lead + (n - 1) * p.gap + 0.05, peak: 0.1, a: 0.05 });
    for (let k = 0; k < n; k++) {
      const at = t + lead + k * p.gap;
      const dest = T.pan(out, at, { x: k % 2 ? 0.3 : -0.3 });
      if (k < heads) {
        const f = p.pitch * Math.pow(1.04, k);
        T.bell(dest, at, { f, partials: [[1, 1, 1], [2.76, 0.4, 0.4], [5.4, 0.15, 0.2]], dur: 0.2, peak: 0.065, a: 0.003 });
      } else {
        T.osc(dest, at, { f: 698.5, to: 640, dur: 0.16, peak: 0.09, a: 0.004 });
        T.noise(dest, at, { filter: 'lowpass', f: 1200, to: 500, q: 1, dur: 0.05, peak: 0.08, a: 0.002 });
        T.noise(dest, at, { filter: 'bandpass', f: 2200, q: 2, dur: 0.015, peak: 0.06, a: 0.001 });
      }
    }
  },
};
