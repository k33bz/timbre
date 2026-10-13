// A cast in two beats: a short rising swirl gathers, then a struck-glass bloom opens in a room.
export default {
  id: 'magic-spell-cast',
  name: 'Spell Cast',
  category: 'magic',
  tags: ['spell', 'cast', 'magic', 'conjure', 'wand', 'release', 'bloom'],
  desc: 'Magic gathered and let go: a quick rising swirl, then a bright bell bloom opening in a soft room.',
  dur: 1.5,
  family: 'glass',
  moments: ['spell'],
  params: {
    pitch: { min: 330, max: 1320, def: 659.25, unit: 'Hz', desc: 'Bell bloom note; the swirl rises from an octave below to meet it' },
    gather: { min: 0.1, max: 0.4, def: 0.2, unit: 's', desc: 'Wind-up time of the rising swirl before the bell blooms' },
    bloom: { min: 0, max: 1, def: 0.6, desc: 'Brightness of the bell: adds upper partials and a sparkle of hiss' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Soft room reverb mix, from dry to a lush wash' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.1, mix: p.space, tone: 0.7 });
    const g = p.gather;
    const b = p.bloom;
    // the swirl: a bandpassed breath opening upward over a rising triangle
    T.noise(room, t, { filter: 'bandpass', f: 600, to: 5200, q: 1.5, dur: g + 0.03, peak: 0.1, a: g * 0.85 });
    T.osc(room, t, { type: 'triangle', f: p.pitch * 0.5, to: p.pitch, dur: g + 0.03, peak: 0.05, a: g * 0.85 });
    // the bloom: a bell whose upper partials arrive with the bloom amount
    const at = t + g;
    T.bell(room, at, {
      f: p.pitch,
      partials: [[1, 1, 1], [2, 0.3 + 0.3 * b, 0.75], [3.01, 0.3 * b, 0.55], [4.2, 0.2 * b, 0.4], [5.43, 0.12 * b, 0.28]],
      dur: 1.0, peak: 0.065,
    });
    T.noise(room, at, { filter: 'highpass', f: 5000, to: 8000, q: 0.8, dur: 0.14, peak: 0.02 + 0.04 * b, a: 0.004 });
  },
};
