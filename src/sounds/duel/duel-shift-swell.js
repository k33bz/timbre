// A shift: an upgrade card slides over the character beneath it. A breathy glide of card on card
// runs under a swell of two detuned reed-like pulses that rise a fifth behind a lowpass that opens,
// then the new card lands with a thud and a bright glass overtone, and the old card's damage stays
// put underneath. The switch plays it the other way, a stack coming apart: the swell sinks a fifth
// and the landing is only a soft tick.
export default {
  id: 'duel-shift-swell',
  name: 'Shift Swell',
  category: 'duel',
  tags: ['ink-duel', 'shift', 'stack', 'upgrade', 'swell', 'rise', 'layer', 'transform', 'card'],
  desc: 'One card sliding over another: a reedy swell that rises a fifth, then a thud and a bright glass overtone as it lands.',
  dur: 0.86,
  family: 'synthetic',
  moments: ['transform'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 shifts up: a rising swell and a bright landing; 0 comes apart: a sinking swell, a soft tick' },
    pitch: { min: 98, max: 220, def: 130.8, unit: 'Hz', desc: 'Root of the swell, which climbs or sinks a fifth from it' },
    swell: { min: 0.2, max: 0.5, def: 0.32, unit: 's', desc: 'Length of the swell before the new card lands' },
    land: { min: 0, max: 1, def: 0.6, desc: 'Weight of the landing: 0 almost none, 1 a firm thud with a bright overtone' },
  },
  play(T, out, t, p) {
    const S = p.swell;
    const up = Math.round(p.up) === 1;
    const a = p.pitch * (up ? 1 : 1.5);
    const b = p.pitch * (up ? 1.5 : 1);
    const stage = T.dcblock(out);
    // the card slides over the one beneath it
    T.noise(stage, t, { filter: 'bandpass', f: up ? 500 : 1500, to: up ? 1500 : 500, q: 1.1, dur: S, peak: 0.08, a: S * 0.6 });
    // the swell: two detuned pulses and an octave triangle glide the fifth behind an opening lowpass
    const lp = T.filter(stage, t, { type: 'lowpass', f: up ? 380 : 2600, to: up ? 2600 : 480, dur: S * 0.95, q: 1.2 });
    const body = { glide: S * 0.95, dur: S + 0.28, a: S * 0.6, s: 0.8, d: 0.05, r: 0.25 };
    T.pulse(lp, t, { ...body, duty: 0.3, f: a, to: b, peak: 0.05, detune: -8 });
    T.pulse(lp, t, { ...body, duty: 0.3, f: a, to: b, peak: 0.045, detune: 8 });
    T.osc(lp, t, { ...body, type: 'triangle', f: a * 2, to: b * 2, peak: 0.03 });
    // the landing: a thud, a dull pat and a glass overtone (a soft tick only when the stack comes apart)
    const at = t + S;
    const w = up ? 1 : 0.3;
    T.osc(stage, at, { f: 125, to: 55, dur: 0.14, peak: 0.1 * p.land * w, a: 0.003 });
    T.noise(stage, at, { filter: 'lowpass', f: 1400, to: 400, q: 0.9, dur: 0.05, peak: 0.07 * p.land * w, a: 0.002 });
    T.bell(stage, at, { f: p.pitch * 8, partials: [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34]], dur: 0.34, peak: 0.05 * p.land * w, a: 0.002 });
    if (!up) T.tick(stage, at, { f: 1800, q: 2, dur: 0.012, peak: 0.04 });
  },
};
