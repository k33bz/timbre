// Ported from the Deck Lab "your turn" cue: two triangle notes rising (a fifth by default) with a
// soft octave shimmer on the second.
export default {
  id: 'notify-success-chime',
  name: 'Success Chime',
  category: 'notify',
  tags: ['success', 'done', 'complete', 'confirm', 'chime', 'positive'],
  desc: 'A gentle two-note rising chime for a completed action. Not a fanfare; a quiet yes.',
  dur: 0.5,
  family: 'soft',
  moments: ['success'],
  params: {
    pitch: { min: 330, max: 1320, def: 659.25, unit: 'Hz', desc: 'Note of the first chime; the second sits the interval above' },
    interval: { min: 3, max: 12, def: 7, step: 1, unit: 'st', desc: 'How far the second note rises above the first' },
    gap: { min: 0.06, max: 0.2, def: 0.12, unit: 's', desc: 'Time between the two notes' },
    shimmer: { min: 0, max: 1, def: 0.35, desc: 'Level of the octave sine over the second note: 0 plain, 1 bright' },
  },
  play(T, out, t, p) {
    const hi = p.pitch * Math.pow(2, Math.round(p.interval) / 12);
    T.osc(out, t, { type: 'triangle', f: p.pitch, dur: 0.19, peak: 0.11, a: 0.01 });
    T.osc(out, t + p.gap, { type: 'triangle', f: hi, dur: 0.26, peak: 0.11, a: 0.01 });
    T.osc(out, t + p.gap, { f: hi * 2, dur: 0.13, peak: 0.1 * p.shimmer, a: 0.01 });
  },
};
