// An industrial facility klaxon in the spirit of the alarm horns of dystopian sci-fi game levels.
// An original synthesis, voiced from measurements of a reference alarm (not built from it): a
// steady horn tone (a dominant fundamental over saw and square harmonics), its amplitude rattled
// at a quarter of its pitch (the diaphragm buzz that gives the growl), a band of noise rasp that
// rattles with it, a small presence bump near 3.3 kHz and a slow swell in level and brightness.
// It sounds in blasts with a breath between them, each catching its note with a 50 ms spin-up
// like a horn's motor, then rings out in a concrete hall.
export default {
  id: 'scifi-facility-klaxon',
  name: 'Facility Klaxon',
  category: 'scifi',
  tags: ['klaxon', 'alarm', 'alert', 'horn', 'siren', 'industrial', 'facility', 'lockdown', 'breach', 'warning', 'dystopian', 'buzzer'],
  desc: 'A growling industrial alarm horn in three blasts: a steady buzzing tone with a mechanical rattle, ringing in a concrete hall. For lockdowns, breaches and red alerts.',
  dur: 8.4,
  family: 'synthetic',
  moments: ['warning', 'scare'],
  params: {
    pitch: { min: 280, max: 560, def: 415, unit: 'Hz', desc: 'Horn note; the rattle always runs at a quarter of it' },
    blasts: { min: 1, max: 4, def: 3, step: 1, desc: 'How many blasts sound, with a 0.4 s breath between them' },
    length: { min: 0.4, max: 1.2, def: 0.8, unit: 's', desc: 'Length of each blast' },
    rasp: { min: 0, max: 1, def: 0.6, desc: 'Growl: the rattle depth, the noise rasp and the drive, from a clean horn to a ragged one' },
    space: { min: 0, max: 1, def: 0.4, desc: 'How much of the concrete hall rings around and after the horn' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.blasts), L = p.length, gap = 0.4;
    const span = n * L + (n - 1) * gap, rattle = p.pitch / 4;
    const room = T.reverb(out, t, { time: 1.6, mix: 0.08 + 0.32 * p.space, tone: 0.4, pre: 0.015 });
    const hp = T.filter(room, t, { type: 'highpass', f: 90, q: 0.7 });
    // a gentle slow swell across the whole alarm: level and brightness breathe together
    const swellGain = T.gain(hp, 1);
    T.lfo(swellGain, t, { param: 'gain', rate: 0.48, depth: 0.11, dur: span, a: 0.3 });
    const lp = T.filter(swellGain, t, { type: 'lowpass', f: 3000, q: 0.6 });
    T.lfo(lp, t, { param: 'frequency', rate: 0.48, depth: 750, dur: span, a: 0.3 });
    const presence = T.filter(lp, t, { type: 'peaking', f: 3300, q: 1.2, db: 4 });
    // ref sets the horn's loudness: the drive never passes more than about this, whatever the rasp
    const grit = T.drive(presence, t, { amount: 0.3 + 0.5 * p.rasp, ref: 0.05 });
    // the rasp path, rattled at the same rate as the tone for the whole alarm
    const raspGain = T.gain(grit, 1);
    T.lfo(raspGain, t, { param: 'gain', rate: rattle, depth: 0.5 + 0.4 * p.rasp, dur: span });
    const buzz = { rate: rattle, depth: 0.12 + 0.45 * p.rasp };
    for (let k = 0; k < n; k++) {
      const at = t + k * (L + gap);
      const env = { dur: L, a: 0.03, d: 0.06, s: 0.95, r: 0.08 };
      // the spin-up: each blast starts 3% flat and catches its note within 50 ms
      const spin = { f: p.pitch * 0.97, to: p.pitch, glide: 0.05 };
      // a strong sine on the note (the fundamental dominates a real horn), a saw and a square for
      // the harmonics, all rattled at f/4; the saw and square sit 2 cents apart so their slow beat
      // joins the swell instead of pulsing on its own
      T.osc(grit, at, { ...env, ...spin, type: 'sine', peak: 0.07, trem: buzz });
      T.osc(grit, at, { ...env, ...spin, type: 'sawtooth', detune: -1, peak: 0.03, trem: buzz });
      T.osc(grit, at, { ...env, ...spin, type: 'square', detune: 1, peak: 0.014, trem: buzz });
      T.noise(raspGain, at, { ...env, filter: 'bandpass', f: 2400, q: 0.45, peak: 0.012 + 0.05 * p.rasp });
    }
  },
};
