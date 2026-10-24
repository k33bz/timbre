// A deep falling boom: a sine sliding from about 120 Hz down to the floor of hearing, a short
// impact on top and a faint rumble after. A touch of drive and an octave harmonic keep it audible
// on small speakers.
export default {
  id: 'dark-sub-drop',
  name: 'Sub Drop',
  category: 'dark',
  tags: ['sub', 'drop', 'boom', 'bass', 'fall', 'impact', 'cinematic', 'dark', 'low', 'stinger'],
  desc: 'A deep boom that falls away beneath you, felt more than heard. For a floor giving way, a transition or the weight of bad news.',
  dur: 3.75,
  family: 'impact',
  moments: ['transition', 'scare', 'critical'],
  params: {
    depth: { min: 0, max: 1, def: 0.6, desc: 'How low it falls: 0 stops in the low bass, 1 sinks to the deepest sub' },
    length: { min: 0.8, max: 2, def: 1.4, unit: 's', desc: 'How long the fall takes' },
    impact: { min: 0, max: 1, def: 0.5, desc: 'The thump at the start: 0 a smooth swell, 1 a hard hit' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const end = 46 - 20 * p.depth;
    const room = T.reverb(T.gain(out, 0.4), t, { time: 1.4, mix: 0.15, tone: 0.2 });
    const dr = T.drive(room, t, { amount: 0.3, ref: 0.25 });
    const dc = T.dcblock(dr, t, { f: 20 });
    const A = 0.004 + 0.05 * (1 - p.impact);
    T.osc(dc, t, { f: 120, to: end, glide: L * 0.9, glideCurve: 'exp', dur: L + 0.7, a: A, tail: 0.1, peak: 0.3 });
    // octave above: what small speakers can actually reproduce
    T.osc(dc, t, { f: 240, to: end * 2, glide: L * 0.9, dur: L * 0.7, a: A, peak: 0.07 });
    T.noise(room, t, { filter: 'lowpass', f: 900, to: 150, q: 0.7, dur: 0.3, a: 0.002, peak: 0.05 + 0.2 * p.impact });
    T.noise(room, t + 0.1, { filter: 'lowpass', f: 90, q: 1.5, dur: L + 0.8, a: 0.3, peak: 0.08 });
  },
};
