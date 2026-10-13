// The smoke run as a test: the real server as a child process, real JSON-RPC over its stdio.
// (scripts/smoke.js runs the same thing from the command line: `npm run smoke`.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { runSmoke } from '../scripts/smoke.js';
import { HAVE_REPO, PKG, REAL_CATALOG, tmpDir } from './helper.js';
import { fixtureDir } from './fixture.js';

test('smoke: initialize, tools/list and a call to every tool over real stdio (real catalog)', { timeout: 120000 }, async (t) => {
  if (!HAVE_REPO) return t.skip('needs the Timbre repository next to mcp-server');
  const r = await runSmoke({ catalog: REAL_CATALOG });
  const failed = r.steps.filter((s) => !s.ok);
  assert.deepEqual(failed, [], failed.map((s) => `${s.name}: ${s.detail}`).join('\n'));
  assert.ok(r.steps.length >= 15);
  assert.equal(r.stderr.trim(), '', 'a healthy server is silent on stderr');
});

test('smoke: the same over the synthetic catalog', { timeout: 120000 }, async (t) => {
  if (!HAVE_REPO) return t.skip('needs the Timbre repository next to mcp-server');
  const r = await runSmoke({ catalog: fixtureDir() });
  assert.deepEqual(r.steps.filter((s) => !s.ok), []);
});

test('smoke: a server pointed at nothing still answers, and says why', { timeout: 60000 }, async () => {
  const r = await runSmoke({ catalog: path.join(tmpDir(), 'nothing-here') }).catch((e) => ({ error: e }));
  // the generic smoke expects sound data, so some steps fail; what matters is that it did not hang or crash
  assert.ok(r.steps, 'the run completed');
  const init = r.steps.find((s) => s.name === 'initialize');
  assert.equal(init.ok, true);
  assert.equal(r.steps.find((s) => s.name === 'tools/list').ok, true);
  assert.equal(r.steps.find((s) => s.name === 'closing stdin ends the server cleanly').ok, true);
  assert.match(r.stderr, /starting without a catalog: No Timbre catalog/);
});

test('cli: --version, --help and an unknown command', async () => {
  const run = (args) => new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(PKG, 'cli.js'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { err += d; });
    c.on('exit', (code) => resolve({ code, out, err }));
  });
  const v = await run(['--version']);
  assert.equal(v.code, 0);
  assert.match(v.out, /^timbre-mcp-server \d+\.\d+\.\d+/);
  const h = await run(['help']);
  assert.match(h.out, /Usage:[\s\S]*--catalog/);
  const bad = await run(['frobnicate']);
  assert.equal(bad.code, 1);
  assert.match(bad.err, /Unknown command "frobnicate"/);
});

test('cli: call runs one tool and prints its blocks; info and tools work too', async (t) => {
  if (!HAVE_REPO) return t.skip('needs the Timbre repository next to mcp-server');
  const run = (args) => new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(PKG, 'cli.js'), ...args, '--levels', 'none', '--catalog', fixtureDir()], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { err += d; });
    c.on('exit', (code) => resolve({ code, out, err }));
  });
  const call = await run(['call', 'get_copy', '{"id":"ui-click-soft"}']);
  assert.equal(call.code, 0);
  assert.match(call.out, /"functionName": "uiClickSoft"/);
  assert.match(call.out, /^function uiClickSoft\(ac, opts, when, dest\) \{$/m);
  const fail = await run(['call', 'get_sound', '{"id":"nope"}']);
  assert.equal(fail.code, 1);
  assert.match(fail.out, /not_found/);
  const info = await run(['info']);
  assert.match(info.out, /"name": "Timbre"/);
  const tools = await run(['tools']);
  assert.match(tools.out, /^build_kit$/m);
  const badJson = await run(['call', 'info', '{oops']);
  assert.equal(badJson.code, 2);
  assert.match(badJson.err, /must be JSON/);
});
