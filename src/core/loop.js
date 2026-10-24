// Loops and soundscapes. A bed (an ambience sound marked loop: true) is written as one swell with a
// fade at each end, so it cannot be looped as it is. seamless() cuts a loop out of a long render of
// it: it finds the steady span between the fades by its short-term level, then crossfades the span's
// continuation into its head with an equal-power curve, so the last sample of the loop flows into
// the first. A soundscape layers such loops with events: one-shot sounds fired at random intervals
// (thunder, a creak, a bell), each with a fresh seed so no two are alike.
//
// Browser only (OfflineAudioContext). Every function here is self-contained, like the helpers, so
// Copy can carry them by their source text: constants are defaults inside each function.

/**
 * Cut a seamless loop out of a rendered bed. channels: Float32Array per channel (same length), sr:
 * the sample rate. o: max (longest loop kept, s, default 12), xfade (crossfade s, default 2),
 * margin (s kept clear inside the steady span, default 0.25), range (dB under the median level a
 * half-second window may sit and still count as steady, default 4: the windows are long enough
 * that a fade never passes for steady).
 * Returns { channels, start, length, xfade } (seconds), or null when the render has no steady span
 * long enough for a 3 s loop.
 */
export function seamless(channels, sr, o) {
  o = o || {};
  const max = o.max == null ? 12 : o.max;
  const xf = o.xfade == null ? 2 : o.xfade;
  const margin = o.margin == null ? 0.25 : o.margin;
  const range = o.range == null ? 4 : o.range;
  const n = channels[0].length;
  const win = Math.max(1, Math.round(0.5 * sr));
  const nw = Math.floor(n / win);
  const lv = new Float64Array(nw);
  for (let w = 0; w < nw; w++) {
    let e = 0;
    for (const ch of channels) for (let i = w * win; i < (w + 1) * win; i++) e += ch[i] * ch[i];
    lv[w] = e / (win * channels.length);
  }
  const sorted = Array.from(lv).filter((v) => v > 1e-12).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const floor = sorted[Math.floor(sorted.length / 2)] * Math.pow(10, -range / 10);
  let a = 0;
  while (a < nw && lv[a] < floor) a++;
  let b = nw - 1;
  while (b > a && lv[b] < floor) b--;
  const start = (a + 1) * win + Math.round(margin * sr);
  const end = b * win - Math.round(margin * sr);
  const avail = end - start;
  if (avail < 3 * sr) return null;
  const X = Math.round(Math.min(xf, (avail / sr) * 0.2) * sr);
  const N0 = Math.min(Math.round(max * sr), avail - X);
  // The loop point. A noise bed joins anywhere, but a sustained tone crossfaded against itself out
  // of phase cancels (a drone dipped 3 dB). So search the last half second of lengths for the one
  // whose continuation best matches the head (normalized cross-correlation over 50 ms, coarse in
  // steps of 4 samples, then refined), and keep the longest loop on a tie.
  const look = Math.round(0.05 * sr);
  const corr = (N, step) => {
    let ab = 0, aa = 0, bb = 0;
    for (const ch of channels) {
      for (let i = 0; i < look; i += step) {
        const x = ch[start + i];
        const y = ch[start + N + i];
        ab += x * y; aa += x * x; bb += y * y;
      }
    }
    return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
  };
  const lo = Math.max(Math.round(3 * sr), N0 - Math.round(0.5 * sr));
  let N = N0;
  let best = corr(N0, 2);
  for (let c = N0 - 4; c >= lo; c -= 4) { const r = corr(c, 2); if (r > best + 1e-3) { best = r; N = c; } }
  for (let c = N + 3; c >= N - 3; c--) { if (c >= lo && c <= N0) { const r = corr(c, 1); if (r > best) { best = r; N = c; } } }
  // How alike the two passages are across the whole crossfade decides its curve: equal power for
  // unrelated material (noise), closer to equal gain as they correlate, so the sum keeps its power
  let ab = 0, aa = 0, bb = 0;
  for (const ch of channels) {
    for (let i = 0; i < X; i += 2) { const x = ch[start + i]; const y = ch[start + N + i]; ab += x * y; aa += x * x; bb += y * y; }
  }
  const rho = Math.min(1, Math.max(-0.5, aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0));
  const out = channels.map((ch) => {
    const y = new Float32Array(N);
    for (let i = 0; i < N; i++) y[i] = ch[start + i];
    // the head blends in from the span's own continuation past N: at i = 0 it is that
    // continuation alone (so sample N - 1 flows into it), at i = X the head alone
    for (let i = 0; i < X; i++) {
      const th = (Math.PI / 2) * (i / X);
      const gi = Math.sin(th);
      const go = Math.cos(th);
      const k = 1 / Math.sqrt(1 + rho * Math.sin(2 * th));
      y[i] = (ch[start + i] * gi + ch[start + N + i] * go) * k;
    }
    return y;
  });
  return { channels: out, start: start / sr, length: N / sr, xfade: X / sr, match: rho };
}

