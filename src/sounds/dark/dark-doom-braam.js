// The huge low brass-like blast of a cinematic trailer: stacked sawtooths and a bowed double bass
// section through drive, a sub underneath, a slow-ish attack into a roar that dies in a big room.
export default {
  id: 'dark-doom-braam',
  name: 'Doom Braam',
  category: 'dark',
  tags: ['braam', 'brass', 'blast', 'cinematic', 'trailer', 'doom', 'low', 'dark', 'heavy', 'stinger'],
  desc: 'A colossal low blast that swells into a roar and fades in a huge hall. For a title reveal, a monster rising or the moment a plan collapses.',
  dur: 4.95,
  family: 'orchestral',
  moments: ['reveal', 'scare', 'transition'],
  params: {
    pitch: { min: 32, max: 70, def: 46, unit: 'Hz', desc: 'Root of the blast: a deep rumble to a heavy brassy note' },
    weight: { min: 0, max: 1, def: 0.6, desc: 'How much sub and drive: 0 clean and brassy, 1 crushing and distorted' },
    length: { min: 1.2, max: 2.6, def: 1.9, unit: 's', desc: 'How long the blast holds before it fades' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    const L = p.length;
    // trim: the stack is dense and would sit at the very top of the range
    const room = T.reverb(T.dcblock(T.gain(out, 0.27)), t, { time: 2.2, mix: 0.3, tone: 0.3 });
    const dr = T.drive(room, t, { amount: 0.35 + 0.5 * p.weight, ref: 0.2 });
    // the brass opens as it swells: a lowpass sweeping up through the roar
    const fl = T.filter(dr, t, { type: 'lowpass', f: 220, to: 1500 + 1500 * (1 - p.weight), dur: L * 0.6, q: 1.2 });
    const env = { a: 0.28, dur: L, s: 0.7, d: L * 0.4, r: 0.9, curve: 'lin' };
    // stacked saws: root, a fifth and an octave, each a little off
    const saws = [[1, 0], [1, 9], [1.5, -7], [2, 6], [2, -10]];
    for (const [m, c] of saws) {
      T.osc(fl, t, Object.assign({ type: 'sawtooth', f: f * m, detune: c, peak: 0.075 / Math.sqrt(m) }, env));
    }
    // a low bowed section underneath, pressing hard
    T.bow(fl, t, { f: f * 2, players: 4, pressure: 0.8, bright: 0.6, body: 0.6, vib: 5, dur: L + 0.6, a: 0.3, r: 0.9, peak: 0.1 });
    // the sub
    T.osc(dr, t, { f, to: f * 0.96, dur: L + 0.8, a: 0.25, s: 0.8, d: L * 0.5, r: 1, curve: 'lin', peak: 0.04 + 0.1 * p.weight });
  },
};
