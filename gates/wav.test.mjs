// The WAV encoder writes a standard 16-bit PCM file, and wavChannels picks what to save.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeWav, wavChannels } from '../src/core/wav.js';

const ascii = (u8, at, n) => String.fromCharCode(...u8.slice(at, at + n));

test('header fields describe 16-bit PCM', () => {
  const L = new Float32Array([0, 0.5, -0.5, 1]);
  const R = new Float32Array([0, -1, 1, 0]);
  const u8 = encodeWav([L, R], 48000);
  const v = new DataView(u8.buffer);
  assert.equal(u8.length, 44 + 4 * 2 * 2);
  assert.equal(ascii(u8, 0, 4), 'RIFF');
  assert.equal(v.getUint32(4, true), u8.length - 8);
  assert.equal(ascii(u8, 8, 4), 'WAVE');
  assert.equal(ascii(u8, 12, 4), 'fmt ');
  assert.equal(v.getUint32(16, true), 16);
  assert.equal(v.getUint16(20, true), 1, 'PCM');
  assert.equal(v.getUint16(22, true), 2, 'channels');
  assert.equal(v.getUint32(24, true), 48000);
  assert.equal(v.getUint32(28, true), 48000 * 2 * 2, 'byte rate');
  assert.equal(v.getUint16(32, true), 4, 'block align');
  assert.equal(v.getUint16(34, true), 16, 'bits');
  assert.equal(ascii(u8, 36, 4), 'data');
  assert.equal(v.getUint32(40, true), 16);
});

test('samples are scaled, rounded, clamped and interleaved', () => {
  const L = new Float32Array([0, 0.5, -0.5, 1, -1, 2, -3, NaN]);
  const R = new Float32Array([0.25, 0, 0, 0, 0, 0, 0, 0]);
  const v = new DataView(encodeWav([L, R], 44100).buffer);
  const at = (i, ch) => v.getInt16(44 + (i * 2 + ch) * 2, true);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((i) => at(i, 0)), [0, 16384, -16384, 32767, -32768, 32767, -32768, 0]);
  assert.equal(at(0, 1), Math.round(0.25 * 32767));
});

test('mono files have one channel and the right sizes', () => {
  const u8 = encodeWav([new Float32Array(10)], 22050);
  const v = new DataView(u8.buffer);
  assert.equal(v.getUint16(22, true), 1);
  assert.equal(v.getUint32(28, true), 22050 * 2);
  assert.equal(v.getUint16(32, true), 2);
  assert.equal(v.getUint32(40, true), 20);
});

test('wavChannels cuts at dur, fades the cut, and folds identical channels to mono', () => {
  const sr = 1000;
  const mk = (n, f) => Float32Array.from({ length: n }, (_, i) => f(i));
  const same = { sr, dur: 0.1, post: [mk(150, () => 0.5), mk(150, () => 0.5)] };
  const a = wavChannels(same);
  assert.equal(a.length, 1);
  assert.equal(a[0].length, 100);
  assert.equal(a[0][99], 0, 'the last sample is faded to zero');
  assert.equal(a[0][0], 0.5);
  assert.ok(a[0][97] > 0 && a[0][97] < 0.5);
  const diff = { sr, dur: 0.1, post: [mk(150, () => 0.5), mk(150, (i) => (i === 3 ? 0.4 : 0.5))] };
  assert.equal(wavChannels(diff).length, 2);
  // the render's own arrays are not modified
  assert.equal(same.post[0][99], 0.5);
});
