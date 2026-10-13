// Ported from the Deck Lab stage whoosh: two crossing bandpass sweeps over noise, one opening
// upward as the object leaves and one closing as it passes, with slow attacks so it is air, never
// a hit.
export default {
  id: 'game-whoosh',
  name: 'Whoosh',
  category: 'game',
  tags: ['whoosh', 'swoosh', 'swing', 'swipe', 'dash', 'air', 'transition'],
  desc: 'Air rushing past: a swing, a dash, or a panel sliding across the screen.',
  dur: 0.62,
  family: 'air',
  moments: ['transition'],
  params: {
    length: { min: 0.15, max: 0.6, def: 0.27, unit: 's', desc: 'How long the whoosh lasts; both sweeps stretch with it' },
    pitch: { min: 0.5, max: 2, def: 1, unit: 'x', desc: 'Shifts both sweep bands: low a deep rush, high a thin hiss' },
    q: { min: 0.6, max: 3, def: 1.1, desc: 'Narrowness of the sweeps: low a broad rush, high a tighter, whistly band' },
  },
  play(T, out, t, p) {
    const s = p.length / 0.27;
    // a narrower band throws more of the noise away: lift the peak so the loudness holds
    const lift = Math.sqrt(p.q / 1.1);
    T.noise(out, t, {
      filter: 'bandpass', f: 420 * p.pitch, to: 2300 * p.pitch, q: p.q,
      dur: 0.21 * s, peak: 0.19 * lift, a: 0.045 * s,
    });
    T.noise(out, t + 0.1 * s, {
      filter: 'bandpass', f: 1900 * p.pitch, to: 620 * p.pitch, q: p.q * 1.36,
      dur: 0.17 * s, peak: 0.105 * lift, a: 0.032 * s,
    });
  },
};
