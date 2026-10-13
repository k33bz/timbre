// The voices, measured: nobody can listen in a test, so each check renders through the engine
// (src/core/speech.js) on the mock graph and measures the buffer it computed.
//   * vowels: LPC on a sustained render puts F1 and F2 within 10% of the table (Peterson and Barney)
//   * fricatives put their energy in the right bands; stops close, burst and aspirate; nasals murmur
//   * prosody: statements fall, questions rise, rate scales length, range 0 is a monotone
//   * determinism, lengths (speak(null) is the render's length), levels, every voice
//   * the text front end reproduces the reviewed table in gates/fixtures/phonemes.tsv
//   * a Speak panel Copy carries the engine only and renders the same samples as the gallery
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { T } from '../src/core/t.js';
import { buildSpeechCopy, SPEAK_PARAMS } from '../src/core/copy.js';
import { ROOT } from '../build.mjs';
import { MockContext } from './lib/mockaudio.mjs';
import { decimate, formants, bandEnergy, rmsDb } from './lib/analysis.mjs';

const SR = 48000;
// a neutral voice for measuring: steady pitch, no jitter, no effect chain
const PLAIN = { f0: 100, rate: 1, range: 0, formant: 1, oq: 0.6, tilt: 0.3 };

/** The buffer a call computes, from a fresh mock context. */
function render(call, sr = SR) {
  const c = new MockContext(sr);
  const out = c.createGain();
  out.connect(c.destination);
  T.seed(1);
  const end = call(out);
  const src = c.nodes.find((n) => n.buffer);
  return { y: src.buffer.getChannelData(0), end, started: src.started, stopped: src.stopped };
}
const utter = (ph, voice = PLAIN, o = {}) => render((out) => T.utter(out, 0, { ph, voice, fx: false, ...o })).y;
const at = (plan, name, k = 0) => plan.segs.filter((s) => s.ph === name)[k];
const span = (s, a = 0.25, b = 0.25) => [Math.round((s.t0 + a * (s.t1 - s.t0)) * SR), Math.round((s.t1 - b * (s.t1 - s.t0)) * SR)];

test('the inventory: 40 ARPAbet phonemes, vowels with formant targets, consonants with a kind and a locus', () => {
  const P = T.phones();
  assert.equal(Object.keys(P).length, 40);
  for (const v of ['IY', 'IH', 'EH', 'AE', 'AH', 'AA', 'AO', 'UH', 'UW', 'ER', 'AX', 'EY', 'AY', 'AW', 'OW', 'OY']) assert.equal(P[v].F.length, 3, v);
  for (const v of ['EY', 'AY', 'AW', 'OW', 'OY']) assert.ok(P[v].G, `${v} glides`);
  for (const c of ['B', 'CH', 'D', 'DH', 'F', 'G', 'HH', 'JH', 'K', 'L', 'M', 'N', 'NG', 'P', 'R', 'S', 'SH', 'T', 'TH', 'V', 'W', 'Y', 'Z', 'ZH']) {
    assert.ok(P[c].kind && P[c].L.length === 3 && P[c].inh >= P[c].min, c);
  }
});

const VOWELS = ['IY', 'IH', 'EH', 'AE', 'AH', 'AA', 'AO', 'UH', 'UW', 'ER', 'AX'];
test('vowels: LPC on a sustained render puts F1 and F2 within 10% of their targets', (t) => {
  const rows = [];
  for (const v of VOWELS) {
    const y = utter(v + '1*5');
    const d = decimate(y.subarray(Math.floor(y.length * 0.3), Math.floor(y.length * 0.7)), SR, 4, 5000);
    const f = formants(d, SR / 4, 12);
    const target = T.phones()[v].F;
    const e1 = (100 * (f[0] - target[0])) / target[0];
    const e2 = (100 * (f[1] - target[1])) / target[1];
    rows.push(`${v.padEnd(3)} F1 ${f[0].toFixed(0).padStart(4)} (${target[0]}, ${e1.toFixed(1)}%)  F2 ${f[1].toFixed(0).padStart(4)} (${target[1]}, ${e2.toFixed(1)}%)`);
    assert.ok(Math.abs(e1) <= 10, `${v} F1 ${f[0].toFixed(0)} vs ${target[0]}`);
    assert.ok(Math.abs(e2) <= 10, `${v} F2 ${f[1].toFixed(0)} vs ${target[1]}`);
  }
  t.diagnostic('\n' + rows.join('\n'));
});

