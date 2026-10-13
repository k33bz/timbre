// A small droid talking: a string of short FM chirps, each swooping up or down from where the last
// ended, at random FM ratios. Mood is the chance that a chirp goes up.
export default {
  id: 'scifi-robot-chirp',
  name: 'Robot Chirp',
  category: 'scifi',
  tags: ['robot', 'droid', 'chirp', 'bleep', 'chatter', 'android', 'talk'],
  desc: 'A quick burst of FM chirps that swoop up and down like a small, expressive droid.',
  dur: 1.05,
  params: {
    pitch: { min: 500, max: 1400, def: 900, unit: 'Hz' },
    chirps: { min: 2, max: 6, def: 4, step: 1 },
    mood: { min: 0, max: 1, def: 0.6 },
    speed: { min: 0.05, max: 0.12, def: 0.075, unit: 's' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.chirps);
    const ratios = [2, 3, 1.5, 2.5];
    let f = p.pitch;
    let at = t;
    for (let k = 0; k < n; k++) {
      const len = p.speed * T.rand(0.8, 1.3);
      const up = T.rand() < p.mood;
      const to = Math.min(3200, f * (up ? T.rand(1.3, 2.2) : T.rand(0.5, 0.8)));
      T.fm(out, at, {
        f, to, ratio: ratios[Math.floor(T.rand() * ratios.length)], index: 1.5, index1: 0.5,
        dur: len, peak: 0.09, a: 0.004, s: 0.7, d: 0.02, r: 0.02,
      });
      // the next chirp starts near where this one ended, kept inside a comfortable band
      f = Math.min(p.pitch * 2, Math.max(p.pitch * 0.55, to * T.rand(0.8, 1.25)));
      at += len + 0.012;
    }
  },
};
