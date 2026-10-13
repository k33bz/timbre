// The recording mock and the offline renderer, on hand-built graphs with known answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockContext } from '../lib/mockaudio.js';
import { renderGraph, measureSignal } from '../lib/render.js';

const SR = 48000;
const rmsOf = (y, from = 0, to = y.length) => {
  let s = 0;
  for (let i = from; i < to; i++) s += y[i] * y[i];
  return Math.sqrt(s / (to - from));
};
const dbOf = (v) => 20 * Math.log10(v);

/** osc -> [nodes...] -> destination, with the oscillator running for `seconds`. */
function chain(type, f, seconds, make) {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  let tail = o;
  for (const m of make ? make(ctx) : []) { tail.connect(m); tail = m; }
  tail.connect(ctx.destination);
  o.start(0);
  o.stop(seconds);
  return ctx;
}

test('a sine renders at the right level: RMS 0.707, peak 1', () => {
  const y = renderGraph(chain('sine', 440, 0.5), 0.5);
  assert.ok(Math.abs(rmsOf(y) - 0.7071) < 0.01);
  assert.ok(Math.max(...y) > 0.999);
});

test('the four waves have their known RMS', () => {
  const rms = { sine: 0.7071, triangle: 0.5774, square: 1, sawtooth: 0.5774 };
  for (const [type, want] of Object.entries(rms)) {
    const y = renderGraph(chain(type, 200, 0.5), 0.5);
    assert.ok(Math.abs(rmsOf(y) - want) < 0.02, `${type}: ${rmsOf(y)} vs ${want}`);
  }
});

test('the oscillator window is honored: silence before start and after stop', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  o.connect(ctx.destination);
  o.start(0.1);
  o.stop(0.2);
  const y = renderGraph(ctx, 0.4);
  assert.equal(rmsOf(y, 0, 4700), 0);
  assert.ok(rmsOf(y, 5000, 9000) > 0.5);
  assert.equal(rmsOf(y, 9700, y.length), 0);
});

test('gain events: a linear ramp up and an exponential ramp down are followed', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = 1000;
  g.gain.value = 0;
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(1, 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, 0.3);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(0);
  o.stop(0.35);
  const y = renderGraph(ctx, 0.4);
  const at = (t) => rmsOf(y, Math.round(t * SR) - 240, Math.round(t * SR) + 240) * Math.SQRT2;
  assert.ok(Math.abs(at(0.05) - 0.5) < 0.05, `half way up: ${at(0.05)}`);
  assert.ok(Math.abs(at(0.1) - 1) < 0.08, `at the top: ${at(0.1)}`);
  assert.ok(Math.abs(at(0.2) - Math.sqrt(0.001)) < 0.02, `half way down in dB: ${at(0.2)}`);
});

test('a lowpass cuts a tone above its cutoff by about 12 dB per octave', () => {
  const pass = renderGraph(chain('sine', 200, 0.4, (c) => { const b = c.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 1000; b.Q.value = 0; return [b]; }), 0.4);
  const cut = renderGraph(chain('sine', 4000, 0.4, (c) => { const b = c.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 1000; b.Q.value = 0; return [b]; }), 0.4);
  const a = rmsOf(pass, 4800, 18000);
  const b = rmsOf(cut, 4800, 18000);
  assert.ok(Math.abs(dbOf(a) - dbOf(0.7071)) < 0.5, 'passband is flat');
  assert.ok(dbOf(a) - dbOf(b) > 20 && dbOf(a) - dbOf(b) < 32, `two octaves up cut ${dbOf(a) - dbOf(b)} dB`);
});

test('a highpass passes a tone above its cutoff and removes one below', () => {
  const mk = (c) => { const b = c.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = 2000; b.Q.value = 0; return [b]; };
  const hi = rmsOf(renderGraph(chain('sine', 8000, 0.3, mk), 0.3), 4800, 14000);
  const lo = rmsOf(renderGraph(chain('sine', 200, 0.3, mk), 0.3), 4800, 14000);
  assert.ok(Math.abs(dbOf(hi) - dbOf(0.7071)) < 0.5);
  assert.ok(dbOf(hi) - dbOf(lo) > 25);
});

test('a bandpass passes its center at unity gain', () => {
  const y = renderGraph(chain('sine', 1000, 0.3, (c) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1000; b.Q.value = 5; return [b]; }), 0.3);
  assert.ok(Math.abs(dbOf(rmsOf(y, 6000, 14000)) - dbOf(0.7071)) < 0.5);
});

test('a filter sweep follows its frequency events', () => {
  // a 1 kHz tone under a lowpass swept from 200 Hz up to 8 kHz: quiet first, loud last
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  o.frequency.value = 1000;
  const b = ctx.createBiquadFilter();
  b.type = 'lowpass';
  b.Q.value = 0;
  b.frequency.setValueAtTime(200, 0);
  b.frequency.exponentialRampToValueAtTime(8000, 0.4);
  o.connect(b);
  b.connect(ctx.destination);
  o.start(0);
  o.stop(0.4);
  const y = renderGraph(ctx, 0.5);
  assert.ok(rmsOf(y, 19000, 19400) > 4 * rmsOf(y, 1000, 1400));
});

