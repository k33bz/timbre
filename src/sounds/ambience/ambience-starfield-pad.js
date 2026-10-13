// A thin, weightless pad of high sines (an octave, a fifth and a ninth over the root, each pair split
// by a fraction of a hertz and set on opposite sides) with a faint breath of far air, and stars: soft
// sines on a pentatonic scale that flicker as they ring out in a big room, set at random places in
// the field. No body, no low drone: the dark space bed is the other one.
export default {
  id: 'ambience-starfield-pad',
  name: 'Starfield Pad',
  category: 'ambience',
  tags: ['stars', 'starfield', 'space', 'night-sky', 'twinkle', 'pad', 'airy', 'wide', 'bed'],
  desc: 'A thin airy pad under a sky of stars: soft twinkling notes ring out across a wide, quiet field. For space and night scenes.',
  dur: 8,
  family: 'synthetic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 7, unit: 's', desc: 'Total duration of the bed, fades included' },
    stars: { min: 2, max: 16, def: 8, step: 1, desc: 'How many stars twinkle during the bed' },
    pitch: { min: 0.7, max: 1.5, def: 1, unit: 'x', desc: 'Scales the whole sky: low calm and round, high thin and bright' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Level of the airy pad under the stars: 0 faint, 1 full' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.5, L * 0.3);
    const win = (x) => Math.min(1, x / 0.6, (L - x) / 0.8);
    const root = 220 * p.pitch;
    // voices stop 1 s early so the room has rung out by dur
    const room = T.reverb(out, t, { time: 1.8, mix: 0.55, tone: 0.7 });
    const body = L - 1;
    // the pad: notes at 2x, 3x and 4.5x the root, each pair beating very slowly
    [[2, 1], [3, 0.8], [4.5, 0.5]].forEach((nt, k) => {
      [-1, 1].forEach((s) => {
        const place = T.pan(room, t, { x: s * 0.75, to: s * 0.25, dur: body });
        T.osc(place, t, {
          f: root * nt[0] + s * (0.15 + 0.05 * k), dur: body, peak: (0.006 + 0.009 * p.glow) * nt[1],
          a: fade, s: 1, d: 0.02, r: fade, trem: { rate: 0.07 + 0.04 * k, depth: 0.6 },
        });
      });
    });
    // far air: two independent bands, one in each ear, breathing slowly
    [-0.9, 0.9].forEach((x, k) => {
      const band = T.filter(T.pan(out, t, { x }), t, { type: 'bandpass', f: 3600, q: 0.6, dur: 0.1 });
      T.lfo(band, t, { rate: 0.1 + 0.05 * k, depth: 900, dur: L, a: fade });
      T.noise(band, t, {
        filter: 'none', dur: L, peak: 0.004 + 0.008 * p.glow, a: fade, s: 1, d: 0.02, r: fade,
      });
    });
    // the stars: a pentatonic scale from 8x the root, each ringing and flickering
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25];
    const n = Math.round(p.stars);
    const span = Math.max(0.5, L - 0.4 - 2.4);
    for (let k = 0; k < n; k++) {
      const at = 0.4 + ((k + T.rand(0.1, 0.9)) * span) / n;
      const f = root * 8 * scale[Math.floor(T.rand(0, scale.length))];
      const pk = 0.016 * T.rand(0.5, 1) * win(at);
      const place = T.pan(room, t + at, { x: T.rand(-0.9, 0.9) });
      T.osc(place, t + at, { f, dur: 1.1, peak: pk, a: 0.012, trem: { rate: T.rand(4, 8), depth: 0.5 } });
      T.osc(place, t + at, { f: f * 2.01, dur: 0.45, peak: pk * 0.25, a: 0.012 });
    }
  },
};
