// One step of a counter: a tiny tick whose pitch climbs with `value`, so a run of increments
// plays a rising scale of ticks. `click` blends the voicing from a glassy tink (a small bell with
// a fast fade) to a mechanical wheel click (a dry snap over a short low body) as an equal-power
// crossfade, so the middle is no quieter than either end. Very quiet and very short because a
// ticker or odometer fires it on every step.
export default {
  id: 'data-counter-tick',
  name: 'Counter Tick',
  category: 'data',
  tags: ['counter', 'tick', 'ticker', 'odometer', 'digit', 'increment', 'glass', 'mechanical'],
  desc: 'A tiny tick for one step of a number: set value from the count and a run of steps climbs in pitch. Glassy at one end, a dry wheel click at the other.',
  dur: 0.09,
  family: 'glass',
  moments: ['data-tick'],
  params: {
    value: { min: 0, max: 1, def: 0.4, desc: 'Where the count sits: 0 the lowest tick, 1 an octave up' },
    pitch: { min: 600, max: 2000, def: 1100, unit: 'Hz', desc: 'Tick note at value 0' },
    click: { min: 0, max: 1, def: 0.3, desc: 'Voicing: 0 a glassy tink, 1 a dry mechanical wheel click' },
  },
  play(T, out, t, p) {
    const f = p.pitch * Math.pow(2, p.value);
    const m = p.click;
    // glass: a small bell that rings for a few milliseconds
    T.bell(out, t, { f, partials: [[1, 1, 1], [2.76, 0.4, 0.45], [5.4, 0.12, 0.25]], dur: 0.06, peak: 0.032 * Math.cos(m * Math.PI / 2), a: 0.001 });
    // mechanical: a band-passed snap that follows the note, over a short low knock; a narrow band
    // passes more noise the higher it sits, so the snap is trimmed as the note climbs
    T.tick(out, t, { f: f * 2.2, q: 2.2, dur: 0.011, peak: 0.12 * Math.sin(m * Math.PI / 2) * Math.sqrt(1100 / f), blip: f * 0.45, blipTo: f * 0.35, blipPeak: 0.03 * Math.sin(m * Math.PI / 2), blipDur: 0.03, jitter: 0.3 });
  },
};
