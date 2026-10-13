// A wipe crossing the screen: a band of air that climbs in pitch while it travels from one side to the
// other (panned), a thin bright edge riding its front, and a tiny tick where it lands. Direction only
// flips the pan; width trades a thin hissing line for a broad curtain. Quiet, like the whoosh it is
// kin to, but stereo and always ending on the landing tick.
export default {
  id: 'ui-wipe',
  name: 'Directional Wipe',
  category: 'ui',
  tags: ['wipe', 'reveal', 'curtain', 'shutter', 'iris', 'sweep', 'slide', 'transition'],
  desc: 'A quiet band of air that sweeps across from one side to the other and lands with a tiny tick. For wipes, curtains, shutters and irises uncovering content.',
  dur: 0.65,
  family: 'air',
  moments: ['reveal', 'transition'],
  params: {
    dir: { min: 0, max: 1, def: 1, step: 1, desc: '1 sweeps from left to right, 0 from right to left' },
    length: { min: 0.16, max: 0.6, def: 0.34, unit: 's', desc: 'How long the wipe takes to cross' },
    width: { min: 0, max: 1, def: 0.5, desc: 'Edge softness: 0 a thin hissing line, 1 a broad curtain of air' },
    tick: { min: 0, max: 1, def: 0.5, desc: 'Level of the little tick where the wipe lands, 0 none' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const dir = p.dir >= 0.5 ? 1 : -1;
    const lane = T.pan(out, t, { x: -0.85 * dir, to: 0.85 * dir, dur: L });
    // a narrower band throws more noise away: lift the peak so the loudness holds as width changes
    const q = 3.4 - 2.6 * p.width;
    const lift = Math.sqrt(q / 1.4);
    T.noise(lane, t, { filter: 'bandpass', f: 520, to: 3300, q, dur: L, a: L * 0.45, peak: 0.14 * lift, tail: 0.08, fade: 0.06 });
    // the edge: a thin high shimmer that leads the body
    T.noise(lane, t, { filter: 'highpass', f: 5200, to: 8200, q: 0.8, dur: L * 0.85, a: L * 0.55, peak: 0.022 });
    if (p.tick > 0.02) {
      const end = T.pan(out, t, { x: 0.85 * dir });
      T.tick(end, t + L * 0.9, { f: 3100, q: 2.2, dur: 0.012, peak: 0.1 * p.tick, blip: 1500, blipTo: 1150, blipDur: 0.03, blipPeak: 0.045 * p.tick });
    }
  },
};
