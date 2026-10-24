// A muffled lowpass breath with an independent noise in each ear, each swelling slowly, under a faint
// cold sizzle of high air. Soft padded thumps are snow sliding off branches, and a few quiet sine
// glints ring into a big cold room. Nothing here is louder than the hush itself.
export default {
  id: 'ambience-snow-hush',
  name: 'Snow Hush',
  category: 'ambience',
  tags: ['snow', 'winter', 'cold', 'hush', 'quiet', 'frost', 'calm', 'wide', 'bed'],
  desc: 'Snow falling on a windless night: a soft muffled hush, clumps sliding off branches and faint ice glints. A calm winter-scene bed.',
  dur: 8,
  loop: true,
  family: 'air',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    hush: { min: 0, max: 1, def: 0.5, desc: 'Level of the muffled blanket of air: 0 barely there, 1 full' },
    slides: { min: 0, max: 6, def: 2, step: 1, desc: 'How many soft clumps of snow slide off a branch' },
    glints: { min: 0, max: 8, def: 3, step: 1, desc: 'How many faint ice glints sparkle in the cold air' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const win = (x) => Math.min(1, x / 0.6, (L - x) / 0.8);
    // the blanket: one independent lowpassed noise per ear, each cutoff drifting at its own pace
    [-0.9, 0.9].forEach((x, k) => {
      const ear = T.pan(out, t, { x });
      const lp = T.filter(ear, t, { type: 'lowpass', f: 560, q: 0.7, dur: 0.1 });
      T.lfo(lp, t, { rate: 0.12 + 0.05 * k, depth: 170, dur: L, a: fade });
      T.noise(lp, t, {
        filter: 'none', dur: L, peak: 0.045 + 0.085 * p.hush * p.hush, a: fade, s: 1, d: 0.02, r: fade,
      });
      // the cold sizzle of the air, far under the blanket
      T.noise(ear, t, {
        filter: 'bandpass', f: 5200, q: 0.5, dur: L, peak: 0.001 + 0.006 * p.hush, a: fade, s: 1, d: 0.02, r: fade,
      });
    });
    // snow sliding off a branch: a padded thump and a puff of fine grains
    const n = Math.round(p.slides);
    const span = Math.max(0.5, L - 2);
    for (let k = 0; k < n; k++) {
      const at = 0.6 + ((k + T.rand(0.15, 0.85)) * span) / n;
      const side = T.pan(out, t + at, { x: T.rand(-0.8, 0.8) });
      const w = win(at);
      T.osc(side, t + at, { f: T.rand(95, 130), to: 55, dur: 0.3, peak: 0.01 * w, a: 0.04 });
      T.noise(side, t + at, { filter: 'lowpass', f: 380, to: 160, q: 0.7, dur: 0.4, peak: 0.055 * w, a: 0.07 });
      T.noise(side, t + at + 0.04, { filter: 'bandpass', f: 2600, q: 0.8, dur: 0.3, peak: 0.008 * w, a: 0.08 });
    }
    // ice glints: soft sines that ring out in a large cold room, so the last must land early
    const room = T.reverb(out, t, { time: 1.5, mix: 0.5, tone: 0.75 });
    const g = Math.round(p.glints);
    const gspan = Math.max(0.5, L - 2.6);
    for (let k = 0; k < g; k++) {
      const at = 0.5 + ((k + T.rand(0.1, 0.9)) * gspan) / g;
      const f = T.rand(2100, 4300);
      T.osc(T.pan(room, t + at, { x: T.rand(-0.85, 0.85) }), t + at, {
        f, dur: 0.5, peak: 0.016 * T.rand(0.5, 1) * win(at), a: 0.006,
      });
    }
  },
};
