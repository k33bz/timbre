// Two soft knocks: a sine that slides down a little as it dies (the body of the knock), a quiet
// overtone so it carries on small speakers, and a hint of band-passed noise for the wood. Each tap
// is slightly lower and softer than the last.
export default {
  id: 'notify-double-tap',
  name: 'Attention Double Tap',
  category: 'notify',
  tags: ['tap', 'knock', 'double', 'attention', 'nudge', 'soft', 'wood'],
  desc: 'Two soft wooden knocks, each a touch lower and quieter. A gentle "excuse me" that is barely a sound.',
  dur: 0.55,
  family: 'wood',
  moments: ['notify'],
  params: {
    pitch: { min: 200, max: 500, def: 320, unit: 'Hz', desc: 'Body pitch of the first knock; each later knock is a bit lower' },
    gap: { min: 0.07, max: 0.2, def: 0.12, unit: 's', desc: 'Time between knocks, with a slight natural wobble' },
    wood: { min: 0, max: 1, def: 0.5, desc: 'Level of the woody click on each knock: 0 a pure thud, 1 crisp wood' },
    taps: { min: 2, max: 3, def: 2, step: 1, desc: 'Number of knocks, each lower and softer than the last' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.taps);
    let at = t;
    for (let k = 0; k < n; k++) {
      // seeded wobble in timing and pitch, because a person never knocks twice the same way
      const f = p.pitch * Math.pow(0.93, k) * (1 + T.rand(-0.02, 0.02));
      const lv = 1 - 0.15 * k;
      T.osc(out, at, { f: f * 1.6, to: f, glide: 0.035, dur: 0.1, peak: 0.072 * lv, a: 0.004 });
      T.osc(out, at, { f: f * 3, dur: 0.04, peak: 0.018 * lv, a: 0.004 });
      T.noise(out, at, { filter: 'bandpass', f: 1800, q: 1.6, dur: 0.02, peak: 0.072 * p.wood * lv, a: 0.002 });
      at += p.gap * (1 + T.rand(-0.05, 0.05));
    }
  },
};
