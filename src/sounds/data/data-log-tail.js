// A log scrolling by (tail -f): each line is a quick run of three or four tiny typed blips, hopping
// between a few notes, and a lower return tick. The log level sets the pitch of the whole burst
// (debug lowest, error highest) and the voice: debug and info are plain soft blips, warn adds a
// detuned partner that beats, error switches to a thin pulse wave. Lines never overlap (the pace
// floor is longer than a line), and each line's start moves a hair at random so it never marches.
export default {
  id: 'data-log-tail',
  name: 'Log Tail',
  category: 'data',
  tags: ['log', 'tail', 'terminal', 'console', 'lines', 'typed', 'stream', 'loop-cell'],
  desc: 'A short burst of tiny typed blips, one run per log line, higher and edgier from debug to error. Re-trigger every 1.5 s while a log streams.',
  dur: 1.05,
  family: 'synthetic',
  moments: ['readout'],
  params: {
    level: { min: 0, max: 3, def: 1, step: 1, choices: ['debug', 'info', 'warn', 'error'], desc: 'Log level: pitch climbs from debug to error, and warn and error get an edge' },
    lines: { min: 2, max: 5, def: 3, step: 1, desc: 'How many log lines scroll by in the burst' },
    pace: { min: 0.14, max: 0.22, def: 0.17, unit: 's', desc: 'Time between lines: short a fast scroll, long a sparse one' },
  },
  play(T, out, t, p) {
    const lvl = Math.round(p.level);
    const base = [330, 440, 587, 784][lvl];
    const peak = [0.032, 0.037, 0.03, 0.053][lvl];
    const notes = [1, 1.125, 1.25, 1.5];
    const n = Math.round(p.lines);
    const blip = (f, at) => {
      if (lvl === 3) T.pulse(out, at, { duty: 0.25, f, dur: 0.02, peak, a: 0.002 });
      else T.osc(out, at, { type: 'triangle', f, dur: 0.02, peak, a: 0.002 });
      // warn: a partner a quarter tone sharp, so the blip wavers
      if (lvl === 2) T.osc(out, at, { type: 'triangle', f: f * 1.03, dur: 0.02, peak: peak * 0.5, a: 0.002 });
    };
    for (let k = 0; k < n; k++) {
      const start = t + k * p.pace + T.rand(0, 0.01);
      const chars = 3 + Math.floor(T.rand() * 2);
      for (let c = 0; c < chars; c++) {
        blip(base * notes[Math.floor(T.rand() * notes.length)], start + c * 0.022);
      }
      // the return at the end of the line: a dry tick a fifth below
      T.tick(out, start + chars * 0.022 + 0.015, { f: 2400, q: 3, dur: 0.008, peak: 0.03, blip: base * 0.667, blipDur: 0.02, blipPeak: peak * 0.7 });
    }
  },
};
