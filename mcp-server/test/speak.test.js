// The speak tool and the voice sounds: its Copy equals the gallery's Speak rack Copy byte for byte,
// the function runs alone on the strict audio mock and renders the gallery's samples, arguments are
// checked, and a catalog without the voices says so. Named choices (a voice) read and set by name.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HAVE_REPO, REPO, REAL_CATALOG, DASHES, makeServer, call, tmpDir, writeCatalog } from './helper.js';
import { fixtureManifest } from './fixture.js';
import { buildSpeechCopy, SPEAK_PARAMS, VOICE_ALIASES } from '../lib/copy.js';
import { speechRuntime, closure } from '../lib/speech.js';
import { Catalog } from '../lib/catalog.js';
import { MockContext } from '../lib/mockaudio.js';

const imp = (rel) => import(pathToFileURL(path.join(REPO, rel)).href);
const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

let real = null;
async function repo() {
  if (real) return real;
  const { T } = await imp('src/core/t.js');
  const copy = await imp('src/core/copy.js');
  const buildMod = await imp('build.mjs');
  const result = await buildMod.build();
  assert.deepEqual(result.errors, []);
  real = { T, copy, manifest: JSON.parse(result.outputs['catalog/manifest.json']) };
  return real;
}

const CFGS = [
  { mode: 'speak', text: 'Access granted. Welcome back, commander.', voice: 'announcer' },
  { mode: 'speak', text: 'Is the system online? 3, 2, 1...', voice: 'retro', pitch: 3, rate: 1.2, range: 1.5, seed: 9 },
  { mode: 'speak', text: 'Press [S T AA1 R T] </script>', voice: 'whisper', pitch: 40 },
  { mode: 'speak', text: 'Hello', voice: 'nobody' },
  { mode: 'speak', text: 'Attention, please. The doors are closing.', voice: 'announcer-female', pitch: -1, rate: 0.9, range: 1.2, seed: 3 },
  { mode: 'speak', text: 'Warning.', voice: 'announcer-male' },
  { mode: 'babble', text: 'Oh, hi there! Are you new in town?', voice: 'cute' },
  { mode: 'babble', text: 'Hmph.', voice: 'gruff', speed: 0.8, spread: 1.5, seed: 0 },
];

test('the speak Copy equals the gallery\'s Speak rack Copy, byte for byte', async (t) => {
  if (skip(t)) return;
  const { T, copy, manifest } = await repo();
  const rt = speechRuntime(manifest.helpers);
  for (const cfg of CFGS) {
    const port = buildSpeechCopy(manifest.helpers, rt, closure, cfg).code;
    assert.equal(port, copy.buildSpeechCopy(T, cfg), JSON.stringify(cfg));
    assert.ok(!DASHES.test(port));
  }
  assert.deepEqual(SPEAK_PARAMS, copy.SPEAK_PARAMS, 'the same controls and ranges');
  assert.deepEqual(VOICE_ALIASES, copy.VOICE_ALIASES, 'the same voice aliases');
});

