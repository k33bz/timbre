// The security-door welcome, in the classic synthesized PA voice. Spoken by the formant speech engine (T.speak): text to phonemes by the NRL
// letter-to-sound rules, a Klatt-style cascade/parallel synthesizer, then the voice's effect chain.
export default {
  id: 'voice-access-granted',
  name: 'Access Granted',
  category: 'voice',
  tags: ['voice', 'speech', 'access', 'granted', 'success', 'security', 'unlocked', 'approved'],
  desc: 'A synthesized announcer says "Access granted." for an unlocked door, an accepted password or an approved request.',
  // the slowest rate in the slowest voice, its tail included (node build.mjs --say "Access granted.")
  dur: 3.3,
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 5, def: 1, step: 1, choices: ['announcer-female', 'announcer', 'deep', 'retro', 'small', 'whisper'], desc: 'Who speaks: Announcer (Female) or (Male), Deep Robot, Retro Computer, Small Robot, Whisper' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    rate: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Slow and deliberate to brisk' },
    range: { min: 0, max: 2, def: 1, desc: 'Intonation: 0 flat, 1 the voice\'s own, 2 animated' },
  },
  play(T, out, t, p) {
    const voice = ['announcer-female', 'announcer', 'deep', 'retro', 'small', 'whisper'][Math.round(p.voice)];
    T.speak(out, t, { text: 'Access granted.', voice, pitch: p.pitch, rate: p.rate, range: p.range });
  },
};
