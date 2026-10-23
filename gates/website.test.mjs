// The timbre.k33bz.com build: it runs, ships the gallery byte for byte, fills every placeholder
// with the library's own counts, and its bundled script parses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../build.mjs';

test('website build writes the landing page beside the gallery', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'timbre-site-'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'website/build.mjs'), out], { cwd: ROOT, stdio: 'pipe' });
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/manifest.json'), 'utf8'));
    assert.equal(fs.readFileSync(path.join(out, 'timbre.html'), 'utf8'), fs.readFileSync(path.join(ROOT, 'dist/timbre.html'), 'utf8'));
    assert.ok(fs.existsSync(path.join(out, 'favicon.svg')));
    assert.doesNotMatch(html, /@@[A-Z_]+@@|\/\*@(STYLE|SCRIPT)@\*\//, 'every placeholder is filled');
    assert.match(html, new RegExp('<b>' + manifest.count + '</b><span>sounds</span>'));
    assert.match(html, new RegExp('<b>' + manifest.themes.length + '</b><span>app sound kits</span>'));
    for (const c of manifest.categories) assert.ok(html.includes('href="timbre.html#' + c + '"'), 'category link ' + c);
    const script = html.match(/<script>(\(function \(\) \{[\s\S]*\}\)\(\);)<\/script>/);
    assert.ok(script, 'the bundled script is inline');
    assert.doesNotThrow(() => new vm.Script(script[1]), 'the bundled script parses');
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
