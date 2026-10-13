// TimbreMCPServer: a zero-dependency Model Context Protocol server over the Timbre sound catalog.
// It speaks MCP's JSON-RPC 2.0 (initialize, ping, tools/list, tools/call) over a stdio transport
// of newline-delimited messages, the transport Claude Code and Claude Desktop launch.
//
// Design notes, in the house style of the Prism server:
//   * no SDK: the protocol surface is small, and a stdio server with no dependencies installs and
//     runs offline, like the gallery itself;
//   * the transport is pluggable; tests call handleMessage() directly and also drive a real child
//     process over stdio (test/smoke.test.js, scripts/smoke.js);
//   * the catalog is re-read when its files change, so a rebuilt catalog shows up without a restart.
import { Catalog } from './lib/catalog.js';
import { ToolError, RpcError } from './lib/errors.js';
import { createLogger } from './lib/logger.js';
import { validateArgs } from './lib/schema.js';
import { SERVER_NAME, SERVER_VERSION, PROTOCOL_VERSIONS } from './lib/meta.js';
import { buildTools } from './tools/index.js';

export { SERVER_NAME, SERVER_VERSION, PROTOCOL_VERSIONS, ToolError, RpcError };

const TITLES = {
  info: 'Timbre overview',
  search_sounds: 'Search sounds',
  get_sound: 'Sound details',
  get_copy: 'Copy code for one sound',
  list_themes: 'List themes',
  get_theme: 'Theme details',
  build_kit: 'Build a sound kit',
  suggest_sounds: 'Suggest sounds',
};
// Every tool only reads the catalog and computes: nothing is written, nothing leaves the machine.
const ANNOTATIONS = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

/**
 * JSON for the agent: valid JSON, but small objects and arrays stay on one line, so a list of
 * categories or tags costs a line, not a screen.
 */
function fmt(v, level) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const one = JSON.stringify(v);
  if (one === undefined || one.length <= 96) return one;
  const pad = ' '.repeat(level);
  if (Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object')) {
    // a long list of words or numbers: wrap it at about 100 columns instead of one item per line
    const rows = [];
    let line = '';
    for (const x of v) {
      const piece = JSON.stringify(x);
      if (line && (pad + ' ' + line + ',' + piece).length > 100) { rows.push(line + ','); line = piece; } else line = line ? line + ',' + piece : piece;
    }
    if (line) rows.push(line);
    return '[\n' + rows.map((r) => pad + ' ' + r).join('\n') + '\n' + pad + ']';
  }
  if (Array.isArray(v)) return '[\n' + v.map((x) => pad + ' ' + fmt(x, level + 1)).join(',\n') + '\n' + pad + ']';
  const rows = Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => pad + ' ' + JSON.stringify(k) + ': ' + fmt(x, level + 1));
  return '{\n' + rows.join(',\n') + '\n' + pad + '}';
}

const json = (v) => {
  try { return fmt(v, 0); } catch (e) { return JSON.stringify({ error: 'unserializable result', detail: String(e) }); }
};

export class TimbreMCPServer {
  /**
   * @param {object} opts { catalog (dir or manifest path), levels (path, or false), cache (true or a directory), logger, logLevel, warm }
   */
  constructor(opts = {}) {
    this.logger = opts.logger || createLogger(opts.logLevel);
    this.catalog = opts.catalogInstance || new Catalog(opts.catalog, { levelsPath: opts.levels, cache: opts.cache, logger: this.logger });
    this.catalog.load();
    this.tools = buildTools();
    this.toolMap = new Map(this.tools.map((t) => [t.name, t]));
    this.initialized = false;
    this.requestCount = 0;
    this.pending = new Set();
    this.warmOn = !!opts.warm;
    if (this.warmOn) this.warm();
  }

  /** Re-read the catalog if its files changed; start the background level pass again when they did. */
  refreshCatalog() {
    const changed = this.catalog.refresh();
    if (changed && this.warmOn) this.warm();
    return changed;
  }

  /** Make the estimated levels in the background, one sound per turn of the event loop. */
  warm() {
    const gen = this.catalog.generation;
    const list = this.catalog.sounds.slice();
    const step = () => {
      if (this.catalog.generation !== gen || !list.length) return;
      try { this.catalog.levelOf(list.shift()); } catch (e) { /* a sound that cannot be estimated stays unknown */ }
      if (!list.length) this.catalog.levels.flush();
      setImmediate(step).unref();
    };
    setImmediate(step).unref();
  }

