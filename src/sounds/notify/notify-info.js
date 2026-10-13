// A bell strike with the harshness taken out: a sine fundamental, a quiet octave, and a faint
// struck-metal partial that dies first so only the attack is glassy.
export default {
  id: 'notify-info',
  name: 'Info Ping',
  category: 'notify',
  tags: ['info', 'notice', 'ping', 'neutral', 'heads-up', 'bell', 'fyi'],
  desc: 'One soft bell tap for neutral news: nothing wrong and nothing won, just a heads-up. Made to be heard all day.',
  dur: 0.8,
  family: 'soft',
  moments: ['info'],
  params: {
    pitch: { min: 500, max: 1200, def: 880, unit: 'Hz', desc: 'Note of the bell tap' },
    decay: { min: 0.2, max: 0.7, def: 0.4, unit: 's', desc: 'How long the bell rings out' },
    bright: { min: 0, max: 1, def: 0.4, desc: 'Level of the octave and the glassy partial: 0 soft and pure, 1 brighter' },
  },
  play(T, out, t, p) {
    // the 2.76 partial lasts a quarter of the decay, so it reads as the edge of the attack, not a tone
    // a touch of seeded variation (under 1% in pitch, about 1 dB in level) so a busy day is not one
    // identical tap repeated; it is steady when Vary is off
    T.bell(out, t, {
      f: p.pitch * (1 + T.rand(-0.008, 0.008)), dur: p.decay, peak: 0.072 * T.rand(0.9, 1), a: 0.006,
      partials: [[1, 1, 1], [2, 0.2 + 0.3 * p.bright, 0.5], [2.76, 0.04 + 0.12 * p.bright, 0.25]],
    });
  },
};
