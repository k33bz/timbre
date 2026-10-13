// Lowpassed noise whose cutoff sinks as it rolls: a main rumble, later rolls that re-light it, and
// a few muffled ticks for the crack of the lightning channel. Distance darkens and thins the crack.
export default {
  id: 'ambience-distant-thunder',
  name: 'Distant Thunder',
  category: 'ambience',
  tags: ['thunder', 'storm', 'rumble', 'weather', 'low', 'distant', 'rolling'],
  desc: 'A storm miles away: a muffled crack and a long low rumble that rolls and fades out.',
  dur: 8,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the rumble and its rolls' },
    distance: { min: 0, max: 1, def: 0.55, desc: 'How far the storm is: 0 near with a loud crack, 1 far, darker, no crack' },
    rolls: { min: 0, max: 3, def: 2, step: 1, desc: 'How many later rolls re-light the rumble after the first' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const far = p.distance;
    const dark = 1 - 0.55 * far;
    // a lower cutoff passes less noise: lift the peak so a far storm is not just quieter
    const lift = 1 / Math.sqrt(dark);
    T.noise(out, t, {
      filter: 'lowpass', f: 260 * dark, to: 55, q: 0.8, dur: L, peak: 0.2 * lift, a: 0.45, curve: 'lin',
    });
    const n = Math.round(p.rolls);
    for (let k = 1; k <= n; k++) {
      const at = Math.min(L - 1.2, L * 0.14 * k + T.rand(0.2, 0.7));
      T.noise(out, t + at, {
        filter: 'lowpass', f: T.rand(190, 260) * dark, to: 50, q: 0.8,
        dur: Math.min(2.6, L - at), peak: 0.16 * lift * (1 - 0.22 * k), a: 0.5,
      });
    }
    // the crack: a muffled burst and a handful of ticks, fading with distance
    const crack = 1 - far;
    T.noise(out, t, { filter: 'bandpass', f: 900, to: 250, q: 0.9, dur: 0.55, peak: 0.12 * crack, a: 0.004 });
    for (let k = 0; k < 5; k++) {
      T.noise(out, t + T.rand(0.02, 0.4), {
        filter: 'bandpass', f: T.rand(500, 1400), q: 1.5, dur: T.rand(0.03, 0.07), peak: 0.1 * crack * T.rand(0.4, 1), a: 0.003,
      });
    }
  },
};
