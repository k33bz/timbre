// A soft sine that glides up, then lands on a triangle note with an octave shimmer. Same triangle
// voice as the success chime, so the success family sounds related; the rise says "sent up".
export default {
  id: 'notify-upload-done',
  name: 'Upload Complete',
  category: 'notify',
  tags: ['upload', 'done', 'complete', 'finished', 'rise', 'success', 'cloud'],
  desc: 'A soft upward glide that lands on a bright chime note. The file has arrived.',
  dur: 0.75,
  family: 'glass',
  moments: ['success', 'send'],
  params: {
    pitch: { min: 300, max: 900, def: 523.25, unit: 'Hz', desc: 'Base pitch: the glide rises from below it to a landing note a fifth up' },
    rise: { min: 0.06, max: 0.2, def: 0.12, unit: 's', desc: 'Length of the upward glide, which also delays the landing note' },
    ring: { min: 0.15, max: 0.5, def: 0.3, unit: 's', desc: 'How long the landing note and its shimmer ring out' },
    shimmer: { min: 0, max: 1, def: 0.4, desc: 'Level of the octave sine over the landing note, 0 removes it' },
  },
  play(T, out, t, p) {
    const top = p.pitch * 1.5;
    T.osc(out, t, { f: p.pitch * 0.6, to: top, glide: p.rise, dur: p.rise, peak: 0.05, a: p.rise * 0.5, s: 1, d: 0.01, r: 0.02 });
    const at = t + p.rise;
    T.osc(out, at, { type: 'triangle', f: top, dur: p.ring, peak: 0.105, a: 0.008 });
    T.osc(out, at, { f: top * 2, dur: p.ring * 0.45, peak: 0.05 * p.shimmer, a: 0.008 });
  },
};
