// A tiny breath of flame: a whisper of filtered air with a small flutter, very quiet. Hover and
// tooltip.
export default {
  id: 'dark-candle-flicker',
  name: 'Candle Flicker',
  category: 'dark',
  tags: ['hover', 'tooltip', 'candle', 'flame', 'breath', 'whisper', 'quiet', 'dark', 'gothic', 'soft'],
  desc: 'A tiny soft breath of flame with a small flutter, very quiet. For hovering over a control or showing a tooltip in a candlelit interface.',
  dur: 0.26,
  family: 'air',
  moments: ['hover', 'tooltip'],
  params: {
    breath: { min: 0, max: 1, def: 0.5, desc: 'How much air you hear: 0 barely there, 1 a clear soft puff' },
    flutter: { min: 0, max: 1, def: 0.5, desc: 'How much the flame wavers: 0 one smooth breath, 1 a restless flicker' },
    warmth: { min: 0, max: 1, def: 0.4, desc: 'Tone of the air: 0 hushed and dark, 1 a little thinner and brighter' },
  },
  play(T, out, t, p) {
    const lvl = 0.036 + 0.05 * p.breath;
    const f = 1100 + 1800 * p.warmth;
    T.noise(out, t, { filter: 'bandpass', f, to: f * 0.7, q: 0.6, dur: 0.18, a: 0.04, peak: lvl, lp: 4200 });
    const n = Math.round(1 + 3 * p.flutter);
    for (let i = 0; i < n; i++) {
      const at = 0.03 + 0.045 * i + 0.012 * T.rand();
      T.noise(out, t + at, { filter: 'bandpass', f: f * (0.9 + 0.5 * T.rand()), q: 1.2, dur: 0.035, a: 0.006, peak: lvl * (0.3 + 0.5 * p.flutter) * 0.7, lp: 4500 });
    }
  },
};
