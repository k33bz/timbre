// One agent passes the work to another: a single note travels across the stereo field while its
// voice changes, a warm triangle climbing a fifth as it leaves and a glassy FM ring taking the same
// note over on arrival. The pan is a balance law, so a mono listener still hears the full note.
export default {
  id: 'ai-handoff',
  name: 'Agent Handoff',
  category: 'ai',
  tags: ['ai', 'handoff', 'agent', 'multi-agent', 'relay', 'baton', 'transfer', 'stereo', 'glass'],
  desc: 'A single note slides from one side to the other and changes voice on the way, from a warm tone to a glassy ring. One agent handing the work to the next.',
  dur: 0.85,
  family: 'synthetic',
  moments: ['tool-call'],
  params: {
    pitch: { min: 220, max: 660, def: 329.63, unit: 'Hz', desc: 'Note the first agent starts on; it climbs a fifth as it travels' },
    travel: { min: 0.2, max: 0.6, def: 0.4, unit: 's', desc: 'Time the note takes to cross: a quick toss or a slow carry' },
    change: { min: 0, max: 1, def: 0.6, desc: 'How different the second voice is: 0 a soft tone, 1 a bright glassy ring' },
    direction: { min: 0, max: 1, def: 0, step: 1, choices: ['left-to-right', 'right-to-left'], desc: 'Which way the work travels' },
  },
  play(T, out, t, p) {
    const L = p.travel;
    const dir = Math.round(p.direction) === 1 ? -1 : 1;
    const pan = T.pan(out, t, { x: -0.85 * dir, to: 0.85 * dir, dur: L + 0.15 });
    const hi = p.pitch * 1.5;
    // the first agent's voice climbs and fades while the second one fades in on the same note
    T.osc(pan, t, { type: 'triangle', f: p.pitch, to: hi, glide: L * 0.8, dur: L, peak: 0.048, a: 0.025, s: 1, d: 0.02, r: L * 0.45, tail: 0.05, fade: 0.1, lp: 1800 });
    T.fm(pan, t + L * 0.5, { f: hi, ratio: 2, index: 0.4 + 1.6 * p.change, index1: 0, dur: 0.5, peak: 0.052, a: 0.05 });
    T.osc(pan, t + L * 0.5, { f: hi * 2, dur: 0.3, peak: 0.016 * p.change, a: 0.05 });
  },
};
