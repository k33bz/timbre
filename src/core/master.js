// The master chain every sound plays through, live, offline and in Copy:
//   gain 0.55 -> DynamicsCompressor used purely as a LIMITER (-12 dB, knee 6, 12:1, 3 ms attack,
//   120 ms release) -> a tanh WaveShaper as a hard CEILING -> dest.
// The compressor handles sums of voices. The shaper is instantaneous, so a biquad transient (a fast
// filter sweep over noise can spike about 8 dB above the voice's own peak) cannot slip past during
// the compressor's 3 ms attack. y = 0.5 * tanh(2x) has unity slope at zero, so quiet material is
// untouched, and a hard asymptote at +/-0.5 (-6 dBFS). The ceiling is a guard, never the sound:
// the level gate fails any sound whose pre-limiter peak comes within 3 dB of full scale.
// Ported unchanged from the Deck Lab viewer (sfxChain), where these numbers were level-tested.

/** Build the master chain into dest (default c.destination). Returns its input node. */
export function master(c, dest) {
  const g = c.createGain();
  const lim = c.createDynamicsCompressor();
  const sat = c.createWaveShaper();
  g.gain.value = 0.55;
  lim.threshold.value = -12;
  lim.knee.value = 6;
  lim.ratio.value = 12;
  lim.attack.value = 0.003;
  lim.release.value = 0.12;
  const n = 2048;
  const cur = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const x = (k * 2) / (n - 1) - 1;
    cur[k] = 0.5 * Math.tanh(2 * x);
  }
  sat.curve = cur;
  sat.oversample = '2x';
  g.connect(lim);
  lim.connect(sat);
  sat.connect(dest || c.destination);
  return g;
}
