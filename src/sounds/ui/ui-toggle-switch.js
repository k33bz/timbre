// Ported from the Deck Lab padlock "click, clack" (two small struck-metal clicks and a low thock).
// Switching on plays the pair rising, switching off plays it falling.
export default {
  id: 'ui-toggle-switch',
  name: 'Toggle Switch',
  category: 'ui',
  tags: ['toggle', 'switch', 'checkbox', 'on', 'off', 'click', 'mechanical'],
  desc: 'A two-stage click-clack for switches: rising when turned on, falling when turned off.',
  dur: 0.25,
  params: {
    on: { min: 0, max: 1, def: 1, step: 1 },
    pitch: { min: 1200, max: 3600, def: 2600, unit: 'Hz' },
    gap: { min: 0.03, max: 0.12, def: 0.075, unit: 's' },
    body: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const lo = p.pitch * 0.73;
    const up = p.on >= 0.5;
    const click = (f, at, level) => {
      T.bell(out, at, { f, partials: [[1, 1, 1], [2.76, 0.5, 0.67]], drift: 0.98, dur: 0.12, peak: level });
      T.noise(out, at, { filter: 'highpass', f: 4200, to: 3000, q: 0.8, dur: 0.02, peak: level * 0.6, a: 0.001 });
    };
    click(up ? lo : p.pitch, t, 0.024);
    click(up ? p.pitch : lo, t + p.gap, 0.033);
    T.osc(out, t + p.gap, { f: 420, to: 300, dur: 0.06, peak: 0.075 * p.body, a: 0.002 });
  },
};
