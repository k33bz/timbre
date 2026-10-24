// A single small dark bell stroke: a minor-third bell (hum, then the third above) in a short room.
// Softer than an alarm. Notify, reminder, message.
export default {
  id: 'dark-bell-knell',
  name: 'Knell',
  category: 'dark',
  tags: ['notify', 'reminder', 'message', 'bell', 'knell', 'toll', 'minor', 'gothic', 'dark', 'soft'],
  desc: 'One small, dark bell stroke with a mournful minor-third ring and a short room. For a notification, reminder or message that is softer than an alarm.',
  dur: 1.3,
  family: 'orchestral',
  moments: ['notify', 'reminder', 'message'],
  params: {
    pitch: { min: 196, max: 520, def: 294, unit: 'Hz', desc: 'Pitch of the bell: a big low toll or a small chapel bell' },
    ring: { min: 0, max: 1, def: 0.5, desc: 'How long the bell rings out' },
    strike: { min: 0, max: 1, def: 0.4, desc: 'Hardness of the stroke: 0 a muffled, felted blow, 1 a clearer clang' },
    room: { min: 0, max: 1, def: 0.4, desc: 'How much stone room surrounds the bell' },
  },
  play(T, out, t, p) {
    const space = T.reverb(out, t, { time: 0.3 + 0.4 * p.room, mix: 0.1 + 0.25 * p.room, tone: 0.35 });
    const d = 0.5 + 0.45 * p.ring;
    const s = 0.2 + 0.8 * p.strike;
    T.bell(space, t, {
      f: p.pitch,
      partials: [[0.5, 0.5, 0.9], [1, 1, 1], [1.19, 0.8, 0.75], [1.5, 0.35, 0.55], [2, 0.4 * s + 0.1, 0.4], [2.38, 0.3 * s, 0.3], [3.2, 0.2 * s, 0.15]],
      drift: 0.995, dur: d, peak: 0.04, a: 0.002,
    });
    T.noise(space, t, { filter: 'bandpass', f: 1500, q: 1, dur: 0.02, peak: 0.02 * s, a: 0.001 });
  },
};
