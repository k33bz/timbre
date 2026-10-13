// Inking a card: a bead of ink falls into the well. A soft sine that bends up into a plink with a
// glassy tip, a dark pool answering under it (a low bubble and a hush of lowpassed noise), then two
// small ripples. Kept dark and wet on purpose: this is the sound the whole Ink Duel family leans on
// for "ink", so it stays soft and a little hollow, never bright.
export default {
  id: 'duel-well-drip',
  name: 'Well Drip',
  category: 'duel',
  tags: ['ink-duel', 'ink', 'inkwell', 'drip', 'plunk', 'liquid', 'pool', 'card', 'resource'],
  desc: 'A bead of ink falling into a dark well: a soft glassy plink, a low bubble in the pool and two ripples. For inking a card.',
  dur: 0.5,
  family: 'organic',
  moments: ['resource'],
  params: {
    pitch: { min: 420, max: 1100, def: 720, unit: 'Hz', desc: 'Pitch of the falling bead: low a heavy blot, high a small bead' },
    glass: { min: 0, max: 1, def: 0.5, desc: 'Glassy tip on the plink: 0 plain liquid, 1 a clear ringing edge' },
    pool: { min: 0, max: 1, def: 0.5, desc: 'The dark pool answering: 0 a bare plink, 1 a deep bubble with ripples' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    const room = T.reverb(out, t, { time: 0.45, mix: 0.1 + 0.14 * p.pool, tone: 0.3, pre: 0.01 });
    // the bead meets the surface: a sine that bends up, the way a drip rings
    T.osc(room, t, { f: f * 0.7, to: f * 1.5, glide: 0.035, dur: 0.12, peak: 0.055, a: 0.003 });
    // the glassy edge: two thin partials that ring a moment longer than the plink
    T.bell(room, t, { f: f * 3.3, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.15, peak: 0.032 * p.glass, a: 0.002 });
    // the dark pool: a low bubble that swoops up and a hush of noise closing over it
    const at = t + 0.04;
    T.osc(room, at, { f: f * 0.32, to: f * 0.5, glide: 0.1, dur: 0.22, peak: 0.012 + 0.06 * p.pool, a: 0.012 });
    T.noise(room, at, { filter: 'lowpass', f: 520, to: 220, q: 0.8, dur: 0.16, peak: 0.1 * p.pool, a: 0.015 });
    // two ripples, each smaller and a little higher than the last
    for (let k = 0; k < 2; k++) {
      const rf = f * (1.08 + 0.2 * k);
      T.osc(room, t + 0.17 + 0.1 * k, { f: rf, to: rf * 1.35, glide: 0.03, dur: 0.1, peak: (0.026 - 0.01 * k) * (0.25 + 0.75 * p.pool), a: 0.003 });
    }
  },
};
