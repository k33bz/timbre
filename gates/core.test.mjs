// Core helpers on the mock graph: every voice and effect runs with no options, envelopes start at
// zero and end silent, seeded noise is reproducible, and the computed buffers (pluck, reverb) are
// shaped as documented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from '../src/core/t.js';
import { MockContext } from './lib/mockaudio.mjs';

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
