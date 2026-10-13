// A falling swish of air (a letter sliding in) into a "tu-DING": a short quiet bell, then a longer
// one a fourth above, in a very small room. The mirror of the message-sent whoosh.
export default {
  id: 'notify-new-mail',
  name: 'New Mail',
  category: 'notify',
  tags: ['mail', 'email', 'inbox', 'new', 'letter', 'ding', 'incoming'],
  desc: 'A soft falling swish into a short-long two-bell "tu-ding". A letter has landed in the inbox.',
  dur: 0.95,
  params: {
    pitch: { min: 440, max: 880, def: 784, unit: 'Hz' },
    interval: { min: 3, max: 9, def: 5, step: 1, unit: 'st' },
    swish: { min: 0.2, max: 1, def: 0.5 },
    ring: { min: 0.25, max: 0.6, def: 0.4, unit: 's' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.5, mix: 0.18, tone: 0.6 });
    const parts = [[1, 1, 1], [2, 0.25, 0.5], [2.76, 0.08, 0.2]];
    const pitch = p.pitch * (1 + T.rand(-0.006, 0.006));   // seeded variation so repeats are not identical
    T.noise(room, t, { filter: 'bandpass', f: 3000, to: 700, q: 0.9, dur: 0.1, peak: 0.13 * p.swish, a: 0.03 });
    T.bell(room, t + 0.09, { f: pitch, dur: 0.1, peak: 0.045, a: 0.005, partials: parts });
    T.bell(room, t + 0.2, { f: pitch * Math.pow(2, Math.round(p.interval) / 12), dur: p.ring, peak: 0.07, a: 0.005, partials: parts });
  },
};
