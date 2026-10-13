// A connection made or dropped. Up is a two-blip handshake (hello, then an answer a fifth higher)
// that settles on a soft note an octave up, leaning into its pitch. Down is the same handshake
// played backwards and followed by a slow fall into silence.
export default {
  id: 'data-link-state',
  name: 'Link Up / Down',
  category: 'data',
  tags: ['link', 'connect', 'disconnect', 'socket', 'handshake', 'online', 'offline', 'peering', 'vpn', 'blip'],
  desc: 'Link up is two quick blips and a soft settling note, a handshake that worked. Link down plays the blips falling and then sinks away.',
  dur: 0.58,
  family: 'soft',
  moments: ['link'],
  params: {
    on: { min: 0, max: 1, def: 1, step: 1, role: 'on', desc: '1 a connection coming up, 0 a connection dropping' },
    pitch: { min: 330, max: 880, def: 523, unit: 'Hz', desc: 'Pitch of the first blip, the rest are built on it' },
    speed: { min: 0.05, max: 0.11, def: 0.075, unit: 's', desc: 'Time between the two blips: low a quick handshake, high a deliberate one' },
    tone: { min: 0, max: 1, def: 0.5, desc: 'Color of the blips: 0 round and muted, 1 glassier with a bright overtone' },
  },
  play(T, out, t, p) {
    const up = p.on >= 0.5;
    const first = up ? p.pitch : p.pitch * 1.5;
    const second = up ? p.pitch * 1.5 : p.pitch;
    const blip = (at, f) => {
      T.osc(out, at, { f, dur: 0.07, peak: 0.036, a: 0.004 });
      T.osc(out, at, { f: f * 2, dur: 0.04, peak: 0.012 * p.tone, a: 0.004 });
    };
    blip(t, first);
    blip(t + p.speed, second);
    const at = t + 2 * p.speed + 0.01;
    if (up) {
      // the settle: it leans up into the octave and rings a moment, a fifth overtone for body
      T.osc(out, at, { f: p.pitch * 1.92, to: p.pitch * 2, glide: 0.07, dur: 0.32, peak: 0.038, a: 0.008 });
      T.osc(out, at, { f: p.pitch * 3, dur: 0.16, peak: 0.01 + 0.008 * p.tone, a: 0.008 });
    } else {
      // the drop: a sine falling an octave and a half while it fades, with no overtone to keep it dull
      T.osc(out, at, { f: p.pitch, to: p.pitch * 0.35, glide: 0.3, dur: 0.32, peak: 0.04, a: 0.01, lp: p.pitch * 1.4 });
    }
  },
};
