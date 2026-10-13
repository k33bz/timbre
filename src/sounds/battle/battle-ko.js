// A knockout: heavier than a hit, not louder. A short bright crack for the moment of failure, a
// falling body, a smear of lowpassed noise, and a slow sub that carries the weight out (it keeps
// most of its level to the end, then fades), with a dull settle where the fighter lands. The
// extra weight comes from the low end and the length, so the peak stays inside the same range as
// an ordinary hit.
export default {
  id: 'battle-ko',
  name: 'Knockout',
  category: 'battle',
  tags: ['knockout', 'ko', 'faint', 'fallen', 'heavy', 'battle'],
  desc: 'A creature going down: a short crack, a falling body and a slow deep sub, then a dull settle. Heavier than a hit, not louder.',
  dur: 0.8,
  family: 'impact',
  moments: ['knockout'],
  params: {
    weight: { min: 0, max: 1, def: 0.6, desc: 'Heft of the fall: more deep sub and a harder settle, never louder' },
    pitch: { min: 140, max: 300, def: 210, unit: 'Hz', desc: 'Start note of the falling body; lower is bigger' },
    length: { min: 0.25, max: 0.6, def: 0.4, unit: 's', desc: 'How long the deep sub sighs out after the body lands' },
    crack: { min: 0, max: 1, def: 0.6, desc: 'Level of the short bright crack that starts it' },
  },
  play(T, out, t, p) {
    const w = p.weight;
    const f = p.pitch;
    // the moment of failure
    T.noise(out, t, { filter: 'highpass', f: 3400, to: 1300, q: 0.8, dur: 0.045, peak: 0.03 + 0.08 * p.crack, a: 0.002 });
    // the body: a falling tone, a smear of noise, a triangle underneath
    T.osc(out, t, { f, to: f * 0.25, dur: 0.34, peak: 0.14, a: 0.004 });
    T.noise(out, t + 0.012, { filter: 'lowpass', f: 2600, to: 155, q: 1.1, dur: 0.34, peak: 0.105, a: 0.004 });
    T.osc(out, t + 0.05, { type: 'triangle', f: f * 0.71, to: f * 0.28, dur: 0.26, peak: 0.058, a: 0.005 });
    // the slow sub that makes it heavy rather than loud
    T.osc(out, t + 0.07, {
      f: 84 - 20 * w, to: 37 - 7 * w, dur: p.length + 0.1 * w, peak: 0.06 + 0.06 * w, a: 0.014, tail: 0.08, fade: 0.05,
    });
    // the settle: the fighter landing, dull and low
    T.osc(out, t + 0.27, { f: 92, to: 48, dur: 0.14, peak: 0.025 + 0.05 * w, a: 0.004 });
    T.noise(out, t + 0.27, { filter: 'lowpass', f: 600, to: 220, q: 1, dur: 0.08, peak: 0.016 + 0.04 * w, a: 0.004 });
  },
};
