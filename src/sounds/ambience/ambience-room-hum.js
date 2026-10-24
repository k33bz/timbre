// Two slightly detuned sawtooths at mains pitch under a lowpass (the buzz), a sine an octave up for
// body, and a soft lowpassed hiss for ventilation. A slow tremolo keeps the hum from sitting still.
export default {
  id: 'ambience-room-hum',
  name: 'Room Tone Hum',
  category: 'ambience',
  tags: ['room-tone', 'hum', 'electrical', 'mains', 'hvac', 'indoor', 'office', 'bed'],
  desc: 'A quiet indoor bed: electrical hum with its buzzing harmonics over a breath of ventilation hiss.',
  dur: 8,
  loop: true,
  family: 'mechanical',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 50, max: 120, def: 60, unit: 'Hz', desc: 'Mains hum frequency, with a soft sine an octave above it' },
    buzz: { min: 0, max: 1, def: 0.4, desc: 'Brightness of the sawtooth buzz: 0 dull hum, 1 bright buzzy harmonics' },
    air: { min: 0, max: 1, def: 0.5, desc: 'Ventilation hiss: 0 none, 1 full' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1, L * 0.25);
    const body = T.filter(out, t, { type: 'lowpass', f: 250 + 1400 * p.buzz, q: 0.7, dur: 0.1 });
    T.osc(body, t, {
      type: 'sawtooth', f: p.pitch, detune: -4, dur: L, peak: 0.022, a: fade, s: 1, d: 0.02, r: fade,
      trem: { rate: 0.35, depth: 0.25 },
    });
    T.osc(body, t, { type: 'sawtooth', f: p.pitch, detune: 5, dur: L, peak: 0.014, a: fade, s: 1, d: 0.02, r: fade });
    T.osc(out, t, { f: p.pitch * 2, dur: L, peak: 0.01, a: fade, s: 1, d: 0.02, r: fade });
    T.noise(out, t, {
      filter: 'lowpass', f: 900, q: 0.7, dur: L, peak: 0.07 * p.air, a: fade, s: 1, d: 0.02, r: fade,
    });
  },
};
