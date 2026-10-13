// A wooden door: a latch click and knock first, then the creak of the hinge, a sawtooth pulsed fast
// (stick and slip) through a swept bandpass that makes it sound like wood. Creak sets how rough and
// wobbly the hinge is.
export default {
  id: 'game-door-open',
  name: 'Door Open',
  category: 'game',
  tags: ['door', 'open', 'creak', 'hinge', 'latch', 'wood', 'squeak', 'entrance'],
  desc: 'A latch clicks and a wooden hinge creaks open. Use a short length for a quick door, long for a spooky one.',
  dur: 1.1,
  family: 'wood',
  moments: ['door', 'open'],
  params: {
    pitch: { min: 70, max: 260, def: 130, unit: 'Hz', desc: 'Starting note of the hinge creak, which climbs as the door swings' },
    length: { min: 0.4, max: 1.0, def: 0.7, unit: 's', desc: 'How long the hinge creaks as the door swings open' },
    creak: { min: 0, max: 1, def: 0.6, desc: 'Roughness of the hinge: 0 a smoother groan, 1 a juddering, wobbly creak with grit' },
  },
  play(T, out, t, p) {
    // the latch: a bright click then a small knock as it lets go
    T.noise(out, t, { filter: 'highpass', f: 3200, to: 2400, q: 0.8, dur: 0.012, peak: 0.05, a: 0.001 });
    T.noise(out, t + 0.03, { filter: 'bandpass', f: 1400, q: 2, dur: 0.02, peak: 0.05, a: 0.001 });
    T.osc(out, t + 0.03, { f: 160, to: 110, dur: 0.05, peak: 0.03, a: 0.002 });
    // the hinge: the door swings, so the creak climbs and the bandpass opens with it
    const s = t + 0.08;
    const band = T.filter(out, s, { type: 'bandpass', f: 500, to: 900, dur: p.length, q: 3 });
    const f0 = p.pitch * T.rand(0.95, 1.05);
    T.osc(band, s, {
      type: 'sawtooth', f: f0, to: f0 * 1.5, dur: p.length, peak: 0.17, a: 0.08, s: 0.8, d: 0.2, r: p.length * 0.3,
      trem: { rate: 14 + 10 * p.creak, depth: 0.4 + 0.6 * p.creak },
      vib: { rate: 9, depth: 40 + 200 * p.creak },
    });
    // a second hinge a fifth up, shuddering at an unrelated rate, so the stick and slip never lines up
    T.osc(band, s + 0.02, {
      type: 'sawtooth', f: f0 * 1.51, to: f0 * 2.2, dur: p.length - 0.02, peak: 0.1, a: 0.1, s: 0.8, d: 0.2, r: p.length * 0.3,
      trem: { rate: 19 + 13 * p.creak, depth: 0.5 + 0.5 * p.creak },
    });
    T.noise(band, s, { filter: 'none', dur: p.length, peak: 0.08 * p.creak, a: 0.1, s: 0.8, d: 0.2, r: p.length * 0.3 });
  },
};
