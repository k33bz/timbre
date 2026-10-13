// Glass-like bells: two strikes a fifth apart, using the inharmonic partial ratios of a struck
// wine glass (1, 2.32, 4.25, 6.63) so it rings crystalline, not metallic like the coin. A breath of
// highpassed shimmer rides the second strike.
export default {
  id: 'game-gem-collect',
  name: 'Gem Collect',
  category: 'game',
  tags: ['gem', 'crystal', 'jewel', 'collect', 'treasure', 'glass', 'sparkle', 'reward'],
  desc: 'A crystalline two-strike ring for a gem or treasure: bright, glassy and a little longer than a coin.',
  dur: 0.95,
  params: {
    pitch: { min: 800, max: 2400, def: 1568, unit: 'Hz' },
    ring: { min: 0.2, max: 0.8, def: 0.5, unit: 's' },
    gap: { min: 0.05, max: 0.12, def: 0.08, unit: 's' },
    sparkle: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const glass = [[1, 1, 1], [2.32, 0.45, 0.55], [4.25, 0.25, 0.35], [6.63, 0.12, 0.22]];
    T.bell(out, t, { f: p.pitch, partials: glass, dur: p.ring * 0.7, peak: 0.05, a: 0.002 });
    T.bell(out, t + p.gap, { f: p.pitch * 1.5, partials: glass, dur: p.ring, peak: 0.055, a: 0.002 });
    T.noise(out, t + p.gap, {
      filter: 'highpass', f: 6000, to: 9000, q: 0.8, dur: 0.18,
      peak: 0.05 * p.sparkle, a: 0.02,
    });
  },
};
