// Campfire Night: Fire, crickets and a light breeze.
export default {
  id: 'campfire-night',
  name: 'Campfire Night',
  desc: 'A crackling fire under the stars, crickets in the grass and a light breeze through the trees.',
  layers: [
    { sound: 'ambience-fire-crackle', params: { crackle: 0.6, roar: 0.35, tone: 0.45 }, level: 1 },
    { sound: 'ambience-night-crickets', params: { crickets: 4, pitch: 1, pace: 1 }, level: 0.6 },
    { sound: 'ambience-wind-gusts', params: { gust: 0.2, pitch: 0.7, whistle: 0 }, level: 0.35 },
  ],
};
