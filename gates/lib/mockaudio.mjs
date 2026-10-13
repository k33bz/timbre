// A minimal stand-in for the WebAudio graph, for Node (which has no WebAudio). It builds no sound;
// it records what a sound schedules and throws where the real API throws, so the build and the
// unit tests can run a sound's play() and every helper it calls without a browser:
//   * non-finite values or times           -> TypeError   (real API: TypeError)
//   * negative times                       -> RangeError
//   * exponential ramps to zero or below   -> RangeError
//   * connect() to something that is not a node or a param
// The context records the latest stop() time of any source (lastStop), which the build compares
// with the sound's declared dur.

class Param {
  constructor(ctx, v) { this.ctx = ctx; this._v = v; this.events = []; }
  get value() { return this._v; }
  set value(v) { this.ctx.num(v, 'value'); this._v = v; }
  setValueAtTime(v, t) { this.ctx.num(v, 'value'); this.ctx.time(t); this.events.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { this.ctx.num(v, 'value'); this.ctx.time(t); this.events.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) {
    this.ctx.num(v, 'value'); this.ctx.time(t);
    if (!(v > 0)) throw new RangeError('exponentialRampToValueAtTime: value must be above zero, got ' + v);
    const prev = this.events.length ? this.events[this.events.length - 1][1] : this._v;
    if (!(prev > 0)) throw new RangeError('exponentialRampToValueAtTime from a value of ' + prev);
    this.events.push(['exp', v, t]); return this;
  }
  setTargetAtTime(v, t, k) { this.ctx.num(v, 'value'); this.ctx.time(t); this.ctx.num(k, 'timeConstant'); this.events.push(['target', v, t]); return this; }
  setValueCurveAtTime(curve, t, d) { this.ctx.time(t); this.ctx.num(d, 'duration'); this.events.push(['curve', curve[curve.length - 1], t]); return this; }
  cancelScheduledValues(t) { this.ctx.time(t); return this; }
}

class Node {
  constructor(ctx, params = {}) {
    this.context = ctx;
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
    return dest instanceof Node ? dest : undefined;
  }
  disconnect() { this.outs = []; }
}

class Source extends Node {
  start(t = 0) { this.context.time(t); if (this.started != null) throw new Error('start() called twice'); this.started = t; }
  stop(t = 0) {
    this.context.time(t);
    if (this.started == null) throw new Error('stop() before start()');
    this.stopped = t;
    if (t > this.context.lastStop) this.context.lastStop = t;
  }
}

class PeriodicWave {
  constructor(real, imag) { this.real = Float32Array.from(real); this.imag = Float32Array.from(imag); }
}

class Buffer {
  constructor(ch, len, sr) {
    if (!(len > 0) || !(sr > 0) || !(ch > 0)) throw new RangeError('createBuffer: bad size');
    this.numberOfChannels = ch; this.length = len; this.sampleRate = sr; this.duration = len / sr;
    this.data = Array.from({ length: ch }, () => new Float32Array(len));
  }
  getChannelData(c) { return this.data[c]; }
}

export class MockContext {
  constructor(sampleRate = 48000) {
    this.sampleRate = sampleRate;
    this.currentTime = 0;
    this.nodes = [];
    this.lastStop = 0;
    this.destination = new Node(this);
  }
  num(v, what) { if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(what + ' is not a finite number: ' + v); }
  time(t) { this.num(t, 'time'); if (t < 0) throw new RangeError('negative time ' + t); }
  createGain() { return new Node(this, { gain: 1 }); }
  createOscillator() {
    const n = new Source(this, { frequency: 440, detune: 0 });
    n.type = 'sine';
    n.setPeriodicWave = (w) => { if (!(w instanceof PeriodicWave)) throw new TypeError('setPeriodicWave: not a PeriodicWave'); n.type = 'custom'; n.wave = w; };
    return n;
  }
  createPeriodicWave(real, imag) {
    if (!real || !imag || real.length !== imag.length || real.length < 2) throw new RangeError('createPeriodicWave: real and imag must be arrays of the same length, at least 2');
    return new PeriodicWave(real, imag);
  }
  createBufferSource() { const n = new Source(this, { playbackRate: 1, detune: 0 }); n.buffer = null; n.loop = false; return n; }
  createBiquadFilter() { const n = new Node(this, { frequency: 350, Q: 1, gain: 0, detune: 0 }); n.type = 'lowpass'; return n; }
  createWaveShaper() { const n = new Node(this); n.curve = null; n.oversample = 'none'; return n; }
  createDynamicsCompressor() { return new Node(this, { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 }); }
  createDelay(max = 1) { return new Node(this, { delayTime: 0 }); }
  createConvolver() { const n = new Node(this); n.buffer = null; n.normalize = true; return n; }
  createStereoPanner() { return new Node(this, { pan: 0 }); }
  createChannelMerger() { return new Node(this); }
  createChannelSplitter() { return new Node(this); }
  createAnalyser() { return new Node(this); }
  createBuffer(ch, len, sr) { return new Buffer(ch, len, sr); }
}
