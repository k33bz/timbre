// A spiral: a ring of filtered air that circles the listener faster and faster while its pitch
// climbs (or falls, for a pull inward). Each turn is its own panned sweep of noise, shorter than the
// last, overlapped so the circle never breaks; a thin whistle with a swirl vibrato rides above and a
// small accent closes it (a glint on the way out, a low gulp on the way in). magic-portal-open is a
// long reverberant gateway; this is a short dry transition.
export default {
  id: 'fx-vortex-spiral',
  name: 'Vortex Spiral',
  category: 'fx',
  tags: ['vortex', 'spiral', 'swirl', 'whirl', 'tunnel', 'zoom', 'transition', 'sweep'],
  desc: 'Air circling faster and faster around you as the pitch climbs, or falls on the way in. For spiral transitions, vortex pulls and tunnel zooms.',
  dur: 1.2,
  family: 'air',
  moments: ['transition', 'teleport'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 spirals up and out with a rising pitch, 0 is pulled in with a falling one' },
    length: { min: 0.45, max: 0.9, def: 0.7, unit: 's', desc: 'How long the spiral takes' },
    turns: { min: 2, max: 6, def: 4, step: 1, desc: 'How many times it circles from side to side' },
    pitch: { min: 200, max: 600, def: 300, unit: 'Hz', desc: 'Low end of the sweep; the other end sits three octaves above' },
    swirl: { min: 0, max: 1, def: 0.5, desc: 'Focus of the air: 0 a broad rush, 1 a thin whistling ring' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const n = Math.round(p.turns);
    const up = p.up >= 0.5;
    const f0 = p.pitch;
    const f1 = p.pitch * 8;
    // pitch of the spiral a fraction u of the way through; the pull runs it backwards
    const pitchAt = (u) => f0 * Math.pow(f1 / f0, up ? u : 1 - u);
    // turn boundaries: the first turn is the longest, each one after it tighter
    const edge = (k) => 1 - Math.pow(1 - k / n, 1.5);
    const q = 2.5 + 7 * p.swirl;
    const lift = Math.sqrt(q / 4);
    // the swell shared by every turn: it builds toward the end of the spiral
    const swell = T.bus(out, t, { a: L * 0.55, s: 1, d: 0.01, r: 0.2, dur: L + 0.22 });
    for (let k = 0; k < n; k++) {
      const at = t + L * edge(k);
      const seg = L * (edge(k + 1) - edge(k));
      const side = k % 2 === 0 ? -1 : 1;
      const ring = T.pan(swell, at, { x: 0.8 * side, to: -0.8 * side, dur: seg * 1.25 });
      T.noise(ring, at, {
        filter: 'bandpass', f: pitchAt(edge(k)), to: pitchAt(Math.min(1, edge(k + 1) + 0.12)), q,
        dur: Math.min(seg * 2.2, L + 0.22 - L * edge(k)), a: seg * 0.5, peak: 0.3 * lift,
      });
    }
    // the whistle riding above the ring
    T.osc(swell, t, {
      type: 'triangle', f: up ? f0 * 2 : f1, to: up ? f1 * 1.2 : f0 * 2, dur: L, a: L * 0.6, peak: 0.035,
      vib: { rate: 5 + 2 * n, depth: 60 },
    });
    // the accent at the end
    if (up) {
      T.bell(out, t + L * 0.98, { f: 1760, partials: [[1, 1, 1], [2.7, 0.3, 0.4]], dur: 0.2, peak: 0.03, a: 0.003 });
    } else {
      T.osc(out, t + L * 0.98, { f: 190, to: 70, dur: 0.18, peak: 0.07, a: 0.008 });
    }
  },
};
