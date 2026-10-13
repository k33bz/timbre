// A typewriter line return: a lever flick, the carriage ratcheting across (a run of tiny ticks that
// quickens), a knock when it hits the stop, and the margin bell. The bell is a small inharmonic metal
// ping with a pair of near-equal partials, which gives a real bell its slow shimmer.
export default {
  id: 'ui-typewriter-bell',
  name: 'Typewriter Return',
  category: 'ui',
  tags: ['typewriter', 'carriage', 'return', 'bell', 'ding', 'line', 'retro', 'teletype'],
  desc: 'A typewriter carriage return: a ratcheting slide, a knock at the stop and a bright margin bell. For typed lines finishing and retro text effects.',
  dur: 0.85,
  family: 'mechanical',
  moments: ['type-out'],
  params: {
    slide: { min: 0.12, max: 0.3, def: 0.2, unit: 's', desc: 'How long the carriage takes to run back' },
    pitch: { min: 1800, max: 3200, def: 2400, unit: 'Hz', desc: 'Pitch of the margin bell' },
    ring: { min: 0.2, max: 0.5, def: 0.38, unit: 's', desc: 'How long the bell rings' },
    bell: { min: 0, max: 1, def: 0.7, desc: 'Level of the bell, 0 leaves only the carriage' },
  },
  play(T, out, t, p) {
    const L = p.slide;
    // the lever flick
    T.tick(out, t, { f: 1300, q: 1.2, dur: 0.012, peak: 0.05, blip: 200, blipTo: 120, blipPeak: 0.03, blipDur: 0.04 });
    // the carriage: a scrape under a run of ticks that bunch up toward the end
    T.noise(out, t + 0.02, { filter: 'bandpass', f: 1000, to: 2200, q: 1.1, dur: L, peak: 0.02, a: L * 0.5 });
    const n = Math.round(L / 0.0125);
    for (let k = 1; k <= n; k++) {
      T.tick(out, t + 0.02 + L * Math.pow(k / n, 0.85), { f: 2700, q: 2, dur: 0.006, peak: 0.032, jitter: 0.8 });
    }
    // the stop
    const stop = t + 0.02 + L;
    T.tick(out, stop, { f: 800, q: 1, dur: 0.02, peak: 0.05, blip: 170, blipTo: 95, blipPeak: 0.045, blipDur: 0.07 });
    if (p.bell > 0.02) {
      T.bell(out, stop + 0.015, {
        f: p.pitch, dur: p.ring, peak: 0.045 * p.bell, a: 0.002,
        partials: [[1, 1, 1], [1.011, 0.7, 0.95], [2.4, 0.35, 0.5], [4.1, 0.2, 0.3], [6.7, 0.08, 0.18]],
      });
    }
  },
};
