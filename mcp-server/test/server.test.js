// The protocol layer: initialize, tools/list and tools/call envelopes, errors, batches, the stdio
// transport's framing, and a rebuilt catalog showing up without a restart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { TimbreMCPServer, StdioTransport, PROTOCOL_VERSIONS, SERVER_NAME, SERVER_VERSION, renderContent } from '../index.js';
import { HAVE_REPO, DASHES, PKG, makeServer, tmpDir, writeCatalog } from './helper.js';
import { fixtureDir, fixtureManifest } from './fixture.js';

const skip = (t) => {
  if (HAVE_REPO) return false;
  t.skip('needs the Timbre repository next to mcp-server');
  return true;
};

let fx = null;
const fixtureServer = (t) => {
  if (skip(t)) return null;
  if (!fx) fx = makeServer(fixtureDir());
  return fx;
};
const rpc = (s, method, params, id = 1) => s.handleMessage({ jsonrpc: '2.0', id, method, params });

const TOOL_NAMES = ['info', 'suggest_sounds', 'search_sounds', 'get_sound', 'get_copy', 'list_themes', 'get_theme', 'build_kit', 'speak'];

test('the version the server reports is the package version, and the package asks for Node 22', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
  assert.equal(SERVER_VERSION, pkg.version);
  assert.equal(SERVER_NAME, pkg.name);
  assert.equal(pkg.engines.node, '>=22');
  assert.deepEqual(pkg.dependencies, {}, 'zero dependencies');
  assert.match(pkg.scripts.test, /node --test/);
});

test('initialize answers with the server, its tools capability and what an agent needs to start', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const res = await rpc(s, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  assert.equal(res.jsonrpc, '2.0');
  assert.equal(res.id, 1);
  assert.equal(res.result.protocolVersion, '2025-06-18');
  assert.equal(res.result.serverInfo.name, SERVER_NAME);
  assert.ok(res.result.capabilities.tools);
  const ins = res.result.instructions;
  assert.match(ins, /18 synthesized WebAudio sound effects/);
  assert.match(ins, /ui 3, notify 4, game 4, cards 2, magic 1, scifi 2, ambience 1, music 1/);
  for (const name of ['suggest_sounds', 'search_sounds', 'get_sound', 'get_copy', 'build_kit', 'list_themes', 'get_theme']) assert.ok(ins.includes(name), `instructions mention ${name}`);
});

test('initialize negotiates the protocol version', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  for (const v of PROTOCOL_VERSIONS) assert.equal((await rpc(s, 'initialize', { protocolVersion: v })).result.protocolVersion, v);
  assert.equal((await rpc(s, 'initialize', { protocolVersion: '1999-01-01' })).result.protocolVersion, PROTOCOL_VERSIONS[0]);
  assert.equal((await rpc(s, 'initialize', {})).result.protocolVersion, PROTOCOL_VERSIONS[0]);
  assert.equal((await rpc(s, 'initialize')).result.protocolVersion, PROTOCOL_VERSIONS[0]);
});

test('the instructions say so when the catalog did not load', async () => {
  const s = makeServer(path.join(tmpDir(), 'missing'));
  const res = await rpc(s, 'initialize', {});
  assert.match(res.result.instructions, /catalog NOT loaded: No Timbre catalog/);
});

test('notifications get no reply, known or not', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  assert.equal(await s.handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.equal(s.initialized, true);
  assert.equal(await s.handleMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 3 } }), null);
  assert.equal(await s.handleMessage({ jsonrpc: '2.0', method: 'something/unheard-of' }), null);
});

test('ping answers with an empty result', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  assert.deepEqual((await rpc(s, 'ping')).result, {});
});

test('tools/list: the nine tools, each with a title, a schema and read-only annotations', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const { tools } = (await rpc(s, 'tools/list')).result;
  assert.deepEqual(tools.map((x) => x.name), TOOL_NAMES);
  for (const x of tools) {
    assert.ok(x.title && x.title !== x.name, `${x.name} has a title`);
    assert.equal(x.inputSchema.type, 'object');
    assert.deepEqual(x.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
  }
});

