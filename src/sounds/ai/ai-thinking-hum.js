// A calm breath for an assistant that is working: a soft triangle pad (root, fifth and octave, the
// root doubled a few cents apart so the pair beats slowly) that swells in while a lowpass opens,
// then fades back to silence inside one cell. It sits low in the level range on purpose: someone
// may hear it repeat for a minute or more.
export default {
  id: 'ai-thinking-hum',
  name: 'Thinking Hum',
  category: 'ai',
  tags: ['thinking', 'ai', 'agent', 'processing', 'working', 'hum', 'pad', 'calm', 'loop-cell'],
  desc: 'A warm, quiet breath of sound for an assistant that is working: one soft swell that fades to silence. Re-trigger every 1.4 s for as long as it thinks.',
  dur: 1.4,
  family: 'soft',
  moments: ['thinking'],
  params: {
    pitch: { min: 110, max: 330, def: 196, unit: 'Hz', desc: 'Note of the hum, from a low murmur to a lighter voice' },
    depth: { min: 0, max: 1, def: 0.5, desc: 'How deeply it breathes: 0 a quick, steady pad, 1 a long swell that opens up' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Warmth: 0 dark and rounded, 1 a brighter glassy edge' },
  },
  play(T, out, t, p) {
    // a few cents of pitch change per trigger so a long wait does not sound stamped
    const f = T.jitter(p.pitch, { cents: 6 });
    const swell = 0.18 + 0.32 * p.depth;   // time to the top of the breath
    const len = 1.22;                       // the cell is silent from here to the next trigger
    const shape = { a: swell, s: 1, d: 0.05, r: 0.62, dur: len, tail: 0.1, fade: 0.2 };
    const open = f * (2 + 4 * p.tone);
    const lp = T.filter(out, t, { type: 'lowpass', f: open, to: open * (1 + 1.6 * p.depth), dur: swell, q: 0.6 });
    const voice = (type, ratio, peak) => T.osc(lp, t, Object.assign({ type, f: f * ratio, peak }, shape));
    voice('triangle', 1, 0.0155);
    voice('triangle', 1.0035, 0.011);
    voice('sine', 1.5, 0.0078);
    voice('sine', 2, 0.0055);
  },
};
