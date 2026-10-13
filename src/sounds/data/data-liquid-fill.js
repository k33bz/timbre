// A vessel filling: the air column shortens as the level rises, so the resonance climbs. A sine
// glides up with the level over a band of pouring noise, and glugs (short upward bloops that start
// at the pitch of the moment) come closer together as it nears the brim. Organic family.
export default {
  id: 'data-liquid-fill',
  name: 'Liquid Fill',
  category: 'data',
  tags: ['liquid', 'fill', 'tank', 'pour', 'glug', 'water', 'level', 'gauge'],
  desc: 'Water glugging into a vessel with a pitch that climbs as the level rises. For tanks, batteries, thermometers and filling gauges.',
  dur: 0.96,
  family: 'organic',
  moments: ['progress', 'chart-reveal'],
  params: {
    pitch: { min: 180, max: 420, def: 260, unit: 'Hz', desc: 'Pitch when the vessel is empty, rising from here as it fills' },
    fill: { min: 0.3, max: 1, def: 0.8, desc: 'How full it gets: low a short rise, high a climb of two octaves to the brim' },
    length: { min: 0.3, max: 0.9, def: 0.55, unit: 's', desc: 'Time the vessel takes to fill' },
    glug: { min: 3, max: 9, def: 6, step: 1, desc: 'How many glugs bubble up on the way' },
  },
  play(T, out, t, p) {
    const len = p.length;
    const ratio = Math.pow(2, 2 * p.fill);     // end pitch over start pitch
    // the pour: noise narrowed around the climbing resonance, and the resonance itself
    T.noise(out, t, { filter: 'bandpass', f: p.pitch * 2, to: p.pitch * 2 * ratio, q: 4, dur: len + 0.04, peak: 0.12, a: 0.04, s: 1, d: 0.01, r: 0.06 });
    T.osc(out, t, { f: p.pitch, to: p.pitch * ratio, dur: len + 0.04, peak: 0.011, a: 0.05, s: 1, d: 0.01, r: 0.06, glide: len });
    // the glugs, closer together as the level rises
    const n = Math.round(p.glug);
    for (let k = 0; k < n; k++) {
      const x = k / n;
      const rel = 0.9 * (1 - Math.pow(1 - x, 1.4));
      const f = p.pitch * Math.pow(ratio, rel) * T.rand(0.92, 1.08);
      T.osc(out, t + len * rel, { f, to: f * 1.5, dur: 0.07, peak: 0.018, a: 0.004 });
      T.osc(out, t + len * rel, { f: f * 2, to: f * 3, dur: 0.05, peak: 0.004, a: 0.004 });
    }
  },
};
