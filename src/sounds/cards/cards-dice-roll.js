// A die thrown on a table: it bounces with gaps that shrink and hits that soften, rocks over a few
// quick ticks and stops. Surface goes from felt (dull, short) to a wooden table (bright, ringing).
export default {
  id: 'cards-dice-roll',
  name: 'Dice Roll',
  category: 'cards',
  tags: ['dice', 'roll', 'throw', 'bounce', 'land', 'table', 'board-game'],
  desc: 'A die thrown and tumbling to rest: bounces that close up and soften, then a last rocking tick.',
  dur: 1.04,
  family: 'wood',
  moments: ['dice'],
  params: {
    bounces: { min: 2, max: 8, def: 5, step: 1, desc: 'How many times the die bounces before rocking to rest' },
    length: { min: 0.35, max: 0.9, def: 0.6, unit: 's', desc: 'Time from the first bounce to the last, gaps shrinking inside it' },
    surface: { min: 0, max: 1, def: 0.5, desc: 'Table it lands on: 0 dull, short felt to 1 bright, ringing wood' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.bounces);
    // gaps shrink by a constant ratio and add up to the length
    let sum = 0;
    for (let k = 0; k < n - 1; k++) sum += Math.pow(0.66, k);
    let at = t;
    for (let k = 0; k < n; k++) {
      const l = Math.pow(0.7, k) * T.rand(0.9, 1.1);
      const f = (1300 + 1900 * p.surface) * T.rand(0.85, 1.2);
      T.noise(out, at, { filter: 'bandpass', f, to: f * 0.7, q: 2, dur: 0.03 + 0.03 * p.surface, peak: 0.12 * l, a: 0.001 });
      T.osc(out, at, { f: (440 + 520 * p.surface) * T.rand(0.9, 1.15), to: 260, dur: 0.04, peak: (0.018 + 0.012 * p.surface) * l, a: 0.001 });
      if (k < n - 1) at += (p.length * Math.pow(0.66, k)) / sum;
    }
    // the die rocks to rest: a few small ticks closing up
    const rock = [0.035, 0.07, 0.095];
    for (let k = 0; k < rock.length; k++) {
      const f = (1500 + 1500 * p.surface) * T.rand(0.85, 1.15);
      T.noise(out, at + rock[k], { filter: 'bandpass', f, q: 2, dur: 0.02, peak: 0.07 * (1 - 0.25 * k), a: 0.001 });
    }
  },
};