test('speak: one function with the line baked in, the engine only, the gallery\'s samples', async (t) => {
  if (skip(t)) return;
  const { T } = await repo();
  const s = makeServer(REAL_CATALOG);
  const r = await call(s, 'speak', { text: 'Containment breach. Evacuate the facility.', voice: 'announcer', pitch: -1 });
  assert.equal(r.isError, false, JSON.stringify(r.data));
  assert.equal(r.data.functionName, 'sayContainmentBreachEvacuateThe');
  assert.equal(r.data.phonemes, T.phonemize('Containment breach. Evacuate the facility.'));
  assert.equal(r.data.bytes, Buffer.byteLength(r.code));
  for (const h of ['phonemize', 'speechVoices', 'babbleVoices']) assert.ok(!r.code.includes('function ' + h + '('), h);
  assert.ok(r.data.dur > 2 && r.data.dur < 8, String(r.data.dur));
  // runs alone, strictly, and renders what speak renders in the gallery's runtime
  const ctx = vm.createContext({});
  vm.runInContext(r.code, ctx);
  const ac = new MockContext(48000, { strict: true });
  const end = ctx[r.data.functionName](ac);
  const got = ac.nodes.find((n) => n.buffer).buffer.getChannelData(0);
  const gc = new MockContext(48000);
  const out = gc.createGain();
  T.seed(1);
  const gEnd = T.speak(out, 0.2, { text: 'Containment breach. Evacuate the facility.', voice: 'announcer', pitch: -1, rate: 1, range: 1 });
  assert.deepEqual(got, gc.nodes.find((n) => n.buffer).buffer.getChannelData(0));
  assert.ok(Math.abs(end - gEnd) < 1e-9);
  assert.ok(Math.abs(end - 0.2 - r.data.dur) < 0.002, `${end} vs dur ${r.data.dur}`);
  // the female announcer: her line, her name, the gallery's samples
  const f = await call(s, 'speak', { text: 'Attention, please.', voice: 'announcer-female' });
  assert.equal(f.isError, false, JSON.stringify(f.data));
  assert.equal(f.data.voice, 'announcer-female');
  assert.equal(f.data.voiceName, 'Female Announcer');
  const fctx = vm.createContext({});
  vm.runInContext(f.code, fctx);
  const fac = new MockContext(48000, { strict: true });
  fctx[f.data.functionName](fac);
  const fgc = new MockContext(48000);
  const fout = fgc.createGain();
  T.seed(1);
  T.speak(fout, 0.2, { text: 'Attention, please.', voice: 'announcer-female', pitch: 0, rate: 1, range: 1 });
  assert.deepEqual(fac.nodes.find((n) => n.buffer).buffer.getChannelData(0), fgc.nodes.find((n) => n.buffer).buffer.getChannelData(0));
  // announcer-male is the announcer
  const m = await call(s, 'speak', { text: 'Attention, please.', voice: 'Announcer-Male' });
  assert.equal(m.isError, false);
  assert.equal(m.data.voice, 'announcer');
  assert.equal(m.code, (await call(s, 'speak', { text: 'Attention, please.', voice: 'announcer' })).code);
  assert.deepEqual(m.data.voices.speech, ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female']);
  // babble
  const b = await call(s, 'speak', { text: 'Yay! You found me!', mode: 'babble', voice: 'sprite', speed: 1.2 });
  assert.equal(b.isError, false);
  assert.equal(b.data.mode, 'babble');
  assert.ok(!('phonemes' in b.data));
  assert.match(b.code, /function chatter\(/);
  assert.match(b.code, /function klatt\(/);
  assert.doesNotMatch(b.code, /function utter\(/);
});

test('speak checks its arguments and clamps values, saying so', async (t) => {
  if (skip(t)) return;
  const s = makeServer(REAL_CATALOG);
  const bad = async (args, code, re) => {
    const r = await call(s, 'speak', args);
    assert.equal(r.isError, true, JSON.stringify(args));
    assert.equal(r.data.code, code, JSON.stringify(r.data));
    if (re) assert.match(r.data.error, re);
  };
  await bad({ text: 'Hi', voice: 'nobody' }, 'not_found', /Voices: announcer, deep, small, whisper, retro, announcer-female\./);
  await bad({ text: 'Hi', mode: 'babble', voice: 'announcer-male' }, 'not_found', /cute, gruff, beep, sprite, elder/);
  await bad({ text: 'Hi', mode: 'babble', voice: 'announcer' }, 'not_found', /cute, gruff, beep, sprite, elder/);
  await bad({ text: 'Hi', mode: 'babble', rate: 1.2 }, 'bad_params', /rate applies to speech; babble takes pitch, speed, spread/);
  await bad({ text: '...!' }, 'invalid_arguments', /nothing to say/);
  await bad({ text: '' }, 'invalid_arguments');
  await bad({ text: 'x'.repeat(501) }, 'invalid_arguments');
  await bad({ text: 'Hi', mode: 'shout' }, 'invalid_arguments');
  const r = await call(s, 'speak', { text: 'Hi', pitch: 30, voice: 'DEEP' });
  assert.equal(r.isError, false);
  assert.equal(r.data.voice, 'deep');
  assert.deepEqual(r.data.clamped, [{ param: 'pitch', requested: 30, used: 12, range: [-12, 12] }]);
});

test('a catalog built before the voices says speech is unavailable', async (t) => {
  if (skip(t)) return;
  const man = fixtureManifest();
  for (const h of ['phonemize', 'speak', 'utter']) delete man.helpers[h];
  const s = makeServer(writeCatalog(tmpDir(), man));
  const r = await call(s, 'speak', { text: 'Hello there.' });
  assert.equal(r.isError, true);
  assert.equal(r.data.code, 'speech_unavailable');
});

test('voice sounds: choices show in get_sound, and get_copy takes a voice by name', async (t) => {
  if (skip(t)) return;
  const s = makeServer(REAL_CATALOG);
  const g = await call(s, 'get_sound', { id: 'voice-access-denied' });
  assert.equal(g.isError, false);
  const voice = g.data.params.find((p) => p.name === 'voice');
  assert.equal(voice.control, 'choice');
  assert.deepEqual(voice.choices, ['announcer', 'deep', 'small', 'whisper', 'retro', 'announcer-female']);
  assert.equal(voice.default, 0);
  const byName = await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 'deep' } });
  const byNumber = await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 1 } });
  assert.equal(byName.code, byNumber.code);
  assert.equal(byName.data.params.voice, 1);
  // the female announcer by name, and announcer-male for the announcer
  const female = await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 'announcer-female' } });
  assert.equal(female.isError, false);
  assert.equal(female.data.params.voice, 5);
  assert.equal(female.code, (await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 5 } })).code);
  const male = await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 'announcer-male' } });
  assert.equal(male.data.params.voice, 0);
  assert.equal(male.code, (await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 'announcer' } })).code);
  const wrong = await call(s, 'get_copy', { id: 'voice-access-denied', params: { voice: 'robot' } });
  assert.equal(wrong.isError, true);
  assert.match(wrong.data.error, /or one of "announcer", "deep", "small", "whisper", "retro", "announcer-female"/);
  // the voice category and the voice moments reach search and suggestions
  const v = await call(s, 'search_sounds', { category: 'voice', limit: 50 });
  assert.ok(v.data.items.length >= 15 && v.data.items.every((x) => x.category === 'voice'));
  const sug = await call(s, 'suggest_sounds', { moments: ['announce', 'dialogue'] });
  const first = Object.fromEntries(sug.data.suggestions.map((x) => [x.moment, x.candidates[0] && x.candidates[0].id]));
  assert.match(first.announce || '', /^voice-/);
  assert.match(first.dialogue || '', /^voice-babble-/);
});

test('the runtime is compiled once per catalog and isolated from the server', async (t) => {
  if (skip(t)) return;
  const c = new Catalog(REAL_CATALOG, { levelsPath: false }).load();
  const a = speechRuntime(c.helpers);
  assert.equal(speechRuntime(c.helpers), a);
  assert.equal(typeof a.phonemize('hello'), 'string');
  assert.equal(typeof globalThis.phonemize, 'undefined');
});
