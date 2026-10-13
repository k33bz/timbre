// A gateway tearing open: two resonant noise vortices crossing, a detuned throb underneath, and at
// the moment it opens a deep thump and a shimmering open-fifth chord that rings out in a big room.
export default {
  id: 'magic-portal-open',
  name: 'Portal Open',
  category: 'magic',
  tags: ['portal', 'gateway', 'dimension', 'vortex', 'summon', 'rift', 'open'],
  desc: 'A swirling gateway tears open: a resonant vortex whirls up, then a deep shimmering chord settles.',
  dur: 2.5,
  params: {
    size: { min: 0.5, max: 1.3, def: 0.9, unit: 's' },
    pitch: { min: 80, max: 220, def: 110, unit: 'Hz' },
    swirl: { min: 0, max: 1, def: 0.5 },
    space: { min: 0, max: 0.6, def: 0.4 },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.3, mix: p.space, tone: 0.6 });
    const s = p.size;
    // two narrow, resonant sweeps crossing: the vortex
    T.noise(room, t, { filter: 'bandpass', f: 180, to: 2400, q: 4, dur: s, peak: 0.2 + 0.16 * p.swirl, a: s * 0.8 });
    T.noise(room, t, { filter: 'bandpass', f: 2800, to: 300, q: 4, dur: s, peak: 0.11 + 0.1 * p.swirl, a: s * 0.8 });
    // the throb: two near-unison triangles beating, the swirl amount sets how hard they pulse
    T.osc(room, t, { type: 'triangle', f: p.pitch, to: p.pitch * 1.5, dur: s + 0.5, peak: 0.04, a: s * 0.8, trem: { rate: 3 + 6 * p.swirl, depth: 0.3 + 0.5 * p.swirl } });
    T.osc(room, t, { type: 'triangle', f: p.pitch * 1.007, to: p.pitch * 1.51, dur: s + 0.5, peak: 0.04, a: s * 0.8 });
    // it opens
    const at = t + s * 0.9;
    T.osc(room, at, { f: p.pitch * 2, to: p.pitch * 0.6, dur: 0.45, peak: 0.06, a: 0.01 });
    T.bell(room, at, {
      f: p.pitch * 4, partials: [[1, 1, 1], [1.5, 0.6, 0.9], [2, 0.5, 0.8], [3, 0.3, 0.6], [4.01, 0.15, 0.4]],
      dur: 1.1, peak: 0.035, a: 0.01,
    });
  },
};
