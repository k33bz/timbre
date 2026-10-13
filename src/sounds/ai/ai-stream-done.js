// The end of a streamed reply: one small low tock as the cursor stops, then a soft glass chime that
// falls a fourth (two sine bells with a faint octave and twelfth), in a small bright room.
export default {
  id: 'ai-stream-done',
  name: 'Stream Done',
  category: 'ai',
  tags: ['ai', 'stream', 'done', 'complete', 'finished', 'reply', 'cursor', 'chime', 'llm', 'glass'],
  desc: 'A small tock as the cursor stops, then a soft two-note glass chime falling to rest. For the end of a streamed reply or a finished generation.',
  dur: 0.8,
  family: 'glass',
  moments: ['load-complete'],
  params: {
    pitch: { min: 700, max: 1400, def: 987.77, unit: 'Hz', desc: 'Note of the first chime; the second falls below it' },
    fall: { min: 2, max: 9, def: 5, step: 1, unit: 'st', desc: 'How far the second note falls: a small sigh to a settled drop' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Air around the chime: 0 dry and close, 1 a soft shimmering room' },
    cursor: { min: 0, max: 1, def: 0.6, desc: 'Level of the small tock as the cursor stops: 0 none, 1 clear' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.5, mix: 0.3 * p.glow, tone: 0.75 });
    // the cursor stops: a low little tock, a sine dropping a fifth
    T.osc(out, t, { f: p.pitch * 0.6, to: p.pitch * 0.4, glide: 0.03, dur: 0.05, peak: 0.04 * p.cursor, a: 0.003 });
    const partials = [[1, 1, 1], [2, 0.2 + 0.15 * p.glow, 0.5], [3, 0.07, 0.3]];
    const lo = p.pitch * Math.pow(2, -Math.round(p.fall) / 12);
    T.bell(room, t + 0.08, { f: p.pitch, partials, dur: 0.4, peak: 0.06, a: 0.004 });
    T.bell(room, t + 0.23, { f: lo, partials, dur: 0.55, peak: 0.065, a: 0.004 });
  },
};
