// A cartoon "ow": a pitch that falls and wobbles, with a short crunch on the first instant. Chip mode
// is a square wave through a bitcrusher; with chip off it is a sawtooth through a closing lowpass,
// closer to a voice. Cartoon-safe on purpose: no gore, no scream.
export default {
  id: 'game-hurt',
  name: 'Hurt',
  category: 'game',
  tags: ['hurt', 'damage', 'ouch', 'hit', 'pain', 'player', '8-bit', 'chiptune', 'retro'],
  desc: 'A falling, wobbling "ow" with a crunch on the hit, for the player taking damage. Chip is square; off is a softer saw.',
  dur: 0.32,
  params: {
    pitch: { min: 150, max: 500, def: 300, unit: 'Hz' },
    drop: { min: 0.3, max: 0.7, def: 0.5 },
    length: { min: 0.12, max: 0.3, def: 0.2, unit: 's' },
    chip: { min: 0, max: 1, def: 1, step: 1 },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const peak = chip ? 0.1 : 0.11;
    let dest = out;
    if (chip) dest = T.crush(out, t, { bits: 4, ref: peak });
    else dest = T.filter(out, t, { type: 'lowpass', f: 2400, to: 700, dur: p.length, q: 1 });
    T.osc(dest, t, {
      type: chip ? 'square' : 'sawtooth', f: p.pitch, to: p.pitch * (1 - p.drop),
      glide: p.length * 0.9, dur: p.length, peak, a: 0.004,
      s: 0.7, d: p.length * 0.25, r: p.length * 0.4, vib: { rate: 24, depth: 120 },
    });
    T.noise(out, t, { filter: 'bandpass', f: 1500, to: 600, q: 1, dur: 0.05, peak: 0.07, a: 0.002 });
  },
};
