// A rising pluck arpeggio over two octaves of C major that lands on a bell and a soft triangle
// chord, with a hush of shimmer, all in a small bright room. The bell uses the default struck-metal
// partials, so the final chord rings with a little inharmonic sparkle.
export default {
  id: 'music-level-complete',
  name: 'Level Complete',
  category: 'music',
  tags: ['level-complete', 'stage-clear', 'win', 'success', 'pluck', 'bell', 'arpeggio', 'stinger'],
  desc: 'A warm plucked arpeggio climbing into a ringing bell chord. For finishing a stage, not a whole game.',
  dur: 3.4,
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st' },
    tempo: { min: 0.75, max: 1.4, def: 1, unit: 'x' },
    sparkle: { min: 0, max: 1, def: 0.6 },
    space: { min: 0, max: 0.6, def: 0.3 },
  },
  play(T, out, t, p) {
    const s = 1 / p.tempo;
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 1.4, mix: p.space, tone: 0.6 });
    const arp = ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'];
    for (let k = 0; k < 6; k++) {
      T.pluck(room, t + k * 0.085 * s, { f: n(arp[k]), dur: 0.55, bright: 0.65, peak: 0.07 });
    }
    // the landing: bell on top, triangle triad under it, a breath of air above
    const at = t + 0.6 * s;
    T.bell(room, at, { f: n('C6'), dur: 1.5, peak: 0.03 + 0.012 * p.sparkle });
    const triad = ['C5', 'E5', 'G5'];
    for (let k = 0; k < 3; k++) {
      T.osc(room, at, { type: 'triangle', f: n(triad[k]), dur: 1.2, peak: 0.025, a: 0.01, s: 0.6, d: 0.3, r: 0.5 });
    }
    T.noise(room, at, { filter: 'highpass', f: 6000, to: 9000, q: 0.8, dur: 0.5, peak: 0.04 * p.sparkle, a: 0.03 });
  },
};
