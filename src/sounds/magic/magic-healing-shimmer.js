// A soft add9 chord swelling in on slow attacks with a slight vibrato, then a few falling sparkles
// on top, all in a long warm room. The opposite of Magic Sparkle's quick arpeggio: this one blooms.
export default {
  id: 'magic-healing-shimmer',
  name: 'Healing Shimmer',
  category: 'magic',
  tags: ['heal', 'restore', 'shimmer', 'bloom', 'buff', 'blessing', 'glow'],
  desc: 'A warm chord that swells and blooms with a few falling sparkles. For healing, a blessing or a buff.',
  dur: 2.0,
  family: 'synthetic',
  moments: ['heal'],
  params: {
    pitch: { min: 220, max: 880, def: 392, unit: 'Hz', desc: 'Chord root; the falling sparkles are tuned above it' },
    swell: { min: 0.15, max: 0.6, def: 0.35, unit: 's', desc: 'Chord fade-in time: short blooms fast, long swells slowly; sparkles start later too' },
    sparkle: { min: 0, max: 1, def: 0.5, desc: 'How many sparkles fall, and how loud the airy hiss under them is' },
    space: { min: 0.1, max: 0.6, def: 0.4, desc: 'Warm room reverb mix, from a light touch to a lush wash' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.4, mix: p.space, tone: 0.6 });
    const chord = [0, 4, 7, 12, 14];
    for (let k = 0; k < chord.length; k++) {
      T.osc(room, t + k * 0.035, {
        type: k < 3 ? 'triangle' : 'sine', f: p.pitch * Math.pow(2, chord[k] / 12), dur: 1.3,
        peak: 0.024, a: p.swell, vib: { rate: 5 + k * 0.4, depth: 5 },
      });
    }
    // sparkles drift down from above the chord
    const steps = [19, 16, 14, 12, 9, 7, 4, 2];
    const n = Math.round(2 + 6 * p.sparkle);
    let at = t + p.swell * 0.7;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, steps[k] / 12) * 2;
      T.osc(room, at, { f, dur: 0.38, peak: 0.028, a: 0.004 });
      T.osc(room, at, { f: f * 2.01, dur: 0.16, peak: 0.008, a: 0.004 });
      at += T.rand(0.05, 0.1);
    }
    T.noise(room, t, { filter: 'highpass', f: 6000, q: 0.8, dur: p.swell + 0.7, peak: 0.004 + 0.02 * p.sparkle, a: p.swell });
  },
};
