// A low bandpassed roar with slow flicker swells, dozens of tiny noise ticks at random pitch and
// level for the crackle (a quarter of them snap twice), and a few low sine knocks for wood settling.
export default {
  id: 'ambience-fire-crackle',
  name: 'Fire Crackle',
  category: 'ambience',
  tags: ['fire', 'crackle', 'campfire', 'fireplace', 'flame', 'wood', 'cozy', 'bed'],
  desc: 'A hearth or campfire: a soft roar of flame with random snaps, pops and the odd log settling.',
  dur: 8,
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's' },
    crackle: { min: 0, max: 1, def: 0.5 },
    roar: { min: 0, max: 1, def: 0.4 },
    tone: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1, L * 0.25);
    const win = (x) => Math.min(1, x / 0.6, (L - x) / 0.8);
    const bright = 0.6 + 1.4 * p.tone;
    // the roar, and a few flicker swells riding on it
    T.noise(out, t, {
      filter: 'bandpass', f: 300, q: 0.6, dur: L, peak: 0.01 + 0.07 * p.roar, a: fade, s: 1, d: 0.02, r: fade,
    });
    const fl = Math.max(2, Math.round(L / 1.6));
    for (let k = 0; k < fl; k++) {
      const at = T.rand(0, L - 1.2);
      T.noise(out, t + at, {
        filter: 'lowpass', f: T.rand(500, 900), to: 250, q: 0.7,
        dur: Math.min(T.rand(1.2, 2), L - at), peak: 0.07 * p.roar * T.rand(0.5, 1), a: 0.5,
      });
    }
    // crackle
    const n = Math.round(L * (3 + 13 * p.crackle));
    for (let k = 0; k < n; k++) {
      const at = T.rand(0.1, L - 0.15);
      const pk = 0.03 * Math.pow(6, T.rand()) * win(at);
      const f = T.rand(1400, 5500) * bright;
      T.noise(out, t + at, { filter: 'bandpass', f, to: f * 0.6, q: T.rand(2, 5), dur: T.rand(0.012, 0.045), peak: pk, a: 0.002 });
      if (T.rand() < 0.25) {
        T.noise(out, t + at + T.rand(0.02, 0.06), { filter: 'bandpass', f: f * 0.8, q: 3, dur: 0.025, peak: pk * 0.5, a: 0.002 });
      }
    }
    // logs settling
    const m = Math.round(L * (0.1 + 0.3 * p.crackle));
    for (let k = 0; k < m; k++) {
      const at = T.rand(0.3, L - 0.4);
      T.osc(out, t + at, { f: T.rand(130, 190), to: 70, dur: 0.08, peak: 0.05 * win(at), a: 0.003 });
      T.noise(out, t + at, { filter: 'lowpass', f: 500, q: 0.8, dur: 0.06, peak: 0.12 * win(at), a: 0.003 });
    }
  },
};
