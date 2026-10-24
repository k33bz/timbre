// The hit when something appears: a violent string stab, a drum blow and a crack of noise landing
// together, then a short ringing tail in the room.
export default {
  id: 'dark-jump-scare',
  name: 'Jump Scare',
  category: 'dark',
  tags: ['jump', 'scare', 'stab', 'hit', 'shock', 'horror', 'sting', 'dark', 'stinger', 'sudden'],
  desc: 'An instant, violent stab of strings and drum with a ringing tail. For something leaping out of the dark or a sudden shock.',
  dur: 2.3,
  family: 'impact',
  moments: ['scare', 'critical', 'reveal'],
  params: {
    punch: { min: 0, max: 1, def: 0.6, desc: 'How hard it lands: 0 a dull thump under the strings, 1 a cracking blow' },
    pitch: { min: 300, max: 900, def: 520, unit: 'Hz', desc: 'Pitch of the string stab' },
    tail: { min: 0.3, max: 1, def: 0.6, desc: 'How long the shock rings on in the room' },
  },
  play(T, out, t, p) {
    const room = T.reverb(T.gain(out, 0.43), t, { time: 0.8 + 1.2 * p.tail, mix: 0.2 + 0.25 * p.tail, tone: 0.5 });
    const notes = [0, 1, 6, 7];
    for (let k = 0; k < notes.length; k++) {
      const f = p.pitch * Math.pow(2, notes[k] / 12);
      T.bow(room, t, {
        f, players: 3, body: 0.8, bright: 0.9, pressure: 0.95, vib: 10, dur: 0.5 + 0.7 * p.tail, a: 0.01,
        r: 0.3 + 0.5 * p.tail, peak: 0.1,
      });
    }
    T.membrane(room, t, { kind: 'taiko', f: 70, dur: 0.9, peak: 0.1 + 0.1 * p.punch, stick: p.punch, boom: 0.8 });
    // the crack
    T.noise(room, t, { filter: 'highpass', f: 1200, q: 0.7, dur: 0.12, a: 0.001, peak: 0.05 + 0.2 * p.punch });
  },
};
