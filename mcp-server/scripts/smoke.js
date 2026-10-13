#!/usr/bin/env node
// Smoke run: start the real server as a child process and speak real JSON-RPC to it over stdio,
// the way Claude Code and Claude Desktop do.
//
//   node scripts/smoke.js [--catalog <dir>] [--verbose]
//
// It sends initialize, notifications/initialized, tools/list and one tools/call per tool (plus a
// few calls that must fail), checks every reply, closes stdin and checks the server exits cleanly
// having written nothing but protocol messages to stdout. Exit code 0 when everything held.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, '..', 'cli.js');

/** A child server and a promise per request id. */
function startServer(args, env) {
  const child = spawn(process.execPath, [CLI, 'start', ...args], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
  const waiting = new Map();
  const lines = [];
  const stderr = [];
  let buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      lines.push(line);
      let msg = null;
      try { msg = JSON.parse(line); } catch (e) { /* recorded as a bad line by the caller */ }
      if (msg && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (c) => stderr.push(c));
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  const send = (obj) => child.stdin.write((typeof obj === 'string' ? obj : JSON.stringify(obj)) + '\n');
  let nextId = 1;
  const request = (method, params, timeoutMs = 20000) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error(`no reply to ${method} (id ${id}) in ${timeoutMs} ms`)); }, timeoutMs);
    waiting.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    send({ jsonrpc: '2.0', id, method, params });
  });
  // a message whose id is null (a parse error reply) cannot be matched by id: wait for the next null-id line
  const nextNullId = (timeoutMs = 5000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no reply to the malformed line')), timeoutMs);
    waiting.set(null, (msg) => { clearTimeout(timer); resolve(msg); });
  });
  return { child, send, request, nextNullId, lines, stderr, exited };
}

