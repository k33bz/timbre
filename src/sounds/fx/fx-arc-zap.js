// An electric arc jumping a gap: a sharp snap as it strikes, then a ragged mains-pitch buzz (a saw
// pushed hard into saturation so it is nearly square, then flickered) with a spitting crackle on top
// that dies when the gap closes. Small and close, made for interface edges. The lightning bolt in
// magic is a crack with thunder; this is the sustained sizzle.
export default {
  id: 'fx-arc-zap',
  name: 'Arc Zap',
  category: 'fx',
  tags: ['arc', 'zap', 'electric', 'spark', 'crackle', 'buzz', 'static', 'shock', 'plasma', 'border'],
  desc: 'A short electric arc: a snap, a rough flickering buzz and a spit of crackle. For an electric border lighting up, a plasma effect or a spark between two things.',
  dur: 0.75,
  family: 'synthetic',
  params: {
    pitch: { min: 80, max: 200, def: 120, unit: 'Hz', desc: 'Pitch of the buzz: low a heavy mains drone, high a thin electric whine' },
    length: { min: 0.15, max: 0.7, def: 0.35, unit: 's', desc: 'How long the arc holds before it dies' },
    crackle: { min: 0, max: 1, def: 0.6, desc: 'How much it spits: 0 a clean buzz, 1 a dense shower of crackle' },
    snap: { min: 0, max: 1, def: 0.5, desc: 'Hardness of the opening strike: 0 a soft start, 1 a sharp crack' },
  },
  play(T, out, t, p) {
    const L = p.length;
    // the strike
    T.noise(out, t, { filter: 'highpass', f: 6000, to: 2500, q: 0.8, dur: 0.035, peak: 0.03 + 0.07 * p.snap, a: 0.001 });
    T.osc(out, t, { type: 'square', f: 3200, to: 700, glide: 0.05, dur: 0.06, peak: 0.008 + 0.02 * p.snap, a: 0.001 });
    // the buzz: saturate hard, then trim, flicker the level and take the top edge off
    const dc = T.dcblock(out);
    const lp = T.filter(dc, t, { type: 'lowpass', f: 3200, q: 0.7 });
    const trim = T.gain(lp, 0.28);
    T.lfo(trim, t, { rate: 41, to: 29, depth: 0.2, dur: L });
    const sat = T.drive(trim, t, { amount: 0.7, ref: 0.1 });
    const hold = { dur: L, a: 0.004, s: 1, d: 0.03, r: Math.min(0.12, L * 0.4) };
    T.osc(sat, t, Object.assign({ type: 'sawtooth', f: p.pitch }, hold, { peak: 0.06 }));
    T.osc(sat, t, Object.assign({ type: 'sawtooth', f: p.pitch * 1.5 }, hold, { peak: 0.03 }));
    // the spitting
    T.crackle(out, t, { dur: L, rate: 30 + 170 * p.crackle, f: 4500, to: 2500, spread: 0.8, q: 1.2, len: 0.005, peak: 0.045, vary: 0.8 });
  },
};
