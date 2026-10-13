// One card turned on its side to act (exert) or stood back up (ready). Both are the same gesture
// in opposite directions: a breathy slide that dims and falls into a low knock, or brightens and
// rises into a lighter knock with a thin glass tip. The switch is the direction.
export default {
  id: 'duel-exert-tilt',
  name: 'Exert Tilt',
  category: 'duel',
  tags: ['ink-duel', 'exert', 'ready', 'tilt', 'turn', 'card', 'tap', 'untap', 'sideways'],
  desc: 'A card turned on its side to act, a dimming slide and a low knock, or stood back up, a brightening slide and a thin glass tip.',
  dur: 0.32,
  family: 'wood',
  moments: ['card-tap'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 exerts: a dimming slide and low knock; 0 readies: a brightening slide and glass tip' },
    turn: { min: 0.05, max: 0.16, def: 0.09, unit: 's', desc: 'How long the card takes to turn: short a flick, long a lazy tilt' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the knock as the card settles: 0 a whisper, 1 a solid tap' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Surface under the card: 0 felt-dark, 1 bright wood' },
  },
  play(T, out, t, p) {
    const ex = Math.round(p.on) === 1;
    const L = p.turn;
    const w = p.weight;
    // the slide: a breathy band falling (the card dims) or rising (it brightens)
    const f0 = ex ? 1250 + 700 * p.tone : 520 + 300 * p.tone;
    const f1 = ex ? 460 + 200 * p.tone : 1450 + 900 * p.tone;
    T.noise(out, t, { filter: 'bandpass', f: f0, to: f1, q: 1.1, dur: L + 0.02, peak: 0.1, a: L * 0.45 });
    // the knock as the card settles on its side or on its feet
    const at = t + L;
    T.osc(out, at, { f: ex ? 190 : 270, to: ex ? 108 : 190, dur: 0.075, peak: 0.02 + 0.06 * w, a: 0.003 });
    T.noise(out, at, { filter: 'lowpass', f: (ex ? 800 : 1500) + 500 * p.tone, to: 300, q: 0.9, dur: 0.045, peak: 0.04 + 0.05 * w, a: 0.002 });
    if (!ex) {
      // readied: the face catches the light, a thin glass tip
      T.bell(out, at + 0.01, { f: 2093, partials: [[1, 1, 1], [2.32, 0.4, 0.5]], dur: 0.16, peak: 0.022, a: 0.002 });
    }
  },
};
