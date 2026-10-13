// A string of characters decoding: a fast shower of short blips at random semitone pitches that
// narrows toward one note as the letters resolve, then the note itself locks in with a glassy ring.
// Pitched square-ish blips converging on a note, unlike the data stream's scattered bitcrushed ticks
// and the AI denoise's cloud of hiss.
export default {
  id: 'fx-scramble-decode',
  name: 'Scramble Decode',
  category: 'fx',
  tags: ['scramble', 'decode', 'decrypt', 'reveal', 'resolve', 'cipher', 'letters', 'text', 'hacker', 'lock'],
  desc: 'A shower of random blips that narrows onto one note and locks in with a glassy ring. For text unscrambling, a redaction lifting or a code being cracked.',
  dur: 1.26,
  family: 'synthetic',
  moments: ['type-out', 'reveal'],
  params: {
    pitch: { min: 440, max: 1760, def: 880, unit: 'Hz', desc: 'The note the scramble settles on' },
    chars: { min: 8, max: 28, def: 16, step: 1, desc: 'How many scrambled characters flicker by: a sparse patter to a dense shower' },
    length: { min: 0.3, max: 0.7, def: 0.5, unit: 's', desc: 'How long the scramble lasts before the note locks' },
    lock: { min: 0, max: 1, def: 0.5, desc: 'How long the final note rings: 0 a quick blip, 1 a long glow' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.chars);
    const step = p.length / n;
    const blip = Math.max(0.014, Math.min(0.03, step * 1.1));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      // random semitones, pulled in toward the note as the letters resolve
      const semi = Math.round(T.rand(-14, 14) * Math.pow(1 - u, 1.4));
      const f = p.pitch * Math.pow(2, semi / 12);
      const at = t + k * step;
      T.pulse(out, at, { duty: 0.35, f, to: f * 1.06, dur: blip, peak: 0.035, a: 0.002, s: 1, d: 0.004, r: 0.01, lp: 4500 });
      if (k % 2 === 0) T.tick(out, at, { f: 6000, q: 1, dur: 0.005, peak: 0.015, jitter: 1 });
    }
    // the lock
    const at = t + p.length;
    const ring = 0.25 + 0.25 * p.lock;
    T.osc(out, at, { type: 'triangle', f: p.pitch, dur: ring, peak: 0.07, a: 0.004 });
    T.bell(out, at, { f: p.pitch * 2, partials: [[1, 1, 1], [3, 0.3, 0.6]], dur: ring + 0.05, peak: 0.03 });
  },
};
