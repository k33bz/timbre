// A frozen frame stuttering: a tiny rising or falling chirp is cut out and repeated, then a different
// slice sticks and repeats, with static between. Three copies of every slice (a saw, a square and a
// triangle: the red, green and blue) are detuned and nudged in time, one hard left, one centre, one
// hard right, and the whole thing is bitcrushed. Unlike the hologram flicker in scifi, which chops one
// tone into bursts, this repeats the same fragment, which is what a glitch sounds like.
export default {
  id: 'fx-glitch-burst',
  name: 'Glitch Burst',
  category: 'fx',
  tags: ['glitch', 'stutter', 'bitcrush', 'rgb-split', 'datamosh', 'corrupt', 'digital', 'screen'],
  desc: 'A digital hiccup: a tiny chirp stuck on repeat, then another, smeared left and right and crushed to grit. For a screen glitching or an image corrupting.',
  dur: 0.59,
  family: 'synthetic',
  moments: ['glitch'],
  params: {
    harsh: { min: 0, max: 1, def: 0.5, desc: 'Grit: 0 a mostly clean stutter, 1 a harsh crushed one with louder static between the slices' },
    pitch: { min: 300, max: 1500, def: 700, unit: 'Hz', desc: 'Pitch of the first stuck chirp; later slices jump up to an octave away' },
    slices: { min: 2, max: 5, def: 3, step: 1, desc: 'How many different frames get stuck before the picture recovers' },
    split: { min: 0, max: 1, def: 0.5, desc: 'How far the three copies drift apart in pitch and timing: 0 a single voice, 1 a wide smear' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.slices);
    const slot = 0.09;
    const gap = 0.025;
    // one lane per colour: its own pan, its own crusher, its own waveform
    const lanes = [-1, 0, 1].map((x) => T.crush(T.pan(out, t, { x }), t, { bits: 8 - 4 * p.harsh, ref: 0.1 }));
    const types = ['sawtooth', 'square', 'triangle'];
    const peaks = [0.03, 0.026, 0.05];
    for (let k = 0; k < n; k++) {
      const at = t + k * (slot + gap);
      // the first slice sits on the pitch, later ones wander by up to an octave
      const f = k === 0 ? p.pitch : p.pitch * Math.pow(2, T.rand(-1, 1));
      const rise = T.rand() < 0.5 ? 1.5 : 0.67;
      const reps = 3 + Math.floor(T.rand(0, 3));
      const sl = slot / reps;
      for (let r = 0; r < reps; r++) {
        for (let c = 0; c < 3; c++) {
          const off = (c - 1) * p.split;
          T.osc(lanes[c], at + r * sl + Math.max(0, off) * 0.006, {
            type: types[c], f: f * Math.pow(2, (off * 90) / 1200), to: f * rise, glide: sl, dur: sl,
            peak: peaks[c], a: 0.002, s: 1, d: 0.002, r: 0.003,
          });
        }
      }
      // static where the picture tears between slices
      T.noise(lanes[1], at + slot, { filter: 'none', dur: gap, peak: 0.02 + 0.05 * p.harsh, a: 0.002, s: 1, d: 0.002, r: 0.004 });
    }
  },
};
