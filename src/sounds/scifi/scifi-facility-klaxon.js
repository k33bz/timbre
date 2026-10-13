// An industrial facility klaxon, in the spirit of the alarm horns of dystopian sci-fi game levels
// (an original synthesis, not a copy of any recording): each blast is a pair of detuned saws plus
// a square an octave down that swoop up into pitch, a fast amplitude rattle for the mechanical
// buzz, tanh drive for the rasp, a nasal horn formant, then a big concrete room. Blasts repeat
// with a short breath between them, like a horn on a duty cycle.
export default {
  id: 'scifi-facility-klaxon',
  name: 'Facility Klaxon',
  category: 'scifi',
  tags: ['klaxon', 'alarm', 'alert', 'horn', 'siren', 'industrial', 'facility', 'lockdown', 'breach', 'warning', 'dystopian'],
  desc: 'A raspy industrial alarm horn: buzzing blasts that swoop up into pitch and ring out in a concrete hall. For lockdowns, breaches and red alerts.',
  dur: 7,
  family: 'synthetic',
  moments: ['warning', 'scare'],
  params: {
    pitch: { min: 180, max: 420, def: 290, unit: 'Hz', desc: 'Horn note each blast swoops up into: low a heavy facility horn, high a thinner buzzer' },
    pulses: { min: 1, max: 4, def: 3, step: 1, desc: 'How many blasts sound' },
    length: { min: 0.3, max: 0.9, def: 0.55, unit: 's', desc: 'Length of each blast; the breath between blasts stays the same' },
    rasp: { min: 0, max: 1, def: 0.6, desc: 'Mechanical buzz and distortion: 0 a clean horn, 1 a ragged, rattling one' },
    space: { min: 0, max: 1, def: 0.5, desc: 'How much of the concrete hall rings after each blast' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.8, mix: 0.12 + 0.38 * p.space, tone: 0.35, pre: 0.02 });
    // the horn's nasal honk, then a lowpass so the drive's fizz stays out of the top end
    const honk = T.filter(room, t, { type: 'peaking', f: 1150, q: 1.3, db: 6 });
    const lp = T.filter(honk, t, { type: 'lowpass', f: 3200, q: 0.6 });
    // ref sets the horn's loudness: the drive never passes more than about this, whatever the rasp
    const rasp = T.drive(lp, t, { amount: 0.35 + 0.55 * p.rasp, ref: 0.045 });
    const hp = T.filter(rasp, t, { type: 'highpass', f: 70, q: 0.7 });
    const n = Math.round(p.pulses), gap = 0.3;
    const rattle = { rate: 46, depth: 0.15 + 0.5 * p.rasp };
    for (let k = 0; k < n; k++) {
      const at = t + k * (p.length + gap);
      // the swoop: up from about a minor third below over the first third, then a slight sag
      const env = { dur: p.length, a: 0.025, d: 0.06, s: 0.9, r: 0.07, glide: p.length * 0.35 };
      for (const det of [-9, 9]) {
        T.osc(hp, at, { ...env, type: 'sawtooth', f: p.pitch * 0.82, to: p.pitch, detune: det, peak: 0.05, trem: rattle });
      }
      T.osc(hp, at, { ...env, type: 'square', f: p.pitch * 0.41, to: p.pitch * 0.5, peak: 0.035, trem: rattle });
    }
  },
};
