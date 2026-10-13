// Dark on purpose: a low struck bell that sags in pitch, a second bell a tritone away, a detuned
// saw drone under a closing lowpass, and breathy whispers, all in a dim room.
export default {
  id: 'magic-curse-hex',
  name: 'Curse Hex',
  category: 'magic',
  tags: ['curse', 'hex', 'dark', 'debuff', 'evil', 'dread', 'malice'],
  desc: 'A sinister low toll with a sour interval, a sagging drone and creeping whispers. For debuffs and dark spells.',
  dur: 1.8,
  family: 'synthetic',
  moments: ['spell', 'scare'],
  params: {
    pitch: { min: 70, max: 220, def: 110, unit: 'Hz', desc: 'Root note: the saw drone sits here, the tolling bells an octave up' },
    dread: { min: 0, max: 1, def: 0.6, desc: 'Loudness of the sour tritone bell that clashes with the toll' },
    whisper: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the breathy whisper bursts, faint to upfront' },
    space: { min: 0, max: 0.6, def: 0.35, desc: 'Dim room reverb mix, from dry to murky' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 1.2, mix: p.space, tone: 0.25 });
    // the toll, and a bell a tritone above that sours it
    T.bell(room, t, { f: p.pitch * 2, partials: [[1, 1, 1], [2.76, 0.5, 0.7], [5.4, 0.3, 0.5]], drift: 0.96, dur: 1.3, peak: 0.056 });
    T.bell(room, t + 0.06, { f: p.pitch * 2 * 1.4142, partials: [[1, 1, 1], [2.76, 0.4, 0.6]], drift: 0.95, dur: 1.1, peak: 0.01 + 0.035 * p.dread });
    // the drone: two saws a few cents apart, filtered shut as it fades
    const dark = T.filter(room, t, { type: 'lowpass', f: 700, to: 150, dur: 1.2, q: 1.5 });
    T.osc(dark, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 0.9, dur: 1.3, peak: 0.035, a: 0.08, detune: -12, vib: { rate: 4.5, depth: 15 } });
    T.osc(dark, t, { type: 'sawtooth', f: p.pitch, to: p.pitch * 0.9, dur: 1.3, peak: 0.035, a: 0.08, detune: 12 });
    // whispers: short narrow bursts of breath, spaced unevenly
    let at = t + 0.12;
    for (let k = 0; k < 5; k++) {
      T.noise(room, at, { filter: 'bandpass', f: T.rand(1400, 3200), q: 6, dur: T.rand(0.1, 0.2), peak: 0.04 + 0.18 * p.whisper, a: 0.04 });
      at += T.rand(0.1, 0.22);
    }
  },
};
