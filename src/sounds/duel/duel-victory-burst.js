// The last point of lore lands and the game is won: a quick rising arpeggio of struck glass bells,
// then the whole chord bursts open together over a rush of sparkle and a warm low swell, in a
// bright room. The glass partials and the room keep it of one piece with the lore chime, but it is
// longer and fuller than anything else in the family.
export default {
  id: 'duel-victory-burst',
  name: 'Victory Burst',
  category: 'duel',
  tags: ['ink-duel', 'victory', 'win', 'lore', 'burst', 'arpeggio', 'bells', 'glass', 'sparkle'],
  desc: 'The win: a quick rising run of glass bells that opens into a full chord, a burst of sparkle and a warm swell underneath.',
  dur: 1.95,
  family: 'orchestral',
  moments: ['victory'],
  params: {
    pitch: { min: 392, max: 784, def: 523.25, unit: 'Hz', desc: 'Root of the arpeggio and the chord it opens into' },
    notes: { min: 4, max: 7, def: 6, step: 1, desc: 'How many bells run up the arpeggio before the chord opens' },
    sparkle: { min: 0, max: 1, def: 0.6, desc: 'Level of the rush of sparkle at the burst, 0 none' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Reverb mix, from a dry run to a wide bright hall' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.notes);
    const steps = [0, 4, 7, 12, 16, 19, 24];
    const glass = [[1, 1, 1], [2.32, 0.42, 0.6], [4.25, 0.2, 0.4], [6.63, 0.09, 0.25]];
    const room = T.reverb(out, t, { time: 1.2, mix: p.space, tone: 0.65 });
    const gap = 0.075;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      T.bell(room, t + k * gap, { f, partials: glass, dur: 0.8, peak: 0.05 * (1 - 0.04 * k), a: 0.002 });
    }
    // the burst: the chord rings together, with sparkle racing up and a warm swell below
    const at = t + n * gap + 0.03;
    for (const m of [1, 1.5, 2, 3]) {
      T.bell(room, at, { f: p.pitch * m * 2, partials: glass, dur: 1.0, peak: 0.033, a: 0.003 });
    }
    T.noise(room, at, { filter: 'highpass', f: 5000, to: 9500, q: 0.8, dur: 0.6, peak: 0.05 * p.sparkle, a: 0.03 });
    T.osc(room, at, { type: 'triangle', f: p.pitch / 2, dur: 1.0, peak: 0.04, a: 0.25, s: 0.5, d: 0.3, r: 0.4 });
    T.osc(room, at, { type: 'triangle', f: p.pitch * 0.75, dur: 1.0, peak: 0.024, a: 0.25, s: 0.5, d: 0.3, r: 0.4 });
  },
};
