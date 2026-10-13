// Square-wave beeps picked from a small scale and pushed through a bitcrusher, so the quiet tail of
// each one gates off in steps like an old console speaker.
export default {
  id: 'scifi-terminal-blip',
  name: 'Terminal Blip',
  category: 'scifi',
  tags: ['terminal', 'blip', 'beep', 'computer', 'console', 'readout', 'retro'],
  desc: 'A quick run of bitcrushed computer beeps, like a console printing a readout or acknowledging a command.',
  dur: 0.45,
  family: 'chip',
  moments: ['readout'],
  params: {
    pitch: { min: 500, max: 2400, def: 1200, unit: 'Hz', desc: "First beep's pitch; later beeps pick scale notes up to an octave above" },
    count: { min: 1, max: 5, def: 3, step: 1, desc: 'How many beeps in the run' },
    speed: { min: 0.04, max: 0.1, def: 0.055, unit: 's', desc: 'Time between beeps' },
    grit: { min: 0, max: 1, def: 0.5, desc: 'Bitcrush depth: low cleaner beeps, high crunchier with choppier tails' },
  },
  play(T, out, t, p) {
    const cr = T.crush(out, t, { bits: 8 - 5 * p.grit, ref: 0.1 });
    const scale = [1, 1.2599, 1.4983, 1.7818, 2, 1.3348];
    const n = Math.round(p.count);
    for (let k = 0; k < n; k++) {
      // the first beep is always the base pitch, so the run always starts from the same place
      const r = k === 0 ? 1 : scale[Math.floor(T.rand() * scale.length)];
      T.osc(cr, t + k * p.speed, { type: 'square', f: p.pitch * r, dur: 0.04, peak: 0.09, a: 0.002 });
    }
  },
};
