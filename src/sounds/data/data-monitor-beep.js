// One beat of a patient monitor: a clean sine beep with a hair of second harmonic, optionally over
// a soft heartbeat (two low thumps, lub then dub). It is a single cell for a host to repeat at its
// own heart rate; it falls to silence well inside its length. `soft` rounds the edges and drops
// the harmonic for the quieter vitals-screen variant. Synthetic family; kept quiet because it
// repeats for as long as the monitor is on screen.
export default {
  id: 'data-monitor-beep',
  name: 'Monitor Beep',
  category: 'data',
  tags: ['monitor', 'beep', 'ecg', 'pulse', 'heartbeat', 'vitals', 'medical', 'loop-cell'],
  desc: 'One clean beep of a patient monitor, with an optional soft heartbeat under it. Re-trigger every 0.8 s for 75 beats per minute.',
  dur: 0.2,
  family: 'synthetic',
  moments: ['readout', 'beacon'],
  params: {
    pitch: { min: 500, max: 1400, def: 880, unit: 'Hz', desc: 'Note of the beep: low a calm monitor, high a sharp one' },
    length: { min: 0.05, max: 0.14, def: 0.09, unit: 's', desc: 'How long the beep holds before it stops' },
    soft: { min: 0, max: 1, def: 0.3, desc: 'Edges of the beep: 0 sharp and clean, 1 rounded and mellow' },
    thump: { min: 0, max: 1, def: 0, desc: 'Level of the low lub-dub heartbeat under the beep: 0 none, 1 clear' },
  },
  play(T, out, t, p) {
    const rise = 0.004 + 0.02 * p.soft;
    const fall = 0.02 + 0.03 * p.soft;
    T.osc(out, t, { f: p.pitch, dur: p.length, peak: 0.042, a: rise, s: 1, d: 0.005, r: fall });
    T.osc(out, t, { f: p.pitch * 2, dur: p.length, peak: 0.01 * (1 - p.soft), a: rise, s: 1, d: 0.005, r: fall });
    // lub, then a softer dub
    T.osc(out, t, { f: 90, to: 65, dur: 0.07, peak: 0.026 * p.thump, a: 0.006 });
    T.osc(out, t + 0.11, { f: 80, to: 58, dur: 0.07, peak: 0.018 * p.thump, a: 0.006 });
  },
};
