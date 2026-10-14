// Speech and babble: a formant synthesizer computed sample by sample into an AudioBuffer, so a line
// renders the same in the gallery, the level gate and a pasted Copy, through the normal master chain.
//
// The synthesizer follows D. H. Klatt, "Software for a cascade/parallel formant synthesizer", JASA
// 67(3), 1980: a voicing source and aspiration excite a cascade of resonators (a nasal pole and zero,
// then F1 to F5) for vowels and voiced sounds; frication excites a parallel bank (F2 to F6 and a
// bypass) for fricatives and bursts. A resonator is y[n] = A x[n] + B y[n-1] + C y[n-2] with
// C = -exp(-2 pi BW T), B = 2 exp(-pi BW T) cos(2 pi F T), A = 1 - B - C; the nasal zero is its
// inverse. The source is a smooth glottal flow pulse (a polynomial open phase, as in Klatt and Klatt
// 1990), differenced for the radiation at the lips. Vowel targets: Peterson and Barney (1952), men,
// and a voice's own table for another talker (the female announcer: the women's averages);
// durations: the inherent and minimum durations and rules of Klatt (1979); consonants coarticulate
// with their vowel by locus equations (F2 onset = k F2 vowel + (1 - k) locus, Sussman et al. 1991).
// Written from those publications, with no code or data from any other speech engine.
//
// speak and babble are what sounds call; utter and chatter are the engines under them (a baked Copy
// carries only those). With out = null they schedule nothing and return the end time. No local here
// reuses a helper's name: Copy finds a helper's dependencies by name.
import { rand } from './random.js';
import { phonemize } from './phonetics.js';

/**
 * The phoneme inventory (40 ARPAbet phonemes), built once. A vowel: F [F1, F2, F3] and, for a
 * diphthong, G the target it glides to. A consonant: kind ('glide', 'nasal', 'fric', 'stop', 'affr',
 * 'asp'), its locus L [F1, F2, F3], k how far F2 and F3 move toward its vowel, and for an obstruent
 * the noise level lev, spectrum sp [bypass, A2..A6 in dB, A6 pole Hz] and a stop's burst ms. Both:
 * voiced, inh and min (inherent and minimum ms, Klatt 1979).
 */
export function phones() {
  if (phones.t) return phones.t;
  const t = {};
  // [inh, min, F1, F2, F3, end F1, F2, F3]: Peterson and Barney; AX the neutral tube; EY and OW start
  // at the /e/ and /o/ of Hillenbrand et al. (1995), AY and AW at an open central [a]
  const V = {
    IY: [155, 55, 270, 2290, 3010], IH: [135, 40, 390, 1990, 2550], EH: [150, 70, 530, 1840, 2480],
    AE: [230, 80, 660, 1720, 2410], AH: [140, 60, 520, 1190, 2390], AA: [240, 100, 730, 1090, 2440],
    AO: [240, 100, 570, 840, 2410], UH: [160, 60, 440, 1020, 2240], UW: [210, 70, 300, 870, 2240],
    ER: [180, 80, 490, 1350, 1690], AX: [120, 60, 500, 1500, 2500],
    EY: [180, 100, 476, 2089, 2691, 350, 2200, 2850], AY: [250, 150, 750, 1300, 2500, 420, 1950, 2550],
    AW: [260, 100, 750, 1300, 2500, 450, 1000, 2300], OW: [220, 80, 497, 910, 2459, 380, 880, 2250],
    OY: [280, 150, 570, 840, 2410, 420, 1950, 2550],
  };
  for (const k in V) {
    const v = V[k];
    t[k] = { vowel: 1, voiced: 1, inh: v[0], min: v[1], F: [v[2], v[3], v[4]], G: v.length > 5 ? [v[5], v[6], v[7]] : null };
  }
  // noise spectra: labial low and diffuse, labiodental and dental flat, alveolar high (S), palatal
  // around F3 (SH), velar compact at F2
  const lab = [-20, 0, -6, -12, -18, -99, 6000];
  const labF = [0, -99, -99, -99, -14, -8, 7500];
  const den = [0, -99, -99, -99, -12, -6, 6500];
  const alv = [-20, -99, -99, -99, -14, 0, 6000];
  const pal = [-26, -99, 0, -2, -8, -16, 4500];
  const stopAlv = [-12, -99, -99, -14, -6, 0, 4800];
  const vel = [-18, 0, -5, -14, -99, -99, 6000];
  const C = (n, kind, voiced, inh, min, L, k, lev, sp, burst) => {
    t[n] = { kind, voiced, inh, min, L, k, lev: lev || 0, sp: sp || null, burst: burst || 0 };
  };
  C('W', 'glide', 1, 80, 60, [290, 610, 2150], 0.15);
  C('Y', 'glide', 1, 80, 40, [260, 2070, 3020], 0.15);
  C('R', 'glide', 1, 80, 30, [310, 1060, 1380], 0.2);
  C('L', 'glide', 1, 80, 40, [310, 1050, 2880], 0.25);
  C('M', 'nasal', 1, 70, 60, [470, 1000, 2200], 0.4);
  C('N', 'nasal', 1, 60, 50, [470, 1700, 2600], 0.35);
  C('NG', 'nasal', 1, 95, 60, [470, 2100, 2600], 0.6);
  C('F', 'fric', 0, 100, 80, [300, 1000, 2200], 0.7, 0.09, labF);
  C('V', 'fric', 1, 60, 40, [300, 1000, 2200], 0.7, 0.07, labF);
  C('TH', 'fric', 0, 90, 60, [300, 1400, 2600], 0.5, 0.08, den);
  C('DH', 'fric', 1, 50, 30, [300, 1400, 2600], 0.5, 0.06, den);
  C('S', 'fric', 0, 105, 60, [300, 1750, 2700], 0.4, 1, alv);
  C('Z', 'fric', 1, 75, 40, [300, 1750, 2700], 0.4, 0.6, alv);
  C('SH', 'fric', 0, 105, 80, [300, 1900, 2400], 0.4, 2.6, pal);
  C('ZH', 'fric', 1, 70, 40, [300, 1900, 2400], 0.4, 1.5, pal);
  C('HH', 'asp', 0, 80, 20, [500, 1500, 2500], 1, 0.22);
  C('P', 'stop', 0, 85, 50, [200, 1000, 2200], 0.8, 0.45, lab, 8);
  C('B', 'stop', 1, 85, 60, [200, 1000, 2200], 0.8, 0.3, lab, 5);
  C('T', 'stop', 0, 75, 50, [200, 1930, 2700], 0.43, 0.45, stopAlv, 12);
  C('D', 'stop', 1, 75, 50, [200, 1930, 2700], 0.43, 0.3, stopAlv, 8);
  C('K', 'stop', 0, 80, 60, [200, 2060, 2500], 0.66, 0.8, vel, 16);
  C('G', 'stop', 1, 80, 60, [200, 2060, 2500], 0.66, 0.5, vel, 12);
  C('CH', 'affr', 0, 120, 80, [200, 1950, 2400], 0.45, 2, pal, 0);
  C('JH', 'affr', 1, 110, 70, [200, 1950, 2400], 0.45, 1.2, pal, 0);
  phones.t = t;
  return t;
}

