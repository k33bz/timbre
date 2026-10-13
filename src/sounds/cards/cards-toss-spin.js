// A card flicked away so it spins through the air: the flick, then a run of airy puffs as the card
// turns (one per half turn), spaced wider and wider as the spin slows and dropping in pitch as it
// travels, swelling and fading as it passes and drifting across the stereo field, and a skid and
// a pat where it lands. The rate of the puffs is the spin.
export default {
  id: 'cards-toss-spin',
  name: 'Card Toss Spin',
  category: 'cards',
  tags: ['card', 'toss', 'spin', 'throw', 'flick', 'fly', 'flutter', 'whir', 'air'],
  desc: 'A card flicked off and spinning through the air: a fluttering whir that slows, drifts across and ends in a skid and a soft landing.',
  dur: 0.82,
  family: 'air',
  moments: ['card-draw'],
  params: {
    flight: { min: 0.25, max: 0.7, def: 0.45, unit: 's', desc: 'Time in the air before the landing' },
    spin: { min: 12, max: 32, def: 22, unit: 'Hz', desc: 'How fast it turns at the start: low a lazy flutter, high a quick whir' },
    arc: { min: 0, max: 1, def: 0.6, desc: 'How far it drifts across the stereo field: 0 straight ahead, 1 wide' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Brightness of the air puffs: 0 dark, 1 bright' },
  },
  play(T, out, t, p) {
    const F = p.flight;
    const fly = T.pan(out, t, { x: -0.7 * p.arc, to: 0.7 * p.arc, dur: F + 0.1 });
    // the flick
    T.noise(out, t, { filter: 'highpass', f: 3000, to: 1800, q: 0.9, dur: 0.034, peak: 0.037, a: 0.002 });
    T.osc(out, t, { type: 'triangle', f: 520, to: 260, dur: 0.028, peak: 0.011, a: 0.002 });
    // puff times: the gaps stretch by 1.3x over the flight and add up to it
    const n = Math.max(3, Math.round(F * p.spin * 0.8));
    let sum = 0;
    for (let k = 0; k < n; k++) sum += 1 + 1.3 * (k / n);
    let at = t + 0.025;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      const f = (1500 + 1900 * p.tone) * (1.25 - 0.55 * u) * T.rand(0.93, 1.07);
      const l = (0.45 + 0.55 * Math.sin(Math.PI * (0.1 + 0.8 * u))) * T.rand(0.85, 1.1);
      T.noise(fly, at, { filter: 'bandpass', f, to: f * 0.8, q: 1.5, dur: 0.04, peak: 0.095 * l, a: 0.01 });
      at += ((1 + 1.3 * (k / n)) / sum) * F * 0.95;
    }
    // down it comes: a skid, then a soft pat
    const land = t + 0.025 + F;
    T.noise(fly, land, { filter: 'bandpass', f: 1300, to: 550, q: 1.1, dur: 0.07, peak: 0.07, a: 0.01 });
    T.noise(out, land + 0.02, { filter: 'lowpass', f: 1000, to: 450, q: 1, dur: 0.045, peak: 0.055, a: 0.002 });
    T.osc(out, land + 0.02, { f: 195, to: 115, dur: 0.055, peak: 0.045, a: 0.003 });
  },
};
