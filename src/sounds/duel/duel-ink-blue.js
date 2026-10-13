// The Blue ink signature, for planning and extra ink (clockwork strategy). Same shape as the other five
// inks (a rising flourish, then a landing at 0.19 s, key of D): a marimba arpeggio ticked along by
// quickening clockwork, landing on a high marimba note, with a few gear ticks slowing down behind
// it as the mechanism settles. Precise and bright.
export default {
  id: 'duel-ink-blue',
  name: 'Blue Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'blue', 'strategy', 'clockwork', 'marimba', 'gears', 'card-game'],
  desc: 'The Blue ink signature: a marimba arpeggio ticks along with clockwork and lands on a high note, then the gears slow. For planning and building up ink.',
  dur: 0.85,
  family: 'mechanical',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and woody, high and glassy' },
    mallet: { min: 0, max: 1, def: 0.5, desc: 'Hardness of the marimba mallets: 0 round and soft, 1 sharp with more overtones' },
    gears: { min: 0, max: 3, def: 3, step: 1, desc: 'How many slowing gear ticks follow the landing, 0 none' },
    space: { min: 0, max: 0.5, def: 0.2, desc: 'Small room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const at = (s) => 587.33 * p.pitch * Math.pow(2, s / 12);
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.6 });
    const bar = [[1, 1, 1], [4, 0.12 + 0.3 * p.mallet, 0.22], [10, 0.04 + 0.08 * p.mallet, 0.1]];
    // the flourish: marimba D, F#, A with a clock tick on each, ticks quickening
    [0, 4, 7].forEach((s, i) => {
      const a = t + i * 0.062;
      T.bell(room, a, { f: at(s), partials: bar, dur: 0.34, peak: 0.04, a: 0.003 });
      T.tick(room, a, { f: 4200 + 500 * i, q: 4, dur: 0.01, peak: 0.045, blip: 5200 + 600 * i, blipDur: 0.012, blipPeak: 0.01 });
    });
    T.tick(room, t + 0.16, { f: 5200, q: 4, dur: 0.01, peak: 0.03 });
    // the landing at 0.19 s: the high D on the marimba, a clock tick on top
    const L = t + 0.19;
    T.bell(room, L, { f: at(12), partials: bar, dur: 0.62, peak: 0.068, a: 0.003 });
    T.tick(room, L, { f: 4800, q: 4, dur: 0.012, peak: 0.05, blip: 6200, blipDur: 0.014, blipPeak: 0.012 });
    // the gears slowing: ticks that spread out and fade
    const gaps = [0.09, 0.15, 0.22];
    let g = 0;
    for (let k = 0; k < Math.round(p.gears); k++) {
      g += gaps[k];
      T.tick(room, L + g, { f: 3600 - 250 * k, q: 4, dur: 0.01, peak: 0.045 * (1 - 0.2 * k) });
    }
  },
};
