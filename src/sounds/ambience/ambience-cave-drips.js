// Water drops as short sine plinks that jump up in pitch, fed to a generated cave reverb, over a
// low bandpassed breath of cold air. The last drip lands early enough for the room to ring out.
export default {
  id: 'ambience-cave-drips',
  name: 'Cave Drips',
  category: 'ambience',
  tags: ['cave', 'drip', 'water', 'dungeon', 'echo', 'underground', 'damp', 'bed'],
  desc: 'Slow drips falling in a damp stone chamber, each one ringing in the echo, over a low draft of air.',
  dur: 8,
  loop: true,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    drips: { min: 2, max: 10, def: 5, step: 1, desc: 'How many drips fall during the bed' },
    pitch: { min: 0.6, max: 1.6, def: 1, unit: 'x', desc: 'Scales drip pitch: low heavy drops, high small bright ones' },
    cave: { min: 0, max: 1, def: 0.5, desc: 'Chamber echo: 0 shorter and drier, 1 longer and wetter' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const cave = T.reverb(out, t, { time: 1 + 1 * p.cave, mix: 0.35 + 0.45 * p.cave, tone: 0.4, pre: 0.02 });
    T.noise(out, t, {
      filter: 'bandpass', f: 200, q: 1, dur: L, peak: 0.07, a: fade, s: 1, d: 0.02, r: fade,
    });
    const n = Math.round(p.drips);
    const span = Math.max(0.5, L - 0.3 - 1.7);
    for (let k = 0; k < n; k++) {
      const at = 0.3 + ((k + T.rand(0.1, 0.9)) * span) / n;
      const f = T.rand(900, 1500) * p.pitch;
      const pk = 0.055 * T.rand(0.6, 1);
      T.osc(cave, t + at, { f, to: f * T.rand(1.6, 2.2), glide: 0.04, dur: 0.16, peak: pk, a: 0.003 });
      if (T.rand() < 0.3) {
        T.osc(cave, t + at + 0.13, { f: f * 1.1, to: f * 1.9, glide: 0.04, dur: 0.12, peak: pk * 0.4, a: 0.003 });
      }
    }
  },
};
