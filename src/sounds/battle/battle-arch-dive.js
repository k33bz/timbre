// A plunging dive: a thin whistle that falls fast over a rush of air, a dull landing, and up to
// three small airy taps that follow it. Dry (no ring, no sparkle) so it can sit under an element
// strike; the wisps are the same strike reaching a few places at once.
export default {
  id: 'battle-arch-dive',
  name: 'Plunging Dive',
  category: 'battle',
  tags: ['dive', 'plunge', 'whistle', 'dart', 'strike', 'attack', 'battle', 'archetype'],
  desc: 'A fast plunging dive: a falling whistle, a dull landing and optional small airy taps after it. Dry, so it stacks under any element.',
  dur: 0.9,
  moments: ['attack', 'hit'],
  family: 'air',
  params: {
    drop: { min: 0.15, max: 0.5, def: 0.28, unit: 's', desc: 'Length of the plunge before it lands; longer is a slower, higher dive' },
    pitch: { min: 900, max: 2200, def: 1500, unit: 'Hz', desc: 'Start note of the falling whistle' },
    wisps: { min: 0, max: 3, def: 1, step: 1, desc: 'How many small airy taps follow the landing, 0 none' },
  },
  play(T, out, t, p) {
    const d = p.drop;
    const h = t + d;
    // the plunge: a whistle falling to a fifth of its start, wobbling a little, over rushing air
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.21, dur: d, peak: 0.06, a: 0.05, vib: { rate: 7, depth: 30 } });
    T.noise(out, t, { filter: 'bandpass', f: 3400, to: 600, q: 1.3, dur: d, peak: 0.14, a: 0.08 });
    // the landing: a falling body, a short mid knock and a burst of air
    T.osc(out, h, { f: 150, to: 55, dur: 0.22, peak: 0.11, a: 0.004 });
    T.osc(out, h, { type: 'triangle', f: 392, to: 262, dur: 0.1, peak: 0.035, a: 0.004 });
    T.noise(out, h, { filter: 'bandpass', f: 2600, to: 700, q: 1.6, dur: 0.12, peak: 0.085, a: 0.004 });
    // wisps: each a short rising puff of air ending in a tiny pop, a little softer than the last
    for (let k = 0; k < Math.round(p.wisps); k++) {
      const at = h + 0.07 + k * 0.085;
      const l = 1 - 0.2 * k;
      T.noise(out, at, { filter: 'bandpass', f: T.jitter(1800, { cents: 200 }), to: 4200, q: 2, dur: 0.12, peak: 0.07 * l, a: 0.04 });
      T.osc(out, at + 0.05, { f: T.jitter(520, { cents: 150 }), to: 300, dur: 0.07, peak: 0.045 * l, a: 0.004 });
    }
  },
};