/** The calls made, one per tool, with what each reply must show. */
export const TOOL_CALLS = [
  { name: 'info', args: {}, check: (d) => d.name === 'Timbre' && d.catalog.sounds > 0 && d.categories.length === 8, show: (d) => `${d.catalog.sounds} sounds, ${d.catalog.themes} theme(s), Timbre ${d.version}` },
  { name: 'search_sounds', args: { query: 'click', limit: 3 }, check: (d) => d.items.length > 0 && d.items[0].matched.length > 0, show: (d) => d.items.map((x) => x.id).join(', ') },
  { name: 'get_sound', args: { id: '$firstSound' }, check: (d, code) => d.params.length >= 0 && typeof code === 'string' && code.includes('function '), show: (d, code) => `${d.id}, ${d.params.length} params, ${code.length} bytes of code` },
  { name: 'get_copy', args: { id: '$firstSound' }, check: (d, code) => /^\/\/ Usage:/.test(code) && d.functionName && d.bytes === Buffer.byteLength(code), show: (d) => `${d.functionName}(), ${d.bytes} bytes` },
  { name: 'list_themes', args: {}, check: (d) => d.count === d.themes.length, show: (d) => d.themes.map((t) => t.id).join(', ') || 'none' },
  { name: 'get_theme', args: { id: '$firstTheme' }, check: (d) => d.moments.length > 0, show: (d) => `${d.id}: ${d.moments.map((m) => m.moment).join(', ')}` },
  { name: 'build_kit', args: { moments: ['click', 'success', 'error'], mood: 'calm' }, check: (d, code) => d.moments.length >= 1 && /export \{ play/.test(code), show: (d, code) => `${d.moments.length} moments, ${d.sounds.length} sounds, ${code.length} bytes` },
  { name: 'suggest_sounds', args: { description: 'a meditation timer that rings when done, with gentle taps' }, check: (d) => d.suggestions.length >= 1, show: (d) => d.suggestions.map((g) => `${g.moment}: ${g.candidates[0] ? g.candidates[0].id : '-'}`).join('; ') },
];

/**
 * Run the smoke test. Resolves to { ok, steps: [{ name, ok, ms, detail }], stdoutLines, stderr }.
 * opts: { catalog, log (function), env }
 */
export async function runSmoke({ catalog, log = () => {}, env = {} } = {}) {
  const args = ['--levels', 'none', '--no-cache'];
  if (catalog) args.push('--catalog', catalog);
  const srv = startServer(args, { TIMBRE_MCP_LOG_LEVEL: 'warn', ...env });
  const steps = [];
  const step = async (name, fn) => {
    const t0 = Date.now();
    try {
      const detail = await fn();
      steps.push({ name, ok: true, ms: Date.now() - t0, detail: detail || '' });
      log(`  ok   ${name}${detail ? '  ' + detail : ''}`);
      return true;
    } catch (e) {
      steps.push({ name, ok: false, ms: Date.now() - t0, detail: e.message });
      log(`  FAIL ${name}  ${e.message}`);
      return false;
    }
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
  const tool = async (name, args2) => {
    const res = await srv.request('tools/call', { name, arguments: args2 });
    assert(!res.error, `protocol error ${JSON.stringify(res.error)}`);
    const blocks = res.result.content.map((b) => b.text);
    return { isError: res.result.isError, data: JSON.parse(blocks[0]), code: blocks.length > 1 ? blocks[1] : null, blocks };
  };
  const ctx = {};
  try {
    await step('initialize', async () => {
      const res = await srv.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'timbre-smoke', version: '0' } });
      assert(res.result && res.result.serverInfo.name === 'timbre-mcp-server', 'no serverInfo');
      assert(res.result.protocolVersion === '2025-06-18', 'protocol version not echoed');
      assert(res.result.capabilities.tools, 'no tools capability');
      assert(/Timbre/.test(res.result.instructions), 'no instructions');
      return `${res.result.serverInfo.name} ${res.result.serverInfo.version}, protocol ${res.result.protocolVersion}`;
    });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await step('ping', async () => { const r = await srv.request('ping'); assert(r.result && Object.keys(r.result).length === 0, 'ping should return {}'); });
    await step('tools/list', async () => {
      const res = await srv.request('tools/list');
      const tools = res.result.tools;
      assert(tools.length === TOOL_CALLS.length, `expected ${TOOL_CALLS.length} tools, got ${tools.length}`);
      for (const t of tools) assert(t.name && t.description && t.inputSchema && t.inputSchema.type === 'object', `${t.name} is malformed`);
      assert(TOOL_CALLS.every((c) => tools.some((t) => t.name === c.name)), 'a tool is missing');
      ctx.tools = tools;
      return tools.map((t) => t.name).join(', ');
    });
    // ids to use in later calls come from earlier replies
    await step('search finds ids for the calls that follow', async () => {
      const r = await tool('search_sounds', { limit: 1 });
      ctx.firstSound = r.data.items[0].id;
      const themes = await tool('list_themes', {});
      ctx.firstTheme = themes.data.themes[0] ? themes.data.themes[0].id : null;
      return `sound ${ctx.firstSound}, theme ${ctx.firstTheme}`;
    });
    for (const c of TOOL_CALLS) {
      if (c.name === 'get_theme' && !ctx.firstTheme) { steps.push({ name: 'tools/call get_theme', ok: true, ms: 0, detail: 'skipped: this catalog has no themes' }); continue; }
      await step(`tools/call ${c.name}`, async () => {
        const args2 = JSON.parse(JSON.stringify(c.args).replace('"$firstSound"', JSON.stringify(ctx.firstSound)).replace('"$firstTheme"', JSON.stringify(ctx.firstTheme)));
        const r = await tool(c.name, args2);
        assert(r.isError === false, `isError: ${r.blocks[0].slice(0, 200)}`);
        assert(c.check(r.data, r.code), 'the reply did not have the expected content');
        return c.show(r.data, r.code);
      });
    }
    await step('a failing call comes back as a tool error, not a crash', async () => {
      const r = await tool('get_sound', { id: 'no-such-sound' });
      assert(r.isError === true && r.data.code === 'not_found', 'expected a not_found tool error');
      const bad = await tool('search_sounds', { limit: 'lots' });
      assert(bad.isError === true && bad.data.code === 'invalid_arguments', 'expected invalid_arguments');
      return `${r.data.code}, ${bad.data.code}`;
    });
    await step('unknown tool and unknown method are protocol errors', async () => {
      const a = await srv.request('tools/call', { name: 'nope', arguments: {} });
      assert(a.error && a.error.code === -32602, 'unknown tool should be -32602');
      const b = await srv.request('does/not/exist');
      assert(b.error && b.error.code === -32601, 'unknown method should be -32601');
      return '-32602, -32601';
    });
    await step('a malformed line gets a parse error and the server keeps going', async () => {
      const waitErr = srv.nextNullId();
      srv.send('{ this is not json');
      const e = await waitErr;
      assert(e.error && e.error.code === -32700, 'expected -32700');
      const again = await srv.request('ping');
      assert(again.result, 'the server stopped answering');
      return '-32700, then ping ok';
    });
  } finally {
    srv.child.stdin.end();
  }
  const exit = await Promise.race([srv.exited, new Promise((r) => setTimeout(() => r({ code: 'timeout' }), 10000))]);
  if (exit.code === 'timeout') srv.child.kill();
  await step('closing stdin ends the server cleanly', async () => {
    assert(exit.code === 0, `exit code ${exit.code}`);
  });
  await step('stdout carried nothing but JSON-RPC messages', async () => {
    for (const line of srv.lines) {
      const m = JSON.parse(line);
      assert(m.jsonrpc === '2.0', 'a line without jsonrpc 2.0: ' + line.slice(0, 80));
    }
    return `${srv.lines.length} messages`;
  });
  return { ok: steps.every((s) => s.ok), steps, stdoutLines: srv.lines, stderr: srv.stderr.join('') };
}

async function main() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf('--catalog');
  const catalog = at >= 0 ? argv[at + 1] : undefined;
  const verbose = argv.includes('--verbose');
  console.log(`smoke: node ${path.relative(process.cwd(), CLI) || 'cli.js'} start${catalog ? ' --catalog ' + catalog : ''}`);
  const r = await runSmoke({ catalog, log: (l) => console.log(l) });
  if (r.stderr.trim()) console.log('stderr:\n' + r.stderr.trim().split('\n').map((l) => '  ' + l).join('\n'));
  if (verbose) for (const l of r.stdoutLines) console.log('  <- ' + l.slice(0, 160));
  const bad = r.steps.filter((s) => !s.ok).length;
  console.log(`\nsmoke: ${r.steps.length - bad}/${r.steps.length} steps ok`);
  process.exit(r.ok ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
