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
  family: 'chip',
  moments: ['jump'],
  params: {
    pitch: { min: 180, max: 600, def: 300, unit: 'Hz', desc: 'Starting note of the upward sweep' },
    rise: { min: 1.5, max: 4, def: 2.6, unit: 'x', desc: 'How far the sweep climbs above the start note' },
    length: { min: 0.08, max: 0.26, def: 0.16, unit: 's', desc: 'How long the hop lasts and how slowly it sweeps' },
    chip: { min: 0, max: 1, def: 1, step: 1, role: 'chip', desc: '1 a stepped, bitcrushed square sweep, 0 a soft triangle with a sine octave' },
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
