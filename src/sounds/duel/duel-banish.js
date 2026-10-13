// A character is banished when its damage reaches its willpower: the card cracks (a quick glass
// crackle), the break rings and falls in pitch, grey dust sifts downward as a sinking band of noise,
// a few shards tinkle off, and the card settles with a low thump. Glass breaking, then falling.
export default {
  id: 'duel-banish',
  name: 'Banish Shatter',
  category: 'duel',
  tags: ['ink-duel', 'banish', 'shatter', 'crack', 'glass', 'fall', 'dust', 'knockout', 'card'],
  desc: 'A card cracking like glass and falling away: a quick crackle, a break that sinks in pitch, grey dust, tinkling shards, a low thump.',
  dur: 0.9,
  family: 'glass',
  moments: ['knockout'],
  params: {
    shatter: { min: 0, max: 1, def: 0.7, desc: 'How much the glass crackles and rings before it falls: 0 a quiet crack, 1 a full shatter' },
    fall: { min: 0.2, max: 0.6, def: 0.4, unit: 's', desc: 'How long the dust takes to sink: short a quick drop, long a slow fall' },
    thump: { min: 0, max: 1, def: 0.7, desc: 'Weight of the low thump as the card settles, 0 none' },
  },
  play(T, out, t, p) {
    const F = p.fall;
    const glass = [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34], [6.63, 0.09, 0.2]];
    const room = T.reverb(out, t, { time: 0.6, mix: 0.12, tone: 0.55 });
    // the crack: bursts of high noise, quick and uneven, that tighten into the break
    T.crackle(room, t, { dur: 0.22, rate: 45 + 40 * p.shatter, f: 4200, to: 6500, spread: 0.5, q: 1.5, len: 0.005, peak: 0.045 + 0.055 * p.shatter, vary: 0.6 });
    // the break: a glass ring that sinks in pitch as the card falls
    const br = t + 0.2;
    T.bell(room, br, { f: 2200, partials: glass, drift: 0.62, dur: 0.45, peak: 0.012 + 0.055 * p.shatter, a: 0.001 });
    T.noise(room, br, { filter: 'highpass', f: 3500, to: 2000, q: 0.8, dur: 0.05, peak: 0.03 + 0.068 * p.shatter, a: 0.001 });
    // grey dust sifting down: a band of noise that sinks as far as the fall is long
    T.noise(room, br, { filter: 'bandpass', f: 5500, to: 300, q: 1.1, dur: F, peak: 0.11, a: 0.03, glide: F * 0.9 });
    // shards tinkling off the edge of the card, each lower and quieter than the last
    for (let k = 0; k < 4; k++) {
      const at = br + 0.08 + k * 0.07 + T.rand(0, 0.03);
      T.osc(room, at, { f: T.rand(3200, 5200) * (1 - 0.1 * k), dur: 0.09, peak: 0.016 * p.shatter * (1 - 0.18 * k), a: 0.002 });
    }
    // the card settles: a low thump just as the dust finishes sinking
    T.osc(room, br + F * 0.55, { f: 120, to: 46, dur: 0.2, peak: 0.12 * p.thump, a: 0.004 });
  },
};
