// Two cheap singers cover a big song's cost: two soft tilts, a quick wordless "ahh" run split between
// two voices (a buzzing saw shaped by three vowel bands, drifting from one vowel to the next, one on
// each side), two glass ticks for the total and then the song fires free in a flare of gold chimes.
// The run is a plain major arpeggio on syllables with no words; it is not any real tune.
export default {
  id: 'duel-song-rush',
  name: 'Song Rush',
  category: 'duel',
  tags: ['ink-duel', 'song', 'sing', 'voice', 'arpeggio', 'wordless', 'rush', 'free', 'run', 'chimes'],
  desc: 'Two cheap singers tilt and trade a fast, wordless "ahh" run up the scale, then the song fires for free in a bright flare of gold chimes.',
  dur: 2.06,
  family: 'voice',
  moments: ['ability'],
  params: {
    notes: { min: 4, max: 8, def: 6, step: 1, desc: 'How many notes the two voices run up before the song fires' },
    speed: { min: 0.055, max: 0.1, def: 0.075, unit: 's', desc: 'Time per note: low a rapid rush, high a more measured run' },
    vowel: { min: 0, max: 1, def: 0.6, desc: 'Vowel colour: 0 a closed, dark "oo", 1 an open, bright "ah"' },
    pitch: { min: 160, max: 280, def: 200, unit: 'Hz', desc: 'Note the run starts from; the flare chimes are built above it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.notes);
    // two soft tilts: the singers exert
    for (let k = 0; k < 2; k++) {
      const at = t + k * 0.075;
      T.noise(out, at, { filter: 'bandpass', f: 950, to: 520, q: 1.6, dur: 0.05, peak: 0.06, a: 0.003 });
      T.osc(out, at, { type: 'triangle', f: 240 + 20 * k, to: 150, dur: 0.055, peak: 0.026, a: 0.003 });
    }
    // a voice: a saw through three vowel bands (first, second and third formant) that glide to a
    // neighbouring vowel while the note holds; a trace of breath keeps it from sounding like a synth
    const oo = [330, 820, 2600];
    const ah = [800, 1250, 2800];
    const q = [4.5, 5.5, 6.5];
    const lvl = [1, 0.75, 0.4];
    const open = p.vowel;
    const vowel = (at, f, len, dst, side, level) => {
      const lo = [oo[0] + (ah[0] - oo[0]) * open, oo[1] + (ah[1] - oo[1]) * open, oo[2] + (ah[2] - oo[2]) * open];
      for (let k = 0; k < 3; k++) {
        const to = lo[k] * (k === 1 ? 1 + 0.12 * side : 1);
        const band = T.filter(dst, at, { type: 'bandpass', f: lo[k] * (k === 1 ? 1 - 0.12 * side : 1), to, dur: len * 0.8, q: q[k] });
        T.osc(band, at, {
          type: 'sawtooth', f, dur: len, peak: level * lvl[k], a: 0.012, s: 0.75, d: 0.02, r: len * 0.4, vib: { rate: 6.5, depth: 16 },
        });
      }
      T.noise(dst, at, { filter: 'bandpass', f: lo[1], q: 3, dur: len * 0.5, peak: level * 0.02, a: 0.01 });
    };
    const left = T.pan(out, t, { x: -0.45 });
    const right = T.pan(out, t, { x: 0.45 });
    const arp = [0, 4, 7, 12, 16, 19, 24, 28];
    const t0 = t + 0.17;
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(2, arp[k] / 12);
      vowel(t0 + k * p.speed, f, p.speed * 1.5, k % 2 ? right : left, k % 2 ? 1 : -1, 0.19 + 0.01 * k);
    }
    // the total is added up: two small glass ticks
    const tot = t0 + n * p.speed + 0.04;
    T.bell(out, tot, { f: 2200, partials: [[1, 1, 1], [2.32, 0.3, 0.5]], dur: 0.12, peak: 0.025, a: 0.002 });
    T.bell(out, tot + 0.075, { f: 2200, partials: [[1, 1, 1], [2.32, 0.3, 0.5]], dur: 0.12, peak: 0.025, a: 0.002 });
    // the song fires free: a flare of air and a stack of gold glass chimes over a warm swell
    const fire = tot + 0.17;
    T.noise(out, fire, { filter: 'highpass', f: 2500, to: 9000, q: 0.8, dur: 0.4, peak: 0.04, a: 0.06 });
    T.chord(out, fire, { type: 'triangle', root: p.pitch * 2, notes: [0, 7, 12, 16], dur: 0.7, peak: 0.07, a: 0.04 });
    const glassy = [[1, 1, 1], [2.32, 0.38, 0.55], [4.1, 0.14, 0.3]];
    const up = [12, 19, 24, 28];
    for (let k = 0; k < 4; k++) {
      T.bell(out, fire + 0.03 + k * 0.045, { f: p.pitch * 4 * Math.pow(2, (up[k] - 12) / 12), partials: glassy, dur: 0.7, peak: 0.04, a: 0.003 });
    }
  },
};
