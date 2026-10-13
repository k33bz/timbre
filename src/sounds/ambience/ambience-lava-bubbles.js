// Slow thick bubbles: sines that rise in pitch as they swell, lowpassed and dropped around the
// stereo field, each ending in a soft round pop. Under them a warm lowpassed breath of heat that
// slowly swells, and a simmer of tiny low bursts. Everything is low and dry, nothing like a cave.
export default {
  id: 'ambience-lava-bubbles',
  name: 'Lava Bubbles',
  category: 'ambience',
  tags: ['lava', 'bubbles', 'bubbling', 'lamp', 'viscous', 'warm', 'molten', 'gurgle', 'bed'],
  desc: 'Thick warm bubbles rising slowly and popping softly over a low simmer of heat, like a lava lamp. Fades in and out.',
  dur: 8,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    bubbles: { min: 2, max: 14, def: 6, step: 1, desc: 'How many big slow bubbles rise during the bed' },
    depth: { min: 0.6, max: 1.6, def: 1, unit: 'x', desc: 'Scales bubble pitch: low thick slow ones, high small light ones' },
    heat: { min: 0, max: 1, def: 0.5, desc: 'Level of the warm simmer under the bubbles: 0 faint, 1 full' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const win = (x) => Math.min(1, x / 0.7, (L - x) / 1.3);
    // the warm breath of heat, one independent noise per side, each swelling at its own slow pace
    [-0.8, 0.8].forEach((x, k) => {
      const lp = T.filter(T.pan(out, t, { x }), t, { type: 'lowpass', f: 230, q: 0.8, dur: 0.1 });
      T.lfo(lp, t, { rate: 0.1 + 0.06 * k, depth: 60, dur: L, a: fade });
      T.noise(lp, t, {
        filter: 'none', dur: L, peak: 0.025 + 0.18 * p.heat, a: fade, s: 1, d: 0.02, r: fade,
      });
    });
    // the simmer: tiny low bursts, as one source
    const simmer = T.bus(T.pan(out, t, { x: 0.3 }), t, { dur: L, a: fade, s: 1, d: 0.02, r: fade });
    T.crackle(simmer, t, {
      dur: L, rate: 11, f: 360, spread: 0.7, q: 3, len: 0.035, peak: 0.06 * (0.3 + 0.7 * p.heat), vary: 0.8,
    });
    // big bubbles: a sine rising as it swells, a quiet octave for the wet edge, then a soft pop
    const n = Math.round(p.bubbles);
    const span = Math.max(0.5, L - 0.4 - 1.3);
    for (let k = 0; k < n; k++) {
      const at = 0.4 + ((k + T.rand(0.1, 0.9)) * span) / n;
      const f = T.rand(115, 270) * p.depth;
      const len = T.rand(0.28, 0.5);
      const w = win(at);
      const side = T.pan(out, t + at, { x: T.rand(-0.75, 0.75) });
      T.osc(side, t + at, { f, to: f * T.rand(1.6, 2.2), dur: len, peak: 0.031 * T.rand(0.6, 1) * w, a: 0.06, lp: 700 });
      T.osc(side, t + at, { f: f * 2, to: f * 3.4, dur: len * 0.8, peak: 0.009 * w, a: 0.08, lp: 900 });
      T.noise(side, t + at + len * 0.8, { filter: 'lowpass', f: 340, q: 0.8, dur: 0.09, peak: 0.045 * w, a: 0.012 });
    }
  },
};