  // ---- JSON-RPC dispatch ----
  async handleMessage(msg) {
    if (Array.isArray(msg)) {
      if (!msg.length) return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
      const out = [];
      for (const m of msg) { const r = await this.handleMessage(m); if (r) out.push(r); }
      return out.length ? out : null;
    }
    if (!msg || typeof msg !== 'object' || typeof msg.method !== 'string') {
      // a response or garbage: a request without a method is invalid, a bare response is ignored
      if (msg && typeof msg === 'object' && (msg.result !== undefined || msg.error !== undefined)) return null;
      return { jsonrpc: '2.0', id: msg && msg.id !== undefined ? msg.id : null, error: { code: -32600, message: 'Invalid Request' } };
    }
    const isNotification = msg.id === undefined || msg.id === null;
    try {
      const result = await this.dispatch(msg);
      if (isNotification) return null;
      return { jsonrpc: '2.0', id: msg.id, result };
    } catch (err) {
      if (isNotification) {
        this.logger.warn(`notification ${msg.method} failed: ${err.message}`);
        return null;
      }
      return this.errorResponse(msg.id, err);
    }
  }

  async dispatch(msg) {
    const { method, params } = msg;
    switch (method) {
      case 'initialize': return this.onInitialize(params);
      case 'notifications/initialized':
      case 'initialized':
        this.initialized = true;
        return {};
      case 'ping': return {};
      case 'tools/list': return this.onToolsList();
      case 'tools/call': return this.onToolsCall(params);
      default:
        if (method.startsWith('notifications/')) return {};
        throw new RpcError(-32601, `Method not found: ${method}`);
    }
  }

  onInitialize(params) {
    this.initialized = true;
    const asked = params && params.protocolVersion;
    const version = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
    this.logger.info(`initialize (client protocol ${asked || 'unspecified'}, answering ${version})`);
    return {
      protocolVersion: version,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      instructions: this.instructions(),
    };
  }

