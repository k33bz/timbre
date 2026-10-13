// A short rising major run on square leads, each with a triangle an octave below, the last note
// held a little longer, then a lowpassed echo. Reads as "yes, go" on a title screen or a menu.
export default {
  id: 'music-menu-confirm',
  name: 'Menu Confirm Melody',
  category: 'music',
  tags: ['menu', 'confirm', 'select', 'start', 'melody', '8-bit', 'chiptune', 'stinger'],
  desc: 'Two to four quick rising notes with an echo, for pressing Start or confirming a menu choice.',
  dur: 1.7,
  family: 'chip',
  moments: ['success', 'music'],
  params: {
    key: { min: -5, max: 7, def: 0, step: 1, unit: 'st', desc: 'Transposes the whole melody' },
    notes: { min: 2, max: 4, def: 3, step: 1, desc: 'How many rising notes play, always ending on the high tonic' },
    speed: { min: 0.7, max: 1.6, def: 1, unit: 'x', desc: 'Higher plays the run faster; the final held note keeps its length' },
    echo: { min: 0, max: 1, def: 0.5, desc: 'Level and feedback of the trailing echo: 0 dry, 1 a longer trail' },
  },
  play(T, out, t, p) {
    const n = (name) => T.note(name) * Math.pow(2, p.key / 12);
    const eco = T.delay(out, t, { time: 0.11, fb: 0.2 + 0.3 * p.echo, mix: 0.5 * p.echo, tone: 2500 });
    const gap = 0.075 / p.speed;
    const m = Math.round(p.notes);
    // always end on the tonic: the last m of C E G C
    const run = ['C5', 'E5', 'G5', 'C6'].slice(4 - m);
    for (let k = 0; k < m; k++) {
      const last = k === m - 1;
      const len = last ? 0.26 : gap * 1.3;
      T.osc(eco, t + k * gap, { type: 'square', f: n(run[k]), dur: len, peak: last ? 0.042 : 0.036, a: 0.004, s: 0.7, d: 0.03, r: 0.05 });
      T.osc(eco, t + k * gap, { type: 'triangle', f: n(run[k]) / 2, dur: len, peak: 0.03, a: 0.004, s: 0.7, d: 0.03, r: 0.05 });
    }
  },
};
