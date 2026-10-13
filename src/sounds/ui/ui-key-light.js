// A laptop key: a soft low thump with a muted bandpassed tap on top. Pitch and level wander a few
// percent per press (T.rand) so typing does not sound like one looped sample. `size` runs from a letter
// key to the spacebar. Wood family (a damped knock, no metal).
export default {
  id: 'ui-key-light',
  name: 'Light Keypress',
  category: 'ui',
  tags: ['keypress', 'key', 'typing', 'keyboard', 'type', 'wood'],
  desc: 'A light, quiet keypress for typing: a soft thump and tap that varies a little each press; size reaches the spacebar.',
  dur: 0.08,
  family: 'wood',
  moments: ['type'],
  params: {
    pitch: { min: 140, max: 400, def: 220, unit: 'Hz', desc: 'Tuning of the low thump, varied a little on each press' },
    bright: { min: 0, max: 1, def: 0.4, desc: 'Tone of the tap on top: 0 dull and muted, 1 brighter and clickier' },
    size: { min: 0, max: 1, def: 0, desc: 'Key size: 0 a letter key, 1 a spacebar with a lower, longer, louder thump' },
  },
  play(T, out, t, p) {
    const v = 1 + 0.06 * T.rand(-1, 1);
    const l = 1 + 0.12 * T.rand(-1, 1);
    const f = p.pitch * (1 - 0.3 * p.size) * v;
    T.osc(out, t, { f, to: f * 0.7, dur: 0.04 + 0.03 * p.size, peak: 0.036 * (1 + 0.4 * p.size) * l, a: 0.003 });
    T.noise(out, t, { filter: 'bandpass', f: (1200 + 2000 * p.bright) * v, q: 1.2, dur: 0.02, peak: 0.05 * l, a: 0.002 });
  },
};
