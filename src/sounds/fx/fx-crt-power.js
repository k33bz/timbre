// A tube television switching on and off. On: a degauss thump with a wobbling low ring, then a thin
// high-voltage whine climbing as the picture warms up, over a bloom of static. Off: the whine drops,
// the picture collapses with a falling zoop and a soft thump, and a lone pip is left where the last
// dot glows. Not a machine spinning up like the sci-fi power sounds: it is a screen, with the whine.
export default {
  id: 'fx-crt-power',
  name: 'CRT Power',
  category: 'fx',
  tags: ['crt', 'tv', 'television', 'power-on', 'power-off', 'degauss', 'whine', 'collapse', 'boot', 'retro'],
  desc: 'An old tube screen turning on with a thump and a climbing whine, or off with a collapse to a single dot. For retro boot screens and screen-off effects.',
  dur: 1.18,
  family: 'synthetic',
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: 'Direction: 1 powers on with a thump and a climbing whine, 0 collapses to a dot' },
    pitch: { min: 2500, max: 8000, def: 5000, unit: 'Hz', desc: 'Top of the high-voltage whine; the dot pip sits lower' },
    thump: { min: 0, max: 1, def: 0.6, desc: 'Weight of the low degauss thump and the wobbling ring under it' },
    length: { min: 0.35, max: 0.9, def: 0.6, unit: 's', desc: 'How long the whine takes to climb on power-on, or the collapse takes on power-off' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const top = p.pitch;
    if (p.on >= 0.5) {
      // the degauss: a low thump and a ring that wobbles as it dies
      T.osc(out, t, { f: 68, to: 40, glide: 0.3, dur: 0.4, peak: 0.04 + 0.07 * p.thump, a: 0.004 });
      T.osc(out, t, { f: 125, to: 95, glide: 0.5, dur: 0.55, peak: 0.015 + 0.035 * p.thump, a: 0.004, trem: { rate: 13, depth: 0.9 } });
      T.noise(out, t, { filter: 'lowpass', f: 500, to: 120, q: 0.8, dur: 0.14, peak: 0.02 + 0.1 * p.thump, a: 0.002 });
      // the whine climbs while the picture warms, with static blooming under it
      T.osc(out, t + 0.06, { f: top * 0.2, to: top, glide: L, dur: L + 0.2, peak: 0.018, a: L * 0.7, s: 1, d: 0.02, r: 0.18 });
      T.noise(out, t + 0.06, { filter: 'highpass', f: 3500, q: 0.7, dur: L + 0.15, peak: 0.02, a: L * 0.8, s: 1, d: 0.02, r: 0.15 });
      T.tick(out, t + 0.06 + L, { f: 2500, q: 1, dur: 0.012, peak: 0.03 });
    } else {
      const C = L * 0.5;
      // the whine falls away and the picture collapses: a zoop down, a rush of noise, a soft thump
      T.osc(out, t, { f: top, to: top * 0.2, glide: C, dur: C + 0.05, peak: 0.018, a: 0.004, s: 1, d: 0.01, r: 0.04 });
      T.osc(out, t, { f: 1400, to: 90, glide: 0.22, dur: 0.26, peak: 0.06, a: 0.004 });
      T.noise(out, t, { filter: 'bandpass', f: 6000, to: 300, q: 1.2, dur: 0.25, peak: 0.1, a: 0.004 });
      T.osc(out, t + 0.02, { f: 70, to: 35, glide: 0.15, dur: 0.22, peak: 0.03 + 0.06 * p.thump, a: 0.004 });
      // the last dot: a tiny pip that rings for a moment
      T.bell(out, t + C, { f: top * 0.35, partials: [[1, 1, 1], [2, 0.3, 0.5]], dur: 0.32, peak: 0.03, a: 0.002 });
      T.tick(out, t + C, { f: 5000, q: 1.5, dur: 0.008, peak: 0.03 });
    }
  },
};
