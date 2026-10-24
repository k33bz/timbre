// Haunted House: The haunted corridor over a low drone, with a door creak every 12 to 28 s.
export default {
  id: 'haunted-house',
  name: 'Haunted House',
  desc: 'Wind in an empty corridor, a drone you feel more than hear, and now and then a door creaking somewhere upstairs.',
  layers: [
    { sound: 'dark-haunted-corridor', params: { wind: 0.5, creaks: 0.4, whispers: 0.3 }, level: 1 },
    { sound: 'dark-abyss-drone', params: { depth: 36, darkness: 0.7, shimmer: 0.3 }, level: 0.5 },
    { sound: 'dark-door-creak', params: { close: 0 }, level: 0.7, every: [12, 28], vary: { length: [1.5, 3], pitch: [0.7, 1.3] } },
  ],
};
