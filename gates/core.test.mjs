// Core helpers on the mock graph: every voice and effect runs with no options, envelopes start at
// zero and end silent, seeded noise is reproducible, and the computed buffers (pluck, reverb) are
// shaped as documented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from '../src/core/t.js';
import { MockContext } from './lib/mockaudio.mjs';
import { MASTER_CHAIN } from '../src/core/render.js';

const ctx = () => { const c = new MockContext(48000); const out = c.createGain(); out.connect(c.destination); return { c, out }; };

test('every voice runs with no options and returns a finite end time', () => {
  for (const v of ['osc', 'noise', 'fm', 'pluck', 'bell']) {
    const { c, out } = ctx();
    T.seed(1);
    const end = T[v](out, 0.5);
    assert.ok(Number.isFinite(end) && end > 0.5, `${v} -> ${end}`);
    assert.ok(c.nodes.some((n) => n.started === 0.5), `${v} starts a source at t`);
    assert.ok(c.nodes.filter((n) => n.started != null).every((n) => n.stopped === undefined || n.stopped <= end + 0.05 + 1e-9), `${v} stops by end + 50 ms`);
  }
});

test('every effect runs with no options and returns a node to play into', () => {
  for (const fx of ['filter', 'drive', 'crush', 'delay', 'reverb']) {
    const { out } = ctx();
    T.seed(1);
    const inp = T[fx](out, 0);
    assert.equal(typeof inp.connect, 'function', fx);
    assert.ok(T.osc(inp, 0, { dur: 0.1 }) > 0, fx);
  }
  const { out } = ctx();
  assert.equal(T.gain(out, 0.5).gain.value, 0.5);
});

test('env starts at zero before its first event and ends at silence', () => {
  for (const o of [{}, { curve: 'lin' }, { s: 0.5, d: 0.05, r: 0.1, dur: 0.6 }, { s: 0.5, curve: 'lin', dur: 0.4 }]) {
    const { c } = ctx();
    const g = c.createGain();
    const end = T.env(g.gain, 1, { peak: 0.2, ...o });
    assert.equal(g.gain.value, 0, 'zero first');
    assert.deepEqual(g.gain.events[0], ['set', 0, 1]);
    const last = g.gain.events[g.gain.events.length - 1];
    assert.equal(last[1], 0, JSON.stringify(o));
    assert.equal(last[2], end);
    const peak = Math.max(...g.gain.events.map((e) => e[1]));
    assert.equal(peak, 0.2);
  }
});

test('seeded noise is reproducible and differs between seeds', () => {
  const draw = (s) => { T.seed(s); return [T.rand(), T.rand(), T.rand(10), T.rand(5, 6)]; };
  assert.deepEqual(draw(42), draw(42));
  assert.notDeepEqual(draw(42), draw(43));
  const [a, b, c10, r56] = draw(7);
  assert.ok(a >= 0 && a < 1 && b >= 0 && b < 1 && c10 >= 0 && c10 < 10 && r56 >= 5 && r56 < 6);
  const { c } = ctx();
  T.seed(9); const n1 = T.noiseBuffer(c, 0.01).getChannelData(0);
  T.seed(9); const n2 = T.noiseBuffer(c, 0.01).getChannelData(0);
  assert.deepEqual(n1, n2);
  assert.equal(n1.length, 480);
});

test('pluck is normalized to its peak and has no DC from its excitation', () => {
  for (const f of [110, 440, 1760]) {
    const { c, out } = ctx();
    T.seed(5);
    T.pluck(out, 0, { f, dur: 0.5 });
    const src = c.nodes.find((n) => n.buffer);
    const y = src.buffer.getChannelData(0);
    let pk = 0; let sum = 0;
    for (const v of y) { pk = Math.max(pk, Math.abs(v)); sum += v; }
    assert.ok(Math.abs(pk - 1) < 1e-6, `peak ${pk}`);
    assert.ok(Math.abs(sum / y.length) < 2e-3, `f ${f}: mean ${sum / y.length}`);
  }
});

