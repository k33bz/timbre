// A breath of air that rises as a menu opens and falls as it closes, ending in a soft landing (open)
// or a small latch tick (close). `size` stretches it from a dropdown to a full side drawer. Air family.
export default {
  id: 'ui-menu-slide',
  name: 'Menu Slide',
  category: 'ui',
  tags: ['menu', 'drawer', 'dropdown', 'sidebar', 'panel', 'open', 'close', 'slide', 'air'],
  desc: 'An airy slide for a menu or drawer opening (rising, soft landing) and closing (falling, latch tick); size runs from dropdown to drawer.',
  dur: 0.34,
  family: 'air',
  moments: ['open', 'close'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 plays the rising open with a soft landing, 0 the falling close with a latch tick' },
    size: { min: 0, max: 1, def: 0.3, desc: 'Slide length, dropdown to drawer; on open also a lower, heavier landing' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Register of the air sweep: 0 darker and lower, 1 brighter and higher' },
  },
  play(T, out, t, p) {
    const open = p.open >= 0.5;
    const len = 0.07 + 0.2 * p.size;
    const lo = 350 + 500 * p.tone;
    const hi = 1400 + 2200 * p.tone;
    T.noise(out, t, {
      filter: 'bandpass', f: open ? lo : hi, to: open ? hi : lo, q: 0.9,
      dur: len + 0.06, a: Math.max(0.01, len * (open ? 0.5 : 0.3)), peak: 0.09,
    });
    const at = t + len * 0.85;
    if (open) {
      T.osc(out, at, { f: 300 - 100 * p.size, to: 200 - 70 * p.size, dur: 0.07, peak: 0.03 + 0.03 * p.size, a: 0.004 });
    } else {
      T.osc(out, at, { f: 700, to: 450, dur: 0.03, peak: 0.03, a: 0.002 });
      T.noise(out, at, { filter: 'highpass', f: 3500, q: 0.8, dur: 0.01, peak: 0.01, a: 0.002 });
    }
  },
};
