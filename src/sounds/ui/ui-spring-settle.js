// A spring coming to rest: a soft tone that drops a little from an overshoot while a vibrato swings
// it up and down and dies away. The wobble is FM with a modulator in the vibrato range whose index
// glides to zero, so the swing shrinks to nothing exactly as the sound ends. An octave voice at a
// third of the level gives it body. Deliberately quiet: a settle, not a boing (game-bounce is the boing).
export default {
  id: 'ui-spring-settle',
  name: 'Spring Settle',
  category: 'ui',
  tags: ['spring', 'settle', 'elastic', 'wobble', 'jelly', 'rubber-band', 'overshoot', 'ease'],
  desc: 'A quiet wobbling tone that overshoots, swings up and down and settles to rest. For springy, elastic and jelly motion.',
  dur: 0.55,
  family: 'soft',
  moments: ['transition', 'drop'],
  params: {
    pitch: { min: 220, max: 880, def: 440, unit: 'Hz', desc: 'The note the spring comes to rest on' },
    wobble: { min: 6, max: 16, def: 10, unit: 'Hz', desc: 'Speed of the swing: low a lazy sway, high a fast shiver' },
    depth: { min: 0, max: 1, def: 0.5, desc: 'How far the first swing goes: 0 a gentle sway, 1 a big rubbery overshoot' },
    settle: { min: 0.2, max: 0.5, def: 0.36, unit: 's', desc: 'How long the spring takes to come to rest' },
  },
  play(T, out, t, p) {
    const dev = 0.1 + 0.35 * p.depth;
    // f0 is the start pitch (a little above the rest note); the modulator runs at wobble x (f0 / pitch) Hz
    const voice = (mult, level) => {
      const f0 = p.pitch * mult * 1.1;
      const f1 = p.pitch * mult;
      T.fm(out, t, {
        type: 'sine', f: f0, to: f1, glide: 0.07, ratio: p.wobble / (p.pitch * mult),
        index: (p.pitch * mult * dev) / p.wobble, index1: 0, dur: p.settle, peak: level, a: 0.006, tail: 0.12,
      });
    };
    voice(1, 0.05);
    voice(2, 0.016);
    T.tick(out, t, { f: 2600, q: 1.6, dur: 0.008, peak: 0.02 });
  },
};
