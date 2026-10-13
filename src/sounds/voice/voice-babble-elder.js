// A wise elder telling a story, slow and trembling. Animalese / Undertale style talk from the babble engine
// (T.babble): formant-shaped vowel blips with a consonant onset, pitched per voice.
export default {
  id: 'voice-babble-elder',
  name: 'Elder Babble',
  category: 'voice',
  tags: ['voice', 'babble', 'talk', 'dialogue', 'elder', 'old', 'wise', 'sage', 'slow', 'breathy'],
  desc: 'Slow, breathy, trembling talk syllables with a little room: a wise elder telling an old story.',
  // the slowest speed, its tail included (node build.mjs --say "..." --babble)
  dur: 4.65,
  family: 'voice',
  moments: ['dialogue'],
  params: {
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    speed: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Drawn out to rapid fire' },
    spread: { min: 0, max: 2, def: 1, desc: 'Pitch spread: 0 a monotone, 1 the voice\'s own, 2 wild' },
  },
  play(T, out, t, p) {
    T.babble(out, t, { text: 'Ah... long ago, the stars fell here.', voice: 'elder', pitch: p.pitch, speed: p.speed, spread: p.spread });
  },
};
