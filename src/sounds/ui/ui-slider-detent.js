// A pitched stop tick for a slider or stepper crossing a notch. `pos` is the thumb position: it lifts
// the tick up to an octave, so a drag across the notches climbs a scale of ticks. Mechanical family.
export default {
  id: 'ui-slider-detent',
  name: 'Slider Detent',
  category: 'ui',
  tags: ['slider', 'detent', 'notch', 'stop', 'tick', 'mechanical'],
  desc: 'A small pitched tick for a slider thumb crossing a notch; set pos from the thumb position and a drag climbs a scale.',
  dur: 0.04,
  family: 'mechanical',
  moments: ['scroll'],
  params: {
    pitch: { min: 500, max: 1500, def: 784, unit: 'Hz', desc: 'Tick note at the bottom of the track; pos lifts it up to an octave' },
    pos: { min: 0, max: 1, def: 0.4, desc: 'Thumb position along the track: 0 base note, 1 an octave up' },
    edge: { min: 0, max: 1, def: 0.5, desc: 'Level of the noise click on top: 0 a soft tonal tick, 1 a sharp edge' },
  },
  play(T, out, t, p) {
    const f = p.pitch * Math.pow(2, p.pos);
    T.osc(out, t, { type: 'triangle', f, to: f * 0.8, dur: 0.03, peak: 0.037, a: 0.002 });
    T.noise(out, t, { filter: 'bandpass', f: f * 2, q: 2, dur: 0.012, peak: 0.016 + 0.066 * p.edge, a: 0.002 });
  },
};
