// A polite klaxon: a triangle (with a little saw for edge) swooping between two notes, legato,
// through a lowpass and a short echo so it warns without startling.
export default {
  id: 'scifi-alert-siren',
  name: 'Soft Alert Siren',
  category: 'scifi',
  tags: ['alert', 'siren', 'alarm', 'warning', 'caution', 'klaxon', 'notification'],
  desc: 'A gentle two-tone siren that swoops between notes: a warning that gets attention without startling.',
  dur: 2.3,
  family: 'synthetic',
  moments: ['warning'],
  params: {
    pitch: { min: 350, max: 900, def: 520, unit: 'Hz', desc: 'Lower of the two siren notes' },
    cycles: { min: 1, max: 3, def: 2, step: 1, desc: 'How many up-and-back siren cycles play' },
    interval: { min: 3, max: 12, def: 7, step: 1, unit: 'st', desc: 'Gap between the two siren notes, narrow to wide' },
    rate: { min: 0.15, max: 0.3, def: 0.22, unit: 's', desc: 'Time per swoop: short a hurried alarm, long a slow wail' },
    tone: { min: 600, max: 4000, def: 1800, unit: 'Hz', desc: 'Lowpass cutoff: low a muffled siren, high a brighter, edgier one' },
  },
  play(T, out, t, p) {
    const echo = T.delay(out, t, { time: 0.11, fb: 0.25, mix: 0.2, tone: 2500 });
    const lp = T.filter(echo, t, { type: 'lowpass', f: p.tone, q: 0.7 });
    const hi = p.pitch * Math.pow(2, Math.round(p.interval) / 12);
    const n = Math.round(p.cycles) * 2;
    for (let k = 0; k < n; k++) {
      const up = k % 2 === 0;
      const at = t + k * p.rate;
      const a = up ? p.pitch : hi;
      const b = up ? hi : p.pitch;
      // each swoop runs a hair past its slot so neighbours overlap and the line stays legato
      T.osc(lp, at, { type: 'triangle', f: a, to: b, glide: p.rate, dur: p.rate + 0.03, peak: 0.075, a: 0.03, s: 0.85, d: 0.04, r: 0.04 });
      T.osc(lp, at, { type: 'sawtooth', f: a, to: b, glide: p.rate, dur: p.rate + 0.03, peak: 0.02, a: 0.03, s: 0.85, d: 0.04, r: 0.04 });
    }
  },
};
