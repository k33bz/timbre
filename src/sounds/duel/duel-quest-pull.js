// Adventurous: a card drawn toward a quest. A soft tone that swells and climbs like a gentle tug on
// a line, with a faint upper tone following it, and a small bright chime where the lore lands.
export default {
  id: 'duel-quest-pull',
  name: 'Quest Pull',
  category: 'duel',
  tags: ['ink-duel', 'adventurous', 'keyword', 'quest', 'tug', 'chime', 'rise', 'soft'],
  desc: 'A gentle rising pull, like a tether tugging, ending in a small golden chime. For Adventurous, a card drawn to quest.',
  dur: 0.58,
  family: 'soft',
  moments: ['ability'],
  params: {
    pitch: { min: 220, max: 500, def: 330, unit: 'Hz', desc: 'Where the pull starts; it climbs about a sixth' },
    pull: { min: 0.15, max: 0.35, def: 0.26, unit: 's', desc: 'How long the pull takes: short a quick tug, long a slow draw' },
    lore: { min: 0, max: 1, def: 0.6, desc: 'Level of the small chime at the end: 0 none, 1 clear' },
  },
  play(T, out, t, p) {
    const P = p.pull;
    T.osc(out, t, { f: p.pitch, to: p.pitch * 1.6, dur: P, peak: 0.05, a: P * 0.5, s: 0.6, d: 0.05, r: P * 0.3, vib: { rate: 5.5, depth: 14 } });
    T.osc(out, t, { type: 'triangle', f: p.pitch * 2, to: p.pitch * 3.2, dur: P, peak: 0.014, a: P * 0.55, s: 0.6, d: 0.05, r: P * 0.3, lp: 2400 });
    // the lore lands: a small golden glass chime, two octaves above where the pull began
    if (p.lore > 0.02) {
      T.bell(out, t + P * 0.85, {
        f: p.pitch * 4, partials: [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34], [6.63, 0.09, 0.2]],
        dur: 0.27, peak: 0.045 * p.lore, a: 0.002,
      });
    }
  },
};
