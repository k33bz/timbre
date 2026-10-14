// The arcade end-of-run call, in a deep machine voice by default. Spoken by the formant speech engine (T.speak): text to phonemes by the NRL
// letter-to-sound rules, a Klatt-style cascade/parallel synthesizer, then the voice's effect chain.
export default {
  id: 'voice-game-over',
  name: 'Game Over',
  category: 'voice',
  tags: ['voice', 'speech', 'game-over', 'defeat', 'lose', 'arcade', 'game'],
  desc: 'A deep robot voice says "Game over." with a slow falling close, for the end of a run.',
  // the slowest rate in the slowest voice, its tail included (node build.mjs --say "Game over.")
  dur: 2.65,
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 5, def: 1, step: 1, choices: ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female'], desc: 'Who speaks: announcer (male), deep or small robot, whisper, retro computer, female announcer' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 flat, 1 the voice\'s own, 2 animated' },
  },
  play(T, out, t, p) {
    const voice = ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female'][Math.round(p.voice)];
    T.speak(out, t, { text: 'Game over.', voice, pitch: p.pitch, rate: p.rate, range: p.range });
  },
};
