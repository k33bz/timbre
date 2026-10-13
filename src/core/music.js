// Musical pitch.

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
