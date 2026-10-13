// A packet crossing a diagram: one tiny sine blip per hop, each a step up a pentatonic scale while
// it slides across the stereo field, then a soft tick and a low "tok" where it lands on its node.
// The steps stay on one scale so a dozen packets in flight blend into a pattern instead of
// clashing, and every level sits near the bottom of the range because it fires again and again.
export default {
  id: 'data-packet-hop',
  name: 'Packet Hop',
  category: 'data',
  tags: ['packet', 'hop', 'network', 'node', 'diagram', 'request', 'blip', 'data', 'traffic', 'stereo'],
  desc: 'A tiny blip hops from node to node, climbing a scale step per hop as it crosses the stereo field, and lands with a soft tick. Quiet enough to fire every few hundred milliseconds.',
  dur: 0.3,
  family: 'soft',
  moments: ['packet'],
  params: {
    pitch: { min: 500, max: 1600, def: 880, unit: 'Hz', desc: 'Pitch of the first hop; every later hop climbs one step of a scale' },
    hops: { min: 1, max: 4, def: 2, step: 1, desc: 'How many hops before the packet lands' },
    travel: { min: -1, max: 1, def: 0.6, desc: 'How far it crosses the stereo field: positive left to right, negative right to left, 0 stays centred' },
    tone: { min: 0, max: 1, def: 0.4, desc: 'Color of each blip: 0 a round, muted sine, 1 a glassier one with a bright overtone' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.hops);
    const gap = 0.055;
    const steps = [0, 2, 4, 7, 9];
    // one seeded drift for the whole packet, so the tenth packet is not a copy of the first
    const drift = T.jitter(1, { cents: 14 });
    const hopPitch = (k) => p.pitch * drift * Math.pow(2, steps[k] / 12);
    const place = (k) => p.travel * (-1 + (2 * k) / n);
    for (let k = 0; k < n; k++) {
      const at = t + k * gap;
      const g = T.pan(out, at, { x: place(k), to: place(k + 1), dur: gap });
      const f = hopPitch(k);
      T.osc(g, at, { f, dur: 0.075, peak: 0.03, a: 0.004 });
      T.osc(g, at, { f: f * 2, dur: 0.04, peak: 0.012 * p.tone, a: 0.004 });
    }
    // the landing: an octave under the last hop, a hair of noise on top
    const land = t + n * gap;
    const f = hopPitch(n - 1) / 2;
    const g = T.pan(out, land, { x: place(n) });
    T.tick(g, land, { f: 2800, q: 1, lp: 4500, dur: 0.012, peak: 0.05, blip: f, blipTo: f * 0.9, blipPeak: 0.03, blipDur: 0.06, jitter: 0.5 });
  },
};
