// A short rising breath of band-passed air that ends in a small sine blip: the message leaving.
// The mirror of the new-mail sound (a falling swish into a bell).
export default {
  id: 'notify-message-out',
  name: 'Message Sent',
  category: 'notify',
  tags: ['message', 'send', 'sent', 'whoosh', 'blip', 'outgoing', 'post'],
  desc: 'A soft rising whoosh into a tiny blip: your message is on its way. Quiet enough to play on every send.',
  dur: 0.35,
  params: {
    pitch: { min: 600, max: 1400, def: 1047, unit: 'Hz' },
    speed: { min: 0.08, max: 0.22, def: 0.13, unit: 's' },
    air: { min: 0.2, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const w = p.speed * (1 + T.rand(-0.06, 0.06));   // seeded variation so repeats are not identical
    const pitch = p.pitch * (1 + T.rand(-0.008, 0.008));
    T.noise(out, t, { filter: 'bandpass', f: 600, to: 3200, q: 0.9, dur: w, peak: 0.15 * p.air, a: w * 0.6 });
    T.osc(out, t + w * 0.85, { f: pitch * 0.88, to: pitch, glide: 0.02, dur: 0.11, peak: 0.085, a: 0.005 });
    T.osc(out, t + w * 0.85, { f: pitch * 2, dur: 0.05, peak: 0.016, a: 0.005 });
  },
};
