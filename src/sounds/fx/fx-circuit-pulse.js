// A pulse of current racing down a circuit trace. Each straight run is a fast rising chirp (a thin
// pulse wave with a sine an octave up) panned along the board; at every right-angle corner the chirp
// restarts a little higher with a sharp tick, and where the trace ends a node lights with a glassy
// ring. Quick and electric, where the data lane's route trace is a soft dot drifting along a map.
export default {
  id: 'fx-circuit-pulse',
  name: 'Circuit Pulse',
  category: 'fx',
  tags: ['circuit', 'trace', 'pulse', 'pcb', 'electric', 'current', 'zip', 'chirp', 'energy', 'stereo'],
  desc: 'A bright chirp zips along a circuit trace, kicking up a notch at each corner, and lights a node at the end with a glassy ring. For energy flowing through a circuit diagram.',
  dur: 0.85,
  family: 'synthetic',
  params: {
    pitch: { min: 300, max: 1000, def: 500, unit: 'Hz', desc: 'Where the first chirp starts; it rises more than an octave along each run' },
    turns: { min: 0, max: 4, def: 2, step: 1, desc: 'How many right-angle corners the pulse takes, 0 for a straight run' },
    length: { min: 0.2, max: 0.6, def: 0.35, unit: 's', desc: 'How long the pulse takes to run the whole trace' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Size of the glassy ring where the pulse arrives: 0 a faint tick, 1 a bright ring' },
  },
  play(T, out, t, p) {
    const legs = Math.round(p.turns) + 1;
    const leg = p.length / legs;
    for (let k = 0; k < legs; k++) {
      const at = t + k * leg;
      // the pulse travels left to right across the board, a stretch of it per run
      const lane = T.pan(out, at, { x: -0.9 + (1.8 * k) / legs, to: -0.9 + (1.8 * (k + 1)) / legs, dur: leg });
      const f = p.pitch * Math.pow(1.12, k);
      const run = { glide: leg, dur: leg, a: 0.003, s: 1, d: 0.01, r: 0.008 };
      T.pulse(lane, at, Object.assign({ duty: 0.2, f, to: f * 2.4, peak: 0.035, lp: 5000 }, run));
      T.osc(lane, at, Object.assign({ f: f * 2, to: f * 4.8, peak: 0.02 }, run));
      // the corner
      if (k < legs - 1) T.tick(lane, at + leg, { f: 4500, q: 2, dur: 0.01, peak: 0.05 });
    }
    // the node at the end of the trace lights up
    const end = t + p.length;
    T.bell(out, end, { f: p.pitch * 5, partials: [[1, 1, 1], [2.4, 0.4, 0.5]], dur: 0.25, peak: 0.015 + 0.05 * p.glow });
    T.tick(out, end, { f: 6000, q: 1.5, dur: 0.01, peak: 0.02 + 0.03 * p.glow });
  },
};