test('diphthongs glide from their onset toward their end target (in the formant that moves most)', () => {
  for (const v of ['EY', 'AY', 'AW', 'OW', 'OY']) {
    const y = utter(v + '1*5');
    const n = y.length;
    const P = T.phones()[v];
    const k = Math.abs(P.G[0] - P.F[0]) > Math.abs(P.G[1] - P.F[1]) ? 0 : 1;
    const fk = (a, b) => formants(decimate(y.subarray(Math.floor(n * a), Math.floor(n * b)), SR, 4, 5000), SR / 4, 12)[k];
    const want = P.G[k] - P.F[k];
    const got = fk(0.75, 0.9) - fk(0.1, 0.25);
    assert.ok(Math.sign(got) === Math.sign(want) && Math.abs(got) > Math.abs(want) * 0.4, `${v}: F${k + 1} moved ${got.toFixed(0)} Hz, the targets ${want} Hz`);
  }
});

test('fricatives: S high, SH lower, F and TH flat and weak, voiced ones voiced', (t) => {
  const bands = [[0, 500], [500, 2000], [2000, 4000], [4000, 8000], [8000, 24000]];
  const m = {};
  for (const f of ['S', 'Z', 'SH', 'ZH', 'F', 'V', 'TH', 'DH']) {
    const ph = `AA1*2 ${f}*6 AA1*2`;
    const y = utter(ph);
    const plan = T.speechPlan(ph, PLAIN);
    const [a, b] = span(at(plan, f));
    const [va, vb] = span(at(plan, 'AA1'), 0.3, 0.3);
    m[f] = { rel: rmsDb(y, a, b) - rmsDb(y, va, vb), ...bandEnergy(y.subarray(a, b), SR, bands) };
  }
  t.diagnostic('\n' + Object.entries(m).map(([k, v]) => `${k.padEnd(2)} ${v.rel.toFixed(1).padStart(6)} dB re vowel, centroid ${v.centroid.toFixed(0).padStart(5)} Hz, bands ${v.bands.map((x) => (100 * x).toFixed(0) + '%').join(' ')}`).join('\n'));
  // S: most of its energy between 4 and 8 kHz, the strongest of the fricatives with SH
  assert.ok(m.S.bands[3] > 0.55 && m.S.centroid > 4500, `S ${m.S.bands[3]} ${m.S.centroid}`);
  assert.ok(m.S.rel > -20 && m.S.rel < -8, `S level ${m.S.rel}`);
  // SH: its peak band is 2 to 4 kHz, below S
  assert.ok(m.SH.bands[2] > 0.5 && m.SH.centroid < m.S.centroid - 1000, `SH ${m.SH.bands[2]} ${m.SH.centroid}`);
  assert.ok(m.SH.rel > -20 && m.SH.rel < -6, `SH level ${m.SH.rel}`);
  // F and TH: flat (no band holds most of the energy), at least 8 dB weaker than S
  for (const f of ['F', 'TH']) {
    assert.ok(Math.max(...m[f].bands.slice(1)) < 0.7 && m[f].rel < m.S.rel - 8, `${f} ${m[f].bands} ${m[f].rel}`);
  }
  // voiced: a voice bar below 500 Hz, and Z and ZH keep their frication band
  for (const f of ['Z', 'ZH', 'V', 'DH']) assert.ok(m[f].bands[0] > 0.2, `${f} voicing ${m[f].bands[0]}`);
  assert.ok(m.Z.bands[3] > 0.15, `Z frication ${m.Z.bands[3]}`);
  assert.ok(m.ZH.bands[2] > 0.15, `ZH frication ${m.ZH.bands[2]}`);
});

