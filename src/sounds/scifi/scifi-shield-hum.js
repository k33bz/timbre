// A force field powering up: two saws a few cents apart and a square an octave under, through a
// resonant lowpass that opens, with the whole body pulsing at a slow rate.
export default {
  id: 'scifi-shield-hum',
  name: 'Shield Hum',
  category: 'scifi',
  tags: ['shield', 'force-field', 'hum', 'barrier', 'energy', 'activate', 'deflect'],
  desc: 'A throbbing energy hum that swells in as a shield powers up, then settles into a slow pulse.',
  dur: 1.6,
  family: 'synthetic',
  moments: ['shield'],
  params: {
    pitch: { min: 70, max: 200, def: 110, unit: 'Hz', desc: 'Base pitch of the hum; a square sits an octave under, a thin whine high above' },
    pulse: { min: 2, max: 10, def: 5, unit: 'Hz', desc: 'How fast the hum throbs, slow pulse to rapid flutter' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'How far the resonant lowpass opens, and the level of the thin top whine' },
    length: { min: 0.6, max: 1.6, def: 1.2, unit: 's', desc: 'How long the shield hums before fading' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const lp = T.filter(out, t, { type: 'lowpass', f: 150, to: 500 + 2500 * p.bright, dur: 0.35, q: 3 });
    const pulse = { rate: p.pulse, depth: 0.55 };
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch, dur: L, peak: 0.04, a: 0.25, s: 0.85, d: 0.12, r: 0.3, trem: pulse });
    T.osc(lp, t, { type: 'sawtooth', f: p.pitch * 1.006, dur: L, peak: 0.04, a: 0.25, s: 0.85, d: 0.12, r: 0.3, trem: pulse });
    T.osc(lp, t, { type: 'square', f: p.pitch * 0.5, dur: L, peak: 0.03, a: 0.25, s: 0.85, d: 0.12, r: 0.3, trem: pulse });
    // a thin whine on top that brightens with the filter
    T.osc(out, t, { f: p.pitch * 12, dur: L, peak: 0.004 + 0.012 * p.bright, a: 0.3, s: 0.8, d: 0.1, r: 0.3, trem: pulse });
  },
};
