// One blip arrives in the centre, then splits into a fan: each branch blip sits at its own place in
// the stereo field and climbs a pentatonic ladder from left to right, so the spread is also a small
// rising run. Placement is fixed per blip (a blip is over before a pan sweep would be heard).
export default {
  id: 'data-fanout',
  name: 'Fan-out',
  category: 'data',
  tags: ['fanout', 'fan-out', 'split', 'broadcast', 'load-balancer', 'pubsub', 'branch', 'spread', 'diagram', 'stereo'],
  desc: 'One blip arrives and splits into a fan of blips that fly out across the stereo field, left to right, each a step higher. For a load balancer or a broadcast.',
  dur: 0.55,
  family: 'soft',
  moments: ['packet'],
  params: {
    pitch: { min: 400, max: 1400, def: 700, unit: 'Hz', desc: 'Pitch of the blip that arrives; the branches climb from a third above it' },
    branches: { min: 2, max: 6, def: 3, step: 1, desc: 'How many blips it splits into' },
    spread: { min: 0, max: 1, def: 0.8, desc: 'How wide the fan opens: 0 all branches in the centre, 1 hard left to hard right' },
    stagger: { min: 0.02, max: 0.07, def: 0.04, unit: 's', desc: 'Time between branches: low a tight burst, high a slow arpeggio' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.branches);
    const ladder = [4, 7, 9, 12, 14, 16];
    const drift = T.jitter(1, { cents: 12 });
    T.osc(out, t, { f: p.pitch * drift, dur: 0.08, peak: 0.034, a: 0.004 });
    const start = t + 0.075;
    for (let k = 0; k < n; k++) {
      const at = start + k * p.stagger;
      const x = n > 1 ? p.spread * (-1 + (2 * k) / (n - 1)) : 0;
      const g = T.pan(out, at, { x });
      const f = p.pitch * drift * Math.pow(2, ladder[k] / 12);
      T.osc(g, at, { f, dur: 0.09, peak: 0.028, a: 0.004 });
      T.osc(g, at, { f: f * 2, dur: 0.04, peak: 0.007, a: 0.004 });
    }
  },
};
