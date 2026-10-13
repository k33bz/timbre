// An 8-bit text box: a square beep per letter on a pentatonic scale. Animalese / Undertale style talk from the babble engine
// (T.babble): formant-shaped vowel blips with a consonant onset, pitched per voice.
export default {
  id: 'voice-babble-beep',
  name: 'Robot Beep Babble',
  category: 'voice',
  tags: ['voice', 'babble', 'talk', 'dialogue', 'robot', 'beep', 'chiptune', '8-bit', 'retro'],
  desc: 'Square-wave talk beeps on a pentatonic scale, a letter at a time: a robot or an 8-bit hero talking in a text box.',
  // the slowest speed, its tail included (node build.mjs --say "..." --babble)
  dur: 3.7,
  family: 'voice',
  moments: ['dialogue'],
  params: {
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    speed: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Drawn out to rapid fire' },
    spread: { min: 0, max: 2, def: 1, desc: 'Pitch spread: 0 a monotone, 1 the voice\'s own, 2 wild' },
  },
  play(T, out, t, p) {
    T.babble(out, t, { text: 'Hello, human! Shall we begin?', voice: 'beep', pitch: p.pitch, speed: p.speed, spread: p.spread });
  },
};
