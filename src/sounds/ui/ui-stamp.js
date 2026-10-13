// A rubber stamp pressed onto paper: a low thump as the block lands, a flat slap of the pad on the
// sheet, a wet splat of ink spreading out under the pad, and a faint peel as it lifts away. The
// weight sets the body: a light office stamp up to a heavy desk stamp. After the Deck Lab stamp cue.
export default {
  id: 'ui-stamp',
  name: 'Rubber Stamp',
  category: 'ui',
  tags: ['stamp', 'rubber-stamp', 'thump', 'seal', 'ink', 'approved', 'verified', 'slap'],
  desc: 'A rubber stamp landing on paper: a firm thump, a flat slap and a wet splat of ink, then a soft peel as it lifts. For approved, paid or verified.',
  dur: 0.31,
  family: 'impact',
  moments: ['stamp'],
  params: {
    weight: { min: 0, max: 1, def: 0.5, desc: 'Size of the stamp: 0 a light office stamp, 1 a heavy desk stamp with a deeper, longer thump' },
    ink: { min: 0, max: 1, def: 0.5, desc: 'How wet the ink is: 0 a dry press, 1 a squelchy splat and a longer peel' },
    pitch: { min: 90, max: 220, def: 140, unit: 'Hz', desc: 'Note of the thump before it sags' },
  },
  play(T, out, t, p) {
    const w = p.weight;
    // the thump: a body note that sags, longer and a bit deeper with weight
    T.osc(out, t, { f: p.pitch * (1.2 - 0.25 * w), to: p.pitch * 0.4, dur: 0.1 + 0.08 * w, peak: 0.085 + 0.04 * w, a: 0.003, glide: 0.07 });
    // the block's knock, an octave and a bit above the thump, where small speakers can hear it
    T.osc(out, t, { type: 'triangle', f: p.pitch * 2.6, to: p.pitch * 1.3, dur: 0.05, peak: 0.07, a: 0.002, glide: 0.04 });
    // the slap: the flat of the pad on paper
    T.noise(out, t, { filter: 'bandpass', f: 1000, q: 0.9, dur: 0.035, peak: 0.12, a: 0.002 });
    T.tick(out, t, { f: 3600, q: 1.1, dur: 0.008, peak: 0.04 });
    // the splat: ink squeezed out sideways, a falling hiss and a small wet blip
    T.noise(out, t + 0.012, { filter: 'bandpass', f: 4200, to: 1500, q: 0.8, dur: 0.07 + 0.04 * p.ink, peak: 0.03 + 0.1 * p.ink, a: 0.006 });
    T.osc(out, t + 0.012, { f: 950, to: 320, dur: 0.04, peak: 0.02 + 0.04 * p.ink, a: 0.004, glide: 0.03 });
    // the peel: the rubber letting go of the sheet
    T.noise(out, t + 0.17, { filter: 'bandpass', f: 1800, to: 4800, q: 1.4, dur: 0.06 + 0.06 * p.ink, peak: 0.018 + 0.02 * p.ink, a: 0.02 });
  },
};
