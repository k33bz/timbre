// The announcer hands the turn over: "Your turn." (or "Your move.", "You're up."), in Announcer
// (Female) by default. Spoken by the formant speech engine (T.speak): text to phonemes by the NRL
// letter-to-sound rules, a Klatt-style cascade/parallel synthesizer, then the voice's effect chain.
export default {
  id: 'voice-your-turn',
  name: 'Your Turn Call',
  category: 'voice',
  tags: ['voice', 'speech', 'your-turn', 'your-move', 'turn-start', 'announcer', 'game', 'cards'],
  desc: 'A synthesized announcer says "Your turn." when control passes to the player: a turn-based game, a card table, a shared session.',
  // the slowest rate in the slowest voice, its tail included (node build.mjs --say "Your move.")
  dur: 2.8,
  family: 'voice',
  moments: ['your-turn', 'announce'],
  params: {
    voice: { min: 0, max: 8, def: 0, step: 1, choices: ['announcer-female', 'announcer', 'deep', 'narrator-female', 'narrator', 'retro', 'small', 'guide', 'whisper'], desc: 'Who speaks: announcers, Deep Robot, narrators, Retro Computer, Small Robot, Soft Guide, Whisper' },
    line: { min: 0, max: 2, def: 0, step: 1, choices: ['your-turn', 'your-move', 'you-are-up'], desc: 'What is said: Your turn, Your move or You are up' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 flat, 1 the voice\'s own, 2 animated' },
  },
  play(T, out, t, p) {
    const voice = ['announcer-female', 'announcer', 'deep', 'narrator-female', 'narrator', 'retro', 'small', 'guide', 'whisper'][Math.round(p.voice)];
    const text = ['Your turn.', 'Your move.', "You're up."][Math.round(p.line)];
    T.speak(out, t, { text, voice, pitch: p.pitch, rate: p.rate, range: p.range });
  },
};
