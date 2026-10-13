// The asleep condition. Landing: a falling two-note lullaby with a soft breath under it. The turn
// checkup: a slow snore (an in-breath that rasps up, an out-breath that sinks over a low hum).
// Cured: a rising pop and two bright notes as the sleeper jolts awake.
export default {
  id: 'battle-status-sleep',
  name: 'Asleep',
  category: 'battle',
  tags: ['sleep', 'asleep', 'status', 'condition', 'lullaby', 'snore', 'wake', 'debuff', 'checkup', 'turn', 'card-game', 'creature'],
  desc: 'The asleep condition: a falling lullaby when it lands, a slow snore at each turn checkup, and a sudden bright pop when the sleeper wakes.',
  dur: 0.62,
  family: 'soft',
  moments: ['debuff'],
  params: {
    tick: { min: 0, max: 1, def: 0, step: 1, role: 'tick', desc: '0 plays the lullaby of falling asleep, 1 the snore that ticks at each turn checkup' },
    cure: { min: 0, max: 1, def: 0, step: 1, desc: '1 plays the waking instead (it wins over tick): a rising pop into two bright notes' },
    pitch: { min: 520, max: 1050, def: 784, unit: 'Hz', desc: 'The first note of the lullaby; the second falls a fourth below it' },
    breath: { min: 0, max: 1, def: 0.5, desc: 'How much soft breathing runs under the lullaby and the snore: 0 none, 1 airy' },
  },
  play(T, out, t, p) {
    const f0 = p.pitch;
    if (p.cure >= 0.5) {
      T.osc(out, t, { f: f0 * 0.66, to: f0 * 1.33, dur: 0.12, peak: 0.09, a: 0.004 });
      T.osc(out, t + 0.06, { type: 'triangle', f: f0 * 1.68, dur: 0.25, peak: 0.065, a: 0.005 });
      T.osc(out, t + 0.1, { type: 'triangle', f: f0 * 2.52, dur: 0.2, peak: 0.04, a: 0.005 });
    } else if (p.tick >= 0.5) {
      // in-breath rasps up, out-breath sinks; a low hum rides the out-breath
      T.noise(out, t, { filter: 'bandpass', f: 300, to: 520, q: 5, dur: 0.2, peak: 0.1 + 0.12 * p.breath, a: 0.12 });
      T.noise(out, t + 0.2, { filter: 'bandpass', f: 440, to: 280, q: 5, dur: 0.3, peak: 0.12 + 0.12 * p.breath, a: 0.08 });
      T.osc(out, t + 0.18, { f: 110, to: 98, dur: 0.34, peak: 0.04, a: 0.08 });
    } else {
      T.osc(out, t, { type: 'triangle', f: f0, dur: 0.3, peak: 0.07, a: 0.03, vib: { rate: 5, depth: 10 } });
      T.osc(out, t + 0.18, { type: 'triangle', f: f0 * 0.75, dur: 0.43, peak: 0.07, a: 0.04, vib: { rate: 5, depth: 10 } });
      T.noise(out, t, { filter: 'lowpass', f: 700, to: 500, q: 1, dur: 0.5, peak: 0.1 * p.breath, a: 0.2 });
    }
  },
};