test('stops: a silent closure, a burst by place, aspiration before a stressed vowel', () => {
  const res = {};
  for (const f of ['P', 'T', 'K', 'B', 'D', 'G']) {
    const ph = `AA1*2 ${f} AA1*2`;
    const y = utter(ph);
    const plan = T.speechPlan(ph, PLAIN);
    const s = at(plan, f);
    const d = T.phones()[f];
    const rel = Math.min((s.t1 - s.t0) * 0.4, d.burst / 1000);
    const [va, vb] = span(at(plan, 'AA1'), 0.3, 0.3);
    const v = rmsDb(y, va, vb);
    const ba = Math.round((s.t1 - rel) * SR);
    const burst = new Float32Array(4096);
    burst.set(y.subarray(ba, Math.round(s.t1 * SR) + 48));
    const next = plan.segs[2];
    res[f] = {
      closure: rmsDb(y, Math.round((s.t0 + 0.025) * SR), ba) - v,
      burst: rmsDb(y, ba, Math.round(s.t1 * SR) + 48) - v,
      centroid: bandEnergy(burst, SR, [[0, 24000]]).centroid,
      onset: rmsDb(y, Math.round(next.t0 * SR), Math.round((next.t0 + 0.03) * SR)) - v,
    };
  }
  for (const f of ['P', 'T', 'K']) {
    assert.ok(res[f].closure < -40, `${f} closure ${res[f].closure}`);
    assert.ok(res[f].burst > -40, `${f} burst ${res[f].burst}`);
    // aspiration: the vowel's first 30 ms are breath, well under the vowel but clearly there
    assert.ok(res[f].onset < -10 && res[f].onset > -30, `${f} aspiration ${res[f].onset}`);
  }
  for (const f of ['B', 'D', 'G']) {
    assert.ok(res[f].closure < -12 && res[f].closure > -35, `${f} voice bar ${res[f].closure}`);
    assert.ok(res[f].onset > -10, `${f} voices at once ${res[f].onset}`);
  }
  // place: the alveolar burst is the highest, the labial the lowest
  assert.ok(res.T.centroid > res.K.centroid - 500 && res.T.centroid > res.P.centroid, JSON.stringify(res));
});

test('nasals murmur below 500 Hz, quieter than the vowel', () => {
  for (const f of ['M', 'N', 'NG']) {
    const ph = `AA1*2 ${f}*6 AA1*2`;
    const y = utter(ph);
    const plan = T.speechPlan(ph, PLAIN);
    const [a, b] = span(at(plan, f));
    const [va, vb] = span(at(plan, 'AA1'), 0.3, 0.3);
    const e = bandEnergy(y.subarray(a, b), SR, [[0, 500]]);
    const rel = rmsDb(y, a, b) - rmsDb(y, va, vb);
    assert.ok(e.bands[0] > 0.85 && rel < -3 && rel > -16, `${f}: ${e.bands[0]} below 500 Hz, ${rel} dB`);
  }
});

test('prosody: a statement falls, a question rises, rate scales the length, range 0 is flat', () => {
  const f0 = (text, o) => {
    const p = T.speechPlan(T.phonemize(text), { f0: 100, range: 1, rate: 1, ...o });
    const v = p.f0.filter((x, i) => i % 2 === 1);
    const last = p.segs.filter((s) => s.ph.length > 1 || /[A-Z]/.test(s.ph)).pop();
    return { mid: v[Math.floor(v.length * 0.3)], end: v[Math.floor((last.t1 / p.dur) * (v.length - 1))], all: v, dur: p.dur };
  };
  const st = f0('The system is online.');
  const q = f0('Is the system online?');
  assert.ok(st.end < st.mid * 0.85, `statement ${st.mid} -> ${st.end}`);
  assert.ok(q.end > q.mid * 1.2, `question ${q.mid} -> ${q.end}`);
  const flat = f0('Is the system online?', { range: 0 });
  assert.ok(Math.max(...flat.all) - Math.min(...flat.all) < 1e-9, 'range 0 is a monotone');
  const slow = f0('The system is online.', { rate: 0.5 });
  // after the 40 ms lead-in every segment and pause scales with 1 / rate
  assert.ok(Math.abs(slow.dur - 0.04 - 2 * (st.dur - 0.04)) < 0.005, `rate 0.5: ${slow.dur} vs ${st.dur}`);
  // stress: an accented vowel peaks above the line around it
  const p = T.speechPlan('AH0 / D AE1 T AX0 / AH0', { f0: 100, range: 1 });
  const ae = p.segs.find((s) => s.ph === 'AE1');
  const pitchAt = (tt) => p.f0[2 * Math.round(tt / 0.01) + 1];
  assert.ok(pitchAt(ae.t0 + (ae.t1 - ae.t0) * 0.4) > pitchAt(0.05) * 1.08);
  // punctuation pauses
  const pauses = T.speechPlan(T.phonemize('One, two. Three... four?'), {}).segs.filter((s) => /^[.,?]|\.\.\./.test(s.ph));
  assert.deepEqual(pauses.map((s) => s.ph), [',', '.', '...', '?']);
  assert.ok(pauses[2].t1 - pauses[2].t0 > pauses[0].t1 - pauses[0].t0);
});

