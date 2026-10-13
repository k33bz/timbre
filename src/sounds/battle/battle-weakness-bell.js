// The "doubled" cue: a bright pair of struck bells, the second an octave above the first, with a
// short breath of air on the first strike. Deliberately NOT another impact: it has no low end, so
// it lands on top of any strike and says that the number just doubled. Triangle bells keep it
// thin and clear; a faint 2.76 partial gives them a metal edge.
export default {
  id: 'battle-weakness-bell',
  name: 'Weakness Bell',
  category: 'battle',
  tags: ['weakness', 'super-effective', 'double-damage', 'doubled', 'bell', 'crit', 'battle'],
  desc: 'Two quick bright bell strikes, the second an octave up: a hit that just did double damage. Thin and high, so it rides on top of a strike.',
  dur: 0.42,
  family: 'glass',
  moments: ['crit'],
  params: {
    pitch: { min: 800, max: 2200, def: 1245, unit: 'Hz', desc: 'Note of the first bell; the second rings an octave above' },
    ring: { min: 0.12, max: 0.4, def: 0.22, unit: 's', desc: 'How long the bells ring' },
    gap: { min: 0.03, max: 0.1, def: 0.055, unit: 's', desc: 'Time between the two strikes; short is one chime, long is a clear pair' },
    air: { min: 0, max: 1, def: 0.5, desc: 'Level of the bright breath on the first strike, 0 none' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    // first strike: the note, a fifth above it and a faint metal partial, falling a little
    T.bell(out, t, {
      type: 'triangle', f, partials: [[1, 1, 1], [1.5, 0.58, 0.8], [2.76, 0.2, 0.4]], drift: 0.95,
      dur: p.ring, peak: 0.085, a: 0.004,
    });
    // second strike an octave up: the "x2"
    T.bell(out, t + p.gap, {
      type: 'triangle', f: f * 2, partials: [[1, 1, 1], [2.76, 0.25, 0.5]], drift: 0.95,
      dur: p.ring * 0.75, peak: 0.055, a: 0.004,
    });
    T.noise(out, t, { filter: 'highpass', f: 5200, to: 3600, q: 0.8, dur: 0.05, peak: 0.07 * p.air, a: 0.002 });
  },
};
