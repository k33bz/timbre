// A key and a lock: a handful of tiny metal jingles, a turning scrape, the deadbolt clunk, then a
// small ding for the reward. Jingles sets how many keys rattle; clunk sets the weight of the bolt.
export default {
  id: 'game-key-unlock',
  name: 'Key Unlock',
  category: 'game',
  tags: ['key', 'unlock', 'lock', 'door', 'chest', 'jingle', 'clunk', 'latch'],
  desc: 'A key jingles, turns and the lock gives: tiny metal ticks, a bolt clunk and a small ding.',
  dur: 0.85,
  params: {
    pitch: { min: 1800, max: 4200, def: 2800, unit: 'Hz' },
    jingles: { min: 2, max: 6, def: 3, step: 1 },
    clunk: { min: 0, max: 1, def: 0.5 },
    ding: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const n = Math.round(p.jingles);
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.035 + T.rand(0, 0.008);
      const f = p.pitch * T.rand(0.85, 1.2);
      T.noise(out, at, { filter: 'bandpass', f, q: 4, dur: 0.015, peak: 0.1 * T.rand(0.7, 1), a: 0.001 });
      T.bell(out, at, { f, partials: [[1, 1, 1], [2.76, 0.5, 0.7]], dur: 0.05, peak: 0.025, a: 0.001 });
    }
    const turn = t + n * 0.035 + 0.05;
    T.noise(out, turn, { filter: 'bandpass', f: 1800, to: 2600, q: 3, dur: 0.09, peak: 0.06, a: 0.03 });
    const bolt = turn + 0.1;
    T.osc(out, bolt, { f: 190, to: 90, dur: 0.1, peak: 0.025 + 0.05 * p.clunk, a: 0.002 });
    T.noise(out, bolt, { filter: 'lowpass', f: 1200, to: 500, q: 0.8, dur: 0.045, peak: 0.03 + 0.07 * p.clunk, a: 0.001 });
    T.noise(out, bolt, { filter: 'highpass', f: 3000, q: 0.8, dur: 0.01, peak: 0.05, a: 0.001 });
    T.bell(out, bolt + 0.04, {
      f: p.pitch * 0.5, partials: [[1, 1, 1], [2.76, 0.3, 0.5]], dur: 0.35, peak: 0.045 * p.ding, a: 0.002,
    });
  },
};
