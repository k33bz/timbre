// A blade through the air: a narrow noise band that sweeps up fast, then a thin descending tail as
// it passes, over a faint steel ring. Narrower, shorter and higher than the general whoosh. Edge
// raises the ring.
export default {
  id: 'game-sword-swing',
  name: 'Sword Swing',
  category: 'game',
  tags: ['sword', 'swing', 'slash', 'blade', 'swish', 'melee', 'attack', 'whoosh'],
  desc: 'A blade cutting the air: a quick bright swish with a thin edge of steel. Sharper than the generic whoosh.',
  dur: 0.38,
  family: 'air',
  moments: ['attack'],
  params: {
    length: { min: 0.1, max: 0.3, def: 0.17, unit: 's', desc: 'How long the swish takes; attack and tail stretch together' },
    pitch: { min: 0.6, max: 1.6, def: 1, unit: 'x', desc: 'Shifts the swish bands and the steel ring up or down' },
    edge: { min: 0, max: 1, def: 0.4, desc: 'Level of the thin steel ring under the swish: 0 pure air' },
  },
  play(T, out, t, p) {
    const s = p.length / 0.17;
    T.noise(out, t, {
      filter: 'bandpass', f: 1400 * p.pitch, to: 6200 * p.pitch, q: 2.6,
      dur: 0.14 * s, peak: 0.18, a: 0.045 * s,
    });
    T.noise(out, t + 0.07 * s, {
      filter: 'bandpass', f: 5200 * p.pitch, to: 1800 * p.pitch, q: 3.2,
      dur: 0.1 * s, peak: 0.1, a: 0.02 * s,
    });
    T.osc(out, t + 0.02 * s, {
      f: 3200 * p.pitch, to: 5200 * p.pitch, dur: 0.14 * s, peak: 0.01 * p.edge, a: 0.04 * s,
    });
  },
};
