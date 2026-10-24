// A big church bell tolled slowly: the deep hum an octave under the strike note, the minor third
// above it that makes a bell sound mournful, the brighter nominal and the clang of the clapper,
// ringing out in a stone room between tolls.
export default {
  id: 'dark-funeral-bell',
  name: 'Funeral Bell',
  category: 'dark',
  tags: ['bell', 'funeral', 'toll', 'church', 'chime', 'mourning', 'gothic', 'dark', 'knell', 'game-over'],
  desc: 'A great low church bell tolling slowly, its hum lingering after each stroke. For a funeral, a death, a game over or the dread of a clock striking an hour.',
  dur: 8.3,
  family: 'metal',
  moments: ['ambience', 'game-over', 'reveal'],
  params: {
    tolls: { min: 2, max: 4, def: 3, step: 1, desc: 'How many times the bell strikes' },
    pitch: { min: 82, max: 165, def: 110, unit: 'Hz', desc: 'Pitch of the strike note: a vast tower bell to a village bell' },
    room: { min: 0.1, max: 0.6, def: 0.35, desc: 'How much the stone hall rings with it' },
  },
  play(T, out, t, p) {
    const hall = T.reverb(out, t, { time: 2.6, mix: p.room, tone: 0.3 });
    const gap = 1.5;
    for (let k = 0; k < Math.round(p.tolls); k++) {
      const at = t + 0.1 + k * gap;
      const v = 1 - 0.1 * k;
      // a bell's partials against its strike note: hum (0.5), prime, the minor third (1.2), fifth,
      // nominal (2) and the higher clang; the hum decays slowest, the high ones die in a second
      T.bell(hall, at, {
        f: p.pitch, dur: 3.6, peak: 0.05 * v, a: 0.004, drift: 0.998,
        partials: [[0.5, 1, 1], [1, 0.9, 0.62], [1.2, 0.6, 0.5], [1.5, 0.28, 0.34], [2, 0.4, 0.26], [2.5, 0.16, 0.14], [3, 0.14, 0.1], [4.1, 0.07, 0.07]],
      });
      // the hum beats slowly against its twin, as in a cast bell that is never quite round
      T.osc(hall, at, { f: p.pitch * 0.5 + 0.7, dur: 3.6, peak: 0.025 * v, a: 0.006 });
      // the clapper: a short dull knock and a bandpassed clang
      T.noise(hall, at, { filter: 'bandpass', f: p.pitch * 3.2, q: 1.2, dur: 0.06, peak: 0.055 * v, a: 0.001 });
      T.noise(hall, at, { filter: 'lowpass', f: 600, q: 0.7, dur: 0.1, peak: 0.08 * v, a: 0.002 });
    }
  },
};
