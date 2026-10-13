// A dry mouse-button snap: nearly all transient, gone in about 30 ms. The mechanical-family click.
export default {
  id: 'ui-click-crisp',
  name: 'Crisp Click',
  category: 'ui',
  tags: ['click', 'button', 'press', 'snap', 'mouse', 'mechanical'],
  desc: 'A dry, snappy click for primary buttons: a bandpassed noise transient over a stiff triangle tick, gone in 30 ms.',
  dur: 0.04,
  params: {
    pitch: { min: 1500, max: 4000, def: 2600, unit: 'Hz' },
    snap: { min: 0, max: 1, def: 0.6 },
    body: { min: 0, max: 1, def: 0.35 },
  },
  play(T, out, t, p) {
    T.noise(out, t, { filter: 'bandpass', f: p.pitch * 1.5, to: p.pitch, q: 1.1, dur: 0.018, peak: 0.05 + 0.08 * p.snap, a: 0.002 });
    T.osc(out, t, { type: 'triangle', f: p.pitch * 0.5, to: p.pitch * 0.3, dur: 0.026, peak: 0.012 + 0.04 * p.body, a: 0.002 });
  },
};
