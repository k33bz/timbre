// A slow chord of soft triangle and sine notes (a fifth, a ninth, then a raised fourth and a major
// seventh as the glow opens), each note a pair split by under a hertz and placed on opposite sides,
// so the pair beats slowly and the whole chord sways across the field. Every note swells on its own
// slow tremolo, like curtains of light, and a room carries it all. High sines add a thin glitter.
export default {
  id: 'ambience-aurora-pad',
  name: 'Aurora Pad',
  category: 'ambience',
  tags: ['aurora', 'pad', 'shimmer', 'ethereal', 'glow', 'northern-lights', 'wide', 'calm', 'bed'],
  desc: 'A slow, wide, glowing chord that swells and sways like curtains of light, with a thin glitter above. A dreamy bed for a night sky.',
  dur: 8,
  family: 'synthetic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 7, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 110, max: 262, def: 165, unit: 'Hz', desc: 'Root of the chord, the other notes follow it' },
    glow: { min: 0, max: 1, def: 0.5, desc: 'How many bright upper notes and how much glitter join the chord: 0 plain and warm, 1 lit up' },
    drift: { min: 0, max: 1, def: 0.5, desc: 'How far the chord sways and swells: 0 nearly still, 1 rolling slowly across the field' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.8, L * 0.3);
    const f0 = p.pitch;
    const d = p.drift;
    // voices stop 1 s early so the room has rung out by dur
    const room = T.reverb(out, t, { time: 1.4, mix: 0.45, tone: 0.6 });
    const body = L - 1;
    // semitones above the root, the level of each note, and how much glow it needs to sound
    const notes = [
      [0, 1, 0, 'triangle'], [7, 0.8, 0, 'triangle'], [14, 0.6, 0, 'sine'],
      [18, 0.4, 0.35, 'sine'], [23, 0.35, 0.5, 'sine'], [26, 0.3, 0.7, 'sine'],
    ];
    notes.forEach((nt, k) => {
      const lift = nt[2] > 0 ? Math.max(0, Math.min(1, (p.glow - nt[2] * 0.6) / 0.4)) : 1;
      if (lift <= 0) return;
      const f = f0 * Math.pow(2, nt[0] / 12);
      const rate = 0.08 + 0.045 * k;
      const beat = 0.3 + 0.08 * k;
      [-1, 1].forEach((s) => {
        const x = s * (0.55 + 0.4 * ((k % 3) / 2));
        const place = T.pan(room, t, { x, to: x - s * 0.8 * d, dur: body });
        T.osc(place, t + 0.2 * k, {
          type: nt[3], f: f + (s * beat) / 2, dur: body - 0.2 * k, peak: 0.015 * nt[1] * lift,
          a: fade, s: 1, d: 0.02, r: fade, trem: { rate, depth: 0.15 + 0.6 * d },
        });
      });
    });
    // the glitter: slow trembling high sines that lie on chord tones
    [4, 6, 9].forEach((m, k) => {
      const place = T.pan(room, t, { x: k === 1 ? 0.6 : -0.6, to: k === 1 ? -0.6 : 0.6, dur: body });
      T.osc(place, t, {
        f: f0 * m, dur: body, peak: 0.008 * p.glow, a: fade, s: 1, d: 0.02, r: fade * 0.8,
        trem: { rate: 0.17 + 0.09 * k, depth: 0.9 }, vib: { rate: 0.4, depth: 7 },
      });
    });
  },
};
