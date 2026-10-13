// A field check answering, deliberately light enough to repeat as someone types. Pass is two quick
// pips stepping up, the way a tick mark flicks into place; block is two short pips stepping down
// with a faint buzz in them, a small shake of the head. Both are a fraction of the error buzz in
// length and level, so a form with many fields can say "no" without scolding.
export default {
  id: 'ui-verdict',
  name: 'Field Verdict',
  category: 'ui',
  tags: ['verdict', 'valid', 'invalid', 'validation', 'pass', 'block', 'field', 'guardrail', 'check'],
  desc: 'Two quick pips stepping up for a valid field, two short buzzing pips stepping down for an invalid one. Light enough to play on every keystroke check.',
  dur: 0.21,
  family: 'soft',
  moments: ['verdict'],
  params: {
    pass: { min: 0, max: 1, def: 1, step: 1, role: 'pass', desc: '1 plays the two rising pips for valid, 0 the two buzzing falling pips for invalid' },
    pitch: { min: 500, max: 1000, def: 740, unit: 'Hz', desc: 'Note of the first pip; the second sits a third above (valid) or below (invalid)' },
    rough: { min: 0, max: 1, def: 0.5, desc: 'How buzzy the invalid pips are: 0 smooth, 1 a light rattle (valid ignores it)' },
  },
  play(T, out, t, p) {
    if (p.pass >= 0.5) {
      T.osc(out, t, { type: 'triangle', f: p.pitch, dur: 0.07, peak: 0.036, a: 0.004 });
      T.osc(out, t + 0.06, { type: 'triangle', f: p.pitch * 1.26, dur: 0.1, peak: 0.036, a: 0.004 });
      T.tick(out, t, { f: 4200, q: 1.2, dur: 0.008, peak: 0.01 });
    } else {
      // a minor third down, through a lowpass so there is no edge, only a little roughness
      const lp = T.filter(out, t, { type: 'lowpass', f: 1700, q: 0.7 });
      const buzz = { rate: 40, depth: 0.6 * p.rough };
      T.osc(lp, t, { type: 'triangle', f: p.pitch, dur: 0.075, peak: 0.039, a: 0.004, trem: buzz });
      T.osc(lp, t + 0.085, { type: 'triangle', f: p.pitch * 0.84, to: p.pitch * 0.8, dur: 0.11, peak: 0.039, a: 0.004, trem: buzz });
    }
  },
};