/**
 * Plan an utterance: phonemes to durations, targets and pitch, as key frames for klatt. No
 * randomness, so it also gives a line's length.
 *   ph  ARPAbet separated by spaces, vowels with stress 0, 1 or 2 (AE1), '/' between words,
 *       . , ? ! ; : ... as pauses with their intonation, PH*2 to hold a phoneme twice as long
 *   o   f0 (Hz), rate (x), range (intonation: 0 a monotone, 1 natural), formant (scales every
 *       resonance: above 1 a smaller vocal tract), whisper, breath (aspiration under the voice),
 *       vowels (the voice's own vowel targets, { IY: [F1, F2, F3], EY: [F1, F2, F3, end F1, F2, F3],
 *       ... }: they belong to its tract already, so formant then scales only the consonants, F4, F5,
 *       the nasals and the frication), vowelScale ([k1, k2, k3]: times that table's F1, F2, F3),
 *       bw (times every cascade bandwidth), accent (times the accents' height), fall (times the
 *       declination and a statement's closing fall)
 * Returns { dur (s), f0: [t, Hz, ...], amp: [t, AV, AH, AF, AB, A2..A6, ...], form: [t, F1..F5,
 * B1..B5, FNZ, F6, ...], segs: [{ ph, t0, t1 }] }.
 */
