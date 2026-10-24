// Cozy Cabin: Soft rain, a low fire and room tone.
export default {
  id: 'cozy-cabin',
  name: 'Cozy Cabin',
  desc: 'Rain on the roof, a fire in the hearth and the quiet hum of an old room. For reading, writing or doing nothing.',
  layers: [
    { sound: 'ambience-rain', params: { rate: 0.45, tone: 0.2 }, level: 0.8 },
    { sound: 'ambience-fire-crackle', params: { crackle: 0.45, roar: 0.25, tone: 0.3 }, level: 0.85 },
    { sound: 'ambience-room-hum', params: { pitch: 60, buzz: 0.1, air: 0.4 }, level: 0.4 },
  ],
};
