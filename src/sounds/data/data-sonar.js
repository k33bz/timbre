// One sonar ping: a clean sine that leans up into its pitch, then echoes that come back later, each
// one softer and darker (a lowpass and a slower start) than the one before.
export default {
  id: 'data-sonar',
  name: 'Sonar Ping',
  category: 'data',
  tags: ['sonar', 'ping', 'beacon', 'pulse', 'ripple', 'echo', 'locate', 'map', 'radar'],
  desc: 'One clean sonar ping that fades into a few softer, darker echoes. For a you-are-here marker, an accuracy ring or an outage ripple spreading from a point.',
  dur: 1.36,
  family: 'glass',
  moments: ['beacon'],
  params: {
    pitch: { min: 600, max: 1800, def: 988, unit: 'Hz', desc: 'Pitch of the ping: low deep and distant, high small and close' },
    echoes: { min: 0, max: 3, def: 2, step: 1, desc: 'How many echoes come back after the ping, 0 for the bare ping' },
    gap: { min: 0.16, max: 0.32, def: 0.24, unit: 's', desc: 'Time between the ping and each echo: low a close wall, high a far one' },
    bright: { min: 0, max: 1, def: 0.4, desc: 'Overtones in the ping: 0 a pure sine, 1 a harder, glassier ping' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.echoes);
    // the ping leans up into its pitch over 40 ms, which is what makes it read as a ping
    T.osc(out, t, { f: p.pitch * 0.94, to: p.pitch, glide: 0.04, dur: 0.45, peak: 0.05, a: 0.006 });
    T.osc(out, t, { f: p.pitch * 2.01, dur: 0.2, peak: 0.016 * p.bright, a: 0.006 });
    T.osc(out, t, { f: p.pitch * 3.02, dur: 0.1, peak: 0.007 * p.bright, a: 0.006 });
    for (let k = 1; k <= n; k++) {
      const at = t + k * p.gap;
      const lv = Math.pow(0.5, k);
      // each echo has lost some of its highs and a little pitch on the way back
      T.osc(out, at, { f: p.pitch * (1 - 0.012 * k), dur: 0.34, peak: 0.05 * lv, a: 0.012 + 0.008 * k, lp: p.pitch * (2.2 - 0.4 * k) });
    }
  },
};
