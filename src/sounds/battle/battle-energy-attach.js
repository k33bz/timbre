// An energy token clicked onto a creature: a small crisp click and a short chime. Each element has
// its own note on one pentatonic scale, so a player learns them by ear; a special energy adds a
// higher gold ring and a shimmer on top.
export default {
  id: 'battle-energy-attach',
  name: 'Energy Attach',
  category: 'battle',
  tags: ['energy', 'attach', 'charge', 'resource', 'token', 'chime', 'click', 'element', 'card-game'],
  desc: 'An energy card clicked on to a creature with a short chime. Each element has its own note; a special energy adds a gold ring.',
  dur: 0.44,
  family: 'glass',
  moments: ['resource'],
  params: {
    element: { min: 0, max: 8, def: 3, step: 1, desc: 'Which element: each step is another note of a pentatonic scale, 0 lowest' },
    special: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds the gold ring of a special energy: a higher octave note and a shimmer' },
    ring: { min: 0.08, max: 0.4, def: 0.18, unit: 's', desc: 'How long the chime rings after the click' },
  },
  play(T, out, t, p) {
    const f = 523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19][Math.round(p.element)] / 12);
    T.noise(out, t, { filter: 'highpass', f: 3800, to: 2600, q: 0.8, dur: 0.022, peak: 0.03, a: 0.002 });
    T.osc(out, t, { type: 'triangle', f, to: f * 0.96, dur: 0.09, peak: 0.045, a: 0.003 });
    T.osc(out, t, { f: f * 2, to: f * 1.98, dur: p.ring, peak: 0.015, a: 0.003 });
    if (p.special >= 0.5) {
      T.osc(out, t + 0.028, { type: 'triangle', f: f * 2.5, to: f * 2.4, dur: 0.08, peak: 0.032, a: 0.003 });
      T.osc(out, t + 0.028, { f: f * 3.01, dur: p.ring, peak: 0.014, a: 0.003 });
      T.noise(out, t + 0.028, { filter: 'highpass', f: 6000, to: 8000, q: 0.8, dur: 0.12, peak: 0.01, a: 0.01 });
    }
  },
};
