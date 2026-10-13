// The mirror of upload: a sine that glides down, a soft thump as it lands, the landing note, and a
// small confirming ting a fifth above. Same triangle voice as the success chime.
export default {
  id: 'notify-download-done',
  name: 'Download Complete',
  category: 'notify',
  tags: ['download', 'done', 'complete', 'finished', 'drop', 'success', 'saved'],
  desc: 'A soft downward glide that settles with a gentle thump and a small ting. The file is in place.',
  dur: 0.8,
  family: 'soft',
  moments: ['success'],
  params: {
    pitch: { min: 300, max: 700, def: 440, unit: 'Hz', desc: 'Landing note; the glide starts an octave above it, the ting a fifth up' },
    fall: { min: 0.06, max: 0.2, def: 0.12, unit: 's', desc: 'Length of the downward glide, which also delays the landing' },
    thump: { min: 0, max: 1, def: 0.5, desc: 'Level of the low thump on landing, 0 removes it' },
    ring: { min: 0.15, max: 0.5, def: 0.3, unit: 's', desc: 'How long the landing note and the ting ring out' },
  },
  play(T, out, t, p) {
    const land = t + p.fall;
    T.osc(out, t, { f: p.pitch * 2, to: p.pitch, glide: p.fall, dur: p.fall + 0.02, peak: 0.05, a: p.fall * 0.4, s: 1, d: 0.01, r: 0.02 });
    T.osc(out, land, { f: 150, to: 70, glide: 0.07, dur: 0.1, peak: 0.07 * p.thump, a: 0.004 });
    T.osc(out, land, { type: 'triangle', f: p.pitch, dur: p.ring, peak: 0.085, a: 0.008 });
    T.osc(out, land + 0.09, { f: p.pitch * 1.5, dur: p.ring * 0.6, peak: 0.05, a: 0.01 });
  },
};
