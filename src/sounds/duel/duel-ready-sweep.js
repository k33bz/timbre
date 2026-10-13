// The turn starts and a band of light runs along the row: each card stands up with a small wooden
// tick, one after another, each a whole tone higher, panned left to right with the light. The
// switch runs the row the other way round: the cards tip over in a falling run of lower ticks.
export default {
  id: 'duel-ready-sweep',
  name: 'Ready Sweep',
  category: 'duel',
  tags: ['ink-duel', 'ready', 'exert', 'row', 'sweep', 'turn', 'cascade', 'card', 'untap'],
  desc: 'A whole row of cards standing up in a rising run of soft wooden ticks as a band of light sweeps across, left to right.',
  dur: 0.74,
  family: 'wood',
  moments: ['card-tap'],
  params: {
    on: { min: 0, max: 1, def: 0, step: 1, role: 'on', desc: '1 tips the row over in a falling run; 0 stands it up in a rising sweep' },
    cards: { min: 2, max: 6, def: 4, step: 1, desc: 'How many cards in the row' },
    gap: { min: 0.04, max: 0.1, def: 0.07, unit: 's', desc: 'Time between one card and the next: short a ripple, long a slow wave' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the ticks and the band of light: 0 dark, 1 bright' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.cards);
    const ready = Math.round(p.on) === 0;
    const span = (n - 1) * p.gap;
    const sw = T.pan(out, t, { x: -0.7, to: 0.7, dur: span + 0.1 });
    // the band of light: soft air rising (ready) or sinking (exert) as it passes along the row
    T.noise(sw, t, {
      filter: 'bandpass', f: ready ? 700 + 400 * p.tone : 2400 + 800 * p.tone, to: ready ? 3000 + 1500 * p.tone : 750, q: 0.9,
      dur: span + 0.2, peak: 0.05, a: (span + 0.2) * 0.5,
    });
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const f = ready ? 640 * Math.pow(2, (k * 2) / 12) : 920 * Math.pow(2, (-k * 2) / 12);
      const l = ready ? 1 : 1 - 0.05 * k;
      // a wooden tick: a short triangle body under a band-passed click
      T.tick(sw, at, {
        f: f * (2.4 + 1.2 * p.tone), q: 2, dur: 0.014, peak: 0.065 * l, blip: f, blipTo: f * (ready ? 1.05 : 0.8),
        blipType: 'triangle', blipDur: 0.06, blipPeak: 0.044 * l,
      });
    }
    if (ready) {
      // the last card catches the light: a thin glass tip, once
      T.bell(sw, t + span + 0.01, { f: 2349, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.3, peak: 0.02, a: 0.003 });
    }
  },
};
