// A dot travelling a route: a quiet sine climbs an octave along a pentatonic ladder while it drifts
// across the stereo field, a small glass tick marks each waypoint it passes, and a bell rings out
// where it arrives. Each leg is its own sine that re-attacks at the waypoint, which is the "hop".
export default {
  id: 'data-route-trace',
  name: 'Route Trace',
  category: 'data',
  tags: ['route', 'path', 'waypoint', 'trace', 'journey', 'map', 'travel', 'arrival', 'delivery', 'stereo'],
  desc: 'A soft rising glide with a small glass tick at each waypoint and a bell where the trip ends. For a dot or vehicle travelling a route on a map.',
  dur: 2.6,
  family: 'glass',
  moments: ['route'],
  params: {
    pitch: { min: 260, max: 600, def: 392, unit: 'Hz', desc: 'Where the glide starts; it climbs an octave to the arrival bell' },
    length: { min: 0.6, max: 2, def: 1.1, unit: 's', desc: 'How long the trip takes before the arrival bell' },
    waypoints: { min: 0, max: 4, def: 2, step: 1, desc: 'How many stops it passes on the way, 0 for a straight run' },
    width: { min: 0, max: 1, def: 0.5, desc: 'How far the dot drifts across the stereo field: 0 stays centred, 1 sweeps left to right' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.waypoints);
    const legs = n + 1;
    const leg = p.length / legs;
    const ladder = [0, 2, 4, 7, 9, 12];
    // waypoint k sits k / legs of the way up the ladder; the last note is the octave
    const note = (k) => ladder[Math.round((5 * k) / legs)];
    const hz = (k) => p.pitch * Math.pow(2, note(k) / 12);
    const travel = T.pan(out, t, { x: -p.width, to: p.width, dur: p.length });
    for (let k = 0; k < legs; k++) {
      const at = t + k * leg;
      // each leg overlaps the next by 30 ms, so the hop is a re-attack rather than a gap
      T.osc(travel, at, { f: hz(k), to: hz(k + 1), glide: leg * 0.85, dur: leg + 0.03, peak: 0.028, a: 0.015, s: 1, d: 0.002, r: 0.03 });
    }
    for (let k = 1; k <= n; k++) {
      const at = t + k * leg;
      const g = T.pan(out, at, { x: -p.width + (2 * p.width * k) / legs });
      T.bell(g, at, { f: hz(k) * 2, partials: [[1, 1, 1], [2.76, 0.3, 0.4]], dur: 0.1, peak: 0.032, a: 0.002 });
      T.tick(g, at, { f: 3500, q: 1.2, lp: 6000, dur: 0.008, peak: 0.03 });
    }
    // arrival: centred, an octave over the glide's last note, with a soft overtone and a low note under it
    const end = t + p.length + 0.02;
    T.bell(out, end, { f: p.pitch * 4, partials: [[1, 1, 1], [2.01, 0.3, 0.55], [3, 0.12, 0.4]], dur: 0.55, peak: 0.038, a: 0.004 });
    T.osc(out, end, { f: p.pitch * 2, dur: 0.3, peak: 0.016, a: 0.006 });
  },
};
