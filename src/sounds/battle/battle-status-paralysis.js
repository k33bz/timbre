// The paralyzed condition. Landing: a stiff electric buzz (a low triangle chopped fast) with sharp
// zaps on top. The turn checkup: a halting twitch, three small uneven zaps and a short buzz. Cured:
// the buzz winds down and loosens into a springy pop and a soft bright note.
export default {
  id: 'battle-status-paralysis',
  name: 'Paralyzed',
  category: 'battle',
  tags: ['paralysis', 'paralyzed', 'status', 'condition', 'stun', 'buzz', 'zap', 'shock', 'debuff', 'checkup', 'turn', 'card-game', 'creature'],
  desc: 'The paralyzed condition: a stiff electric buzz with sharp zaps when it lands, a halting twitch at each turn checkup, and a loosening pop when it wears off.',
  dur: 0.45,
  family: 'synthetic',
  moments: ['debuff'],
  params: {
    tick: { min: 0, max: 1, def: 0, step: 1, role: 'tick', desc: '0 plays the buzz and zaps of being paralyzed, 1 the halting twitch at each turn checkup' },
    cure: { min: 0, max: 1, def: 0, step: 1, desc: '1 plays the recovery instead (it wins over tick): the buzz winds down into a springy pop' },
    buzz: { min: 100, max: 260, def: 160, unit: 'Hz', desc: 'Pitch of the buzz: low is a heavy stiff hum, high a thin electric whine' },
    zaps: { min: 1, max: 4, def: 2, step: 1, desc: 'How many sharp zaps ride on the buzz when the condition lands' },
  },
  play(T, out, t, p) {
    const zap = (at, f, level) => T.osc(out, at, { type: 'triangle', f, to: f * 0.25, dur: 0.05, peak: 0.04 * level, a: 0.002 });
    if (p.cure >= 0.5) {
      T.osc(out, t, { type: 'triangle', f: p.buzz, to: p.buzz * 0.5, dur: 0.2, peak: 0.06, a: 0.01, trem: { rate: 30, depth: 0.9 } });
      T.osc(out, t + 0.17, { f: p.buzz * 3, to: p.buzz * 6, dur: 0.09, peak: 0.08, a: 0.004 });
      T.osc(out, t + 0.2, { type: 'triangle', f: p.buzz * 8.2, dur: 0.22, peak: 0.06, a: 0.005 });
    } else if (p.tick >= 0.5) {
      T.osc(out, t, { type: 'triangle', f: p.buzz, to: p.buzz * 0.94, dur: 0.18, peak: 0.04, a: 0.01, trem: { rate: 34, depth: 0.9 } });
      zap(t, 2200, 0.8);
      zap(t + 0.06, 2500, 0.6);
      zap(t + 0.15, 2000, 0.7);
    } else {
      T.osc(out, t, { type: 'triangle', f: p.buzz, to: p.buzz * 0.94, dur: 0.32, peak: 0.05, a: 0.01, trem: { rate: 34, depth: 0.9 } });
      const n = Math.round(p.zaps);
      for (let k = 0; k < n; k++) zap(t + k * 0.12, 2400 - 200 * (k % 2), 1);
      T.noise(out, t, { filter: 'highpass', f: 3000, to: 4200, q: 0.8, dur: 0.08, peak: 0.045, a: 0.002 });
    }
  },
};
