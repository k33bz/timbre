// A bubble-like two-note blip for grabbing an item: each note scoops up into its pitch, the second
// is higher and rings a touch longer. Chip mode is two square notes through a bitcrusher.
export default {
  id: 'game-pickup-item',
  name: 'Pickup Item',
  category: 'game',
  tags: ['pickup', 'item', 'grab', 'collect', 'loot', 'blip', 'pop', 'inventory'],
  desc: 'A soft two-note blip for picking up an item. Quiet enough to repeat. Chip switches to square notes.',
  dur: 0.25,
  params: {
    pitch: { min: 500, max: 1500, def: 880, unit: 'Hz' },
    interval: { min: 2, max: 12, def: 5, step: 1, unit: 'st' },
    gap: { min: 0.04, max: 0.1, def: 0.06, unit: 's' },
    chip: { min: 0, max: 1, def: 0, step: 1 },
  },
  play(T, out, t, p) {
    const chip = p.chip >= 0.5;
    const hi = p.pitch * Math.pow(2, Math.round(p.interval) / 12);
    const peak = chip ? 0.045 : 0.06;
    const dest = chip ? T.crush(out, t, { bits: 4, ref: peak }) : out;
    const type = chip ? 'square' : 'sine';
    T.osc(dest, t, { type, f: p.pitch * 0.9, to: p.pitch, glide: 0.03, dur: 0.07, peak, a: 0.004 });
    T.osc(dest, t + p.gap, { type, f: hi * 0.93, to: hi, glide: 0.035, dur: 0.14, peak, a: 0.004 });
    if (!chip) {
      T.osc(out, t + p.gap, { type: 'triangle', f: hi * 2, dur: 0.09, peak: 0.012, a: 0.004 });
      // a speck of air at the grab, so it reads as a pop and not a beep
      T.noise(out, t, { filter: 'highpass', f: 4500, q: 0.8, dur: 0.015, peak: 0.01, a: 0.001 });
    }
  },
};
