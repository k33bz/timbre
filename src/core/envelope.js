// Envelopes and parameter glides.

/**
 * Shape an AudioParam (usually a voice's gain) from time t. Returns the end time.
 *   o.peak   level reached at the end of the attack (linear, pre-master; house voices sit <= 0.3)
 *   o.a      attack seconds (default 0.005, at least 0.002 so nothing clicks)
 *   o.dur    total length from t, attack included (default 0.2)
 *   o.curve  'exp' (default) or 'lin' for the decay and release segments
 *   o.s      sustain as a fraction of peak; 0 or absent = percussive (attack, then decay to silence)
 *   o.d      decay seconds to the sustain level (default 0.05)
 *   o.r      release seconds at the end of dur (default 0.05)
 *   o.tail   a slower tail: the exponential decay (or release) only falls to tail x its starting
 *            level (0.05 = -26 dB) and a linear fade of o.fade seconds (default 0.02) takes it to
 *            silence at the end. Leave it out for the full exponential decay. Ignored with 'lin'.
 *
 * ZERO FIRST. A GainNode passes its own value (1 by default) until its first automation event. A
 * source whose start time rounds to a frame a hair before t emits its first sample on that frame,
 * so a voice with an untouched gain clicked at full scale on its first sample. Setting the value to
 * 0 before scheduling anything closes that gap (found and measured in the Deck Lab reference).
 */
export function env(param, t, o) {
  o = o || {};
  const peak = Math.max(0.0002, o.peak == null ? 0.2 : o.peak);
  const a = Math.max(0.002, o.a == null ? 0.005 : o.a);
  const end = t + Math.max(a + 0.01, o.dur == null ? 0.2 : o.dur);
  const lin = o.curve === 'lin';
  const floor = 0.0001;
  param.value = 0;
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + a);
  let from = peak;
  let start = t + a;
  if (o.s > 0) {
    const sus = Math.max(floor * 2, peak * Math.min(1, o.s));
    const rel = Math.max(0.005, o.r == null ? 0.05 : o.r);
    const rs = Math.max(t + a + 0.001, end - rel);
    const ds = Math.min(t + a + Math.max(0.002, o.d == null ? 0.05 : o.d), rs);
    if (lin) param.linearRampToValueAtTime(sus, ds);
    else param.exponentialRampToValueAtTime(sus, ds);
    param.setValueAtTime(sus, rs);
    from = sus;
    start = rs;
  }
  if (lin) param.linearRampToValueAtTime(0, end);
  else if (o.tail > 0) {
    const fade = Math.min(Math.max(0.005, o.fade == null ? 0.02 : o.fade), (end - start) / 2);
    param.exponentialRampToValueAtTime(Math.max(floor, from * Math.min(1, o.tail)), end - fade);
    param.linearRampToValueAtTime(0, end);
  } else {
    param.exponentialRampToValueAtTime(floor, end);
    param.setValueAtTime(0, end);
  }
  return end;
}

/**
 * Move an AudioParam from `from` (set at t) to `to` over dur seconds.
 * curve 'exp' (default, natural for pitch and cutoff) or 'lin'. Exponential needs both ends above
 * zero, so it falls back to linear when either is not.
 */
export function glide(param, t, from, to, dur, curve) {
  param.setValueAtTime(from, t);
  if (to == null || to === from || !(dur > 0)) return;
  if (curve === 'lin' || from <= 0 || to <= 0) param.linearRampToValueAtTime(to, t + dur);
  else param.exponentialRampToValueAtTime(to, t + dur);
}
