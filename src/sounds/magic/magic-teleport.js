// Out and in: a fast rising rush as you vanish, a beat of nothing, then the same rush falling in
// from higher up and a bell where you land. The gap sets how far you went.
export default {
  id: 'magic-teleport',
  name: 'Teleport',
  category: 'magic',
  tags: ['teleport', 'blink', 'warp', 'vanish', 'appear', 'phase', 'travel'],
  desc: 'A vanishing rush upward, a beat of silence, then a soft bell where you reappear.',
  dur: 1.4,
  family: 'synthetic',
  moments: ['teleport'],
  params: {
    pitch: { min: 400, max: 1600, def: 800, unit: 'Hz', desc: 'Start note of the vanishing rush, which shoots up to six times higher' },
    gap: { min: 0.08, max: 0.3, def: 0.16, unit: 's', desc: 'Silence between vanishing and reappearing' },
    reach: { min: 1, max: 2.5, def: 1.5, unit: 'x', desc: 'Raises the arrival rush and landing bell relative to the departure pitch' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Room reverb mix, from dry to roomy' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.9, mix: p.space, tone: 0.7 });
    // vanish: a sine and a highpassed shimmer shooting upward
    T.osc(room, t, { f: p.pitch, to: p.pitch * 6, dur: 0.14, peak: 0.07, a: 0.01, trem: { rate: 40, depth: 0.5 } });
    T.noise(room, t, { filter: 'highpass', f: 3000, to: 9000, q: 0.8, dur: 0.14, peak: 0.07, a: 0.01 });
    // arrive: the rush comes back down, then a bell lands
    const at = t + 0.14 + p.gap;
    const f = p.pitch * p.reach;
    T.osc(room, at, { f: f * 5, to: f, dur: 0.12, peak: 0.05, a: 0.03, trem: { rate: 40, depth: 0.5 } });
    T.noise(room, at, { filter: 'highpass', f: 9000, to: 3000, q: 0.8, dur: 0.12, peak: 0.05, a: 0.03 });
    T.bell(room, at + 0.12, { f: f * 2, partials: [[1, 1, 1], [2.76, 0.4, 0.5], [5.4, 0.2, 0.3]], dur: 0.6, peak: 0.07 });
  },
};
