// A turn timer as a small wooden clock: a crisp escapement tick over a short damped knock, the
// second beat lower (tick, tock). Kept very quiet and short because a countdown repeats it every
// second. Call it with beats = 1 per second, or let it play a tick-tock on its own.
export default {
  id: 'cards-timer-tick',
  name: 'Turn Timer Tick',
  category: 'cards',
  tags: ['timer', 'tick', 'clock', 'countdown', 'turn', 'tock', 'wood'],
  desc: 'A quiet wooden clock tick-tock for a turn timer, small enough to repeat every second.',
  dur: 1.06,
  params: {
    pitch: { min: 700, max: 2400, def: 1500, unit: 'Hz' },
    tone: { min: 0, max: 1, def: 0.5 },
    beats: { min: 1, max: 3, def: 2, step: 1 },
    gap: { min: 0.25, max: 0.5, def: 0.4, unit: 's' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.beats);
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const f = p.pitch * (k % 2 ? 0.76 : 1);
      // tone fades from a soft wooden knock to a crisp click
      T.noise(out, at, { filter: 'bandpass', f: f * 2, to: f * 1.5, q: 3, dur: 0.016, peak: 0.04 + 0.12 * p.tone, a: 0.001 });
      T.osc(out, at, { f, to: f * 0.8, dur: 0.035, peak: 0.02 + 0.014 * (1 - p.tone), a: 0.001 });
    }
  },
};
