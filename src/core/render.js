// Offline rendering and measurement: the one code path behind the gallery's waveforms and badges,
// Save WAV, the level gate and the gallery side of the copy gate. Browser only (OfflineAudioContext).
import { T } from './t.js';

export const SAMPLE_RATE = 48000;
// Rendered past dur so the level gate can prove the sound is silent by then (see measure().tail).
export const TAIL = 0.25;
// WARM-UP. Chrome's DynamicsCompressor starts cold: on a new chain its gain ramps from about -8 dB
// to its steady makeup (+5.4 dB with these settings) over roughly 150 ms (measured offline with a
// steady sine). A click rendered at t = 0 measured -28.8 dBFS; the same click on a warm chain plays
// at -15.7. So every render builds the chain at 0 and starts the sound at PREROLL, and the outputs
// begin there. Live playback and Copy apply the same rule: a chain never plays before it is
// PREROLL seconds old.
export const PREROLL = 0.2;
// The master chain's settings (master.js), as data for the catalog and the docs. master() keeps its
// own literals so Copy can lift it as one self-contained function; a unit test holds the two equal.
export const MASTER_CHAIN = {
  gain: 0.55,
  limiter: { threshold: -12, knee: 6, ratio: 12, attack: 0.003, release: 0.12 },
  ceiling: { curve: '0.5 * tanh(2x)', points: 2048, oversample: '2x', maxDbfs: -6 },
};

/** Parameter values for a sound: its defaults, overridden by `over`, clamped to each range. */
export function paramsFor(sound, over) {
  const p = {};
  const defs = sound.params || {};
  for (const k of Object.keys(defs)) {
    const d = defs[k];
    let v = over && over[k] != null ? Number(over[k]) : d.def;
    if (!isFinite(v)) v = d.def;
    p[k] = Math.min(d.max, Math.max(d.min, v));
  }
  return p;
}

/**
 * Render one sound offline through the real master chain (warmed for PREROLL seconds), for dur +
 * TAIL seconds from the sound's start. Resolves to { id, sr, dur, post: [L, R], pre: [L, R] }:
 * post is the master chain's output (what you hear), pre is the signal after the master gain and
 * before the limiter (what the voices sum to). Both start at the sound's start and are forced to
 * stereo so mono and stereo sounds measure alike.
 */
export function renderSound(sound, over, seedValue, sampleRate) {
  const sr = sampleRate || SAMPLE_RATE;
  const skip = Math.round(PREROLL * sr);
  const c = new OfflineAudioContext(4, skip + Math.ceil((sound.dur + TAIL) * sr), sr);
  c.destination.channelInterpretation = 'discrete';
  const stereo = () => {
    const g = c.createGain();
    g.channelCount = 2;
    g.channelCountMode = 'explicit';
    g.channelInterpretation = 'speakers';
    return g;
  };
  const postIn = stereo();
  const preIn = stereo();
  const out = T.master(c, postIn);
  out.connect(preIn);
  const post = c.createChannelSplitter(2);
  const pre = c.createChannelSplitter(2);
  const merge = c.createChannelMerger(4);
  postIn.connect(post);
  preIn.connect(pre);
  post.connect(merge, 0, 0);
  post.connect(merge, 1, 1);
  pre.connect(merge, 0, 2);
  pre.connect(merge, 1, 3);
  merge.connect(c.destination);
  T.seed(seedValue == null ? 1 : seedValue);
  sound.play(T, out, skip / sr, paramsFor(sound, over));
  return c.startRendering().then((b) => ({
    id: sound.id, sr, dur: sound.dur,
    post: [b.getChannelData(0).subarray(skip), b.getChannelData(1).subarray(skip)],
    pre: [b.getChannelData(2).subarray(skip), b.getChannelData(3).subarray(skip)],
  }));
}

/**
 * Levels of a render, in dBFS rounded to 0.1 (-120 stands for silence):
 *   peak   highest sample after the master chain (either channel)
 *   rms    RMS over the audible span (first to last sample above -60 dBFS)
 *   dc     mean over the audible span (an offset would read close to the peak)
 *   pre    highest sample before the limiter (null when the render has no pre tap)
 *   tail   highest sample after dur (must be below -60: dur covers the sound)
 *   start, end  the audible span in seconds; clipped = samples above -1 dBFS; nan = NaN samples
 * Self-contained on purpose: the copy gate injects this exact function into a blank page.
 */
export function measure(r) {
  const sr = r.sr;
  const L = r.post[0];
  const R = r.post[1] || r.post[0];
  const n = L.length;
  const cut = Math.min(n, Math.round(r.dur * sr));
  const db = (v) => (v > 0 ? Math.max(-120, Math.round(200 * Math.log10(v)) / 10) : -120);
  let pk = 0;
  let i0 = -1;
  let i1 = -1;
  let tail = 0;
  let clipped = 0;
  let nan = 0;
  for (let i = 0; i < n; i++) {
    const x = L[i];
    const y = R[i];
    if (x !== x || y !== y) { nan++; continue; }
    const a = x < 0 ? -x : x;
    const b = y < 0 ? -y : y;
    const m = a > b ? a : b;
    if (m > pk) pk = m;
    if (m > 0.001) { if (i0 < 0) i0 = i; i1 = i; }
    if (i >= cut && m > tail) tail = m;
    if (m > 0.8913) clipped++;
  }
  let s = 0;
  let s2 = 0;
  const cnt = i0 < 0 ? 0 : i1 - i0 + 1;
  for (let i = Math.max(0, i0); cnt && i <= i1; i++) {
    s += (L[i] + R[i]) / 2;
    s2 += (L[i] * L[i] + R[i] * R[i]) / 2;
  }
  let pre = 0;
  if (r.pre) {
    for (let c = 0; c < r.pre.length; c++) {
      const ch = r.pre[c];
      for (let i = 0; i < ch.length; i++) { const a = ch[i] < 0 ? -ch[i] : ch[i]; if (a > pre) pre = a; }
    }
  }
  return {
    peak: db(pk), rms: db(cnt ? Math.sqrt(s2 / cnt) : 0), dc: db(cnt ? Math.abs(s / cnt) : 0),
    pre: r.pre ? db(pre) : null, tail: db(tail),
    start: i0 < 0 ? 0 : Math.round((1000 * i0) / sr) / 1000,
    end: i0 < 0 ? 0 : Math.round((1000 * (i1 + 1)) / sr) / 1000,
    clipped, nan, silent: i0 < 0,
  };
}