export function speechPlan(ph, o) {
  o = o || {};
  const P = phones();
  const rate = Math.min(3, Math.max(0.25, o.rate || 1));
  const base = Math.max(30, o.f0 || 110);
  const range = Math.max(0, o.range == null ? 1 : o.range);
  const fs = o.formant || 1;
  const whisper = !!o.whisper;
  const breath = Math.max(0, o.breath || 0);
  const segs = [];
  let word = 0;
  let phrase = 0;
  for (const tok of String(ph || '').toUpperCase().match(/\.\.\.|[.,?!;:/]|[A-Z]+[0-2]?(\*\d*\.?\d+)?/g) || []) {
    if (tok === '/') { word++; continue; }
    if (/^(\.\.\.|[.,?!;:])$/.test(tok)) { segs.push({ pause: tok, w: word++, q: phrase++ }); continue; }
    const m = /^([A-Z]+?)([0-2])?(?:\*(\d*\.?\d+))?$/.exec(tok);
    const d = m && P[m[1]];
    if (d) segs.push({ n: m[1], d, st: d.vowel ? (m[2] == null ? 1 : Number(m[2])) : -1, w: word, q: phrase, x: m[3] ? Math.min(20, Number(m[3])) : 1 });
  }
  if (!segs.length || segs[segs.length - 1].pause == null) segs.push({ pause: '', w: word, q: phrase });
  const N = segs.length;
  const isV = (s) => s && s.pause == null && s.d.vowel;
  const isC = (s) => s && s.pause == null && !s.d.vowel;
  const lastV = {};
  const wordVowels = {};
  for (let i = 0; i < N; i++) {
    if (!isV(segs[i])) continue;
    lastV[segs[i].q] = i;
    wordVowels[segs[i].w] = (wordVowels[segs[i].w] || 0) + 1;
  }
  // durations, Klatt (1979): MIN + (INH - MIN) x a percentage that each rule multiplies
  const PAUSE = { '.': 380, '!': 380, '?': 420, ',': 200, ';': 260, ':': 260, '...': 650, '': 0 };
  for (let i = 0; i < N; i++) {
    const s = segs[i];
    if (s.pause != null) { s.ms = PAUSE[s.pause] / rate; continue; }
    const d = s.d;
    const fin = lastV[s.q] != null && i >= lastV[s.q];
    let pr = 1;
    if (d.vowel) {
      if (!fin) pr *= 0.6;
      if (wordVowels[s.w] > 1) pr *= 0.8;
      if (s.st === 0) pr *= 0.5; else if (s.st === 2) pr *= 0.85;
      const nx = segs[i + 1];
      if (isC(nx) && nx.w === s.w) {
        const nk = nx.d.kind;
        if (!nx.d.voiced && (nk === 'stop' || nk === 'affr')) pr *= fin ? 0.7 : 0.85;
        else if (nx.d.voiced && nk === 'fric') pr *= fin ? 1.4 : 1.15;
        else if (nx.d.voiced && nk === 'stop') pr *= fin ? 1.2 : 1.05;
        else if (nk === 'nasal') pr *= 0.9;
      }
    } else {
      let k = i - 1;
      while (k >= 0 && segs[k].w === s.w && !isV(segs[k]) && segs[k].pause == null) k--;
      if (k >= 0 && segs[k].w === s.w && isV(segs[k])) pr *= 0.85;
      if (isC(segs[i - 1]) || isC(segs[i + 1])) pr *= 0.7;
      if (fin) pr *= 1.3;
    }
    s.ms = ((d.min + (d.inh - d.min) * pr) / rate) * s.x;
  }
  // targets: an unstressed vowel moves 30% toward the neutral tube; a consonant's locus is pulled
  // toward the vowel it leans on (the next one, or the one before when it closes its word). A voice
  // with its own vowel table takes its targets (and its neutral tube) from it, unscaled
  const own = o.vowels || null;
  // vowelScale [k1, k2, k3] moves the voice's own table, formant by formant (a shorter tract)
  const vk = own && o.vowelScale ? o.vowelScale : null;
  const ow = (f) => (vk ? [f[0] * vk[0], f[1] * vk[1], f[2] * vk[2]] : f);
  const AX = own && own.AX ? ow(own.AX) : P.AX.F;
  const sc = (f) => [f[0] * fs, f[1] * fs, f[2] * fs];
  for (const s of segs) {
    if (!isV(s)) continue;
    const red = s.st === 0 && s.n !== 'AX' ? 0.3 : 0;
    const mix = (f) => [f[0] + (AX[0] - f[0]) * red, f[1] + (AX[1] - f[1]) * red, f[2] + (AX[2] - f[2]) * red];
    const e = own && own[s.n];
    if (e) {
      s.F = mix(ow(e));
      s.G = s.d.G && e.length > 5 ? mix(ow(e.slice(3))) : s.F;
      continue;
    }
    s.F = sc(mix(s.d.F));
    s.G = s.d.G ? sc(mix(s.d.G)) : s.F;
  }
  const nearV = (i, dir) => {
    for (let j = i + dir; j >= 0 && j < N; j += dir) {
      if (segs[j].pause != null) return null;
      if (isV(segs[j])) return segs[j];
    }
    return null;
  };
  for (let i = 0; i < N; i++) {
    const s = segs[i];
    if (!isC(s)) continue;
    const prev = nearV(i, -1);
    const next = nearV(i, 1);
    const coda = prev && prev.w === s.w && !(next && next.w === s.w);
    const v = coda ? prev : next || prev;
    const vf = v ? (v === prev ? v.G : v.F) : own && own.AX ? AX.slice(0, 3) : sc(AX);
    const d = s.d;
    if (d.kind === 'asp') { s.F = vf.slice(); continue; }
    const L = sc(d.L);
    const k1 = d.kind === 'glide' ? 0.1 : d.kind === 'nasal' ? 0.15 : 0;
    s.F = [L[0] + (vf[0] - L[0]) * k1, L[1] + (vf[1] - L[1]) * d.k, L[2] + (vf[2] - L[2]) * d.k];
    // F1 cutback: an aspirated release already has its vowel's F1 (the rise hides in the
    // aspiration); with the locus F1 the cascade would bury the aspiration about 20 dB down
    s.Fr = d.kind === 'stop' && !d.voiced && v && v === next && !coda ? [vf[0], s.F[1], s.F[2]] : s.F;
  }
  let now = 0.04;
  for (const s of segs) {
    s.t0 = now;
    s.t1 = s.pause === '' ? now + 0.06 : now + Math.max(0.012, s.ms / 1000);
    now = s.t1;
  }
  const dur = now;
  // amplitude phases [t0, t1, AV, AH, AF, AB, A2..A6, edge]: a stop is a closure (silent, or a low
  // voice bar) and a burst; a voiceless stop before a vowel aspirates the vowel's onset (its voice
  // onset time). edge: 1 a pause, 2 a burst
  const db = (v) => (v <= -99 ? 0 : Math.pow(10, v / 20));
  const phs = [];
  const voice = (av, ah) => (whisper ? [0, ah + av * 0.55] : [av, ah + breath * av]);
  const noisy = (sp, lev) => [lev, db(sp[0]), db(sp[1]), db(sp[2]), db(sp[3]), db(sp[4]), db(sp[5])];
  let aspUntil = 0;
  for (let i = 0; i < N; i++) {
    const s = segs[i];
    const d = s.d;
    if (s.pause != null) { phs.push([s.t0, s.t1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]); continue; }
    let t0 = s.t0;
    if (aspUntil > t0) {
      const vs = voice(0, 0.2);
      phs.push([t0, aspUntil, vs[0], vs[1], 0, 0, 0, 0, 0, 0, 0, 0]);
      t0 = aspUntil;
      aspUntil = 0;
    }
    if (d.vowel || d.kind === 'glide' || d.kind === 'nasal') {
      const vs = voice(d.vowel ? (s.st === 1 ? 1 : s.st === 2 ? 0.92 : 0.8) : d.kind === 'glide' ? 0.72 : 0.8, 0);
      phs.push([t0, s.t1, vs[0], vs[1], 0, 0, 0, 0, 0, 0, 0, 0]);
    } else if (d.kind === 'asp') {
      phs.push([t0, s.t1, 0, d.lev, 0, 0, 0, 0, 0, 0, 0, 0]);
    } else if (d.kind === 'fric') {
      const vs = voice(d.voiced ? 0.22 : 0, 0);
      phs.push([t0, s.t1, vs[0], vs[1], ...noisy(d.sp, d.lev), 0]);
    } else {
      const span = s.t1 - t0;
      const rel = d.kind === 'affr' ? span * 0.55 : Math.min(span * 0.4, d.burst / 1000);
      const bar = voice(d.voiced ? 0.14 : 0, 0);
      phs.push([t0, s.t1 - rel, bar[0], bar[1], 0, 0, 0, 0, 0, 0, 0, 0]);
      const vs = voice(d.voiced && d.kind === 'affr' ? 0.35 : 0, 0);
      phs.push([s.t1 - rel, s.t1, vs[0], vs[1], ...noisy(d.sp, d.lev), 2]);
      const nx = segs[i + 1];
      if (!d.voiced && d.kind === 'stop' && nx && nx.pause == null && (nx.d.vowel || nx.d.kind === 'glide')) {
        const afterS = i > 0 && segs[i - 1].n === 'S' && segs[i - 1].w === s.w;
        const vot = (afterS || (nx.d.vowel && !(nx.st > 0)) ? 0.018 : { P: 0.05, T: 0.058, K: 0.068 }[s.n]) / Math.sqrt(rate);
        aspUntil = nx.t0 + Math.min(vot, (nx.t1 - nx.t0) * 0.6);
      }
    }
  }
  // each phase holds its values and crossfades into the next: short ramps between phonemes, longer
  // ones into and out of a pause, a sharp edge into a burst
  const amp = [];
  for (let j = 0; j < phs.length; j++) {
    const a = phs[j];
    const prev = phs[j - 1];
    const next = phs[j + 1];
    const hOn = !prev ? 0.008 : a[11] === 2 ? 0.0004 : prev[11] === 1 ? 0.012 : a[11] === 1 ? 0.02 : 0.003;
    const hOff = !next ? 0.02 : next[11] === 2 ? 0.0004 : next[11] === 1 ? 0.022 : a[11] === 2 ? 0.0015 : 0.003;
    let k0 = a[0] + hOn;
    let k1 = a[1] - hOff;
    if (k1 < k0) k0 = k1 = (a[0] + a[1]) / 2;
    amp.push(k0, a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);
    if (k1 > k0) amp.push(k1, a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);
  }
  // formant keys: a vowel moves in and out over its first and last 50 ms (a diphthong holds its
  // onset, then glides), a consonant holds its target, a glide is mostly transition
  const form = [];
  const FNP = 270 * fs;
  const bk = o.bw || 1;
  let lastKey = -1;
  const key = (tk, F, s) => {
    tk = Math.max(tk, lastKey);
    lastKey = tk;
    const nas = s.d.kind === 'nasal';
    form.push(tk, F[0], F[1], F[2], 3500 * fs, 4500 * fs, (nas ? 70 : 50 + 0.04 * F[0]) * bk, (nas ? 200 : 60 + 0.025 * F[1]) * bk,
      (nas ? 220 : 100 + 0.02 * F[2]) * bk, 250 * bk, 300 * bk, nas ? 450 * fs : FNP, (s.d.sp ? s.d.sp[6] : 6000) * fs);
  };
  for (const s of segs) {
    if (s.pause != null) continue;
    const span = s.t1 - s.t0;
    if (s.d.vowel) {
      const tr = Math.min(0.05, span * 0.35);
      key(s.t0 + tr, s.F, s);
      if (s.d.G) key(s.t0 + Math.max(tr, span * 0.35), s.F, s);
      key(s.t1 - tr, s.G, s);
    } else if (s.d.kind === 'glide') {
      key(s.t0 + span * 0.4, s.F, s);
      key(s.t1 - span * 0.4, s.F, s);
    } else {
      key(s.t0, s.F, s);
      key(s.t1, s.Fr || s.F, s);
    }
  }
  if (!form.length) form.push(0, 500, 1500, 2500, 3500, 4500, 70, 90, 150, 250, 300, FNP, 6000);
  // pitch: a declining line per phrase, a hat-shaped accent on each stressed vowel, and the end of
  // the phrase from its last stressed vowel: a fall, a question's rise, a lift before a comma
  const phr = {};
  for (const s of segs) {
    if (s.pause != null) { if (phr[s.q]) phr[s.q].type = s.pause; continue; }
    const p = phr[s.q] || (phr[s.q] = { t0: s.t0, t1: s.t1, type: '', acc: [], tf: s.t0, fs: 0 });
    p.t1 = s.t1;
    if (!isV(s)) continue;
    if (s.st > 0) p.acc.push(s);
    if (s.st === 1 || !p.fs) { p.tf = s.t0; p.fs = s.st === 1 ? 1 : p.fs; }
  }
  const plist = Object.keys(phr).map((k) => phr[k]);
  // accent scales the accents' height and fall the declination and a statement's closing fall (1 the
  // planner's own; a livelier talker accents more and falls less)
  const ac = o.accent == null ? 1 : o.accent;
  const fl = o.fall == null ? 1 : o.fall;
  for (const p of plist) {
    const em = p.type === '!' ? 1.5 : 1;
    p.acc = p.acc.map((s, j) => ({ a: s.t0 - 0.02, m: s.t0 + (s.t1 - s.t0) * 0.4, b: s.t1 + 0.03, h: range * ac * em * (s.st === 1 ? (j === 0 ? 0.2 : 0.15) : 0.06) }));
  }
  const f0At = (tt) => {
    let p = plist[0];
    for (const q of plist) if (q.t0 <= tt) p = q;
    if (!p) return base;
    const x = Math.min(1, Math.max(0, (tt - p.t0) / Math.max(0.05, p.t1 - p.t0)));
    let f = base * (1 + range * fl * (0.08 - 0.16 * x));
    let acc = 0;
    for (const c of p.acc) {
      if (tt <= c.a || tt >= c.b) continue;
      acc += c.h * (tt < c.m ? 0.5 - 0.5 * Math.cos((Math.PI * (tt - c.a)) / (c.m - c.a)) : 0.5 + 0.5 * Math.cos((Math.PI * (tt - c.m)) / (c.b - c.m)));
    }
    f *= 1 + acc;
    const z = Math.min(1, Math.max(0, (tt - p.tf) / Math.max(0.05, p.t1 - p.tf)));
    const y = z * z * (3 - 2 * z);
    return f * (p.type === '?' ? 1 + range * 0.5 * y : p.type === ',' ? 1 + range * 0.08 * y : p.type === '...' ? 1 - range * 0.08 * y : 1 - range * fl * 0.2 * y);
  };
  const f0 = [];
  for (let tt = 0; tt < dur + 0.01; tt += 0.01) f0.push(tt, f0At(tt));
  return { dur, f0, amp, form, segs: segs.map((s) => ({ ph: s.pause != null ? s.pause : s.n + (s.st >= 0 ? s.st : ''), t0: s.t0, t1: s.t1 })) };
}