test('tool descriptions tell an agent when to use the tool, and when to use a neighbour instead', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const { tools } = (await rpc(s, 'tools/list')).result;
  const by = Object.fromEntries(tools.map((x) => [x.name, x.description]));
  for (const [name, d] of Object.entries(by)) {
    assert.ok(d.length > 250 && d.length < 1600, `${name}: ${d.length} characters`);
    assert.match(d, /\b(Use|use)\b/, `${name} says when to use it`);
    assert.doesNotMatch(d, DASHES, `${name}: no dashes`);
  }
  // each points at the tool to reach for instead where they overlap
  assert.match(by.search_sounds, /suggest_sounds/);
  assert.match(by.get_sound, /get_copy/);
  assert.match(by.get_copy, /build_kit/);
  assert.match(by.build_kit, /get_copy/);
  assert.match(by.suggest_sounds, /search_sounds/);
  assert.match(by.suggest_sounds, /build_kit/);
  assert.match(by.speak, /get_copy/);
  assert.match(by.list_themes, /get_theme/);
  assert.match(by.get_theme, /build_kit/);
  assert.match(by.info, /Start here/);
  // the parameters that matter are described for the model
  const schema = Object.fromEntries(tools.map((x) => [x.name, x.inputSchema]));
  assert.ok(schema.search_sounds.properties.query.description);
  assert.ok(schema.get_copy.properties.params.description);
  assert.ok(schema.build_kit.properties.moments.description && schema.build_kit.properties.mood.description);
  assert.deepEqual(schema.get_sound.required, ['id']);
  assert.deepEqual(schema.get_copy.required, ['id']);
});

test('tools/call wraps results in content blocks; code gets a block of its own', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const plain = (await rpc(s, 'tools/call', { name: 'list_themes', arguments: {} })).result;
  assert.equal(plain.isError, false);
  assert.equal(plain.content.length, 1);
  assert.equal(plain.content[0].type, 'text');
  assert.equal(JSON.parse(plain.content[0].text).count, 2);
  const withCode = (await rpc(s, 'tools/call', { name: 'get_copy', arguments: { id: 'ui-click-soft' } })).result;
  assert.equal(withCode.content.length, 2);
  assert.equal(JSON.parse(withCode.content[0].text).code, 'in the next content block');
  assert.match(withCode.content[1].text, /^\/\/ Usage: const ac = new AudioContext\(\); uiClickSoft/);
  assert.equal((await rpc(s, 'tools/call', { name: 'list_themes' })).result.isError, false, 'arguments may be absent');
});

test('the JSON in a result is valid, compact where small and wrapped where long', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const r = (await rpc(s, 'tools/call', { name: 'info', arguments: {} })).result;
  const text = r.content[0].text;
  assert.doesNotThrow(() => JSON.parse(text));
  assert.ok(text.split('\n').length < 140, 'a screenful, not a scroll');  // 15 categories, 10 themes, 102 moments, 9 speech voices: about 120 lines, still one screen
  assert.match(text, /"tags"|"categories"/);
});

test('a refused call is a tool result with isError and a code, not a protocol error', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const res = await rpc(s, 'tools/call', { name: 'get_sound', arguments: { id: 'nope' } });
  assert.equal(res.error, undefined);
  assert.equal(res.result.isError, true);
  const body = JSON.parse(res.result.content[0].text);
  assert.equal(body.code, 'not_found');
  assert.ok(body.error);
});

test('protocol errors: unknown tool, missing name, unknown method, bad requests', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const unknown = await rpc(s, 'tools/call', { name: 'nope', arguments: {} });
  assert.equal(unknown.error.code, -32602);
  assert.deepEqual(unknown.error.data.availableTools, TOOL_NAMES);
  assert.equal((await rpc(s, 'tools/call', {})).error.code, -32602);
  assert.equal((await rpc(s, 'tools/call')).error.code, -32602);
  assert.equal((await rpc(s, 'does/not/exist')).error.code, -32601);
  const noMethod = await s.handleMessage({ jsonrpc: '2.0', id: 9 });
  assert.equal(noMethod.error.code, -32600);
  assert.equal(noMethod.id, 9);
  assert.equal((await s.handleMessage(42)).error.code, -32600);
  assert.equal((await s.handleMessage(null)).error.code, -32600);
  assert.equal(await s.handleMessage({ jsonrpc: '2.0', id: 1, result: {} }), null, 'a stray response is ignored');
});

