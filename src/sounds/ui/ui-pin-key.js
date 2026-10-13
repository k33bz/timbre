// A keypad key for a PIN pad, numeric keypad or one-time-code cell. Each digit plays the pair of soft
// tones its place on a phone keypad has (the row's low tone with the column's high tone), so the ear
// learns the keys, over a faint low thock of the button. With `done` a small rising two-note
// confirm follows, for the last digit. Soft family; the keys are quiet because a code is typed fast.
export default {
  id: 'ui-pin-key',
  name: 'Keypad Key',
  category: 'ui',
  tags: ['pin', 'keypad', 'numeric', 'otp', 'passcode', 'digit', 'dial', 'key', 'soft'],
  desc: 'A soft two-tone press for a PIN pad or numeric keypad, different for each digit; the last digit can add a small rising confirm.',
  dur: 0.27,
  family: 'soft',
  moments: ['type'],
  params: {
    key: { min: 0, max: 9, def: 5, step: 1, desc: 'Which digit is pressed: each plays its own pair of tones, like a phone keypad' },
    done: { min: 0, max: 1, def: 0, step: 1, desc: '1 adds a rising two-note confirm after the key, 0 the key alone' },
    pitch: { min: -12, max: 5, def: 0, unit: 'st', desc: 'Shifts every tone of the key and the confirm up or down' },
    body: { min: 0, max: 1, def: 0.4, desc: 'Level of the low thock of the button under the tones: 0 bare tones, 1 a firm press' },
  },
  play(T, out, t, p) {
    const k = Math.round(p.key);
    const row = k === 0 ? 3 : Math.floor((k - 1) / 3);
    const col = k === 0 ? 1 : (k - 1) % 3;
    const shift = Math.pow(2, p.pitch / 12);
    T.osc(out, t, { f: [697, 770, 852, 941][row] * shift, dur: 0.055, peak: 0.022, a: 0.003 });
    T.osc(out, t, { f: [1209, 1336, 1477][col] * shift, dur: 0.045, peak: 0.016, a: 0.003 });
    T.osc(out, t, { f: 170, to: 110, dur: 0.035, peak: 0.004 + 0.03 * p.body, a: 0.003 });
    if (p.done >= 0.5) {
      T.bell(out, t + 0.07, { f: 1047 * shift, partials: [[1, 1, 1], [2, 0.2, 0.5]], dur: 0.09, peak: 0.034, a: 0.002 });
      T.bell(out, t + 0.125, { f: 1568 * shift, partials: [[1, 1, 1], [2, 0.2, 0.5]], dur: 0.13, peak: 0.038, a: 0.002 });
    }
  },
};
