// A strength pump into a sniping shot: the bonus token hops over (a small blip and a landing tick),
// the ally's strength counts up in quick rising blips, then a bow-string twang and a falling zip send
// the challenge, both fighters take a dry damage tick at once and the target breaks like glass.
export default {
  id: 'duel-pump-snipe',
  name: 'Pump and Snipe',
  category: 'duel',
  tags: ['ink-duel', 'support', 'pump', 'strength', 'snipe', 'arrow', 'challenge', 'banish', 'blip', 'crackle'],
  desc: 'A bonus hops to an ally, its strength ticks upward in quick blips, then a twanging shot lands and the target shatters.',
  dur: 1.34,
  family: 'organic',
  moments: ['ability'],
  params: {
    pump: { min: 2, max: 5, def: 4, step: 1, desc: 'How many strength blips count up after the hop' },
    flight: { min: 0.12, max: 0.3, def: 0.2, unit: 's', desc: 'How long the shot zips before it lands; the shatter follows it' },
    shatter: { min: 0, max: 1, def: 0.6, desc: 'How loudly the target breaks: 0 a faint tick, 1 a full glass crackle and fall' },
    pitch: { min: 100, max: 260, def: 150, unit: 'Hz', desc: 'Note of the bow string; the hop and the strength blips are pitched from it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.pump);
    const f0 = p.pitch;
    // the +N token hops from the quester to the ally: a small rising blip and a soft landing tick
    T.osc(out, t, { f: f0 * 3.4, to: f0 * 6.2, dur: 0.085, peak: 0.07, a: 0.004 });
    T.tick(out, t + 0.095, { f: 2400, q: 2, dur: 0.014, peak: 0.055, blip: f0 * 5, blipPeak: 0.022, blipDur: 0.025 });
    // the ally's strength counts up, one whole tone per point
    for (let k = 0; k < n; k++) {
      T.osc(out, t + 0.16 + k * 0.058, { type: 'triangle', f: f0 * 5 * Math.pow(2, (2 * k) / 12), dur: 0.07, peak: 0.072, a: 0.003 });
    }
    // the challenge goes out: a dashed ray of air and the bow
    const a0 = t + 0.2 + n * 0.058 + 0.06;
    T.noise(out, a0 - 0.06, { filter: 'bandpass', f: 700, to: 2600, q: 1.2, dur: 0.1, peak: 0.095, a: 0.05 });
    T.pluck(out, a0, { f: f0, dur: 0.24, bright: 0.75, peak: 0.1 });
    T.osc(out, a0, { f: f0 * 0.9, to: f0 * 0.5, dur: 0.1, peak: 0.04, a: 0.003 });
    T.noise(out, a0 + 0.012, { filter: 'bandpass', f: 5200, to: 1500, q: 2, dur: p.flight, peak: 0.12, a: 0.012 });
    // it lands: both fighters take a dry tick at the same moment, over a small clang
    const hit = a0 + 0.04 + p.flight * 0.8;
    T.tick(out, hit, { f: 1700, q: 2.5, dur: 0.014, peak: 0.12, blip: 260, blipPeak: 0.04, blipDur: 0.03 });
    T.tick(out, hit, { f: 2500, q: 2.5, dur: 0.014, peak: 0.095, blip: 340, blipPeak: 0.027, blipDur: 0.03 });
    T.bell(out, hit, { f: 1150, partials: [[1, 1, 1], [2.76, 0.6, 0.6], [5.4, 0.3, 0.4]], dur: 0.35, peak: 0.04, a: 0.001 });
    // the target breaks: a glass crackle that drifts down, a falling glassy tone and a low thump
    const br = hit + 0.05;
    T.crackle(out, br, { dur: 0.42, rate: 120, f: 6000, to: 2200, spread: 0.5, q: 1.2, len: 0.01, peak: 0.14 * p.shatter + 0.012 });
    T.osc(out, br, { f: 2700, to: 480, dur: 0.45, peak: 0.032 * p.shatter, a: 0.004 });
    T.noise(out, br + 0.05, { filter: 'lowpass', f: 500, to: 130, q: 0.8, dur: 0.4, peak: 0.03 * p.shatter, a: 0.04 });
    T.osc(out, br, { f: 95, to: 48, dur: 0.2, peak: 0.027 + 0.06 * p.shatter, a: 0.004 });
  },
};
