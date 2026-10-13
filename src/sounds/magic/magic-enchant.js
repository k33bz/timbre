// A harp run: plucked strings climbing a pentatonic scale over a soft glowing pad, closing on one
// bell. Where Magic Sparkle twinkles, this one strums.
export default {
  id: 'magic-enchant',
  name: 'Enchant',
  category: 'magic',
  tags: ['enchant', 'imbue', 'infuse', 'harp', 'glissando', 'upgrade', 'blessing'],
  desc: 'A harp-like run of plucked notes over a glowing pad, closing on a bell. For enchanting an item.',
  dur: 1.9,
  params: {
    pitch: { min: 200, max: 600, def: 329.63, unit: 'Hz' },
    notes: { min: 4, max: 8, def: 6, step: 1 },
    speed: { min: 0.04, max: 0.12, def: 0.07, unit: 's' },
    glow: { min: 0, max: 1, def: 0.5 },
    space: { min: 0, max: 0.6, def: 0.35 },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.1, mix: p.space, tone: 0.6 });
    const steps = [0, 2, 4, 7, 9, 12, 14, 16];
    const n = Math.round(p.notes);
    for (let k = 0; k < n; k++) {
      T.pluck(room, t + k * p.speed, { f: p.pitch * Math.pow(2, steps[k] / 12), dur: 0.8, bright: 0.6, peak: 0.07, a: 0.002 });
    }
    // the glow underneath: a fifth and an octave, slowly swelling
    const run = n * p.speed;
    T.osc(room, t, { f: p.pitch * 2, dur: run + 0.7, peak: 0.01 + 0.03 * p.glow, a: 0.15, vib: { rate: 5, depth: 6 } });
    T.osc(room, t, { f: p.pitch * 3, dur: run + 0.7, peak: 0.005 + 0.02 * p.glow, a: 0.2, vib: { rate: 5.5, depth: 6 } });
    // the closing bell, an octave above the last string
    T.bell(room, t + run, { f: p.pitch * Math.pow(2, (steps[n - 1] + 12) / 12), partials: [[1, 1, 1], [2.76, 0.4, 0.5]], dur: 0.8, peak: 0.04 });
  },
};
