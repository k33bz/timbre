#!/usr/bin/env node
// Browser check: a kit that build_kit wrote, run in a real Web Audio engine.
//
//   node mcp-server/scripts/check_kit.mjs [id-filter]
//
// Builds one kit that covers every helper the catalog uses (a few sounds chosen so each helper
// appears at least once), launches ONE headless Edge/Chrome with muted audio (gates/lib/browser.mjs),
// and for each sound:
//   1. loads the kit as a classic script, points its lazily created AudioContext at an
//      OfflineAudioContext, plays the moment and renders it;
//   2. runs get_copy's function for the same sound on its own OfflineAudioContext and renders that;
//   3. requires the two renders to be the same signal (the kit shares helpers and the master chain,
//      but must not change what is heard: any difference is at the engine's own run-to-run noise,
//      measured by rendering the Copy twice, or under -86 dBFS) and the level inside the house range.
// Then checks the lazy behaviour on a real AudioContext: none at load, one on the first play(), one
// shared master chain, prime() and setMuted() working.
//
// On a shared machine run it through the browser queue, one browser at a time:
//   node <path>/guard_wait.mjs 1800 600 node mcp-server/scripts/check_kit.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, table } from '../../gates/lib/browser.mjs';
import { TimbreMCPServer } from '../index.js';

const only = process.argv[2] || '';

/** Call a tool in-process and return { data, code }. */
async function tool(server, name, args) {
  const res = await server.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
  if (res.error || res.result.isError) throw new Error(`${name}: ${res.error ? res.error.message : res.result.content[0].text}`);
  const blocks = res.result.content.map((b) => b.text);
  return { data: JSON.parse(blocks[0]), code: blocks[1] || null };
}

/** A small set of sounds that together use every helper in the catalog. */
function coveringSet(catalog) {
  const need = new Set();
  for (const s of catalog.sounds) for (const u of s.uses) need.add(u);
  const chosen = [];
  const left = new Set(need);
  while (left.size) {
    let best = null;
    for (const s of catalog.sounds) {
      const gain = s.uses.filter((u) => left.has(u)).length;
      if (gain && (!best || gain > best.gain || (gain === best.gain && s.dur < best.s.dur))) best = { s, gain };
    }
    if (!best) break;
    chosen.push(best.s);
    for (const u of best.s.uses) left.delete(u);
  }
  // plus a stochastic one and one with a reverb tail if the cover missed them
  for (const key of ['noise', 'reverb', 'delay']) {
    if (!chosen.some((s) => s.uses.includes(key))) {
      const s = catalog.sounds.find((x) => x.uses.includes(key));
      if (s) chosen.push(s);
    }
  }
  return chosen;
}

