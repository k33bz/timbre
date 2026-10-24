// A cymbal or saw bowed slowly: the inharmonic partials of struck metal, each in a pair a hair apart
// so it beats, swelling in one by one under a rasp of bow noise, cold and unearthly in a big room.
export default {
  id: 'dark-bowed-metal',
  name: 'Bowed Metal',
  category: 'dark',
  tags: ['bowed', 'metal', 'cymbal', 'saw', 'eerie', 'cold', 'drone', 'bed', 'dark', 'ambience', 'tension'],
  desc: 'A slow, singing swell of bowed metal, shimmering and beating against itself. For something wrong in the room, a cold ghostly presence or an unearthly menu.',
  dur: 7.2,
  family: 'metal',
  moments: ['ambience', 'tension'],
  params: {
    pitch: { min: 110, max: 440, def: 196, unit: 'Hz', desc: 'Pitch of the lowest ring: a big gong to a small cold bell' },
    strain: { min: 0, max: 1, def: 0.4, desc: 'How hard the bow digs: 0 few pure partials, 1 many partials and a gritty scrape' },
    length: { min: 4, max: 7, def: 6, unit: 's', desc: 'How long the swell lasts' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const room = T.reverb(out, t, { time: 2.4, mix: 0.3, tone: 0.45 });
    const ratios = [1, 2.76, 5.4, 8.93, 13.34, 18.64];
    const count = 3 + Math.round(3 * p.strain);
    for (let k = 0; k < count; k++) {
      const fk = p.pitch * ratios[k];
      if (fk > 7500) continue;
      const lvl = 0.05 / (1 + 0.75 * k);
      // each partial wakes later and breathes at its own rate; the pair beats at 0.2 to 1.1 Hz
      const late = k * 0.28;
      const beatHz = 0.2 + 0.18 * k * (1 + p.strain);
      for (let s = 0; s < 2; s++) {
        T.osc(room, t + late, {
          f: fk + s * beatHz, dur: L - late, peak: lvl * (s ? 0.8 : 1), a: L * 0.42, s: 1, d: 0.02, r: L * 0.3,
          vib: { rate: 0.5 + 0.17 * k, depth: 5 },
          trem: { rate: 0.18 + 0.07 * k, depth: 0.35 },
        });
      }
    }
    // the bow itself: a narrow band of noise riding on the first partials, louder as the strain rises
    const rasp = 0.01 + 0.05 * p.strain * p.strain;
    T.noise(room, t, { filter: 'bandpass', f: p.pitch * 2.76, q: 9, dur: L - 0.2, peak: rasp, a: L * 0.4, s: 1, d: 0.02, r: L * 0.3, curve: 'lin' });
    T.noise(room, t, { filter: 'bandpass', f: p.pitch * 5.4, q: 7, dur: L - 0.2, peak: rasp * 0.7, a: L * 0.45, s: 1, d: 0.02, r: L * 0.3, curve: 'lin' });
  },
};
