// A stepper moving on: one soft note per step, climbing a major pentatonic scale, each landing with
// a small wooden knock. Arriving at the last step adds a bell glint above the note, so a wizard or
// checkout flow can be heard to finish. Step 1 is the bottom of the scale; steps past eight stay on
// the top note.
export default {
  id: 'ui-step-advance',
  name: 'Step Advance',
  category: 'ui',
  tags: ['step', 'stepper', 'wizard', 'progress', 'milestone', 'advance', 'checkout', 'next', 'onboarding'],
  desc: 'One soft rounded note per step, each higher on a gentle scale, landing with a small knock. Reaching the last step adds a bell glint on top.',
  dur: 0.42,
  family: 'soft',
  moments: ['step'],
  params: {
    step: { min: 1, max: 8, def: 3, step: 1, desc: 'The step just reached: each number is a note higher on the scale' },
    steps: { min: 2, max: 8, def: 5, step: 1, desc: 'How many steps the flow has: reaching or passing the last adds the glint' },
    pitch: { min: 262, max: 523, def: 440, unit: 'Hz', desc: 'Note of step 1; the later steps climb from it' },
  },
  play(T, out, t, p) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const idx = Math.max(0, Math.min(7, Math.round(p.step) - 1));
    const f = p.pitch * Math.pow(2, scale[idx] / 12);
    const last = Math.round(p.step) >= Math.round(p.steps);
    // the note: a round triangle with a quiet octave, so it sits warm rather than glassy
    T.osc(out, t, { type: 'triangle', f, dur: 0.2, peak: 0.068, a: 0.008 });
    T.osc(out, t, { f: f * 2, dur: 0.08, peak: 0.014, a: 0.008 });
    // the landing: a small wooden knock under the note's start
    T.osc(out, t, { f: 170, to: 100, dur: 0.05, peak: 0.032, a: 0.003, glide: 0.04 });
    T.tick(out, t, { f: 2200, q: 1.2, dur: 0.008, peak: 0.02 });
    if (last) {
      // the finish: two bell glints, an octave and a fifth over the note
      T.bell(out, t + 0.08, { f: f * 2, dur: 0.3, peak: 0.026, a: 0.004, partials: [[1, 1, 1], [2.76, 0.12, 0.3]] });
      T.bell(out, t + 0.14, { f: f * 3, dur: 0.27, peak: 0.018, a: 0.004, partials: [[1, 1, 1], [2.76, 0.1, 0.3]] });
    }
  },
};
