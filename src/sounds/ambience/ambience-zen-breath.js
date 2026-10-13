// A singing-bowl hum made of near-unison sine pairs that beat slowly (the bowl's wobble), with its
// inharmonic upper partials and a soft low root, over a slow breath of bandpassed noise: each breath
// rises with a brightening inhale and sinks with a darkening exhale. Nothing strikes or chimes.
export default {
  id: 'ambience-zen-breath',
  name: 'Zen Breath',
  category: 'ambience',
  tags: ['zen', 'breath', 'breathing', 'calm', 'meditation', 'focus', 'bowl', 'steam', 'quiet', 'bed'],
  desc: 'A slow breath in and out over the soft wobbling hum of a singing bowl. For focus, calm and winding down.',
  dur: 8,
  family: 'soft',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 110, max: 330, def: 196, unit: 'Hz', desc: 'Pitch of the bowl, its upper tones follow it' },
    breath: { min: 0, max: 1, def: 0.5, desc: 'Level of the slow breath: 0 only the bowl, 1 a clear breath' },
    cycle: { min: 3, max: 7, def: 4.5, unit: 's', desc: 'Length of one whole breath, in and out: a quick light breath to a long slow one' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.5, L * 0.3);
    const f = p.pitch;
    // the bowl: [ratio, level, beat in Hz], each pair split to both sides and detuned by its beat
    [[1, 1, 0.45], [2.71, 0.3, 0.8], [5.15, 0.1, 1.3]].forEach((b) => {
      [-1, 1].forEach((s) => {
        T.osc(T.pan(out, t, { x: s * 0.5 }), t, {
          f: f * b[0] + s * b[2] * 0.5, dur: L, peak: 0.013 * b[1], a: fade, s: 1, d: 0.02, r: fade,
        });
      });
    });
    T.osc(out, t, { f: f / 2, dur: L, peak: 0.007, a: fade, s: 1, d: 0.02, r: fade, trem: { rate: 0.12, depth: 0.4 } });
    // the breath: an inhale that brightens and an exhale that darkens, each a crossfading pair.
    // Whole breaths only, centred in the bed so the fades never cut one off.
    const C = Math.min(p.cycle, L - 0.6);
    const inh = C * 0.42;
    const n = Math.max(1, Math.floor((L - 0.4) / C));
    const first = (L - n * C) / 2;
    for (let k = 0; k < n; k++) {
      const at = first + k * C;
      T.noise(out, t + at, {
        filter: 'bandpass', f: 420, to: 1100, q: 1.2, glide: inh, dur: inh * 1.45, peak: 0.11 * p.breath,
        a: inh, curve: 'lin',
      });
      T.noise(out, t + at + inh, {
        filter: 'bandpass', f: 1100, to: 380, q: 1.2, glide: C - inh, dur: C - inh, peak: 0.095 * p.breath,
        a: (C - inh) * 0.2, curve: 'lin',
      });
    }
  },
};
