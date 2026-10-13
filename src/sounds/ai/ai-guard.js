// A guardrail verdict. Allowed: one small clear glass ding. Blocked: a dull low thud (a falling sine
// with a muffled knock) and a short, muted buzz, firm without being a siren. One switch, the pass role.
export default {
  id: 'ai-guard',
  name: 'Guardrail Verdict',
  category: 'ai',
  tags: ['ai', 'guardrail', 'verdict', 'validation', 'allow', 'block', 'safety', 'moderation', 'check', 'pass'],
  desc: 'A check on what an AI is about to do: a small clear ding when it is allowed, a dull thud with a short low buzz when it is blocked.',
  dur: 0.32,
  family: 'soft',
  moments: ['verdict'],
  params: {
    pass: { min: 0, max: 1, def: 1, step: 1, role: 'pass', desc: 'Verdict: 1 allowed with a clear ding, 0 blocked with a thud and buzz' },
    pitch: { min: 800, max: 1800, def: 1174.66, unit: 'Hz', desc: 'Pitch of the ding; the blocked thud and buzz sit well below it' },
    edge: { min: 0, max: 1, def: 0.5, desc: 'How firm it is: a brighter ding when allowed, a rougher buzz when blocked' },
  },
  play(T, out, t, p) {
    if (Math.round(p.pass) === 1) {
      T.bell(out, t, { f: p.pitch, partials: [[1, 1, 1], [2, 0.12 + 0.3 * p.edge, 0.5], [3, 0.08, 0.3]], dur: 0.3, peak: 0.055, a: 0.003 });
    } else {
      const f = p.pitch * 0.17;
      // the thud: a sine falling an octave with a muffled knock on top
      T.osc(out, t, { f, to: f * 0.5, glide: 0.1, dur: 0.18, peak: 0.085, a: 0.003 });
      T.noise(out, t, { filter: 'lowpass', f: 600, q: 0.7, dur: 0.05, peak: 0.25, a: 0.002 });
      // the buzz: two close saws through a lowpass with a fast level flutter
      const lp = T.filter(out, t, { type: 'lowpass', f: 700, q: 0.8 });
      const buzz = { type: 'sawtooth', dur: 0.22, peak: 0.045, a: 0.01, s: 0.7, d: 0.03, r: 0.08, trem: { rate: 30, depth: 0.2 + 0.6 * p.edge } };
      T.osc(lp, t + 0.03, Object.assign({ f: f * 0.8 }, buzz));
      T.osc(lp, t + 0.03, Object.assign({ f: f * 0.83 }, buzz));
    }
  },
};
