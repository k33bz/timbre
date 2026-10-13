// A heavy plasma shot: a saw and a square falling together through tanh drive (so the grit never
// raises the peak), an FM snarl, a noise crack on top and a sine thump underneath.
export default {
  id: 'scifi-blaster-bolt',
  name: 'Blaster Bolt',
  category: 'scifi',
  tags: ['blaster', 'bolt', 'plasma', 'cannon', 'gun', 'shot', 'heavy'],
  desc: 'A heavy plasma shot: a gritty falling snarl with a bright crack on top and a thump underneath.',
  dur: 0.45,
  family: 'synthetic',
  moments: ['shoot'],
  params: {
    pitch: { min: 300, max: 1200, def: 700, unit: 'Hz', desc: 'Start pitch of the falling snarl and its FM layer' },
    length: { min: 0.18, max: 0.4, def: 0.3, unit: 's', desc: 'Duration of the falling snarl and its FM layer' },
    grit: { min: 0, max: 1, def: 0.5, desc: 'Saturation on the snarl, from mild to heavily distorted' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the low thump underneath' },
  },
  play(T, out, t, p) {
    const len = p.length;
    // a 40 Hz highpass keeps the falling low end from leaving a DC offset (the sweeps end mid-cycle)
    const body = T.filter(out, t, { type: 'highpass', f: 40, q: 0.7 });
    // drive's ref caps the snarl near 0.085 however hard it is pushed
    const dr = T.drive(body, t, { amount: 0.25 + 0.65 * p.grit, ref: 0.085 });
    T.osc(dr, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 0.1, dur: len, peak: 0.07, a: 0.002, glide: len * 0.8 });
    T.osc(dr, t, { type: 'square', f: p.pitch * 1.01, to: p.pitch * 0.1, dur: len, peak: 0.05, a: 0.002, glide: len * 0.8 });
    T.fm(body, t, { f: p.pitch * 2, to: p.pitch * 0.3, ratio: 1.41, index: 2, index1: 0.2, dur: len * 0.6, peak: 0.02, a: 0.002 });
    T.noise(out, t, { filter: 'highpass', f: 5000, to: 1500, q: 0.8, dur: 0.05, peak: 0.05, a: 0.001 });
    T.osc(body, t, { f: 180, to: 45, dur: 0.22, peak: 0.015 + 0.06 * p.weight, a: 0.002 });
  },
};
