// A grumpy character talking, a rough blip per syllable. Animalese / Undertale style talk from the babble engine
// (T.babble): formant-shaped vowel blips with a consonant onset, pitched per voice.
export default {
  id: 'voice-babble-gruff',
  name: 'Gruff Babble',
  category: 'voice',
  tags: ['voice', 'babble', 'talk', 'dialogue', 'gruff', 'grumpy', 'low', 'rough', 'shopkeeper'],
  desc: 'Low, slow, rough talk blips, a syllable at a time: a grumpy shopkeeper or a guard brushing you off.',
  // the slowest speed, its tail included (node build.mjs --say "..." --babble)
  dur: 3.9,
  family: 'voice',
  moments: ['dialogue'],
  params: {
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    speed: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Drawn out to rapid fire' },
    spread: { min: 0, max: 2, def: 1, desc: 'Pitch spread: 0 a monotone, 1 the voice\'s own, 2 wild' },
  },
  play(T, out, t, p) {
    T.babble(out, t, { text: 'Hmph. What do you want? Make it quick.', voice: 'gruff', pitch: p.pitch, speed: p.speed, spread: p.spread });
  },
};
