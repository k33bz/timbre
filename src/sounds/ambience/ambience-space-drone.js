// Two detuned sawtooths and a fifth under a slowly opening resonant lowpass, sine harmonics for
// body (a deep fundamental alone would vanish on small speakers), and three slow-tremolo high
// sines through a big dark room for the shimmer.
export default {
  id: 'ambience-space-drone',
  name: 'Space Drone',
  category: 'ambience',
  tags: ['space', 'drone', 'pad', 'ambient', 'sci-fi', 'dark', 'deep', 'bed'],
  desc: 'A slow, deep drone for a ship or a void: a dark pad that opens up, with a faint shimmer far above.',
  dur: 8,
  family: 'synthetic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 7, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 36, max: 110, def: 55, unit: 'Hz', desc: 'Root frequency of the drone, harmonics and shimmer follow it' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'How far the slowly opening filter reaches: 0 dark, 1 brighter' },
    shimmer: { min: 0, max: 1, def: 0.4, desc: 'Level of the high trembling shimmer: 0 none, 1 full' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const f = p.pitch;
    const fade = Math.min(1.8, L * 0.3);
    const lp = T.filter(out, t, { type: 'lowpass', f: 160 + 500 * p.tone, to: 380 + 1500 * p.tone, dur: L * 0.8, q: 1.1 });
    T.osc(lp, t, { type: 'sawtooth', f, detune: -9, dur: L, peak: 0.014, a: fade, s: 1, d: 0.02, r: fade });
    T.osc(lp, t, { type: 'sawtooth', f, detune: 9, dur: L, peak: 0.014, a: fade, s: 1, d: 0.02, r: fade });
    T.osc(lp, t, { type: 'sawtooth', f: f * 1.5, detune: 4, dur: L, peak: 0.008, a: fade, s: 1, d: 0.02, r: fade });
    T.osc(out, t, { f: f * 2, dur: L, peak: 0.012, a: fade, s: 1, d: 0.02, r: fade, trem: { rate: 0.11, depth: 0.5 } });
    T.osc(out, t, { f: f * 3, dur: L, peak: 0.007, a: fade, s: 1, d: 0.02, r: fade });
    // the shimmer ends 1.2 s early so the room's tail is finished by dur
    const room = T.reverb(out, t, { time: 1.6, mix: 0.5, tone: 0.3 });
    const ratios = [8, 12, 16];
    for (let k = 0; k < 3; k++) {
      T.osc(room, t, {
        f: f * ratios[k], dur: L - 1.2, peak: 0.012 * p.shimmer, a: fade, s: 1, d: 0.02, r: fade * 0.8,
        trem: { rate: 0.2 + 0.15 * k, depth: 0.9 }, vib: { rate: 0.3, depth: 8 },
      });
    }
  },
};