/**
 * The synthesizer: a plan (speechPlan or babblePlan) rendered into a Float32Array at sample rate sr.
 * Tracks are read every 16 samples (formants through a 6 ms smoother, amplitudes interpolated per
 * sample). o: oq (open quotient, default 0.6), tilt (0..0.95, a lowpass on the source), jitter and
 * shimmer (per-period pitch and level variation), vib { rate, depth in semitones }, formant, raw (a
 * plain square, no vocal tract). Noise comes from the seeded generator.
 */
export function klatt(sr, plan, o) {
  o = o || {};
  const n = Math.max(1, Math.ceil(plan.dur * sr));
  const y = new Float32Array(n);
  const top = sr * 0.45;
  const BL = 16;
  const oq = Math.min(0.95, Math.max(0.2, o.oq || 0.6));
  const tilt = Math.min(0.95, Math.max(0, o.tilt == null ? 0.3 : o.tilt));
  const jit = o.jitter || 0;
  const shim = o.shimmer || 0;
  const vibR = o.vib ? o.vib.rate || 5 : 0;
  const vibD = o.vib ? o.vib.depth || 0 : 0;
  const raw = !!o.raw;
  const fnp = 270 * (o.formant || 1);
  // key frame readers, linear between keys, each track with its own cursor
  const cur = [0, 0, 0];
  const read = (tr, stride, c, tt, dst) => {
    const m = tr.length / stride;
    let i = cur[c];
    while (i < m - 1 && tr[(i + 1) * stride] <= tt) i++;
    cur[c] = i;
    const a = i * stride;
    if (i >= m - 1 || tt <= tr[a]) { for (let k = 1; k < stride; k++) dst[k - 1] = tr[a + k]; return; }
    const w = (tt - tr[a]) / Math.max(1e-9, tr[a + stride] - tr[a]);
    for (let k = 1; k < stride; k++) dst[k - 1] = tr[a + k] + (tr[a + stride + k] - tr[a + k]) * w;
  };
  const A0 = new Float64Array(9);
  const A1 = new Float64Array(9);
  const Fv = new Float64Array(12);
  const Fs = new Float64Array(12);
  const P0 = new Float64Array(1);
  read(plan.form, 13, 1, 0, Fs);
  const ks = 1 - Math.exp(-BL / (sr * 0.006));
  // resonators: 0 the nasal pole, 1..5 F1..F5 (cascade), 6..10 F2..F6 (parallel)
  const ra = new Float64Array(11);
  const rb = new Float64Array(11);
  const rc = new Float64Array(11);
  const m1 = new Float64Array(11);
  const m2 = new Float64Array(11);
  const pg = new Float64Array(11);
  const tw = (2 * Math.PI) / sr;
  const setRes = (k, f, bw, norm) => {
    f = Math.min(top, Math.max(20, f));
    const r = Math.exp((-Math.PI * Math.max(15, bw)) / sr);
    rb[k] = 2 * r * Math.cos(tw * f);
    rc[k] = -r * r;
    if (!norm) { ra[k] = 1 - rb[k] - rc[k]; return; }
    // a parallel resonator has unity gain at its center frequency
    const w = tw * f;
    const re = 1 - rb[k] * Math.cos(w) - rc[k] * Math.cos(2 * w);
    const im = rb[k] * Math.sin(w) + rc[k] * Math.sin(2 * w);
    ra[k] = Math.sqrt(re * re + im * im);
  };
  let za = 1;
  let zb = 0;
  let zc = 0;
  let zx1 = 0;
  let zx2 = 0;
  let phase = 0;
  let per = 0;
  let pamp = 1;
  let uPrev = 0;
  let lp = 0;
  for (let i0 = 0; i0 < n; i0 += BL) {
    const len = Math.min(BL, n - i0);
    read(plan.amp, 10, 0, i0 / sr, A0);
    read(plan.amp, 10, 0, (i0 + len) / sr, A1);
    read(plan.form, 13, 1, i0 / sr, Fv);
    read(plan.f0, 2, 2, i0 / sr, P0);
    for (let k = 0; k < 12; k++) Fs[k] += (Fv[k] - Fs[k]) * ks;
    if (!raw) {
      setRes(0, fnp, 100, 0);
      for (let k = 0; k < 5; k++) setRes(1 + k, Fs[k], Fs[5 + k], 0);
      for (let k = 0; k < 4; k++) setRes(6 + k, Fs[1 + k], Math.max(Fs[6 + k], 150), 1);
      setRes(10, Fs[11], 1600, 1);
      // the nasal zero at FNZ: the inverse of a resonator, bandwidth 100
      const r = Math.exp((-Math.PI * 100) / sr);
      const b = 2 * r * Math.cos(tw * Math.min(top, Math.max(20, Fs[10])));
      const c = -r * r;
      const a = 1 - b - c;
      za = 1 / a;
      zb = -b / a;
      zc = -c / a;
      for (let k = 0; k < 5; k++) pg[6 + k] = (k & 1 ? -1 : 1) * A0[4 + k];
    }
    for (let j = 0; j < len; j++) {
      const w = j / BL;
      const av = A0[0] + (A1[0] - A0[0]) * w;
      const ah = A0[1] + (A1[1] - A0[1]) * w;
      const af = A0[2] + (A1[2] - A0[2]) * w;
      // a new glottal period takes the pitch track, vibrato, jitter and shimmer
      phase += per / sr;
      if (per === 0 || phase >= 1) {
        phase = per === 0 ? 0 : phase - 1;
        let f = P0[0];
        if (vibD) f *= Math.pow(2, (vibD * Math.sin(2 * Math.PI * vibR * ((i0 + j) / sr))) / 12);
        if (jit) f *= 1 + jit * (rand() * 2 - 1);
        per = Math.max(20, f);
        pamp = shim ? 1 + shim * (rand() * 2 - 1) : 1;
      }
      if (raw) {
        lp += ((phase < 0.5 ? 1 : -1) * av * pamp * 0.25 - lp) * (1 - tilt);
        y[i0 + j] = lp;
        continue;
      }
      const q = phase / oq;
      const u = q < 1 ? 6.75 * q * q * (1 - q) : 0;
      lp += ((u - uPrev) * (sr / 4800) - lp) * (1 - tilt);
      uPrev = u;
      let x = av * pamp * lp;
      if (ah > 0) x += ah * (rand() * 2 - 1) * (av > 0 && u === 0 ? 0.5 : 1) * 0.12;
      let v = ra[0] * x + rb[0] * m1[0] + rc[0] * m2[0];
      m2[0] = m1[0];
      m1[0] = v;
      const zv = za * v + zb * zx1 + zc * zx2;
      zx2 = zx1;
      zx1 = v;
      v = zv;
      for (let k = 1; k <= 5; k++) {
        const r = ra[k] * v + rb[k] * m1[k] + rc[k] * m2[k];
        m2[k] = m1[k];
        m1[k] = r;
        v = r;
      }
      // frication into the parallel bank, with alternating signs, plus the bypass
      const nz = af > 0 ? af * (rand() * 2 - 1) * 0.18 : 0;
      let s = A0[3] * nz;
      for (let k = 6; k <= 10; k++) {
        const r = ra[k] * nz + rb[k] * m1[k] + rc[k] * m2[k];
        m2[k] = m1[k];
        m1[k] = r;
        s += pg[k] * r;
      }
      y[i0 + j] = v + (af > 0 ? s : 0);
    }
  }
  return y;
}

