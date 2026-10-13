// A quest pays out lore: a small gold star arcs up (a faint rising whisper), then lands as a rising
// run of glass chimes, one more note for each point of lore. Lore is always a small golden glass
// chime in Ink Duel: struck glass partials (1, 2.32, 4.25, 6.63) over a faint triangle an octave
// below for warmth.
export default {
  id: 'duel-lore-gain',
  name: 'Lore Gain',
  category: 'duel',
  tags: ['ink-duel', 'lore', 'quest', 'gain', 'chime', 'glass', 'gold', 'star', 'score'],
  desc: 'A small gold star arcing up and landing as a rising run of glass chimes, one more note for each point of lore gained.',
  dur: 0.98,
  family: 'glass',
  moments: ['score'],
  params: {
    lore: { min: 1, max: 4, def: 2, step: 1, desc: 'Lore gained: each point adds one more rising chime to the run' },
    pitch: { min: 880, max: 1760, def: 1174.7, unit: 'Hz', desc: 'First note of the chime run, which climbs from it' },
    shine: { min: 0, max: 1, def: 0.5, desc: 'Sparkle left hanging over the last chime: 0 clean, 1 a glittering tail' },
  },
  play(T, out, t, p) {
    const L = Math.round(p.lore);
    const ladder = [0, 7, 12, 16, 19];
    const glass = [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34], [6.63, 0.09, 0.2]];
    const room = T.reverb(out, t, { time: 0.7, mix: 0.16, tone: 0.75 });
    // the star arcs up toward the meter
    T.noise(room, t, { filter: 'bandpass', f: 2500, to: 7000, q: 1.2, dur: 0.14, peak: 0.03, a: 0.1 });
    T.osc(room, t, { f: p.pitch * 0.8, to: p.pitch * 1.6, dur: 0.14, peak: 0.01, a: 0.1 });
    // the landing: L + 1 chimes climbing the ladder, the last one left to ring
    const start = t + 0.13;
    for (let k = 0; k <= L; k++) {
      const at = start + k * 0.075;
      const f = p.pitch * Math.pow(2, ladder[k] / 12);
      const top = k === L;
      T.bell(room, at, { f, partials: glass, dur: top ? 0.5 : 0.3, peak: top ? 0.068 : 0.054, a: 0.002 });
      T.osc(room, at, { type: 'triangle', f: f / 2, dur: top ? 0.35 : 0.18, peak: 0.012, a: 0.004 });
    }
    T.noise(room, start + L * 0.075, { filter: 'highpass', f: 5500, to: 9000, q: 0.8, dur: 0.35, peak: 0.04 * p.shine, a: 0.02 });
  },
};
