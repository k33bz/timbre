// Capacity changing. Scaling out stacks soft blips up a pentatonic ladder and lets every one ring, so
// the run piles up into a chord. Scaling in plays the ladder downwards in short, dry blips that
// drop out one by one and leave nothing behind.
export default {
  id: 'data-scale',
  name: 'Scale Out / In',
  category: 'data',
  tags: ['scale', 'autoscaling', 'scale-out', 'scale-in', 'capacity', 'instances', 'grow', 'shrink', 'serverless', 'diagram'],
  desc: 'Scaling out piles up a run of rising blips into a chord, scaling in drops a run of short blips down and away. For auto scaling, capacity and fleet size changes.',
  dur: 0.88,
  moments: ['scale'],
  family: 'soft',
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 scaling out with blips that rise and stack up, 0 scaling in with blips that fall away' },
    count: { min: 2, max: 6, def: 4, step: 1, desc: 'How many instances are added or removed, one blip each' },
    pitch: { min: 330, max: 880, def: 523, unit: 'Hz', desc: 'Pitch of the lowest blip of the run' },
    speed: { min: 0.04, max: 0.09, def: 0.06, unit: 's', desc: 'Time between blips: low a quick burst, high a slow build' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.count);
    const up = p.up >= 0.5;
    const ladder = [0, 2, 4, 7, 9, 12];
    // more blips would add up louder, so each one gets a smaller share
    const peak = 0.05 / Math.sqrt(n);
    const end = t + n * p.speed + 0.3;
    for (let k = 0; k < n; k++) {
      const at = t + k * p.speed;
      const f = p.pitch * Math.pow(2, ladder[up ? k : n - 1 - k] / 12);
      if (up) {
        // every blip rings until the common end, so the run stacks into a chord
        T.osc(out, at, { f, dur: end - at, peak, a: 0.006 });
        T.osc(out, at, { f: f * 2, dur: 0.06, peak: 0.01, a: 0.006 });
      } else {
        // short and dry, with the top of the sound rolled off, each one gone before the next
        T.osc(out, at, { f, dur: 0.1, peak: peak * 1.1, a: 0.005, lp: f * 1.5 });
      }
    }
  },
};