test('the reverb impulse has unit energy per channel', () => {
  const { c, out } = ctx();
  T.seed(2);
  T.reverb(out, 0, { time: 0.5 });
  const conv = c.nodes.find((n) => n.buffer && n.buffer.numberOfChannels === 2);
  for (let ch = 0; ch < 2; ch++) {
    let e = 0;
    for (const v of conv.buffer.getChannelData(ch)) e += v * v;
    assert.ok(Math.abs(e - 1) < 1e-3, `energy ${e}`);
  }
  assert.equal(conv.normalize, false);
});

test('note() names and semitones', () => {
  assert.equal(T.note('A4'), 440);
  assert.equal(T.note(12), 880);
  assert.ok(Math.abs(T.note('C6') - 1046.502) < 0.01);
  assert.ok(Math.abs(T.note('Eb3') - 155.563) < 0.01);
  assert.ok(Math.abs(T.note('C#5') - 554.365) < 0.01);
});

test('the master chain is gain 0.55, a -12 dB 12:1 limiter and a tanh ceiling', () => {
  const { c } = ctx();
  const inp = T.master(c, c.destination);
  assert.equal(inp.gain.value, 0.55);
  const lim = inp.outs[0];
  assert.equal(lim.threshold.value, -12);
  assert.equal(lim.ratio.value, 12);
  assert.equal(lim.attack.value, 0.003);
  const sat = lim.outs[0];
  assert.equal(sat.curve.length, 2048);
  assert.ok(Math.abs(sat.curve[2047] - 0.5 * Math.tanh(2)) < 1e-6);
  assert.equal(sat.outs[0], c.destination);
});

// ---- the phase-2 helpers

const sources = (c) => c.nodes.filter((n) => n.started != null);
const evs = (p) => p.events.map((e) => [e[0], Number(e[1].toPrecision(6)), Number(e[2].toPrecision(9))]);

test('the new voices run with no options, start at t and stop within 50 ms of their end', () => {
  for (const v of ['pulse', 'tick', 'crackle', 'chord']) {
    const { c, out } = ctx();
    T.seed(1);
    const end = T[v](out, 0.5);
    assert.ok(Number.isFinite(end) && end > 0.5, `${v} -> ${end}`);
    assert.ok(sources(c).length && sources(c).every((n) => n.started >= 0.5 && n.stopped <= end + 0.05 + 1e-9), v);
  }
});

test('the new effects return a node to play into; lfo returns its end time', () => {
  for (const fx of ['pan', 'dcblock', 'bus']) {
    const { out } = ctx();
    const inp = T[fx](out, 0);
    assert.equal(typeof inp.connect, 'function', fx);
    assert.ok(T.osc(inp, 0, { dur: 0.1 }) > 0, fx);
  }
  const { out } = ctx();
  assert.equal(T.lfo(T.gain(out, 0.5), 0.2, { dur: 0.5 }), 0.7);
});

test('env without tail schedules exactly the original events; tail slows the decay and fades linearly', () => {
  const { c } = ctx();
  const g = c.createGain();
  const end = T.env(g.gain, 1, { peak: 0.2, dur: 0.5 });
  assert.deepEqual(evs(g.gain), [['set', 0, 1], ['lin', 0.2, 1.005], ['exp', 0.0001, 1.5], ['set', 0, 1.5]]);
  assert.equal(end, 1.5);
  const h = c.createGain();
  T.env(h.gain, 1, { peak: 0.2, dur: 0.5, tail: 0.05 });
  assert.deepEqual(evs(h.gain), [['set', 0, 1], ['lin', 0.2, 1.005], ['exp', 0.01, 1.48], ['lin', 0, 1.5]]);
  const k = c.createGain();
  T.env(k.gain, 0, { peak: 0.2, dur: 1, s: 0.5, r: 0.2, tail: 0.1, fade: 0.05 });
  assert.deepEqual(evs(k.gain).slice(-3), [['set', 0.1, 0.8], ['exp', 0.01, 0.95], ['lin', 0, 1]]);
  // the fade never takes more than half of the decay
  const m = c.createGain();
  T.env(m.gain, 0, { peak: 0.2, dur: 0.02, tail: 0.1, fade: 0.5 });
  const me = evs(m.gain);
  assert.ok(me[2][2] > 0.005 && me[2][2] < 0.02, JSON.stringify(me));
});