  /** What a fresh agent needs to use this server. Counts come from the loaded catalog. */
  instructions() {
    this.refreshCatalog();
    const c = this.catalog;
    const cats = Object.entries(c.categoryCounts()).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`).join(', ');
    return [
      c.error
        ? `Timbre sound catalog NOT loaded: ${c.error.message}`
        : `Timbre: ${c.sounds.length} synthesized WebAudio sound effects (${cats || 'none yet'}) and ${c.themes.length} sound theme(s). No samples, no files: every sound is a small code recipe.`,
      'FIND: suggest_sounds turns a description of an app or a moment ("meditation timer, gentle taps") into ranked candidates with reasons; search_sounds is keyword search with filters (category, max_duration, loudness).',
      'READ: get_sound shows one sound\'s parameters (ranges, defaults), levels and Copy code. list_themes and get_theme show moment-to-sound maps (click, success, error, ...).',
      'USE: get_copy returns one self-contained function with chosen parameter values baked in, fn(ac, opts, when, dest). build_kit returns ONE module with play(moment) for several moments, sharing the helpers and one master chain.',
      'Sounds cannot be heard through this server. Levels are measured by the repository\'s level gate when its report is present, otherwise estimated offline and marked so. Open dist/timbre.html in a browser to audition.',
    ].join('\n');
  }

  onToolsList() {
    return {
      tools: this.tools.map((t) => ({
        name: t.name,
        title: TITLES[t.name] || t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: ANNOTATIONS,
      })),
    };
  }

  async onToolsCall(params) {
    if (!params || typeof params.name !== 'string') throw new RpcError(-32602, 'tools/call requires a "name"');
    const tool = this.toolMap.get(params.name);
    if (!tool) throw new RpcError(-32602, `Unknown tool: ${params.name}`, { availableTools: this.tools.map((t) => t.name) });
    const started = Date.now();
    this.requestCount++;
    try {
      this.refreshCatalog();
      const args = validateArgs(tool.name, tool.inputSchema, params.arguments);
      const out = await tool.handler(args, { catalog: this.catalog, logger: this.logger, server: this });
      this.logger.debug(`tool ${tool.name} ok (${Date.now() - started} ms)`);
      return { content: renderContent(tool, out), isError: false };
    } catch (err) {
      if (err instanceof ToolError) {
        this.logger.debug(`tool ${tool.name} refused (${err.code}): ${err.message}`);
        return { content: [{ type: 'text', text: json({ error: err.message, code: err.code, ...(err.data ? { data: err.data } : {}) }) }], isError: true };
      }
      this.logger.error(`tool ${tool.name} threw: ${err.stack || err.message}`);
      return { content: [{ type: 'text', text: json({ error: err.message, code: 'internal_error' }) }], isError: true };
    }
  }

  errorResponse(id, err) {
    if (err instanceof RpcError) return { jsonrpc: '2.0', id, error: { code: err.code, message: err.message, ...(err.data ? { data: err.data } : {}) } };
    this.logger.error(`internal error: ${err.stack || err.message}`);
    return { jsonrpc: '2.0', id, error: { code: -32603, message: 'Internal error', data: { detail: err.message } } };
  }

  /** Attach a transport (onMessage(cb), send(obj), optional start/stop). */
  connect(transport) {
    this.transport = transport;
    transport.onMessage((msg) => {
      const p = this.handleMessage(msg)
        .then((res) => { if (res) transport.send(res); })
        .catch((e) => this.logger.error(`could not answer: ${e && e.message}`))
        .finally(() => this.pending.delete(p));
      this.pending.add(p);
      return p;
    });
    if (transport.onClose) transport.onClose(() => Promise.allSettled([...this.pending]).then(() => this.close()));
    if (transport.start) transport.start();
    this.logger.info(`${SERVER_NAME} ${SERVER_VERSION} connected (${this.tools.length} tools, ${this.catalog.sounds.length} sounds)`);
    return this;
  }

  close() {
    if (this.transport && this.transport.stop) this.transport.stop();
  }
}

/** Tool output as MCP content: JSON metadata, plus the code (if the tool has any) as its own block. */
export function renderContent(tool, out) {
  if (tool.codeKey && out && typeof out[tool.codeKey] === 'string') {
    const { [tool.codeKey]: code, ...meta } = out;
    return [
      { type: 'text', text: json({ ...meta, [tool.codeKey]: 'in the next content block' }) },
      { type: 'text', text: code },
    ];
  }
  return [{ type: 'text', text: json(out) }];
}

/**
 * Stdio transport: newline-delimited JSON-RPC on stdin/stdout. Diagnostics go to stderr only, so
 * stdout carries nothing but protocol messages.
 */
export class StdioTransport {
  // A client that streams bytes without a newline would grow the buffer without bound (CWE-400).
  static MAX_BUFFER_SIZE = 16 * 1024 * 1024;

  constructor({ input = process.stdin, output = process.stdout, maxBufferSize } = {}) {
    this.input = input;
    this.output = output;
    this.buffer = '';
    this.cb = null;
    this.closeCb = null;
    this.maxBufferSize = maxBufferSize || StdioTransport.MAX_BUFFER_SIZE;
  }

  onMessage(cb) { this.cb = cb; }
  onClose(cb) { this.closeCb = cb; }

  start() {
    // a client that goes away mid-reply must not take the process down with an EPIPE
    if (this.output.on) this.output.on('error', () => {});
    this.input.setEncoding('utf8');
    this.input.on('data', (chunk) => {
      this.buffer += chunk;
      if (this.buffer.length > this.maxBufferSize && this.buffer.indexOf('\n') === -1) {
        this.send({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request', data: { detail: `Message exceeds ${this.maxBufferSize} bytes` } } });
        this.buffer = '';
        return;
      }
      let idx;
      while ((idx = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch (e) {
          this.send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error', data: { detail: e.message } } });
          continue;
        }
        if (this.cb) this.cb(msg);
      }
    });
    this.input.on('end', () => {
      const rest = this.buffer.trim();
      this.buffer = '';
      if (rest) {
        try { if (this.cb) this.cb(JSON.parse(rest)); } catch (e) { /* a partial last line: drop it */ }
      }
      if (this.closeCb) this.closeCb();
    });
  }

  send(obj) { this.output.write(JSON.stringify(obj) + '\n'); }
  stop() { /* stdin closes with the process */ }
}
