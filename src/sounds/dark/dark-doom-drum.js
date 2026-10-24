// One huge taiko blow with its boom, a timpani a fifth below ringing under it, and the hall
// answering. For the moment the floor drops away.
export default {
  id: 'dark-doom-drum',
  name: 'Doom Drum',
  category: 'dark',
  tags: ['drum', 'taiko', 'timpani', 'boom', 'hit', 'doom', 'impact', 'cinematic', 'dark', 'heavy'],
  desc: 'A single enormous drum blow that booms through a hall. For a boss entrance, a title card or the moment everything goes wrong.',
  dur: 2.6,
  family: 'impact',
  moments: ['reveal', 'scare', 'transition'],
  params: {
    pitch: { min: 45, max: 110, def: 68, unit: 'Hz', desc: 'Pitch of the big drum; the timpani sits a fifth under it' },
    mallet: { min: 0, max: 1, def: 0.55, desc: 'How hard the stick: 0 a soft felt thud, 1 a cracking blow' },
    space: { min: 0.1, max: 0.6, def: 0.35, desc: 'How big the hall answers' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 2.4, mix: p.space, tone: 0.3 });
    T.membrane(room, t, { kind: 'taiko', f: p.pitch, dur: 1.5, peak: 0.18, stick: p.mallet, boom: 0.9 });
    T.membrane(room, t + 0.012, { kind: 'timpani', f: p.pitch * 0.667, dur: 1.1, peak: 0.072, stick: 0.2, boom: 0 });
  },
};
