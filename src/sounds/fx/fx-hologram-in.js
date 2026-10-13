// A projection locking on or letting go. A comb of five narrow noise bands (a harmonic ladder, so it
// shimmers like a flanger sweep) rises toward the note in broken, digital slices, then a glassy chord
// holds. Off plays it in reverse: the chord, then slices that fall apart and sweep away. Different
// from the hologram flicker in scifi, which is a steady unstable tone; this is the appearing itself.
export default {
  id: 'fx-hologram-in',
  name: 'Hologram On',
  category: 'fx',
  tags: ['hologram', 'projection', 'materialize', 'shimmer', 'sweep', 'appear', 'dissolve', 'digital', 'comb'],
  desc: 'A shimmering sweep that stutters into a glassy chord as a projection appears, or breaks up and drifts away as it switches off. For a hologram or a screen image materializing.',
  dur: 1.14,
  family: 'synthetic',
  moments: ['reveal'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: 'Direction: 1 the projection appears, 0 it breaks up and disappears' },
    pitch: { min: 300, max: 1200, def: 600, unit: 'Hz', desc: 'Note of the glassy chord the shimmer settles on' },
    stutter: { min: 0, max: 1, def: 0.5, desc: 'How broken the lock-on is: 0 one smooth sweep, 1 many short digital slices' },
    length: { min: 0.35, max: 0.7, def: 0.5, unit: 's', desc: 'How long the shimmer takes to build, or to break up' },
  },
  play(T, out, t, p) {
    const on = p.on >= 0.5;
    const L = p.length;
    const S = 1 + Math.round(5 * p.stutter);
    const slot = L / S;
    // off starts with the chord, so the shimmer waits for it
    const lead = on ? 0 : 0.18;
    const ladder = [1, 2, 3, 4, 5];
    // the shimmer's centre at x (0 start of the shimmer, 1 end): it always travels between 0.35 of the note and the note
    const centre = (x) => p.pitch * 0.35 * Math.pow(1 / 0.35, on ? x : 1 - x);
    for (let k = 0; k < S; k++) {
      const x0 = k / S;
      const x1 = (k + 1) / S;
      const solid = on ? k === S - 1 : k === 0;
      const len = solid ? slot : slot * T.rand(0.4, 0.8);
      const at = t + lead + k * slot;
      const level = on ? 0.35 + 0.65 * x1 : 1 - 0.8 * x0;
      const gate = T.bus(out, at, { peak: level, a: 0.003, dur: len, s: 1, d: 0.003, r: 0.004 });
      for (let i = 0; i < ladder.length; i++) {
        T.noise(gate, at, {
          filter: 'bandpass', f: centre(x0) * ladder[i], to: centre(x1) * ladder[i], q: 10, glide: len,
          dur: len + 0.01, peak: 0.4 / Math.sqrt(ladder[i]), a: 0.002, s: 1, d: 0.001, r: 0.005,
        });
      }
      if (!solid) T.tick(out, at, { f: 7000, q: 1, dur: 0.006, peak: 0.02 });
    }
    // the chord: it rings out on, and on off it is cut short as the shimmer takes over
    const at = on ? t + L : t;
    const hold = on ? 0.42 : lead + 0.05;
    const shape = on ? { a: 0.01, dur: hold } : { a: 0.01, dur: hold, s: 1, d: 0.02, r: 0.06 };
    T.osc(out, at, Object.assign({ f: p.pitch, peak: 0.05 }, shape));
    T.osc(out, at, Object.assign({ f: p.pitch * 1.004, peak: 0.03, trem: { rate: 7, depth: 0.5 } }, shape));
    T.osc(out, at, Object.assign({ type: 'triangle', f: p.pitch * 2, peak: 0.022 }, shape));
    T.osc(out, at, Object.assign({ f: p.pitch * 3, peak: 0.012 }, shape));
  },
};
