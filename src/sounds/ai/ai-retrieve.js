// A search that finds its answer: small glass glints climb a pentatonic scale and crowd closer
// together (the candidates being weighed), then one note rings out as a clear bell (the match), in a
// small bright room.
export default {
  id: 'ai-retrieve',
  name: 'Retrieval Sweep',
  category: 'ai',
  tags: ['ai', 'retrieval', 'search', 'rag', 'vector', 'lookup', 'rerank', 'knowledge', 'glints', 'glass'],
  desc: 'A quick run of rising glassy glints, faster as they climb, that settles on one clear ping. A knowledge lookup finding its match.',
  dur: 1.1,
  family: 'glass',
  moments: ['tool-call'],
  params: {
    glints: { min: 3, max: 10, def: 6, step: 1, desc: 'How many candidates flash by before the match' },
    pitch: { min: 800, max: 2000, def: 1318.51, unit: 'Hz', desc: 'Note of the final ping; the glints climb to it from over an octave below' },
    sweep: { min: 0.25, max: 0.6, def: 0.4, unit: 's', desc: 'Time the glints take to climb before the ping' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.glints);
    const span = p.sweep;
    // semitones below the ping: a major pentatonic ladder, so the glints always agree with it
    const below = [0, -3, -5, -8, -10, -12, -15, -17];
    const room = T.reverb(out, t, { time: 0.4, mix: 0.2, tone: 0.8 });
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const at = t + span * (1 - Math.pow(1 - u, 1.6));   // the gaps shrink as the glints climb
      const i = Math.max(1, Math.min(7, Math.round((1 - u) * 7 + T.rand(-1, 1))));
      const f = p.pitch * Math.pow(2, below[i] / 12);
      T.fm(out, at, { f, ratio: 3, index: 0.6, index1: 0, dur: 0.06, peak: 0.027 + 0.018 * u, a: 0.003 });
    }
    T.bell(room, t + span + 0.05, { f: p.pitch, partials: [[1, 1, 1], [2, 0.3, 0.55], [3, 0.1, 0.3]], dur: 0.42, peak: 0.047, a: 0.003 });
  },
};
