// One progress update: a short sine that glides up and lands on a note set by `pos`, so a bar
// that is called on every update draws one rising line of pitch. With ticks, the landing note
// snaps to a stair (a detent) and the glide starts on the stair below, with a soft tick on each;
// without, it starts a little under its note. Round and quiet because a download can call it often.
export default {
  id: 'data-progress-fill',
  name: 'Progress Fill',
  category: 'data',
  tags: ['progress', 'bar', 'fill', 'percent', 'upload', 'download', 'ring', 'rising', 'meter'],
  desc: 'A short rising glide whose note follows the progress: call it on every update with pos from 0 to 1 and the updates draw one climbing line.',
  dur: 0.19,
  family: 'soft',
  moments: ['progress'],
  params: {
    pos: { min: 0, max: 1, def: 0.5, desc: 'How full the bar is: 0 the lowest note, 1 the highest' },
    pitch: { min: 220, max: 660, def: 330, unit: 'Hz', desc: 'Note at an empty bar' },
    span: { min: 7, max: 24, def: 17, unit: 'st', desc: 'How far the pitch climbs from empty to full' },
    ticks: { min: 0, max: 16, def: 8, step: 1, desc: 'Stair steps along the bar with a soft tick on each: 0 a smooth glide' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.ticks);
    const at = (q) => p.pitch * Math.pow(2, (p.span * q) / 12);
    const q = n > 0 ? Math.round(p.pos * n) / n : p.pos;
    const f = at(q);
    // start on the stair below (or 1.5 semitones under when smooth) so each call arrives from below
    const from = n > 0 ? at(Math.max(0, q - 1 / n)) : f * Math.pow(2, -1.5 / 12);
    const lead = from < f ? from : f * 0.97;
    T.osc(out, t, { f: lead, to: f, glide: 0.06, dur: 0.17, peak: 0.036, a: 0.008, tail: 0.1, fade: 0.06 });
    T.osc(out, t, { type: 'triangle', f: f * 2, dur: 0.12, peak: 0.007, a: 0.008, tail: 0.1, fade: 0.05 });
    if (n > 0) T.tick(out, t, { f: f * 3, q: 2, dur: 0.01, peak: 0.02, lp: 5000 });
  },
};
