// A heavy stone slab sliding: a low grind of rock on rock and a soft settle at the end. Open is a
// slow grind that ends in a thud; close is shorter and shuts with a firmer knock. Modal and panel
// open and close, and scene transitions.
export default {
  id: 'dark-crypt-open',
  name: 'Crypt Door',
  category: 'dark',
  tags: ['open', 'close', 'transition', 'stone', 'slab', 'door', 'grind', 'crypt', 'dark', 'gothic', 'low'],
  desc: 'A heavy stone slab sliding aside with a low grind and settling with a soft thud, or sliding shut. For opening and closing panels and dialogs, and for moving between screens.',
  dur: 0.65,
  family: 'impact',
  moments: ['open', 'close', 'transition'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 slides the slab open and lets it settle, 0 pushes it shut with a firmer knock' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'How massive the slab is: 0 a light stone lid, 1 a deep, heavy slab' },
    length: { min: 0, max: 1, def: 0.5, desc: 'How long the slab travels before it settles' },
  },
  play(T, out, t, p) {
    const open = p.open >= 0.5;
    const g = (open ? 0.22 : 0.15) + 0.2 * p.length;
    const low = 55 + 30 * (1 - p.weight);
    const gr = open ? [0, 1] : [1, 0];
    T.noise(out, t, { filter: 'lowpass', f: 260 + 160 * gr[0], to: 200 + 160 * gr[1], q: 0.8, dur: g, a: 0.05, r: 0.04, peak: 0.07 + 0.04 * p.weight, hp: 60 });
    T.noise(out, t, { filter: 'bandpass', f: 520, to: 380, q: 1.5, dur: g, a: 0.06, r: 0.05, peak: 0.03, lp: 1200 });
    T.osc(out, t, { type: 'sawtooth', f: low * (open ? 0.9 : 1.1), to: low * (open ? 1.1 : 0.9), dur: g, a: 0.05, r: 0.05, peak: 0.03, lp: 160, vib: { rate: 9, depth: 25 } });
    const s = t + g - 0.02;
    T.osc(out, s, { f: low * 1.6, to: low * 0.8, dur: 0.18, a: 0.004, peak: (open ? 0.07 : 0.08) + 0.04 * p.weight });
    T.noise(out, s, { filter: 'lowpass', f: 400, to: 150, q: 0.7, dur: 0.07, a: 0.002, peak: open ? 0.04 : 0.07 });
  },
};
