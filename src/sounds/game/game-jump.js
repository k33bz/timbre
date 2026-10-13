// The platformer hop: one pitch sweep upward. Chip mode is a square wave stepped through a
// bitcrusher (the decay becomes a staircase); with chip off it is a soft triangle with a sine
// octave on top.
export default {
  id: 'game-jump',
  name: 'Jump',
  category: 'game',
  tags: ['jump', 'hop', 'platformer', 'player', '8-bit', 'chiptune', 'retro'],
  desc: 'The classic platformer hop: a quick rising sweep. Chip is a stepped square wave; off is a soft triangle.',
  dur: 0.27,
  params: {
    pitch: { min: 180, max: 600, def: 300, unit: 'Hz' },
    rise: { min: 1.5, max: 4, def: 2.6, unit: 'x' },
    length: { min: 0.08, max: 0.26, def: 0.16, unit: 's' },
    chip: { min: 0, max: 1, def: 1, step: 1 },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const peak = chip ? 0.065 : 0.085;
    // quantize against the voice peak so the decay walks down 8 steps
    const dest = chip ? T.crush(out, t, { bits: 4, ref: peak }) : out;
    const top = p.pitch * p.rise;
    T.osc(dest, t, {
      type: chip ? 'square' : 'triangle', f: p.pitch, to: top,
      glide: p.length * 0.85, glideCurve: chip ? 'lin' : 'exp',
      dur: p.length, peak, a: 0.004, s: 0.75, d: p.length * 0.2, r: p.length * 0.45,
    });
    if (!chip) {
      T.osc(out, t, { f: p.pitch * 2, to: top * 2, glide: p.length * 0.85, dur: p.length, peak: 0.02, a: 0.004 });
    }
  },
};
