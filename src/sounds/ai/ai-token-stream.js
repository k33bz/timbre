// Machine text arriving: a run of tiny glassy pips (a short FM tone that settles to a pure sine), each
// a step of a pentatonic scale picked by a random walk, on an uneven beat of quick pairs and small
// pauses. No thump and no noise tap, so it never reads as a person at a keyboard.
export default {
  id: 'ai-token-stream',
  name: 'Token Stream',
  category: 'ai',
  tags: ['ai', 'token', 'tokens', 'stream', 'streaming', 'generate', 'llm', 'output', 'text', 'glass'],
  desc: 'A fast patter of tiny glassy pips on an uneven beat, like a reply streaming in word by word. Machine text, not a keyboard.',
  dur: 1.7,
  family: 'glass',
  moments: ['stream-token'],
  params: {
    tokens: { min: 4, max: 20, def: 12, step: 1, desc: 'How many pips arrive in the burst' },
    rate: { min: 12, max: 32, def: 18, desc: 'Tokens per second: a slow, readable stream up to a rapid flood' },
    pitch: { min: 700, max: 2200, def: 1250, unit: 'Hz', desc: 'Lowest pip of the scale; the rest climb up to two octaves above it' },
    spread: { min: 0, max: 1, def: 0.5, desc: 'How far the pips wander in pitch: 0 all one note, 1 across the whole scale' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.tokens);
    const span = n / p.rate;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const top = Math.round(p.spread * 7);
    // every token draws the same four values, so changing a setting never reshuffles the rest
    const weight = [];
    const idx = [];
    const cents = [];
    const lvl = [];
    let sum = 0;
    let at = Math.min(top, 2);
    for (let k = 0; k < n; k++) {
      const r = T.rand();
      const u = T.rand();
      const walk = T.rand();
      const v = T.rand();
      // most tokens keep an even pace, some arrive in a quick pair, some after a short pause
      const w = r < 0.18 ? 0.35 : r > 0.84 ? 1.9 : 0.75 + 0.5 * u;
      weight.push(w);
      sum += w;
      at = Math.max(0, Math.min(top, at + (walk < 0.3 ? -1 : walk > 0.7 ? 1 : 0)));
      idx.push(at);
      cents.push((u - 0.5) * 24);
      lvl.push(0.75 + 0.25 * v);
    }
    let when = 0;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, scale[idx[k]] / 12 + cents[k] / 1200);
      T.fm(out, t + when, { f, ratio: 3, index: 0.55, index1: 0, dur: 0.04, peak: 0.042 * lvl[k], a: 0.002 });
      when += (weight[k] / sum) * span;
    }
  },
};
