// Deep Space: Space drone, starfield and hull hum.
export default {
  id: 'deep-space',
  name: 'Deep Space',
  desc: 'The hum of a ship drifting through a starfield: a deep drone, distant twinkling and the low buzz of the hull.',
  layers: [
    { sound: 'ambience-space-drone', params: { pitch: 55, tone: 0.35, shimmer: 0.4 }, level: 1 },
    { sound: 'ambience-starfield-pad', params: { stars: 8, pitch: 1, glow: 0.5 }, level: 0.6 },
    { sound: 'ambience-grid-hum', params: { pitch: 60, sheen: 0.2, traffic: 0.1 }, level: 0.35 },
  ],
};
