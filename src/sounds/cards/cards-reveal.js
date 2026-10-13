// A card slapped down face up, voiced per kind: every kind is the same slap (a body thump, a
// felt-dark noise puff and a bright paper snap) with its own weight and one extra detail, so the
// five reveals read as different cards while staying one gesture. The ace adds a flash of high
// shimmer over a low sub, the loudest and longest of the five.
export default {
  id: 'cards-reveal',
  name: 'Card Reveal',
  category: 'cards',
  tags: ['card', 'reveal', 'slap', 'face-up', 'play', 'show', 'kind', 'felt'],
  desc: 'A card slapped down face up, five flavors: a crisp item, a warm supporter, a broad stadium, a clipped tool and a heavy ace with a flash.',
  dur: 0.72,
  family: 'paper',
  moments: ['card-flip'],
  params: {
    kind: { min: 0, max: 4, def: 1, step: 1, choices: ['item', 'supporter', 'stadium', 'tool', 'ace'], desc: 'Which card: item crisp, supporter warm, stadium broad, tool clipped, ace heavy with a flash' },
    force: { min: 0, max: 1, def: 0.6, desc: 'How hard the card is slapped down: 0 a gentle lay, 1 a hard slap' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the slap: 0 dark and padded, 1 bright and papery' },
    ring: { min: 0.6, max: 1.4, def: 1, unit: 'x', desc: 'How long the extra detail rings (the warm notes, the clink, the flash)' },
  },
  play(T, out, t, p) {
    const k = Math.round(p.kind);
    const hit = (0.65 + 0.5 * p.force) * 0.83;
    const air = 0.7 + 0.6 * p.tone;
    // the slap itself: [body Hz, noise cutoff Hz, level] per kind, from soft and high (item) to
    // low and broad (stadium, ace)
    const spec = [[240, 3400, 0.05], [170, 2400, 0.056], [110, 1600, 0.06], [210, 3000, 0.046], [95, 2000, 0.068]][k];
    const body = spec[0];
    const cut = spec[1] * air;
    const l = spec[2] * hit;
    T.osc(out, t, { f: body, to: body * 0.5, dur: 0.075, peak: l, a: 0.002 });
    T.noise(out, t, { filter: 'lowpass', f: cut, to: cut * 0.4, q: 1, dur: 0.055, peak: 0.9 * l, a: 0.002 });
    T.noise(out, t, { filter: 'highpass', f: 3200, to: 2400, q: 0.8, dur: 0.022, peak: 0.35 * l, a: 0.001 });
    const r = p.ring;
    if (k === 0) {
      // item: one small bright tick on top
      T.osc(out, t, { type: 'triangle', f: 1400, to: 1300, dur: 0.04 * r, peak: 0.01, a: 0.002 });
    } else if (k === 1) {
      // supporter: a warm major third rings under the slap
      T.osc(out, t + 0.02, { type: 'triangle', f: 392, dur: 0.22 * r, peak: 0.013, a: 0.01 });
      T.osc(out, t + 0.02, { type: 'triangle', f: 493.9, dur: 0.22 * r, peak: 0.011, a: 0.01 });
    } else if (k === 2) {
      // stadium: a wide low breath of air as the big card fills the table
      T.noise(out, t, { filter: 'bandpass', f: 300, to: 900, q: 1, dur: 0.3 * r, peak: 0.03, a: 0.05 });
    } else if (k === 3) {
      // tool: a small metal clip at the corner (inharmonic partials)
      const c = 2400 * air;
      T.osc(out, t + 0.03, { f: c, to: c * 0.98, dur: 0.12 * r, peak: 0.016, a: 0.002 });
      T.osc(out, t + 0.03, { f: c * 2.76, to: c * 2.7, dur: 0.08 * r, peak: 0.008, a: 0.002 });
      T.noise(out, t + 0.03, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: 0.01, a: 0.001 });
    } else {
      // ace: a sub under the slap, then a rising flash of three high notes and a veil of air
      T.osc(out, t, { f: 70, to: 40, dur: 0.3, peak: 0.04, a: 0.004 });
      const flash = [1318.5, 1975.5, 2637];
      for (let j = 0; j < flash.length; j++) {
        T.osc(out, t + 0.04 + 0.04 * j, { type: 'triangle', f: flash[j], dur: 0.4 * r, peak: 0.016, a: 0.01 });
      }
      T.noise(out, t + 0.04, { filter: 'highpass', f: 6000, to: 7000, q: 0.8, dur: 0.3 * r, peak: 0.012, a: 0.05 });
    }
  },
};
