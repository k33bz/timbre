// A grandfather clock in an empty room: a heavy wooden tick and a lower tock alternating, each
// ringing the long case, with the room carrying on after the last one.
export default {
  id: 'dark-slow-clock',
  name: 'Slow Clock',
  category: 'dark',
  tags: ['clock', 'grandfather', 'tick', 'tock', 'wood', 'timer', 'slow', 'dark', 'tension', 'empty-room'],
  desc: 'An old grandfather clock ticking slowly and heavily in an empty room, tick then lower tock, the wooden case humming. For waiting, a countdown or dread.',
  dur: 8.6,
  family: 'wood',
  moments: ['tension', 'timer'],
  params: {
    tempo: { min: 0.7, max: 1.4, def: 1, unit: 'x', desc: 'How fast it ticks: 0.7 a funeral slowness, 1.4 steady' },
    case: { min: 0, max: 1, def: 0.5, desc: 'How much the wooden case rings: 0 a dry click, 1 a hollow boom' },
    room: { min: 0.05, max: 0.6, def: 0.3, desc: 'How big and empty the room sounds' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 2.2, mix: p.room, tone: 0.35 });
    const gap = 1.25 / p.tempo;
    for (let k = 0; k < 5; k++) {
      const tock = k % 2 === 1;
      const tt = t + 0.1 + k * gap;
      const f = tock ? 640 : 900;
      // the escapement: a dry wooden knock and a hard little pallet click
      T.tick(room, tt, { f: f * 1.6, q: 2.5, dur: 0.014, peak: 0.1, jitter: 0.3, blip: f, blipDur: 0.05, blipPeak: 0.06 });
      T.tick(room, tt + 0.002, { f: 3200, q: 3, dur: 0.006, peak: 0.04 });
      // the case: a low hollow body and its upper mode, ringing a little after
      if (p.case > 0) {
        const cf = tock ? 118 : 138;
        T.bell(room, tt, { f: cf, dur: 0.35 + 0.8 * p.case, peak: 0.075 * p.case, partials: [[1, 1, 1], [2.3, 0.4, 0.5], [3.7, 0.2, 0.3]] });
      }
    }
  },
};
