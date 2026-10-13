// Two sine pops, each with a quick upward slide into its pitch (the "bloop" of a bubble), rising a
// fourth. The second is a little louder so the pair leans forward.
export default {
  id: 'notify-message-in',
  name: 'Message Received',
  category: 'notify',
  tags: ['message', 'chat', 'received', 'incoming', 'dm', 'pop', 'bubble'],
  desc: 'Two quick bubbly pops rising a fourth, like a chat bubble arriving. Friendly and short enough for a busy channel.',
  dur: 0.4,
  params: {
    pitch: { min: 400, max: 880, def: 660, unit: 'Hz' },
    interval: { min: 2, max: 7, def: 5, step: 1, unit: 'st' },
    gap: { min: 0.07, max: 0.18, def: 0.11, unit: 's' },
    pop: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    // seeded variation under 1% in pitch and about 1 dB in level, so repeats are not identical
    const j = 1 + T.rand(-0.008, 0.008);
    const v = T.rand(0.9, 1);
    const notes = [[p.pitch * j, 0, 0.8 * v], [p.pitch * j * Math.pow(2, Math.round(p.interval) / 12), p.gap, v]];
    for (let k = 0; k < 2; k++) {
      const f = notes[k][0];
      const at = t + notes[k][1];
      const lv = notes[k][2];
      T.osc(out, at, { f: f * (1 - 0.22 * p.pop), to: f, glide: 0.03, dur: 0.17, peak: 0.085 * lv, a: 0.006 });
      T.osc(out, at, { f: f * 2, dur: 0.07, peak: 0.018 * lv, a: 0.006 });
    }
  },
};
