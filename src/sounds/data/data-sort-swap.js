// Rows trading places in a sorted table or a leaderboard. Each swap is two sine glides that cross
// (one row rising to its new place, the other falling), a soft tick as the pair sets off and a
// shifted pair of ticks as the rows land, over a quiet slide of filtered noise. Later swaps step up
// a pentatonic scale, so a run of swaps reads as one sort rather than one sound repeated.
export default {
  id: 'data-sort-swap',
  name: 'Sort Swap',
  category: 'data',
  tags: ['sort', 'swap', 'reorder', 'rank', 'leaderboard', 'table', 'row', 'slide'],
  desc: 'Rows trading places: crossing glides, a pair of landing ticks and a quiet slide. Raise swaps for a longer sort.',
  dur: 0.69,
  family: 'mechanical',
  moments: ['sort'],
  params: {
    swaps: { min: 1, max: 5, def: 2, step: 1, desc: 'How many swaps in the run, one after another' },
    pitch: { min: 350, max: 1000, def: 600, unit: 'Hz', desc: 'Note of the lower row as it moves' },
    gap: { min: 0.07, max: 0.14, def: 0.095, unit: 's', desc: 'Time between swaps' },
    slide: { min: 0, max: 1, def: 0.5, desc: 'Level of the slide between the ticks: 0 only ticks, 1 a clear whoosh' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.swaps);
    const scale = [0, 2, 4, 7, 9];
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const lo = p.pitch * Math.pow(2, scale[k % 5] / 12);
      const hi = lo * 1.26;
      // the two rows cross: one rises to the upper place, the other falls to the lower
      T.osc(out, at, { f: lo, to: hi, dur: 0.07, peak: 0.028, a: 0.004 });
      T.osc(out, at, { f: hi, to: lo, dur: 0.07, peak: 0.022, a: 0.004 });
      T.noise(out, at, { filter: 'bandpass', f: 1200, to: 2600, q: 1.2, dur: 0.07, peak: 0.045 * p.slide, a: 0.01 });
      // set off, then land (the second row a hair behind the first)
      T.tick(out, at, { f: 2800, q: 2.5, dur: 0.008, peak: 0.04, jitter: 0.5 });
      T.tick(out, at + 0.07, { f: 3200, q: 2.5, dur: 0.008, peak: 0.05, blip: hi, blipDur: 0.025, blipPeak: 0.022, jitter: 0.5 });
      T.tick(out, at + 0.082, { f: 2400, q: 2.5, dur: 0.008, peak: 0.04, blip: lo, blipDur: 0.025, blipPeak: 0.018, jitter: 0.5 });
    }
  },
};
