// Picking off the one exerted target: a glass ping and a dashed ray of ticks that speed up as the
// reticle locks on (two dull taps for the ready characters that cannot be hit), then a chain of
// challengers, each a whoosh into a metal strike a step higher with a pair of dry damage ticks, and
// finally the target breaking in a glass crackle and fall.
export default {
  id: 'duel-hunt-chain',
  name: 'Hunt Chain',
  category: 'duel',
  tags: ['ink-duel', 'challenge', 'chain', 'ping', 'lock-on', 'clash', 'banish', 'ticks', 'metal', 'crackle'],
  desc: 'A ping and quickening ticks lock on to one target, then challengers clash into it one after another, each a step higher, until it shatters.',
  dur: 2.07,
  family: 'metal',
  params: {
    hits: { min: 2, max: 4, def: 3, step: 1, desc: 'How many challengers clash into the target before it breaks' },
    pace: { min: 0.14, max: 0.28, def: 0.2, unit: 's', desc: 'Time between clashes: low a rapid chain, high a deliberate one' },
    pitch: { min: 700, max: 1800, def: 1100, unit: 'Hz', desc: 'Note of the first clash; each later clash rings a step higher' },
    shatter: { min: 0, max: 1, def: 0.6, desc: 'How loudly the target breaks at the end: 0 a faint tick, 1 a full crackle and fall' },
  },
  play(T, out, t, p) {
    const hits = Math.round(p.hits);
    // the action pings the exerted target: a bright glass ping and a quick zip of ray
    T.bell(out, t, { f: 2600, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.3, peak: 0.035, a: 0.002 });
    T.noise(out, t, { filter: 'bandpass', f: 1800, to: 6000, q: 2, dur: 0.07, peak: 0.04, a: 0.01 });
    // the two ready characters cannot be touched: dull, closed taps
    for (let k = 0; k < 2; k++) {
      T.osc(out, t + 0.09 + k * 0.08, { type: 'triangle', f: 170 - 20 * k, to: 110, dur: 0.05, peak: 0.03, a: 0.003 });
    }
    // the reticle locks on: dry ticks that speed up, then a small bright click
    const lock = [0.14, 0.25, 0.34, 0.41, 0.46];
    for (let k = 0; k < lock.length; k++) {
      T.tick(out, t + lock[k], { f: 2200 + 180 * k, q: 3, dur: 0.012, peak: 0.05, blip: 1300 + 110 * k, blipPeak: 0.014, blipDur: 0.02 });
    }
    T.osc(out, t + 0.5, { f: 1900, dur: 0.05, peak: 0.02, a: 0.003 });
    // the chain: each attacker whooshes in and strikes, a step higher, then two damage ticks land
    const metal = [[1, 1, 1], [2.76, 0.7, 0.7], [5.4, 0.45, 0.45], [8.93, 0.25, 0.25]];
    const c0 = t + 0.64;
    for (let k = 0; k < hits; k++) {
      const at = c0 + k * p.pace;
      const f = p.pitch * Math.pow(2, (2 * k) / 12);
      const lift = 0.9 + 0.1 * k;
      T.noise(out, at - 0.1, { filter: 'bandpass', f: 400 + 120 * k, to: 2600, q: 1.2, dur: 0.1, peak: 0.1, a: 0.06 });
      T.bell(out, at, { f, partials: metal, drift: 0.995, dur: 0.38, peak: 0.02 * lift, a: 0.001 });
      T.bell(out, at + 0.007, { f: f * 1.19, partials: metal, drift: 0.995, dur: 0.3, peak: 0.016 * lift, a: 0.001 });
      T.noise(out, at, { filter: 'highpass', f: 3500, to: 2500, q: 0.8, dur: 0.03, peak: 0.07 * lift, a: 0.001 });
      T.noise(out, at, { filter: 'bandpass', f: 1800, to: 1000, q: 1.5, dur: 0.06, peak: 0.08 * lift, a: 0.001 });
      for (let j = 0; j < 2; j++) {
        T.tick(out, at + 0.06 + j * 0.05, { f: 1600 + 300 * j, q: 2.5, dur: 0.012, peak: 0.045, blip: 240, blipPeak: 0.016, blipDur: 0.025 });
      }
    }
    // eight pips and it is gone: a glass crackle and fall with a low thump
    const b = c0 + (hits - 1) * p.pace + 0.2;
    T.crackle(out, b, { dur: 0.36, rate: 130, f: 6000, to: 2100, spread: 0.5, q: 1.2, len: 0.01, peak: 0.02 + 0.18 * p.shatter });
    T.osc(out, b, { f: 2700, to: 470, dur: 0.38, peak: 0.006 + 0.034 * p.shatter, a: 0.004 });
    T.osc(out, b + 0.02, { f: 3500, to: 720, dur: 0.3, peak: 0.003 + 0.016 * p.shatter, a: 0.004 });
    T.osc(out, b, { f: 100, to: 46, dur: 0.24, peak: 0.02 + 0.06 * p.shatter, a: 0.004 });
  },
};
