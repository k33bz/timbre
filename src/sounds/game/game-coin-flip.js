// Ported from the Deck Lab coin toss: ticks while it spins, then the settle ping (a sine with one
// inharmonic partial, the struck-metal ratio 2.76).
export default {
  id: 'game-coin-flip',
  name: 'Coin Flip',
  category: 'game',
  tags: ['coin', 'flip', 'toss', 'spin', 'money', 'ping'],
  desc: 'A coin spun into the air: rising ticks as it turns, then a bright ping when it lands.',
  dur: 1.5,
  params: {
    spins: { min: 3, max: 8, def: 6, step: 1 },
    spin: { min: 0.05, max: 0.1, def: 0.075, unit: 's' },
    pitch: { min: 900, max: 2600, def: 1568, unit: 'Hz' },
    ring: { min: 0.15, max: 0.6, def: 0.42, unit: 's' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.spins);
    const base = p.pitch * 0.574;
    for (let k = 0; k < n; k++) {
      T.osc(out, t + k * p.spin, { type: 'triangle', f: base * (1 + 0.078 * k), dur: 0.05, peak: 0.055, a: 0.004 });
    }
    const land = t + n * p.spin + 0.07;
    T.osc(out, land, { f: p.pitch, dur: p.ring, peak: 0.13, a: 0.006 });
    T.osc(out, land, { f: p.pitch * 2.76, to: p.pitch * 2.7, dur: p.ring * 0.38, peak: 0.05, a: 0.006 });
  },
};