test('every voice renders deterministically, within its length, at the asked peak, without NaN or DC', () => {
  const kinds = [['speak', Object.keys(T.speechVoices())], ['babble', Object.keys(T.babbleVoices())]];
  for (const [kind, voices] of kinds) {
    for (const voice of voices) {
      const o = { text: 'Access granted? Welcome back!', voice };
      const a = render((out) => T[kind](out, 0.5, o));
      const b = render((out) => T[kind](out, 0.5, o));
      assert.deepEqual(a.y, b.y, `${kind} ${voice} is reproducible`);
      // out = null gives the end time, within the rounding to whole samples
      assert.ok(Math.abs(a.end - T[kind](null, 0.5, o)) < 2.5 / SR, `${kind} ${voice}: out = null gives the end time`);
      assert.ok(Math.abs(a.end - (0.5 + a.y.length / SR)) < 1e-9 && a.started === 0.5 && a.stopped <= a.end + 0.05 + 1e-9);
      let pk = 0;
      let sum = 0;
      for (const x of a.y) { assert.ok(Number.isFinite(x)); pk = Math.max(pk, Math.abs(x)); sum += x; }
      assert.ok(Math.abs(pk - 0.18) < 1e-6, `${kind} ${voice} peak ${pk}`);
      assert.ok(Math.abs(sum / a.y.length) < 0.0032, `${kind} ${voice} dc ${sum / a.y.length}`);
      assert.ok(Math.abs(a.y[0]) < 1e-6 && Math.abs(a.y[a.y.length - 1]) < 1e-6, 'starts and ends at zero');
      T.seed(2);
      const c = render((out) => { T.seed(9); return T[kind](out, 0.5, o); });
      assert.notDeepEqual(c.y, a.y, `${kind} ${voice}: another seed varies the noise or the pitch`);
    }
  }
  // peak and fx options; other sample rates
  const quiet = render((out) => T.speak(out, 0, { text: 'Hi.', peak: 0.05, fx: false }));
  assert.ok(Math.abs(Math.max(...quiet.y.map(Math.abs)) - 0.05) < 1e-6);
  for (const sr of [44100, 22050, 16000]) assert.ok(render((out) => T.speak(out, 0, { text: 'Test.' }), sr).y.every(Number.isFinite), sr);
  // nothing to say: a short silent buffer, never NaN
  const none = render((out) => T.speak(out, 0, { text: '' }));
  assert.ok(none.y.length > 0 && none.y.every((x) => x === 0));
});

test('babble: a blip per letter or syllable, pauses at punctuation, timing free of randomness', () => {
  const plan = (text, o) => T.babblePlan(text, { speed: 10, ...o });
  assert.ok(plan('abc', { per: 'letter' }).dur > plan('ab', { per: 'letter' }).dur);
  assert.ok(Math.abs(plan('hello there', { per: 'syllable' }).dur - plan('hello there', { per: 'syllable' }, true).dur) < 1e-12);
  assert.ok(plan('Hi. Hi', { per: 'letter' }).dur > plan('Hi Hi', { per: 'letter' }).dur + 0.3);
  // pauses in a row merge: an ellipsis is one pause
  assert.ok(Math.abs(plan('a... b').dur - plan('a. b').dur) < 1e-9);
  // the beep voice snaps its pitches to its scale
  const beep = T.babbleVoices().beep;
  T.seed(3);
  const p = T.babblePlan('hello robot', beep);
  for (let i = 3; i < p.f0.length; i += 4) {
    const st = 12 * Math.log2(p.f0[i] / beep.f0);
    const deg = ((Math.round(st) % 12) + 12) % 12;
    assert.ok(Math.abs(st - Math.round(st)) < 1e-6 && beep.scale.includes(deg), `${st}`);
  }
});

