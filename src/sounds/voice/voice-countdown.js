// A spoken countdown on a steady beat, "Three. Two. One.", each number its own phrase so the count
// keeps time; spoken by the formant speech engine (T.speak).
export default {
  id: 'voice-countdown',
  name: 'Countdown',
  category: 'voice',
  tags: ['voice', 'speech', 'countdown', 'three-two-one', 'start', 'launch', 'race'],
  desc: 'A synthesized announcer counts down "Three. Two. One." on a steady beat, for a launch, a race start or a timer.',
  // five numbers on the slowest beat, the last one and its tail (node build.mjs --say "one.")
  dur: 6.9,
  family: 'voice',
  moments: ['announce'],
  params: {
    voice: { min: 0, max: 5, def: 0, step: 1, choices: ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female'], desc: 'Who counts: announcer (male), deep or small robot, whisper, retro computer, female announcer' },
    from: { min: 3, max: 5, def: 3, step: 1, desc: 'The number the count starts from' },
    beat: { min: 0.7, max: 1.2, def: 1, unit: 's', desc: 'Time between the numbers' },
    pitch: { min: -6, max: 6, def: 0, unit: 'st', desc: 'Pitch shift from the voice, down or up' },
  },
  play(T, out, t, p) {
    const voice = ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female'][Math.round(p.voice)];
    const words = ['one', 'two', 'three', 'four', 'five'];
    const n = Math.round(p.from);
    for (let k = 0; k < n; k++) T.speak(out, t + k * p.beat, { text: words[n - 1 - k] + '.', voice, pitch: p.pitch });
  },
};
