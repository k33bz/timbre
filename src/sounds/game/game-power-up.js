// A fast ascending scale run that lands on a held note, the old mushroom-grab shape. Chip mode is
// square notes through a bitcrusher; with chip off it is triangle with a sine octave and a vibrato
// on the last note.
export default {
  id: 'game-power-up',
  name: 'Power Up',
  category: 'game',
  tags: ['power-up', 'powerup', 'upgrade', 'level-up', 'bonus', 'boost', '8-bit', 'chiptune', 'retro'],
  desc: 'A quick rising scale that lands on a held note: you got stronger. Chip is square; off is soft triangle.',
  dur: 0.72,
  params: {
    pitch: { min: 200, max: 600, def: 330, unit: 'Hz' },
    notes: { min: 4, max: 8, def: 6, step: 1 },
    gap: { min: 0.035, max: 0.07, def: 0.05, unit: 's' },
    chip: { min: 0, max: 1, def: 1, step: 1 },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const steps = [0, 2, 4, 7, 9, 12, 14, 16];
    const n = Math.round(p.notes);
    const peak = chip ? 0.08 : 0.1;
    const dest = chip ? T.crush(out, t, { bits: 4, ref: peak }) : out;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      const at = t + k * p.gap;
      if (k < n - 1) {
        // chip notes are flat-topped and cut off, not decaying, so the run reads as a staircase
        if (chip) T.osc(dest, at, { type: 'square', f, dur: p.gap * 1.05, peak, a: 0.003, s: 0.95, d: 0.004, r: 0.006 });
        else T.osc(dest, at, { type: 'triangle', f, dur: p.gap * 1.1, peak, a: 0.003 });
      } else {
        // the held note: flat top, then a release; soft mode also gets a gentle vibrato
        T.osc(dest, at, {
          type: chip ? 'square' : 'triangle', f, dur: 0.22, peak, a: 0.003, s: 0.7, d: 0.04, r: 0.12,
          vib: chip ? null : { rate: 6, depth: 14 },
        });
        if (!chip) T.osc(out, at, { f: f * 2, dur: 0.18, peak: 0.02, a: 0.004 });
      }
    }
  },
};
