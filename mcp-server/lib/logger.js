// Minimal logger. It writes to stderr only, so it never corrupts the JSON-RPC stream on stdout.
// TIMBRE_MCP_LOG_LEVEL: debug | info | warn | error | silent (default warn: a quiet stdio server).

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

export function createLogger(level = process.env.TIMBRE_MCP_LOG_LEVEL || 'warn') {
  const threshold = LEVELS[level] ?? LEVELS.warn;
  const write = (lvl, msg) => {
    if (LEVELS[lvl] < threshold) return;
    process.stderr.write(`[timbre-mcp ${lvl}] ${msg}\n`);
  };
  return {
    level,
    debug: (m) => write('debug', m),
    info: (m) => write('info', m),
    warn: (m) => write('warn', m),
    error: (m) => write('error', m),
  };
}
