#!/usr/bin/env node
// timbre-mcp CLI.
//
//   timbre-mcp start [--catalog <dir>] [--levels <file>] [--log-level <level>]
//   timbre-mcp info  [--catalog <dir>]            print the catalog overview and exit
//   timbre-mcp tools                              list the tools and exit
//   timbre-mcp call <tool> ['<json arguments>']   run one tool and print its result (for a quick look)
//
// `start` runs the MCP server over stdio, which is how Claude Code and Claude Desktop launch it.
// The catalog directory defaults to ../catalog (the one `node build.mjs` writes); TIMBRE_CATALOG and
// TIMBRE_LEVELS do the same as the flags.
import { TimbreMCPServer, StdioTransport, SERVER_NAME, SERVER_VERSION } from './index.js';
import { createLogger } from './lib/logger.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h') args.help = true;
    else if (a === '-v') args.version = true;
    else if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) { args[a.slice(2, eq)] = a.slice(eq + 1); continue; }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; } else args[key] = true;
    } else args._.push(a);
  }
  return args;
}

const HELP = `timbre-mcp: MCP server over the Timbre sound catalog

Usage:
  timbre-mcp start [options]      Run the MCP server over stdio (default)
  timbre-mcp info  [options]      Print the catalog overview, then exit
  timbre-mcp tools                List the tools, then exit
  timbre-mcp call <tool> [json]   Run one tool with JSON arguments and print the result
  timbre-mcp help                 Show this help

Options:
  --catalog <dir>     Catalog directory holding manifest.json (default: ../catalog;
                      env TIMBRE_CATALOG). A path to manifest.json also works.
  --levels <file>     Level report from the level gate (default: levels.json beside the
                      catalog, then ../gates/out/levels.json; env TIMBRE_LEVELS).
                      "none" ignores any report and estimates every level.
  --no-cache          Do not keep estimated levels between runs (they are kept in
                      env TIMBRE_MCP_CACHE or the platform's cache directory)
  --log-level <lvl>   debug | info | warn | error | silent (default: warn; env TIMBRE_MCP_LOG_LEVEL)
  --version           Print the server version

Examples:
  node cli.js start
  node cli.js call search_sounds '{"query":"coin"}'
  node cli.js call build_kit '{"theme":"soft-ui"}'
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'start';
  if (args.version) { process.stdout.write(`${SERVER_NAME} ${SERVER_VERSION}\n`); return; }
  if (args.help || cmd === 'help') { process.stdout.write(HELP); return; }
  const logger = createLogger(typeof args['log-level'] === 'string' ? args['log-level'] : undefined);
  const opts = { catalog: typeof args.catalog === 'string' ? args.catalog : undefined, levels: args.levels === 'none' ? false : typeof args.levels === 'string' ? args.levels : undefined, logger };

  if (cmd === 'tools') {
    const server = new TimbreMCPServer(opts);
    for (const t of server.tools) process.stdout.write(`${t.name}\n  ${t.description}\n\n`);
    return;
  }

  if (cmd === 'info' || cmd === 'call') {
    const server = new TimbreMCPServer(opts);
    const name = cmd === 'info' ? 'info' : args._[1];
    if (!name) { process.stderr.write('call: name a tool (see `tools`)\n'); process.exit(2); }
    let toolArgs = {};
    if (cmd === 'call' && args._[2]) {
      try { toolArgs = JSON.parse(args._[2]); } catch (e) { process.stderr.write(`call: the arguments must be JSON: ${e.message}\n`); process.exit(2); }
    }
    const res = await server.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: toolArgs } });
    if (res.error) { process.stderr.write(`${res.error.message}\n`); process.exit(1); }
    for (const block of res.result.content) process.stdout.write(block.text + '\n');
    if (res.result.isError) process.exit(1);
    return;
  }

  if (cmd === 'start') {
    const server = new TimbreMCPServer({ ...opts, warm: true, cache: args['no-cache'] !== true });
    if (server.catalog.error) logger.warn(`starting without a catalog: ${server.catalog.error.message}`);
    server.connect(new StdioTransport());
    const shutdown = () => { server.close(); process.exit(0); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return;
  }

  process.stderr.write(`Unknown command "${cmd}"\n\n${HELP}`);
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`[timbre-mcp fatal] ${err.stack || err.message}\n`);
  process.exit(1);
});
