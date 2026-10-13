// A song sung: a short rising phrase of "ah" voices (a sawtooth pair through three formant bands,
// with a slow vibrato and a scoop into each note), then a glass bell where the song lights up. The
// voices are the same plain kind of synthesis as the other Ink Duel tones, not the speech engine.
export default {
  id: 'duel-chorus-cast',
  name: 'Chorus Cast',
  category: 'duel',
  tags: ['ink-duel', 'sing', 'song', 'chorus', 'choir', 'voices', 'ahh', 'vocal', 'bell'],
  desc: 'A character singing a song: a short rising phrase of soft "ah" voices that ends in a glass bell as the song lights up.',
  dur: 1.35,
  family: 'soft',
  moments: ['ability'],
  params: {
    pitch: { min: 180, max: 440, def: 262, unit: 'Hz', desc: 'Starting note of the sung phrase, which climbs a major arpeggio' },
    notes: { min: 2, max: 4, def: 3, step: 1, desc: 'How many notes the phrase climbs before the bell' },
    breath: { min: 0, max: 1, def: 0.35, desc: 'Airiness of the voices: 0 pure and clear, 1 breathy' },
    shine: { min: 0, max: 1, def: 0.6, desc: 'Level of the glass bell where the song lights up, 0 none' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.notes);
    const ladder = [0, 4, 7, 12];
    const gap = 0.15;
    const room = T.reverb(out, t, { time: 0.9, mix: 0.2, tone: 0.45 });
    // vowel "ah": three formant bands (Hz, Q, level) that every voice is filtered through
    const bands = [[720, 3, 0.1], [1100, 4, 0.08], [2500, 6, 0.04]];
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const f = p.pitch * Math.pow(2, ladder[k] / 12);
      const len = k === n - 1 ? 0.5 : 0.3;
      // a gentle lowpass keeps the saws from buzzing: the vowel sits in the formants, not the top
      const soft = T.filter(room, at, { type: 'lowpass', f: 3200, q: 0.7 });
      const voice = T.bus(soft, at, { peak: 1, a: 0.04, dur: len, s: 0.85, d: 0.06, r: 0.12 });
      for (const b of bands) {
        const fl = T.filter(voice, at, { type: 'bandpass', f: b[0], q: b[1] });
        for (const d of [-9, 9]) {
          T.osc(fl, at, { type: 'sawtooth', f: f * 0.97, to: f, glide: 0.05, dur: len, peak: b[2] * 0.5, a: 0.03, s: 1, d: 0.01, r: 0.06, detune: d, vib: { rate: 5.5, depth: 12 } });
        }
      }
      // breath: a little air on the vowel
      T.noise(voice, at, { filter: 'bandpass', f: 1500, q: 1.2, dur: len, peak: 0.07 * p.breath, a: 0.05, s: 1, d: 0.01, r: 0.06 });
    }
    // where the song lights up: a glass bell three octaves above the root
    const lit = t + (n - 1) * gap + 0.07;
    T.bell(room, lit, { f: p.pitch * 8, partials: [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34]], dur: 0.6, peak: 0.06 * p.shine, a: 0.003 });
  },
};