/**
 * The output stage of speech and babble: the voice's effect chain (fx), a DC blocker, the level (the
 * peak is o.peak, default 0.18), 2 ms in and 10 ms out, one buffer source into out at t. Returns
 * the end time. fx: hp, lp (Hz), eq { f, q, db } or a list of them (peaking biquads of the Audio EQ
 * Cookbook; hp and lp are its 2-pole filters), drive (0..1,
 * tanh), comb { ms, fb, mix } (a metallic ring), crush { bits, hz } (hold, quantize, then the
 * converter's reconstruction lowpass, 4 poles at 0.45 hz), room { time, mix, pre } (Schroeder's
 * reverb of four combs and two allpasses, 1962; it lengthens the buffer by time and pre).
 */
export function voiceOut(out, t, y, o) {
  o = o || {};
  const c = out.context;
  const sr = c.sampleRate;
  const fx = o.fx || {};
  const room = fx.room;
  let z = y;
  if (room) { z = new Float32Array(y.length + Math.ceil(((room.time || 1) + (room.pre || 0)) * sr)); z.set(y); }
  const n = z.length;
  const biq = (kind, f, q, gdb) => {
    const w = (2 * Math.PI * Math.min(f, sr * 0.45)) / sr;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    const A = Math.pow(10, (gdb || 0) / 40);
    const lo = kind === 'lp';
    const b = kind === 'eq' ? [1 + al * A, -2 * cs, 1 - al * A] : lo ? [(1 - cs) / 2, 1 - cs, (1 - cs) / 2] : [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    const a = kind === 'eq' ? [1 + al / A, -2 * cs, 1 - al / A] : [1 + al, -2 * cs, 1 - al];
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < n; i++) {
      const v = (b[0] * z[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2) / a[0];
      x2 = x1;
      x1 = z[i];
      y2 = y1;
      y1 = v;
      z[i] = v;
    }
  };
  const peakOf = () => {
    let m = 0;
    for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(z[i]));
    return m;
  };
  if (fx.hp) biq('hp', fx.hp, 0.707);
  if (fx.lp) biq('lp', fx.lp, 0.707);
  if (fx.eq) for (const q of [].concat(fx.eq)) biq('eq', q.f, q.q || 1, q.db);
  if (fx.drive) {
    const m = peakOf() || 1;
    const k = 1 + 8 * fx.drive;
    for (let i = 0; i < n; i++) z[i] = Math.tanh((k * z[i]) / m) / Math.tanh(k);
  }
  if (fx.comb) {
    const d = Math.max(1, Math.round((fx.comb.ms * sr) / 1000));
    const fb = Math.min(0.9, fx.comb.fb || 0.5);
    const mix = fx.comb.mix == null ? 0.5 : fx.comb.mix;
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      w[i] = z[i] + (i >= d ? fb * w[i - d] : 0);
      z[i] = z[i] * (1 - mix) + w[i] * (1 - fb) * mix;
    }
  }
  if (fx.crush) {
    const hold = Math.max(1, sr / (fx.crush.hz || sr));
    const m = peakOf() || 1;
    const steps = Math.pow(2, (fx.crush.bits || 8) - 1);
    let next = 0;
    let held = 0;
    for (let i = 0; i < n; i++) {
      if (i >= next) { held = (Math.round((z[i] / m) * steps) / steps) * m; next += hold; }
      z[i] = held;
    }
    // the converter's own reconstruction lowpass, so its images above half its rate stay down
    if (hold > 1) {
      biq('lp', 0.45 * (fx.crush.hz || sr), 0.707);
      biq('lp', 0.45 * (fx.crush.hz || sr), 0.707);
    }
  }
  if (room) {
    const pre = Math.round((room.pre || 0) * sr);
    const wet = new Float32Array(n);
    for (const cd of [0.0297, 0.0371, 0.0411, 0.0437]) {
      const d = Math.round(cd * sr);
      const g = Math.pow(10, (-3 * cd) / (room.time || 1));
      const buf = new Float32Array(d);
      for (let i = 0, p = 0; i < n; i++, p = p + 1 === d ? 0 : p + 1) {
        const v = buf[p];
        buf[p] = (i >= pre ? z[i - pre] : 0) + g * v;
        wet[i] += v * 0.25;
      }
    }
    for (const ad of [0.005, 0.0017]) {
      const d = Math.round(ad * sr);
      const buf = new Float32Array(d);
      for (let i = 0, p = 0; i < n; i++, p = p + 1 === d ? 0 : p + 1) {
        const v = buf[p];
        const x = wet[i] + 0.7 * v;
        buf[p] = x;
        wet[i] = v - 0.7 * x;
      }
    }
    const mix = room.mix == null ? 0.25 : room.mix;
    for (let i = 0; i < n; i++) z[i] += mix * wet[i];
  }
  const R = 1 - (2 * Math.PI * 20) / sr;
  let px = 0;
  let py = 0;
  for (let i = 0; i < n; i++) { py = z[i] - px + R * py; px = z[i]; z[i] = py; }
  const m = peakOf();
  const k = m > 0 ? (o.peak == null ? 0.18 : o.peak) / m : 0;
  const fi = Math.max(1, Math.round(0.002 * sr));
  const fo = Math.max(1, Math.round(0.01 * sr));
  for (let i = 0; i < n; i++) z[i] *= k * Math.min(1, i / fi, (n - 1 - i) / fo);
  const b = c.createBuffer(1, n, sr);
  b.getChannelData(0).set(z);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(out);
  s.start(t);
  s.stop(t + n / sr + 0.05);
  return t + n / sr;
}

