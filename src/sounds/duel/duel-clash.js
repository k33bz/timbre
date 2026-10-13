// A challenge: the attacker lunges (a short rising rush), the two cards meet in a heavy clunk with
// a short cold ring, and both take a dry grey damage tick at the same instant, one in each ear.
// Shorter, lower and duller than the Sword Clash: this is card stock and glass, not blades.
export default {
  id: 'duel-clash',
  name: 'Duel Clash',
  category: 'duel',
  tags: ['ink-duel', 'challenge', 'clash', 'lunge', 'strike', 'damage', 'counters', 'card', 'hit'],
  desc: 'One card lunging at another: a rush, a heavy clunk with a short cold ring, then two dry damage ticks at once, one on each side.',
  dur: 0.42,
  family: 'impact',
  moments: ['attack', 'hit'],
  params: {
    force: { min: 0, max: 1, def: 0.6, desc: 'Weight of the blow: 0 a light bump, 1 a heavy slam' },
    pitch: { min: 500, max: 1400, def: 880, unit: 'Hz', desc: 'Note of the cold ring after the clunk; the second card rings a third above' },
    damage: { min: 0, max: 1, def: 0.6, desc: 'Level of the two dry damage ticks after the clash, 0 none' },
  },
  play(T, out, t, p) {
    const hit = t + 0.14;
    const ring = [[1, 1, 1], [2.32, 0.6, 0.55], [4.25, 0.35, 0.35], [6.63, 0.15, 0.2]];
    // the lunge: a rush of air that climbs into the contact
    T.noise(out, t, { filter: 'bandpass', f: 500, to: 3200, q: 1.2, dur: 0.15, peak: 0.1, a: 0.1 });
    // the clunk: a low thump, a dull crack and a short bright edge
    T.osc(out, hit, { f: 170, to: 62, dur: 0.12, peak: 0.03 + 0.055 * p.force, a: 0.003 });
    T.noise(out, hit, { filter: 'bandpass', f: 1500, to: 800, q: 1.4, dur: 0.06, peak: 0.065 + 0.045 * p.force, a: 0.001 });
    T.noise(out, hit, { filter: 'highpass', f: 3500, to: 2500, q: 0.8, dur: 0.025, peak: 0.035 + 0.03 * p.force, a: 0.001 });
    // the cold ring: two bodies a third apart, the second a touch later and shorter
    T.bell(out, hit, { f: p.pitch, partials: ring, drift: 0.995, dur: 0.24, peak: 0.02 + 0.016 * p.force, a: 0.001 });
    T.bell(out, hit + 0.006, { f: p.pitch * 1.26, partials: ring, drift: 0.995, dur: 0.2, peak: 0.015 + 0.012 * p.force, a: 0.001 });
    // both cards take their counters at once: a dry tick in each ear
    const l = T.pan(out, hit, { x: -0.7 });
    const r = T.pan(out, hit, { x: 0.7 });
    T.tick(l, hit + 0.09, { f: 2300, q: 2, dur: 0.013, peak: 0.15 * p.damage, blip: 700, blipTo: 520, blipDur: 0.03, blipPeak: 0.045 * p.damage });
    T.tick(r, hit + 0.09, { f: 1850, q: 2, dur: 0.013, peak: 0.15 * p.damage, blip: 620, blipTo: 470, blipDur: 0.03, blipPeak: 0.045 * p.damage });
  },
};
