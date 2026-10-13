// A gauge needle moving to a new reading, heard as a small servo: a lowpassed saw whirring up (or
// down) the dial with a band of gear noise riding its pitch, then a spring swing (a few shrinking
// bounces past the reading) and a final detent tick as it settles. Longer moves take longer and
// cover more pitch. Mechanical family; the whir is the quietest part, the tick the sharpest.
export default {
  id: 'data-gauge-needle',
  name: 'Gauge Needle',
  category: 'data',
  tags: ['gauge', 'needle', 'dial', 'meter', 'servo', 'whir', 'swing', 'settle'],
  desc: 'A small servo whir as a gauge needle swings to a new reading, a few springy bounces, then a soft detent tick as it settles.',
  dur: 0.62,
  family: 'mechanical',
  moments: ['progress', 'chart-reveal'],
  params: {
    sweep: { min: -1, max: 1, def: 0.7, desc: 'How far the needle travels: positive up the dial, negative back down, small a short hop' },
    swing: { min: 0, max: 1, def: 0.5, desc: 'Spring overshoot when it arrives: 0 stops dead, 1 bounces a few times' },
    pitch: { min: 150, max: 450, def: 260, unit: 'Hz', desc: 'Pitch of the servo whir at the start of the move' },
  },
  play(T, out, t, p) {
    const dist = Math.abs(p.sweep);
    const dir = p.sweep >= 0 ? 1 : -1;
    const len = 0.12 + 0.3 * dist;
    const f0 = p.pitch;
    const f1 = f0 * Math.pow(2, dir * (0.15 + 0.85 * dist));
    // the move: a buzzy whir and a band of gear noise riding the same pitch
    T.osc(out, t, {
      type: 'sawtooth', f: f0, to: f1, dur: len, peak: 0.03, a: 0.015, s: 1, d: 0.01, r: 0.04, glide: len * 0.9,
      lp: { f: f0 * 3, to: f1 * 3, q: 1.2 },
    });
    T.noise(out, t, { filter: 'bandpass', f: f0 * 5, to: f1 * 5, q: 3, dur: len, peak: 0.06, a: 0.015, s: 1, d: 0.01, r: 0.04 });
    // the spring: each bounce overshoots the reading by less, alternating sides
    const bounce = [1, -0.55, 0.25];
    let from = f1;
    for (let k = 0; k < 3; k++) {
      const to = f1 * (1 + 0.2 * p.swing * bounce[k]);
      T.osc(out, t + len * 0.95 + k * 0.055, { type: 'triangle', f: from, to, dur: 0.07, peak: 0.032 * p.swing * (1 - 0.25 * k), a: 0.004 });
      from = to;
    }
    // the detent: a small dry tick once everything has settled
    T.tick(out, t + len * 0.95 + 0.17, { f: 2600, q: 3, dur: 0.01, peak: 0.07, blip: f1 * 2, blipDur: 0.025, blipPeak: 0.016 });
  },
};
