// A wooden game piece set on its square: an optional short drag over the board, then a hollow
// "tok" (a fundamental with a faster-dying upper partial, like a wood block) and a dull knock of
// the board under it. Pitch picks the piece, hollow how boxy the board sounds.
export default {
  id: 'cards-piece-move',
  name: 'Board Piece Move',
  category: 'cards',
  tags: ['board', 'piece', 'move', 'wood', 'chess', 'tok', 'pawn', 'token'],
  desc: 'A wooden piece slid a little and set down on a board with a hollow, polite tok.',
  dur: 0.26,
  family: 'wood',
  moments: ['drop'],
  params: {
    pitch: { min: 300, max: 900, def: 520, unit: 'Hz', desc: 'Wood pitch of the tok, also tinting the drag and click: low big, high small' },
    hollow: { min: 0, max: 1, def: 0.5, desc: 'Boxiness of the board: 0 dull solid tok, 1 hollow wood-block ring' },
    slide: { min: 0, max: 0.12, def: 0.04, unit: 's', desc: 'Drag over the board before set-down, very short values skip the drag sound' },
  },
  play(T, out, t, p) {
    const at = t + p.slide;
    if (p.slide > 0.015) {
      T.noise(out, t, { filter: 'bandpass', f: 800 + p.pitch * 0.5, to: 600 + p.pitch * 0.4, q: 1.2, dur: p.slide + 0.01, peak: 0.05, a: p.slide * 0.5 });
    }
    T.bell(out, at, {
      f: p.pitch * T.rand(0.98, 1.02),
      partials: [[1, 1, 1], [2.45, 0.25 + 0.4 * p.hollow, 0.55], [4.3, 0.08 * p.hollow, 0.3]],
      dur: 0.09, peak: 0.036, a: 0.001,
    });
    T.noise(out, at, { filter: 'bandpass', f: 1500 + p.pitch, to: 1100, q: 1.5, dur: 0.012, peak: 0.05, a: 0.001 });
    T.osc(out, at, { f: 150, to: 85, dur: 0.045, peak: 0.014, a: 0.002 });
  },
};