test('osc and noise take built-in lp and hp stages; without them the graph is unchanged', () => {
  const kinds = (fn, o) => { const { c, out } = ctx(); T.seed(1); fn(out, 0, o); return c.nodes.filter((n) => n.Q).map((n) => n.type); };
  assert.deepEqual(kinds(T.osc, { dur: 0.2 }), []);
  assert.deepEqual(kinds(T.noise, { dur: 0.2 }), ['bandpass']);
  assert.deepEqual(kinds(T.osc, { dur: 0.2, lp: 2000, hp: 120 }), ['lowpass', 'highpass']);
  assert.deepEqual(kinds(T.noise, { dur: 0.2, filter: 'none', hp: 500 }), ['highpass']);
  const { c, out } = ctx();
  T.osc(out, 0, { dur: 0.4, lp: { f: 4000, to: 400, q: 3 } });
  const lp = c.nodes.find((n) => n.type === 'lowpass');
  assert.equal(lp.Q.value, 3);
  assert.deepEqual(evs(lp.frequency), [['set', 4000, 0], ['exp', 400, 0.36]]);
  // the chain is source -> lp -> envelope gain -> out
  const o = c.nodes.find((n) => n.started != null);
  assert.equal(o.outs[0], lp);
  assert.equal(lp.outs[0].outs[0], out);
});

test('pulse builds a band-limited PeriodicWave with the duty asked for', () => {
  const { c, out } = ctx();
  T.pulse(out, 0, { duty: 0.5, f: 220, dur: 0.1 });
  const o = c.nodes.find((n) => n.started != null);
  assert.equal(o.type, 'custom');
  const { real, imag } = o.wave;
  assert.equal(real.length, 129);
  for (let k = 1; k < 8; k++) {
    assert.ok(Math.abs(real[k]) < 1e-6, `real ${k}`);
    assert.ok(Math.abs(imag[k] - (k % 2 ? 2 / (Math.PI * k) : 0)) < 1e-6, `imag ${k}`);
  }
  const { c: c2, out: o2 } = ctx();
  T.pulse(o2, 0, { duty: 0.125 });
  const w = c2.nodes.find((n) => n.started != null).wave;
  assert.ok(Math.abs(w.real[1] - Math.sin(Math.PI / 4) / Math.PI) < 1e-6);
  const { c: c3, out: o3 } = ctx();
  T.pulse(o3, 0, { duty: 2 });   // clamped to 0.95
  assert.ok(Math.abs(c3.nodes.find((n) => n.started != null).wave.imag[1] - (1 - Math.cos(1.9 * Math.PI)) / Math.PI) < 1e-6);
});

test('tick: a band-passed burst, an optional blip, jitter that never reshuffles the noise', () => {
  const run = (o) => { const { c, out } = ctx(); T.seed(3); const end = T.tick(out, 0, o); return { c, end }; };
  const a = run({});
  assert.equal(sources(a.c).length, 1);
  assert.ok(Math.abs(a.end - 0.012) < 1e-9);
  assert.equal(a.c.nodes.find((n) => n.type === 'bandpass').frequency.events[0][1], 3000);
  const b = run({ blip: 900, blipDur: 0.05 });
  assert.equal(sources(b.c).length, 2);
  assert.ok(Math.abs(b.end - 0.05) < 1e-9);
  const j = run({ jitter: 1 });
  const buf = (r) => sources(r.c)[0].buffer.getChannelData(0);
  assert.deepEqual(buf(j), buf(a), 'the noise is the same with and without jitter');
  const fj = j.c.nodes.find((n) => n.type === 'bandpass').frequency.events[0][1];
  assert.ok(fj !== 3000 && fj >= 2250 && fj <= 3750, `jittered center ${fj}`);
});

