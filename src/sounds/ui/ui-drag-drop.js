// An item set down: a falling thud with a lowpassed knock, and an optional small second bounce as it
// settles. Heavier than a click because it ends the gesture. Wood family.
export default {
  id: 'ui-drag-drop',
  name: 'Drag Drop',
  category: 'ui',
  tags: ['drop', 'drag', 'place', 'land', 'drag-end', 'thud', 'wood'],
  desc: 'A soft landing thud for dropping an item on its target, with an optional small bounce as it settles.',
  dur: 0.14,
  family: 'wood',
  moments: ['drop'],
  params: {
    pitch: { min: 90, max: 300, def: 196, unit: 'Hz', desc: 'Tuning of the landing thud and its bounce' },
    bounce: { min: 0, max: 1, def: 0.4, desc: 'Level of the small second bounce: 0 none, 1 a clear settle' },
    snap: { min: 0, max: 1, def: 0.4, desc: 'Level of the noise knock on impact: 0 soft and padded, 1 a sharper knock' },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch * 1.5, to: p.pitch * 0.6, dur: 0.08, peak: 0.065, a: 0.003 });
    T.osc(out, t, { f: p.pitch * 3, to: p.pitch * 1.2, dur: 0.05, peak: 0.022, a: 0.003 });
    T.noise(out, t, { filter: 'lowpass', f: 1500, to: 600, q: 0.7, dur: 0.025, peak: 0.04 + 0.1 * p.snap, a: 0.002 });
    T.osc(out, t + 0.075, { f: p.pitch * 1.3, to: p.pitch * 0.6, dur: 0.05, peak: 0.028 * p.bounce, a: 0.003 });
  },
};
