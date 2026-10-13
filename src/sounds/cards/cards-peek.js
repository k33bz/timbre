// A peek at a face-down card: the thumb lifts one corner (a soft rub of paper rising off the
// felt and a few fine creaks as the stiff card bends), the corner is held up while you look, and
// then it lets go with a faint snap and a very small pat. One of the quietest card sounds:
// nothing is revealed to anyone but the player.
export default {
  id: 'cards-peek',
  name: 'Card Peek',
  category: 'cards',
  tags: ['card', 'peek', 'look', 'corner', 'lift', 'bend', 'hidden', 'secret', 'creak'],
  desc: 'A quiet peek under the corner of a face-down card: a soft lift with a few creaks, a held pause, then the corner dropping back.',
  dur: 0.78,
  family: 'paper',
  moments: ['card-flip'],
  params: {
    lift: { min: 0.06, max: 0.2, def: 0.11, unit: 's', desc: 'Time the corner takes to rise: short a quick look, long a careful one' },
    hold: { min: 0.1, max: 0.5, def: 0.28, unit: 's', desc: 'How long the corner stays up before it drops back' },
    creak: { min: 0, max: 1, def: 0.5, desc: 'The bending of the stiff card: 0 silent, 1 a run of fine creaks' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Brightness of the paper: 0 dark, 1 bright' },
  },
  play(T, out, t, p) {
    const lift = p.lift;
    const down = t + 0.012 + lift + p.hold;
    // the thumb catches the corner
    T.noise(out, t, { filter: 'highpass', f: 3000, to: 2200, q: 0.8, dur: 0.014, peak: 0.01, a: 0.002 });
    // the corner rises off the felt
    T.noise(out, t + 0.012, { filter: 'bandpass', f: 800 + 400 * p.tone, to: 2000 + 900 * p.tone, q: 1.4, dur: lift, peak: 0.07, a: lift * 0.75 });
    // fine creaks while it bends, spread over the lift, climbing a little
    const creaks = Math.round(1 + 4 * p.creak);
    for (let k = 0; k < creaks; k++) {
      const u = (k + 0.5) / creaks;
      T.noise(out, t + 0.012 + lift * u * T.rand(0.8, 1), {
        filter: 'bandpass', f: (1900 + 700 * u + 500 * p.tone) * T.rand(0.9, 1.1), to: 1500, q: 3, dur: 0.014,
        peak: (0.03 + 0.1 * p.creak) * T.rand(0.7, 1.15), a: 0.002,
      });
    }
    // the corner lets go
    T.noise(out, down, { filter: 'highpass', f: 2500 + 600 * p.tone, to: 1700, q: 0.9, dur: 0.03, peak: 0.02, a: 0.002 });
    T.noise(out, down + 0.008, { filter: 'lowpass', f: 900, to: 400, q: 1, dur: 0.04, peak: 0.03, a: 0.002 });
    T.osc(out, down + 0.008, { f: 200, to: 120, dur: 0.05, peak: 0.022, a: 0.003 });
  },
};
