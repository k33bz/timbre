// Signal analysis for the voice checks, in plain JS: decimation, LPC formant estimation and band
// energies. Used by gates/voice.test.mjs to measure what the speech engine renders (nobody can
// listen in a test, so it is measured instead).

/** Lowpass with a windowed-sinc FIR (cutoff in Hz) and keep every `factor`-th sample. */
export function decimate(x, sr, factor, cutoff) {
  const taps = 127;
  const h = new Float64Array(taps);
  const fc = cutoff / sr;
  const mid = (taps - 1) / 2;
  let sum = 0;
  for (let i = 0; i < taps; i++) {
    const k = i - mid;
    const sinc = k === 0 ? 2 * Math.PI * fc : Math.sin(2 * Math.PI * fc * k) / k;
    h[i] = sinc * (0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1)));
    sum += h[i];
  }
  for (let i = 0; i < taps; i++) h[i] /= sum;
  const n = Math.floor(x.length / factor);
  const y = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const c = j * factor;
    let v = 0;
    for (let i = 0; i < taps; i++) {
      const k = c + i - mid;
      if (k >= 0 && k < x.length) v += h[i] * x[k];
    }
    y[j] = v;
  }
  return y;
}

/** LPC coefficients [1, a1..ap] of a frame by the autocorrelation method (Levinson-Durbin). */
export function lpc(frame, order) {
  const n = frame.length;
  const r = new Float64Array(order + 1);
  for (let k = 0; k <= order; k++) {
    let s = 0;
    for (let i = k; i < n; i++) s += frame[i] * frame[i - k];
    r[k] = s;
  }
  r[0] *= 1 + 1e-9;
  const a = new Float64Array(order + 1);
  a[0] = 1;
  let e = r[0];
  for (let i = 1; i <= order; i++) {
    let acc = r[i];
    for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
    const k = -acc / e;
    const prev = a.slice();
    for (let j = 1; j < i; j++) a[j] = prev[j] + k * prev[i - j];
    a[i] = k;
    e *= 1 - k * k;
  }
  return a;
}

/** Roots of z^p + a1 z^(p-1) + ... + ap (Durand-Kerner). Returns [[re, im], ...]. */
export function roots(a) {
  const p = a.length - 1;
  let z = Array.from({ length: p }, (_, k) => {
    const ang = (2 * Math.PI * k) / p + 0.4;
    return [0.9 * Math.cos(ang), 0.9 * Math.sin(ang)];
  });
  const mul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
  const div = (x, y) => { const d = y[0] * y[0] + y[1] * y[1]; return [(x[0] * y[0] + x[1] * y[1]) / d, (x[1] * y[0] - x[0] * y[1]) / d]; };
  const evalp = (x) => { let v = [1, 0]; for (let k = 1; k <= p; k++) { v = mul(v, x); v[0] += a[k]; } return v; };
  for (let it = 0; it < 800; it++) {
    let moved = 0;
    const next = z.map((zi, i) => {
      let den = [1, 0];
      for (let j = 0; j < p; j++) if (j !== i) den = mul(den, [zi[0] - z[j][0], zi[1] - z[j][1]]);
      const step = div(evalp(zi), den);
      moved = Math.max(moved, Math.hypot(step[0], step[1]));
      return [zi[0] - step[0], zi[1] - step[1]];
    });
    z = next;
    if (moved < 1e-12) break;
  }
  return z;
}

/**
 * Formants of a voiced stretch: frames of 30 ms every 10 ms, pre-emphasized and Hamming windowed,
 * LPC of `order`, poles with a bandwidth under maxBw Hz and above 90 Hz, per frame sorted by
 * frequency; the result is the median of each formant across frames: [F1, F2, F3, ...].
 */
export function formants(x, sr, order = 12, maxBw = 500) {
  const fl = Math.round(0.03 * sr);
  const hop = Math.round(0.01 * sr);
  const per = [];
  for (let s = 0; s + fl <= x.length; s += hop) {
    const f = new Float64Array(fl);
    for (let i = 0; i < fl; i++) {
      const v = x[s + i] - (s + i > 0 ? 0.97 * x[s + i - 1] : 0);
      f[i] = v * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (fl - 1)));
    }
    const rs = roots(lpc(f, order));
    const fm = rs.filter((z) => z[1] > 0)
      .map((z) => ({ f: (Math.atan2(z[1], z[0]) * sr) / (2 * Math.PI), bw: (-Math.log(Math.hypot(z[0], z[1])) * sr) / Math.PI }))
      .filter((p) => p.f > 90 && p.bw < maxBw && p.f < sr / 2 - 100)
      .sort((p, q) => p.f - q.f)
      .map((p) => p.f);
    per.push(fm);
  }
  const out = [];
  for (let k = 0; k < 4; k++) {
    const v = per.map((fm) => fm[k]).filter((f) => f != null).sort((p, q) => p - q);
    out.push(v.length ? v[Math.floor(v.length / 2)] : NaN);
  }
  return out;
}

/** Energy of x in each band [lo, hi) Hz by a direct DFT power spectrum over 4096-point frames. */
export function bandEnergy(x, sr, bands) {
  const N = 4096;
  const spec = new Float64Array(N / 2);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  let frames = 0;
  for (let s = 0; s + N <= x.length; s += N / 2) {
    for (let i = 0; i < N; i++) { re[i] = x[s + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))); im[i] = 0; }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) spec[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  const hz = sr / N;
  const total = spec.reduce((a, b) => a + b, 0) || 1;
  const bandsOut = bands.map(([lo, hi]) => {
    let e = 0;
    for (let k = Math.ceil(lo / hz); k < Math.min(N / 2, Math.ceil(hi / hz)); k++) e += spec[k];
    return e / total;
  });
  let c = 0;
  for (let k = 0; k < N / 2; k++) c += k * hz * spec[k];
  return { bands: bandsOut, centroid: c / total, frames };
}

/** In-place radix-2 FFT. */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ar = re[i + j];
        const ai = im[i + j];
        const br = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const bi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ar + br;
        im[i + j] = ai + bi;
        re[i + j + len / 2] = ar - br;
        im[i + j + len / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

/** RMS in dB of x[a..b). */
export function rmsDb(x, a = 0, b = x.length) {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return 10 * Math.log10(s / Math.max(1, b - a) + 1e-30);
}
