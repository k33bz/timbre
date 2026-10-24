// Wind moving through a long stone hall in slow gusts, old timber creaking now and then, and a few
// whispers far down the corridor, so distant and roomy they are only a feeling of being watched.
export default {
  id: 'dark-haunted-corridor',
  name: 'Haunted Corridor',
  category: 'dark',
  tags: ['haunted', 'corridor', 'wind', 'creak', 'whisper', 'ghost', 'bed', 'hall', 'dark', 'ambience', 'tension'],
  desc: 'Wind drifting down a long empty hall, a creaking board and faint whispers somewhere behind you. For a haunted house, a walk through a ruin or a menu that watches back.',
  dur: 8.0,
  loop: true,
  family: 'air',
  moments: ['ambience', 'tension'],
  params: {
    wind: { min: 0.15, max: 1, def: 0.55, desc: 'How strong the wind blows: low a faint draught, 1 a moaning gale' },
    creaks: { min: 0, max: 1, def: 0.5, desc: 'How often old wood groans: 0 none, 1 a house settling all around' },
    whispers: { min: 0, max: 1, def: 0.4, desc: 'How near the whispers come: 0 none, 1 just behind your ear' },
    length: { min: 5, max: 7, def: 6, unit: 's', desc: 'How long it goes on' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const hall = T.reverb(out, t, { time: 2.2, mix: 0.35, tone: 0.3 });
    // the wind: a steady breath plus gusts, each a band of noise that rises and falls while the
    // band itself slides, so the pitch of the moan wanders
    const gusts = 3 + Math.round(L / 2);
    const slot = (L - 1) / gusts;
    const amp = 0.15 + 0.62 * p.wind * p.wind;
    T.noise(hall, t, { filter: 'bandpass', f: 380, q: 1.4, dur: L - 0.3, peak: amp * 0.35, a: 1.5, s: 1, d: 0.02, r: 1.6, curve: 'lin' });
    for (let k = 0; k < gusts; k++) {
      const at = t + k * slot + T.rand(0, 0.4);
      const len = Math.min(L - 0.3 - (at - t), slot * T.rand(1.5, 2.2));
      const f0 = T.rand(260, 620);
      const f1 = f0 * T.rand(0.6, 1.5);
      const pk = amp * T.rand(0.6, 1);
      if (len < 0.6) continue;
      T.noise(hall, at, { filter: 'bandpass', f: f0, to: f1, q: 3 + 3 * p.wind, dur: len, peak: pk, a: len * 0.45, s: 0.05, d: len * 0.45, r: 0.05, curve: 'lin' });
    }
    // creaks: stick-slip, a run of tiny resonant ticks that speed up and slide in pitch
    const n = Math.round(p.creaks * 4.4);
    for (let k = 0; k < n; k++) {
      const at = t + 0.9 + (k + T.rand(0.1, 0.9)) * ((L - 2.2) / Math.max(1, n));
      const f0 = T.rand(180, 520);
      const slip = Math.round(T.rand(7, 14));
      const dir = T.rand() < 0.5 ? 1 : -1;
      let x = 0;
      for (let j = 0; j < slip; j++) {
        const gap = 0.045 - 0.025 * (j / slip) + T.rand(0, 0.012);
        const f = f0 * (1 + dir * 0.5 * (j / slip));
        x += gap;
        T.tick(hall, at + x, { f: f * 2, q: 14, dur: 0.02, peak: 0.6 * Math.sin(Math.PI * (j + 0.7) / (slip + 0.4)) * T.rand(0.7, 1), blip: f, blipPeak: 0.03, blipDur: 0.03 });
      }
    }
    // whispers: unvoiced speech through a lowpass and a deeper, darker room of its own
    if (p.whispers > 0.01) {
      const w = T.reverb(T.filter(hall, t, { type: 'lowpass', f: 3200, q: 0.5 }), t, { time: 1.8, mix: 0.6, tone: 0.2 });
      const g = 0.01 + 0.06 * p.whispers * p.whispers;
      T.speak(w, t + 1.3, { text: 'stay with us', voice: 'whisper', pitch: -2, rate: 0.62, peak: g, fx: false });
      T.speak(w, t + 1.3 + (L - 4) * 0.55, { text: 'turn around', voice: 'whisper', pitch: -4, rate: 0.55, peak: g * 0.7, fx: false });
    }
  },
};
