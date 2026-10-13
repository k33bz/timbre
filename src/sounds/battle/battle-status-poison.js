// The poisoned condition as three small moments of one voice. Landing: thick bubbles well up, each a
// short sine blip that rises fast in pitch (the way a real bubble sounds) over a low gurgle. The turn
// checkup: two bubbles pop. Cured: the bubbles speed upward and two clean notes clear the air.
export default {
  id: 'battle-status-poison',
  name: 'Poisoned',
  category: 'battle',
  tags: ['poison', 'poisoned', 'status', 'condition', 'bubble', 'toxic', 'debuff', 'checkup', 'turn', 'card-game', 'creature'],
  desc: 'The poisoned condition: thick bubbles welling up when it lands, a pair of small pops at each turn checkup, and a clear rising run when it is cured.',
  dur: 0.55,
  family: 'organic',
  moments: ['debuff'],
  params: {
    tick: { min: 0, max: 1, def: 0, step: 1, role: 'tick', desc: '0 plays the sound of becoming poisoned, 1 the two small pops that tick at each turn checkup' },
    cure: { min: 0, max: 1, def: 0, step: 1, desc: '1 plays the recovery instead (it wins over tick): the bubbles speed upward into two clean notes' },
    pitch: { min: 180, max: 400, def: 260, unit: 'Hz', desc: 'Where the bubbles start: low is thick sludge, high is thin and quick' },
    bubbles: { min: 2, max: 7, def: 4, step: 1, desc: 'How many bubbles well up when the poison lands' },
  },
  play(T, out, t, p) {
    const f0 = p.pitch;
    const blip = (at, from, to, peak, len) => T.osc(out, at, { f: T.jitter(from, { cents: 60 }), to, dur: len, peak, a: 0.004 });
    if (p.cure >= 0.5) {
      for (let k = 0; k < 4; k++) blip(t + k * 0.05, f0 * (1.5 + 0.25 * k), f0 * (3 + 0.5 * k), 0.05, 0.06);
      T.osc(out, t + 0.2, { type: 'triangle', f: f0 * 4, dur: 0.22, peak: 0.07, a: 0.006 });
      T.osc(out, t + 0.28, { type: 'triangle', f: f0 * 6, dur: 0.26, peak: 0.06, a: 0.006 });
    } else if (p.tick >= 0.5) {
      blip(t, f0 * 1.46, f0 * 3.46, 0.09, 0.05);
      blip(t + 0.09, f0 * 1.15, f0 * 2.92, 0.07, 0.05);
      T.noise(out, t, { filter: 'lowpass', f: 450, to: 320, q: 4, dur: 0.16, peak: 0.16, a: 0.02 });
    } else {
      const n = Math.round(p.bubbles);
      for (let k = 0; k < n; k++) {
        blip(t + k * 0.075 + T.rand(0, 0.012), f0 * (1 + 0.23 * (k % 2)), f0 * (2.38 + 0.31 * k), 0.08, 0.06);
      }
      T.noise(out, t, { filter: 'lowpass', f: 500, to: 350, q: 4, dur: n * 0.075 + 0.08, peak: 0.14, a: 0.04 });
    }
  },
};
