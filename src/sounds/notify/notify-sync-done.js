// Quick triangle notes alternating between a root and its fifth (the back-and-forth of syncing),
// resolving on the octave. The fast notes are quiet; only the landing note is full level.
export default {
  id: 'notify-sync-done',
  name: 'Sync Done',
  category: 'notify',
  tags: ['sync', 'done', 'complete', 'refresh', 'backup', 'success', 'cycle'],
  desc: 'A quick back-and-forth of two notes that settles on the octave. Everything is in step again.',
  dur: 1.1,
  params: {
    pitch: { min: 330, max: 700, def: 523.25, unit: 'Hz' },
    cycles: { min: 1, max: 3, def: 2, step: 1 },
    speed: { min: 0.06, max: 0.12, def: 0.08, unit: 's' },
    shimmer: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cycles) * 2;
    let at = t;
    for (let k = 0; k < n; k++) {
      T.osc(out, at, { type: 'triangle', f: k % 2 ? p.pitch * 1.5 : p.pitch, dur: p.speed * 1.5, peak: 0.055, a: 0.006 });
      at += p.speed;
    }
    T.osc(out, at, { type: 'triangle', f: p.pitch * 2, dur: 0.3, peak: 0.1, a: 0.008 });
    T.osc(out, at, { f: p.pitch * 4, dur: 0.14, peak: 0.06 * p.shimmer, a: 0.008 });
  },
};
