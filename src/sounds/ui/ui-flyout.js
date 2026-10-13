// A second-level menu stepping out beside its parent: a short bright puff of air and a small pip, much
// smaller and higher than the main menu slide. `depth` climbs a major third per nested level so a
// chain of flyouts walks upward; closing reverses it (a falling puff ending in a soft low tick). Air family.
export default {
  id: 'ui-flyout',
  name: 'Submenu Flyout',
  category: 'ui',
  tags: ['flyout', 'submenu', 'nested', 'context-menu', 'mega-menu', 'open', 'close', 'menu', 'air'],
  desc: 'A short, bright puff and pip for a submenu or nested context menu opening beside its parent; closing falls and ends in a soft tick.',
  dur: 0.11,
  family: 'air',
  moments: ['open', 'close'],
  params: {
    open: { min: 0, max: 1, def: 1, step: 1, role: 'open', desc: '1 plays the rising puff and landing pip, 0 the falling close with a soft low tick' },
    pitch: { min: 600, max: 1500, def: 880, unit: 'Hz', desc: 'Note of the landing pip for the first level' },
    depth: { min: 1, max: 3, def: 1, step: 1, desc: 'How many menus deep: each level lifts the sound a major third and shortens it' },
  },
  play(T, out, t, p) {
    const open = p.open >= 0.5;
    const d = Math.round(p.depth) - 1;
    const lift = Math.pow(2, (4 * d) / 12);
    const f = p.pitch * lift;
    const len = 0.045 - 0.007 * d;
    const lo = 1300 * lift;
    const hi = 3300 * lift;
    T.noise(out, t, {
      filter: 'bandpass', f: open ? lo : hi, to: open ? hi : lo, q: 1.2,
      dur: len + 0.03, a: Math.max(0.01, len * 0.5), peak: 0.07,
    });
    const at = t + len * 0.85;
    if (open) {
      T.osc(out, at, { type: 'triangle', f, to: f * 1.04, dur: 0.055, peak: 0.04, a: 0.002 });
      T.osc(out, at, { f: f * 2, dur: 0.03, peak: 0.01, a: 0.002 });
    } else {
      T.osc(out, at, { type: 'triangle', f: f * 0.7, to: f * 0.55, dur: 0.035, peak: 0.032, a: 0.002 });
      T.noise(out, at, { filter: 'highpass', f: 3500, q: 0.8, dur: 0.01, peak: 0.008, a: 0.002 });
    }
  },
};