/**
 * Render a loopable sound offline, before the master chain (the live chain applies it), and cut a
 * seamless loop from it. play is the sound's play(T, out, t, p); p its parameter values (a sound
 * with a length parameter gets it raised to o.render, default 18 s, so the steady span is long);
 * seedValue seeds the render. Resolves to an AudioBuffer for context c, or null (see seamless).
 */
export function loopBuffer(c, T, play, p, seedValue, o) {
  o = o || {};
  const sr = c.sampleRate;
  const render = o.render == null ? 18 : o.render;
  const q = Object.assign({}, p);
  if (q.length != null) q.length = render;
  const oc = new OfflineAudioContext(2, Math.ceil((render + 1) * sr), sr);
  const g = oc.createGain();
  g.channelCount = 2;
  g.channelCountMode = 'explicit';
  g.channelInterpretation = 'speakers';
  g.connect(oc.destination);
  T.seed(seedValue == null ? 1 : seedValue);
  play(T, g, 0, q);
  return oc.startRendering().then((b) => {
    const cut = seamless([b.getChannelData(0), b.getChannelData(1)], sr, o);
    if (!cut) return null;
    const out = c.createBuffer(2, cut.channels[0].length, sr);
    out.getChannelData(0).set(cut.channels[0]);
    out.getChannelData(1).set(cut.channels[1]);
    out.xfade = cut.xfade;
    return out;
  });
}

/**
 * Play a soundscape into dest (a master chain's input): layers of
 *   { kind: 'bed', play, p, seed, level }                  looped for as long as it plays
 *   { kind: 'event', play, p, seed, level, every: [lo, hi], vary: { param: [lo, hi] } }
 *                                                          fired every lo..hi seconds, each time
 *                                                          with a new seed and the vary params drawn
 * o: level (overall, default 1), fade (fade in s, default 2), when (earliest start, s).
 * Returns { ready (a Promise: every bed rendered and playing), stop(fade), setLevel(i, v), layers }.
 * Events schedule themselves a few seconds ahead with timers; stop() ends them and fades the beds.
 */
export function soundscape(c, dest, layers, T, o) {
  o = o || {};
  const fade = o.fade == null ? 2 : o.fade;
  const bus = c.createGain();
  bus.gain.value = 0;
  bus.connect(dest);
  const t0 = Math.max(c.currentTime + 0.05, o.when || 0);
  bus.gain.setValueAtTime(0, t0);
  bus.gain.linearRampToValueAtTime(o.level == null ? 1 : o.level, t0 + fade);
  let live = true;
  const timers = [];
  const sources = [];
  // the schedule's own generator, so firing times never disturb the sounds' seeded noise
  let st = ((o.seed == null ? 7 : o.seed) * 2654435761) >>> 0;
  const r = () => {
    st = (st + 0x6d2b79f5) | 0;
    let a = Math.imul(st ^ (st >>> 15), st | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
  const gains = layers.map((L) => {
    const g = c.createGain();
    g.gain.value = L.level == null ? 1 : L.level;
    g.connect(bus);
    return g;
  });
  const beds = [];
  layers.forEach((L, i) => {
    if (L.kind === 'event') {
      const lo = (L.every && L.every[0]) || 6;
      const hi = (L.every && L.every[1]) || lo * 2;
      let count = 0;
      let next = t0 + 0.5 + r() * (lo + hi) * 0.5;
      const tick = () => {
        if (!live) return;
        // keep about 4 s of events scheduled ahead of the clock
        while (next < c.currentTime + 4) {
          const q = Object.assign({}, L.p);
          for (const k in L.vary || {}) q[k] = L.vary[k][0] + (L.vary[k][1] - L.vary[k][0]) * r();
          T.seed((L.seed || 1) + 7919 * ++count);
          L.play(T, gains[i], Math.max(next, c.currentTime + 0.02), q);
          next += lo + (hi - lo) * r();
        }
        timers.push(setTimeout(tick, 1000));
      };
      tick();
    } else {
      beds.push(loopBuffer(c, T, L.play, L.p, L.seed, L.loop).then((buf) => {
        if (!buf || !live) return;
        const s = c.createBufferSource();
        s.buffer = buf;
        s.loop = true;
        s.connect(gains[i]);
        // start each bed at its own point in the loop, so beds of one length never pulse together
        s.start(Math.max(t0, c.currentTime + 0.02), r() * buf.duration);
        sources.push(s);
      }));
    }
  });
  return {
    ready: Promise.all(beds),
    layers: gains,
    setLevel(i, v) { if (gains[i]) gains[i].gain.setTargetAtTime(Math.max(0, v), c.currentTime, 0.05); },
    stop(f) {
      if (!live) return;
      live = false;
      timers.forEach(clearTimeout);
      const now = c.currentTime;
      const d = f == null ? 1.5 : Math.max(0.02, f);
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + d);
      sources.forEach((s) => s.stop(now + d + 0.05));
      setTimeout(() => bus.disconnect(), (d + 0.5) * 1000);
    },
  };
}