test('FM: a modulator on the carrier frequency spreads the energy (sidebands), and still renders', () => {
  const ctx = new MockContext(SR);
  const car = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const depth = ctx.createGain();
  car.frequency.value = 440;
  mod.frequency.value = 220;
  depth.gain.value = 400;
  mod.connect(depth);
  depth.connect(car.frequency);
  car.connect(ctx.destination);
  car.start(0); mod.start(0); car.stop(0.3); mod.stop(0.3);
  const y = renderGraph(ctx, 0.3);
  assert.ok(Math.abs(rmsOf(y) - 0.7071) < 0.1, `a frequency-modulated sine keeps roughly its power: ${rmsOf(y)}`);
  // not a pure 440 Hz sine any more: the zero crossings move
  const pure = renderGraph(chain('sine', 440, 0.3), 0.3);
  let diff = 0;
  for (let i = 0; i < y.length; i++) diff += Math.abs(y[i] - pure[i]);
  assert.ok(diff / y.length > 0.1);
});

test('tremolo: an LFO on a gain parameter makes the level wobble', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  o.frequency.value = 2000;
  const am = ctx.createGain();
  am.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 10;
  const lg = ctx.createGain();
  lg.gain.value = 0.5;
  lfo.connect(lg);
  lg.connect(am.gain);
  o.connect(am);
  am.connect(ctx.destination);
  o.start(0); lfo.start(0); o.stop(0.5); lfo.stop(0.5);
  const y = renderGraph(ctx, 0.5);
  const win = 480;
  const levels = [];
  for (let i = 0; i + win <= y.length; i += win) levels.push(rmsOf(y, i, i + win));
  assert.ok(Math.max(...levels) > 0.6 && Math.min(...levels) < 0.1, 'swings between loud and near silent');
});

test('a waveshaper applies its curve', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  o.frequency.value = 300;
  const g = ctx.createGain();
  g.gain.value = 3;
  const ws = ctx.createWaveShaper();
  const cur = new Float32Array(2048);
  for (let k = 0; k < 2048; k++) cur[k] = 0.5 * Math.tanh(2 * ((k * 2) / 2047 - 1));
  ws.curve = cur;
  o.connect(g); g.connect(ws); ws.connect(ctx.destination);
  o.start(0); o.stop(0.2);
  const y = renderGraph(ctx, 0.2);
  assert.ok(Math.max(...y) <= 0.5 + 1e-6, 'bounded by the ceiling');
  assert.ok(Math.max(...y) > 0.45, 'and driven up to it');
});

test('looped buffers play their data; one-shot buffers stop at their end', () => {
  const ctx = new MockContext(SR);
  const buf = ctx.createBuffer(1, 100, SR);
  buf.getChannelData(0).fill(0.25);
  const loop = ctx.createBufferSource();
  loop.buffer = buf;
  loop.loop = true;
  loop.connect(ctx.destination);
  loop.start(0);
  loop.stop(0.01);
  const shot = ctx.createBufferSource();
  shot.buffer = buf;
  shot.connect(ctx.destination);
  shot.start(0.02);
  shot.stop(0.05);
  const y = renderGraph(ctx, 0.06);
  assert.equal(y[100], 0.25, 'looped past its length');
  assert.equal(y[479], 0.25);
  assert.equal(y[500], 0, 'nothing between the two');
  assert.equal(y[960 + 99], 0.5 * 0 + 0.25, 'the one-shot plays its 100 samples');
  assert.equal(y[960 + 100], 0, 'and stops');
});

test('delay and convolver branches are left out (the dry path is what renders)', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  const dry = ctx.createGain();
  const dl = ctx.createDelay();
  o.connect(dry); dry.connect(ctx.destination);
  o.connect(dl); dl.connect(ctx.destination);
  o.start(0); o.stop(0.1);
  const y = renderGraph(ctx, 0.2);
  assert.ok(Math.abs(rmsOf(y, 0, 4800) - 0.7071) < 0.02);
});

test('a feedback loop does not hang the renderer', () => {
  const ctx = new MockContext(SR);
  const o = ctx.createOscillator();
  const a = ctx.createGain();
  const b = ctx.createGain();
  o.connect(a); a.connect(b); b.connect(a); a.connect(ctx.destination);
  o.start(0); o.stop(0.05);
  const y = renderGraph(ctx, 0.1);
  assert.equal(y.length, 4800);
});

test('measureSignal follows the gate: peak, audible RMS, end, tail', () => {
  const y = new Float32Array(SR);
  for (let i = 0; i < 4800; i++) y[i] = 0.1 * Math.sin((2 * Math.PI * 440 * i) / SR);
  const m = measureSignal(y, SR, 0.5);
  assert.equal(m.peak, -20);
  assert.ok(Math.abs(m.rms - -23.0) < 0.2, `rms ${m.rms}`);
  assert.equal(m.silent, false);
  assert.equal(m.tail, -120, 'nothing after the declared duration');
  assert.ok(m.end > 0.09 && m.end < 0.101, `audible until ${m.end}`);
  // a stray sample past the declared duration shows in the tail and stretches the audible span
  const z = Float32Array.from(y);
  z[SR - 10] = 0.002;
  const mz = measureSignal(z, SR, 0.5);
  assert.equal(mz.tail, -54);
  assert.ok(mz.end > 0.99);
  assert.equal(measureSignal(new Float32Array(100), SR, 0.1).silent, true);
});

test('the mock throws where the real API throws, in strict mode', () => {
  const ctx = new MockContext(SR, { strict: true });
  const g = ctx.createGain();
  assert.throws(() => g.gain.exponentialRampToValueAtTime(0, 1), RangeError);
  assert.throws(() => g.gain.setValueAtTime(NaN, 0), TypeError);
  assert.throws(() => g.gain.setValueAtTime(1, -1), RangeError);
  assert.throws(() => g.connect({}), TypeError);
  const o = ctx.createOscillator();
  assert.throws(() => o.stop(1), /before start/);
  o.start(0);
  assert.throws(() => o.start(0), /twice/);
  const lenient = new MockContext(SR);
  assert.doesNotThrow(() => lenient.createGain().gain.setValueAtTime(1, -1));
});
