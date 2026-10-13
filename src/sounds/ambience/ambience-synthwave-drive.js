// A texture, not a tune: one bass note pulsing at a steady rate (a lowpassed sawtooth with a sine
// under it, bouncing off a dotted echo), a held minor chord of detuned sawtooths whose filter opens
// slowly and sways, and a rush of air that sweeps across the field for the road at speed.
export default {
  id: 'ambience-synthwave-drive',
  name: 'Synthwave Drive',
  category: 'ambience',
  tags: ['synthwave', 'retro', 'drive', 'night-drive', 'neon', 'pulse', 'bass', 'motion', 'wide', 'bed'],
  desc: 'A night drive as a texture: a steady bass pulse, a slow glowing chord and the rush of the road, with no tune. For retro neon scenes.',
  dur: 8,
  family: 'synthetic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 41, max: 82, def: 55, unit: 'Hz', desc: 'Pitch of the pulsing bass note, the chord follows it' },
    pulse: { min: 2, max: 5, def: 3.3, unit: 'Hz', desc: 'How fast the bass pulses: a slow cruise to a fast drive' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Brightness and level of the held chord: 0 dark and quiet, 1 open and bright' },
    road: { min: 0, max: 1, def: 0.4, desc: 'Level of the rushing air of the road: 0 none, 1 full' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const win = (x) => Math.max(0, Math.min(1, x / 0.8, (L - 1.2 - x) / 1.4));
    const f = p.pitch;
    const step = 1 / p.pulse;
    // the pulse echoes a dotted step later; its last notes stop early so the echo dies by dur
    const echo = T.delay(out, t, { time: step * 1.5, fb: 0.35, mix: 0.3, tone: 2200 });
    const n = Math.max(1, Math.floor((L - 1.3) / step));
    for (let k = 0; k < n; k++) {
      const at = k * step + 0.1;
      const w = win(at);
      const pl = T.pan(echo, t + at, { x: k % 2 === 0 ? -0.2 : 0.2 });
      T.osc(pl, t + at, { type: 'sawtooth', f, dur: step * 0.85, peak: 0.03 * w, a: 0.008, lp: { f: 560, to: 200, q: 2.5 } });
      T.osc(pl, t + at, { f, dur: step * 0.85, peak: 0.024 * w, a: 0.008 });
    }
    // the held chord: a minor chord built on the root, its filter opening slowly and swaying
    const lp = T.filter(T.reverb(out, t, { time: 1, mix: 0.25, tone: 0.5 }), t, {
      type: 'lowpass', f: 380 + 700 * p.glow, to: 700 + 1900 * p.glow, dur: L * 0.8, q: 1.2,
    });
    T.lfo(lp, t, { rate: 0.22, depth: 120 + 260 * p.glow, dur: L - 1, a: fade });
    [4, 4.8, 6, 8].forEach((m, k) => {
      [-1, 1].forEach((s) => {
        T.osc(T.pan(lp, t, { x: s * (0.3 + 0.15 * k) }), t, {
          type: 'sawtooth', f: f * m, detune: s * 7, dur: L - 1, peak: (0.006 + 0.01 * p.glow) * (k === 3 ? 0.7 : 1),
          a: fade, s: 1, d: 0.02, r: fade,
        });
      });
    });
    // the road: air rushing past, one independent band per side, sweeping a little
    [-0.9, 0.9].forEach((x, k) => {
      T.noise(T.pan(out, t, { x }), t, {
        filter: 'bandpass', f: 1500 + 300 * k, to: 900 + 500 * k, q: 0.5, dur: L, peak: 0.002 + 0.03 * p.road,
        a: fade, s: 1, d: 0.02, r: fade,
      });
    });
  },
};
