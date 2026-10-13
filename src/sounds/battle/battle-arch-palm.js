// A palm slam: a shadow of low noise and a rising hum as something big comes down, then a flat,
// heavy landing. No crack: the sub and the settling dust carry it. Dry of any ring, so it can
// sit under an element strike. Not the heavy game hit (which cracks and drives): this one presses.
export default {
  id: 'battle-arch-palm',
  name: 'Palm Slam',
  category: 'battle',
  tags: ['palm', 'slam', 'crush', 'sub', 'attack', 'battle', 'archetype'],
  desc: 'A big flat hand coming down: a low swell, then a heavy landing with a deep sub and settling dust. No crack, no ring.',
  dur: 0.9,
  family: 'impact',
  params: {
    descent: { min: 0.08, max: 0.35, def: 0.18, unit: 's', desc: 'How long the palm takes to come down; longer is a slower, heavier approach' },
    weight: { min: 0, max: 1, def: 0.6, desc: 'Depth and length of the sub boom: 0 a flat slap, 1 a deep, long press' },
    dust: { min: 0, max: 1, def: 0.5, desc: 'Level and length of the soft noise settling after the slam' },
  },
  play(T, out, t, p) {
    const d = p.descent;
    const w = p.weight;
    const s = t + d;
    // the approach: low noise swelling open over a rising sub, something big coming down
    T.noise(out, t, { filter: 'lowpass', f: 180, to: 900, q: 1.2, dur: d + 0.02, peak: 0.15, a: d * 0.75 });
    T.osc(out, t, { f: 55, to: 80, dur: d + 0.02, peak: 0.07, a: d * 0.7 });
    // the landing: a deep falling sub, a lowpassed body of dust and a dull knock
    T.osc(out, s, { f: 96, to: 34, dur: 0.28 + 0.27 * w, peak: 0.11, a: 0.003 });
    T.noise(out, s, { filter: 'lowpass', f: 1200, to: 120, q: 1.1, dur: 0.15 + 0.3 * p.dust, peak: 0.043 + 0.085 * p.dust, a: 0.004 });
    T.osc(out, s, { type: 'triangle', f: 180, to: 70, dur: 0.2, peak: 0.043, a: 0.003 });
  },
};
