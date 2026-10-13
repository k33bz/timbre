// Shared test helpers: where the repository is, temporary catalogs, a quiet server, and a tool caller
// that reads results the way a client does.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TimbreMCPServer } from '../index.js';
import { createLogger } from '../lib/logger.js';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PKG = path.resolve(HERE, '..');
export const REPO = path.resolve(PKG, '..');
export const REAL_CATALOG = path.join(REPO, 'catalog');
/** True inside a Timbre checkout with a built catalog (tests that need the real sources skip otherwise). */
export const HAVE_REPO = fs.existsSync(path.join(REPO, 'build.mjs')) && fs.existsSync(path.join(REAL_CATALOG, 'manifest.json'));
export const silent = createLogger('silent');

const made = [];
process.on('exit', () => { for (const d of made) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* best effort */ } } });

/** A fresh temporary directory, removed when the test process exits. */
export function tmpDir(prefix = 'timbre-mcp-') {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  made.push(d);
  return d;
}

/** Write a catalog directory from a manifest object (and optionally an index object). */
export function writeCatalog(dir, manifest, index) {
  fs.mkdirSync(dir, { recursive: true });
  if (manifest) fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (index) fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2));
  return dir;
}

/** A server over a catalog directory, quiet, with level reports ignored unless asked for. */
export function makeServer(catalog, opts = {}) {
  return new TimbreMCPServer({ catalog, levels: false, logger: silent, ...opts });
}

/** Call a tool through the JSON-RPC layer. Returns { isError, data, code, blocks, raw }. */
export async function call(srv, name, args = {}) {
  const res = await srv.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
  if (res.error) return { rpcError: res.error };
  const blocks = res.result.content.map((b) => b.text);
  let data = null;
  try { data = JSON.parse(blocks[0]); } catch (e) { data = null; }
  return { isError: res.result.isError, data, code: blocks.length > 1 ? blocks[1] : null, blocks, raw: res.result };
}

/** The characters the house style bans, built from code points so this file never contains one. */
export const DASHES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');

/** Count non-overlapping matches of a regular expression. */
export const count = (text, re) => (text.match(re) || []).length;
