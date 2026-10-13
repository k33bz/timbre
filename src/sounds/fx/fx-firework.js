// A firework shell: a thin whistle climbing to the top, a bright flash and a round thump at the burst,
// a hiss of falling embers, then a thinning crackle with a few falling glints, all in a big open
// room. Where game-explosion-soft is a cartoon blast, this is the whole shell: climb, burst, fall.
export default {
  id: 'fx-firework',
  name: 'Firework',
  category: 'fx',
  tags: ['firework', 'burst', 'whistle', 'crackle', 'celebrate', 'new-year', 'sky', 'rocket'],
  desc: 'A shell whistles up, bursts with a flash and a thump, then crackles and glitters as the embers fall. For celebrations and finales.',
  dur: 2.0,
  family: 'impact',
  moments: ['victory', 'explosion'],
  params: {
    height: { min: 0.3, max: 0.7, def: 0.45, unit: 's', desc: 'How long the shell whistles upward before it bursts' },
    boom: { min: 0, max: 1, def: 0.6, desc: 'Weight of the burst: 0 a light pop, 1 a deep rolling thump' },
    crackle: { min: 0, max: 1, def: 0.6, desc: 'How much the embers crackle and glitter after the burst, 0 none' },
    space: { min: 0, max: 0.5, def: 0.25, desc: 'How big the night sky sounds, from dry to a wide echoing wash' },
  },
  play(T, out, t, p) {
    const H = p.height;
    const sky = T.reverb(out, t, { time: 0.9, mix: p.space, tone: 0.6 });
    // the climb: a thin rising whistle with a breathy hiss
    T.osc(out, t, { f: 650, to: 2700, dur: H, peak: 0.035, a: 0.05, s: 1, d: 0.01, r: 0.03, vib: { rate: 17, depth: 30 } });
    T.noise(out, t, { filter: 'bandpass', f: 2000, to: 4800, q: 6, dur: H, peak: 0.06, a: 0.08, s: 1, d: 0.01, r: 0.03 });
    // the burst
    const b = t + H;
    T.noise(sky, b, { filter: 'lowpass', f: 3500, to: 180, q: 0.7, dur: 0.45, peak: 0.07 + 0.07 * p.boom, a: 0.003 });
    T.osc(sky, b, { f: 150, to: 42, glide: 0.22, dur: 0.38, peak: 0.015 + 0.07 * p.boom, a: 0.004 });
    T.tick(sky, b, { f: 3600, q: 0.8, dur: 0.03, peak: 0.1, blip: 900, blipTo: 300, blipPeak: 0.06, blipDur: 0.05 });
    // embers: a hiss that blooms and falls, then the crackle
    T.noise(sky, b + 0.02, { filter: 'highpass', f: 3200, to: 6000, q: 0.8, dur: 0.55, peak: 0.05, a: 0.03 });
    if (p.crackle > 0.02) {
      const fall = T.bus(sky, b + 0.08, { a: 0.01, dur: 0.9, tail: 0.03 });
      T.crackle(fall, b + 0.08, { dur: 0.9, rate: 110, f: 4800, to: 2800, q: 0.9, spread: 0.8, len: 0.008, peak: 0.12 * p.crackle, vary: 0.9 });
      const glints = Math.round(3 + 6 * p.crackle);
      for (let k = 0; k < glints; k++) {
        const u = T.rand(0, 1);
        T.bell(sky, b + 0.1 + 0.8 * u, {
          f: T.rand(1800, 4800), partials: [[1, 1, 1], [2.76, 0.3, 0.4]], dur: 0.14, peak: 0.02 * (1 - 0.6 * u), a: 0.002,
        });
      }
    }
  },
};
