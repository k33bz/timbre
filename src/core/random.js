// Seeded noise.
//
// Every render seeds this generator first, so a render at fixed parameters is reproducible: the
// waveform, the level gate and the copy gate all compare like for like. Live playback may pick a
// fresh seed per play for natural variation.
//
// The generator state lives on the function itself (rand.s), not in a module variable. That keeps
// every helper a single self-contained function, which is what lets Copy lift a helper out with
// Function.prototype.toString() and paste it anywhere without a hidden dependency.

/** Seed the generator for the next render. Any number works; it is reduced to 32 bits. */
export function seed(s) {
  rand.s = (Number(s) || 0) >>> 0;
}

/**
 * Seeded uniform random number (mulberry32).
 * rand() is in [0, 1), rand(x) in [0, x), rand(lo, hi) in [lo, hi).
 * Sounds must use this instead of Math.random so renders stay deterministic.
 */
export function rand(lo, hi) {
  let a = (rand.s = ((rand.s | 0) + 0x6d2b79f5) | 0);
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  const u = ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  if (lo == null) return u;
  if (hi == null) return u * lo;
  return lo + (hi - lo) * u;
}

/**
 * A fresh buffer of white noise drawn from the seeded stream, dur seconds long.
 * Each noise voice draws its own buffer, so two voices in one sound are uncorrelated (a shared
 * buffer would make them sum coherently, several dB hotter than either alone).
 */
export function noiseBuffer(c, dur) {
  const n = Math.max(1, Math.ceil(dur * c.sampleRate));
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = rand() * 2 - 1;
  return b;
}
