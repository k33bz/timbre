// An arcade "you're up" flourish: a quick upward swoop into a bright arpeggio that lands on a held
// octave with a little vibrato and a sparkle. Brighter and busier than the two soft mallet notes
// of cards-your-turn, and nothing like a flat countdown beep. Chip makes it square and bitcrushed.
export default {
  id: 'game-your-turn',
  name: 'Your Turn Jingle',
  category: 'game',
  tags: ['your-turn', 'your-move', 'turn-start', 'player-up', 'arcade', 'arpeggio', 'flourish', 'chiptune'],
  desc: 'A bright arcade cue for the start of your turn: a swoop up into a quick arpeggio that lands on a held, shimmering octave.',
  dur: 0.7,
  family: 'chip',
  moments: ['your-turn'],
  params: {
    pitch: { min: 392, max: 1047, def: 523.25, unit: 'Hz', desc: 'Root note; the arpeggio climbs to the octave above it' },
    notes: { min: 2, max: 4, def: 3, step: 1, desc: 'Notes in the arpeggio: 2 root and octave, 3 adds the fifth, 4 the third' },
    gap: { min: 0.035, max: 0.09, def: 0.05, unit: 's', desc: 'Time between the arpeggio notes' },
    hold: { min: 0.12, max: 0.35, def: 0.22, unit: 's', desc: 'How long the last, highest note holds' },
    chip: { min: 0, max: 1, def: 0, step: 1, role: 'chip', desc: '1 a bitcrushed square, 0 a bright pulse with a soft octave' },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const steps = [[0, 12], [0, 7, 12], [0, 4, 7, 12]][Math.round(p.notes) - 2];
    const peak = chip ? 0.08 : 0.085;
    const dest = chip ? T.crush(out, t, { bits: 5, ref: 0.1 }) : out;
    const voice = (at, o) => (chip ? T.osc(dest, at, Object.assign({ type: 'square' }, o)) : T.pulse(dest, at, Object.assign({ duty: 0.25 }, o)));
    // the swoop: an octave below the root up into it
    voice(t, { f: p.pitch / 2, to: p.pitch, glide: 0.055, dur: 0.07, peak: peak * 0.5, a: 0.004 });
    let at = t + 0.06;
    for (let k = 0; k < steps.length; k++) {
      const last = k === steps.length - 1;
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      if (last) {
        voice(at, { f, dur: p.hold, peak, a: 0.003, s: 0.75, d: 0.03, r: p.hold * 0.45, vib: { rate: 7, depth: 14 } });
        if (!chip) T.osc(out, at, { type: 'triangle', f: f * 2, dur: p.hold * 0.7, peak: 0.014, a: 0.004 });
        // a sparkle over the landing note
        T.noise(out, at + 0.01, { filter: 'highpass', f: 7000, to: 11000, q: 0.7, dur: 0.14, peak: 0.01, a: 0.01 });
      } else {
        voice(at, { f, dur: p.gap * 1.25, peak: peak * 0.8, a: 0.003, s: 0.6, d: 0.02, r: p.gap * 0.4 });
        at += p.gap;
      }
    }
  },
};
