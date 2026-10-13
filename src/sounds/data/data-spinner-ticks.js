// A ring of soft ticks, one per step, walking once round a clock face: the pitch is highest at 12
// o'clock and lowest at 6, and the sound sits right of centre at 3 and left at 9. Each play is one
// full turn spread evenly over `turn`, so a host that re-triggers it every `turn` seconds hears an
// unbroken, steady rotation. The tick at the top is a little firmer to mark the start of the turn.
// Round sine blips with only a breath of lowpassed noise: nothing sharp, quiet enough to run for minutes.
export default {
  id: 'data-spinner-ticks',
  name: 'Spinner Ticks',
  category: 'data',
  tags: ['spinner', 'loader', 'loading', 'ticks', 'ring', 'rotate', 'wait', 'pending', 'loop-cell'],
  desc: 'A soft ring of ticks that turns once per play, circling from side to side. Re-trigger every 1.0 s (or at the turn time you set) for a steady spinner.',
  dur: 1.17,
  family: 'soft',
  moments: ['loading'],
  params: {
    steps: { min: 4, max: 12, def: 8, step: 1, desc: 'Ticks in one turn: few a slow clock, many a fine ratchet' },
    turn: { min: 0.6, max: 1.2, def: 1, unit: 's', desc: 'Time for one full turn, which is also the time to re-trigger it' },
    pitch: { min: 330, max: 1000, def: 560, unit: 'Hz', desc: 'Lowest tick, at the bottom of the ring; the top is a fourth higher' },
    tone: { min: 0, max: 1, def: 0.35, desc: 'Edge of each tick: 0 a round bloop, 1 a drier wooden tick' },
    width: { min: 0, max: 1, def: 0.4, desc: 'How far the sound travels left and right round the ring: 0 centred' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.steps);
    const gap = p.turn / n;
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const ang = (2 * Math.PI * k) / n;
      const top = (1 + Math.cos(ang)) / 2;
      const f = T.jitter(p.pitch * Math.pow(2, (5 * top) / 12), { cents: 6 });
      const lv = k === 0 ? 1 : 0.78;
      const spot = T.pan(out, at, { x: p.width * Math.sin(ang) });
      T.osc(spot, at, { f, to: f * 0.88, glide: 0.03, dur: 0.045, peak: 0.032 * lv, a: 0.004 });
      T.osc(spot, at, { f: f * 2, dur: 0.02, peak: 0.006 * lv, a: 0.003 });
      T.tick(spot, at, { f: 2600, q: 1.2, dur: 0.012, peak: (0.004 + 0.026 * p.tone) * lv, lp: 4200 });
    }
  },
};
