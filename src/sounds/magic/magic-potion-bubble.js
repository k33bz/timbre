// A cauldron: short sine bloops that swoop upward at random pitches and moments, a dull gurgle
// under them, and a few faint glimmers of magic above.
export default {
  id: 'magic-potion-bubble',
  name: 'Potion Bubble',
  category: 'magic',
  tags: ['potion', 'bubble', 'brew', 'cauldron', 'liquid', 'bloop', 'alchemy'],
  desc: 'A bubbling cauldron of glassy bloops with a faint magical glimmer. For potions, brewing and alchemy.',
  dur: 1.6,
  family: 'organic',
  params: {
    bubbles: { min: 3, max: 12, def: 7, step: 1, desc: 'How many bloops rise from the cauldron' },
    pitch: { min: 200, max: 700, def: 380, unit: 'Hz', desc: 'Base bloop pitch, each bubble lands randomly around it; glimmers sit far above' },
    span: { min: 0.4, max: 1.2, def: 0.8, unit: 's', desc: 'Time the bubbling spreads over, and the length of the gurgle bed' },
    glimmer: { min: 0, max: 1, def: 0.5, desc: 'Number and loudness of the faint high magic pings' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.5, mix: 0.15, tone: 0.6 });
    const n = Math.round(p.bubbles);
    for (let k = 0; k < n; k++) {
      const at = t + (k / n) * p.span + T.rand(0, 0.5 * p.span / n);
      const f = p.pitch * T.rand(0.7, 1.8);
      const len = T.rand(0.05, 0.11);
      T.osc(room, at, { f, to: f * 2.2, dur: len, peak: T.rand(0.05, 0.09), a: 0.004 });
      T.osc(room, at, { f: f * 3, to: f * 6.6, dur: len * 0.5, peak: 0.012, a: 0.004 });
    }
    // the gurgle bed
    T.noise(room, t, { filter: 'lowpass', f: 300, to: 220, q: 0.7, dur: p.span + 0.1, peak: 0.1, a: 0.1 });
    // glimmers: high pings above the bubbling
    const g = Math.round(1 + 3 * p.glimmer);
    for (let k = 0; k < g; k++) {
      T.osc(room, t + T.rand(0.05, p.span), { f: p.pitch * T.rand(8, 12), dur: 0.3, peak: 0.005 + 0.022 * p.glimmer, a: 0.004 });
    }
  },
};