test('crackle: random, non-overlapping bursts inside the span, with a drifting center', () => {
  const { c, out } = ctx();
  T.seed(4);
  const end = T.crackle(out, 1, { dur: 2, rate: 40, f: 1000, to: 4000, spread: 0, len: 0.005 });
  assert.equal(sources(c).length, 1, 'one source for every burst');
  assert.ok(end <= 3 + 1e-9);
  const g = c.nodes.filter((n) => n.gain && !n.Q).pop();
  const ev = g.gain.events;
  const starts = ev.filter((e, i) => e[0] === 'set' && e[1] === 0 && ev[i + 1] && ev[i + 1][0] === 'lin').map((e) => e[2]);
  assert.ok(starts.length > 40 && starts.length < 110, `${starts.length} bursts`);
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] >= starts[i - 1] + 0.005, 'no overlap');
  const f = c.nodes.find((n) => n.type === 'bandpass').frequency.events.filter((e) => e[0] === 'set').map((e) => e[1]);
  assert.ok(f[1] < 1300 && f[f.length - 1] > 3000, `center drifts ${f[1]} -> ${f[f.length - 1]}`);
  const again = () => { const x = ctx(); T.seed(4); T.crackle(x.out, 1, { dur: 2 }); return x.c.nodes.filter((n) => n.gain && !n.Q).pop().gain.events; };
  assert.deepEqual(again(), again(), 'reproducible from the seed');
});

test('pan: a balance law with an exact centre, and a sweep that bends at the centre', () => {
  const gains = (o) => {
    const { c, out } = ctx();
    const inp = T.pan(out, 0, o);
    assert.equal(inp.channelCountMode, 'explicit');
    assert.equal(inp.channelCount, 2);
    const [gl, gr] = c.nodes.filter((n) => n.gain && n !== out && n !== inp);
    return { gl: evs(gl.gain), gr: evs(gr.gain) };
  };
  assert.deepEqual(gains({}), { gl: [['set', 1, 0]], gr: [['set', 1, 0]] });
  assert.deepEqual(gains({ x: -1 }), { gl: [['set', 1, 0]], gr: [['set', 0, 0]] });
  assert.deepEqual(gains({ x: 0.5 }), { gl: [['set', 0.5, 0]], gr: [['set', 1, 0]] });
  assert.deepEqual(gains({ x: -1, to: 1, dur: 1 }), {
    gl: [['set', 1, 0], ['lin', 1, 0.5], ['lin', 0, 1]],
    gr: [['set', 0, 0], ['lin', 1, 0.5], ['lin', 1, 1]],
  });
  assert.deepEqual(gains({ x: 0.2, to: 0.8, dur: 1 }).gl, [['set', 0.8, 0], ['lin', 0.2, 1]]);
});

test('dcblock is a 20 to 40 Hz highpass that needs no time', () => {
  const { c, out } = ctx();
  const b = T.dcblock(out);
  assert.equal(b.type, 'highpass');
  assert.equal(b.frequency.value, 30);
  assert.equal(T.dcblock(out, 0, { f: 5 }).frequency.value, 20);
  assert.equal(T.dcblock(out, 0, { f: 90 }).frequency.value, 40);
  assert.ok(c.nodes.every((n) => n.started == null));
});

