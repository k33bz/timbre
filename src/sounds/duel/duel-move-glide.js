// A character moving to a location: a small airy hop up, a soft brush as it slides across the wide
// location card, and a quiet landing (a dull tick with a faint glass ring) as it settles. Three
// short parts in one gesture, so it is longer and more shaped than a plain card slide.
export default {
  id: 'duel-move-glide',
  name: 'Move to Location',
  category: 'duel',
  tags: ['ink-duel', 'location', 'move', 'hop', 'slide', 'glide', 'settle', 'card-game'],
  desc: 'A card hops, slides across a wide location card and settles with a soft landing tick and a faint ring. For moving a character to a location.',
  dur: 0.71,
  family: 'air',
  params: {
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Scales the hop, the brush and the landing: low and heavy, high and light' },
    distance: { min: 0.08, max: 0.3, def: 0.16, unit: 's', desc: 'Length of the slide across the location: a short hop to a long glide' },
    ring: { min: 0, max: 1, def: 0.5, desc: 'The faint glass ring as it settles: 0 only a soft tick, 1 a clear ring' },
  },
  play(T, out, t, p) {
    const k = p.pitch;
    // the hop: a breath rising and a soft blip lifting
    T.noise(out, t, { filter: 'bandpass', f: 550 * k, to: 1900 * k, q: 1.2, dur: 0.06, peak: 0.1, a: 0.045 });
    T.noise(out, t + 0.055, { filter: 'bandpass', f: 1900 * k, to: 800 * k, q: 1.2, dur: 0.06, peak: 0.08, a: 0.006 });
    T.osc(out, t, { f: 420 * k, to: 680 * k, dur: 0.07, peak: 0.016, a: 0.01 });
    // the slide: an eased brush that falls as the card slows
    const s = t + 0.09;
    T.noise(out, s, { filter: 'bandpass', f: 1500 * k, to: 480 * k, q: 1, dur: p.distance, peak: 0.13, a: p.distance * 0.3, s: 0.7, d: 0.03, r: p.distance * 0.5, curve: 'lin' });
    // the landing
    const L = s + p.distance;
    T.noise(out, L, { filter: 'lowpass', f: 1000 * k, to: 420 * k, q: 1, dur: 0.045, peak: 0.07, a: 0.002 });
    T.osc(out, L, { f: 170 * k, to: 95 * k, dur: 0.07, peak: 0.04, a: 0.003 });
    T.bell(out, L + 0.005, { f: 1320 * k, partials: [[1, 1, 1], [2.32, 0.3, 0.5]], dur: 0.3, peak: 0.004 + 0.022 * p.ring, a: 0.003 });
  },
};
