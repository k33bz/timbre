// A meter crossing a line, as a pair of pips. The level slides the pair from green to red: a soft
// rising fifth (all clear), the same note twice (amber, take note), then a falling tritone with a
// rough buzz and more weight (red, act). `rising` plays the pair backwards and a touch softer for
// the way back across the line. Red is allowed a little more presence than the other data sounds.
export default {
  id: 'data-threshold',
  name: 'Threshold Cross',
  category: 'data',
  tags: ['threshold', 'gauge', 'meter', 'limit', 'slo', 'quota', 'warning', 'red-zone'],
  desc: 'Two pips as a meter crosses a line: a soft rising pair for green, a repeated note for amber, a rough falling pair for red.',
  dur: 0.27,
  family: 'synthetic',
  moments: ['threshold'],
  params: {
    level: { min: 0, max: 1, def: 0.5, desc: 'How serious the crossing is: 0 green and gentle, 0.5 amber, 1 red, rough and heavier' },
    rising: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 the meter climbs across the line, 0 it falls back across, playing the pair reversed and softer' },
    pitch: { min: 330, max: 880, def: 523, unit: 'Hz', desc: 'Note of the first pip' },
  },
  play(T, out, t, p) {
    const lv = p.level;
    const iv = lv <= 0.5 ? 7 * (1 - lv * 2) : -6 * (lv * 2 - 1);   // semitones from the first pip to the second
    const edge = Math.max(0, (lv - 0.45) / 0.55);                  // 0 through green and amber, 1 at red
    const body = (0.034 + 0.032 * lv) * (p.rising >= 0.5 ? 1 : 0.8);
    const fa = p.pitch;
    const fb = p.pitch * Math.pow(2, iv / 12);
    const pip = (f, at, len) => {
      T.osc(out, at, { type: 'triangle', f, dur: len, peak: body, a: 0.004 });
      // red: a squarer, tremolo-roughened layer on the same note
      T.osc(out, at, { type: 'square', f, dur: len, peak: 0.028 * edge, a: 0.004, lp: 1800, trem: { rate: 30, depth: 0.6 * edge } });
    };
    const first = p.rising >= 0.5 ? fa : fb;
    const second = p.rising >= 0.5 ? fb : fa;
    pip(first, t, 0.07);
    pip(second, t + 0.085, 0.17);
  },
};