test('lfo swings a node parameter around its own value, fading in and out', () => {
  const { c, out } = ctx();
  const lp = T.filter(out, 0, { f: 1200 });
  const end = T.lfo(lp, 0, { rate: 4, to: 8, depth: 600, dur: 1 });
  const w = c.nodes.find((n) => n.started != null);
  const d = w.outs[0];
  assert.equal(d.outs[0], lp.frequency, 'defaults to the frequency of a filter');
  assert.deepEqual(evs(d.gain), [['set', 0, 0], ['lin', 600, 0.005], ['set', 600, 0.99], ['lin', 0, 1]]);
  assert.deepEqual(evs(w.frequency), [['set', 4, 0], ['exp', 8, 1]]);
  assert.equal(end, 1);
  assert.equal(w.stopped, 1.05);
  const g = T.gain(out, 0.5);
  T.lfo(g, 0, { depth: 0.3 });
  assert.equal(sources(c)[1].outs[0].outs[0], g.gain, 'defaults to the gain of a gain node');
});

test('bus shapes several voices with one envelope at unity peak', () => {
  const { c, out } = ctx();
  const b = T.bus(out, 0.1, { a: 0.05, dur: 1, s: 0.8, r: 0.3 });
  assert.equal(b.outs[0], out);
  assert.equal(Math.max(...b.gain.events.map((e) => e[1])), 1);
  assert.equal(b.gain.value, 0);
  T.osc(b, 0.1, { dur: 0.5 });
  T.osc(b, 0.2, { dur: 0.5 });
  assert.equal(c.nodes.filter((n) => n.outs.includes(b)).length, 2);
});

test('chord splits the level, follows a root, strums and takes any voice', () => {
  const { c, out } = ctx();
  const end = T.chord(out, 0, { notes: ['C4', 'E4', 'G4'], peak: 0.3, dur: 0.4 });
  const os = sources(c);
  assert.equal(os.length, 3);
  assert.ok(Math.abs(os[0].frequency.events[0][1] - T.note('C4')) < 1e-9);
  const peaks = c.nodes.filter((n) => n.gain && n !== out).map((n) => Math.max(...n.gain.events.map((e) => e[1])));
  assert.ok(peaks.every((p) => Math.abs(p - 0.1) < 1e-12), JSON.stringify(peaks));
  assert.ok(Math.abs(end - 0.4) < 1e-9);
  const { c: c2, out: o2 } = ctx();
  T.chord(o2, 0, { root: 220, notes: [0, 7, 12], strum: -0.05, spread: 10 });
  const s2 = sources(c2);
  assert.deepEqual(s2.map((n) => Math.round(n.frequency.events[0][1] * 100) / 100), [220, 329.63, 440]);
  assert.deepEqual(s2.map((n) => Math.round(n.started * 1000)), [100, 50, 0], 'strummed from the top down');
  assert.deepEqual(s2.map((n) => n.detune.value), [-5, 0, 5]);
  const { c: c3, out: o3 } = ctx();
  T.seed(2);
  T.chord(o3, 0, { notes: [196, 247], voice: T.pluck, dur: 0.3 });
  assert.equal(sources(c3).filter((n) => n.buffer).length, 2, 'plucked');
});

test('jitter varies pitch and level from the seed and always draws the same number of values', () => {
  T.seed(11);
  const xs = Array.from({ length: 200 }, () => T.jitter(1000, { cents: 100 }));
  assert.ok(xs.every((x) => x >= 1000 / Math.pow(2, 1 / 12) - 1e-9 && x < 1000 * Math.pow(2, 1 / 12)));
  assert.ok(new Set(xs).size > 150);
  T.seed(11);
  const ys = Array.from({ length: 50 }, () => T.jitter(0.5, 0.2));
  assert.ok(ys.every((y) => y >= 0.4 - 1e-12 && y < 0.6));
  // options: f and to move together, peak by decibels, nothing else touched
  T.seed(5);
  const o = T.jitter({ f: 800, to: 400, peak: 0.1, dur: 0.2 }, { cents: 50, db: 3 });
  assert.ok(Math.abs(o.f / o.to - 2) < 1e-12);
  assert.equal(o.dur, 0.2);
  assert.ok(o.peak >= 0.1 / Math.pow(10, 3 / 20) && o.peak < 0.1 * Math.pow(10, 3 / 20));
  // a fixed number of draws: zero amounts leave values alone and the stream where it would be
  T.seed(5); T.jitter({ f: 800 }, {}); const after0 = T.rand();
  T.seed(5); T.jitter({ f: 800 }, { cents: 80, db: 6 }); const after1 = T.rand();
  assert.equal(after0, after1);
  T.seed(5);
  assert.deepEqual(T.jitter({ f: 800, peak: 0.1 }, {}), { f: 800, peak: 0.1 });
});

