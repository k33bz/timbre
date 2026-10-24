// Rain and Thunder: Steady rain, a breath of wind, and a thunderstrike every 8 to 18 s at a random distance.
export default {
  id: 'rain-and-thunder',
  name: 'Rain and Thunder',
  desc: 'Steady rain with a little wind, and thunder now and then: sometimes a crack close overhead, sometimes a low roll far off.',
  layers: [
    { sound: 'ambience-rain', params: { rate: 0.6, tone: 0.45 }, level: 1 },
    { sound: 'ambience-wind-gusts', params: { gust: 0.3, pitch: 0.8, whistle: 0.1 }, level: 0.45 },
    { sound: 'ambience-thunder-strike', params: { roll: 0.7, size: 0.6 }, level: 1, every: [8, 18], vary: { distance: [0.15, 0.95], roll: [0.4, 1] } },
  ],
};
