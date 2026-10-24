// A screeching high string cluster, the stab of a horror score: four bowed sections a hair apart
// pressing hard and sliding upward, with an optional nervous tremolo.
export default {
  id: 'dark-horror-strings',
  name: 'Horror Strings',
  category: 'dark',
  tags: ['strings', 'horror', 'screech', 'cluster', 'dissonant', 'violin', 'scare', 'dark', 'stinger', 'tremolo'],
  desc: 'A shrieking cluster of high strings that slides upward and hangs in the air. For a nightmare, a creature in the doorway or a plan going wrong.',
  dur: 3.5,
  family: 'orchestral',
  moments: ['scare', 'reveal', 'critical'],
  params: {
    pitch: { min: 330, max: 900, def: 560, unit: 'Hz', desc: 'Where the cluster sits: a dark wail to a thin shriek' },
    cluster: { min: 0, max: 1, def: 0.7, desc: 'How dissonant: 0 a tense minor chord, 1 notes crushed a semitone apart' },
    shiver: { min: 0, max: 1, def: 0, step: 1, desc: '1 bows tremolo (a nervous shudder), 0 long screeching bows' },
    length: { min: 1.2, max: 2.6, def: 1.8, unit: 's', desc: 'How long the strings scream before they fade' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const room = T.reverb(T.gain(out, 0.53), t, { time: 1.9, mix: 0.28, tone: 0.45 });
    const trem = p.shiver > 0.5 ? 14 : 0;
    // semitone offsets: a minor chord with a flat fifth, collapsing into a tight cluster
    const chord = [0, 3, 6.5, 10];
    const tight = [0, 0.8, 1.7, 2.6];
    for (let k = 0; k < 4; k++) {
      const st = chord[k] * (1 - p.cluster) + tight[k] * p.cluster;
      const f = p.pitch * Math.pow(2, st / 12);
      T.bow(room, t + 0.015 * k, {
        f, to: f * Math.pow(2, (1.5 + k * 0.4) / 12), glide: L * 0.8, players: 3, body: 0.8, bright: 0.85, pressure: 0.9,
        vib: trem ? 4 : 18, trem, dur: L, a: 0.05, r: Math.min(0.9, L * 0.45), peak: trem ? 0.135 : 0.1,
      });
    }
  },
};
