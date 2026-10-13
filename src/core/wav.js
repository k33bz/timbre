// WAV export: 16-bit PCM, little endian, the format every editor and engine reads.

/**
 * Encode channels (an array of Float32Array, all the same length) as a 16-bit PCM WAV file.
 * Samples are clamped to [-1, 1] and NaN becomes 0. Returns a Uint8Array.
 */
export function encodeWav(channels, sampleRate) {
  const nch = channels.length;
  const len = nch ? channels[0].length : 0;
  const bytes = len * nch * 2;
  const buf = new ArrayBuffer(44 + bytes);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF');
  v.setUint32(4, 36 + bytes, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);             // fmt chunk size
  v.setUint16(20, 1, true);              // PCM
  v.setUint16(22, nch, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * nch * 2, true);
  v.setUint16(32, nch * 2, true);        // block align
  v.setUint16(34, 16, true);             // bits per sample
  str(36, 'data');
  v.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < nch; c++) {
      let x = channels[c][i];
      x = x > 1 ? 1 : x < -1 ? -1 : x || 0;
      v.setInt16(o, x < 0 ? Math.round(x * 32768) : Math.round(x * 32767), true);
      o += 2;
    }
  }
  return new Uint8Array(buf);
}

/**
 * The channels to save from a render: cut at dur (the level gate proves the sound is below -60
 * dBFS by then), with a 5 ms fade so the cut cannot click, and folded to mono when both channels
 * are identical (every sound without a stereo effect).
 */
export function wavChannels(r) {
  const n = Math.min(r.post[0].length, Math.round(r.dur * r.sr));
  const L = r.post[0].slice(0, n);
  const R = r.post[1].slice(0, n);
  const fade = Math.min(n, Math.round(0.005 * r.sr));
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    L[n - 1 - i] *= g;
    R[n - 1 - i] *= g;
  }
  for (let i = 0; i < n; i++) if (L[i] !== R[i]) return [L, R];
  return [L];
}