test('batches: each request answered, notifications skipped, an empty batch refused', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const res = await s.handleMessage([
    { jsonrpc: '2.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ]);
  assert.equal(res.length, 2);
  assert.deepEqual(res.map((r) => r.id), [1, 2]);
  assert.equal((await s.handleMessage([])).error.code, -32600);
  assert.equal(await s.handleMessage([{ jsonrpc: '2.0', method: 'notifications/initialized' }]), null);
});

test('ids of any JSON type come back unchanged', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  for (const id of [0, 7, 'abc', 'a-uuid-like-string']) assert.equal((await rpc(s, 'ping', undefined, id)).id, id);
});

test('an unexpected exception inside a tool is contained: isError, internal_error, the server lives on', async (t) => {
  if (skip(t)) return;
  const s = makeServer(fixtureDir());
  s.toolMap.get('list_themes').handler = () => { throw new Error('boom'); };
  const res = await rpc(s, 'tools/call', { name: 'list_themes', arguments: {} });
  assert.equal(res.result.isError, true);
  assert.deepEqual(JSON.parse(res.result.content[0].text), { error: 'boom', code: 'internal_error' });
  assert.deepEqual((await rpc(s, 'ping')).result, {});
});

test('a rebuilt catalog shows up on the next call, no restart', async (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const s = makeServer(dir);
  const first = JSON.parse((await rpc(s, 'tools/call', { name: 'search_sounds', arguments: { query: 'splash' } })).result.content[0].text);
  assert.equal(first.total, 0);
  const m = fixtureManifest();
  m.sounds.push({ ...structuredClone(m.sounds[0]), id: 'ui-splash-test', name: 'Splash Test', tags: ['splash', 'water'], desc: 'A splash for the test.' });
  m.count = m.sounds.length;
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  const second = JSON.parse((await rpc(s, 'tools/call', { name: 'search_sounds', arguments: { query: 'splash' } })).result.content[0].text);
  assert.equal(second.items[0].id, 'ui-splash-test');
  const info = JSON.parse((await rpc(s, 'tools/call', { name: 'info', arguments: {} })).result.content[0].text);
  assert.equal(info.catalog.sounds, 19);
});

test('the server starts without a catalog and recovers when one appears', async (t) => {
  if (skip(t)) return;
  const dir = path.join(tmpDir(), 'later');
  const s = makeServer(dir);
  assert.equal(JSON.parse((await rpc(s, 'tools/call', { name: 'search_sounds', arguments: {} })).result.content[0].text).code, 'catalog_unavailable');
  writeCatalog(dir, fixtureManifest());
  const ok = (await rpc(s, 'tools/call', { name: 'search_sounds', arguments: { query: 'click' } })).result;
  assert.equal(ok.isError, false);
});

test('warm: the estimated levels are worked out in the background, again after a reload', async (t) => {
  if (skip(t)) return;
  const dir = writeCatalog(tmpDir(), fixtureManifest());
  const s = makeServer(dir, { warm: true });
  const known = () => s.catalog.sounds.filter((x) => s.catalog.peekLevel(x)).length;
  assert.ok(known() < s.catalog.sounds.length, 'not all known at once: the pass runs between turns of the event loop');
  for (let i = 0; i < 200 && known() < 18; i++) await new Promise((r) => setTimeout(r, 25));
  assert.equal(known(), 18);
  const m = fixtureManifest();
  m.sounds.push({ ...structuredClone(m.sounds[0]), id: 'ui-warm-extra', name: 'Warm Extra', tags: ['warm', 'extra'] });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
  await rpc(s, 'ping');
  await rpc(s, 'tools/call', { name: 'list_themes', arguments: {} });
  const extra = () => s.catalog.peekLevel(s.catalog.get('ui-warm-extra'));
  for (let i = 0; i < 200 && !extra(); i++) await new Promise((r) => setTimeout(r, 25));
  assert.ok(extra(), 'the new sound was picked up by the background pass');
});

test('renderContent only splits off the code a tool declares', () => {
  const tool = { codeKey: 'code' };
  assert.equal(renderContent(tool, { a: 1, code: 'x' }).length, 2);
  assert.equal(renderContent(tool, { a: 1 }).length, 1);
  assert.equal(renderContent({}, { a: 1, code: 'x' }).length, 1);
  assert.equal(renderContent(tool, { code: 5 }).length, 1);
});

// ---------------------------------------------------------------- transport

/** A server wired to in-memory streams. Returns { input, replies, done }. */
function wire(server) {
  const input = new PassThrough();
  const output = new PassThrough();
  const replies = [];
  let buf = '';
  output.setEncoding('utf8');
  output.on('data', (c) => {
    buf += c;
    let i;
    while ((i = buf.indexOf('\n')) !== -1) { replies.push(JSON.parse(buf.slice(0, i))); buf = buf.slice(i + 1); }
  });
  const transport = new StdioTransport({ input, output });
  const closed = new Promise((resolve) => { transport.onClose = (cb) => { transport.closeCb = () => { cb(); setTimeout(resolve, 10); }; }; });
  server.connect(transport);
  return { input, replies, closed };
}
const line = (o) => JSON.stringify(o) + '\n';

test('stdio: one message per line, replies as lines', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const w = wire(s);
  w.input.write(line({ jsonrpc: '2.0', id: 1, method: 'ping' }) + line({ jsonrpc: '2.0', id: 2, method: 'tools/list' }));
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(w.replies.map((r) => r.id), [1, 2]);
  w.input.end();
});