test('pluck tone darkens the excitation; leaving it out keeps the original pluck', () => {
  const buf = (o) => { const { c, out } = ctx(); T.seed(5); T.pluck(out, 0, { f: 220, dur: 0.5, ...o }); return c.nodes.find((n) => n.buffer).buffer.getChannelData(0); };
  const base = buf({});
  assert.deepEqual(buf({ tone: 1 }), base);
  assert.deepEqual(buf({ tone: undefined }), base);
  // brightness: energy of the first difference relative to the energy, over the first 50 ms
  const bright = (y) => { let e = 0; let d = 0; for (let i = 1; i < 2400; i++) { e += y[i] * y[i]; d += (y[i] - y[i - 1]) ** 2; } return d / e; };
  const b0 = bright(base);
  const b5 = bright(buf({ tone: 0.5 }));
  const b1 = bright(buf({ tone: 0.1 }));
  assert.ok(b0 > b5 * 1.5 && b5 > b1 * 1.5, `${b0} > ${b5} > ${b1}`);
  for (const y of [buf({ tone: 0 }), buf({ tone: 0.5 })]) {
    let pk = 0; let sum = 0;
    for (const v of y) { pk = Math.max(pk, Math.abs(v)); sum += v; }
    assert.ok(Math.abs(pk - 1) < 1e-6 && Math.abs(sum / y.length) < 2e-3);
  }
});

test('MASTER_CHAIN, the catalog copy of the chain, says what master() builds', () => {
  const { c } = ctx();
  const inp = T.master(c, c.destination);
  const lim = inp.outs[0];
  const sat = lim.outs[0];
  assert.equal(inp.gain.value, MASTER_CHAIN.gain);
  for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) assert.equal(lim[k].value, MASTER_CHAIN.limiter[k], k);
  assert.equal(sat.curve.length, MASTER_CHAIN.ceiling.points);
  assert.equal(sat.oversample, MASTER_CHAIN.ceiling.oversample);
  assert.ok(Math.abs(20 * Math.log10(sat.curve[sat.curve.length - 1] / Math.tanh(2)) - MASTER_CHAIN.ceiling.maxDbfs) < 0.03);
});

test('the instruments run with no options, start at t, stop within 50 ms of their end, and Copy can carry them', () => {
  for (const v of ['bow', 'choir', 'organ', 'membrane', 'shepard']) {
    const { c, out } = ctx();
    T.seed(1);
    const end = T[v](out, 0.5);
    assert.ok(Number.isFinite(end) && end > 0.5, `${v} -> ${end}`);
    assert.ok(c.nodes.some((n) => n.started >= 0.5 && n.started < 0.6), `${v} starts a source at t`);
    assert.ok(c.nodes.filter((n) => n.started != null).every((n) => n.stopped === undefined || n.stopped <= end + 0.05 + 1e-9), `${v} stops by end + 50 ms`);
    // a helper travels in Copy as its own source text: nothing it needs may live at module level
    const src = T[v].toString();
    for (const name of ['clamp', 'VOWELS', 'RANKS', 'STOPS', 'SKINS']) {
      if (new RegExp('\b' + name + '\b').test(src)) assert.match(src, new RegExp('const ' + name + ' ='), `${v} defines ${name} itself`);
    }
  }
});

