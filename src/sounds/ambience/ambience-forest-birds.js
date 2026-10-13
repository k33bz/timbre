// Synthesized birdsong: short sine glides arranged as tweets, rapid warbling trills and long
// whistles, a third of the birds farther off and duller, in a small leafy room over a faint breeze.
export default {
  id: 'ambience-forest-birds',
  name: 'Forest Birds',
  category: 'ambience',
  tags: ['birds', 'birdsong', 'chirp', 'tweet', 'forest', 'morning', 'nature', 'bed'],
  desc: 'Morning birdsong in the trees: tweets, trills and whistles from near and far over a faint breeze.',
  dur: 8,
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's' },
    activity: { min: 0, max: 1, def: 0.5 },
    pitch: { min: 0.7, max: 1.4, def: 1, unit: 'x' },
    trill: { min: 0, max: 1, def: 0.4 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1, L * 0.25);
    const room = T.reverb(out, t, { time: 1.1, mix: 0.22, tone: 0.8 });
    // one chirp: a sine gliding f0 -> f1 with a rounded envelope
    const tw = (at, f0, f1, d, pk) => T.osc(room, t + at, {
      f: f0 * p.pitch, to: f1 * p.pitch, dur: d, peak: pk, a: Math.min(0.012, d * 0.3),
      s: 0.8, d: 0.015, r: d * 0.45, glideCurve: 'lin',
    });
    // the breeze in the leaves
    T.noise(out, t, {
      filter: 'bandpass', f: 700, q: 0.5, dur: L, peak: 0.03, a: fade, s: 1, d: 0.02, r: fade,
    });
    // phrases stop 1.6 s before the end so the room's tail is gone by the last sample
    const n = Math.max(1, Math.round(L * (0.5 + 1.1 * p.activity)));
    for (let k = 0; k < n; k++) {
      const at = T.rand(0.15, L - 1.6);
      const kind = T.rand();
      const base = T.rand(2600, 4200);
      const far = T.rand() < 0.35;
      const lv = (far ? 0.018 : 0.04) * T.rand(0.8, 1);
      if (kind < 0.1 + 0.55 * p.trill) {
        const m = Math.round(T.rand(6, 12));
        for (let j = 0; j < m; j++) {
          const up = j % 2 === 0;
          tw(at + j * 0.055, base * (up ? 1 : 1.12), base * (up ? 1.12 : 0.97), 0.04, lv * 0.8);
        }
      } else if (kind < 0.7) {
        const m = Math.round(T.rand(2, 3));
        for (let j = 0; j < m; j++) tw(at + j * 0.14, base * 0.9, base * 1.25, 0.09, lv);
      } else {
        tw(at, base * 0.75, base * 1.05, 0.2, lv);
        tw(at + 0.2, base * 1.05, base * 0.7, 0.22, lv * 0.9);
      }
    }
  },
};
