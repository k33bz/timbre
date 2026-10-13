// A small recording stand-in for the WebAudio graph, for Node (which has no WebAudio).
//
// It builds no sound. It records what a sound schedules: every node, how nodes connect, every
// AudioParam event, every source's start and stop. The level estimator reads that record, and the
// tests run generated code (Copy functions, kits) against it.
//
// With { strict: true } it also throws where the real API throws (non-finite values or times,
// negative times, exponential ramps to zero, connecting to something that is not a node), so a
// test fails on a bug the browser would have reported.

class Param {
  constructor(ctx, v) { this.ctx = ctx; this._v = v; this.events = []; this.mods = []; }
  get value() { return this._v; }
  set value(v) { this.ctx.num(v, 'value'); this._v = v; }
  setValueAtTime(v, t) { this.ctx.num(v, 'value'); this.ctx.time(t); this.events.push({ type: 'set', v, t }); return this; }
  linearRampToValueAtTime(v, t) { this.ctx.num(v, 'value'); this.ctx.time(t); this.events.push({ type: 'lin', v, t }); return this; }
  exponentialRampToValueAtTime(v, t) {
    this.ctx.num(v, 'value');
    this.ctx.time(t);
    if (this.ctx.strict && !(v > 0)) throw new RangeError('exponentialRampToValueAtTime: value must be above zero, got ' + v);
    this.events.push({ type: 'exp', v, t });
    return this;
  }
  setTargetAtTime(v, t, k) { this.ctx.num(v, 'value'); this.ctx.time(t); this.ctx.num(k, 'timeConstant'); this.events.push({ type: 'target', v, t }); return this; }
  setValueCurveAtTime(curve, t, d) { this.ctx.time(t); this.ctx.num(d, 'duration'); this.events.push({ type: 'curve', v: curve[curve.length - 1], t }); return this; }
  cancelScheduledValues(t) { this.ctx.time(t); return this; }
}

class Node {
  constructor(ctx, kind, params = {}) {
    this.context = ctx;
    this.kind = kind;
    this.outs = [];
    this.channelCount = 2;
    this.channelCountMode = 'max';
    this.channelInterpretation = 'speakers';
    for (const [k, v] of Object.entries(params)) this[k] = new Param(ctx, v);
    ctx.nodes.push(this);
  }
  connect(dest) {
    if (!(dest instanceof Node) && !(dest instanceof Param)) throw new TypeError('connect: not an AudioNode or AudioParam');
    this.outs.push(dest);
    if (dest instanceof Param) dest.mods.push(this);
    return dest instanceof Node ? dest : undefined;
  }
  disconnect() { this.outs = []; }
}

class Source extends Node {
  start(t = 0) {
    this.context.time(t);
    if (this.started != null) throw new Error('start() called twice');
    this.started = t;
  }
  stop(t = 0) {
    this.context.time(t);
    if (this.started == null) throw new Error('stop() before start()');
    this.stopped = t;
    if (t > this.context.lastStop) this.context.lastStop = t;
  }
}

class Buffer {
  constructor(ch, len, sr) {
    if (!(len > 0) || !(sr > 0) || !(ch > 0)) throw new RangeError('createBuffer: bad size');
    this.numberOfChannels = ch;
    this.length = len;
    this.sampleRate = sr;
    this.duration = len / sr;
    this.data = Array.from({ length: ch }, () => new Float32Array(len));
  }
  getChannelData(c) { return this.data[c]; }
}

export class MockContext {
  constructor(sampleRate = 48000, { strict = false } = {}) {
    this.sampleRate = sampleRate;
    this.strict = strict;
    this.currentTime = 0;
    this.state = 'running';
    this.nodes = [];
    this.lastStop = 0;
    this.destination = new Node(this, 'destination');
  }
  num(v, what) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(what + ' is not a finite number: ' + v);
  }
  time(t) {
    this.num(t, 'time');
    if (this.strict && t < 0) throw new RangeError('negative time ' + t);
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return new Node(this, 'gain', { gain: 1 }); }
  createOscillator() {
    const n = new Source(this, 'osc', { frequency: 440, detune: 0 });
    n.type = 'sine';
    n.setPeriodicWave = (w) => { n.type = 'custom'; n.wave = w; };
    return n;
  }
  createPeriodicWave(real, imag) { return { real: Float32Array.from(real), imag: Float32Array.from(imag) }; }
  createBufferSource() { const n = new Source(this, 'buffer', { playbackRate: 1, detune: 0 }); n.buffer = null; n.loop = false; return n; }
  createBiquadFilter() { const n = new Node(this, 'biquad', { frequency: 350, Q: 1, gain: 0, detune: 0 }); n.type = 'lowpass'; return n; }
  createWaveShaper() { const n = new Node(this, 'shaper'); n.curve = null; n.oversample = 'none'; return n; }
  createDynamicsCompressor() { return new Node(this, 'compressor', { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 }); }
  createDelay() { return new Node(this, 'delay', { delayTime: 0 }); }
  createConvolver() { const n = new Node(this, 'convolver'); n.buffer = null; n.normalize = true; return n; }
  createStereoPanner() { return new Node(this, 'panner', { pan: 0 }); }
  createChannelMerger() { return new Node(this, 'merger'); }
  createChannelSplitter() { return new Node(this, 'splitter'); }
  createAnalyser() { return new Node(this, 'analyser'); }
  createBuffer(ch, len, sr) { return new Buffer(ch, len, sr); }
}
