// Gathering energy: a triangle, a fifth and an octave line climbing together as they swell, a
// shimmer opening above, and a bright bell ping when the charge is full.
export default {
  id: 'magic-charge-up',
  name: 'Arcane Charge',
  category: 'magic',
  tags: ['charge', 'gather', 'channel', 'build', 'windup', 'power', 'spell'],
  desc: 'Energy gathering: a glowing swell climbs in pitch with shimmering overtones and ends in a ready ping.',
  dur: 2.1,
  family: 'synthetic',
  moments: ['spell', 'power-up'],
  params: {
    length: { min: 0.5, max: 1.3, def: 0.9, unit: 's', desc: 'Climb time: how long the swell rises before the ready ping' },
    pitch: { min: 200, max: 600, def: 330, unit: 'Hz', desc: 'Base note: the climb rises to three times it, the ping lands at six times' },
    shimmer: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the airy high hiss rising with the swell, faint to prominent' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Room reverb mix, from dry to a lush wash' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.9, mix: p.space, tone: 0.7 });
    const L = p.length;
    // all three lines peak at the end of the climb, then stop short for the ping
    T.osc(room, t, { type: 'triangle', f: p.pitch, to: p.pitch * 3, dur: L, peak: 0.05, a: L * 0.92, glide: L, vib: { rate: 6, depth: 10 } });
    T.osc(room, t, { f: p.pitch * 1.5, to: p.pitch * 4.5, dur: L, peak: 0.022, a: L * 0.92, glide: L });
    T.osc(room, t, { f: p.pitch * 2, to: p.pitch * 6, dur: L, peak: 0.017, a: L * 0.92, glide: L, trem: { rate: 12, depth: 0.5 } });
    T.noise(room, t, { filter: 'highpass', f: 3000, to: 9000, q: 0.8, dur: L, peak: 0.01 + 0.04 * p.shimmer, a: L * 0.92, glide: L });
    T.bell(room, t + L, { f: p.pitch * 6, partials: [[1, 1, 1], [2, 0.4, 0.6], [3, 0.25, 0.4]], dur: 0.6, peak: 0.05 });
  },
};
