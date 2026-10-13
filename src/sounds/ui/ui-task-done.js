// A task crossed off: a crisp pen tick, a fast strike-through swipe left to right, and a small
// rounded ding where the line ends. A streak adds a trail of glints after the ding, one per task
// in a row and each higher, so a run of finished tasks sparkles more. Plainer and drier than the
// checkbox, which is a toggle, not a completion.
export default {
  id: 'ui-task-done',
  name: 'Task Done',
  category: 'ui',
  tags: ['task', 'done', 'complete', 'check-off', 'strike-through', 'todo', 'streak', 'checklist', 'finish'],
  desc: 'A pen tick, a quick strike-through swipe and a small ding for a task crossed off. A streak adds a trail of rising glints.',
  dur: 0.5,
  family: 'soft',
  moments: ['success'],
  params: {
    streak: { min: 0, max: 5, def: 0, step: 1, desc: 'Tasks finished in a row: each adds one more rising glint after the ding' },
    pitch: { min: 440, max: 1100, def: 784, unit: 'Hz', desc: 'Note of the ding; the glints climb from it' },
    swipe: { min: 0, max: 1, def: 0.6, desc: 'Level of the strike-through swipe: 0 just the tick and ding, 1 a clear stroke' },
  },
  play(T, out, t, p) {
    // the pen tick
    T.tick(out, t, { f: 3300, q: 1.3, dur: 0.01, peak: 0.045, blip: 1300, blipTo: 900, blipPeak: 0.03, blipDur: 0.025 });
    // the strike-through: a quick rising stroke of air, with a thin tone riding it
    T.noise(out, t + 0.03, { filter: 'bandpass', f: 1800, to: 6000, q: 1.6, dur: 0.1, peak: 0.1 * p.swipe, a: 0.03 });
    T.osc(out, t + 0.03, { f: 1500, to: 3000, dur: 0.09, peak: 0.012 * p.swipe, a: 0.03, glide: 0.08 });
    // the ding where the line ends
    T.osc(out, t + 0.12, { type: 'triangle', f: p.pitch, dur: 0.2, peak: 0.075, a: 0.006 });
    T.osc(out, t + 0.12, { f: p.pitch * 2, dur: 0.08, peak: 0.016, a: 0.006 });
    // the streak: glints climbing the pentatonic, an octave above the ding and tighter each time
    const scale = [0, 2, 4, 7, 9];
    const n = Math.round(p.streak);
    for (let k = 0; k < n; k++) {
      T.osc(out, t + 0.2 + k * 0.05, {
        f: p.pitch * 2 * Math.pow(2, scale[k] / 12), dur: 0.09, peak: 0.032, a: 0.003,
      });
    }
  },
};
