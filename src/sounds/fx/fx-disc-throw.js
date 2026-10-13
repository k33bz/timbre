// A thrown identity disc: a swish as it leaves the hand, then a spinning whir that drifts away (its
// pitch falls and fades as it recedes, like a passing siren) while sliding across the stereo field,
// turns, and comes back rising in pitch and loudness until it is caught with a metallic clack. The
// whir is a saw fluttered by the spin plus a narrow band of noise riding the same pitch.
export default {
  id: 'fx-disc-throw',
  name: 'Identity Disc',
  category: 'fx',
  tags: ['disc', 'throw', 'whir', 'doppler', 'spin', 'frisbee', 'catch', 'return', 'stereo'],
  desc: 'A spinning disc is thrown, whirs away with a falling pitch, curves back rising and is caught with a clack. For a projectile that returns, like a boomerang.',
  dur: 1.4,
  family: 'synthetic',
  params: {
    pitch: { min: 400, max: 1200, def: 700, unit: 'Hz', desc: 'Pitch of the whir as it passes by; it falls away and rises back around this' },
    distance: { min: 0.2, max: 0.6, def: 0.35, unit: 's', desc: 'How long the disc flies out before it turns; the way back takes the same time' },
    spin: { min: 14, max: 40, def: 24, unit: 'Hz', desc: 'How fast the disc spins: a slow flutter to a fast buzz' },
    width: { min: 0, max: 1, def: 0.6, desc: 'How far it travels across the stereo field: 0 straight ahead, 1 out wide to one side and back' },
  },
  play(T, out, t, p) {
    const D = p.distance;
    const f = p.pitch;
    const w = p.width;
    // the throw
    T.noise(out, t, { filter: 'bandpass', f: 1800, to: 5000, q: 1.2, dur: 0.09, peak: 0.16, a: 0.006 });
    T.osc(out, t, { f: 180, to: 110, glide: 0.06, dur: 0.08, peak: 0.04, a: 0.004 });
    // out: it recedes, so the pitch falls and the level dies away
    const away = T.pan(out, t, { x: -0.3 * w, to: 0.9 * w, dur: D });
    const outBus = T.bus(away, t, { peak: 1, a: 0.012, dur: D + 0.02, tail: 0.05, fade: 0.04 });
    const whir = { dur: D + 0.03, a: 0.004, s: 1, d: 0.01, r: 0.02 };
    T.osc(outBus, t, Object.assign({ type: 'sawtooth', f: f * 1.12, to: f * 0.78, glide: D, peak: 0.05, trem: { rate: p.spin, depth: 0.7 }, lp: { f: 2600, to: 900, glide: D } }, whir));
    T.noise(outBus, t, Object.assign({ filter: 'bandpass', f: f * 1.6, to: f * 1.1, q: 6, glide: D, peak: 0.3 }, whir));
    // back: it approaches, so the pitch and the level climb until it is in the hand
    const tb = t + D;
    const back = D * 0.95;
    const home = T.pan(out, tb, { x: 0.9 * w, to: 0, dur: back });
    const backBus = T.bus(home, tb, { peak: 1, a: back, dur: back + 0.06 });
    const ret = { dur: back + 0.07, a: 0.004, s: 1, d: 0.01, r: 0.03 };
    T.osc(backBus, tb, Object.assign({ type: 'sawtooth', f: f * 0.78, to: f * 1.3, glide: back, peak: 0.05, trem: { rate: p.spin, depth: 0.7 }, lp: { f: 900, to: 2800, glide: back } }, ret));
    T.noise(backBus, tb, Object.assign({ filter: 'bandpass', f: f * 1.1, to: f * 1.9, q: 6, glide: back, peak: 0.3 }, ret));
    // the catch
    const tc = tb + back;
    T.tick(out, tc, { f: 2600, q: 2.5, dur: 0.02, peak: 0.1, blip: 170, blipTo: 90, blipPeak: 0.07, blipDur: 0.07 });
    T.bell(out, tc + 0.004, { f: 1900, partials: [[1, 1, 1], [2.76, 0.4, 0.5]], dur: 0.2, peak: 0.02 });
  },
};
