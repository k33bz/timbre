// A bright ping that climbs a pentatonic scale with the streak count, so a run of hits plays a
// little tune. Soft mode is a near-harmonic bell; chip mode is a square ping through a bitcrusher.
export default {
  id: 'game-combo-ping',
  name: 'Combo Ping',
  category: 'game',
  tags: ['combo', 'streak', 'chain', 'multiplier', 'ping', 'score', 'hit-streak', 'arcade'],
  desc: 'A short bright ping that rises one scale step per streak count, so a combo plays a rising tune. Chip makes it a square ping.',
  dur: 0.52,
  params: {
    pitch: { min: 500, max: 1400, def: 880, unit: 'Hz' },
    streak: { min: 1, max: 8, def: 1, step: 1 },
    ring: { min: 0.12, max: 0.5, def: 0.26, unit: 's' },
    chip: { min: 0, max: 1, def: 0, step: 1 },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const f = p.pitch * Math.pow(2, scale[Math.round(p.streak) - 1] / 12);
    if (chip) {
      const dest = T.crush(out, t, { bits: 4, ref: 0.07 });
      T.osc(dest, t, { type: 'square', f, dur: p.ring * 0.8, peak: 0.07, a: 0.003 });
      T.osc(out, t, { type: 'triangle', f: f * 2, dur: p.ring * 0.4, peak: 0.02, a: 0.003 });
    } else {
      T.bell(out, t, {
        f, partials: [[1, 1, 1], [2, 0.35, 0.55], [3.01, 0.18, 0.35]], dur: p.ring, peak: 0.07, a: 0.003,
      });
      T.osc(out, t, { f: f * 4, dur: 0.05, peak: 0.012, a: 0.002 });
    }
  },
};
