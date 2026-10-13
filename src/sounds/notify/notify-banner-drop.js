// A status banner dropping into the top of a page and later pulling back out. Dropping in is a
// weighted slide, a low body that falls with it, and a soft thud as it lands; the tone adds a
// closing touch: nothing for a neutral banner, a low falling bong for an alert, a bright rising
// pair for an all-clear (a resolved incident). Pulling back out is a lighter rising slide and a
// small latch tick, with no thud and no tone.
export default {
  id: 'notify-banner-drop',
  name: 'Banner Drop',
  category: 'notify',
  tags: ['banner', 'status', 'incident', 'resolved', 'all-clear', 'drop', 'slide', 'thud', 'alert'],
  desc: 'A weighted slide and a soft thud for a banner dropping in, with a low bong for an alert or a rising pair for an all-clear. It lifts out with a light slide and a latch tick.',
  dur: 0.57,
  family: 'soft',
  moments: ['notify'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 drops the banner in with a thud and its tone, 0 lifts it out with a light slide and a tick' },
    tone: { min: 0, max: 2, def: 0, step: 1, choices: ['neutral', 'alert', 'all-clear'], desc: 'What the drop ends on: a bare thud, a low bong or a rising resolve (dropping in only)' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the banner: 0 a light card, 1 a heavy slab with a longer slide and a deeper thud' },
  },
  play(T, out, t, p) {
    const tone = Math.round(p.tone);
    if (p.open >= 0.5) {
      const slide = 0.12 + 0.08 * p.weight;                 // the longer, the heavier it feels
      const at = t + slide;
      // the slide: air falling with a low body that drops under it
      T.noise(out, t, { filter: 'bandpass', f: 2200, to: 500, q: 0.8, dur: slide + 0.02, peak: 0.08, a: slide * 0.45 });
      T.osc(out, t, { f: 260, to: 150, dur: slide + 0.02, peak: 0.035, a: slide * 0.4, glide: slide });
      // the landing thud: a body note that sags, deeper and longer with weight, and a dull knock
      const body = 150 - 50 * p.weight;
      T.osc(out, at, { f: body * 1.5, to: body * 0.55, dur: 0.1 + 0.08 * p.weight, peak: 0.085, a: 0.004, glide: 0.06 });
      // a higher knock over the body, so a small speaker still hears the landing
      T.osc(out, at, { type: 'triangle', f: body * 3.2, to: body * 1.4, dur: 0.05, peak: 0.04, a: 0.003, glide: 0.04 });
      T.tick(out, at, { filter: 'lowpass', f: 1600, q: 0.7, dur: 0.015, peak: 0.07 });
      if (tone === 1) {
        // alert: a low bong that sags a semitone, two soft partials above it
        T.bell(out, at + 0.05, { f: 247, drift: 0.94, dur: 0.32, peak: 0.07, a: 0.006, partials: [[1, 1, 1], [2, 0.3, 0.5], [3, 0.1, 0.3]] });
      } else if (tone === 2) {
        // all-clear: a rising fourth, then a glint above the second note
        T.osc(out, at + 0.06, { type: 'triangle', f: 523, dur: 0.12, peak: 0.075, a: 0.008 });
        T.osc(out, at + 0.15, { type: 'triangle', f: 698, dur: 0.22, peak: 0.075, a: 0.008 });
        T.osc(out, at + 0.15, { f: 1397, dur: 0.1, peak: 0.02, a: 0.006 });
      }
    } else {
      // pulling out: the slide rises, lighter, and a small latch tick at the top
      const slide = 0.1 + 0.05 * p.weight;
      T.noise(out, t, { filter: 'bandpass', f: 500, to: 2400, q: 0.8, dur: slide + 0.02, peak: 0.05, a: slide * 0.5 });
      T.osc(out, t, { f: 170, to: 280, dur: slide + 0.02, peak: 0.025, a: slide * 0.4, glide: slide });
      T.tick(out, t + slide, { f: 3200, q: 1.5, dur: 0.01, peak: 0.03, blip: 1300, blipPeak: 0.02, blipDur: 0.02 });
    }
  },
};
