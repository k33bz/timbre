// A toast leaving: a quick falling swipe and a soft pat as it settles out of reach. With drain on,
// three tiny ticks fall away first, like the last of a countdown running out, so an auto-dismiss
// toast says "time is up" before it goes. Quiet by design: dismissals are the most frequent sound
// in a notification stack.
export default {
  id: 'notify-toast-out',
  name: 'Toast Dismiss',
  category: 'notify',
  tags: ['toast', 'dismiss', 'snackbar', 'swipe', 'swipe-away', 'close', 'countdown', 'clear'],
  desc: 'A quick falling swipe and a soft pat for a toast sliding away. With the drain on, a few small ticks run out first, for toasts that dismiss themselves.',
  dur: 0.38,
  family: 'soft',
  moments: ['dismiss'],
  params: {
    speed: { min: 0.9, max: 1.5, def: 1, unit: 'x', desc: 'How fast it goes: 1 a relaxed swipe, higher a flick' },
    drain: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds three falling countdown ticks before the swipe, 0 just swipes away' },
    pat: { min: 0, max: 1, def: 0.5, desc: 'Level of the soft pat at the end: 0 a clean swipe, 1 a clear settle' },
  },
  play(T, out, t, p) {
    const sp = p.speed;
    let at = t;
    if (p.drain >= 0.5) {
      // the countdown running out: each tick a little lower and softer than the last
      for (let n = 0; n < 3; n++) {
        T.tick(out, t + (n * 0.055) / sp, {
          f: 2800 * Math.pow(0.82, n), q: 1.4, dur: 0.01, peak: 0.04 * (1 - 0.2 * n),
          blip: 1100 * Math.pow(0.85, n), blipPeak: 0.045 * (1 - 0.2 * n), blipDur: 0.03,
        });
      }
      at = t + 0.17 / sp;
    }
    // the swipe: a band of air and a faint tone both falling
    T.noise(out, at, { filter: 'bandpass', f: 3800, to: 650, q: 1.1, dur: 0.1 / sp, peak: 0.1, a: 0.012 / sp });
    T.osc(out, at, { f: 1000, to: 420, dur: 0.09 / sp, peak: 0.022, a: 0.01 / sp, glide: 0.08 / sp });
    // the pat: a short muffled thud as it comes to rest
    const land = at + 0.085 / sp;
    T.osc(out, land, { f: 190, to: 110, dur: 0.07, peak: 0.07 * p.pat, a: 0.004, glide: 0.05 });
    T.tick(out, land, { filter: 'lowpass', f: 1500, q: 0.7, dur: 0.012, peak: 0.05 * p.pat });
  },
};
