// A low padded thock: a falling sine body with a lowpassed noise knock on top. Soft-family click for
// heavy buttons and primary actions.
export default {
  id: 'ui-click-deep',
  name: 'Deep Click',
  category: 'ui',
  tags: ['click', 'button', 'press', 'thock', 'low', 'soft'],
  desc: 'A low, padded thock for heavy buttons and primary actions: a falling sine body with a soft knock on top.',
  dur: 0.16,
  params: {
    pitch: { min: 90, max: 320, def: 165, unit: 'Hz' },
    click: { min: 0, max: 1, def: 0.4 },
    length: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch * 1.6, to: p.pitch * 0.7, dur: 0.05 + 0.1 * p.length, peak: 0.07, a: 0.003 });
    // an octave above the body, so the click still reads on small speakers that cannot play 100 Hz
    T.osc(out, t, { f: p.pitch * 3.2, to: p.pitch * 1.4, dur: 0.03 + 0.04 * p.length, peak: 0.025, a: 0.003 });
    T.noise(out, t, { filter: 'lowpass', f: 1400, to: 500, q: 0.8, dur: 0.02, peak: 0.02 + 0.1 * p.click, a: 0.002 });
  },
};
