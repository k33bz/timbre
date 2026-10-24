// One thunderclap: a close strike is a sharp tearing crack (wideband noise, a hard high-passed sizzle)
// straight into the rolling rumble; far away there is no crack at all, only the low roll arriving
// late. The roll is lowpassed noise whose level swells and falls a few times as echoes off hills and
// cloud reach you, each swell a little lower and darker. Made to be fired at random as a
// soundscape event over rain or sea.
export default {
  id: 'ambience-thunder-strike',
  name: 'Thunder Strike',
  category: 'ambience',
  tags: ['thunder', 'lightning', 'storm', 'weather', 'crack', 'rumble', 'rain', 'nature', 'event'],
  desc: 'A single thunderclap: a close tearing crack rolling into thunder, or a far rumble that arrives late. Fire it now and then over rain or sea for a storm.',
  dur: 9.4,
  family: 'organic',
  moments: ['ambience', 'explosion'],
  params: {
    distance: { min: 0, max: 1, def: 0.35, desc: 'How far the strike is: 0 a crack right overhead, 1 a low rumble from miles away' },
    roll: { min: 0, max: 1, def: 0.6, desc: 'How long and how many times the thunder rolls on after the strike' },
    size: { min: 0, max: 1, def: 0.5, desc: 'How big the storm is: a thin crack and a short grumble up to a deep, heavy roar' },
  },
  play(T, out, t, p) {
    const near = 1 - p.distance;
    // sound arrives after the flash: about 3 s per kilometre, kept short so the event stays usable
    const late = 0.05 + 0.9 * p.distance;
    const at = t + late;
    const room = T.reverb(T.gain(out, 1.4), t, { time: 2.2, mix: 0.25, tone: 0.25 });
    // the crack: a tearing burst of crackle and a wideband slap, only when it is close
    if (near > 0.15) {
      const k = (near - 0.15) / 0.85;
      T.noise(room, at, { filter: 'highpass', f: 1800, q: 0.7, dur: 0.18 + 0.12 * k, peak: 0.11 * k, a: 0.002 });
      T.crackle(room, at, { dur: 0.35 + 0.25 * k, rate: 90, f: 3200, to: 900, spread: 0.8, len: 0.012, peak: 0.12 * k, vary: 0.6 });
      T.noise(room, at, { filter: 'lowpass', f: 900 + 1500 * k, q: 0.6, dur: 0.5, peak: 0.14 * k, a: 0.003 });
    }
    // the roll: three to five swells, each later, lower and darker than the last
    const swells = 3 + Math.round(2 * p.roll);
    const span = 2 + 2.4 * p.roll;
    const lp = 260 + 700 * near * (0.5 + 0.5 * p.size);
    for (let i = 0; i < swells; i++) {
      const u = i / Math.max(1, swells - 1);
      const s0 = at + 0.08 + u * span * T.rand(0.75, 1);
      const len = 0.8 + 1.0 * T.rand(0.6, 1) * (0.6 + 0.4 * p.size);
      const lvl = (0.13 + 0.07 * p.size) * Math.pow(0.72, i) * (0.55 + 0.45 * near) * T.rand(0.8, 1);
      T.noise(room, s0, {
        filter: 'lowpass', f: lp * Math.pow(0.85, i), to: lp * 0.55 * Math.pow(0.85, i), q: 0.8, dur: len,
        peak: lvl, a: 0.12 + 0.2 * u, tail: 0.05, fade: 0.3,
      });
    }
    // the body under it all, felt more than heard
    T.osc(room, at, { f: 42 + 10 * p.size, to: 34, dur: 1.4 + 1.6 * p.roll, peak: 0.05 * (0.5 + 0.5 * p.size), a: 0.04 });
  },
};
