// A number rolling up to its value: dry wheel ticks that start slowly, rush through the middle
// and brake again, climbing in pitch the whole way, then land on one soft low thunk. The gap
// before each tick follows a smooth curve (the slowest about four times the quickest), scaled so
// the thunk always falls exactly `length` after the first tick.
export default {
  id: 'data-count-up',
  name: 'Count-Up Roll',
  category: 'data',
  tags: ['count-up', 'count', 'counter', 'odometer', 'roll', 'total', 'kpi', 'tally', 'ticks', 'metric'],
  desc: 'A run of small ticks that speeds up, brakes and lands on a soft thunk, climbing in pitch: for a big number counting up to its value.',
  dur: 1.57,
  family: 'mechanical',
  moments: ['count-up'],
  params: {
    ticks: { min: 8, max: 28, def: 18, step: 1, desc: 'Ticks before the landing: few a short count, many a fast roll' },
    length: { min: 0.5, max: 1.4, def: 0.9, unit: 's', desc: 'Time from the first tick to the landing thunk' },
    pitch: { min: 400, max: 1600, def: 760, unit: 'Hz', desc: 'Note of the first tick' },
    rise: { min: 0, max: 12, def: 7, unit: 'st', desc: 'How far the ticks climb by the last one: 0 a flat roll' },
    thunk: { min: 0, max: 1, def: 0.6, desc: 'Weight of the landing: 0 almost none, 1 a clear soft thump' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.ticks);
    // the gap before each tick: wide at the start, tightest mid-run, wide again as it brakes
    const gaps = [];
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const g = 1 + 3 * Math.pow(1 - Math.sin((Math.PI * (k + 0.5)) / n), 1.5);
      gaps.push(g);
      sum += g;
    }
    let at = t;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, (p.rise * k) / (Math.max(1, n - 1) * 12));
      T.tick(out, at, {
        f: f * 2.4, q: 2.2, dur: 0.012, peak: 0.09, blip: f, blipTo: f * 0.88, blipPeak: 0.03, blipDur: 0.022, jitter: 0.5, lp: 7000,
      });
      at += (gaps[k] * p.length) / sum;
    }
    // the landing: the last gap is the slowest, then a round low thunk with a muffled tap
    T.osc(out, at, { f: 140, to: 78, dur: 0.15, peak: 0.11 * p.thunk, a: 0.004 });
    T.noise(out, at, { filter: 'lowpass', f: 520, dur: 0.05, peak: 0.12 * p.thunk, a: 0.003 });
  },
};