/**
 * The speech voices, in the order a person sees them (by display name): f0 (Hz), rate, range,
 * accent and fall (the planner's contour), formant (vocal tract scale), vowels (the voice's own
 * vowel table), vowelScale and bw (its formant and bandwidth scales), oq and tilt (a low oq and tilt
 * is buzzier), jitter, shimmer, breath, whisper and the effect chain fx (voiceOut). The announcer is
 * a pair on one PA system: announcer (male; 'announcer-male' names it too) and announcer-female.
 */
export function speechVoices() {
  return {
    // A woman at the same PA. Vowels: Peterson and Barney (1952), women; EY and OW start at the /e/
    // and /o/ of Hillenbrand et al. (1995), women, and every other diphthong target is his times
    // their women-to-men ratio for the nearest vowel (AY and AW start at /a/, EY ends toward /i/, AY
    // and OY toward /I/, AW toward /U/, OW toward /u/); AX is the neutral tube of her shorter tract.
    // vowelScale lifts that table past the women's averages, more in the upper formants (a shorter
    // tract, a wider formant dispersion: F0 and formants both mark a voice as female, Hillenbrand
    // and Clark 2009), and formant 1.29 (1.17, the women-to-men ratio of the Peterson and Barney
    // means, times 1.10) moves her consonant loci, F4, F5, nasals and frication with the top
    // formants. Pitch 230 Hz; range, accent and fall give her about 1.5 times his span in
    // semitones: livelier accents, a brighter question rise, a gentler statement fall that never
    // drops into a low, creaky end. Source after Klatt and Klatt (1990) female talkers: a long open
    // phase, a steep tilt, aspiration in the voicing, wider bandwidths. His horn's drive and hall,
    // its high-pass lowered so her fundamental passes, presence and air up to a 7 kHz top
    'announcer-female': {
      name: 'Announcer (Female)', desc: 'The same PA system with a woman speaking: bright, breathy and lively, through the horn into the hall',
      f0: 230, rate: 0.92, range: 1.1, accent: 1.8, fall: 0.5, formant: 1.29, vowelScale: [1.06, 1.08, 1.1], bw: 1.15,
      oq: 0.8, tilt: 0.8, jitter: 0.003, shimmer: 0.02, breath: 0.16,
      vowels: {
        IY: [310, 2790, 3310], IH: [430, 2480, 3070], EH: [610, 2330, 2990], AE: [860, 2050, 2850], AH: [760, 1400, 2780],
        AA: [850, 1220, 2810], AO: [590, 920, 2710], UH: [470, 1160, 2680], UW: [370, 950, 2670], ER: [500, 1640, 1960],
        AX: [585, 1755, 2925], EY: [536, 2530, 3047, 447, 2616, 3203], AY: [914, 1513, 2790, 475, 2267, 2901],
        AW: [914, 1513, 2790, 498, 1092, 2671], OW: [555, 1035, 2828, 461, 975, 2626], OY: [590, 920, 2710, 475, 2267, 2901],
      },
      fx: { hp: 150, lp: 7000, eq: [{ f: 2600, q: 1.2, db: 4 }, { f: 6000, q: 0.9, db: 3 }], drive: 0.25, room: { time: 1.1, mix: 0.18, pre: 0.02 } },
    },
    announcer: {
      name: 'Announcer (Male)', desc: 'The classic synthesized PA voice: clear and level, through a horn into a hall',
      f0: 104, rate: 0.92, range: 0.7, formant: 1, oq: 0.55, tilt: 0.25, jitter: 0.003, shimmer: 0.02, breath: 0.02,
      fx: { hp: 300, lp: 4500, eq: { f: 1900, q: 1.2, db: 5 }, drive: 0.25, room: { time: 1.1, mix: 0.18, pre: 0.02 } },
    },
    deep: {
      name: 'Deep Robot', desc: 'A slow, low machine voice with a metallic ring',
      f0: 64, rate: 0.82, range: 0.25, formant: 0.86, oq: 0.4, tilt: 0.1, fx: { comb: { ms: 5.5, fb: 0.55, mix: 0.5 }, lp: 6000 },
    },
    retro: {
      name: 'Retro Computer', desc: 'A flat, buzzy home computer voice through an 8-bit converter',
      f0: 96, rate: 0.96, range: 0, formant: 1, oq: 0.3, tilt: 0, fx: { crush: { bits: 7, hz: 8000 }, lp: 3800 },
    },
    small: {
      name: 'Small Robot', desc: 'A quick, bright little robot in a tin box',
      f0: 230, rate: 1.12, range: 1.1, formant: 1.2, oq: 0.5, tilt: 0.2, fx: { comb: { ms: 1.6, fb: 0.35, mix: 0.3 }, hp: 160 },
    },
    whisper: {
      name: 'Whisper', desc: 'Breath only: no voicing, close and airy',
      f0: 120, rate: 0.9, range: 0.4, formant: 1.04, whisper: 1, fx: { hp: 220 },
    },
  };
}

