// Ported from the Deck Lab counter-disc click (a falling sine blip plus a high noise tick), lifted
// from the card-texture bus to UI level.
export default {
  id: 'ui-click-soft',
  name: 'Soft Click',
  category: 'ui',
  tags: ['click', 'button', 'tap', 'tick', 'press'],
  desc: 'A short muted tick for button presses: a falling sine blip with a breath of high noise.',
  dur: 0.08,
  params: {
    pitch: { min: 400, max: 2400, def: 1100, unit: 'Hz' },
    tone: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.73, dur: 0.035, peak: 0.042, a: 0.002 });
    T.noise(out, t, {
      filter: 'highpass', f: 2800 + 2400 * p.tone, to: 2200 + 1800 * p.tone, q: 0.8,
      dur: 0.022, peak: 0.011 + 0.034 * p.tone, a: 0.001,
    });
  },
};
