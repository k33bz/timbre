// The burned condition. Landing: a flame catches (a rising swell of noise over a low thump) and
// spits a few crackles. The turn checkup: a short sizzle with three pops. Cured: a long hiss of
// steam and a falling glassy note as the fire goes out.
export default {
  id: 'battle-status-burn',
  name: 'Burned',
  category: 'battle',
  tags: ['burn', 'burned', 'status', 'condition', 'fire', 'flame', 'sizzle', 'steam', 'debuff', 'checkup', 'turn', 'card-game', 'creature'],
  desc: 'The burned condition: a flame catching with a few crackles when it lands, a quick sizzle at each turn checkup, and a hiss of steam when it goes out.',
  dur: 0.45,
  family: 'organic',
  moments: ['debuff'],
  params: {
    tick: { min: 0, max: 1, def: 0, step: 1, role: 'tick', desc: '0 plays the flame catching, 1 the short sizzle that ticks at each turn checkup' },
    cure: { min: 0, max: 1, def: 0, step: 1, desc: '1 plays the recovery instead (it wins over tick): steam hissing as the fire goes out' },
    heat: { min: 0, max: 1, def: 0.5, desc: 'How fierce the fire sounds: 0 low and smoldering, 1 bright and sharp' },
    crackle: { min: 2, max: 8, def: 4, step: 1, desc: 'How many crackles the flame spits when it catches' },
  },
  play(T, out, t, p) {
    const pop = (at, level) => T.noise(out, at + T.rand(0, 0.01), { filter: 'highpass', f: 2200 + 800 * p.heat, to: 2000, q: 0.8, dur: 0.018, peak: 0.07 * level, a: 0.001 });
    if (p.cure >= 0.5) {
      T.noise(out, t, { filter: 'highpass', f: 3600 + 1200 * p.heat, to: 2500, q: 0.8, dur: 0.43, peak: 0.05, a: 0.04 });
      T.osc(out, t, { f: 988, to: 740, dur: 0.25, peak: 0.025, a: 0.01 });
    } else if (p.tick >= 0.5) {
      T.noise(out, t, { filter: 'highpass', f: 3200, to: 6000, q: 0.8, dur: 0.42, peak: 0.045, a: 0.02 });
      pop(t + 0.05, 1);
      pop(t + 0.11, 1);
      pop(t + 0.2, 1);
      T.osc(out, t, { f: 120, to: 60, dur: 0.15, peak: 0.06, a: 0.006 });
    } else {
      T.noise(out, t, { filter: 'bandpass', f: 400, to: 1700 + 1800 * p.heat, q: 0.9, dur: 0.32, peak: 0.14, a: 0.06 });
      T.osc(out, t, { f: 130, to: 70, dur: 0.2, peak: 0.1, a: 0.01 });
      const n = Math.round(p.crackle);
      for (let k = 0; k < n; k++) pop(t + 0.05 + k * 0.045, 1 - 0.05 * k);
    }
  },
};
