// A grace note a fifth below, then a glassy bell "ting" with a soft echo. The extra presence (the
// echo and the 2.76 partial) is what lets it cut through a stream of ordinary messages.
export default {
  id: 'notify-mention',
  name: 'Mention Ping',
  category: 'notify',
  tags: ['mention', 'ping', 'at', 'tag', 'highlight', 'ding', 'attention'],
  desc: 'A quick grace note into a glassy bell ting with a soft echo. Stands out from ordinary messages without shouting.',
  dur: 1.2,
  params: {
    pitch: { min: 600, max: 1318.5, def: 1046.5, unit: 'Hz' },
    glass: { min: 0, max: 1, def: 0.5 },
    ring: { min: 0.2, max: 0.5, def: 0.32, unit: 's' },
    echo: { min: 0, max: 0.5, def: 0.25 },
  },
  play(T, out, t, p) {
    const room = T.delay(out, t, { time: 0.15, fb: 0.3, mix: p.echo, tone: 3200 });
    const pitch = p.pitch * (1 + T.rand(-0.006, 0.006));   // seeded variation so repeats are not identical
    T.osc(room, t, { f: pitch * 0.667, dur: 0.09, peak: 0.045, a: 0.006 });
    T.bell(room, t + 0.075, {
      f: pitch, dur: p.ring, peak: 0.07, a: 0.004,
      partials: [[1, 1, 1], [2, 0.25, 0.5], [2.76, 0.08 + 0.32 * p.glass, 0.22]],
    });
  },
};
