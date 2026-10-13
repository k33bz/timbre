// An image coming out of noise: five layers of band-passed hiss, each narrower than the last and
// sweeping down toward the pitch, hand over to each other until only a pure tone is left, which
// rings out with a faint octave. A layer's loudness is scaled by its width (a narrow band passes far
// less noise), so the cloud thins without a jump in level.
export default {
  id: 'ai-denoise',
  name: 'Denoise',
  category: 'ai',
  tags: ['ai', 'denoise', 'diffusion', 'generate', 'image', 'noise', 'resolve', 'clarify', 'sweep', 'synthetic'],
  desc: 'A haze of static that narrows and sweeps down until it settles into one clean tone. An image or an answer coming into focus.',
  dur: 1.55,
  family: 'synthetic',
  moments: ['reveal'],
  params: {
    pitch: { min: 440, max: 1760, def: 880, unit: 'Hz', desc: 'Note the static settles on' },
    length: { min: 0.5, max: 1.2, def: 0.9, unit: 's', desc: 'Time the static takes to clear before the tone rings' },
    grain: { min: 0, max: 1, def: 0.5, desc: 'How the static starts: 0 a soft low haze, 1 bright, hissy grit' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const f = p.pitch;
    const start = Math.pow(2, 1 + 1.5 * p.grain);   // where the static begins, as a multiple of the pitch
    const qs = [0.7, 2, 6, 18, 55];
    for (let k = 0; k < 5; k++) {
      const hi = f * Math.pow(start, 1 - k / 5);
      const lo = f * Math.pow(start, 1 - (k + 1) / 5);
      const fc = Math.sqrt(hi * lo);
      T.noise(out, t + k * L * 0.14, {
        filter: 'bandpass', f: hi, to: lo, q: qs[k], dur: L * 0.44,
        peak: 1.8 * Math.sqrt(qs[k] / fc), a: L * 0.2, s: 1, d: 0.02, r: L * 0.2,
      });
    }
    // the clean tone grows out of the narrowest layer and rings on after the static is gone
    T.osc(out, t + L * 0.45, { f, dur: L * 0.55 + 0.3, peak: 0.045, a: L * 0.4, s: 1, d: 0.02, r: 0.3, tail: 0.1, fade: 0.1 });
    T.osc(out, t + L * 0.75, { f: f * 2, dur: L * 0.25 + 0.3, peak: 0.01, a: L * 0.2, s: 1, d: 0.02, r: 0.3, tail: 0.1, fade: 0.1 });
  },
};
