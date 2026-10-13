// A short telephone ring made of fast alternating triangle notes (a major third apart), like an
// old bell's striker, in bursts that swell and fade. Triangle through a lowpass, so it rings
// without the buzz of a real ringer.
export default {
  id: 'notify-incoming-call',
  name: 'Incoming Call Ring',
  category: 'notify',
  tags: ['call', 'ring', 'phone', 'incoming', 'telephone', 'trill', 'ringtone'],
  desc: 'A short bell-like phone ring: bursts of fast alternating notes with a pause between. Loops cleanly if you repeat it.',
  dur: 2.0,
  params: {
    pitch: { min: 600, max: 1000, def: 880, unit: 'Hz' },
    rate: { min: 8, max: 16, def: 12, unit: 'Hz' },
    rings: { min: 1, max: 3, def: 2, step: 1 },
    tone: { min: 1200, max: 3500, def: 2600, unit: 'Hz' },
  },
  play(T, out, t, p) {
    const lp = T.filter(out, t, { type: 'lowpass', f: p.tone, q: 0.7 });
    const per = 1 / p.rate;
    const n = Math.round(0.42 * p.rate);
    for (let r = 0; r < Math.round(p.rings); r++) {
      for (let k = 0; k < n; k++) {
        const swell = 0.6 + 0.4 * Math.sin(Math.PI * (k + 0.5) / n);
        T.osc(lp, t + r * 0.65 + k * per, {
          type: 'triangle', f: k % 2 ? p.pitch * 1.26 : p.pitch, dur: per * 2.2, peak: 0.087 * swell, a: 0.004,
        });
      }
    }
  },
};
