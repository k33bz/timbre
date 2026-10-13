// Evasive: an attack that slides past a card and finds nothing. A thin band of noise that falls in
// pitch as it passes, a faint airy edge, and a flutter of tiny grains, travelling across the
// stereo field from one side to the other.
export default {
  id: 'duel-slip-by',
  name: 'Slip By',
  category: 'duel',
  tags: ['ink-duel', 'evasive', 'keyword', 'swish', 'flutter', 'air', 'miss', 'dodge'],
  desc: 'A thin, fluttering swish that slides past and fades: an attack missing its mark. For Evasive.',
  dur: 0.34,
  family: 'air',
  moments: ['ability'],
  params: {
    length: { min: 0.12, max: 0.32, def: 0.2, unit: 's', desc: 'How long the pass takes: short a quick slip, long a slow glide' },
    pitch: { min: 0.6, max: 1.6, def: 1, unit: 'x', desc: 'Height of the swish: low a soft breath, high a thin hiss' },
    flutter: { min: 0, max: 1, def: 0.5, desc: 'Fluttering grains riding the swish: 0 a smooth pass, 1 busy and ghostly' },
    width: { min: 0, max: 1, def: 0.6, desc: 'How far it travels across the speakers: 0 stays centred, 1 crosses fully' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const lane = T.pan(out, t, { x: -0.8 * p.width, to: 0.8 * p.width, dur: L });
    // the pass: a band that falls as it goes by (like a horn passing), swelling then fading
    T.noise(lane, t, {
      filter: 'bandpass', f: 3600 * p.pitch, to: 1150 * p.pitch, q: 2.4, dur: L, peak: 0.16,
      a: L * 0.3, s: 0.6, d: L * 0.1, r: L * 0.5,
    });
    // a faint airy edge above it
    T.noise(lane, t + L * 0.08, {
      filter: 'highpass', f: 5200 * p.pitch, to: 3200 * p.pitch, q: 0.7, dur: L * 0.8, peak: 0.022,
      a: L * 0.3, s: 0.6, d: L * 0.1, r: L * 0.4,
    });
    // the flutter: little bandpassed grains falling along the same path
    const n = Math.round(p.flutter * 6);
    for (let k = 0; k < n; k++) {
      const u = (k + T.rand(0.1, 0.9)) / n;
      T.noise(lane, t + L * (0.05 + 0.8 * u), {
        filter: 'bandpass', f: 4200 * p.pitch * Math.pow(0.4, u) * T.rand(0.9, 1.1), q: 3,
        dur: 0.02, peak: 0.05 * (1 - 0.5 * Math.abs(u - 0.4)), a: 0.003,
      });
    }
  },
};
