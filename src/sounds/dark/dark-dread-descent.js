// A Shepard glissando: octave-spaced tones falling for ever under a fixed bell curve, so the pitch
// keeps sinking and never arrives. A low drone holds still underneath for a floor.
export default {
  id: 'dark-dread-descent',
  name: 'Dread Descent',
  category: 'dark',
  tags: ['shepard', 'descent', 'falling', 'dread', 'tension', 'endless', 'horror', 'dark', 'drone', 'ominous'],
  desc: 'A tone that keeps sinking and never reaches the bottom: pure, endless dread. For a fall into the dark, a nightmare or a slow loss of control.',
  dur: 6.2,
  family: 'synthetic',
  moments: ['tension', 'level-down', 'scare'],
  params: {
    speed: { min: 0.05, max: 0.5, def: 0.16, unit: 'oct/s', desc: 'How fast it sinks: slow creeping dread to a steep plunge' },
    rise: { min: 0, max: 1, def: 0, step: 1, role: 'up', desc: '1 climbs for ever instead (rising panic), 0 sinks' },
    edge: { min: 0, max: 1, def: 0.3, desc: 'From pure sine tones to a reedy, organ-like buzz' },
    length: { min: 2, max: 6, def: 5, unit: 's', desc: 'How long it goes on' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.4, mix: 0.25, tone: 0.3 });
    const rate = (p.rise > 0.5 ? 1 : -1) * p.speed;
    T.shepard(room, t, { rate, center: 300, width: 1.3, edge: p.edge, dur: p.length - 0.4, a: 0.8, r: 0.9, peak: 0.085 });
    T.osc(room, t, { f: 55, dur: p.length - 0.4, peak: 0.016, a: 1, s: 1, d: 0.02, r: 1 });
  },
};
