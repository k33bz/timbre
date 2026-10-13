// Gears meshing: a run of tiny ticks from two gears of different size (alternating a lower and a
// higher click) that speeds up and slows down with the spin, an extra clunk on every third tooth,
// and a servo whine underneath that climbs with the speed and winds back down. The whine is two
// sustained voices handing over at the top of the spin, so the pitch rises and falls without a seam.
export default {
  id: 'fx-gear-whir',
  name: 'Gear Whir',
  category: 'fx',
  tags: ['gear', 'cog', 'mechanical', 'servo', 'whir', 'motor', 'ratchet', 'settings'],
  desc: 'A little set of gears spinning up and winding down: meshing ticks over a rising and falling servo whine. For settings cogs, machinery and mechanical loaders.',
  dur: 0.96,
  family: 'mechanical',
  moments: ['refresh'],
  params: {
    length: { min: 0.3, max: 0.9, def: 0.55, unit: 's', desc: 'How long the gears spin' },
    teeth: { min: 8, max: 28, def: 16, step: 1, desc: 'How many ticks the gears make: few a slow clunking turn, many a fine whir' },
    pitch: { min: 110, max: 320, def: 180, unit: 'Hz', desc: 'Resting pitch of the servo whine, which climbs about four times higher at full spin' },
    whine: { min: 0, max: 1, def: 0.5, desc: 'Level of the servo whine under the ticks, 0 leaves only the gears' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const n = Math.round(p.teeth);
    // tick times: the spin speeds up and slows down (a hump), so ticks bunch in the middle
    const M = 200;
    const cum = [0];
    for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + 0.35 + 0.65 * Math.sin((Math.PI * (i - 0.5)) / M));
    let at = 0;
    for (let k = 0; k < n; k++) {
      const goal = ((k + 0.5) / n) * cum[M];
      while (at < M - 1 && cum[at + 1] < goal) at++;
      const u = (at + (goal - cum[at]) / (cum[at + 1] - cum[at])) / M;
      const when = t + 0.02 + (L - 0.04) * u;
      const big = k % 2 === 1;
      T.tick(out, when, { f: big ? 3100 : 2200, q: 3, dur: 0.007, peak: 0.15, jitter: 0.4, blip: big ? 620 : 900, blipPeak: 0.012, blipDur: 0.012 });
      if (k % 3 === 2) T.tick(out, when, { f: 900, q: 1.4, dur: 0.012, peak: 0.08, blip: 160, blipTo: 110, blipPeak: 0.02, blipDur: 0.03 });
    }
    // engage and release
    T.tick(out, t, { f: 800, q: 1.2, dur: 0.02, peak: 0.06, blip: 150, blipTo: 100, blipPeak: 0.05, blipDur: 0.05 });
    T.tick(out, t + L - 0.03, { f: 700, q: 1.2, dur: 0.015, peak: 0.04, blip: 140, blipTo: 100, blipPeak: 0.03, blipDur: 0.04 });
    if (p.whine > 0.02) {
      const w = 0.03 * p.whine;
      T.pulse(out, t, {
        duty: 0.3, f: p.pitch, to: p.pitch * 4, glide: L * 0.46, dur: L * 0.56, peak: w, a: L * 0.2, s: 1, d: 0.01, r: L * 0.1, lp: 2600,
      });
      T.pulse(out, t + L * 0.46, {
        duty: 0.3, f: p.pitch * 4, to: p.pitch * 1.5, dur: L * 0.54, peak: w, a: L * 0.1, s: 1, d: 0.01, r: L * 0.3, lp: 2600,
      });
    }
  },
};
