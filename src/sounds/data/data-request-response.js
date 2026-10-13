// A request goes out and an answer comes back: a short rising blip with a tick flies from left to
// right, there is a gap for the latency, then a two-note chime flies back from right to left.
export default {
  id: 'data-request-response',
  name: 'Request / Response',
  category: 'data',
  tags: ['request', 'response', 'latency', 'api', 'call', 'dns', 'roundtrip', 'reply', 'diagram', 'stereo'],
  desc: 'A short rising blip goes out, a pause for the latency, and a soft two-note chime comes back. For an API call, a DNS lookup or any request with a reply.',
  dur: 0.95,
  family: 'soft',
  moments: ['packet'],
  params: {
    pitch: { min: 400, max: 1200, def: 660, unit: 'Hz', desc: 'Pitch of the outgoing request; the reply chime is built on it' },
    latency: { min: 0.05, max: 0.5, def: 0.22, unit: 's', desc: 'Silence between the request and the reply: low a fast cache hit, high a slow server' },
    width: { min: 0, max: 1, def: 0.5, desc: 'How far the request flies out to the right and the reply back to the left: 0 stays centred' },
  },
  play(T, out, t, p) {
    const drift = T.jitter(1, { cents: 10 });
    const f = p.pitch * drift;
    // out: a tick and a quick upward blip, moving from the left to the right
    const go = T.pan(out, t, { x: -p.width, to: p.width, dur: 0.08 });
    T.osc(go, t, { f, to: f * 1.5, glide: 0.05, dur: 0.07, peak: 0.034, a: 0.004 });
    T.tick(go, t, { f: 2600, q: 1, lp: 4500, dur: 0.01, peak: 0.03 });
    // back: a fifth, then the octave, a little warmer and louder than the request, moving right to left
    const at = t + 0.08 + p.latency;
    const back = T.pan(out, at, { x: p.width, to: -p.width, dur: 0.12 });
    T.osc(back, at, { f: f * 1.5, dur: 0.14, peak: 0.04, a: 0.006 });
    T.osc(back, at + 0.07, { f: f * 2, dur: 0.26, peak: 0.046, a: 0.006 });
    T.osc(back, at + 0.07, { f: f * 4.02, dur: 0.1, peak: 0.01, a: 0.006 });
  },
};
