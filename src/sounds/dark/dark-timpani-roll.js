// A timpani roll: rapid strokes, uneven in time and weight like a real player, swelling from a
// whisper to a final accented hit with a low cello note under it.
export default {
  id: 'dark-timpani-roll',
  name: 'Timpani Roll',
  category: 'dark',
  tags: ['timpani', 'roll', 'drum', 'crescendo', 'build', 'suspense', 'dark', 'cinematic', 'orchestral', 'stinger'],
  desc: 'A drum roll that builds from a murmur to a thundering final blow. For the moment before a reveal, a countdown to doom or a boss about to appear.',
  dur: 5.65,
  family: 'orchestral',
  moments: ['tension', 'reveal', 'transition'],
  params: {
    length: { min: 1.5, max: 3, def: 2.2, unit: 's', desc: 'How long the roll builds before the final hit' },
    pitch: { min: 65, max: 130, def: 87, unit: 'Hz', desc: 'Pitch of the kettle drum' },
    swell: { min: 0.2, max: 1, def: 0.7, desc: 'How big the crescendo: low a modest build, high from near silence to a roar' },
  },
  play(T, out, t, p) {
    const room = T.reverb(T.gain(out, 0.69), t, { time: 2.2, mix: 0.3, tone: 0.3 });
    const L = p.length;
    const modes = [[1, 1, 1], [1.5, 0.5, 0.8], [1.98, 0.3, 0.6]];
    let x = 0;
    let side = 0;
    while (x < L - 0.05) {
      const u = x / L;
      // strokes quicken as the roll builds, with seeded jitter in time and weight
      const gap = (0.1 - 0.04 * u) * T.rand(0.8, 1.2);
      const lvl = (1 - p.swell) + p.swell * Math.pow(u, 1.6);
      const w = lvl * T.rand(0.75, 1.1);
      T.membrane(room, t + x, { kind: 'timpani', f: p.pitch * (side ? 1.003 : 1), dur: 0.5, peak: 0.075 * w + 0.004, stick: 0.25, boom: 0, modes });
      side = 1 - side;
      x += gap;
    }
    const h = t + L;
    T.membrane(room, h, { kind: 'timpani', f: p.pitch, dur: 1.8, peak: 0.2, stick: 0.65, boom: 0.9 });
    T.bow(room, h, { f: p.pitch, players: 3, body: 0.6, pressure: 0.5, bright: 0.3, vib: 6, dur: 1.9, a: 0.05, r: 1.2, peak: 0.06 });
  },
};
