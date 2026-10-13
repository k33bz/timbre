// Glass breaking: a hard crack with a dull knock under it, a burst of splinters (a quick cluster of
// short, bright, inharmonic rings and a rush of hiss), then the shards falling and landing as sparse,
// random-pitched tinkles that thin out. Glass ratios (not the harmonic set the ice spell uses) and
// random pitches, so it reads as debris, not as a musical flourish.
export default {
  id: 'fx-shatter',
  name: 'Glass Shatter',
  category: 'fx',
  tags: ['shatter', 'glass', 'break', 'crack', 'smash', 'shards', 'tinkle', 'destroy'],
  desc: 'A sharp crack and a burst of splinters, then shards tinkling to the floor. For breaking glass, cracked screens and things smashed apart.',
  dur: 1.45,
  family: 'glass',
  moments: ['explosion', 'knockout'],
  params: {
    crack: { min: 0, max: 1, def: 0.6, desc: 'Hardness of the first impact: 0 a soft break, 1 a sharp crack with a thump' },
    shards: { min: 6, max: 20, def: 12, step: 1, desc: 'How many shards land and tinkle after the break' },
    fall: { min: 0.4, max: 0.9, def: 0.6, unit: 's', desc: 'How long the shards keep falling and landing' },
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Pitch of every ring: low thick pane glass, high thin small glass' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.5, mix: 0.2, tone: 0.85 });
    const glass = [[1, 1, 1], [2.32, 0.6, 0.5], [4.1, 0.3, 0.3]];
    // the impact
    T.tick(out, t, { f: 3800, q: 0.7, dur: 0.012, peak: 0.06 + 0.08 * p.crack, blip: 420, blipTo: 160, blipPeak: 0.02 + 0.06 * p.crack, blipDur: 0.04 });
    // the splinters: a cluster of short bright rings and a rush of hiss in the first 90 ms
    T.noise(room, t, { filter: 'highpass', f: 3500, to: 7000, q: 0.8, dur: 0.22, peak: 0.09, a: 0.003 });
    for (let k = 0; k < 12; k++) {
      T.bell(room, t + T.rand(0, 0.09), {
        f: T.rand(1800, 8500) * p.pitch, partials: glass, dur: T.rand(0.06, 0.2), peak: 0.023, a: 0.001,
      });
    }
    // the shards: they fall and land, bunched early and sparser later, each quieter than the last
    const n = Math.round(p.shards);
    for (let k = 0; k < n; k++) {
      const u = (k + T.rand(0.05, 0.95)) / n;
      T.bell(room, t + 0.1 + p.fall * Math.pow(u, 1.6), {
        f: T.rand(2200, 7500) * p.pitch, partials: [[1, 1, 1], [2.32, 0.5, 0.5]], dur: T.rand(0.08, 0.16), peak: 0.027 * (1 - 0.65 * u), a: 0.001,
      });
    }
    T.crackle(room, t + 0.1, { dur: p.fall, rate: 70, f: 7000, to: 5000, q: 1, spread: 0.5, len: 0.004, peak: 0.05, vary: 0.8 });
  },
};
