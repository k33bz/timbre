// The Deck Lab "your turn" cue (two rising notes, a fifth apart) re-voiced as two soft mallet
// strokes on wood, with a faint card tap under the first so it sits in a card-table set. Quieter
// than a notification: it comes every turn.
export default {
  id: 'cards-your-turn',
  name: 'Your Turn',
  category: 'cards',
  tags: ['turn', 'your-turn', 'cue', 'notify', 'mallet', 'chime', 'game'],
  desc: 'A gentle two-note mallet cue that says it is your move, with a soft tap of a card underneath.',
  dur: 0.65,
  params: {
    pitch: { min: 440, max: 880, def: 659, unit: 'Hz' },
    interval: { min: 3, max: 12, def: 7, unit: 'st' },
    bright: { min: 0, max: 1, def: 0.4 },
    ring: { min: 0.2, max: 0.5, def: 0.3, unit: 's' },
  },
  play(T, out, t, p) {
    const f2 = p.pitch * Math.pow(2, p.interval / 12);
    const mallet = (at, f, dur, peak) => {
      T.bell(out, at, { f, partials: [[1, 1, 1], [3.9, 0.12 + 0.22 * p.bright, 0.3], [9.2, 0.05 * p.bright, 0.12]], dur, peak, a: 0.006 });
    };
    mallet(t, p.pitch, p.ring * 0.8, 0.07);
    mallet(t + 0.13, f2, p.ring, 0.075);
    T.noise(out, t, { filter: 'lowpass', f: 1000, to: 450, q: 1, dur: 0.04, peak: 0.02, a: 0.002 });
  },
};
