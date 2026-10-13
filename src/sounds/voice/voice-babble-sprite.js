// A tiny fairy chattering, very fast and very high. Animalese / Undertale style talk from the babble engine
// (T.babble): formant-shaped vowel blips with a consonant onset, pitched per voice.
export default {
  id: 'voice-babble-sprite',
  name: 'Sprite Babble',
  category: 'voice',
  tags: ['voice', 'babble', 'talk', 'dialogue', 'fairy', 'sprite', 'tiny', 'magic', 'squeaky'],
  desc: 'A tiny, very fast, very high chatter: a fairy or a sprite talking, a blip per letter.',
  // the slowest speed, its tail included (node build.mjs --say "..." --babble)
  dur: 2.8,
  family: 'voice',
  moments: ['dialogue'],
  params: {
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
    speed: { min: 0.75, max: 1.3, def: 1, unit: 'x', desc: 'Drawn out to rapid fire' },
    spread: { min: 0, max: 2, def: 1, desc: 'Pitch spread: 0 a monotone, 1 the voice\'s own, 2 wild' },
  },
  play(T, out, t, p) {
    T.babble(out, t, { text: 'Yay! You found me! Follow the lights!', voice: 'sprite', pitch: p.pitch, speed: p.speed, spread: p.spread });
  },
};
