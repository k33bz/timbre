// A head shake in sound: two or more short hums that alternate a high and a lower note ("uh-uh") and
// swing between the left and right of the stereo field. A triangle carries the hum; a filtered saw
// under it adds the rasp. Quiet, so a rejected field can say no without shouting.
export default {
  id: 'ui-shake-no',
  name: 'Shake No',
  category: 'ui',
  tags: ['shake', 'no', 'reject', 'deny', 'uh-uh', 'wrong', 'invalid', 'head-shake'],
  desc: 'A soft two-note "uh-uh" that swings left and right. For a field that shakes, a refused input or a polite no.',
  dur: 0.55,
  family: 'soft',
  moments: ['error'],
  params: {
    pitch: { min: 220, max: 520, def: 330, unit: 'Hz', desc: 'The higher note of the "uh-uh"' },
    drop: { min: 1, max: 6, def: 3, unit: 'st', desc: 'How far the second note falls below the first' },
    shakes: { min: 2, max: 4, def: 2, step: 1, desc: 'How many shakes: 2 is a plain "uh-uh", 4 a firmer "uh-uh-uh-uh"' },
    rough: { min: 0, max: 1, def: 0.35, desc: 'Rasp under the hum: 0 a clean hum, 1 a buzzy growl' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.shakes);
    const low = p.pitch * Math.pow(2, -p.drop / 12);
    const sides = [T.pan(out, t, { x: -0.4 }), T.pan(out, t, { x: 0.4 })];
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.13;
      const f = k % 2 === 0 ? p.pitch : low;
      const lane = sides[k % 2];
      T.osc(lane, at, { type: 'triangle', f: f * 1.05, to: f, glide: 0.03, dur: 0.1, peak: 0.055, a: 0.008, lp: 2400 });
      if (p.rough > 0.02) {
        T.osc(lane, at, { type: 'sawtooth', f, to: f * 0.98, dur: 0.09, peak: 0.02 * p.rough, a: 0.008, lp: 1300 });
      }
    }
  },
};
