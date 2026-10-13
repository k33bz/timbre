// A rocket lifting off: an ignition whump with a crackle of sparks, a shuddering low rumble that
// holds while it burns, a roar that opens up as the rocket climbs (a lowpass sweeping from muffled
// to bright), and then the same roar darkening and fading as it recedes. The rise and the recede are
// two noise voices handing over at the top, so the roar never dips. One of the loudest things in the
// fx set, like the game impacts: it is a big moment.
export default {
  id: 'fx-rocket-launch',
  name: 'Rocket Launch',
  category: 'fx',
  tags: ['rocket', 'launch', 'liftoff', 'ignition', 'roar', 'rumble', 'space', 'blast-off'],
  desc: 'Ignition, a deep rumble and a roar that opens up as a rocket climbs away and fades. For launches, deploys and blast-offs.',
  dur: 1.96,
  family: 'impact',
  moments: ['power-up', 'send'],
  params: {
    length: { min: 1, max: 1.5, def: 1.2, unit: 's', desc: 'How long the engine burns before the rocket is away' },
    power: { min: 0, max: 1, def: 0.6, desc: 'Weight of the engine: 0 a thin hiss, 1 a deep shuddering rumble' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'How far the roar opens up: 0 stays muffled, 1 ends in a hard bright blast' },
    crackle: { min: 0, max: 1, def: 0.5, desc: 'Level of the sparks crackling at ignition and through the roar, 0 none' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const top = 1800 + 2600 * p.bright;
    const clean = T.dcblock(out);
    // ignition: a whump and a puff
    T.noise(clean, t, { filter: 'lowpass', f: 1100, to: 130, q: 0.8, dur: 0.3, peak: 0.16, a: 0.012 });
    T.osc(clean, t, { f: 95, to: 42, dur: 0.32, peak: 0.1, a: 0.01 });
    if (p.crackle > 0.02) {
      T.crackle(clean, t, { dur: 0.5, rate: 150, f: 2400, to: 1100, spread: 0.8, len: 0.007, q: 0.9, peak: 0.08 * p.crackle });
    }
    // the engine rumble: low noise and a growling saw beating at the shake rate
    T.noise(clean, t + 0.05, { filter: 'lowpass', f: 150, to: 250, q: 0.8, dur: L + 0.35, peak: 0.1 + 0.16 * p.power, a: 0.25, s: 1, d: 0.05, r: L * 0.4, tail: 0.01, fade: 0.1 });
    T.osc(clean, t + 0.05, {
      type: 'sawtooth', f: 52, to: 80, glide: L, dur: L + 0.3, peak: 0.01 + 0.05 * p.power, a: 0.25, s: 1, d: 0.05, r: L * 0.4, tail: 0.01, fade: 0.1,
      lp: 420, trem: { rate: 19, depth: 0.5 },
    });
    // the roar climbing, then receding
    T.noise(clean, t + 0.1, { filter: 'lowpass', f: 500, to: top, q: 0.9, glide: L * 0.65, dur: L * 0.7, peak: 0.19, a: L * 0.45, s: 1, d: 0.02, r: L * 0.15 });
    T.noise(clean, t + 0.1 + L * 0.55, { filter: 'lowpass', f: top, to: 260, q: 0.9, dur: L * 0.3 + 0.55, peak: 0.19, a: L * 0.15, tail: 0.01, fade: 0.1 });
    if (p.crackle > 0.02) {
      T.crackle(clean, t + 0.2, { dur: L * 0.9, rate: 200, f: 1000, to: 2800, spread: 1, len: 0.01, q: 0.8, peak: 0.1 * p.crackle });
    }
  },
};
