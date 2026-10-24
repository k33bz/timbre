// An eighties home computer speaking through its 8-bit converter. Spoken by the formant speech engine (T.speak): text to phonemes by the NRL
// letter-to-sound rules, a Klatt-style cascade/parallel synthesizer, then the voice's effect chain.
export default {
  id: 'voice-retro-greetings',
  name: 'Retro Computer',
  category: 'voice',
  tags: ['voice', 'speech', 'retro', 'computer', '8-bit', 'loading', 'terminal', 'lo-fi'],
  desc: 'A flat, buzzy home computer voice through an 8-bit converter says "Greetings, user. Loading program. Please wait."',
  // the slowest rate in the slowest voice, its tail included (node build.mjs --say "Greetings, user. Loading program. Please wait.")
  dur: 7.05,
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 8, def: 5, step: 1, choices: ['announcer-female', 'announcer', 'deep', 'narrator-female', 'narrator', 'retro', 'small', 'guide', 'whisper'], desc: 'Who speaks: announcers, Deep Robot, narrators, Retro Computer, Small Robot, Soft Guide, Whisper' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 flat, 1 the voice\'s own, 2 animated' },
  },
  play(T, out, t, p) {
    const voice = ['announcer-female', 'announcer', 'deep', 'narrator-female', 'narrator', 'retro', 'small', 'guide', 'whisper'][Math.round(p.voice)];
    T.speak(out, t, { text: 'Greetings, user. Loading program. Please wait.', voice, pitch: p.pitch, rate: p.rate, range: p.range });
  },
};
