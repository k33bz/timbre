// Ocean and Rain: Slow surf and soft rain, nothing else.
export default {
  id: 'ocean-rain',
  name: 'Ocean and Rain',
  desc: 'Gentle waves on a beach under soft, steady rain. Calm and wide.',
  layers: [
    { sound: 'ambience-ocean-surf', params: { period: 5.5, foam: 0.5, depth: 0.5 }, level: 1 },
    { sound: 'ambience-rain', params: { rate: 0.35, tone: 0.35 }, level: 0.75 },
  ],
};
