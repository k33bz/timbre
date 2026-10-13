// A paper-flip tick (a very short band of noise), then two soft synth plucks rising a fourth: a
// sawtooth through a lowpass that closes as the note rings, with a triangle an octave down for body.
// The pluck is the one timbre in the notify set that is not a bell or a plain sine, which is what
// makes it read as the calendar. (A Karplus-Strong string was tried first: its timbre depends on
// the random excitation, so some seeds came out thin and bright. This one is the same every time.)
export default {
  id: 'notify-calendar',
  name: 'Calendar Event',
  category: 'notify',
  tags: ['calendar', 'event', 'meeting', 'schedule', 'agenda', 'pluck', 'appointment'],
  desc: 'A tiny page-flip tick and two soft plucked notes rising a fourth. An event is starting; warm and organized, not urgent.',
  dur: 0.8,
  params: {
    pitch: { min: 330, max: 880, def: 523.25, unit: 'Hz' },
    interval: { min: 3, max: 8, def: 5, step: 1, unit: 'st' },
    gap: { min: 0.1, max: 0.25, def: 0.16, unit: 's' },
    bright: { min: 0.1, max: 0.8, def: 0.45 },
    tick: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.noise(out, t, { filter: 'bandpass', f: 2200, q: 1.4, dur: 0.025, peak: 0.09 * p.tick, a: 0.003 });
    const start = 1200 + 3200 * p.bright;
    for (let k = 0; k < 2; k++) {
      const f = k ? p.pitch * Math.pow(2, Math.round(p.interval) / 12) : p.pitch;
      const at = t + 0.04 + k * p.gap;
      // the cutoff falls from `start` to just above the note, which is what makes it a pluck
      const lp = T.filter(out, at, { type: 'lowpass', f: start, to: Math.min(start, f * 1.3), dur: 0.3, q: 1.2 });
      T.osc(lp, at, { type: 'sawtooth', f, dur: 0.45, peak: 0.06, a: 0.003 });
      T.osc(lp, at, { type: 'triangle', f: f / 2, dur: 0.3, peak: 0.03, a: 0.003 });
    }
  },
};