test('the text front end reproduces the reviewed table (gates/fixtures/phonemes.tsv)', () => {
  const rows = fs.readFileSync(path.join(ROOT, 'gates/fixtures/phonemes.tsv'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
  assert.ok(rows.length >= 100);
  const diffs = [];
  for (const r of rows) {
    const [text, want] = r.split('\t');
    const got = T.phonemize(text);
    if (got !== want) diffs.push(`${text}: ${got} (table: ${want})`);
  }
  assert.deepEqual(diffs, [], 'a changed pronunciation: review it, then update the table');
});

test('the front end: overrides, numbers, symbols, acronyms, contractions and pauses', () => {
  assert.equal(T.phonemize('Press [W EY1 T] now'), 'P R EH1 S / W EY1 T / N AW1');
  assert.equal(T.phonemize('3, 2, 1'), 'TH R IY1 , T UW1 , W AH1 N');
  assert.equal(T.phonemize('12.5%'), 'T W EH1 L V / P OY1 N T / F AY1 V / P ER0 S EH1 N T');
  assert.equal(T.phonemize('2nd'), 'S EH1 K AX0 N D');
  assert.match(T.phonemize('2026'), /^T UW1 \/ TH AW1 Z AX0 N D \/ T W EH1 N T IY0 \/ S IH1 K S$/);
  assert.equal(T.phonemize('TV'), 'T IY1 / V IY1');
  assert.equal(T.phonemize("don't"), 'D OW1 N T');
  assert.equal(T.phonemize('Wait... what?!'), 'W EY1 T ... W AH1 T ?');
  assert.equal(T.phonemize(''), '');
  // every symbol the front end emits is in the inventory
  const P = T.phones();
  for (const tok of T.phonemize('The quick brown fox jumps over the lazy dog; sphinx of black quartz, judge my vow!').split(' ')) {
    if (/^[/.,!?;:]$|^\.\.\.$/.test(tok)) continue;
    assert.ok(P[tok.replace(/[0-2]$/, '')], tok);
  }
});

test('a Speak Copy bakes the line, carries the engine only and renders the gallery\'s samples', () => {
  for (const cfg of [
    { mode: 'speak', text: 'Containment breach.', voice: 'announcer', pitch: 2, rate: 1.1, range: 1.4, seed: 4 },
    { mode: 'speak', text: 'Hello </script> world', voice: 'retro' },
    { mode: 'babble', text: 'Oh, hi there!', voice: 'elder', speed: 0.8, spread: 1.5 },
  ]) {
    const text = buildSpeechCopy(T, cfg);
    for (const h of ['phonemize', 'speechVoices', 'babbleVoices', 'speak(', 'babble(']) assert.ok(!text.includes('function ' + h), `no ${h}`);
    assert.ok(!/<\/script/i.test(text), 'never closes a script tag');
    const fname = /^function (\w+)/m.exec(text)[1];
    const ctx = vm.createContext({});
    vm.runInContext(text, ctx);
    const ac = new MockContext(SR);
    const end = ctx[fname](ac);
    const copied = ac.nodes.find((n) => n.buffer).buffer.getChannelData(0);
    // the gallery: the same call the Speak panel makes, on a warm chain, with the same seed
    const vals = Object.fromEntries(Object.keys(SPEAK_PARAMS[cfg.mode]).map((k) => [k, cfg[k] == null ? SPEAK_PARAMS[cfg.mode][k].def : cfg[k]]));
    const g = render((out) => { T.seed(cfg.seed == null ? 1 : cfg.seed); return T[cfg.mode](out, 0.2, { text: cfg.text, voice: cfg.voice, ...vals }); });
    assert.deepEqual(copied, g.y, `${cfg.mode} ${cfg.voice}: the same samples`);
    assert.ok(Math.abs(end - g.end) < 1e-9, `end ${end} vs ${g.end}`);
    // opts override the baked values
    const ac2 = new MockContext(SR);
    ctx[fname](ac2, { pitch: -5, seed: 2 });
    assert.notDeepEqual(ac2.nodes.find((n) => n.buffer).buffer.getChannelData(0), copied);
  }
});
