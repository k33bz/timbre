// Someone coming online or going offline. Online is a soft rising pair of bell notes a fourth
// apart, warm and a little slower than a checkbox; offline is one lower bell note that sags and
// dulls, like a door easing shut. Meant to be heard across a busy contact list, so it stays quiet.
export default {
  id: 'notify-presence',
  name: 'Presence Change',
  category: 'notify',
  tags: ['presence', 'online', 'offline', 'status', 'available', 'away', 'contact', 'ding-dong'],
  desc: 'Two soft bell notes rising for someone coming online, one lower note sagging away for going offline. Gentle enough for a long contact list.',
  dur: 0.55,
  family: 'soft',
  moments: ['presence'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 plays the rising online pair, 0 the single falling offline note' },
    pitch: { min: 440, max: 1000, def: 698, unit: 'Hz', desc: 'Note of the offline tone and the first online note; the second online note sits a fourth above' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'Level of the octave shimmer and the soft echo: 0 plain and dry, 1 warm and glowing' },
  },
  play(T, out, t, p) {
    const warm = [[1, 1, 1], [2, 0.14, 0.5], [3, 0.04, 0.25]];
    const glow = p.glow;
    const room = T.delay(out, t, { time: 0.11, fb: 0.15, mix: 0.45 * glow, tone: 2200 });
    if (p.on >= 0.5) {
      const hi = p.pitch * 1.3348;                   // a perfect fourth up
      T.bell(room, t, { f: p.pitch, dur: 0.2, peak: 0.05, a: 0.005, partials: warm });
      T.bell(room, t + 0.1, { f: hi, dur: 0.3, peak: 0.054, a: 0.005, partials: warm });
      T.osc(room, t + 0.1, { f: hi * 2, dur: 0.12, peak: 0.014 * glow, a: 0.006 });
    } else {
      const lp = T.filter(room, t, { type: 'lowpass', f: 2600, to: 900, dur: 0.25 });
      T.bell(lp, t, { f: p.pitch * 0.8, drift: 0.95, dur: 0.28, peak: 0.052, a: 0.006, partials: warm });
    }
  },
};
