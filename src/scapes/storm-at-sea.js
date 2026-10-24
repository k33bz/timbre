// Storm at Sea: Big surf under the storm's roar and rain, with thunder every 10 to 22 s, mostly far out.
export default {
  id: 'storm-at-sea',
  name: 'Storm at Sea',
  desc: 'Heavy surf under a roaring gale, rain lashing, and thunder rolling over the water.',
  layers: [
    { sound: 'ambience-ocean-surf', params: { period: 4.5, foam: 0.85, depth: 0.8 }, level: 1 },
    { sound: 'ambience-storm-roar', params: { fury: 0.55, rain: 0.6, howl: 0.5 }, level: 0.7 },
    { sound: 'ambience-thunder-strike', params: { roll: 0.8, size: 0.8 }, level: 0.9, every: [10, 22], vary: { distance: [0.4, 1], roll: [0.5, 1] } },
  ],
};
