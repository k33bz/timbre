// A command palette (Cmd+K) appearing: a quick glide up and a breath of air, landing in a small
// glassy ring. Closing is a short glide back down with no ring. Brighter and snappier than the modal
// swell, since a palette opens and closes many times a day. Glass family.
export default {
  id: 'ui-palette-open',
  name: 'Palette Open',
  category: 'ui',
  tags: ['palette', 'command-palette', 'spotlight', 'search', 'cmd-k', 'open', 'close', 'overlay', 'glass'],
  desc: 'A quick upward glide into a small glassy ring for a command palette or search overlay opening; closing slips back down.',
  dur: 0.25,
  family: 'glass',
  moments: ['open', 'close'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 plays the glide up into the ring, 0 the short glide down with no ring' },
    pitch: { min: 900, max: 2400, def: 1568, unit: 'Hz', desc: 'Note of the glassy ring the glide lands on' },
    ring: { min: 0, max: 1, def: 0.5, desc: 'How long the landing rings: 0 a short pip, 1 a longer glassy ring' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    if (p.open >= 0.5) {
      T.osc(out, t, { f: f * 0.4, to: f * 0.95, dur: 0.06, peak: 0.028, a: 0.01, glide: 0.045, s: 0.85, d: 0.01, r: 0.012 });
      T.noise(out, t, { filter: 'bandpass', f: 1500, to: 5000, q: 0.8, dur: 0.06, a: 0.02, peak: 0.03 });
      T.bell(out, t + 0.045, {
        f, partials: [[1, 1, 1], [2.76, 0.28, 0.5], [5.4, 0.08, 0.3]], dur: 0.06 + 0.13 * p.ring, peak: 0.036, a: 0.002,
      });
    } else {
      T.osc(out, t, { f: f * 0.95, to: f * 0.45, dur: 0.06, peak: 0.026, a: 0.004 });
      T.noise(out, t, { filter: 'bandpass', f: 4200, to: 1300, q: 0.8, dur: 0.06, a: 0.01, peak: 0.025 });
    }
  },
};