async function main() {
  const server = new TimbreMCPServer({ levels: false, logLevel: 'silent' });
  const catalog = server.catalog;
  if (catalog.error) throw new Error(catalog.error.message);
  const sounds = coveringSet(catalog).filter((s) => s.id.includes(only));
  if (!sounds.length) throw new Error('no sound matches "' + only + '"');
  const moments = sounds.map((s) => ({ moment: s.id.replace(/^[a-z]+-/, ''), sound: s.id }));
  const seen = new Set();
  for (const m of moments) { if (seen.has(m.moment)) m.moment = m.sound; seen.add(m.moment); }
  const kit = await tool(server, 'build_kit', { moments, format: 'script', global_name: 'timbreKit' });
  const copies = [];
  for (const m of moments) {
    const c = await tool(server, 'get_copy', { id: m.sound });
    copies.push({ moment: m.moment, id: m.sound, fname: c.data.functionName, code: c.code, dur: catalog.get(m.sound).dur });
  }
  console.log(`check_kit: ${sounds.length} sounds (${[...new Set(sounds.flatMap((s) => s.uses))].sort().join(', ')}), kit ${(kit.code.length / 1024).toFixed(1)} KB`);

  const b = await launch({ timeoutMs: 240000 });
  let failed = 0;
  try {
    await b.goto('about:blank');
    const rows = [];
    const expr = `(async () => {
      const SR = 48000, PRE = 0.2;
      const kitCode = ${JSON.stringify(kit.code)};
      const copies = ${JSON.stringify(copies)};
      const makeKit = new Function(kitCode + '\\n;return timbreKit;');
      const db = (v) => (v > 0 ? Math.round(200 * Math.log10(v)) / 10 : -120);
      const out = [];
      for (const c of copies) {
        const len = Math.ceil((PRE + c.dur + 0.3) * SR);
        // the kit: its AudioContext is replaced by an offline one, made lazily on the first play
        const made = [];
        const real = globalThis.AudioContext;
        globalThis.AudioContext = function () { const o = new OfflineAudioContext(2, len, SR); o.resume = () => Promise.resolve(); made.push(o); return o; };
        const kit = makeKit();
        const before = made.length;
        const end = kit.play(c.moment);
        const after = made.length;
        const kitBuf = await made[0].startRendering();
        globalThis.AudioContext = real;
        // the Copy function for the same sound, alone
        const copyFn = new Function(c.code + '\\n;return ' + c.fname + ';')();
        const oc = new OfflineAudioContext(2, len, SR);
        const end2 = copyFn(oc);
        const copyBuf = await oc.startRendering();
        // the engine's own run-to-run noise: the same Copy function rendered a second time
        const oc2 = new OfflineAudioContext(2, len, SR);
        copyFn(oc2);
        const copyBuf2 = await oc2.startRendering();
        let floor = 0;
        for (let ch = 0; ch < 2; ch++) {
          const a = copyBuf.getChannelData(ch), z = copyBuf2.getChannelData(ch);
          for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - z[i]); if (d > floor) floor = d; }
        }
        let maxDiff = 0, peak = 0, energy = 0;
        for (let ch = 0; ch < 2; ch++) {
          const a = kitBuf.getChannelData(ch), z = copyBuf.getChannelData(ch);
          for (let i = 0; i < a.length; i++) {
            const d = Math.abs(a[i] - z[i]); if (d > maxDiff) maxDiff = d;
            const m = Math.abs(a[i]); if (m > peak) peak = m; energy += a[i] * a[i];
          }
        }
        out.push({ id: c.id, moment: c.moment, end, end2, maxDiff, floor, peak: db(peak), rms: db(Math.sqrt(energy / (2 * len))), lazy: before === 0 && after === 1 });
      }
      return out;
    })()`;
    const results = await b.eval(expr);
    for (const r of results) {
      const problems = [];
      if (!r.lazy) problems.push('context not created lazily on first play');
      // the kit must be the same signal: any difference is at the engine's own run-to-run noise (a
      // floor measured by rendering the Copy twice) or below -86 dBFS, never a different chain or helper
      if (!(r.maxDiff <= Math.max(5e-5, 3 * r.floor))) problems.push(`kit differs from Copy by ${r.maxDiff} (engine noise ${r.floor})`);
      if (!(r.peak > -36 && r.peak <= -12)) problems.push(`peak ${r.peak} dBFS outside the house range`);
      if (Math.abs(r.end - r.end2) > 1e-9) problems.push(`end ${r.end} vs ${r.end2}`);
      if (problems.length) failed++;
      rows.push([r.id, r.moment, r.peak.toFixed(1), r.rms.toFixed(1), r.maxDiff.toExponential(1), r.floor.toExponential(1), problems.length ? 'FAIL ' + problems.join('; ') : 'ok']);
    }
    console.log(table(rows, ['sound', 'moment', 'peak', 'rms', 'max diff', 'engine noise', '']));

    // lazy behaviour on a real AudioContext
    const live = await b.eval(`(async () => {
      const makeKit = new Function(${JSON.stringify(kit.code)} + '\\n;return timbreKit;');
      const k = makeKit();
      const r = { moments: k.moments.length };
      r.noContextAtLoad = k.getContext() === null;
      r.primeOk = k.prime() === true;
      const ac = k.getContext();
      r.isAudioContext = ac instanceof AudioContext;
      r.chainsAfterPrime = ac.timbreChains.size;
      const t = k.play(k.moments[0]);
      r.playReturnsTime = typeof t === 'number' && t > 0;
      for (const m of k.moments) k.play(m, { when: ac.currentTime + 0.05 });
      r.chainsAfterAll = ac.timbreChains.size;
      k.setMuted(true);
      r.mutedNull = k.play(k.moments[0]) === null;
      r.unknownNull = k.play('no-such-moment') === null;
      await ac.close();
      return r;
    })()`);
    const liveProblems = [];
    if (!live.noContextAtLoad) liveProblems.push('a context exists before the first play or prime');
    if (!live.primeOk || !live.isAudioContext) liveProblems.push('prime() did not create a real AudioContext');
    if (live.chainsAfterPrime !== 1 || live.chainsAfterAll !== 1) liveProblems.push(`expected one master chain, saw ${live.chainsAfterPrime} then ${live.chainsAfterAll}`);
    if (!live.playReturnsTime) liveProblems.push('play() did not return an end time');
    if (!live.mutedNull || !live.unknownNull) liveProblems.push('muted or unknown moment did not return null');
    console.log(`\nreal AudioContext: ${liveProblems.length ? 'FAIL ' + liveProblems.join('; ') : 'ok (lazy, primed, one chain for ' + live.moments + ' moments, mute and unknown moment return null)'}`);
    if (liveProblems.length) failed++;
    if (b.errors.length) { console.error('page errors:\n  ' + b.errors.join('\n  ')); failed++; }
  } finally {
    await b.close();
  }
  console.log(`\ncheck_kit: ${failed ? failed + ' problem(s)' : 'the kit renders exactly what the Copy functions render'}`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.stack || e); process.exit(1); });
}
