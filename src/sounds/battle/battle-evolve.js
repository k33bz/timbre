// A transformation: a chord (a note, its fifth and its octave) swells and climbs an octave like a
// column of light, with a shimmer rising over it and a bright ping when it arrives. With up off the
// same chord falls away instead, the shimmer falling with it, ending on a soft low note. The
// ping rings on the top note of the chord, so the rise resolves rather than just stopping.
export default {
  id: 'battle-evolve',
  name: 'Evolve',
  category: 'battle',
  tags: ['evolve', 'transform', 'morph', 'rise', 'light', 'chord', 'devolve', 'battle'],
  desc: 'A creature changing form: a chord swelling up an octave like a column of light and landing on a bright ping. Off, it falls away.',
  dur: 0.95,
  family: 'synthetic',
  moments: ['transform'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 a rising column of light ending in a bright ping, 0 the same falling away to a soft low note' },
    pitch: { min: 220, max: 440, def: 330, unit: 'Hz', desc: 'Base note of the chord, which moves an octave' },
    length: { min: 0.3, max: 0.8, def: 0.5, unit: 's', desc: 'How long the chord takes to rise or fall' },
    shimmer: { min: 0, max: 1, def: 0.5, desc: 'Level of the airy sparkle that rises or falls with the chord, 0 none' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const f = p.pitch;
    if (p.up >= 0.5) {
      T.chord(out, t, { notes: [f, f * 1.5, f * 2], type: 'triangle', bend: 2, dur: L, peak: 0.11, a: L * 0.55, spread: 14 });
      T.noise(out, t, { filter: 'highpass', f: 2000, to: 6000, q: 0.8, dur: L, peak: 0.09 * p.shimmer, a: L * 0.6 });
      // the arrival: a bell on the top note of the chord
      T.bell(out, t + L * 0.82, { f: f * 4, partials: [[1, 1, 1], [2.76, 0.25, 0.5]], dur: 0.28, peak: 0.05, a: 0.006 });
    } else {
      T.chord(out, t, { notes: [f * 2, f * 3, f * 4], type: 'triangle', bend: 0.5, dur: L, peak: 0.11, a: L * 0.12, spread: 14 });
      T.noise(out, t, { filter: 'highpass', f: 6000, to: 2000, q: 0.8, dur: L, peak: 0.09 * p.shimmer, a: L * 0.1 });
      // the landing: a soft low note, the form it settled into
      T.osc(out, t + L * 0.82, { f, to: f * 0.8, dur: 0.26, peak: 0.05, a: 0.01 });
    }
  },
};