test('choir and shepard buffers are seeded, normalized to their peak and free of DC', () => {
  const render = (v, o, seed) => { const { c, out } = ctx(); T.seed(seed); T[v](out, 0, o); return c.nodes.find((n) => n.buffer).buffer.getChannelData(0); };
  for (const [v, o] of [['choir', { dur: 1, voices: 3, notes: [110, 165] }], ['shepard', { dur: 1 }]]) {
    const a = render(v, o, 3);
    const b = render(v, o, 3);
    assert.deepEqual(Array.from(a.slice(2000, 2100)), Array.from(b.slice(2000, 2100)), `${v} reproducible`);
    let pk = 0;
    let sum = 0;
    for (const x of a) { pk = Math.max(pk, Math.abs(x)); sum += x; }
    assert.ok(pk > 0.1 && pk <= 1.0001, `${v} peak ${pk}`);
    assert.ok(Math.abs(sum / a.length) < 0.002, `${v} DC ${sum / a.length}`);
  }
  const c1 = render('choir', { dur: 1, voices: 3 }, 3);
  const c2 = render('choir', { dur: 1, voices: 3 }, 4);
  assert.notDeepEqual(Array.from(c1.slice(4000, 4100)), Array.from(c2.slice(4000, 4100)), 'another seed, other singers');
});

test('the drum skin rings its modes down with a sagging pitch; the organ stacks its ranks', () => {
  const { c, out } = ctx();
  T.membrane(out, 0, { kind: 'taiko', f: 80 });
  const tones = c.nodes.filter((n) => n.frequency && n.type === 'sine');
  assert.ok(tones.length >= 4, 'modes plus the boom');
  const g = ctx();
  T.organ(g.out, 0, { notes: [130.81, 155.56, 196], celeste: 4 });
  const pipes = g.c.nodes.filter((n) => n.frequency && n.started != null && !n.buffer);
  assert.equal(pipes.length, 6, 'two ranks per note');
});

test('seamless cuts a loop from a faded bed that wraps without a jump, and keeps a drone level through the crossfade', async () => {
  const { seamless } = await import('../src/core/loop.js');
  const sr = 8000;
  const n = 16 * sr;
  // a noise bed with 1.5 s fades at both ends, and a pure 55 Hz drone with the same fades
  T.seed(9);
  const fade = (i) => Math.min(1, i / (1.5 * sr), (n - 1 - i) / (1.5 * sr));
  const noiseBed = [new Float32Array(n), new Float32Array(n)];
  const drone = [new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) {
    noiseBed[0][i] = (T.rand() * 2 - 1) * 0.2 * fade(i);
    noiseBed[1][i] = (T.rand() * 2 - 1) * 0.2 * fade(i);
    drone[0][i] = drone[1][i] = 0.3 * Math.sin((2 * Math.PI * 55 * i) / sr) * fade(i);
  }
  for (const [name, chs] of [['noise', noiseBed], ['drone', drone]]) {
    const cut = seamless(chs, sr, { max: 10 });
    assert.ok(cut && cut.length >= 6 && cut.length <= 10, `${name} loop length ${cut && cut.length}`);
    assert.ok(cut.start >= 1.5, `${name} starts after the fade in (${cut.start})`);
    const y = cut.channels[0];
    const N = y.length;
    // the wrap is as smooth as the signal's own steps
    let step = 0;
    for (let i = 1; i < N; i++) step = Math.max(step, Math.abs(y[i] - y[i - 1]));
    assert.ok(Math.abs(y[0] - y[N - 1]) <= step * 1.01, `${name} wraps without a jump`);
    // the crossfade keeps the level: RMS over the crossfade is within 1 dB of the body's
    const rms = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += y[i] * y[i]; return Math.sqrt(e / (b - a)); };
    const X = Math.round(cut.xfade * sr);
    const dB = 20 * Math.log10(rms(0, X) / rms(X, N));
    assert.ok(Math.abs(dB) < 1, `${name} crossfade level ${dB.toFixed(2)} dB`);
  }
  assert.equal(seamless([new Float32Array(2 * sr)], sr), null, 'too short to loop');
});
