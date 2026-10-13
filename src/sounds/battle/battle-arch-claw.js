// Claw tears: a few falling bands of noise raked one after another, each a little different, over
// an optional ragged rasp, ending in a plain low thud. The thud is lowpassed noise and a falling
// sine with no smear, so it stays dry enough to sit under an element strike.
export default {
  id: 'battle-arch-claw',
  name: 'Claw Rake',
  category: 'battle',
  tags: ['claw', 'rake', 'tear', 'slash', 'rip', 'attack', 'battle', 'archetype'],
  desc: 'Up to five tearing swipes raked in a row, ending in a low thud. Dry and ragged, so it stacks under any element strike.',
  dur: 0.64,
  moments: ['attack'],
  family: 'air',
  params: {
    claws: { min: 1, max: 5, def: 3, step: 1, desc: 'How many tearing swipes rake across' },
    rake: { min: 0.03, max: 0.09, def: 0.05, unit: 's', desc: 'Time between swipes; short is one ripping rake, long is separate slashes' },
    tear: { min: 0, max: 1, def: 0.5, desc: 'Roughness of the swipes: 0 clean whips of air, 1 a ragged ripping rasp' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Low thud at the end of the rake: 0 a light tap, 1 a solid body' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.claws);
    const last = t + (n - 1) * p.rake;
    for (let k = 0; k < n; k++) {
      T.noise(out, t + k * p.rake, { filter: 'bandpass', f: T.jitter(4200, { cents: 150 }), to: 900, q: 2, dur: 0.09, peak: 0.22, a: 0.004 });
    }
    // the rasp: a crackle of grit across the whole rake
    if (p.tear > 0.02) {
      T.crackle(out, t, { dur: n * p.rake + 0.06, rate: 160, f: 3500, to: 1500, spread: 0.7, q: 1.2, len: 0.005, peak: 0.16 * p.tear });
    }
    // the body behind the last swipe
    T.osc(out, last + 0.03, { f: 130, to: 52, dur: 0.24, peak: 0.04 + 0.07 * p.weight, a: 0.004 });
    T.noise(out, last + 0.03, { filter: 'lowpass', f: 1400, to: 250, q: 1, dur: 0.15, peak: 0.025 + 0.05 * p.weight, a: 0.004 });
  },
};
