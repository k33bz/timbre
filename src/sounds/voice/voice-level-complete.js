// A game announcer calling the end of a stage. Spoken by the formant speech engine (T.speak): text to phonemes by the NRL
// letter-to-sound rules, a Klatt-style cascade/parallel synthesizer, then the voice's effect chain.
export default {
  id: 'voice-level-complete',
  name: 'Level Complete',
  category: 'voice',
  tags: ['voice', 'speech', 'level-complete', 'victory', 'stage-clear', 'win', 'game'],
  desc: 'A synthesized announcer says "Level complete." at the end of a stage.',
  // the slowest rate in the slowest voice, its tail included (node build.mjs --say "Level complete.")
  dur: 3.1,
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 4, def: 0, step: 1, choices: ['announcer', 'deep', 'small', 'whisper', 'retro'], desc: 'Who speaks: announcer, deep or small robot, whisper, retro computer' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 flat, 1 the voice\'s own, 2 animated' },
  },
  play(T, out, t, p) {
    const voice = ['announcer', 'deep', 'small', 'whisper', 'retro'][Math.round(p.voice)];
    T.speak(out, t, { text: 'Level complete.', voice, pitch: p.pitch, rate: p.rate, range: p.range });
  },
};
