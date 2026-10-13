// A file drop zone in two moves. Armed (a file is held over it): a soft rising breath, the zone
// opening its mouth. Dropped: a quick falling gulp, a low thunk as the file is swallowed and a small
// pip as it settles. Heavier than the plain drag drop because the zone takes the item in. Soft family.
export default {
  id: 'ui-dropzone',
  name: 'Drop Zone',
  category: 'ui',
  tags: ['dropzone', 'drop-zone', 'upload', 'file', 'drag-over', 'swallow', 'arm', 'drop', 'soft'],
  desc: 'A drop zone for files: a soft rising breath when a file hovers over it, and a gulp, a low thunk and a small settle pip when it lands.',
  dur: 0.31,
  family: 'soft',
  moments: ['drop'],
  params: {
    drop: { min: 0, max: 1, def: 1, step: 1, desc: '1 plays the swallow and settle when the file lands, 0 the rising breath of a file held over the zone' },
    depth: { min: 0, max: 1, def: 0.5, desc: 'How deep the zone swallows: 0 a shallow, higher thunk, 1 a deep, low one' },
    air: { min: 0, max: 1, def: 0.5, desc: 'Level of the breath in the rise and the gulp: 0 faint, 1 clearly airy' },
  },
  play(T, out, t, p) {
    if (p.drop < 0.5) {
      T.noise(out, t, { filter: 'bandpass', f: 500, to: 2400, q: 1.2, dur: 0.2, a: 0.09, peak: 0.04 + 0.08 * p.air });
      T.osc(out, t, { f: 260, to: 390, dur: 0.19, peak: 0.022, a: 0.08 });
      return;
    }
    const base = 210 - 100 * p.depth;
    T.noise(out, t, { filter: 'bandpass', f: 2200, to: 400, q: 1, dur: 0.08, a: 0.012, peak: 0.03 + 0.07 * p.air });
    const at = t + 0.06;
    T.osc(out, at, { f: base * 1.7, to: base * 0.55, dur: 0.1, peak: 0.065, a: 0.003 });
    T.noise(out, at, { filter: 'lowpass', f: 1400, to: 500, q: 0.7, dur: 0.03, peak: 0.04, a: 0.002 });
    T.bell(out, at + 0.1, { f: 880, partials: [[1, 1, 1], [2.76, 0.25, 0.5]], dur: 0.14, peak: 0.026, a: 0.002 });
  },
};
