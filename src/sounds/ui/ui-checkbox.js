// Checking plays a rising "tick-ting" pair a fifth apart; unchecking drops a single muted "tup".
// Tonal where the toggle switch is mechanical. The default pitch is A5, on the shared C major pentatonic.
export default {
  id: 'ui-checkbox',
  name: 'Checkbox',
  category: 'ui',
  tags: ['checkbox', 'check', 'uncheck', 'select', 'tick', 'soft'],
  desc: 'A bright two-note pluck when a box is checked and a short muted drop when it is cleared.',
  dur: 0.17,
  family: 'soft',
  moments: ['toggle-on', 'toggle-off'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 plays the rising two-note check, 0 the single muted falling uncheck' },
    pitch: { min: 440, max: 1200, def: 880, unit: 'Hz', desc: 'Base note: the check rises a fifth above it, the uncheck falls from that fifth' },
    bright: { min: 0, max: 1, def: 0.4, desc: 'Check sparkle: 0 pure notes, 1 octave overtones and a crisper tick; uncheck ignores it' },
  },
  play(T, out, t, p) {
    const note = (at, f, level) => {
      T.osc(out, at, { f, dur: 0.1, peak: level, a: 0.002 });
      T.osc(out, at, { f: f * 2, dur: 0.05, peak: level * 0.6 * p.bright, a: 0.002 });
    };
    if (p.on >= 0.5) {
      note(t, p.pitch, 0.04);
      note(t + 0.055, p.pitch * 1.5, 0.05);
      T.noise(out, t, { filter: 'highpass', f: 4500, q: 0.7, dur: 0.01, peak: 0.01 + 0.01 * p.bright, a: 0.002 });
    } else {
      T.osc(out, t, { f: p.pitch * 1.5, to: p.pitch * 0.9, dur: 0.07, peak: 0.04, a: 0.002 });
      T.noise(out, t, { filter: 'lowpass', f: 1800, q: 0.7, dur: 0.012, peak: 0.03, a: 0.002 });
    }
  },
};
