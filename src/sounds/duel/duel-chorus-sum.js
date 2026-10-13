// Several characters sing together to reach a song's threshold: each added voice tilts a card
// (a soft wooden tick), drops a small glass pip for its cost and joins the held chord as a pair of
// detuned sines, so the stack gets wider and richer with every card. A bright bell closes it when
// the threshold is met.
export default {
  id: 'duel-chorus-sum',
  name: 'Chorus Sum',
  category: 'duel',
  tags: ['ink-duel', 'sing', 'together', 'chorus', 'stack', 'build', 'cost', 'chord', 'card'],
  desc: 'Singers joining one after another: each card adds a pip and a voice to a growing chord, closed by a bright bell when it adds up.',
  dur: 1.46,
  family: 'orchestral',
  moments: ['ability'],
  params: {
    cards: { min: 2, max: 5, def: 3, step: 1, desc: 'How many singers join the stack' },
    pitch: { min: 130, max: 330, def: 196, unit: 'Hz', desc: 'Root of the chord that the first singer starts' },
    gap: { min: 0.07, max: 0.16, def: 0.11, unit: 's', desc: 'Time between one singer joining and the next' },
    shine: { min: 0, max: 1, def: 0.6, desc: 'Level of the closing bell when the threshold is met, 0 none' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    const tones = [0, 7, 12, 16, 19];
    const last = t + (n - 1) * p.gap;
    const end = last + 0.55;
    const room = T.reverb(out, t, { time: 0.8, mix: 0.18, tone: 0.55 });
    // each voice is a little quieter when more of them sing, so five singers do not clip a chord of two
    const v = 0.075 / Math.sqrt(n);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const f = p.pitch * Math.pow(2, tones[k] / 12);
      // the card tilts and its cost pip counts up
      T.tick(room, at, { f: 1500, q: 2, dur: 0.014, peak: 0.03, blip: 520, blipTo: 400, blipType: 'triangle', blipDur: 0.05, blipPeak: 0.02 });
      T.bell(room, at, { f: f * 8, partials: [[1, 1, 0.5], [2.32, 0.3, 0.3]], dur: 0.14, peak: 0.02, a: 0.002 });
      // the voice joins the held chord: two detuned sines and a faint octave
      for (const d of [-7, 7]) {
        T.osc(room, at, { f, dur: end - at, peak: v * 0.5, a: 0.05, s: 0.9, d: 0.05, r: 0.28, detune: d });
      }
      T.osc(room, at, { type: 'triangle', f: f * 2, dur: end - at, peak: v * 0.25, a: 0.06, s: 0.9, d: 0.05, r: 0.28 });
    }
    // the threshold is met: a swell of air and a glass bell at the top of the stack
    T.noise(room, last + 0.05, { filter: 'highpass', f: 5000, to: 8500, q: 0.8, dur: 0.4, peak: 0.03 * p.shine, a: 0.1 });
    T.bell(room, last + p.gap * 0.8, { f: p.pitch * 16, partials: [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34]], dur: 0.6, peak: 0.055 * p.shine, a: 0.003 });
  },
};
