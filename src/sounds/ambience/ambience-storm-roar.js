// A heavy continuous roar of two lowpassed noises, an independent pair in each ear, with slow
// swells riding on it, a sheet of rain hiss high above, wide slow gusts that sweep across the field
// and a narrow wail drifting through it. There are no separate drops or cracks: this is the weight
// of the whole storm, not a rain bed or a breeze.
export default {
  id: 'ambience-storm-roar',
  name: 'Storm Roar',
  category: 'ambience',
  tags: ['storm', 'roar', 'gale', 'hurricane', 'tornado', 'downpour', 'weather', 'wind', 'heavy', 'bed'],
  desc: 'Being inside a big storm: a deep wide roar of wind and sheeting rain with a low wail running through it. For a gale, tornado or downpour.',
  dur: 8,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    fury: { min: 0, max: 1, def: 0.55, desc: 'Size of the storm: 0 a hard blow, 1 a full gale with a heavier, brighter roar' },
    rain: { min: 0, max: 1, def: 0.5, desc: 'Level of the steady sheet of rain hiss: 0 none, 1 heavy' },
    howl: { min: 0, max: 1, def: 0.35, desc: 'Level of the wail through the roar: 0 none, 1 clearly audible' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const f = p.fury;
    // a bigger storm is louder as well as wider: the level slope keeps the whole range in one band
    const k = 1 + 0.6 * f;
    [-0.85, 0.85].forEach((x, i) => {
      // every layer of this ear rides one slow swell, each ear on its own pace
      const swell = T.gain(T.pan(out, t, { x }), 0.78);
      T.lfo(swell, t, { param: 'gain', rate: 0.13 + 0.06 * i, depth: 0.22, dur: L, a: fade });
      // the weight underneath, and the roar above it
      T.noise(swell, t, {
        filter: 'lowpass', f: 170 + 190 * f, q: 0.7, dur: L, peak: 0.1 * k, a: fade, s: 1, d: 0.02, r: fade,
      });
      T.noise(swell, t, {
        filter: 'lowpass', f: 650 + 650 * f, q: 0.6, dur: L, peak: 0.045 * k, a: fade, s: 1, d: 0.02, r: fade,
      });
      // the sheet of rain
      T.noise(swell, t, {
        filter: 'bandpass', f: 3800, q: 0.4, dur: L, peak: 0.002 + 0.02 * p.rain, a: fade, s: 1, d: 0.02, r: fade,
      });
    });
    // wide slow gusts, each sweeping across the field as it passes
    const n = Math.max(1, Math.round(L / 2.2));
    const gap = L / n;
    for (let j = 0; j < n; j++) {
      const at = j * gap + T.rand(0, gap * 0.3);
      const len = Math.min(gap * T.rand(1.3, 1.7), L - at);
      const up = T.rand() < 0.5;
      const lane = j % 2 === 0 ? 1 : -1;
      const lap = T.pan(out, t + at, { x: -0.7 * lane, to: 0.7 * lane, dur: len });
      T.noise(lap, t + at, {
        filter: 'bandpass', f: up ? 240 : 650, to: up ? 650 : 240, q: 0.9,
        dur: len, peak: 0.04 * k * T.rand(0.7, 1), a: len * 0.45,
      });
    }
    // the wail: two narrow bands drifting apart, a thin tone on top of the roar
    const wl = T.pan(out, t, { x: -0.5, to: 0.5, dur: L });
    T.noise(wl, t + L * 0.1, {
      filter: 'bandpass', f: 330 + 140 * f, to: 480 + 200 * f, q: 9,
      dur: L * 0.8, peak: 0.55 * p.howl, a: L * 0.3,
    });
    const wr = T.pan(out, t, { x: 0.5, to: -0.5, dur: L });
    T.noise(wr, t + L * 0.2, {
      filter: 'bandpass', f: 520 + 200 * f, to: 400 + 140 * f, q: 9,
      dur: L * 0.65, peak: 0.4 * p.howl, a: L * 0.3,
    });
  },
};
