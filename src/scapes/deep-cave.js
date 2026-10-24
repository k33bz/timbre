// Deep Cave: Drips, a cold draught and an abyssal drone under them.
export default {
  id: 'deep-cave',
  name: 'Deep Cave',
  desc: 'Water dripping into pools in a deep cave, a cold draught and something rumbling far below.',
  layers: [
    { sound: 'ambience-cave-drips', params: { drips: 6, pitch: 1, cave: 0.8 }, level: 1 },
    { sound: 'ambience-wind-gusts', params: { gust: 0.2, pitch: 0.6, whistle: 0.2 }, level: 0.35 },
    { sound: 'dark-abyss-drone', params: { depth: 41, darkness: 0.6, shimmer: 0.2 }, level: 0.45 },
  ],
};
