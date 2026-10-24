// One cell of a low cello pulse: short spiccato notes in a repeating rhythm, root and a minor
// second above it, the figure under a chase or a countdown. The cell is four beats long and is
// meant to be re-triggered every cell length (240 / tempo seconds), so the notes end well before
// dur and the cell falls to silence.
export default {
  id: 'dark-tense-ostinato',
  name: 'Tense Ostinato',
  category: 'dark',
  tags: ['loop-cell', 'ostinato', 'cello', 'pulse', 'spiccato', 'chase', 'countdown', 'tension', 'dark', 'rhythm'],
  desc: 'A driving low cello pulse of short bowed notes, 4 beats long: re-trigger every 2 s at the default tempo (240 / bpm seconds). For a chase or a countdown.',
  dur: 2.8,
  family: 'orchestral',
  moments: ['tension'],
  params: {
    tempo: { min: 100, max: 150, def: 120, unit: 'bpm', desc: 'Speed of the pulse; the cell is 4 beats, so it re-triggers every 240 / tempo seconds' },
    pitch: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the pulse' },
    intensity: { min: 0, max: 1, def: 0.5, desc: 'How hard it digs: 0 soft and distant, 1 a biting, busier chase' },
  },
  play(T, out, t, p) {
    const beat = 60 / p.tempo;
    const eighth = beat / 2;
    const root = T.note('C2') * Math.pow(2, p.pitch / 12);
    const room = T.reverb(out, t, { time: 0.7, mix: 0.18, tone: 0.35 });
    // 8 eighths = 4 beats; 1 hits the root, 2 the minor second, 0 rests. Intensity fills the gaps.
    const cell = [1, 0, 1, 1, 0, 1, 1, 2];
    const fill = [0, 1, 0, 0, 1, 0, 0, 0];
    const x = p.intensity;
    for (let k = 0; k < cell.length; k++) {
      let kind = cell[k];
      const half = fill[k];
      if (!kind && half && x > 0.55) kind = 1;
      if (!kind) continue;
      const accent = (k === 0 ? 1.0 : k === 2 ? 0.8 : 0.65) * (0.7 + 0.5 * x);
      T.bow(room, t + k * eighth, {
        f: kind === 2 ? root * Math.pow(2, 1 / 12) : root, dur: 0.16 + 0.04 * (1 - x), a: 0.018 - 0.008 * x, r: 0.05,
        players: 2, body: 0.9, bright: 0.25 + 0.5 * x, pressure: 0.2 + 0.5 * x, vib: 0, peak: 0.125 * accent,
      });
    }
  },
};
