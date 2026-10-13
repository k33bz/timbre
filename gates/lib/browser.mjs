// One headless Edge (or Chrome) driven over the DevTools protocol, for the browser gates.
// Zero dependencies: Node 22's fetch and WebSocket.
//
// Hygiene, because headless browsers left running have hung this machine before:
//   * one browser per gate, launched with a private temp profile and muted audio
//   * a watchdog: if the gate has not closed the browser within timeoutMs, the whole process tree
//     is killed (taskkill /T /F on Windows) and the gate exits 124
//   * close() asks the browser to quit (Browser.close), then kills the tree anyway as a backstop,
//     then removes the temp profile
// Run gates one at a time. On a shared machine, wrap each in your browser queue (see run_all.sh).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT = path.join(ROOT, 'gates', 'out');
export const distUrl = () => pathToFileURL(path.join(ROOT, 'dist', 'timbre.html')).href;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The browser binary: $TIMBRE_BROWSER, else the first Edge or Chrome found. */
export function browserPath() {
  if (process.env.TIMBRE_BROWSER) return process.env.TIMBRE_BROWSER;
  const win = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  const mac = [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  const lin = ['/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const list = process.platform === 'win32' ? win : process.platform === 'darwin' ? mac : lin;
  const found = list.find((p) => fs.existsSync(p));
  if (!found) throw new Error('No Edge or Chrome found; set TIMBRE_BROWSER to a Chromium-family browser');
  return found;
}

function killTree(proc) {
  if (!proc || proc.exitCode != null) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /T /F /PID ${proc.pid}`, { stdio: 'ignore', timeout: 30000 });
    else proc.kill('SIGKILL');
  } catch { /* already gone */ }
}

/**
 * Launch the browser and attach to its first page. Resolves to a page handle:
 *   eval(expr)        evaluate in the page (awaits promises, returns by value; throws on exceptions)
 *   goto(url)         navigate and wait for the load event
 *   click(selector)   scroll the element into view and click its center with real mouse events
 *   key(key)          press a key (a trusted keyboard event) on the focused element
 *   type(text)        insert text into the focused element
 *   viewport(w, h, mobile)  emulate a device size; colorScheme('dark' | 'light')
 *   screenshot(file, full)  save a PNG
 *   errors            console errors and uncaught exceptions seen so far
 *   send(method, params), on(method, fn), close()
 */
export async function launch({ width = 1280, height = 900, timeoutMs = 300000 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'timbre-cdp-'));
  const proc = spawn(browserPath(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--disable-component-update', '--disable-default-apps',
    '--mute-audio', '--remote-debugging-port=0', '--user-data-dir=' + dir, `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore' });
  const watchdog = setTimeout(() => {
    console.error(`browser: watchdog fired after ${Math.round(timeoutMs / 1000)} s; killing the browser tree`);
    killTree(proc);
    process.exit(124);
  }, timeoutMs);
  let ws = null;
  const cleanup = async () => {
    clearTimeout(watchdog);
    try { ws && ws.close(); } catch {}
    killTree(proc);
    for (let i = 0; i < 10; i++) {
      try { fs.rmSync(dir, { recursive: true, force: true }); break; } catch { await sleep(300); }
    }
  };
  try {
    let port = 0;
    for (let i = 0; i < 100 && !port; i++) {
      try { port = Number(fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch {}
      if (!port) await sleep(100);
    }
    if (!port) throw new Error('browser did not open a DevTools port');
    let target = null;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === 'page'); } catch {}
      if (!target) await sleep(100);
    }
    if (!target) throw new Error('no page target');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('websocket failed')); });
    let id = 0;
    const pending = new Map();
    const listeners = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) rej(new Error(m.error.message + (m.error.data ? ': ' + m.error.data : '')));
        else res(m.result);
      } else if (m.method && listeners.has(m.method)) {
        for (const fn of listeners.get(m.method)) fn(m.params);
      }
    };
    const send = (method, params = {}) => new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); };
    const errors = [];
    on('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails || {};
      errors.push('exception: ' + ((d.exception && d.exception.description) || d.text || 'unknown'));
    });
    on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error' || p.type === 'assert') errors.push('console.' + p.type + ': ' + p.args.map((a) => a.value ?? a.description ?? '').join(' '));
    });
    on('Log.entryAdded', (p) => { if (p.entry.level === 'error') errors.push('log: ' + p.entry.text + (p.entry.url ? ' (' + p.entry.url + ')' : '')); });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: false });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
      }
      return r.result.value;
    };
    const page = {
      send, on, errors, eval: evaluate, port,
      async goto(url) {
        const loaded = new Promise((r) => on('Page.loadEventFired', r));
        await send('Page.navigate', { url });
        await Promise.race([loaded, sleep(15000)]);
      },
      async click(selector) {
        const box = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        if (!box) throw new Error('click: no element ' + selector);
        await sleep(60);
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
          await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
        }
      },
      async key(key) {
        const codes = { ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, Enter: 13, Escape: 27, Tab: 9, ' ': 32 };
        const base = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: codes[key] || 0 };
        await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
        if (key === ' ' || key === 'Enter') await send('Input.dispatchKeyEvent', { type: 'char', text: key === 'Enter' ? '\r' : ' ', ...base });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
      },
      async type(text) { await send('Input.insertText', { text }); },
      async viewport(w, h, mobile = false) {
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
      },
      async colorScheme(value) {
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value }] });
      },
      async screenshot(file, full = false) {
        const params = { format: 'png' };
        if (full) {
          const m = await send('Page.getLayoutMetrics');
          const sz = m.cssContentSize || m.contentSize;
          params.captureBeyondViewport = true;
          params.clip = { x: 0, y: 0, width: Math.ceil(sz.width), height: Math.ceil(Math.min(sz.height, 6000)), scale: 1 };
        }
        const r = await send('Page.captureScreenshot', params);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
        return file;
      },
      async close() {
        try {
          const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
          await new Promise((res) => {
            const b = new WebSocket(v.webSocketDebuggerUrl);
            const done = () => { clearTimeout(tm); try { b.close(); } catch {} res(); };
            const tm = setTimeout(done, 3000);
            b.onopen = () => b.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
            b.onmessage = done;
            b.onerror = done;
          });
        } catch { /* already gone */ }
        for (let i = 0; i < 30 && proc.exitCode == null; i++) await sleep(100);
        await cleanup();
      },
    };
    return page;
  } catch (e) {
    await cleanup();
    throw e;
  }
}

/** Pad and join cells into a fixed-width text table. */
export function table(rows, head) {
  const all = [head, ...rows].map((r) => r.map((c) => String(c)));
  const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  const line = (r) => r.map((c, i) => (i === 0 ? c.padEnd(w[i]) : c.padStart(w[i]))).join('  ');
  return [line(all[0]), w.map((n) => '-'.repeat(n)).join('  '), ...all.slice(1).map(line)].join('\n');
}
