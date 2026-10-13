// A bolt in three beats: a bright crack with a falling zap, a scatter of forked arcs, and thunder
// rolling off underneath (noise through a closing lowpass), all in a small room so it crackles
// through air rather than a speaker.
export default {
  id: 'magic-lightning',
  name: 'Lightning Bolt',
  category: 'magic',
  tags: ['lightning', 'thunder', 'bolt', 'shock', 'storm', 'electric', 'spell'],
  desc: 'A bright crack of electricity that forks into crackling arcs and rolls away as low thunder.',
  dur: 1.4,
  family: 'synthetic',
  moments: ['spell'],
  params: {
    bright: { min: 1500, max: 6000, def: 3200, unit: 'Hz', desc: 'Start pitch of the falling zap in the strike: lower is duller, higher sharper' },
    crackle: { min: 0, max: 1, def: 0.5, desc: 'How many forked arcs crackle after the strike' },
    rumble: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the rolling thunder underneath' },
    thunder: { min: 0.3, max: 1.0, def: 0.7, unit: 's', desc: 'How long the thunder rolls on after the strike' },
    space: { min: 0, max: 0.5, def: 0.2, desc: 'Small room reverb mix, from dry to roomy' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.6, mix: p.space, tone: 0.5 });
    // the strike
    T.noise(room, t, { filter: 'highpass', f: 6000, to: 2000, q: 0.8, dur: 0.09, peak: 0.08, a: 0.001 });
    T.osc(room, t, { type: 'sawtooth', f: p.bright, to: p.bright * 0.08, dur: 0.12, peak: 0.025, a: 0.001 });
    T.fm(room, t, { f: p.bright * 0.7, to: p.bright * 0.1, ratio: 1.41, index: 3, index1: 0.5, dur: 0.18, peak: 0.03, a: 0.001 });
    // the forks: bandpassed crackles that thin and soften as they go
    const n = Math.round(3 + 8 * p.crackle);
    let at = t + 0.04;
    for (let k = 0; k < n; k++) {
      const fade = 1 - k / (n + 2);
      T.noise(room, at, { filter: 'bandpass', f: T.rand(1500, 5000), q: 2, dur: T.rand(0.012, 0.035), peak: T.rand(0.035, 0.07) * fade, a: 0.001 });
      at += T.rand(0.02, 0.075);
    }
    // the thunder: a lowpass that closes as the roll fades
    T.noise(room, t + 0.03, { filter: 'lowpass', f: 700, to: 80, q: 0.9, dur: p.thunder, peak: 0.08 + 0.3 * p.rumble, a: 0.07 });
  },
};
