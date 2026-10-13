// Three round bubbles in a row, like the dots of a typing indicator bouncing: each a sine that bends
// up a little into its note, a whole step above the one before, with a faint glassy octave on top.
export default {
  id: 'ai-typing-dots',
  name: 'Typing Dots',
  category: 'ai',
  tags: ['ai', 'typing', 'dots', 'indicator', 'chat', 'assistant', 'bubble', 'soft', 'thinking', 'loop-cell'],
  desc: 'Three soft rising bloops in a row, like the dots of a typing indicator. Re-trigger every 1.2 s while the other side is writing.',
  dur: 0.7,
  family: 'soft',
  moments: ['thinking'],
  params: {
    pitch: { min: 330, max: 880, def: 523.25, unit: 'Hz', desc: 'Note of the first dot; the next two sit a whole step higher each' },
    gap: { min: 0.12, max: 0.26, def: 0.17, unit: 's', desc: 'Time between the dots: short a quick bounce, long a lazy one' },
    glass: { min: 0, max: 1, def: 0.5, desc: 'Glassy octave over each dot: 0 a plain round bloop, 1 a bright bubble' },
  },
  play(T, out, t, p) {
    const steps = [0, 2, 4];
    const lift = [0.85, 1, 0.92];   // the middle dot leans forward a little
    for (let k = 0; k < 3; k++) {
      const at = t + k * p.gap;
      // a few cents and a fraction of a dB per dot, so the three are never copies
      const o = T.jitter({ f: p.pitch * Math.pow(2, steps[k] / 12), peak: 0.03 * lift[k] }, { cents: 8, db: 0.8 });
      T.osc(out, at, { f: o.f * 0.86, to: o.f, glide: 0.035, dur: 0.15, peak: o.peak, a: 0.008 });
      T.osc(out, at, { f: o.f * 2, dur: 0.07, peak: o.peak * 0.4 * p.glass, a: 0.006 });
    }
  },
};
