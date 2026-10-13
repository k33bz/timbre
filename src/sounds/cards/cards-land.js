// A played card arriving where it belongs, by destination. A stadium is a big card laid onto the
// table: a low thunk with a broad fwap of paper. A tool clips onto something: a short pat and a
// little struck-metal clink. The discard pile is a duller pat on top of cards already there, with
// a tick or two of paper as the stack shifts (the lone card on bare felt is cards-place).
export default {
  id: 'cards-land',
  name: 'Card Land',
  category: 'cards',
  tags: ['card', 'land', 'arrive', 'thunk', 'clink', 'pat', 'discard', 'pile', 'attach'],
  desc: 'A played card arriving at its spot: a low thunk for the table, a small metal clink for an attachment, a dull pat for the discard pile.',
  dur: 0.24,
  family: 'paper',
  moments: ['drop'],
  params: {
    onto: { min: 0, max: 2, def: 0, step: 1, choices: ['stadium', 'tool', 'discard'], desc: 'Where it lands: stadium a low thunk, tool a clink, discard a dull pat' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the landing: 0 light, 1 heavy and deeper' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Surface color: 0 dull and dark, 1 bright and hard' },
  },
  play(T, out, t, p) {
    const d = Math.round(p.onto);
    const w = 0.6 + 0.8 * p.weight;
    const air = 0.7 + 0.6 * p.tone;
    if (d === 0) {
      // stadium: the body thunk drops lower than a pat, and a wide low breath of paper rides over it
      T.osc(out, t, { f: 96 * (1.2 - 0.3 * p.weight), to: 48, dur: 0.2, peak: 0.06 * w, a: 0.003 });
      T.noise(out, t, { filter: 'lowpass', f: 480 * air, to: 200, q: 1.1, dur: 0.075, peak: 0.05 * w, a: 0.002 });
      T.noise(out, t, { filter: 'bandpass', f: 1500 * air, to: 500, q: 1, dur: 0.07, peak: 0.055 * w, a: 0.004 });
    } else if (d === 1) {
      // tool: a quick pat, then the clink one beat later: a bell with the struck-metal partials
      T.noise(out, t, { filter: 'lowpass', f: 1000 * air, to: 400, q: 1, dur: 0.04, peak: 0.04 * w, a: 0.002 });
      T.osc(out, t, { f: 300, to: 180, dur: 0.05, peak: 0.03 * w, a: 0.003 });
      T.bell(out, t + 0.012, { f: 2100 * air, partials: [[1, 1, 1], [2.76, 0.5, 0.65], [5.4, 0.2, 0.3]], dur: 0.2, peak: 0.032 * (0.7 + 0.3 * w), a: 0.001 });
      T.noise(out, t + 0.012, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: 0.012, a: 0.001 });
    } else {
      // discard: a duller pat, then the pile shifting under it
      T.noise(out, t, { filter: 'lowpass', f: 1000 * air, to: 430, q: 1, dur: 0.05, peak: 0.07 * w, a: 0.002 });
      T.osc(out, t, { f: 190, to: 108, dur: 0.06, peak: 0.05 * w, a: 0.003 });
      for (let j = 0; j < 2; j++) {
        T.noise(out, t + 0.012 + j * 0.016, {
          filter: 'bandpass', f: 2300 * air * T.rand(0.85, 1.25), to: 1400, q: 2, dur: 0.022, peak: 0.1 * (1 - 0.3 * j) * T.rand(0.8, 1.2), a: 0.002,
        });
      }
    }
  },
};
