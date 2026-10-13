// Soft UI: quiet, rounded feedback for productivity apps. Nothing here should make a person look up
// from what they are doing.
export default {
  id: 'soft-ui',
  name: 'Soft UI',
  desc: 'Quiet, rounded feedback for productivity apps: soft ticks, a gentle chime, a low buzz.',
  moments: {
    click: { sound: 'ui-click-soft' },
    'toggle-on': { sound: 'ui-toggle-switch', params: { on: 1, body: 0.4 } },
    'toggle-off': { sound: 'ui-toggle-switch', params: { on: 0, body: 0.4 } },
    success: { sound: 'notify-success-chime', params: { shimmer: 0.25 } },
    error: { sound: 'notify-error-buzz', params: { pulses: 2, rough: 0.35, tone: 900 } },
    notify: { sound: 'magic-sparkle', params: { notes: 3, pitch: 880, gap: 0.07, space: 0.2 } },
  },
};
