// One heartbeat, "lub-dub": two soft thumps, the second a little lighter and lower. Each is a short
// falling sine with a quiet overtone (so small speakers still carry it) and a muffled felt thud
// under it. The gap between the thumps scales with the pulse rate, so a faster pulse is also
// tighter. A host plays it again on every beat for a live dot or a pulsing badge.
export default {
  id: 'ui-pulse-beat',
  name: 'Pulse Beat',
  category: 'ui',
  tags: ['pulse', 'heartbeat', 'beat', 'live', 'thump', 'loop-cell', 'soft'],
  desc: 'One soft lub-dub heartbeat. Re-trigger every 0.8 s at 72 bpm (60 divided by the rate) for a live dot or pulsing badge.',
  dur: 0.43,
  family: 'soft',
  moments: ['loading'],
  params: {
    bpm: { min: 50, max: 110, def: 72, unit: 'bpm', desc: 'Pulse rate: sets the gap inside the lub-dub, and the re-trigger interval to use' },
    pitch: { min: 55, max: 110, def: 78, unit: 'Hz', desc: 'Pitch of the thump: low a deep chest beat, high a lighter tap' },
    soft: { min: 0, max: 1, def: 0.5, desc: 'Muffling: 0 a clearer knock, 1 a muted pillow thud' },
  },
  play(T, out, t, p) {
    const gap = (60 / p.bpm) * 0.22;
    const thump = (at, f, level, len) => {
      T.osc(out, at, { f: f * 1.5, to: f, glide: 0.045, dur: len, peak: 0.05 * level, a: 0.008 });
      T.osc(out, at, { f: f * 3, to: f * 2, glide: 0.04, dur: len * 0.6, peak: 0.017 * level * (1.3 - 0.8 * p.soft), a: 0.008 });
      T.noise(out, at, { filter: 'lowpass', f: 420 - 260 * p.soft, q: 0.7, dur: 0.045, peak: 0.05 * level, a: 0.005 });
    };
    thump(t, p.pitch, 1, 0.15);
    thump(t + gap, p.pitch * 0.85, 0.7, 0.13);
  },
};
