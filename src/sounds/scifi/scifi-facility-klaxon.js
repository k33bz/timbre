// An industrial facility klaxon in the spirit of the alarm horns of dystopian sci-fi game levels.
// An original synthesis, voiced from measurements of a reference alarm (not built from it): one
// sustained, steady horn tone (no swoop), its amplitude rattled at a quarter of its pitch (the
// diaphragm buzz that gives the growl), a band of noise rasp that rattles with it, harmonics up
// past 3 kHz with a small presence bump, and a slow swell every two seconds or so where the top
// end dips and comes back. Then a concrete hall.
export default {
  id: 'scifi-facility-klaxon',
  name: 'Facility Klaxon',
  category: 'scifi',
  tags: ['klaxon', 'alarm', 'alert', 'horn', 'siren', 'industrial', 'facility', 'lockdown', 'breach', 'warning', 'dystopian', 'buzzer'],
  desc: 'A sustained, growling industrial alarm horn: a steady buzzing tone with a mechanical rattle and a slow swell, ringing in a concrete hall. For lockdowns, breaches and red alerts.',
  dur: 8.2,
  family: 'synthetic',
  moments: ['warning', 'scare'],
  params: {
    pitch: { min: 280, max: 560, def: 415, unit: 'Hz', desc: 'Horn note; the rattle always runs at a quarter of it' },
    length: { min: 1.5, max: 6, def: 3, unit: 's', desc: 'How long the horn sounds before it cuts off and the hall rings out' },
    rasp: { min: 0, max: 1, def: 0.6, desc: 'Growl: the rattle depth, the noise rasp and the drive, from a clean horn to a ragged one' },
    swell: { min: 0, max: 1, def: 0.5, desc: 'Depth of the slow swell, where the top end dips and returns about every two seconds' },
    space: { min: 0, max: 1, def: 0.4, desc: 'How much of the concrete hall rings around and after the horn' },
  },
  play(T, out, t, p) {
    const L = p.length, rattle = p.pitch / 4;
    const room = T.reverb(out, t, { time: 1.6, mix: 0.08 + 0.32 * p.space, tone: 0.4, pre: 0.015 });
    const hp = T.filter(room, t, { type: 'highpass', f: 90, q: 0.7 });
    // the slow swell: brightness and level breathe together, about 0.5 Hz
    const swellGain = T.gain(hp, 1);
    T.lfo(swellGain, t, { param: 'gain', rate: 0.48, depth: 0.22 * p.swell, dur: L, a: 0.4 });
    const lp = T.filter(swellGain, t, { type: 'lowpass', f: 3000, q: 0.6 });
    T.lfo(lp, t, { param: 'frequency', rate: 0.48, depth: 1500 * p.swell, dur: L, a: 0.4 });
    const presence = T.filter(lp, t, { type: 'peaking', f: 3300, q: 1.2, db: 4 });
    // ref sets the horn's loudness: the drive never passes more than about this, whatever the rasp
    const grit = T.drive(presence, t, { amount: 0.3 + 0.5 * p.rasp, ref: 0.05 });
    const env = { dur: L, a: 0.05, d: 0.08, s: 0.95, r: 0.12 };
    const buzz = { rate: rattle, depth: 0.12 + 0.45 * p.rasp };
    // the horn: a strong sine on the note (the fundamental dominates a real horn), a saw and a
    // square for the harmonics, all rattled at f/4. The saw and square sit 2 cents apart, so
    // their slow beat (about 0.5 Hz at 415 Hz) adds to the swell instead of pulsing on its own
    T.osc(grit, t, { ...env, type: 'sine', f: p.pitch, peak: 0.07, trem: buzz });
    T.osc(grit, t, { ...env, type: 'sawtooth', f: p.pitch, detune: -1, peak: 0.03, trem: buzz });
    T.osc(grit, t, { ...env, type: 'square', f: p.pitch, detune: 1, peak: 0.014, trem: buzz });
    // the rasp: band-passed noise, rattled by the same buzz so it growls with the tone
    const raspGain = T.gain(grit, 1);
    T.lfo(raspGain, t, { param: 'gain', rate: rattle, depth: 0.5 + 0.4 * p.rasp, dur: L });
    T.noise(raspGain, t, { ...env, filter: 'bandpass', f: 2400, q: 0.45, peak: 0.012 + 0.05 * p.rasp });
  },
};
