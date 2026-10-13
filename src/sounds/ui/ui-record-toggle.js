// Recording starting and stopping. Start is the camcorder cue: two short blips and a longer, higher
// beep. Stop is one long soft fall, as a tape winds down. Plain sines with a faint octave on top so
// it sits quietly beside the countdown beeps. Soft family.
export default {
  id: 'ui-record-toggle',
  name: 'Record Toggle',
  category: 'ui',
  tags: ['record', 'recording', 'rec', 'mic', 'voice-recorder', 'capture', 'start', 'stop', 'beep', 'soft'],
  desc: 'Two short blips and a longer beep when recording starts, and one long falling tone when it stops.',
  dur: 0.45,
  family: 'soft',
  moments: ['record'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 plays the blip, blip, beep of a start, 0 the long falling tone of a stop' },
    pitch: { min: 440, max: 1100, def: 740, unit: 'Hz', desc: 'Note of the blips; the final beep sits a fifth above and the stop falls from it' },
    length: { min: 0.1, max: 0.22, def: 0.15, unit: 's', desc: 'Length of the final beep on a start; a stop falls for twice as long' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    if (p.on >= 0.5) {
      for (let k = 0; k < 2; k++) {
        T.osc(out, t + k * 0.09, { f, dur: 0.05, peak: 0.036, a: 0.003 });
      }
      T.osc(out, t + 0.18, { f: f * 1.5, dur: p.length, peak: 0.04, a: 0.003, s: 0.9, d: 0.01, r: p.length * 0.3 });
      T.osc(out, t + 0.18, { type: 'triangle', f: f * 3, dur: p.length * 0.7, peak: 0.008, a: 0.003 });
    } else {
      const len = p.length * 2;
      T.osc(out, t, { f: f * 1.5, to: f * 0.5, dur: len, peak: 0.04, a: 0.004, glide: len * 0.9, tail: 0.15 });
      T.osc(out, t, { type: 'triangle', f: f * 3, to: f, dur: len * 0.6, peak: 0.008, a: 0.004 });
    }
  },
};
