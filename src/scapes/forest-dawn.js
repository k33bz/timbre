// Forest Dawn: Busy birdsong over a soft wind.
export default {
  id: 'forest-dawn',
  name: 'Forest Dawn',
  desc: 'Birds waking in the trees with a soft wind moving through the leaves.',
  layers: [
    { sound: 'ambience-forest-birds', params: { activity: 0.7, pitch: 1, trill: 0.5 }, level: 1 },
    { sound: 'ambience-wind-gusts', params: { gust: 0.25, pitch: 1.1, whistle: 0 }, level: 0.4 },
  ],
};
