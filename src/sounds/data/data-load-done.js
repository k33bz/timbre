// The wait is over: a soft filled sweep rises to a note, and on it lands a small settle and a
// glass check tick. `check` blends the ending, from a skeleton quietly settling into place (a low
// pad of sound, no ping) to a spinner turning into a tick mark (a bright little ping on top).
export default {
  id: 'data-load-done',
  name: 'Wait Resolved',
  category: 'data',
  tags: ['loaded', 'done', 'resolve', 'complete', 'check', 'skeleton', 'saved', 'loader'],
  desc: 'A quick filled sweep that lands with a soft settle and a small check tick, for a spinner or skeleton that has finished. Quieter than a success chime.',
  dur: 0.5,
  family: 'soft',
  moments: ['load-complete'],
  params: {
    pitch: { min: 392, max: 880, def: 523, unit: 'Hz', desc: 'Note the sweep lands on, with the check ping an octave above' },
    sweep: { min: 0.06, max: 0.2, def: 0.12, unit: 's', desc: 'Length of the rising sweep before it lands' },
    check: { min: 0, max: 1, def: 0.7, desc: 'The landing: 0 a skeleton settling softly, 1 a bright check tick' },
  },
  play(T, out, t, p) {
    const sw = p.sweep;
    const at = t + sw;
    // the fill: a sine climbing an octave and swelling all the way to the landing, with a band of
    // air opening beside it; the sine rings on a moment under the landing so the two join
    T.osc(out, t, { f: p.pitch * 0.5, to: p.pitch, glide: sw, dur: sw + 0.12, peak: 0.022, a: sw });
    T.noise(out, t, { filter: 'bandpass', f: p.pitch * 2, to: p.pitch * 6, q: 0.9, dur: sw + 0.01, peak: 0.02, a: sw - 0.005 });
    // the settle: a soft low knock that always lands (the skeleton filling in)
    T.osc(out, at, { f: p.pitch * 0.5, to: p.pitch * 0.4, dur: 0.12, peak: 0.026, a: 0.005 });
    T.noise(out, at, { filter: 'lowpass', f: 900, dur: 0.05, peak: 0.05, a: 0.004 });
    // the check: a glassy ping and a tiny tick, scaled by `check`
    T.bell(out, at, { f: p.pitch * 2, partials: [[1, 1, 1], [3, 0.18, 0.4]], dur: 0.24, peak: 0.012 + 0.04 * p.check, a: 0.003 });
    T.tick(out, at, { f: 5200, q: 2, dur: 0.008, peak: 0.01 + 0.035 * p.check });
  },
};
