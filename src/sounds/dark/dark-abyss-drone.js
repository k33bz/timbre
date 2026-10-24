// The bottom of a well: a double-bass section bowed on one very low note, a flute-stop organ pedal
// and a slow sub swell beneath it, and a thin cold shimmer far overhead, all swelling and sinking
// together in a stone room.
export default {
  id: 'dark-abyss-drone',
  name: 'Abyss Drone',
  category: 'dark',
  tags: ['drone', 'abyss', 'bed', 'bass', 'low', 'sub', 'well', 'dark', 'ominous', 'ambience', 'tension'],
  desc: 'A very low bowed drone with a cold shimmer far above it, swelling and sinking like the bottom of a well. For a menu that broods, a descent into the dark or a quiet threat under a scene.',
  dur: 8.5,
  loop: true,
  family: 'orchestral',
  moments: ['ambience', 'tension'],
  params: {
    depth: { min: 33, max: 55, def: 41, unit: 'Hz', desc: 'Pitch of the drone: low is a rumble you feel, high a heavy hum' },
    darkness: { min: 0, max: 1, def: 0.5, desc: 'How much of the bow and the upper tone you hear: 0 gritty and open, 1 a closed black rumble' },
    shimmer: { min: 0, max: 1, def: 0.5, desc: 'The faint cold glitter high above: 0 none, 1 a thin eerie halo' },
    length: { min: 5, max: 8, def: 7, unit: 's', desc: 'How long the swell lasts' },
  },
  play(T, out, t, p) {
    const f = p.depth;
    const L = p.length;
    const room = T.reverb(out, t, { time: 2.4, mix: 0.28, tone: 0.25 });
    const body = L - 0.4;
    // the higher the note, the more of it the ear takes in: pull the level down above the default
    const m = f > 41 ? Math.pow(41 / f, 1.3) : 1;
    // the swells scale with the length up to its 8 s maximum, then stop growing, so a long render
    // (a seamless loop is cut from one) has a long steady middle
    const swell = { a: Math.min(L * 0.4, 3.2), r: Math.min(L * 0.35, 2.8) };
    // the section: players thicken it, the darkness knob closes a lowpass over it and eases the bow
    const closed = T.filter(room, t, { type: 'lowpass', f: 220 + 2400 * Math.pow(1 - p.darkness, 2), q: 0.5 });
    T.bow(closed, t, Object.assign({ f, dur: body, players: 5, body: 0.6, bright: 0.28 * (1 - p.darkness) + 0.04, pressure: 0.3 * (1 - p.darkness) + 0.05, vib: 4, vibRate: 3.6, peak: 0.1 * m }, swell));
    // the pedal speaks an octave up and carries its own 16' underneath
    T.organ(room, t, { notes: [f * 2], stops: 'flute', dur: body, a: Math.min(L * 0.45, 3.6), r: Math.min(L * 0.35, 2.8), celeste: 3, chiff: 0, peak: 0.05 * m });
    T.osc(room, t, Object.assign({ f, dur: body, peak: 0.06 * m, s: 1, d: 0.02 }, swell, { a: Math.min(L * 0.5, 4) }));
    // the cold shimmer: two thin sines a fifth apart, breathing slowly at different rates
    if (p.shimmer > 0.01) {
      const g = 0.008 * p.shimmer;
      T.osc(room, t + 0.8, { f: f * 61, dur: body - 0.8, peak: g, a: 2.4, s: 1, d: 0.02, r: 2, trem: { rate: 0.31, depth: 0.7 } });
      T.osc(room, t + 1.2, { f: f * 91.5, dur: body - 1.2, peak: g * 0.7, a: 2.2, s: 1, d: 0.02, r: 2, trem: { rate: 0.23, depth: 0.8 } });
    }
  },
};