test('stdio: a message split across chunks, CRLF endings and blank lines all work', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const w = wire(s);
  const msg = JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping' });
  w.input.write(msg.slice(0, 10));
  await new Promise((r) => setTimeout(r, 10));
  w.input.write(msg.slice(10) + '\r\n\n\r\n');
  w.input.write(JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'ping' }) + '\n');
  await new Promise((r) => setTimeout(r, 50));
  assert.deepEqual(w.replies.map((r) => r.id), [5, 6]);
  w.input.end();
});

test('stdio: a line that is not JSON gets -32700 with a null id and the next line is still served', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const w = wire(s);
  w.input.write('{ nope\n' + line({ jsonrpc: '2.0', id: 1, method: 'ping' }));
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(w.replies[0].error.code, -32700);
  assert.equal(w.replies[0].id, null);
  assert.equal(w.replies[1].id, 1);
  w.input.end();
});

test('stdio: a last message with no newline is still handled, and replies finish before the close', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const w = wire(s);
  w.input.write(line({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
  w.input.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_copy', arguments: { id: 'ui-click-soft' } } }));
  w.input.end();
  await w.closed;
  for (let i = 0; i < 50 && w.replies.length < 2; i++) await new Promise((r) => setTimeout(r, 20));
  assert.deepEqual(w.replies.map((r) => r.id).sort(), [1, 2], 'both answered, the unterminated one included');
});

test('stdio: a client that never sends a newline cannot grow the buffer without bound', async (t) => {
  const s = fixtureServer(t);
  if (!s) return;
  const input = new PassThrough();
  const output = new PassThrough();
  const out = [];
  output.setEncoding('utf8');
  output.on('data', (c) => out.push(c));
  const tr = new StdioTransport({ input, output, maxBufferSize: 1000 });
  tr.onMessage(() => {});
  tr.start();
  input.write('x'.repeat(1500));
  await new Promise((r) => setTimeout(r, 20));
  const reply = JSON.parse(out.join('').split('\n')[0]);
  assert.equal(reply.error.code, -32600);
  assert.match(reply.error.data.detail, /exceeds 1000 bytes/);
  assert.equal(tr.buffer, '');
});
