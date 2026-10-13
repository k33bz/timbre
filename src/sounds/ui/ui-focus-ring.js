// Keyboard focus moving to a control: one soft rounded pip with a few fading echoes, like a ring
// spreading out from the control. The echo loop is fixed at 0.34 feedback so the tail is short at
// every setting. Glass family.
export default {
  id: 'ui-focus-ring',
  name: 'Focus Ring',
  category: 'ui',
  tags: ['focus', 'tab', 'keyboard', 'navigate', 'accessibility', 'ring', 'glass'],
  desc: 'A soft pip with a few fading echoes for keyboard focus landing on a control, like a ring spreading outward.',
  dur: 0.4,
  params: {
    pitch: { min: 700, max: 2000, def: 1047, unit: 'Hz' },
    spread: { min: 0.03, max: 0.075, def: 0.05, unit: 's' },
    echo: { min: 0.2, max: 0.7, def: 0.45 },
  },
  play(T, out, t, p) {
    const ring = T.delay(out, t, { time: p.spread, fb: 0.34, mix: p.echo, tone: 3500 });
    T.osc(ring, t, { f: p.pitch, to: p.pitch * 1.12, dur: 0.05, peak: 0.04, a: 0.006 });
  },
};
