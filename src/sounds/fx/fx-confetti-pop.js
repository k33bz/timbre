// A party popper: a hollow pop (a puff of air, a falling thump and a paper snap), then the paper
// comes down as a shower of tiny flutters that thins out, with a few high glints through it at
// pentatonic pitches. No music in it, only paper and air, so it sits under a win without clashing
// with the jingle. Extra pops stack quickly for a bigger burst.
export default {
  id: 'fx-confetti-pop',
  name: 'Confetti Pop',
  category: 'fx',
  tags: ['confetti', 'party', 'popper', 'celebrate', 'pop', 'paper', 'shower', 'streamer'],
  desc: 'A hollow party-popper pop followed by a thinning shower of paper flutters and a few bright glints. For celebrations, wins and milestones.',
  dur: 1.5,
  family: 'paper',
  moments: ['achievement', 'victory'],
  params: {
    pops: { min: 1, max: 3, def: 1, step: 1, desc: 'How many poppers go off, a few hundredths of a second apart' },
    length: { min: 0.4, max: 1, def: 0.7, unit: 's', desc: 'How long the paper takes to come down' },
    pitch: { min: 180, max: 420, def: 280, unit: 'Hz', desc: 'Pitch of the hollow thump in the pop: low a big cannon, high a small popper' },
    glitter: { min: 0, max: 1, def: 0.5, desc: 'How many bright glints twinkle through the shower, 0 none' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.5, mix: 0.18, tone: 0.8 });
    const n = Math.round(p.pops);
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.065;
      const f = p.pitch * (k % 2 === 0 ? 1 : 1.18);
      T.noise(room, at, { filter: 'bandpass', f: 950, to: 380, q: 0.9, dur: 0.07, peak: 0.2, a: 0.002 });
      T.osc(room, at, { f, to: f * 0.45, glide: 0.05, dur: 0.1, peak: 0.09, a: 0.002 });
      T.tick(room, at, { f: 5200, q: 1, dur: 0.01, peak: 0.07, jitter: 0.5 });
    }
    // the shower: paper flutter thinning out, one source under one slow envelope
    const span = p.length;
    const start = t + 0.05 + (n - 1) * 0.065;
    const shower = T.bus(room, start, { a: 0.03, dur: span, tail: 0.04 });
    T.crackle(shower, start, { dur: span, rate: 150, f: 5200, to: 3200, q: 0.9, spread: 0.7, len: 0.012, peak: 0.16, vary: 0.8 });
    T.crackle(shower, start, { dur: span, rate: 50, f: 2600, to: 1800, q: 0.7, spread: 0.6, len: 0.022, peak: 0.08, vary: 0.8 });
    // glints: high pentatonic pings, more of them early
    const glints = Math.round(3 + 9 * p.glitter);
    const notes = [0, 2, 4, 7, 9, 12];
    for (let k = 0; k < glints; k++) {
      const u = Math.pow(T.rand(0, 1), 1.5);
      const f = 1568 * Math.pow(2, notes[Math.floor(T.rand(0, notes.length))] / 12);
      T.bell(room, start + 0.02 + span * 0.9 * u, {
        f, partials: [[1, 1, 1], [2.76, 0.3, 0.4]], dur: 0.12, peak: 0.022 * (1 - 0.5 * u), a: 0.002,
      });
    }
  },
};
