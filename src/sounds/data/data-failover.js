// The active node dies and its standby takes over: a dull falling thud, a gap of silence the length
// of the outage, then a three-note rising run that lands on a bell, the standby coming online.
export default {
  id: 'data-failover',
  name: 'Failover',
  category: 'data',
  tags: ['failover', 'standby', 'takeover', 'switchover', 'backup', 'recovery', 'outage', 'redundancy', 'resilience', 'diagram'],
  desc: 'A dull falling thud as a node goes down, a short silence, then a rising run of three notes as the backup takes over. For high availability and recovery diagrams.',
  dur: 1.13,
  family: 'synthetic',
  moments: ['failover'],
  params: {
    pitch: { min: 300, max: 800, def: 440, unit: 'Hz', desc: 'Pitch the node goes down from; the takeover run is built on it' },
    gap: { min: 0.1, max: 0.5, def: 0.26, unit: 's', desc: 'Silence between the failure and the takeover: low a quick switch, high a long outage' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'How glassy the takeover is: 0 soft sines, 1 a bright bell on the last note' },
  },
  play(T, out, t, p) {
    // node down: a falling blip with a thud of noise under it, kept dark on purpose
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.5, glide: 0.1, dur: 0.12, peak: 0.06, a: 0.004, lp: p.pitch * 1.6 });
    T.tick(out, t, { f: 900, q: 0.9, lp: 1800, dur: 0.02, peak: 0.05 });
    // standby online: root, major third, fifth, each a little louder, the last one rings
    const start = t + 0.12 + p.gap;
    const steps = [0, 4, 7];
    for (let k = 0; k < 3; k++) {
      const at = start + k * 0.07;
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      const last = k === 2;
      T.osc(out, at, { f, dur: last ? 0.36 : 0.09, peak: 0.03 + 0.012 * k, a: 0.005 });
      T.osc(out, at, { type: 'triangle', f: f * 2, dur: last ? 0.2 : 0.06, peak: 0.01 + 0.004 * k, a: 0.005 });
    }
    T.bell(out, start + 0.14, { f: p.pitch * 3, partials: [[1, 1, 1], [2.4, 0.3, 0.5]], dur: 0.36, peak: 0.03 * p.bright, a: 0.004 });
  },
};
