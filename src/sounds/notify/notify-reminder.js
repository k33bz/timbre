// A doorbell-style "ding-dong": two warm bells falling a major third in a small room. Harmonic
// partials (1, 2, 3) keep it round; the fall is friendly here because the bells are soft and the
// step is a third, not a buzz.
export default {
  id: 'notify-reminder',
  name: 'Reminder Chime',
  category: 'notify',
  tags: ['reminder', 'chime', 'ding-dong', 'doorbell', 'due', 'nudge', 'bell'],
  desc: 'A soft two-bell "ding-dong" with a little room around it. A polite nudge that something is due.',
  dur: 1.6,
  family: 'soft',
  moments: ['reminder'],
  params: {
    pitch: { min: 440, max: 990, def: 659.25, unit: 'Hz', desc: 'Note of the first bell, the ding' },
    drop: { min: 3, max: 7, def: 4, step: 1, unit: 'st', desc: 'How far the second bell, the dong, falls below the first' },
    gap: { min: 0.2, max: 0.4, def: 0.3, unit: 's', desc: 'Time between the ding and the dong' },
    ring: { min: 0.5, max: 0.9, def: 0.7, unit: 's', desc: 'How long each bell rings out' },
    space: { min: 0, max: 0.5, def: 0.2, desc: 'Reverb mix around the bells, from dry to a small roomy wash' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.7, mix: p.space, tone: 0.5 });
    const parts = [[1, 1, 1], [2, 0.3, 0.55], [3, 0.1, 0.3]];
    T.bell(room, t, { f: p.pitch, dur: p.ring, peak: 0.07, a: 0.006, partials: parts });
    T.bell(room, t + p.gap, { f: p.pitch * Math.pow(2, -Math.round(p.drop) / 12), dur: p.ring, peak: 0.075, a: 0.006, partials: parts });
  },
};
