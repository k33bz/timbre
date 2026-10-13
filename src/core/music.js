// Musical pitch and chords.
import { osc } from './voices.js';

/**
 * Frequency in Hz of a note name ('A4', 'C#5', 'Eb3') or of a number of semitones from A4.
 * note('A4') = 440, note(12) = 880, note('C6') = 1046.5.
 */
export function note(n) {
  if (typeof n === 'number') return 440 * Math.pow(2, n / 12);
  const s = String(n);
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[s.charAt(0).toUpperCase()];
  if (base == null) return 440;
  let i = 1;
  let acc = 0;
  if (s.charAt(1) === '#') { acc = 1; i = 2; } else if (s.charAt(1) === 'b') { acc = -1; i = 2; }
  const oct = parseInt(s.slice(i), 10);
  return 440 * Math.pow(2, (base + acc + ((isNaN(oct) ? 4 : oct) - 4) * 12) / 12);
}

/**
 * Several notes at once through one voice, the level split so the notes together never peak above
 * o.peak. Returns the latest end time.
 *   o.notes   note names ('C4'), Hz, or with o.root semitones above it ([0, 4, 7]) (default C major)
 *   o.root    a note name or Hz; makes numeric notes semitone offsets from it
 *   o.voice   the voice for each note (default T.osc; T.pulse, T.pluck, T.bell and T.fm work)
 *   o.strum   seconds between note onsets, low to high (default 0); negative strums from the top down
 *   o.peak    the whole chord's level (default 0.2), split evenly between the notes
 *   o.spread  detune spread across the notes in cents (default 0), for a wider, chorused chord
 *   o.bend    end pitch / start pitch for every note (default 1: none)
 *   any other option goes to the voice as it is (type, dur, a, s, r, lp, bright, duty, ...)
 */
export function chord(out, t, o) {
  o = o || {};
  const voice = o.voice || osc;
  const root = o.root == null ? null : typeof o.root === 'number' ? o.root : note(o.root);
  const hz = (n) => (typeof n === 'string' ? note(n) : root != null ? root * Math.pow(2, n / 12) : n);
  const list = (o.notes || ['C4', 'E4', 'G4']).map(hz);
  const k = list.length;
  const peak = (o.peak == null ? 0.2 : o.peak) / Math.max(1, k);
  const strum = o.strum || 0;
  let end = t;
  for (let i = 0; i < k; i++) {
    const v = Object.assign({}, o, { f: list[i], peak });
    if (o.bend) v.to = list[i] * o.bend;
    if (o.spread && k > 1) v.detune = (o.detune || 0) + o.spread * (i / (k - 1) - 0.5);
    const e = voice(out, t + (strum < 0 ? (k - 1 - i) * -strum : i * strum), v);
    if (e > end) end = e;
  }
  return end;
}
