// A referee's pea whistle: a 1.25 kHz tone whose level trills about 27 times a second (the pea
// rolling in the chamber), a breath of air around it and, ahead of it, the snap of a card. The
// fizzle switch is the whistle that fails: it sags and deflates into a sigh with no snap before it.
export default {
  id: 'game-whistle',
  name: 'Referee Whistle',
  category: 'game',
  tags: ['whistle', 'referee', 'foul', 'penalty', 'pea', 'blast', 'sport', 'call'],
  desc: 'A referee\'s whistle blast with a trilling pea and a card snap before it, or, switched to fizzle, a whistle that sags and runs out of air.',
  dur: 0.67,
  family: 'air',
  params: {
    fizzle: { min: 0, max: 1, def: 0, step: 1, desc: '0 a sharp blast after a card snap, 1 a whistle that sags and deflates' },
    pitch: { min: 1000, max: 1700, def: 1250, unit: 'Hz', desc: 'Pitch of the whistle: low a big referee, high a small shrill one' },
    length: { min: 0.15, max: 0.5, def: 0.32, unit: 's', desc: 'How long the blast holds' },
    pea: { min: 0, max: 1, def: 0.7, desc: 'How hard the pea trills: 0 a clean tone, 1 a rattling warble' },
  },
  play(T, out, t, p) {
    const L = p.length;
    if (p.fizzle < 0.5) {
      // the snap of the card, then the blast: a held tone with a small upward chirp at the start
      T.noise(out, t, { filter: 'highpass', f: 2600, to: 1800, q: 0.8, dur: 0.03, peak: 0.022, a: 0.002 });
      const at = t + 0.02;
      T.osc(out, at, {
        f: p.pitch, to: p.pitch * 1.064, dur: L, peak: 0.1, a: 0.02, s: 0.85, d: 0.04, r: 0.06,
        trem: { rate: 27, depth: p.pea }, vib: { rate: 27, depth: 18 * p.pea },
      });
      // the second harmonic is kept tiny so it stays a whistle and never turns shrill
      T.osc(out, at, { f: p.pitch * 2, to: p.pitch * 2.128, dur: L, peak: 0.012, a: 0.02, s: 0.85, d: 0.04, r: 0.06, trem: { rate: 27, depth: p.pea } });
      T.noise(out, at, { filter: 'bandpass', f: p.pitch * 1.04, q: 8, dur: L, peak: 0.12, a: 0.03, s: 0.7, d: 0.05, r: 0.06 });
    } else {
      // the whistle fails: the pitch sags to under half, the trill slows and a sigh of air follows
      const D = L * 1.3;
      T.osc(out, t, { f: p.pitch, to: p.pitch * 0.42, dur: D, peak: 0.09, a: 0.02, trem: { rate: 22, depth: 0.6 * (0.4 + 0.6 * p.pea) } });
      T.noise(out, t + D * 0.55, { filter: 'lowpass', f: 900, to: 300, q: 1, dur: 0.22, peak: 0.1, a: 0.01 });
    }
  },
};
