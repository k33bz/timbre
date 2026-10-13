// An agent calls a tool: a short blip bending up as the request leaves, a faint thread of tone that
// rises while it waits, and then the answer. A good result is one clear glass ding; a failed one is
// a soft two-step drop, muted so it informs without alarming.
export default {
  id: 'ai-tool-call',
  name: 'Tool Call',
  category: 'ai',
  tags: ['ai', 'tool', 'tool-call', 'function', 'invoke', 'result', 'agent', 'request', 'response', 'api'],
  desc: 'A small blip as a request goes out, a short wait, then the answer: a clear glass ding when the call works, a soft low drop when it fails.',
  dur: 1,
  family: 'glass',
  moments: ['tool-call'],
  params: {
    ok: { min: 0, max: 1, def: 1, step: 1, desc: 'Result of the call: 1 a clear ding, 0 a soft low drop for a failure' },
    latency: { min: 0.06, max: 0.5, def: 0.18, unit: 's', desc: 'How long the call takes before the answer lands' },
    pitch: { min: 500, max: 1400, def: 880, unit: 'Hz', desc: 'Note of the answer; the request blip and the failure drop sit around it' },
  },
  play(T, out, t, p) {
    const lat = p.latency;
    const at = t + 0.07 + lat;
    // the request leaves
    T.osc(out, t, { f: p.pitch * 0.7, to: p.pitch * 1.05, glide: 0.02, dur: 0.045, peak: 0.028, a: 0.003 });
    // the wait: a faint thread of tone climbing toward the answer
    T.osc(out, t + 0.07, { f: p.pitch * 0.5, to: p.pitch * 0.96, glide: lat, dur: lat, peak: 0.011, a: Math.min(0.03, lat * 0.4), s: 1, d: 0.01, r: 0.03 });
    if (Math.round(p.ok) === 1) {
      T.bell(out, at, { f: p.pitch, partials: [[1, 1, 1], [2, 0.28, 0.55], [3.01, 0.1, 0.3]], dur: 0.42, peak: 0.047, a: 0.003 });
    } else {
      T.osc(out, at, { type: 'triangle', f: p.pitch * 0.55, to: p.pitch * 0.5, dur: 0.16, peak: 0.055, a: 0.006, lp: p.pitch * 1.3 });
      T.osc(out, at + 0.12, { type: 'triangle', f: p.pitch * 0.44, to: p.pitch * 0.38, dur: 0.22, peak: 0.055, a: 0.006, lp: p.pitch * 1.3 });
    }
  },
};