/**
 * The speech engine, without the text front end or the voice table: o.ph (phonemes), o.voice (a
 * voice object), o.pitch (semitones), o.rate and o.range (times the voice's), o.peak, o.fx (false:
 * none). Returns the end time; with out = null it schedules nothing.
 */
export function utter(out, t, o) {
  o = o || {};
  const v = o.voice || {};
  const cfg = Object.assign({}, v, {
    f0: (v.f0 || 110) * Math.pow(2, (o.pitch || 0) / 12),
    rate: (v.rate || 1) * (o.rate == null ? 1 : o.rate),
    range: (v.range == null ? 1 : v.range) * (o.range == null ? 1 : o.range),
  });
  const fx = o.fx === false ? null : v.fx;
  const plan = speechPlan(o.ph, cfg);
  if (!out) return t + plan.dur + (fx && fx.room ? (fx.room.time || 1) + (fx.room.pre || 0) : 0);
  return voiceOut(out, t, klatt(out.context.sampleRate, plan, cfg), { fx, peak: o.peak });
}

/**
 * Speak a line: o.text (English; [W EY1 T] spells a word in ARPAbet) or o.ph (phonemes), o.voice (a
 * name from speechVoices, default 'announcer', 'announcer-male' the same voice, or a voice object),
 * o.pitch (semitones), o.rate, o.range, o.peak (default 0.18), o.fx (false: no effect chain).
 * Returns the end time; with out = null it schedules nothing, so speak(null, 0, o) is the line's
 * length in seconds.
 */
export function speak(out, t, o) {
  o = o || {};
  const all = speechVoices();
  const v = o.voice && typeof o.voice === 'object' ? o.voice : all[o.voice === 'announcer-male' ? 'announcer' : o.voice] || all.announcer;
  return utter(out, t, Object.assign({}, o, { ph: o.ph != null ? o.ph : phonemize(o.text || ''), voice: v }));
}

/**
 * Plan babble: each letter (per: 'letter') or syllable (per: 'syllable') becomes a short pitched
 * vowel blip with a consonant onset, as key frames for klatt. o: f0, speed (blips per second),
 * colour (formant scale), random (semitones of pitch spread), scale (steps the pitches snap to),
 * glide (semitones each blip bends), lilt (how far a question rises), per. Timing draws no random
 * numbers, so dry = true (timing only) gives the exact length.
 */
