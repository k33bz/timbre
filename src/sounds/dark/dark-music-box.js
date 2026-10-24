// A tiny tine music box playing an original minor phrase that is slightly out of tune and running
// down: every gap grows and the pitch sags toward the end, as a spring unwinds. The phrase is a
// fixed list of semitones above the root; the winding down is computed per note position.
export default {
  id: 'dark-music-box',
  name: 'Music Box',
  category: 'dark',
  tags: ['music-box', 'lullaby', 'winding-down', 'creepy', 'toy', 'haunted', 'dark', 'minor', 'eerie', 'tension'],
  desc: 'A small music box plays a faltering minor-key tune, slightly sour, slowing and sagging as its spring runs out. For a haunted nursery or a quiet scare.',
  dur: 6.8,
  family: 'metal',
  moments: ['scare', 'music', 'tension'],
  params: {
    key: { min: -5, max: 5, def: 0, step: 1, unit: 'st', desc: 'Transposes the tune' },
    wind: { min: 0, max: 1, def: 0.6, desc: 'How far it runs down: 0 steady, 1 a slow stall with the pitch sagging' },
    detune: { min: 0, max: 1, def: 0.4, desc: 'How sour the tines are: 0 true, 1 clearly out of tune' },
    room: { min: 0, max: 0.6, def: 0.3, desc: 'How much empty room rings around it' },
  },
  play(T, out, t, p) {
    // semitones above the root (A5 at key 0): an original phrase that climbs, hangs and sinks
    const tune = [0, 3, 7, 12, 10, 7, 3, 5, 7, 3, 2, 0, -2, 0];
    const n = tune.length;
    const root = T.note('A5') * Math.pow(2, p.key / 12);
    const room = T.reverb(out, t, { time: 1.8, mix: p.room, tone: 0.55 });
    // each tine of the comb has its own fixed error, drawn first so the phrase never reshuffles
    const tines = tune.map(() => T.rand(-1, 1));
    const wobble = tune.map(() => T.rand(-1, 1));
    let when = t;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      const run = p.wind * u * u;
      const cents = tines[k] * 38 * p.detune + wobble[k] * 6 - 130 * run;
      const f = root * Math.pow(2, tune[k] / 12) * Math.pow(2, cents / 1200);
      const last = k === n - 1;
      // a tine is a bar: stretched upper partials that die fast
      T.bell(room, when, {
        f, dur: last ? 1.5 : 0.95 + 0.7 * run, peak: 0.085,
        partials: [[1, 1, 1], [2.02, 0.18, 0.35], [4.1, 0.1, 0.2], [6.3, 0.05, 0.12]], drift: 1 - 0.004 * run,
      });
      T.tick(room, when, { f: 5200, q: 1.2, dur: 0.008, peak: 0.02 });
      when += 0.27 * (1 + 1.7 * p.wind * u * u * u + 0.25 * p.wind * u);
    }
  },
};
