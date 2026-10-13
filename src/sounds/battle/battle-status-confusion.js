// The confused condition. Landing: a dizzy wobbling tone sinking in pitch, with a few twinkling
// stars circling over it. The turn checkup: the bonk of hitting itself, then two stars. Cured: the
// wobble steadies and two clear notes ring.
export default {
  id: 'battle-status-confusion',
  name: 'Confused',
  category: 'battle',
  tags: ['confusion', 'confused', 'status', 'condition', 'dizzy', 'wobble', 'stars', 'bonk', 'debuff', 'checkup', 'turn', 'card-game', 'creature'],
  desc: 'The confused condition: a dizzy wobbling tone with twinkling stars when it lands, a dull bonk with two stars at each turn check, and two clear notes when the head clears.',
  dur: 0.6,
  family: 'soft',
  moments: ['debuff'],
  params: {
    tick: { min: 0, max: 1, def: 0, step: 1, role: 'tick', desc: '0 plays the dizzy wobble and stars, 1 the bonk of hitting itself that ticks at each turn' },
    cure: { min: 0, max: 1, def: 0, step: 1, desc: '1 plays the recovery instead (it wins over tick): the wobble steadies into two clear notes' },
    wobble: { min: 5, max: 14, def: 9, unit: 'Hz', desc: 'Speed of the dizzy wobble: slow is a lazy sway, fast is a spin' },
    stars: { min: 1, max: 5, def: 3, step: 1, desc: 'How many stars twinkle over the wobble when the condition lands' },
  },
  play(T, out, t, p) {
    const star = (at, f, level) => T.osc(out, at, { type: 'triangle', f, dur: 0.1, peak: 0.04 * level, a: 0.003 });
    if (p.cure >= 0.5) {
      T.osc(out, t, { f: 600, to: 560, dur: 0.14, peak: 0.07, a: 0.01, vib: { rate: p.wobble, depth: 50 } });
      T.osc(out, t + 0.12, { f: 880, dur: 0.3, peak: 0.07, a: 0.006 });
      T.osc(out, t + 0.2, { f: 1318.5, dur: 0.3, peak: 0.05, a: 0.006 });
    } else if (p.tick >= 0.5) {
      T.osc(out, t, { f: 880, to: 220, dur: 0.14, peak: 0.06, a: 0.003 });
      T.osc(out, t, { type: 'triangle', f: 1250, dur: 0.05, peak: 0.03, a: 0.002 });
      star(t + 0.08, 1568, 0.9);
      star(t + 0.14, 2093, 0.75);
    } else {
      T.osc(out, t, { f: 700, to: 420, dur: 0.5, peak: 0.08, a: 0.01, vib: { rate: p.wobble, depth: 90 } });
      const notes = [1568, 1975.5, 1760, 2093, 1661];
      const n = Math.round(p.stars);
      for (let k = 0; k < n; k++) star(t + 0.05 + k * 0.1, notes[k], 1);
    }
  },
};
