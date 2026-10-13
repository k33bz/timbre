// The Red ink signature, for fast, aggressive cards (rush). Same shape as the other five inks (a
// rising flourish, then a landing at 0.19 s, key of D): a sawtooth and noise riser that charges
// through an opening filter, then a brass-like stab on a power chord with a thump and a crack, and
// a ghost of the dash falling away behind it. Held to the same level as the other five.
export default {
  id: 'duel-ink-red',
  name: 'Red Ink',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'red', 'rush', 'aggressive', 'brass', 'riser', 'card-game'],
  desc: 'The Red ink signature: a charging riser slams into a brassy stab with a thump and a crack, and a dash trail fades behind. For fast, bold cards.',
  dur: 0.85,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Transposes the whole signature: low and menacing, high and urgent' },
    bite: { min: 0, max: 1, def: 0.5, desc: 'Edge of the brass stab: 0 a rounded blat, 1 a bright snarl' },
    punch: { min: 0, max: 1, def: 0.5, desc: 'Weight of the thump and crack that land with the stab' },
    space: { min: 0, max: 0.5, def: 0.2, desc: 'Small room around the signature, from dry to roomy' },
  },
  play(T, out, t, p) {
    const R = 146.83 * p.pitch;
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.45 });
    // the flourish: two detuned saws climb an octave through a filter that opens, over a noise riser
    const rise = T.filter(room, t, { type: 'lowpass', f: 350, to: 3800, dur: 0.18, q: 2 });
    T.osc(rise, t, { type: 'sawtooth', f: R, to: R * 2, glide: 0.18, dur: 0.2, peak: 0.05, a: 0.17 });
    T.osc(rise, t, { type: 'sawtooth', f: R, to: R * 2, glide: 0.18, dur: 0.2, peak: 0.04, a: 0.17, detune: 14 });
    T.noise(room, t, { filter: 'bandpass', f: 600, to: 6000, q: 1.2, dur: 0.2, peak: 0.07, a: 0.17 });
    // the landing at 0.19 s: a stab on a power chord (D, A, D, A), brightest at the start
    const L = t + 0.19;
    const stab = T.filter(room, L, { type: 'lowpass', f: 900 + 2600 * p.bite, to: 700, dur: 0.22, q: 1.2 });
    [1, 1.5, 2, 3].forEach((m, i) => {
      T.osc(stab, L, { type: 'sawtooth', f: R * m, dur: 0.42, peak: 0.021 - 0.0027 * i, a: 0.012, s: 0.6, d: 0.06, r: 0.26 });
      T.osc(stab, L, { type: 'sawtooth', f: R * m, dur: 0.42, peak: 0.0135, a: 0.012, s: 0.6, d: 0.06, r: 0.26, detune: 11 });
    });
    T.osc(room, L, { f: 150, to: 55, dur: 0.12, peak: 0.015 + 0.05 * p.punch, a: 0.003 });
    T.noise(room, L, { filter: 'highpass', f: 2500, q: 0.8, dur: 0.03, peak: 0.008 + 0.045 * p.punch, a: 0.001 });
    // the dash ghost: a band of noise falling away after the stab
    T.noise(room, L + 0.02, { filter: 'bandpass', f: 3500, to: 700, q: 1.3, dur: 0.64, peak: 0.06, a: 0.02 });
  },
};
