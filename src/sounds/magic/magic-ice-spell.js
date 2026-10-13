// Struck glass for the freeze (inharmonic partials at glass ratios, not the bell default), a frosty
// hiss, and a falling run of shards in a bright room.
export default {
  id: 'magic-ice-spell',
  name: 'Ice Spell',
  category: 'magic',
  tags: ['ice', 'frost', 'freeze', 'crystal', 'glass', 'shatter', 'spell'],
  desc: 'A crystalline freeze: a glassy ring over a frosty hiss, then icy shards tinkling away downward.',
  dur: 1.4,
  family: 'glass',
  moments: ['spell'],
  params: {
    pitch: { min: 1200, max: 3600, def: 2200, unit: 'Hz', desc: 'Glass ring note; the shards start an octave above and fall below it' },
    shards: { min: 3, max: 9, def: 6, step: 1, desc: 'How many icy shards tinkle down after the ring' },
    frost: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the frosty high hiss under the glass' },
    space: { min: 0, max: 0.6, def: 0.35, desc: 'Bright room reverb mix, from dry to a glittering wash' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.0, mix: p.space, tone: 0.9 });
    // the freeze: frost breathes in while the glass rings
    T.noise(room, t, { filter: 'highpass', f: 6500, to: 4500, q: 0.8, dur: 0.55, peak: 0.01 + 0.07 * p.frost, a: 0.1 });
    T.bell(room, t, {
      f: p.pitch,
      partials: [[1, 1, 1], [2.32, 0.6, 0.6], [3.87, 0.4, 0.5], [5.9, 0.25, 0.35], [8.1, 0.12, 0.2]],
      dur: 1.0, peak: 0.055, a: 0.006,
    });
    // the shards: a pentatonic fall, each a tiny struck bell, loosely spaced
    const steps = [12, 9, 7, 4, 2, 0, -3, -5, -8];
    const n = Math.round(p.shards);
    let at = t + 0.12;
    for (let k = 0; k < n; k++) {
      T.bell(room, at, {
        f: p.pitch * Math.pow(2, steps[k] / 12), partials: [[1, 1, 1], [2.76, 0.4, 0.5]],
        dur: 0.32, peak: 0.04 - 0.002 * k,
      });
      at += T.rand(0.045, 0.09);
    }
  },
};
