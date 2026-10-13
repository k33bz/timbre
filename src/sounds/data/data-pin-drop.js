// A map pin falling onto its spot: a short falling breath of air, a soft tap as it lands with a
// glassy tink on top, then a smaller bounce and a quieter tink. Bounce at 0 lands dead.
export default {
  id: 'data-pin-drop',
  name: 'Pin Drop',
  category: 'data',
  tags: ['pin', 'drop', 'map', 'marker', 'location', 'land', 'tink', 'glass'],
  desc: 'A map pin drops onto its spot with a quick falling swish, a soft landing tap, a glassy tink and a small bounce. For a marker appearing on a map.',
  dur: 0.43,
  family: 'glass',
  moments: ['pin-drop'],
  params: {
    pitch: { min: 1200, max: 3200, def: 2093, unit: 'Hz', desc: 'Pitch of the glassy tink: low a bigger pin, high a tiny one' },
    height: { min: 0.08, max: 0.2, def: 0.14, unit: 's', desc: 'How long the pin falls before it lands: low a short hop, high a long drop' },
    bounce: { min: 0, max: 1, def: 0.5, desc: 'Size of the small bounce after landing: 0 lands dead, 1 hops back clearly' },
    glint: { min: 0, max: 1, def: 0.6, desc: 'How glassy the landing is: 0 a dull tap on cork, 1 a bright ring' },
  },
  play(T, out, t, p) {
    // the fall: a falling whistle that swells as the pin speeds up, with air around it (the noise is
    // kept low because a narrow band of it spikes well above its average level)
    T.noise(out, t, { filter: 'bandpass', f: 3200, to: 800, q: 1.5, dur: p.height + 0.01, peak: 0.12, a: p.height * 0.9 });
    T.osc(out, t, { f: 1200, to: 380, dur: p.height + 0.01, peak: 0.026, a: p.height * 0.9 });
    const land = t + p.height;
    // the landing: a low tap, a tick of noise, then the tink
    T.osc(out, land, { f: 280, to: 150, dur: 0.07, peak: 0.03, a: 0.003 });
    T.tick(out, land, { f: 1800, q: 1.2, dur: 0.01, peak: 0.026 });
    const ring = 0.1 + 0.1 * p.glint;
    T.bell(out, land, { f: p.pitch, partials: [[1, 1, 1], [2.32, 0.35 * p.glint, 0.5], [4.1, 0.14 * p.glint, 0.3]], dur: ring, peak: 0.03, a: 0.002 });
    // the bounce: a smaller tap and a higher, shorter tink
    if (p.bounce > 0.02) {
      const hop = land + 0.09;
      T.osc(out, hop, { f: 300, to: 190, dur: 0.045, peak: 0.03 * p.bounce, a: 0.003 });
      T.bell(out, hop, { f: p.pitch * 1.12, partials: [[1, 1, 1], [2.32, 0.3 * p.glint, 0.5]], dur: 0.1, peak: 0.032 * p.bounce, a: 0.002 });
    }
  },
};