export function babblePlan(text, o, dry) {
  o = o || {};
  const P = phones();
  const slot = 1 / Math.min(40, Math.max(2, o.speed || 12));
  const per = o.per === 'syllable' ? 'syllable' : 'letter';
  const col = o.colour || 1;
  const s = String(text || '').toLowerCase();
  // a letter sings the vowel of its English name (b "bee", f "eff", r "ar") after its own consonant
  const LV = { a: 'AE', b: 'IY', c: 'IY', d: 'IY', e: 'EH', f: 'EH', g: 'IY', h: 'EY', i: 'IH', j: 'EY', k: 'EY', l: 'EH', m: 'EH',
    n: 'EH', o: 'AO', p: 'IY', q: 'UW', r: 'AA', s: 'EH', t: 'IY', u: 'UH', v: 'IY', w: 'AH', x: 'EH', y: 'AY', z: 'IY' };
  const VL = { a: 'AA', e: 'EH', i: 'IY', o: 'OW', u: 'UW', y: 'IY' };
  const ON = { b: 'B', c: 'K', d: 'D', f: 'F', g: 'G', h: 'HH', j: 'JH', k: 'K', l: 'L', m: 'M', n: 'N', p: 'P', q: 'K', r: 'R',
    s: 'S', t: 'T', v: 'V', w: 'W', x: 'K', y: 'Y', z: 'Z' };
  const units = [];
  // pauses in slots (a space, a comma, a sentence end); pauses in a row merge into the longest
  const gap = (k, end) => {
    const last = units[units.length - 1];
    if (last && last.gap != null) { if (k >= last.gap) { last.gap = k; last.end = end || last.end; } return; }
    units.push({ gap: k, end });
  };
  const punct = (ch) => (/[,;:]/.test(ch) ? gap(3) : /[.!?]/.test(ch) ? gap(6, ch) : ch === ' ' ? gap(per === 'letter' ? 0.6 : 0.5) : 0);
  if (per === 'letter') {
    for (const ch of s) {
      if (/[a-z]/.test(ch)) units.push({ v: LV[ch], on: ON[ch] || '', len: 0.85 });
      else if (/[0-9]/.test(ch)) units.push({ v: 'IY', on: '', len: 0.85 });
      else punct(ch);
    }
  } else {
    for (const w of s.match(new RegExp("[a-z0-9']+|[ ,;:.!?]", 'g')) || []) {
      if (w.length === 1 && !/[a-z0-9]/.test(w)) { punct(w); continue; }
      for (const x of w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+$)?/g) || [w]) {
        const vm = /[aeiouy]/.exec(x);
        units.push({ v: vm ? VL[vm[0]] : 'UH', on: ON[x[0]] || '', len: 1.1 });
      }
    }
  }
  // the last blips before a question mark rise; an exclamation lifts its blips a little
  let mark = null;
  let count = 0;
  for (let k = units.length - 1; k >= 0; k--) {
    const u = units[k];
    if (u.end) { mark = u.end; count = 0; continue; }
    if (u.gap != null || !mark) continue;
    if (mark === '?' && count < 3) u.rise = [7, 4, 2][count];
    if (mark === '!') u.rise = 1.5;
    count++;
  }
  // a slow voice's pauses are capped: a sentence break never drags past 0.6 s
  let now = 0.03;
  for (const u of units) {
    u.t0 = now;
    now += u.gap != null ? Math.min(u.gap * slot, u.gap >= 6 ? 0.6 : u.gap >= 3 ? 0.35 : 1) : u.len * slot;
    u.t1 = now;
  }
  const dur = now + 0.05;
  if (dry) return { dur };
  const base = Math.max(30, o.f0 || 300);
  const rnd = o.random == null ? 3 : o.random;
  const steps = o.scale;
  const gl = o.glide == null ? -2 : o.glide;
  const lilt = o.lilt == null ? 1 : o.lilt;
  const f0 = [0, base];
  const amp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const form = [];
  const fk = (tk, F, b2, fnz, f6) => {
    form.push(tk, F[0], F[1], F[2], 3500 * col, 4500 * col, 50 + 0.04 * F[0], b2 || 60 + 0.025 * F[1], 100 + 0.02 * F[2], 250, 300, (fnz || 270) * col, (f6 || 6000) * col);
  };
  fk(0, [500 * col, 1500 * col, 2500 * col]);
  const dB = (d) => (d <= -99 ? 0 : Math.pow(10, d / 20));
  for (const u of units) {
    if (u.gap != null) continue;
    let st = rnd * (rand() * 2 - 1);
    if (steps && steps.length) {
      const oct = Math.floor(st / 12) * 12;
      let best = oct + steps[0];
      for (const d of steps) for (const o2 of [oct, oct + 12]) if (Math.abs(d + o2 - st) < Math.abs(best - st)) best = d + o2;
      st = best;
    }
    const p0 = base * Math.pow(2, (st + (u.rise || 0) * lilt) / 12);
    const a = u.t0;
    const len = u.t1 - u.t0;
    const b = a + len * 0.92;
    f0.push(a, p0, b, p0 * Math.pow(2, gl / 12));
    const V = P[u.v].F.map((x) => x * col);
    const on = u.on ? P[u.on] : null;
    const rel = Math.min(0.02, len * 0.3);
    let vs = a;
    amp.push(a, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    if (on && (on.kind === 'stop' || on.kind === 'affr' || on.kind === 'fric')) {
      // a burst or a hiss first, its noise shaped like the consonant's own
      const nl = on.kind === 'fric' ? len * 0.22 : Math.min(0.006, len * 0.15);
      const sp = on.sp;
      const nv = [on.lev, dB(sp[0]), dB(sp[1]), dB(sp[2]), dB(sp[3]), dB(sp[4]), dB(sp[5])];
      amp.push(a + 0.0004, 0, 0, ...nv, a + nl, 0, 0, ...nv, a + nl + 0.001, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      const L = on.L.map((x) => x * col);
      fk(a, [L[0], L[1] + (V[1] - L[1]) * on.k, L[2]], 0, 270, sp[6]);
      vs = a + nl + 0.001;
    } else if (on) {
      // a nasal, liquid or glide: the formants move in from its locus
      const nas = on.kind === 'nasal';
      fk(a, on.L.map((x) => x * col), nas ? 200 : 0, nas ? 450 : 270);
    } else {
      fk(a, V);
    }
    const up = Math.min(b - rel - 0.001, vs + Math.min(0.006, len * 0.2));
    amp.push(up, on && on.kind === 'nasal' ? 0.8 : 1, 0, 0, 0, 0, 0, 0, 0, 0);
    fk(Math.min(b - rel, vs + (on ? 0.03 : 0.002)), V);
    amp.push(Math.max(up, b - rel), 0.75, 0, 0, 0, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    fk(b, V);
  }
  amp.push(dur, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  return { dur, f0, amp, form };
}

/**
 * The babble voices, in the order a person sees them (by display name): f0 (Hz), speed (blips per
 * second), per ('letter' or 'syllable'), colour, random, scale, glide, oq, tilt, jitter, shimmer,
 * vib, breath, raw (a plain square) and fx.
 */
export function babbleVoices() {
  return {
    cute: {
      name: 'Cute', desc: 'High and quick, a letter at a time, like a village animal',
      f0: 390, speed: 15, per: 'letter', colour: 1.22, random: 4, glide: -2, oq: 0.6, tilt: 0.35,
    },
    gruff: {
      name: 'Gruff', desc: 'Low, slow syllables with a rough edge',
      f0: 92, speed: 8.5, per: 'syllable', colour: 0.88, random: 2, glide: -1, oq: 0.45, tilt: 0.15, jitter: 0.03, shimmer: 0.12,
      fx: { drive: 0.35 },
    },
    beep: {
      name: 'Robot Beep', desc: 'Square-wave beeps on a pentatonic scale, a letter at a time',
      f0: 620, speed: 13, per: 'letter', random: 7, scale: [0, 2, 4, 7, 9], glide: 0, raw: 1, tilt: 0.3, fx: { crush: { bits: 5, hz: 12000 } },
    },
    sprite: {
      name: 'Tiny Sprite', desc: 'A tiny, very fast, very high fairy chatter',
      f0: 880, speed: 22, per: 'letter', colour: 1.42, random: 5, glide: 3, oq: 0.65, tilt: 0.4, fx: { hp: 300 },
    },
    elder: {
      name: 'Wise Elder', desc: 'Slow, low and breathy syllables with a tremble',
      f0: 132, speed: 6.5, per: 'syllable', colour: 0.95, random: 1.5, glide: -1.5, oq: 0.6, tilt: 0.4, jitter: 0.012, shimmer: 0.05,
      vib: { rate: 5.5, depth: 0.35 }, breath: 0.3, fx: { room: { time: 0.5, mix: 0.12 } },
    },
  };
}

/**
 * The babble engine, without the voice table: o.text, o.voice (a voice object), o.pitch
 * (semitones), o.speed and o.spread (times the voice's speed and pitch spread), o.peak, o.fx.
 * Returns the end time; with out = null it schedules nothing.
 */
export function chatter(out, t, o) {
  o = o || {};
  const v = o.voice || {};
  const cfg = Object.assign({}, v, {
    f0: (v.f0 || 300) * Math.pow(2, (o.pitch || 0) / 12),
    speed: (v.speed || 12) * (o.speed == null ? 1 : o.speed),
    random: (v.random == null ? 3 : v.random) * (o.spread == null ? 1 : o.spread),
  });
  const fx = o.fx === false ? null : v.fx;
  if (!out) return t + babblePlan(o.text, cfg, true).dur + (fx && fx.room ? (fx.room.time || 1) + (fx.room.pre || 0) : 0);
  return voiceOut(out, t, klatt(out.context.sampleRate, babblePlan(o.text, cfg), cfg), { fx, peak: o.peak });
}

/**
 * Babble a line, Animalese or Undertale style: a short pitched vowel blip per letter or syllable.
 * o.text, o.voice (a name from babbleVoices, default 'cute', or a voice object), o.pitch
 * (semitones), o.speed, o.spread, o.peak (default 0.18), o.fx. Returns the end time; with
 * out = null it schedules nothing, so babble(null, 0, o) is the line's length in seconds.
 */
export function babble(out, t, o) {
  o = o || {};
  const all = babbleVoices();
  const v = o.voice && typeof o.voice === 'object' ? o.voice : all[o.voice] || all.cute;
  return chatter(out, t, Object.assign({}, o, { voice: v }));
}
