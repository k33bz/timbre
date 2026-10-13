// A race-start beep. Plain mode is a flat-topped tone for the counts (set a different pitch for
// 3, 2 and 1); Go lifts it an octave, stretches it and stacks a fifth over it for the start.
// Chip mode is square through a bitcrusher; off is a sine with a triangle octave.
export default {
  id: 'game-countdown-beep',
  name: 'Countdown Beep',
  category: 'game',
  tags: ['countdown', 'beep', 'timer', 'start', 'go', 'race', 'ready', '8-bit', 'chiptune'],
  desc: 'The beep for 3, 2, 1 in a race or round start; turn Go on for the longer, higher start tone.',
  dur: 0.62,
  family: 'chip',
  moments: ['countdown', 'timer'],
  params: {
    pitch: { min: 440, max: 1320, def: 880, unit: 'Hz', desc: 'Note of the beep; Go plays an octave above it' },
    length: { min: 0.06, max: 0.25, def: 0.14, unit: 's', desc: 'How long the beep holds; Go stretches it further' },
    go: { min: 0, max: 1, def: 0, step: 1, role: 'go', desc: '1 the start tone: octave up, longer, with a fifth, 0 a plain count beep' },
    chip: { min: 0, max: 1, def: 1, step: 1, role: 'chip', desc: '1 a bitcrushed square beep, 0 a clean sine with a soft octave' },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const go = p.go >= 0.5;
    const len = go ? p.length * 2.4 : p.length;
    const f = go ? p.pitch * 2 : p.pitch;
    const peak = (chip ? 0.065 : 0.07) * (go ? 1.15 : 1);
    const dest = chip ? T.crush(out, t, { bits: 5, ref: peak }) : out;
    const type = chip ? 'square' : 'sine';
    // a beep is flat on top with a short release, not a decaying ping
    T.osc(dest, t, { type, f, dur: len, peak, a: 0.003, s: 0.9, d: 0.01, r: len * 0.25 });
    if (go) {
      T.osc(dest, t, { type, f: f * 1.5, dur: len, peak: peak * 0.4, a: 0.003, s: 0.9, d: 0.01, r: len * 0.25 });
    }
    if (!chip) T.osc(out, t, { type: 'triangle', f: f * 2, dur: len * 0.8, peak: 0.02, a: 0.003, s: 0.8, d: 0.01 });
  },
};
