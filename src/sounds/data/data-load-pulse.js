// A loader's breath: two soft sines a fifth apart swell and fall as one slow arc (half a sine of
// gain), with a gentle pitch waver on the top one. One play is exactly one breath, silent at both
// ends, so a host can repeat it on a timer for minutes without anything piling up or clicking.
// Slow attack, no transient, and low in the level range on purpose: it must never wear on the ear.
export default {
  id: 'data-load-pulse',
  name: 'Load Pulse',
  category: 'data',
  tags: ['loading', 'loader', 'pulse', 'breathing', 'skeleton', 'dots', 'wait', 'busy', 'soft', 'loop-cell'],
  desc: 'A soft slow breath of sound for a loader that keeps waiting. One breath per play: re-trigger every 0.9 s (or at the breath length you set).',
  dur: 1.22,
  family: 'soft',
  moments: ['loading'],
  params: {
    breath: { min: 0.6, max: 1.2, def: 0.9, unit: 's', desc: 'Length of one breath, which is also the time to re-trigger it' },
    pitch: { min: 220, max: 660, def: 330, unit: 'Hz', desc: 'Note of the breath, with a soft fifth above it' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Warmth: 0 a plain hum, 1 a fuller breath with an octave and a little air' },
    wobble: { min: 0, max: 1, def: 0.5, desc: 'Slow pitch waver through the breath: 0 steady, 1 a gentle sway' },
  },
  play(T, out, t, p) {
    const L = p.breath;
    const f = T.jitter(p.pitch, { cents: 8 });
    // the arc: a gain at rest on 0 that half a sine period lifts to 1 and back, so the breath rises
    // and falls with no corner and ends exactly at silence
    const arc = T.gain(out, 0);
    T.lfo(arc, t, { param: 'gain', rate: 1 / (2 * L), depth: 1, dur: L, a: 0.005 });
    const vib = { rate: 3.2, depth: 4 + 26 * p.wobble };
    T.osc(arc, t, { f, dur: L, peak: 0.022, a: 0.01, s: 1, d: 0.01, r: 0.03, vib });
    T.osc(arc, t, { f: f * 1.5, dur: L, peak: 0.011, a: 0.01, s: 1, d: 0.01, r: 0.03, vib: { rate: 2.6, depth: 6 + 20 * p.wobble } });
    T.osc(arc, t, { type: 'triangle', f: f * 2, dur: L, peak: 0.009 * p.tone, a: 0.01, s: 1, d: 0.01, r: 0.03 });
    T.noise(arc, t, { filter: 'bandpass', f: 2200, q: 0.7, dur: L, peak: 0.012 * p.tone, a: 0.01, s: 1, d: 0.01, r: 0.03 });
  },
};
