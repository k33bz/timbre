// A second hop in mid-air: a short first sweep, then a higher, faster one. Chip mode is square
// through a bitcrusher; soft mode is triangle with a sine sheen and a puff of air on the flip.
export default {
  id: 'game-double-jump',
  name: 'Double Jump',
  category: 'game',
  tags: ['double-jump', 'jump', 'flip', 'air', 'platformer', '8-bit', 'chiptune', 'retro'],
  desc: 'Two hops in a row, the second higher and quicker, for a mid-air jump. Chip is square; off is soft triangle.',
  dur: 0.34,
  family: 'chip',
  moments: ['jump'],
  params: {
    pitch: { min: 200, max: 500, def: 300, unit: 'Hz', desc: "Starting note of the first hop's sweep; the second hop scales with it" },
    gap: { min: 0.08, max: 0.18, def: 0.11, unit: 's', desc: 'Time between the first hop and the second' },
    lift: { min: 3, max: 12, def: 7, step: 1, unit: 'st', desc: 'How much higher the second hop starts than the first' },
    chip: { min: 0, max: 1, def: 1, step: 1, role: 'chip', desc: '1 a bitcrushed square voice, 0 a soft triangle with a sine sheen and air puff' },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const peak = chip ? 0.06 : 0.08;
    const dest = chip ? T.crush(out, t, { bits: 4, ref: peak * 1.1 }) : out;
    const type = chip ? 'square' : 'triangle';
    const curve = chip ? 'lin' : 'exp';
    // the second hop starts a lift higher than the first and sweeps further
    const f2 = p.pitch * Math.pow(2, Math.round(p.lift) / 12) * 1.25;
    // the first hop ends before the second begins (gap is at least 0.08), so squares never stack
    T.osc(dest, t, { type, f: p.pitch, to: p.pitch * 2, glide: 0.06, glideCurve: curve, dur: 0.075, peak, a: 0.004 });
    T.osc(dest, t + p.gap, {
      type, f: f2, to: f2 * 2.2, glide: 0.1, glideCurve: curve,
      dur: 0.15, peak: peak * 1.1, a: 0.004, s: 0.7, d: 0.04, r: 0.07,
    });
    if (!chip) {
      T.osc(out, t + p.gap, { f: f2 * 2, to: f2 * 4.4, glide: 0.1, dur: 0.13, peak: 0.02, a: 0.004 });
      T.noise(out, t + p.gap, { filter: 'highpass', f: 5000, to: 7000, q: 0.8, dur: 0.06, peak: 0.02, a: 0.01 });
    }
  },
};
