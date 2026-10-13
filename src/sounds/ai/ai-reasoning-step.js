// One step of a chain of thought: a soft sine that slides up from the note of the step before, with
// a faint octave and two fading echoes. The step number picks a degree of a pentatonic scale, so
// eight plays in a row climb two octaves.
export default {
  id: 'ai-reasoning-step',
  name: 'Reasoning Step',
  category: 'ai',
  tags: ['ai', 'reasoning', 'step', 'thought', 'chain', 'plan', 'agent', 'progress', 'glass', 'scale'],
  desc: 'A soft glassy note that slides up from the last one and echoes twice. Each step climbs one note of a gentle scale, so a chain of thought rises as it goes.',
  dur: 0.5,
  family: 'glass',
  moments: ['step'],
  params: {
    step: { min: 1, max: 8, def: 3, step: 1, desc: 'Which step of the chain: each one climbs a note of the scale' },
    pitch: { min: 220, max: 660, def: 329.63, unit: 'Hz', desc: 'Note of the first step; the later steps climb up to two octaves above it' },
    glow: { min: 0, max: 1, def: 0.6, desc: 'Level of the two echoes: 0 a single clean note, 1 a lingering thought' },
  },
  play(T, out, t, p) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const k = Math.min(7, Math.max(0, Math.round(p.step) - 1));
    const f = p.pitch * Math.pow(2, scale[k] / 12);
    const from = k === 0 ? f * 0.89 : p.pitch * Math.pow(2, scale[k - 1] / 12);
    T.osc(out, t, { f: from, to: f, glide: 0.05, dur: 0.3, peak: 0.055, a: 0.006 });
    T.osc(out, t, { f: from * 2, to: f * 2, glide: 0.05, dur: 0.14, peak: 0.012, a: 0.006 });
    // two echoes of the settled note, each softer than the last
    T.osc(out, t + 0.12, { f, dur: 0.22, peak: 0.055 * 0.7 * p.glow, a: 0.006 });
    T.osc(out, t + 0.24, { f, dur: 0.2, peak: 0.055 * 0.35 * p.glow, a: 0.006 });
  },
};
