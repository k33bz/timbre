// A count badge popping up a number: one small bubble that bends upward, and a fainter second
// bubble right behind it (the badge overshooting and settling). The count walks up a major
// pentatonic scale, so a badge that goes 1, 2, 3 climbs and stays pleasant at any count. Far
// smaller and higher than the chat message pops, which are two notes and a fourth apart.
export default {
  id: 'notify-badge-pop',
  name: 'Badge Pop',
  category: 'notify',
  tags: ['badge', 'count', 'unread', 'bubble', 'pop', 'bell', 'counter', 'increment'],
  desc: 'One tiny bubbly pop for a badge count going up, with a fainter echo pop behind it. Each count is a step higher on a gentle scale.',
  dur: 0.15,
  family: 'soft',
  moments: ['notify'],
  params: {
    count: { min: 1, max: 10, def: 1, step: 1, desc: 'Badge count: each number is a note higher on a gentle scale, so use 10 for anything bigger' },
    pitch: { min: 330, max: 700, def: 494, unit: 'Hz', desc: 'Note for a count of 1; the higher counts climb from it' },
    bubble: { min: 0, max: 1, def: 0.6, desc: 'How far each pop bends up into its note: 0 a plain blip, 1 a wet bubbly bloop' },
  },
  play(T, out, t, p) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const f = p.pitch * Math.pow(2, scale[Math.max(0, Math.min(9, Math.round(p.count) - 1))] / 12);
    // seeded variation under 1% in pitch, so a run of badges is not one stamped blip
    const j = 1 + T.rand(-0.006, 0.006);
    T.osc(out, t, { f: f * j * (1 - 0.3 * p.bubble), to: f * j, glide: 0.03, dur: 0.1, peak: 0.046, a: 0.004 });
    T.osc(out, t, { f: f * j * 2, dur: 0.04, peak: 0.01, a: 0.004 });
    // the settle: the same note again, small and short
    T.osc(out, t + 0.065, { f: f * j * (1 - 0.15 * p.bubble), to: f * j, glide: 0.02, dur: 0.07, peak: 0.016, a: 0.004 });
  },
};
