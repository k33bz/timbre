// A critical alert, one step above the error buzz and a fraction of the klaxon: hard stabs of a
// buzzing tritone, each a little higher than the last, over a low sub that shudders with a fast
// tremolo. What sets it apart from the error buzz is direction (it climbs where the buzz sags),
// the open, buzzing tritone clash against the buzz's dull single tone, a sharp crack on every stab
// and loudness; what sets it apart from the klaxon is that it is over inside a second.
export default {
  id: 'notify-critical',
  name: 'Critical Alarm',
  category: 'notify',
  tags: ['critical', 'alarm', 'urgent', 'incident', 'emergency', 'breach', 'outage', 'pager', 'alert', 'severe'],
  desc: 'Two or three hard buzzing stabs, each higher than the last, over a shuddering low rumble. Unmistakably urgent, and over in under a second.',
  dur: 0.9,
  family: 'synthetic',
  moments: ['critical'],
  params: {
    pitch: { min: 220, max: 440, def: 311, unit: 'Hz', desc: 'Note of the first stab; the later ones climb from it' },
    stabs: { min: 2, max: 3, def: 2, step: 1, desc: 'Number of stabs in the alarm' },
    rough: { min: 0, max: 1, def: 0.6, desc: 'Depth of the fast flutter in each stab: 0 a hard steady tone, 1 a rattling shudder' },
    sub: { min: 0, max: 1, def: 0.7, desc: 'Level of the low rumble under the stabs, 0 removes it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.stabs);
    const gap = 0.28;                        // onset to onset, so each stab leaves an 80 ms gap
    const len = 0.2;                         // one stab
    const end = (n - 1) * gap + len;
    // the rumble: one low sine (and its octave, so small speakers still show it) with a fast tremolo
    const sub = p.pitch / 4;
    T.osc(out, t, {
      f: sub, to: sub * 0.97, dur: end + 0.12, peak: 0.055 * p.sub, a: 0.012, s: 0.8, d: 0.05, r: 0.12,
      trem: { rate: 17, depth: 0.7 },
    });
    T.osc(out, t, {
      f: sub * 2, to: sub * 1.94, dur: end + 0.1, peak: 0.03 * p.sub, a: 0.012, s: 0.8, d: 0.05, r: 0.1,
      trem: { rate: 17, depth: 0.7 },
    });
    const lp = T.filter(out, t, { type: 'lowpass', f: 3200, q: 0.8 });
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const f = p.pitch * Math.pow(2, (k * 3) / 12);    // each stab a minor third above the last
      const o = {
        type: 'square', dur: len, peak: 0.075, a: 0.003, s: 0.8, d: 0.025, r: 0.04,
        trem: { rate: 28, depth: 0.55 * p.rough },
      };
      T.osc(lp, at, Object.assign({ f }, o));
      T.osc(lp, at, Object.assign({ f: f * 1.4142 }, o));      // a tritone above: the clash
      T.tick(out, at, { f: 1800, q: 0.9, dur: 0.02, peak: 0.08 });
    }
  },
};
