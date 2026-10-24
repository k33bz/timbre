// Many breathy whispers of nonsense phonemes spread around the listener, staggered, each swelling
// and fading, the whole crowd rising and falling in a room. The phonemes are drawn from a small
// whisper-friendly pool so no word ever forms.
export default {
  id: 'dark-whisper-swarm',
  name: 'Whisper Swarm',
  category: 'dark',
  tags: ['whisper', 'whispers', 'voices', 'ghost', 'crowd', 'haunted', 'dark', 'eerie', 'surround', 'unintelligible'],
  desc: 'A crowd of unintelligible whispers close around you from every side, rising and fading. For a haunted room, a bad idea or something watching.',
  dur: 6.8,
  family: 'voice',
  moments: ['scare', 'tension', 'ambience'],
  params: {
    voices: { min: 3, max: 10, def: 7, step: 1, desc: 'How many whisperers: a few is intimate, many a crowd' },
    density: { min: 0, max: 1, def: 0.5, desc: 'How much they overlap: 0 short murmurs, 1 long whispers piled on each other' },
    length: { min: 3, max: 6, def: 4.5, unit: 's', desc: 'How long the swell lasts before it fades' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.voices);
    const room = T.reverb(out, t, { time: 1.8, mix: 0.35, tone: 0.4 });
    const cons = ['S', 'SH', 'F', 'TH', 'HH', 'S', 'SH', 'HH'];
    const vows = ['IH0', 'AH0', 'UW1', 'EH1', 'AH1', 'IH1'];
    for (let k = 0; k < n; k++) {
      // each whisperer: a made-up run of syllables, a place around the head, a late start
      const syl = 2 + Math.round(T.rand(0, 1) + p.density * 3);
      const words = [];
      for (let s = 0; s < syl; s++) {
        words.push(cons[Math.floor(T.rand(0, cons.length))] + ' ' + vows[Math.floor(T.rand(0, vows.length))] + (T.rand(0, 1) > 0.6 ? ' ' + cons[Math.floor(T.rand(0, cons.length))] : ''));
      }
      const ph = words.join(' / ');
      const rate = T.rand(0.7, 1.0);
      const wl = T.speak(null, 0, { ph, voice: 'whisper', rate });
      const x = T.rand(-1, 1);
      const where = T.rand(0, 1);
      const start = where * Math.max(0, p.length - wl);
      // the crowd as a whole rises and falls: louder whispers near the middle of the span
      const mid = Math.sin(Math.PI * Math.min(1, (start + wl / 2) / p.length));
      const lvl = 0.35 + 0.65 * mid;
      const place = T.pan(room, t, { x, to: -x * 0.6, dur: wl });
      T.speak(place, t + start, { ph, voice: 'whisper', rate, pitch: T.rand(-3, 3), peak: (0.2 * lvl) / Math.sqrt(n) });
    }
  },
};
