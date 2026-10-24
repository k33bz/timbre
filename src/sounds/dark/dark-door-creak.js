// A slow creak from stick-slip friction: a train of tiny resonant clicks whose rate and pitch
// wander, played through a wooden body resonance, with an optional soft thud as the door shuts.
export default {
  id: 'dark-door-creak',
  name: 'Door Creak',
  category: 'dark',
  tags: ['door', 'creak', 'squeak', 'hinge', 'old', 'wood', 'haunted', 'dark', 'scare', 'slow'],
  desc: 'A long, wandering creak of an old wooden door on dry hinges, optionally ending in a soft thud as it shuts. For opening a door into the dark.',
  dur: 4.6,
  family: 'wood',
  moments: ['door', 'scare'],
  params: {
    length: { min: 1, max: 3.5, def: 2.2, unit: 's', desc: 'How long the door takes to move' },
    pitch: { min: 0.6, max: 1.8, def: 1, unit: 'x', desc: 'Pitch of the hinge: low a heavy groan, high a thin squeal' },
    close: { min: 0, max: 1, def: 0, step: 1, desc: '1 ends with the door closing in a soft thud, 0 it just stops' },
  },
  play(T, out, t, p) {
    const len = p.length;
    const room = T.reverb(out, t, { time: 1.4, mix: 0.2, tone: 0.4 });
    // the door body: a low wooden resonance and a thinner board above it
    const body = T.filter(room, t, { type: 'peaking', f: 230, q: 3, db: 9, dur: 0.1 });
    const board = T.filter(body, t, { type: 'peaking', f: 640, q: 4, db: 6, dur: 0.1 });
    // three slow wanders, drawn up front: click rate, resonance pitch, and how hard the door sticks
    const w = [0, 1, 2].map(() => ({ ph: T.rand(0, 6.28), sp: T.rand(0.8, 1.7) }));
    const wander = (i, x) => Math.sin(w[i].ph + x * w[i].sp * 6.28 * 0.5) * 0.6 + Math.sin(w[i].ph * 2 + x * w[i].sp * 6.28 * 1.3) * 0.4;
    let x = 0;
    while (x < len) {
      const u = x / len;
      const swell = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.7);
      const rate = (34 + 26 * wander(0, u)) * (0.75 + 0.3 * p.pitch);
      const f = p.pitch * (880 + 420 * wander(1, u));
      const stick = 0.5 + 0.5 * wander(2, u);
      const lvl = swell * (0.35 + 0.65 * stick);
      if (lvl > 0.06) {
        T.noise(board, t + x, { filter: 'bandpass', f, q: 14, dur: 0.02, a: 0.002, peak: 0.3 * lvl });
        T.osc(board, t + x, { f: f * 0.5, to: f * 0.46, dur: 0.018, a: 0.002, peak: 0.06 * lvl });
      }
      x += (1 / rate) * T.rand(0.8, 1.25);
    }
    if (p.close > 0.5) {
      const tt = t + len + 0.18;
      T.osc(room, tt, { f: 95, to: 52, glide: 0.12, dur: 0.4, a: 0.004, peak: 0.07 });
      T.noise(room, tt, { filter: 'lowpass', f: 420, q: 0.7, dur: 0.1, a: 0.002, peak: 0.05 });
      T.osc(room, tt + 0.002, { f: 310, to: 250, dur: 0.07, a: 0.002, peak: 0.015 });
    }
  },
};
